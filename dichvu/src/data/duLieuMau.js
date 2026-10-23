import { addDays } from '../lib/tinhGioTrong.js'

// Dữ liệu giả. Khi có backend, thay bằng gọi REST API (GET /me, /pets, /services, /appointments).

// Tài khoản mẫu (mật khẩu để dạng chữ thường chỉ vì đây là dữ liệu giả; backend thật phải băm mật khẩu).
export const seedAccounts = [
  { username: 'admin', fullName: 'Lê Văn Quản Trị', phone: '0900000001', email: '', password: 'admin123', role: 'Admin', title: null, locked: false },
  { username: 'quanly01', fullName: 'Hoàng Văn Chủ', phone: '0900000005', email: '', password: 'quanly123', role: 'Nhân viên', title: 'Quản lý', locked: false },
  { username: 'letan01', fullName: 'Phạm Thị Mai', phone: '0900000002', email: '', password: 'letan123', role: 'Nhân viên', title: 'Lễ tân', locked: false },
  { username: 'nhanvien01', fullName: 'Lê Văn B', phone: '0900000003', email: '', password: 'nhanvien123', role: 'Nhân viên', title: 'Nhân viên chăm sóc', locked: false },
  { username: 'nguyenan', fullName: 'Nguyễn An', phone: '0912345678', email: 'an@email.com', password: '12345678', role: 'Khách hàng', title: null, locked: false },
  { username: 'khachkhoa', fullName: 'Khách Bị Khóa', phone: '0911111111', email: '', password: '12345678', role: 'Khách hàng', title: null, locked: true },
]

// Thú cưng thuộc về một khách (owner = tên đăng nhập). Dữ liệu mẫu theo MH-11.
export const seedPets = [
  { id: 1, owner: 'nguyenan', name: 'Bé Mướp', species: 'Mèo', breed: 'Mèo ta', gender: 'Cái', birthDate: '2024-03-12', weightKg: 4.2, healthNote: 'Dị ứng sữa tắm hương hoa.', active: true },
  { id: 2, owner: 'nguyenan', name: 'Bé Lu', species: 'Chó', breed: 'Poodle', gender: 'Đực', birthDate: '2023-06-05', weightKg: 6.5, healthNote: '', active: true },
]

export const services = [
  { id: 'tam-say', name: 'Tắm sấy', durationMin: 60, price: 150000 },
  { id: 'cat-tia', name: 'Cắt tỉa lông', durationMin: 90, price: 250000 },
  { id: 'spa', name: 'Spa thư giãn', durationMin: 120, price: 400000 },
]

// Lịch hẹn của khách khác (owner: null) chỉ dùng để chiếm chỗ khi tính giờ trống (tính theo ngày hiện tại).
// Lịch của khách nguyenan lấy đúng theo dữ liệu mẫu trong đặc tả MH-03.
export function seedBookings() {
  const d3 = addDays(3)
  const d4 = addDays(4)
  const other = (id, date, start, end, status) => ({ id, date, start, end, status, owner: null })

  return [
    other(201, d3, '08:00', '10:00', 'Đã xác nhận'),
    other(202, d3, '08:00', '09:00', 'Đã xác nhận'),
    other(203, d3, '13:00', '15:00', 'Đã xác nhận'),
    other(204, d3, '13:00', '15:00', 'Chờ xác nhận'),
    other(205, d4, '14:00', '15:30', 'Đã xác nhận'),
    other(206, d4, '14:00', '16:00', 'Đã xác nhận'),

    {
      id: 101, owner: 'nguyenan', petId: 1, petName: 'Bé Mướp', species: 'Mèo', serviceNames: ['Tắm sấy'],
      date: '2026-10-20', start: '09:00', end: '10:00', duration: 60, total: 150000,
      status: 'Chờ xác nhận', staff: null, note: 'Bé hơi nhát nước.', review: null,
    },
    {
      id: 98, owner: 'nguyenan', petId: 2, petName: 'Bé Lu', species: 'Chó', serviceNames: ['Cắt tỉa lông'],
      date: '2026-10-21', start: '14:00', end: '15:30', duration: 90, total: 250000,
      status: 'Đã xác nhận', staff: 'Lê Văn B', note: '', review: null,
    },
    {
      id: 90, owner: 'nguyenan', petId: 1, petName: 'Bé Mướp', species: 'Mèo', serviceNames: ['Spa thư giãn'],
      date: '2026-10-12', start: '10:00', end: '12:00', duration: 120, total: 400000,
      status: 'Hoàn thành', staff: 'Lê Văn B', note: '', review: null,
    },
    {
      id: 85, owner: 'nguyenan', petId: 2, petName: 'Bé Lu', species: 'Chó', serviceNames: ['Tắm sấy'],
      date: '2026-10-05', start: '08:00', end: '09:00', duration: 60, total: 150000,
      status: 'Đã hủy', staff: null, note: '', review: null,
    },
  ]
}
