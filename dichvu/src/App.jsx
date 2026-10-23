import { Navigate, Route, Routes } from 'react-router-dom'
import KhungKhachHang from './layouts/KhungKhachHang.jsx'
import KiemTraQuyen from './components/KiemTraQuyen.jsx'
import DangNhap from './pages/DangNhap.jsx'
import BangGia from './pages/BangGia.jsx'
import GiuChoVaiTro from './pages/GiuChoVaiTro.jsx'
import DatLich from './pages/khach-hang/DatLich.jsx'
import DanhSachLichHen from './pages/khach-hang/DanhSachLichHen.jsx'
import HoSoThuCung from './pages/khach-hang/HoSoThuCung.jsx'
import ThongTinCaNhan from './pages/khach-hang/ThongTinCaNhan.jsx'
import DatLichTaiQuay from './pages/le-tan/DatLichTaiQuay.jsx'
import DangPhatTrien from './pages/DangPhatTrien.jsx'

export default function App() {
  return (
    <Routes>
      {/* Công khai */}
      <Route path="dang-nhap" element={<DangNhap />} />
      <Route path="bang-gia" element={<BangGia />} />
      <Route
        path="quen-mat-khau"
        element={<DangPhatTrien title="Quên mật khẩu" backTo="/dang-nhap" backLabel="Về trang Đăng nhập" />}
      />

      {/* Khách hàng */}
      <Route
        element={
          <KiemTraQuyen roleKey="customer">
            <KhungKhachHang />
          </KiemTraQuyen>
        }
      >
        <Route path="dat-lich" element={<DatLich />} />
        <Route path="lich-hen" element={<DanhSachLichHen />} />
        <Route path="ho-so-thu-cung" element={<HoSoThuCung />} />
        <Route path="thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
      </Route>

      {/* Lễ tân / Quản lý / Admin đặt lịch tại quầy (MH-02b) */}
      <Route
        path="le-tan/dat-lich-tai-quay"
        element={
          <KiemTraQuyen roleKey={['reception', 'manager', 'admin']}>
            <div className="min-h-screen bg-slate-50 py-8 px-4">
              <DatLichTaiQuay />
            </div>
          </KiemTraQuyen>
        }
      />

      {/* Nhân sự: giữ chỗ, sẽ làm các giao diện riêng sau */}
      {[
        ['admin', 'admin'],
        ['quan-ly', 'manager'],
        ['le-tan', 'reception'],
        ['nhan-vien', 'care'],
      ].map(([path, key]) => (
        <Route
          key={path}
          path={path}
          element={
            <KiemTraQuyen roleKey={key}>
              <GiuChoVaiTro />
            </KiemTraQuyen>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
    </Routes>
  )
}
