import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../data/khoXacThuc.jsx'
import { homePath } from '../lib/tienIchXacThuc.js'

export default function DoiMatKhauTam() {
  const { user, doiMatKhau, logout } = useAuth()
  const [form, setForm] = useState({ matKhauHienTai: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!user) return <Navigate to="/dang-nhap" replace />
  if (!user.mustChangePassword) return <Navigate to={homePath(user)} replace />
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    const result = await doiMatKhau(form)
    if (result.ok) await logout()
    else setError(result.error)
    setBusy(false)
  }
  return <main className="mx-auto my-12 max-w-md rounded-2xl bg-white p-6 shadow-sm">
    <h1 className="text-xl font-extrabold">Đổi mật khẩu tạm</h1>
    <p className="my-3 text-sm text-slate-600">Bạn cần đặt mật khẩu riêng trước khi sử dụng tài khoản. Sau khi đổi, hãy đăng nhập lại.</p>
    <form onSubmit={submit} className="space-y-4">
      {Object.entries({ matKhauHienTai: 'Mật khẩu tạm', matKhauMoi: 'Mật khẩu mới', xacNhanMatKhauMoi: 'Nhập lại mật khẩu mới' }).map(([key, label]) => <label key={key} className="block font-bold">{label}
        <input type="password" required minLength={8} autoComplete={key === 'matKhauHienTai' ? 'current-password' : 'new-password'} value={form[key]} disabled={busy} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
      </label>)}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="rounded-full bg-brand-700 px-5 py-3 font-bold text-white">{busy ? 'Đang lưu...' : 'Lưu mật khẩu mới'}</button>
      <button type="button" disabled={busy} onClick={logout} className="ml-4 font-bold">Đăng xuất</button>
    </form>
  </main>
}
