import { string, invalid } from '../lib/validation.js'
import { isValidDate, businessNow } from '../lib/scheduling.js'
import { query, withTransaction } from '../config/db.js'

// -------------------------------------------------------
// Helper: Chuẩn hóa loài và giới tính
// -------------------------------------------------------
function normalizeSpecies(species) {
    if (typeof species !== 'string') return null
    const s = species.trim()
    if (s === 'Chó' || s.toLowerCase() === 'dog') return 'Chó'
    if (s === 'Mèo' || s.toLowerCase() === 'cat') return 'Mèo'
    return null
}

function normalizeGender(gender) {
    if (typeof gender !== 'string') return null
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
        birthDate: row.ngay_sinh ? (typeof row.ngay_sinh === 'string' ? row.ngay_sinh : `${row.ngay_sinh.getFullYear()}-${String(row.ngay_sinh.getMonth()+1).padStart(2,'0')}-${String(row.ngay_sinh.getDate()).padStart(2,'0')}`) : '',
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

        if (role === 'NhanVien' && req.user.chucVu === 'Nhân viên chăm sóc') {
            const assigned = await query('SELECT 1 FROM lich_hen WHERE ma_thu_cung=$1 AND ma_nhan_vien=$2 LIMIT 1', [id, userId])
            if (!assigned.rows.length) return res.status(403).json({ error: 'Bạn chỉ được xem thú cưng trong lịch được phân công.' })
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
function petInput(body) {
    const name=string(body?.name,'Tên thú cưng',50)
    const species=normalizeSpecies(body.species)
    if (!species) throw invalid('Chỉ nhận Chó hoặc Mèo.')
    const gender=normalizeGender(body.gender)
    if (body.gender != null && body.gender !== '' && !gender) throw invalid('Giới tính không hợp lệ.')
    let weight=null
    if (body.weightKg != null && body.weightKg !== '') {
        if (!['number','string'].includes(typeof body.weightKg) || !/^\d+(?:\.\d{1,2})?$/.test(String(body.weightKg))) throw invalid('Cân nặng không hợp lệ.')
        weight=Number(body.weightKg)
        if (!Number.isFinite(weight) || weight<=0 || weight>999.99) throw invalid('Cân nặng phải lớn hơn 0, tối đa 999,99 kg.')
    }
    const date=string(body.birthDate,'Ngày sinh',10,false)
    if (date && (!isValidDate(date) || date>businessNow().date)) throw invalid('Ngày sinh không hợp lệ hoặc ở tương lai.')
    return [name,species,string(body.breed,'Giống',50,false)||null,gender,date||null,weight,string(body.healthNote,'Ghi chú sức khỏe',500,false)||null]
}
async function savePet(req, update) {
    const values=petInput(req.body)
    return withTransaction(async client=>{
        // One owner's pet writes serialize, including duplicate-name checks.
        const owner=await client.query('SELECT ma_khach_hang FROM khach_hang WHERE ma_khach_hang=$1 FOR UPDATE',[req.user.userId])
        if (!owner.rowCount) throw Object.assign(new Error('Không tìm thấy hồ sơ khách hàng.'),{status:403})
        if (update) {
            const current=(await client.query('SELECT ma_khach_hang,trang_thai FROM thu_cung WHERE ma_thu_cung=$1 FOR UPDATE',[req.params.id])).rows[0]
            if (!current) throw Object.assign(new Error('Không tìm thấy thú cưng.'),{status:404})
            if (current.ma_khach_hang!==req.user.userId) throw Object.assign(new Error('Bạn không có quyền sửa thú cưng này.'),{status:403})
            if (!current.trang_thai) throw invalid('Không thể sửa thú cưng đã ngừng theo dõi.')
        }
        const dup=await client.query('SELECT 1 FROM thu_cung WHERE ma_khach_hang=$1 AND LOWER(ten_thu_cung)=LOWER($2) AND loai_thu_cung=$3 AND ($4::int IS NULL OR ma_thu_cung<>$4)',[req.user.userId,values[0],values[1],update?req.params.id:null])
        if (dup.rowCount) throw Object.assign(new Error('Bạn đã có thú cưng cùng tên và loài.'),{status:409})
        const sql=update ? `UPDATE thu_cung SET ten_thu_cung=$1,loai_thu_cung=$2,giong=$3,gioi_tinh=$4,ngay_sinh=$5,can_nang=$6,ghi_chu_suc_khoe=$7,ngay_cap_nhat=NOW() WHERE ma_thu_cung=$8 RETURNING *`
            : `INSERT INTO thu_cung(ten_thu_cung,loai_thu_cung,giong,gioi_tinh,ngay_sinh,can_nang,ghi_chu_suc_khoe,ma_khach_hang) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`
        return mapPetToFrontend((await client.query(sql,[...values,update?req.params.id:req.user.userId])).rows[0])
    })
}
export async function themThuCung(req,res,next) {
    try {res.status(201).json({pet:await savePet(req,false),message:'Đã thêm thú cưng.'})}catch(err){next(err)}
}
export async function capNhatThuCung(req,res,next) {
    try {res.json({pet:await savePet(req,true),message:'Đã lưu thay đổi.'})}catch(err){next(err)}
}

/**
 * PATCH /api/thu-cung/:id/trang-thai
 * Doi trang thai active <-> inactive (true <-> false).
 */
export async function doiTrangThaiThuCung(req, res, next) {
    try {
        if (typeof req.body.active !== 'boolean') return res.status(400).json({ error: 'Trạng thái phải là true hoặc false.' })
        const pet = await withTransaction(async (client) => {
            // Serialize status changes with booking's pet FOR SHARE before checking open jobs.
            const existing = await client.query('SELECT * FROM thu_cung WHERE ma_thu_cung=$1 FOR UPDATE', [req.params.id])
            const current = existing.rows[0]
            if (!current) throw Object.assign(new Error('Không tìm thấy thú cưng.'), { status: 404 })
            if (current.ma_khach_hang !== req.user.userId) throw Object.assign(new Error('Bạn không có quyền thao tác với thú cưng này.'), { status: 403 })
            if (!req.body.active) {
                const open = await client.query("SELECT 1 FROM lich_hen WHERE ma_thu_cung=$1 AND trang_thai IN ('ChoXacNhan','DaXacNhan','DangThucHien') LIMIT 1", [req.params.id])
                if (open.rows.length) throw Object.assign(new Error('Thú cưng đang có lịch hẹn chưa kết thúc.'), { status: 400 })
            }
            const result = await client.query('UPDATE thu_cung SET trang_thai=$1,ngay_cap_nhat=NOW() WHERE ma_thu_cung=$2 RETURNING *', [req.body.active, req.params.id])
            return mapPetToFrontend(result.rows[0])
        })
        res.json({ pet, message: pet.active ? `Đã theo dõi lại ${pet.name}.` : `Đã ngừng theo dõi ${pet.name}.` })
    } catch (err) { next(err) }
}

/**
 * GET /api/khach-hang/tra-cuu?sdt=0912345678
 * Le tan tra cuu khach hang theo SDT (MH-02b).
 */
export async function traCuuKhachHang(req, res, next) {
    try {
        const { sdt } = req.query

        if (typeof sdt !== 'string' || !/^\d{10}$/.test(sdt.trim())) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ (10 chữ số).' })
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
