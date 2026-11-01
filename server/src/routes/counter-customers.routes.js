import express from 'express'
import { authenticate, requireReception } from '../middleware/auth.middleware.js'
import { query, withTransaction } from '../config/db.js'
import { string, phone, email, invalid } from '../lib/validation.js'
import { isValidDate, businessNow } from '../lib/scheduling.js'

const router = express.Router()
router.use(authenticate, requireReception)

function customerId(value) {
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id <= 0) throw invalid('Mã khách hàng không hợp lệ.')
    return id
}
function pageOf(value) {
    const page = value === undefined ? 1 : Number(value)
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw invalid('Trang không hợp lệ.')
    return page
}
function mappedCustomer(row) {
    return { id: row.ma_khach_hang, fullName: row.ho_ten, phone: row.so_dien_thoai, email: row.email,
        loginActive: row.kich_hoat_dang_nhap, active: row.trang_thai, createdAt: row.ngay_tao, createdBy: row.nguoi_tao }
}
async function existingCustomer(id, client = { query }) {
    const result = await client.query(`SELECT kh.ma_khach_hang, kh.ho_ten, kh.nguoi_tao, nd.so_dien_thoai, nd.email,
        nd.kich_hoat_dang_nhap, nd.trang_thai, nd.ngay_tao FROM khach_hang kh
        JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang WHERE kh.ma_khach_hang=$1`, [id])
    if (!result.rowCount) throw Object.assign(new Error('Không tìm thấy khách hàng.'), { status: 404 })
    return result.rows[0]
}

