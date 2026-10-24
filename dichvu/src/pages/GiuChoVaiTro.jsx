import { Link, useNavigate } from 'react-router-dom'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import { useAuth } from '../data/khoXacThuc.jsx'
import { ROLE_LABEL } from '../lib/tienIchXacThuc.js'
import ThongBao from '../components/ThongBao.jsx'

// Giữ chỗ cho giao diện nhân sự (Admin, Quản lý, Lễ tân, Nhân viên)
export default function RolePlaceholder() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function signOut() {
    logout()
    navigate('/dang-nhap', { replace: true })
  }

  const isStaffBookingAllowed = ['reception', 'manager', 'admin'].includes(user?.roleKey)

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
          <BieuTuongDauChan className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-800">Xin chào, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">
          Bạn đang đăng nhập với vai trò <strong className="text-brand-700">{ROLE_LABEL[user.roleKey]}</strong>.
        </p>

        {isStaffBookingAllowed && (
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 p-5 text-left">
            <h2 className="text-base font-bold text-brand-900">Tiếp nhận và điều phối</h2>
            <p className="mt-1 text-sm text-brand-700">
              Bạn có thể tiếp nhận khách hàng và đặt lịch trực tiếp tại quầy:
            </p>
            <Link
              to="/le-tan/dat-lich-tai-quay"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 shadow-sm"
            >
              <span>+ Đặt lịch tại quầy (MH-02b)</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link to="/le-tan/lich-hen" className="mt-3 inline-block rounded-full border border-brand-600 px-5 py-2.5 font-bold text-brand-800">Quản lý lịch hẹn và phân công</Link>
          </div>
        )}

        {user.roleKey==='care'&&<Link to="/nhan-vien/lich-lam-viec" className="mt-4 block rounded-full bg-brand-700 p-3 font-bold text-white">Lịch làm việc và chăm sóc thú cưng</Link>}
        {['manager','admin'].includes(user.roleKey)&&<Link to="/quan-ly/ca-lam-viec" className="mt-4 block rounded-full border border-brand-600 p-3 font-bold text-brand-800">Quản lý ca làm việc</Link>}
        <ThongBao />
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-600 transition hover:border-accent-500 hover:text-accent-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}
