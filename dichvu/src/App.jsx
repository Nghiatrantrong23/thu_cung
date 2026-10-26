import StaffLayout from './layouts/StaffLayout.jsx'
import {lazy,Suspense} from 'react'
import BaoCao from './pages/quan-ly/BaoCao.jsx'
import DichVu from './pages/quan-ly/DichVu.jsx'
import QuanLyTaiKhoan from './pages/admin/QuanLyTaiKhoan.jsx'
import KhieuNai from './pages/le-tan/KhieuNai.jsx'
import InHoanTien from './pages/le-tan/InHoanTien.jsx'
import HoaDon from './pages/le-tan/HoaDon.jsx'
import InHoaDon from './pages/le-tan/InHoaDon.jsx'
import ChamSoc from './pages/nhan-vien/ChamSoc.jsx'
import CaLamViec from './pages/quan-ly/CaLamViec.jsx'
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
import HoaDonCuaToi from './pages/khach-hang/HoaDonCuaToi.jsx'
import KhieuNaiCuaToi from './pages/khach-hang/KhieuNaiCuaToi.jsx'
import TongQuan from './pages/khach-hang/TongQuan.jsx'
import DatLichTaiQuay from './pages/le-tan/DatLichTaiQuay.jsx'
import DangPhatTrien from './pages/DangPhatTrien.jsx'
import QuanLyLichHen from './pages/le-tan/QuanLyLichHen.jsx'
import DoiMatKhauTam from './pages/DoiMatKhauTam.jsx'
const ComponentLab=import.meta.env.DEV?lazy(()=>import('./pages/ComponentLab.jsx')):null

export default function App() {
  return (
    <Routes>
      {import.meta.env.DEV&&<Route path="__ui" element={<Suspense fallback={<p>Đang tải mẫu giao diện…</p>}><ComponentLab/></Suspense>}/>}
      {/* Công khai */}
      <Route path="dang-nhap" element={<DangNhap />} />
      <Route path="doi-mat-khau" element={<DoiMatKhauTam />} />
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
        <Route path="tong-quan" element={<TongQuan />} />
        <Route path="dat-lich" element={<DatLich />} />
        <Route path="lich-hen" element={<DanhSachLichHen />} />
        <Route path="ho-so-thu-cung" element={<HoSoThuCung />} />
        <Route path="thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
        <Route path="hoa-don-cua-toi" element={<HoaDonCuaToi />} />
        <Route path="khieu-nai-cua-toi" element={<KhieuNaiCuaToi />} />
      </Route>

      {/* Lễ tân / Quản lý / Admin đặt lịch tại quầy (MH-02b) */}
      <Route path="le-tan/lich-hen" element={<KiemTraQuyen roleKey={['reception', 'manager', 'admin']}><StaffLayout><QuanLyLichHen /></StaffLayout></KiemTraQuyen>} />
      <Route
        path="le-tan/dat-lich-tai-quay"
        element={
          <KiemTraQuyen roleKey={['reception', 'manager', 'admin']}><StaffLayout>
            <div className="bg-slate-50 py-8 px-4">
              <DatLichTaiQuay />
            </div>
          </StaffLayout></KiemTraQuyen>
        }
      />

      <Route path="nhan-vien/lich-lam-viec" element={<KiemTraQuyen roleKey="care"><StaffLayout><ChamSoc/></StaffLayout></KiemTraQuyen>}/>
      <Route path="quan-ly/ca-lam-viec" element={<KiemTraQuyen roleKey={['manager','admin']}><StaffLayout><CaLamViec/></StaffLayout></KiemTraQuyen>}/>

      <Route path="le-tan/hoa-don" element={<KiemTraQuyen roleKey={['reception','manager','admin']}><StaffLayout><HoaDon/></StaffLayout></KiemTraQuyen>}/>
      <Route path="le-tan/hoa-don/:id/in" element={<KiemTraQuyen roleKey={['customer','reception','manager','admin']}><InHoaDon/></KiemTraQuyen>}/>

      <Route path="le-tan/khieu-nai" element={<KiemTraQuyen roleKey={['reception','manager','admin']}><StaffLayout><KhieuNai/></StaffLayout></KiemTraQuyen>}/>
      <Route path="le-tan/khieu-nai/:id/in" element={<KiemTraQuyen roleKey={['customer','reception','manager','admin']}><InHoanTien/></KiemTraQuyen>}/>

      <Route path="quan-ly/bao-cao" element={<KiemTraQuyen roleKey={['manager','admin']}><StaffLayout><BaoCao/></StaffLayout></KiemTraQuyen>}/>
      <Route path="quan-ly/dich-vu" element={<KiemTraQuyen roleKey={['manager','admin']}><StaffLayout><DichVu/></StaffLayout></KiemTraQuyen>}/>
      <Route path="admin/tai-khoan" element={<KiemTraQuyen roleKey="admin"><StaffLayout><QuanLyTaiKhoan/></StaffLayout></KiemTraQuyen>}/>

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
            <KiemTraQuyen roleKey={key}><StaffLayout>
              <GiuChoVaiTro />
            </StaffLayout></KiemTraQuyen>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
    </Routes>
  )
}