router.post('/tai-quay', async (req, res, next) => {
    try {
        const fullName = string(req.body?.fullName, 'Họ tên', 100)
        const number = phone(req.body?.phone)
        const address = email(req.body?.email)
        const customer = await withTransaction(async client => {
            await client.query('SELECT pg_advisory_xact_lock(171718,hashtext($1))', [number])
            const duplicate = await client.query('SELECT ma_nguoi_dung FROM nguoi_dung WHERE so_dien_thoai=$1 OR ($2::text IS NOT NULL AND lower(email)=lower($2))', [number, address])
            if (duplicate.rowCount) throw Object.assign(new Error('Số điện thoại hoặc email đã tồn tại. Vui lòng tra cứu hồ sơ trước.'), { status: 409 })
            const user = await client.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,email,so_dien_thoai,vai_tro,kich_hoat_dang_nhap)
                VALUES ($1,NULL,$2,$1,'KhachHang',false) RETURNING ma_nguoi_dung`, [number, address])
            const id = user.rows[0].ma_nguoi_dung
            await client.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten,nguoi_tao) VALUES ($1,$2,$3)', [id, fullName, req.user.userId])
            await client.query("INSERT INTO nhat_ky_ho_so(loai_doi_tuong,ma_doi_tuong,hanh_dong,ma_nguoi_thuc_hien) VALUES ('KhachHang',$1,'Tao',$2)", [id, req.user.userId])
            return mappedCustomer(await existingCustomer(id, client))
        })
        res.status(201).json({ customer })
    } catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
    try {
        const kind = string(req.query.loai, 'Loại tìm kiếm', 20)
        if (!['ten','sdt','email','thu-cung','ma-lich'].includes(kind)) throw invalid('Loại tìm kiếm không hợp lệ.')
        const term = string(req.query.tim, 'Từ khóa', 100)
        if (term.length < 2 && kind !== 'ma-lich') throw invalid('Nhập ít nhất 2 ký tự.')
        if (kind === 'sdt' && !/^\d{2,10}$/.test(term)) throw invalid('Số điện thoại không hợp lệ.')
        if (kind === 'ma-lich' && (!/^\d+$/.test(term) || Number(term) < 1 || Number(term) > 2147483647)) throw invalid('Mã lịch không hợp lệ.')
        const page = pageOf(req.query.page)
        const where = {
            ten: 'kh.ho_ten ILIKE $1', sdt: 'nd.so_dien_thoai=$1', email: 'lower(nd.email)=lower($1)',
            'thu-cung': 'EXISTS (SELECT 1 FROM thu_cung tc WHERE tc.ma_khach_hang=kh.ma_khach_hang AND tc.ten_thu_cung ILIKE $1)',
            'ma-lich': 'EXISTS (SELECT 1 FROM lich_hen lh JOIN thu_cung tc ON tc.ma_thu_cung=lh.ma_thu_cung WHERE tc.ma_khach_hang=kh.ma_khach_hang AND lh.ma_lich_hen=$1::int)',
        }[kind]
        const value = ['ten','thu-cung'].includes(kind) ? `%${term.replace(/[\\%_]/g, '\\$&')}%` : term
        const count = await query(`SELECT count(*)::int AS total FROM khach_hang kh JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang WHERE ${where}`, [value])
        const rows = await query(`SELECT kh.ma_khach_hang,kh.ho_ten,kh.nguoi_tao,nd.so_dien_thoai,nd.email,nd.kich_hoat_dang_nhap,nd.trang_thai,nd.ngay_tao
            FROM khach_hang kh JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang WHERE ${where}
            ORDER BY kh.ma_khach_hang DESC LIMIT 20 OFFSET $2`, [value, (page-1)*20])
        res.json({ customers: rows.rows.map(mappedCustomer), total: count.rows[0].total, page, pageSize: 20 })
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try { res.json({ customer: mappedCustomer(await existingCustomer(customerId(req.params.id))) }) } catch (err) { next(err) }
})

router.post('/:id/thu-cung', async (req, res, next) => {
    try {
        const ownerId = customerId(req.params.id)
        const name = string(req.body?.name, 'Tên thú cưng', 50)
        const species = req.body?.species
        if (!['Chó','Mèo'].includes(species)) throw invalid('Loài phải là Chó hoặc Mèo.')
        const breed = string(req.body?.breed, 'Giống', 50, false) || null
        const gender = req.body?.gender || null
        if (gender && !['Đực','Cái'].includes(gender)) throw invalid('Giới tính không hợp lệ.')
        const birthDate = string(req.body?.birthDate, 'Ngày sinh', 10, false) || null
        if (birthDate && (!isValidDate(birthDate) || birthDate > businessNow().date)) throw invalid('Ngày sinh không hợp lệ.')
        const rawWeight = req.body?.weightKg
        const weight = rawWeight == null || rawWeight === '' ? null : Number(rawWeight)
        if (weight !== null && (!/^\d+(?:\.\d{1,2})?$/.test(String(rawWeight)) || weight <= 0 || weight > 999.99)) throw invalid('Cân nặng không hợp lệ.')
        const vaccine = req.body?.vaccination || 'ChuaRo'
        if (!['ChuaRo','DaTiem','ChuaTiem'].includes(vaccine)) throw invalid('Tình trạng tiêm phòng không hợp lệ.')
        const allergy = string(req.body?.allergy, 'Dị ứng', 500, false) || null
        const temperament = string(req.body?.temperament, 'Tính cách', 500, false) || null
        const healthNote = string(req.body?.healthNote, 'Ghi chú sức khỏe', 500, false) || null
        const pet = await withTransaction(async client => {
            const owner = await client.query(`SELECT kh.ma_khach_hang,nd.trang_thai FROM khach_hang kh
                JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang WHERE kh.ma_khach_hang=$1 FOR UPDATE OF kh`, [ownerId])
            if (!owner.rowCount) throw Object.assign(new Error('Không tìm thấy khách hàng.'), { status: 404 })
            if (!owner.rows[0].trang_thai) throw Object.assign(new Error('Hồ sơ khách đã ngừng hoạt động.'), { status: 409 })
            const duplicate = await client.query('SELECT 1 FROM thu_cung WHERE ma_khach_hang=$1 AND lower(ten_thu_cung)=lower($2) AND loai_thu_cung=$3', [ownerId,name,species])
            if (duplicate.rowCount) throw Object.assign(new Error('Khách đã có thú cưng cùng tên và loài.'), { status: 409 })
            const result = await client.query(`INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung,giong,gioi_tinh,ngay_sinh,can_nang,trang_thai_tiem_phong,di_ung,tinh_cach,ghi_chu_suc_khoe,nguoi_tao)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ma_thu_cung`, [ownerId,name,species,breed,gender,birthDate,weight,vaccine,allergy,temperament,healthNote,req.user.userId])
            const id = result.rows[0].ma_thu_cung
            await client.query("INSERT INTO nhat_ky_ho_so(loai_doi_tuong,ma_doi_tuong,hanh_dong,ma_nguoi_thuc_hien) VALUES ('ThuCung',$1,'Tao',$2)", [id,req.user.userId])
            return id
        })
        res.status(201).json({ petId: pet })
    } catch (err) { next(err) }
})

router.get('/:id/:section', async (req, res, next) => {
    try {
        const id = customerId(req.params.id)
        await existingCustomer(id)
        const page = pageOf(req.query.page)
        const sections = {
            'thu-cung': { table: 'thu_cung tc', select: 'tc.ma_thu_cung AS id,tc.ten_thu_cung AS name,tc.loai_thu_cung AS species,tc.giong AS breed,tc.gioi_tinh AS gender,to_char(tc.ngay_sinh,\'YYYY-MM-DD\') AS "birthDate",tc.can_nang AS "weightKg",tc.trang_thai_tiem_phong AS vaccination,tc.di_ung AS allergy,tc.tinh_cach AS temperament,tc.ghi_chu_suc_khoe AS "healthNote",tc.trang_thai AS active', where: 'tc.ma_khach_hang=$1', order: 'tc.ma_thu_cung' },
            'lich-hen': { table: 'lich_hen lh JOIN thu_cung tc ON tc.ma_thu_cung=lh.ma_thu_cung', select: 'lh.ma_lich_hen AS id,tc.ten_thu_cung AS "petName",lh.ngay_gio_hen AS date,lh.trang_thai AS status', where: 'tc.ma_khach_hang=$1', order: 'lh.ma_lich_hen' },
            'hoa-don': { table: 'hoa_don hd JOIN lich_hen lh ON lh.ma_lich_hen=hd.ma_lich_hen JOIN thu_cung tc ON tc.ma_thu_cung=lh.ma_thu_cung', select: 'hd.ma_hoa_don AS id,hd.ma_lich_hen AS "appointmentId",hd.ngay_lap AS date,hd.thanh_tien AS amount,hd.trang_thai AS status', where: 'tc.ma_khach_hang=$1', order: 'hd.ma_hoa_don' },
            'khieu-nai': { table: 'khieu_nai kn JOIN lich_hen lh ON lh.ma_lich_hen=kn.ma_lich_hen JOIN thu_cung tc ON tc.ma_thu_cung=lh.ma_thu_cung', select: 'kn.ma_khieu_nai AS id,kn.ma_lich_hen AS "appointmentId",kn.ngay_tiep_nhan AS date,kn.trang_thai AS status', where: 'tc.ma_khach_hang=$1', order: 'kn.ma_khieu_nai' },
        }
        const section = sections[req.params.section]
        if (!section) throw Object.assign(new Error('Không tìm thấy phần hồ sơ.'), { status: 404 })
        const total = await query(`SELECT count(*)::int AS total FROM ${section.table} WHERE ${section.where}`, [id])
        const rows = await query(`SELECT ${section.select} FROM ${section.table} WHERE ${section.where} ORDER BY ${section.order} DESC LIMIT 20 OFFSET $2`, [id,(page-1)*20])
        res.json({ items: rows.rows, total: total.rows[0].total, page, pageSize: 20 })
    } catch (err) { next(err) }
})

export default router
