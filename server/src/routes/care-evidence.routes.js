import express from 'express'
import { query, withTransaction } from '../config/db.js'
import { integerId } from '../services/dispatch.js'
import { bookingError } from '../services/booking.js'
import { string } from '../lib/validation.js'
import { canManageAppointments } from '../middleware/auth.middleware.js'
import { notifyReception } from '../services/notifications.js'

const router = express.Router({ mergeParams: true })
const RAW_LIMIT = 5 * 1024 * 1024
const imageBody = express.raw({ type: ['image/jpeg','image/png','image/webp'], limit: RAW_LIMIT })
const kindMap = { truoc: 'Truoc', sau: 'Sau', 'su-co': 'SuCo' }

async function booking(id, client = { query }, lock = false) {
    const result = await client.query(`SELECT lh.ma_lich_hen,lh.ma_nhan_vien,lh.trang_thai,tc.ma_khach_hang,tc.dong_y_hien_anh
        FROM lich_hen lh JOIN thu_cung tc USING(ma_thu_cung) WHERE lh.ma_lich_hen=$1 ${lock ? 'FOR UPDATE OF lh' : ''}`, [integerId(id)])
    if (!result.rowCount) throw bookingError(404, 'Không tìm thấy lịch.')
    return result.rows[0]
}
function canRead(row, user, kind) {
    if (canManageAppointments(user)) return true
    if (user.chucVu === 'Nhân viên chăm sóc' && row.ma_nhan_vien === user.userId) return true
    return user.role === 'KhachHang' && row.ma_khach_hang === user.userId && kind !== 'SuCo' && row.dong_y_hien_anh
}
function requireWriter(row, user) {
    if (user.chucVu !== 'Nhân viên chăm sóc' || row.ma_nhan_vien !== user.userId) throw bookingError(403, 'Chỉ nhân viên được phân công được cập nhật lịch này.')
    if (!['DaXacNhan','DangThucHien'].includes(row.trang_thai)) throw bookingError(409, 'Lịch không còn ở trạng thái chăm sóc.')
}
function imageMime(buffer) {
    if (buffer.length >= 3 && buffer.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))) return 'image/jpeg'
    if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png'
    if (buffer.length >= 12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp'
    return null
}

router.get('/', async (req,res,next) => {
    try {
        const row = await booking(req.params.id)
        if (!canManageAppointments(req.user) && !(req.user.chucVu==='Nhân viên chăm sóc' && row.ma_nhan_vien===req.user.userId)
            && !(req.user.role==='KhachHang' && row.ma_khach_hang===req.user.userId)) throw bookingError(403,'Không có quyền xem thông tin chăm sóc.')
        const notes = await query(`SELECT gc.ma_ghi_chu AS id,gc.noi_dung AS text,gc.ngay_tao AS "createdAt",nv.ho_ten AS author
            FROM ghi_chu_ca_cham_soc gc JOIN nhan_vien nv ON nv.ma_nhan_vien=gc.ma_nhan_vien
            WHERE gc.ma_lich_hen=$1 ORDER BY gc.ma_ghi_chu`, [row.ma_lich_hen])
        const incidents = req.user.role==='KhachHang' ? { rows: [] } : await query(`SELECT sc.ma_su_co AS id,sc.loai AS type,sc.muc_do AS severity,sc.mo_ta AS description,sc.ngay_tao AS "createdAt"
            FROM su_co_cham_soc sc WHERE sc.ma_lich_hen=$1 ORDER BY sc.ma_su_co DESC`, [row.ma_lich_hen])
        const images = await query(`SELECT ma_anh AS id,loai AS kind,ma_su_co AS "incidentId",mime,ngay_tao AS "createdAt"
            FROM anh_cham_soc WHERE ma_lich_hen=$1 ${req.user.role==='KhachHang' ? "AND loai<>'SuCo' AND $2::boolean" : ''} ORDER BY ma_anh`, req.user.role==='KhachHang'?[row.ma_lich_hen,row.dong_y_hien_anh]:[row.ma_lich_hen])
        res.json({ notes: notes.rows, incidents: incidents.rows, images: images.rows, photoConsent: row.dong_y_hien_anh })
    } catch(err) { next(err) }
})

router.get('/anh/:imageId', async (req,res,next) => {
    try {
        const row = await booking(req.params.id)
        const image = (await query('SELECT ma_anh,loai,mime,noi_dung FROM anh_cham_soc WHERE ma_anh=$1 AND ma_lich_hen=$2', [integerId(req.params.imageId),row.ma_lich_hen])).rows[0]
        if (!image) throw bookingError(404,'Không tìm thấy ảnh.')
        if (!canRead(row,req.user,image.loai)) throw bookingError(403,'Không có quyền xem ảnh.')
        res.set('Content-Type', image.mime).set('Cache-Control','private, no-store').send(image.noi_dung)
    } catch(err) { next(err) }
})

