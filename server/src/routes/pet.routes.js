import express from 'express'
import {
    layDanhSachThuCung,
    layChiTietThuCung,
    themThuCung,
    capNhatThuCung,
    doiTrangThaiThuCung,
    traCuuKhachHang,
} from '../controllers/pet.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Tat ca route thu cung deu can dang nhap
router.use(authenticate)

// CRUD Thu cung (GET /api/thu-cung, POST /api/thu-cung, ...)
router.get('/', layDanhSachThuCung)
router.get('/:id', layChiTietThuCung)
router.post('/', themThuCung)
router.put('/:id', capNhatThuCung)
router.patch('/:id/trang-thai', doiTrangThaiThuCung)

export default router

// Tra cuu khach hang (GET /api/khach-hang/tra-cuu?sdt=...)
export { traCuuKhachHang }
