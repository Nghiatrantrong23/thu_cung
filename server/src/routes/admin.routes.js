import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'
import * as adminController from '../controllers/admin.controller.js'

const router = express.Router()

// All admin routes require authentication and Admin role
router.use(authenticate, requireAdmin)

// Account management endpoints
router.get('/tai-khoan', adminController.layDanhSachTaiKhoan)
router.post('/tai-khoan', adminController.taoTaiKhoan)
router.patch('/tai-khoan/:id', adminController.capNhatTaiKhoan)

// Account status operations
router.post('/tai-khoan/:id/khoa', adminController.khoaTaiKhoan)
router.post('/tai-khoan/:id/mo-khoa', adminController.moKhoaTaiKhoan)
router.post('/tai-khoan/:id/dat-lai-mat-khau', adminController.datLaiMatKhau)

export default router
