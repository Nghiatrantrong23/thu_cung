import express from 'express'
import { dangNhap, dangKy, dangXuat, lamMoiToken, layThongTinToi, capNhatThongTin, doiMatKhau } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/dang-nhap', dangNhap)
router.post('/dang-ky', dangKy)
router.post('/dang-xuat', dangXuat)
router.post('/lam-moi-token', lamMoiToken)

// Các route cần đăng nhập
router.get('/toi', authenticate, layThongTinToi)
router.put('/cap-nhat', authenticate, capNhatThongTin)
router.post('/doi-mat-khau', authenticate, doiMatKhau)

export default router
