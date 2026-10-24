import express from 'express'
import {
    layDanhSachLichHen,
    layKhungGioTrong,
    datLichOnline,
    datLichTaiQuay,
    huyLichHen,
    danhGiaLichHen, nhanVienKhaDung, xuLyLichHen,
} from '../controllers/lichhen.controller.js'
import {
    authenticate, requireRole, requireReception,
    requireCustomerOrReception, requireAppointmentReader,
} from '../middleware/auth.middleware.js'

const router = express.Router()

// Tat ca route lich hen can dang nhap
router.use(authenticate)

// Tinh khung gio trong (khach hang va le tan deu dung)
router.get('/khung-gio-trong', requireCustomerOrReception, layKhungGioTrong)

// Lay danh sach lich hen
router.get('/', requireAppointmentReader, layDanhSachLichHen)

// Khach hang tu dat lich online
router.post('/', requireRole('KhachHang'), datLichOnline)

// Le tan dat lich ho khach tai quay
router.post('/tai-quay', requireReception, datLichTaiQuay)

router.get('/:id/nhan-vien-kha-dung', requireReception, nhanVienKhaDung)
router.patch('/:id/xu-ly', requireReception, xuLyLichHen)

// Huy lich hen (khach hang huy lich cua minh, le tan/quan ly huy bat ky)
router.patch('/:id/huy', requireCustomerOrReception, huyLichHen)

// Khach hang danh gia lich hen da hoan thanh
router.post('/:id/danh-gia', requireRole('KhachHang'), danhGiaLichHen)

export default router
