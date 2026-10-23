import express from 'express'
import { layDanhSachDichVu } from '../controllers/dichvu.controller.js'

const router = express.Router()

// Public - khong can dang nhap
router.get('/', layDanhSachDichVu)

export default router
