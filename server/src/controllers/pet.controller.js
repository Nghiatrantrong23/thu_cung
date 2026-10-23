import { query } from '../config/db.js'

// -------------------------------------------------------
// Helper: Chuẩn hóa loài và giới tính
// -------------------------------------------------------
function normalizeSpecies(species) {
    if (!species) return null
    const s = species.trim()
    if (s === 'Chó' || s.toLowerCase() === 'dog') return 'Chó'
    if (s === 'Mèo' || s.toLowerCase() === 'cat') return 'Mèo'
    return null
}

function normalizeGender(gender) {
    if (!gender) return null
    const g = gender.trim()
    if (g === 'Đực' || g.toLowerCase() === 'male') return 'Đực'
    if (g === 'Cái' || g.toLowerCase() === 'female') return 'Cái'
    return null
}

function mapPetToFrontend(row) {
    return {
        id: row.ma_thu_cung,
        name: row.ten_thu_cung,
        species: row.loai_thu_cung,
        breed: row.giong ?? '',
        gender: row.gioi_tinh ?? '',
        birthDate: row.ngay_sinh ? new Date(row.ngay_sinh).toISOString().slice(0, 10) : '',
        weightKg: row.can_nang != null ? Number(row.can_nang) : null,
        healthNote: row.ghi_chu_suc_khoe ?? '',
        active: Boolean(row.trang_thai),
        createdAt: row.ngay_tao,
    }
}

/**
 * GET /api/thu-cung
 * Lay danh sach thu cung cua nguoi dung dang dang nhap.
 */
