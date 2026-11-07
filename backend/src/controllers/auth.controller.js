import { string, password as validatePassword, phone as validatePhone, email as validateEmail, validClaims } from '../lib/validation.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query, withTransaction } from '../config/db.js'
import { env } from '../config/env.js'

/**
 * Login with username/password, returns JWT token
 * POST /api/auth/dang-nhap
 */
export async function dangNhap(req, res, next) {
    try {
        const { tenDangNhap, matKhau } = req.body

        if (typeof tenDangNhap !== 'string' || !tenDangNhap.trim() || tenDangNhap.length > 100 || typeof matKhau !== 'string' || !matKhau || Buffer.byteLength(matKhau,'utf8') > 72) {
            console.warn(`[auth] Đăng nhập thất bại: Thiếu tên đăng nhập hoặc mật khẩu`)
            return res.status(400).json({
                error: 'Thiếu tên đăng nhập hoặc mật khẩu',
            })
        }

        // Get user with password hash (match username or email)
        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap, nd.mat_khau_hash,
                    nd.email, nd.vai_tro, nd.trang_thai,
                    COALESCE((to_jsonb(nd)->>'token_version')::int,0) AS token_version,
                    COALESCE((to_jsonb(nd)->>'bat_doi_mat_khau')::boolean,false) AS bat_doi_mat_khau,
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu, nv.trang_thai AS nhan_vien_active,
                    kh.ho_ten as khach_hang_ho_ten
             FROM nguoi_dung nd
             LEFT JOIN nhan_vien nv ON nd.ma_nguoi_dung = nv.ma_nhan_vien
             LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
             WHERE nd.ten_dang_nhap = $1 OR (nd.email = $1 AND nd.email IS NOT NULL AND nd.email != '')`,
            [tenDangNhap.trim()]
        )

        if (result.rows.length === 0) {
            console.warn(`[auth] Đăng nhập thất bại: Không tìm thấy tài khoản "${tenDangNhap}"`)
            return res.status(401).json({
                error: 'Tài khoản hoặc mật khẩu không đúng',
            })
        }

        const user = result.rows[0]

        // Verify password
        const passwordMatch = await bcrypt.compare(matKhau, user.mat_khau_hash)
        if (!passwordMatch) {
            console.warn(`[auth] Đăng nhập thất bại: Sai mật khẩu cho tài khoản "${user.ten_dang_nhap}"`)
            return res.status(401).json({
                error: 'Tài khoản hoặc mật khẩu không đúng',
            })
        }

        if (!user.trang_thai || (user.vai_tro === 'NhanVien' && user.nhan_vien_active !== true)) return res.status(403).json({ error: 'Tài khoản đã ngừng hoạt động.' })

        console.log(`[auth] Đăng nhập thành công: ${user.ten_dang_nhap} (Vai trò: ${user.vai_tro})`)

        // Generate JWT
        const accessToken = jwt.sign(
            { userId: user.ma_nguoi_dung, type: 'access', version: user.token_version },
            env.jwt.secret,
            { expiresIn: env.jwt.expiresIn }
        )

        const refreshToken = jwt.sign(
            { userId: user.ma_nguoi_dung, type: 'refresh', version: user.token_version },
            env.jwt.refreshSecret,
            { expiresIn: env.jwt.refreshExpiresIn }
        )

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.isProd,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        // Return access token and user info
        res.json({
            accessToken,
            user: {
                maNguoiDung: user.ma_nguoi_dung,
                tenDangNhap: user.ten_dang_nhap,
                email: user.email,
                vaiTro: user.vai_tro,
                hoTen: user.vai_tro==='NhanVien'?user.nhan_vien_ho_ten:user.vai_tro==='KhachHang'?user.khach_hang_ho_ten:user.ten_dang_nhap,
                chucVu: user.chuc_vu,
                batDoiMatKhau: user.bat_doi_mat_khau,
            },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * Logout - clear refresh token cookie
 * POST /api/auth/dang-xuat
 */
export async function dangXuat(req, res, next) {
    try {
        if (req.cookies?.refreshToken) {
            let decoded
            try { decoded = jwt.verify(req.cookies.refreshToken, env.jwt.refreshSecret) } catch { /* Clear expired cookie too. */ }
            if (validClaims(decoded, 'refresh')) await query('UPDATE nguoi_dung SET token_version=token_version+1 WHERE ma_nguoi_dung=$1 AND token_version=$2', [decoded.userId, decoded.version])
        }
    } catch (err) { return next(err) }
    res.clearCookie('refreshToken')
    res.json({ message: 'Đăng xuất thành công' })
}

/**
 * Refresh access token using refresh token
 * POST /api/auth/lam-moi-token
 */
export async function lamMoiToken(req, res, next) {
    try {
        const refreshToken = req.cookies?.refreshToken

        if (!refreshToken) {
            return res.status(401).json({ error: 'Không tìm thấy refresh token' })
        }

        const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret)
        if (!validClaims(decoded, 'refresh')) return res.status(401).json({ error: 'Refresh token không hợp lệ.' })

        // Verify user still exists and is active
        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.trang_thai, COALESCE((to_jsonb(nd)->>'token_version')::int,0) AS token_version, nv.trang_thai AS staff_active, nd.vai_tro FROM nguoi_dung nd LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien=nd.ma_nguoi_dung WHERE nd.ma_nguoi_dung=$1`,
            [decoded.userId]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Người dùng không tồn tại' })
        }

        if (result.rows[0].token_version !== decoded.version) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hiệu lực.' })
        if (!result.rows[0].trang_thai || (result.rows[0].vai_tro === 'NhanVien' && result.rows[0].staff_active !== true)) {
            return res.status(403).json({ error: 'Tài khoản đã bị khóa' })
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId, type: 'access', version: decoded.version },
            env.jwt.secret,
            { expiresIn: env.jwt.expiresIn }
        )

        res.json({ accessToken })
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' })
        }
        next(err)
    }
}