router.post('/anh', imageBody, async (req,res,next) => {
    try {
        const kind = kindMap[req.query.loai]
        if (!kind) throw bookingError(400,'Loại ảnh không hợp lệ.')
        if (!Buffer.isBuffer(req.body) || req.body.length < 1 || req.body.length > RAW_LIMIT) throw bookingError(400,'Ảnh không hợp lệ hoặc vượt 5 MB.')
        const mime = imageMime(req.body)
        if (!mime || mime !== req.headers['content-type']) throw bookingError(400,'Chỉ nhận JPG, PNG hoặc WebP đúng định dạng.')
        const incidentId = kind==='SuCo' ? integerId(req.query.suCoId) : null
        const id = await withTransaction(async client => {
            const row = await booking(req.params.id,client,true)
            requireWriter(row,req.user)
            if (kind==='SuCo') {
                const incident = await client.query('SELECT 1 FROM su_co_cham_soc WHERE ma_su_co=$1 AND ma_lich_hen=$2', [incidentId,row.ma_lich_hen])
                if (!incident.rowCount) throw bookingError(404,'Sự cố không thuộc lịch này.')
            } else if ((kind==='Truoc' && row.trang_thai!=='DaXacNhan') || (kind==='Sau' && row.trang_thai!=='DangThucHien')) throw bookingError(409,'Ảnh không đúng giai đoạn chăm sóc.')
            const count = await client.query('SELECT count(*)::int AS count FROM anh_cham_soc WHERE ma_lich_hen=$1 AND loai=$2 AND ($3::int IS NULL OR ma_su_co=$3)', [row.ma_lich_hen,kind,incidentId])
            if (count.rows[0].count>=5) throw bookingError(409,'Tối đa 5 ảnh cho mỗi nhóm.')
            const saved = await client.query(`INSERT INTO anh_cham_soc(ma_lich_hen,ma_su_co,loai,mime,noi_dung,ma_nguoi_tao)
                VALUES($1,$2,$3,$4,$5,$6) RETURNING ma_anh`, [row.ma_lich_hen,incidentId,kind,mime,req.body,req.user.userId])
            return saved.rows[0].ma_anh
        })
        res.status(201).json({ id })
    } catch(err) { next(err) }
})

router.delete('/anh/:imageId', async (req,res,next) => {
    try {
        await withTransaction(async client => {
            const row = await booking(req.params.id,client,true)
            requireWriter(row,req.user)
            const image = (await client.query('SELECT loai FROM anh_cham_soc WHERE ma_anh=$1 AND ma_lich_hen=$2', [integerId(req.params.imageId),row.ma_lich_hen])).rows[0]
            if (!image) throw bookingError(404,'Không tìm thấy ảnh.')
            if ((image.loai==='Truoc' && row.trang_thai!=='DaXacNhan') || (image.loai==='Sau' && row.trang_thai!=='DangThucHien')) throw bookingError(409,'Không thể xóa ảnh sau khi chuyển giai đoạn.')
            await client.query('DELETE FROM anh_cham_soc WHERE ma_anh=$1', [req.params.imageId])
        })
        res.json({ message:'Đã xóa ảnh.' })
    } catch(err) { next(err) }
})

router.post('/ghi-chu', async (req,res,next) => {
    try {
        const text = string(req.body?.text,'Ghi chú',500)
        const id = await withTransaction(async client => {
            const row = await booking(req.params.id,client,true)
            requireWriter(row,req.user)
            const saved = await client.query('INSERT INTO ghi_chu_ca_cham_soc(ma_lich_hen,ma_nhan_vien,noi_dung) VALUES($1,$2,$3) RETURNING ma_ghi_chu', [row.ma_lich_hen,req.user.userId,text])
            return saved.rows[0].ma_ghi_chu
        })
        res.status(201).json({ id })
    } catch(err) { next(err) }
})

router.post('/su-co', async (req,res,next) => {
    try {
        const type=req.body?.type,severity=req.body?.severity,description=string(req.body?.description,'Mô tả sự cố',800)
        if (!['BiThuong','DauHieuBenh','HungDu','DiUng','Khac'].includes(type) || !['Thap','TrungBinh','Cao'].includes(severity)) throw bookingError(400,'Loại hoặc mức độ sự cố không hợp lệ.')
        const id = await withTransaction(async client => {
            const row = await booking(req.params.id,client,true)
            requireWriter(row,req.user)
            const saved = await client.query('INSERT INTO su_co_cham_soc(ma_lich_hen,ma_nguoi_bao,loai,muc_do,mo_ta) VALUES($1,$2,$3,$4,$5) RETURNING ma_su_co', [row.ma_lich_hen,req.user.userId,type,severity,description])
            await notifyReception(client,row.ma_lich_hen,'Báo cáo sự cố chăm sóc',`Lịch #${row.ma_lich_hen}: có sự cố mức ${severity}. Vui lòng mở lịch để xử lý.`)
            return saved.rows[0].ma_su_co
        })
        res.status(201).json({ id })
    } catch(err) { next(err) }
})

export default router
