import bcrypt from 'bcrypt'
import { query, withTransaction } from '../config/db.js'
import { env } from '../config/env.js'
import { generateMatKhauTam } from '../utils/matKhau.js'

/**
 * GET /api/admin/tai-khoan?q=&vaiTro=
 * Danh sách tài khoản với tìm kiếm và lọc
 */
export async function layDanhSachTaiKhoan(req, res, next) {
    try {
        const { q = '', vaiTro = '' } = req.query

        let sql = `
            SELECT 
                nd.ma_nguoi_dung,
                nd.ten_dang_nhap,
                nd.email,
                nd.so_dien_thoai,
                nd.vai_tro,
                nd.trang_thai,
                nv.ho_ten as nhan_vien_ho_ten,
                nv.chuc_vu,
                kh.ho_ten as khach_hang_ho_ten
            FROM nguoi_dung nd
            LEFT JOIN nhan_vien nv ON nd.ma_nguoi_dung = nv.ma_nhan_vien
            LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
            WHERE 1=1
        `
        const params = []

        if (q) {
            params.push(`%${q}%`)
            sql += ` AND (nd.ten_dang_nhap ILIKE $${params.length} 
                     OR nv.ho_ten ILIKE $${params.length} 
                     OR kh.ho_ten ILIKE $${params.length} 
                     OR nd.so_dien_thoai ILIKE $${params.length})`
        }

        if (vaiTro) {
            params.push(vaiTro)
            sql += ` AND nd.vai_tro = $${params.length}`
        }

        sql += ` ORDER BY nd.ngay_tao DESC`

        const result = await query(sql, params)

        const danhSach = result.rows.map(row => ({
            maNguoiDung: row.ma_nguoi_dung,
            tenDangNhap: row.ten_dang_nhap,
            email: row.email || '',
            soDienThoai: row.so_dien_thoai || '',
            vaiTro: row.vai_tro,
            trangThai: row.trang_thai,
            hoTen: row.nhan_vien_ho_ten || row.khach_hang_ho_ten || '',
            chucVu: row.chuc_vu || '',
        }))

        res.json({ data: danhSach })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan
 * Tạo tài khoản nhân viên (vai_tro='NhanVien', chuc_vu là Lễ tân/Quản lý/...)
 */
export async function taoTaiKhoan(req, res, next) {
    try {
        const { tenDangNhap, hoTen, soDienThoai, email, chucVu } = req.body

        // Validation
        if (!tenDangNhap || !hoTen || !chucVu) {
            return res.status(400).json({
                error: 'tenDangNhap, hoTen và chucVu là bắt buộc'
            })
        }

        // Sinh mật khẩu tạm
        const matKhauTam = generateMatKhauTam(12)
        const matKhauHash = await bcrypt.hash(matKhauTam, env.bcryptRounds)

        const result = await withTransaction(async (client) => {
            // Kiểm tra trùng
            const checkResult = await client.query(
                `SELECT 
                    (SELECT COUNT(*) FROM nguoi_dung WHERE ten_dang_nhap = $1) as trung_ten,
                    (SELECT COUNT(*) FROM nguoi_dung WHERE so_dien_thoai = $2 AND so_dien_thoai IS NOT NULL) as trung_sdt,
                    (SELECT COUNT(*) FROM nguoi_dung WHERE email = $3 AND email IS NOT NULL) as trung_email`,
                [tenDangNhap, soDienThoai || null, email || null]
            )

            const dup = checkResult.rows[0]
            if (parseInt(dup.trung_ten) > 0) {
                throw Object.assign(new Error('Tên đăng nhập đã tồn tại'), { status: 409 })
            }
            if (soDienThoai && parseInt(dup.trung_sdt) > 0) {
                throw Object.assign(new Error('Số điện thoại đã tồn tại'), { status: 409 })
            }
            if (email && parseInt(dup.trung_email) > 0) {
                throw Object.assign(new Error('Email đã tồn tại'), { status: 409 })
            }

            // Tạo nguoi_dung với vai_tro='NhanVien'
            const userResult = await client.query(
                `INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, email, so_dien_thoai, vai_tro, trang_thai)
                 VALUES ($1, $2, $3, $4, 'NhanVien', true)
                 RETURNING ma_nguoi_dung`,
                [tenDangNhap, matKhauHash, email || null, soDienThoai || null]
            )

            const maNguoiDung = userResult.rows[0].ma_nguoi_dung

            // Tạo nhan_vien
            await client.query(
                `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, chuc_vu)
                 VALUES ($1, $2, $3)`,
                [maNguoiDung, hoTen, chucVu]
            )

            return { maNguoiDung, matKhauTam }
        })

        res.status(201).json({
            message: 'Tạo tài khoản thành công',
            data: {
                maNguoiDung: result.maNguoiDung,
                tenDangNhap,
                hoTen,
                soDienThoai: soDienThoai || '',
                email: email || '',
                vaiTro: 'NhanVien',
                chucVu,
                trangThai: true,
                matKhauTam: result.matKhauTam, // Chỉ hiển thị 1 lần
            },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * PATCH /api/admin/tai-khoan/:id
 * Cập nhật thông tin tài khoản
 */
export async function capNhatTaiKhoan(req, res, next) {
    try {
        const { id } = req.params
        const { hoTen, soDienThoai, email, vaiTro, chucVu } = req.body

        await withTransaction(async (client) => {
            // Lấy thông tin hiện tại
            const current = await client.query(
                'SELECT vai_tro FROM nguoi_dung WHERE ma_nguoi_dung = $1',
                [id]
            )

            if (current.rows.length === 0) {
                throw Object.assign(new Error('Tài khoản không tồn tại'), { status: 404 })
            }

            // Validate vaiTro
            if (vaiTro) {
                const vaiTroHopLe = ['Admin', 'NhanVien', 'KhachHang']
                if (!vaiTroHopLe.includes(vaiTro)) {
                    throw Object.assign(
                        new Error(`vaiTro không hợp lệ. Giá trị hợp lệ: ${vaiTroHopLe.join(', ')}`),
                        { status: 400 }
                    )
                }
            }

            // Kiểm tra trùng nếu có soDienThoai hoặc email
            if (soDienThoai || email) {
                const checkResult = await client.query(
                    `SELECT 
                        (SELECT COUNT(*) FROM nguoi_dung WHERE so_dien_thoai = $1 AND ma_nguoi_dung != $2 AND so_dien_thoai IS NOT NULL) as trung_sdt,
                        (SELECT COUNT(*) FROM nguoi_dung WHERE email = $3 AND ma_nguoi_dung != $2 AND email IS NOT NULL) as trung_email`,
                    [soDienThoai || null, id, email || null]
                )

                const dup = checkResult.rows[0]
                if (soDienThoai && parseInt(dup.trung_sdt) > 0) {
                    throw Object.assign(new Error('Số điện thoại đã tồn tại'), { status: 409 })
                }
                if (email && parseInt(dup.trung_email) > 0) {
                    throw Object.assign(new Error('Email đã tồn tại'), { status: 409 })
                }
            }

            // Cập nhật nguoi_dung
            const ndUpdates = []
            const ndParams = []
            let paramIndex = 1

            if (vaiTro) {
                ndUpdates.push(`vai_tro = $${paramIndex++}`)
                ndParams.push(vaiTro)
            }
            if (email !== undefined) {
                ndUpdates.push(`email = $${paramIndex++}`)
                ndParams.push(email || null)
            }
            if (soDienThoai !== undefined) {
                ndUpdates.push(`so_dien_thoai = $${paramIndex++}`)
                ndParams.push(soDienThoai || null)
            }

            if (ndUpdates.length > 0) {
                ndParams.push(id)
                await client.query(
                    `UPDATE nguoi_dung SET ${ndUpdates.join(', ')} WHERE ma_nguoi_dung = $${paramIndex}`,
                    ndParams
                )
            }

            // Cập nhật nhan_vien nếu có
            if (hoTen || chucVu) {
                const nvUpdates = []
                const nvParams = []
                let nvIndex = 1

                if (hoTen) {
                    nvUpdates.push(`ho_ten = $${nvIndex++}`)
                    nvParams.push(hoTen)
                }
                if (chucVu) {
                    nvUpdates.push(`chuc_vu = $${nvIndex++}`)
                    nvParams.push(chucVu)
                }

                if (nvUpdates.length > 0) {
                    nvParams.push(id)
                    const updateResult = await client.query(
                        `UPDATE nhan_vien SET ${nvUpdates.join(', ')} WHERE ma_nhan_vien = $${nvIndex}`,
                        nvParams
                    )
                    // Nếu không có nhan_vien record, không báo lỗi (có thể là KhachHang)
                }
            }
        })

        res.json({
            message: 'Cập nhật tài khoản thành công',
            data: { maNguoiDung: parseInt(id) },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan/:id/khoa
 * Khóa tài khoản với logic:
 * - Nếu có lịch DangThucHien: chặn cứng (409)
 * - Nếu chỉ có lịch DaXacNhan: cần xacNhan=true trong body để khóa
 */
export async function khoaTaiKhoan(req, res, next) {
    try {
        const { id } = req.params
        const { xacNhan } = req.body || {}

        // Không được khóa chính mình
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Không thể khóa tài khoản của chính bạn' })
        }

        // Kiểm tra lịch hẹn
        const kiemTraLich = await query(
            `SELECT 
                ma_lich_hen,
                trang_thai,
                ngay_gio_hen
             FROM lich_hen
             WHERE ma_nhan_vien = $1 
             AND trang_thai IN ('DaXacNhan', 'DangThucHien')
             ORDER BY ngay_gio_hen`,
            [id]
        )

        const lichHen = kiemTraLich.rows
        const lichDangThucHien = lichHen.filter(l => l.trang_thai === 'DangThucHien')
        const lichDaXacNhan = lichHen.filter(l => l.trang_thai === 'DaXacNhan')

        // Nếu có lịch DangThucHien: chặn cứng
        if (lichDangThucHien.length > 0) {
            return res.status(409).json({
                error: 'Không thể khóa nhân viên đang có lịch hẹn DangThucHien',
                lichDangThucHien: lichDangThucHien.map(l => ({
                    maLichHen: l.ma_lich_hen,
                    trangThai: l.trang_thai,
                    ngayGioHen: l.ngay_gio_hen,
                })),
            })
        }

        // Nếu có lịch DaXacNhan và chưa xác nhận: yêu cầu xác nhận
        if (lichDaXacNhan.length > 0 && xacNhan !== true) {
            return res.status(409).json({
                warning: true,
                message: `Nhân viên có ${lichDaXacNhan.length} lịch hẹn DaXacNhan. Gửi {"xacNhan": true} trong body để khóa.`,
                lichDaXacNhan: lichDaXacNhan.map(l => ({
                    maLichHen: l.ma_lich_hen,
                    trangThai: l.trang_thai,
                    ngayGioHen: l.ngay_gio_hen,
                })),
            })
        }

        // Khóa tài khoản
        const result = await query(
            'UPDATE nguoi_dung SET trang_thai = false WHERE ma_nguoi_dung = $1 RETURNING ma_nguoi_dung',
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' })
        }

        const response = {
            message: 'Khóa tài khoản thành công',
            data: { maNguoiDung: parseInt(id), trangThai: false },
        }

        // Trả kèm danh sách lịch bị ảnh hưởng nếu có
        if (lichDaXacNhan.length > 0) {
            response.lichBiAnhHuong = lichDaXacNhan.map(l => ({
                maLichHen: l.ma_lich_hen,
                trangThai: l.trang_thai,
                ngayGioHen: l.ngay_gio_hen,
            }))
            response.luuY = 'Các lịch hẹn DaXacNhan cần được phân công lại nhân viên khác'
        }

        res.json(response)
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan/:id/mo-khoa
 * Mở khóa tài khoản
 */
export async function moKhoaTaiKhoan(req, res, next) {
    try {
        const { id } = req.params

        const result = await query(
            'UPDATE nguoi_dung SET trang_thai = true WHERE ma_nguoi_dung = $1 RETURNING ma_nguoi_dung',
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' })
        }

        res.json({
            message: 'Mở khóa tài khoản thành công',
            data: { maNguoiDung: parseInt(id), trangThai: true },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan/:id/dat-lai-mat-khau
 * Đặt lại mật khẩu (sinh mật khẩu tạm mới)
 */
export async function datLaiMatKhau(req, res, next) {
    try {
        const { id } = req.params

        // Sinh mật khẩu tạm mới
        const matKhauTam = generateMatKhauTam(12)
        const matKhauHash = await bcrypt.hash(matKhauTam, env.bcryptRounds)

        const result = await query(
            'UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE ma_nguoi_dung = $2 RETURNING ma_nguoi_dung, ten_dang_nhap',
            [matKhauHash, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' })
        }

        res.json({
            message: 'Đặt lại mật khẩu thành công',
            data: {
                maNguoiDung: parseInt(id),
                tenDangNhap: result.rows[0].ten_dang_nhap,
                matKhauTam, // Chỉ hiển thị 1 lần
            },
        })
    } catch (err) {
        next(err)
    }
}
