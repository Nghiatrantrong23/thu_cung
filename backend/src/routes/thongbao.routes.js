import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { query } from '../config/db.js'
import { integerId } from '../services/dispatch.js'

const router = express.Router()
router.use(authenticate)
router.get('/', async (req, res, next) => {
    try {
        const result = await query(`SELECT ma_thong_bao AS id,ma_lich_hen AS "bookingId",tieu_de AS title,
            noi_dung AS message,da_doc AS read,ngay_tao AS "createdAt" FROM thong_bao
            WHERE ma_nguoi_nhan=$1 ORDER BY ngay_tao DESC,ma_thong_bao DESC LIMIT 50`, [req.user.userId])
        res.json({ thongBao: result.rows })
    } catch (err) { next(err) }
})
router.patch('/:id/da-doc', async (req, res, next) => {
    try {
        const result = await query('UPDATE thong_bao SET da_doc=true WHERE ma_thong_bao=$1 AND ma_nguoi_nhan=$2 RETURNING ma_thong_bao',
            [integerId(req.params.id), req.user.userId])
        if (!result.rowCount) return res.status(404).json({ error: 'Không tìm thấy thông báo.' })
        res.json({ message: 'Đã đánh dấu đọc.' })
    } catch (err) { next(err) }
})
export default router