/**
 * Register new customer account
 * POST /api/auth/dang-ky
 */
export async function dangKy(req, res, next) {
    try {
        const username = string(req.body?.username, 'Tên đăng nhập', 30)
        if (!/^[A-Za-z0-9._]{4,30}$/.test(username)) return res.status(400).json({ error: 'Tên đăng nhập từ 4–30 ký tự: chữ, số, chấm, gạch dưới.' })
        const fullName = string(req.body.fullName, 'Họ tên', 100)
        const phone = validatePhone(req.body.phone)
        const email = validateEmail(req.body.email)
        const hash = await bcrypt.hash(validatePassword(req.body.password), env.bcryptRounds)
        const newId = await withTransaction(async client => {
            await client.query('SELECT pg_advisory_xact_lock(171719,hashtext(lower($1)))',[username])
            const dup = await client.query('SELECT 1 FROM nguoi_dung WHERE LOWER(ten_dang_nhap)=LOWER($1) OR email=$2 OR so_dien_thoai=$3', [username,email,phone])
            if (dup.rowCount) throw Object.assign(new Error('Tên đăng nhập, email hoặc số điện thoại đã được đăng ký.'),{status:409})
            const result = await client.query("INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,email,so_dien_thoai,vai_tro) VALUES($1,$2,$3,$4,'KhachHang') RETURNING ma_nguoi_dung",[username,hash,email,phone])
            const id=result.rows[0].ma_nguoi_dung
            await client.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES($1,$2)',[id,fullName])
            return id
        })
        res.status(201).json({message:'Đăng ký thành công',userId:newId})
    } catch(err) { next(err) }
}

/**
 * Lấy thông tin cá nhân của người dùng đang đăng nhập
 * GET /api/auth/toi
 */