export async function layDanhSachThuCung(req, res, next) {
    try {
        const userId = req.user.userId

        const result = await query(
            `SELECT ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao
             FROM thu_cung
             WHERE ma_khach_hang = $1
             ORDER BY ngay_tao ASC`,
            [userId]
        )

        res.json({ pets: result.rows.map(mapPetToFrontend) })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/thu-cung/:id
 * Chi tiet 1 thu cung (chu so huu hoac nhan vien).
 */
export async function layChiTietThuCung(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.user.userId
        const role = req.user.role

        const result = await query(
            `SELECT ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao
             FROM thu_cung
             WHERE ma_thu_cung = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thú cưng.' })
        }

        const pet = result.rows[0]
        if (role === 'KhachHang' && pet.ma_khach_hang !== userId) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thú cưng này.' })
        }

        res.json({ pet: mapPetToFrontend(pet) })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/thu-cung
 * Them thu cung moi cho khach hang.
 */
export async function themThuCung(req, res, next) {
    try {
        const userId = req.user.userId
        const { name, species, breed, gender, birthDate, weightKg, healthNote } = req.body

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập tên thú cưng.' })
        }

        const loai = normalizeSpecies(species)
        if (!loai) {
            return res.status(400).json({ error: 'Loài không hợp lệ. Chỉ nhận Chó hoặc Mèo.' })
        }

        const gioiTinh = normalizeGender(gender)
        const canNang = (weightKg != null && weightKg !== '') ? Number(weightKg) : null

        // Dam bao da co record trong bang khach_hang
        const checkKh = await query(`SELECT ma_khach_hang FROM khach_hang WHERE ma_khach_hang = $1`, [userId])
        if (checkKh.rows.length === 0) {
            const userRow = await query(`SELECT ten_dang_nhap FROM nguoi_dung WHERE ma_nguoi_dung = $1`, [userId])
            const defaultName = userRow.rows[0]?.ten_dang_nhap || 'Khách hàng'
            await query(`INSERT INTO khach_hang (ma_khach_hang, ho_ten) VALUES ($1, $2)`, [userId, defaultName])
        }

        // Kiem tra trung ten + loai cua cung mot chu nuoi
        const dup = await query(
            `SELECT ma_thu_cung FROM thu_cung
             WHERE ma_khach_hang = $1 AND LOWER(ten_thu_cung) = LOWER($2) AND loai_thu_cung = $3`,
            [userId, name.trim(), loai]
        )
        if (dup.rows.length > 0) {
            return res.status(409).json({ error: 'Bạn đã có thú cưng cùng tên và loài này.' })
        }

        const result = await query(
            `INSERT INTO thu_cung (ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
             RETURNING ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao`,
            [
                userId,
                name.trim(),
                loai,
                breed?.trim() || null,
                gioiTinh,
                birthDate || null,
                canNang,
                healthNote?.trim() || null,
            ]
        )

        const pet = mapPetToFrontend(result.rows[0])
        console.log(`[pet] Thêm thú cưng mới: ${pet.name} (${pet.species}) - userId=${userId}`)
        res.status(201).json({ pet, message: `Đã thêm thú cưng ${pet.name} thành công.` })
    } catch (err) {
        next(err)
    }
}

/**
 * PUT /api/thu-cung/:id
 * Cap nhat thong tin thu cung.
 */
export async function capNhatThuCung(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.user.userId
        const { name, species, breed, gender, birthDate, weightKg, healthNote } = req.body

        const existing = await query(
            `SELECT ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, trang_thai FROM thu_cung WHERE ma_thu_cung = $1`,
            [id]
        )
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thú cưng.' })
        }
        const current = existing.rows[0]
        if (current.ma_khach_hang !== userId) {
            return res.status(403).json({ error: 'Bạn không có quyền sửa thú cưng này.' })
        }
        if (!current.trang_thai) {
            return res.status(400).json({ error: 'Không thể sửa thú cưng đang ở trạng thái Ngừng theo dõi.' })
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập tên thú cưng.' })
        }

        const loai = normalizeSpecies(species)
        if (!loai) {
            return res.status(400).json({ error: 'Loài không hợp lệ. Chỉ nhận Chó hoặc Mèo.' })
        }

        const gioiTinh = normalizeGender(gender)
        const canNang = (weightKg != null && weightKg !== '') ? Number(weightKg) : null

        const dup = await query(
            `SELECT ma_thu_cung FROM thu_cung
             WHERE ma_khach_hang = $1 AND LOWER(ten_thu_cung) = LOWER($2) AND loai_thu_cung = $3 AND ma_thu_cung != $4`,
            [userId, name.trim(), loai, id]
        )
        if (dup.rows.length > 0) {
            return res.status(409).json({ error: 'Bạn đã có thú cưng cùng tên và loài này.' })
        }

        const result = await query(
            `UPDATE thu_cung
             SET ten_thu_cung = $1, loai_thu_cung = $2, giong = $3, gioi_tinh = $4,
                 ngay_sinh = $5, can_nang = $6, ghi_chu_suc_khoe = $7,
                 ngay_cap_nhat = NOW()
             WHERE ma_thu_cung = $8
             RETURNING ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao`,
            [name.trim(), loai, breed?.trim() || null, gioiTinh, birthDate || null, canNang, healthNote?.trim() || null, id]
        )

        const pet = mapPetToFrontend(result.rows[0])
        console.log(`[pet] Cập nhật thú cưng: ${pet.name} - userId=${userId}`)
        res.json({ pet, message: 'Đã lưu thay đổi.' })
    } catch (err) {
        next(err)
    }
}

/**
 * PATCH /api/thu-cung/:id/trang-thai
 * Doi trang thai active <-> inactive (true <-> false).
 */
export async function doiTrangThaiThuCung(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.user.userId
        const { active } = req.body

        const existing = await query(
            `SELECT ma_thu_cung, ma_khach_hang, ten_thu_cung, trang_thai FROM thu_cung WHERE ma_thu_cung = $1`,
            [id]
        )
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thú cưng.' })
        }
        const current = existing.rows[0]
        if (current.ma_khach_hang !== userId) {
            return res.status(403).json({ error: 'Bạn không có quyền thao tác với thú cưng này.' })
        }

        // Neu ngung theo doi: kiem tra lich hen dang mo
        if (!active) {
            const openAppt = await query(
                `SELECT ma_lich_hen FROM lich_hen
                 WHERE ma_thu_cung = $1 AND trang_thai IN ('ChoXacNhan', 'DaXacNhan', 'DangThucHien')
                 LIMIT 1`,
                [id]
            )
            if (openAppt.rows.length > 0) {
                return res.status(400).json({
                    error: `${current.ten_thu_cung} đang có lịch hẹn chưa kết thúc. Hãy hủy hoặc chờ hoàn thành lịch hẹn trước khi ngừng theo dõi.`,
                })
            }
        }

        const newStatus = Boolean(active)
        const result = await query(
            `UPDATE thu_cung SET trang_thai = $1, ngay_cap_nhat = NOW()
             WHERE ma_thu_cung = $2
             RETURNING ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao`,
            [newStatus, id]
        )

        const pet = mapPetToFrontend(result.rows[0])
        const msg = newStatus ? `Đã theo dõi lại ${pet.name}.` : `Đã ngừng theo dõi ${pet.name}. Bé sẽ không xuất hiện khi đặt lịch.`
        console.log(`[pet] Đổi trạng thái: ${pet.name} -> ${newStatus} - userId=${userId}`)
        res.json({ pet, message: msg })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/khach-hang/tra-cuu?sdt=0912345678
 * Le tan tra cuu khach hang theo SDT (MH-02b).
 */
export async function traCuuKhachHang(req, res, next) {
    try {
        const { sdt } = req.query

        if (!sdt || !/^\d{9,11}$/.test(sdt.trim())) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ (9–11 chữ số).' })
        }

        const userResult = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap,
                    COALESCE(kh.ho_ten, nd.ten_dang_nhap) as ho_ten,
                    nd.so_dien_thoai, nd.email, nd.vai_tro, nd.trang_thai
             FROM nguoi_dung nd
             LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
             WHERE nd.so_dien_thoai = $1 AND nd.vai_tro = 'KhachHang'`,
            [sdt.trim()]
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng với số điện thoại này.', found: false })
        }

        const kh = userResult.rows[0]

        const petResult = await query(
            `SELECT ma_thu_cung, ma_khach_hang, ten_thu_cung, loai_thu_cung, giong, gioi_tinh, ngay_sinh, can_nang, ghi_chu_suc_khoe, trang_thai, ngay_tao
             FROM thu_cung
             WHERE ma_khach_hang = $1 AND trang_thai = true
             ORDER BY ngay_tao ASC`,
            [kh.ma_nguoi_dung]
        )

        res.json({
            found: true,
            customer: {
                id: kh.ma_nguoi_dung,
                username: kh.ten_dang_nhap,
                hoTen: kh.ho_ten,
                soDienThoai: kh.so_dien_thoai,
                email: kh.email,
                trangThai: kh.trang_thai,
            },
            pets: petResult.rows.map(mapPetToFrontend),
        })
    } catch (err) {
        next(err)
    }
}
