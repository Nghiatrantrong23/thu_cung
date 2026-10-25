import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import { useAuth } from '../data/khoXacThuc.jsx'
import ThongBao from '../components/ThongBao.jsx'

const NAV = [
  { to: '/ho-so-thu-cung', label: 'Hồ sơ thú cưng' },
  { to: '/dat-lich', label: 'Đặt lịch' },
  { to: '/lich-hen', label: 'Lịch hẹn' },
  { to: '/hoa-don-cua-toi', label: 'Hóa đơn' },
  { to: '/thong-tin-ca-nhan', label: 'Thông tin cá nhân' },
]

const linkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
  }`

export default function CustomerLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function signOut() {
    setOpen(false)
    logout()
    navigate('/dang-nhap', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/dat-lich" className="flex items-center gap-2 text-brand-700">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100">
              <BieuTuongDauChan className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">PetCare</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-slate-500">
              Xin chào, <strong className="text-slate-700">{user.fullName}</strong>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent-500 hover:text-accent-600"
            >
              Đăng xuất
            </button>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="border-t border-slate-100 px-4 pb-4 pt-2 md:hidden" aria-label="Điều hướng chính">
            <p className="px-4 py-2 text-sm text-slate-500">
              Xin chào, <strong className="text-slate-700">{user.fullName}</strong>
            </p>
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
              <button type="button" className="rounded-full px-4 py-2 text-left text-sm font-semibold text-accent-600" onClick={signOut}>
                Đăng xuất
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <ThongBao />
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Hệ thống quản lý và đặt lịch dịch vụ chăm sóc thú cưng
      </footer>
    </div>
  )
}
