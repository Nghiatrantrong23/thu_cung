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

        if (!tenDangNhap || !matKhau) {
            console.warn(`[auth] Đăng nhập thất bại: Thiếu tên đăng nhập hoặc mật khẩu`)
            return res.status(400).json({
                error: 'Thiếu tên đăng nhập hoặc mật khẩu',
            })
        }

        // Get user with password hash (match username or email)
        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap, nd.mat_khau_hash, 
                    nd.email, nd.vai_tro, nd.trang_thai,
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu,
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

        // Check if account is locked
        if (!user.trang_thai) {
            console.warn(`[auth] Đăng nhập thất bại: Tài khoản "${user.ten_dang_nhap}" đang bị khóa`)
            return res.status(403).json({
                error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
            })
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(matKhau, user.mat_khau_hash)
        if (!passwordMatch) {
            console.warn(`[auth] Đăng nhập thất bại: Sai mật khẩu cho tài khoản "${user.ten_dang_nhap}"`)
            return res.status(401).json({
                error: 'Tài khoản hoặc mật khẩu không đúng',
            })
        }

        console.log(`[auth] Đăng nhập thành công: ${user.ten_dang_nhap} (Vai trò: ${user.vai_tro})`)

        // Generate JWT
        const accessToken = jwt.sign(
            { userId: user.ma_nguoi_dung },
            env.jwt.secret,
            { expiresIn: env.jwt.expiresIn }
        )

        const refreshToken = jwt.sign(
            { userId: user.ma_nguoi_dung },
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
                hoTen: user.nhan_vien_ho_ten || user.khach_hang_ho_ten,
                chucVu: user.chuc_vu,
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
export async function dangXuat(req, res) {
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

        // Verify user still exists and is active
        const result = await query(
            'SELECT ma_nguoi_dung, trang_thai FROM nguoi_dung WHERE ma_nguoi_dung = $1',
            [decoded.userId]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Người dùng không tồn tại' })
        }

        if (!result.rows[0].trang_thai) {
            return res.status(403).json({ error: 'Tài khoản đã bị khóa' })
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
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
        const { username, fullName, phone, email, password } = req.body

        if (!username || !password || !fullName || !phone) {
            console.warn(`[auth] Đăng ký thất bại: Thiếu thông tin bắt buộc`)
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' })
        }

        // Check duplicate username, email, phone
        const existingUser = await query(
            `SELECT ma_nguoi_dung, ten_dang_nhap, email, so_dien_thoai 
             FROM nguoi_dung 
             WHERE LOWER(ten_dang_nhap) = LOWER($1) 
                OR (email = $2 AND email IS NOT NULL AND email != '') 
                OR so_dien_thoai = $3`,
            [username.trim(), email?.trim() || null, phone.trim()]
        )

        if (existingUser.rows.length > 0) {
            const found = existingUser.rows[0]
            if (found.ten_dang_nhap.toLowerCase() === username.trim().toLowerCase()) {
                console.warn(`[auth] Đăng ký thất bại: Tên đăng nhập "${username}" đã tồn tại`)
                return res.status(400).json({ error: 'Tên đăng nhập đã được sử dụng' })
            }
            if (found.so_dien_thoai === phone.trim()) {
                console.warn(`[auth] Đăng ký thất bại: Số điện thoại "${phone}" đã tồn tại`)
                return res.status(400).json({ error: 'Số điện thoại đã được đăng ký' })
            }
            if (found.email && found.email === email?.trim()) {
                console.warn(`[auth] Đăng ký thất bại: Email "${email}" đã tồn tại`)
                return res.status(400).json({ error: 'Email đã được đăng ký' })
            }
        }

        const hash = await bcrypt.hash(password, env.bcryptRounds)

        const newId = await withTransaction(async (client) => {
            const userRes = await client.query(
                `INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, email, so_dien_thoai, vai_tro, trang_thai)
                 VALUES ($1, $2, $3, $4, 'KhachHang', true)
                 RETURNING ma_nguoi_dung`,
                [username.trim(), hash, email?.trim() || null, phone.trim()]
            )
            const userId = userRes.rows[0].ma_nguoi_dung

            await client.query(
                `INSERT INTO khach_hang (ma_khach_hang, ho_ten) VALUES ($1, $2)`,
                [userId, fullName.trim()]
            )

            return userId
        })

        console.log(`[auth] Đăng ký tài khoản khách hàng mới thành công: ${username.trim()} (ID: ${newId})`)
        res.status(201).json({ message: 'Đăng ký thành công', userId: newId })
    } catch (err) {
        console.error('[auth] Lỗi khi đăng ký:', err)
        next(err)
    }
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
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu,
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
            hoTen: u.nhan_vien_ho_ten || u.khach_hang_ho_ten || '',
            chucVu: u.chuc_vu || '',
            trangThai: u.trang_thai,
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
        await query(
            'UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE ma_nguoi_dung = $2',
            [hashMoi, userId]
        )

        // Xóa refresh token để bắt đăng nhập lại (bảo mật)
        res.clearCookie('refreshToken')

        console.log(`[auth] Đổi mật khẩu thành công: userId=${userId}`)
        res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' })
    } catch (err) {
        next(err)
    }
}