export async function layThongTinToi(req, res, next) {
    try {
        const userId = req.user.userId

        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap, nd.email, nd.so_dien_thoai,
                    nd.vai_tro, nd.trang_thai, nd.ngay_tao,
                    COALESCE((to_jsonb(nd)->>'bat_doi_mat_khau')::boolean,false) AS bat_doi_mat_khau,
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu, nv.trang_thai AS nhan_vien_active,
                    kh.ho_ten as khach_hang_ho_ten
             FROM nguoi_dung nd
             LEFT JOIN nhan_vien nv ON nd.ma_nguoi_dung = nv.ma_nhan_vien
             LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
             WHERE nd.ma_nguoi_dung = $1`,
            [userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' })
        }

        const u = result.rows[0]
        // Không bao giờ trả password hash
        res.json({
            maNguoiDung: u.ma_nguoi_dung,
            tenDangNhap: u.ten_dang_nhap,
            email: u.email || '',
            soDienThoai: u.so_dien_thoai || '',
            vaiTro: u.vai_tro,
            hoTen: u.vai_tro==='NhanVien'?u.nhan_vien_ho_ten:u.vai_tro==='KhachHang'?u.khach_hang_ho_ten:u.ten_dang_nhap,
            chucVu: u.chuc_vu || '',
            trangThai: u.trang_thai,
            batDoiMatKhau: u.bat_doi_mat_khau,
            ngayTao: u.ngay_tao,
        })
    } catch (err) {
        next(err)
    }
}

/**
 * Cập nhật thông tin cá nhân (chỉ các trường được phép)
 * PUT /api/auth/cap-nhat
 * Không cho phép sửa: vai_tro, trang_thai, ten_dang_nhap, mat_khau_hash
 */
export async function capNhatThongTin(req, res, next) {
    try {
        const userId = req.user.userId
        const { hoTen, email, soDienThoai } = req.body

        string(hoTen,'Họ tên',100)
        validateEmail(email)
        validatePhone(soDienThoai,false)
        // Validate
        if (!hoTen || !hoTen.trim()) {
            return res.status(400).json({ error: 'Họ tên không được để trống' })
        }
        if (hoTen.trim().length > 100) {
            return res.status(400).json({ error: 'Họ tên không được vượt quá 100 ký tự' })
        }
        if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: 'Email không hợp lệ' })
        }
        if (soDienThoai && soDienThoai.trim() && !/^\d{10}$/.test(soDienThoai.trim())) {
            return res.status(400).json({ error: 'Số điện thoại phải gồm đúng 10 chữ số' })
        }

        // Kiểm tra trùng email / SĐT với người khác
        if (email && email.trim()) {
            const dup = await query(
                `SELECT ma_nguoi_dung FROM nguoi_dung
                 WHERE email = $1 AND ma_nguoi_dung != $2`,
                [email.trim(), userId]
            )
            if (dup.rows.length > 0) {
                return res.status(400).json({ error: 'Email này đã được đăng ký bởi tài khoản khác' })
            }
        }
        if (soDienThoai && soDienThoai.trim()) {
            const dup = await query(
                `SELECT ma_nguoi_dung FROM nguoi_dung
                 WHERE so_dien_thoai = $1 AND ma_nguoi_dung != $2`,
                [soDienThoai.trim(), userId]
            )
            if (dup.rows.length > 0) {
                return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký bởi tài khoản khác' })
            }
        }

        // Xác định vai trò để cập nhật đúng bảng con
        const userRes = await query('SELECT vai_tro FROM nguoi_dung WHERE ma_nguoi_dung = $1', [userId])
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' })
        }
        const vaiTro = userRes.rows[0].vai_tro

        await withTransaction(async (client) => {
            // Cập nhật email, SĐT trong bảng nguoi_dung
            await client.query(
                `UPDATE nguoi_dung
                 SET email = $1, so_dien_thoai = $2
                 WHERE ma_nguoi_dung = $3`,
                [email?.trim() || null, soDienThoai?.trim() || null, userId]
            )

            // Cập nhật họ tên trong bảng con tương ứng
            if (vaiTro === 'KhachHang') {
                await client.query(
                    `UPDATE khach_hang SET ho_ten = $1 WHERE ma_khach_hang = $2`,
                    [hoTen.trim(), userId]
                )
            } else if (vaiTro === 'NhanVien') {
                await client.query(
                    `UPDATE nhan_vien SET ho_ten = $1 WHERE ma_nhan_vien = $2`,
                    [hoTen.trim(), userId]
                )
            }
            // Admin không có bảng con riêng
        })

        console.log(`[auth] Cập nhật thông tin cá nhân: userId=${userId}`)
        res.json({ message: 'Cập nhật thông tin thành công' })
    } catch (err) {
        next(err)
    }
}

/**
 * Đổi mật khẩu cho người dùng đang đăng nhập
 * POST /api/auth/doi-mat-khau
 * Bảo mật: chỉ tác động lên userId từ JWT, không nhận userId từ body
 */
export async function doiMatKhau(req, res, next) {
    try {
        const userId = req.user.userId  // Lấy từ JWT, không từ body
        const { matKhauHienTai, matKhauMoi, xacNhanMatKhauMoi } = req.body

        string(matKhauHienTai,'Mật khẩu hiện tại',72)
        validatePassword(matKhauMoi)
        string(xacNhanMatKhauMoi,'Xác nhận mật khẩu',72)
        // Validate đầu vào
        if (!matKhauHienTai || !matKhauMoi || !xacNhanMatKhauMoi) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ tất cả các trường' })
        }
        if (matKhauMoi !== xacNhanMatKhauMoi) {
            return res.status(400).json({ error: 'Mật khẩu mới và xác nhận mật khẩu không khớp' })
        }
        if (matKhauMoi.length < 8) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
        }
        if (matKhauMoi === matKhauHienTai) {
            return res.status(400).json({ error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' })
        }

        // Lấy hash hiện tại từ DB
        const result = await query(
            'SELECT mat_khau_hash FROM nguoi_dung WHERE ma_nguoi_dung = $1',
            [userId]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' })
        }

        // Xác minh mật khẩu hiện tại
        const khop = await bcrypt.compare(matKhauHienTai, result.rows[0].mat_khau_hash)
        if (!khop) {
            console.warn(`[auth] Đổi mật khẩu thất bại: mật khẩu hiện tại không đúng, userId=${userId}`)
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' })
        }

        // Băm mật khẩu mới và lưu
        const hashMoi = await bcrypt.hash(matKhauMoi, env.bcryptRounds)
        const changed = await query(
            'UPDATE nguoi_dung SET mat_khau_hash=$1,token_version=token_version+1,bat_doi_mat_khau=false,ngay_cap_nhat=NOW() WHERE ma_nguoi_dung=$2 AND mat_khau_hash=$3 RETURNING ma_nguoi_dung',
            [hashMoi, userId, result.rows[0].mat_khau_hash]
        )

        if (!changed.rowCount) return res.status(409).json({error:'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.'})
        // Xóa refresh token để bắt đăng nhập lại (bảo mật)
        res.clearCookie('refreshToken')

        console.log(`[auth] Đổi mật khẩu thành công: userId=${userId}`)
        res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' })
    } catch (err) {
        next(err)
    }
}
