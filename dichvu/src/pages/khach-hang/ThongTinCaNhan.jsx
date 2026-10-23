import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { ROLE_LABEL } from '../../lib/tienIchXacThuc.js'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400'

function Field({ label, required, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordField({ id, label, value, onChange, error, disabled, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label} required htmlFor={id} error={error}>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`${inputCls} pr-20 ${error ? 'border-red-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
          tabIndex={-1}
        >
          {show ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
    </Field>
  )
}

function Alert({ type, message }) {
  if (!message) return null
  const cls =
    type === 'success'
      ? 'bg-teal-50 border-teal-300 text-teal-800'
      : 'bg-red-50 border-red-300 text-red-800'
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${cls}`} role="alert">
      {message}
    </div>
  )
}

export default function ThongTinCaNhan() {
  const { user, apiCall, capNhatThongTin, doiMatKhau, logout } = useAuth()
  const navigate = useNavigate()

  // ------- Dữ liệu profile -------
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')

  // ------- Form cập nhật thông tin -------
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '' })
  const [formErrors, setFormErrors] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState({ type: '', text: '' })

  // ------- Form đổi mật khẩu -------
  const [mkForm, setMkForm] = useState({ matKhauHienTai: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
  const [mkErrors, setMkErrors] = useState({})
  const [savingMk, setSavingMk] = useState(false)
  const [mkMsg, setMkMsg] = useState({ type: '', text: '' })

  // Tải thông tin từ backend khi vào trang
  useEffect(() => {
    async function load() {
      setLoadingProfile(true)
      setProfileError('')
      const result = await apiCall('/api/auth/toi')
      if (!result.ok) {
        setProfileError(result.error || 'Không thể tải thông tin tài khoản.')
      } else {
        const d = result.data
        setProfile(d)
        setForm({
          hoTen: d.hoTen || '',
          email: d.email || '',
          soDienThoai: d.soDienThoai || '',
        })
      }
      setLoadingProfile(false)
    }
    load()
  }, [apiCall])

  // ------- Validate thông tin cá nhân -------
  function validateForm() {
    const e = {}
    if (!form.hoTen.trim()) e.hoTen = 'Họ tên không được để trống.'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Email không hợp lệ.'
    if (form.soDienThoai.trim() && !/^\d{10}$/.test(form.soDienThoai.trim()))
      e.soDienThoai = 'Số điện thoại phải gồm đúng 10 chữ số.'
    return e
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    setFormErrors({})
    setSavingInfo(true)
    setInfoMsg({ type: '', text: '' })

    const result = await capNhatThongTin({
      hoTen: form.hoTen.trim(),
      email: form.email.trim() || '',
      soDienThoai: form.soDienThoai.trim() || '',
    })

    setSavingInfo(false)
    if (result.ok) {
      setInfoMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' })
      // Reload profile để hiển thị dữ liệu mới nhất
      const fresh = await apiCall('/api/auth/toi')
      if (fresh.ok) setProfile(fresh.data)
    } else {
      setInfoMsg({ type: 'error', text: result.error || 'Cập nhật thất bại.' })
    }
  }

  // ------- Validate đổi mật khẩu -------
  function validateMk() {
    const e = {}
    if (!mkForm.matKhauHienTai) e.matKhauHienTai = 'Vui lòng nhập mật khẩu hiện tại.'
    if (!mkForm.matKhauMoi) e.matKhauMoi = 'Vui lòng nhập mật khẩu mới.'
    else if (mkForm.matKhauMoi.length < 8) e.matKhauMoi = 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    if (!mkForm.xacNhanMatKhauMoi) e.xacNhanMatKhauMoi = 'Vui lòng xác nhận mật khẩu mới.'
    else if (mkForm.matKhauMoi !== mkForm.xacNhanMatKhauMoi)
      e.xacNhanMatKhauMoi = 'Mật khẩu xác nhận không khớp.'
    return e
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    const errs = validateMk()
    if (Object.keys(errs).length > 0) {
      setMkErrors(errs)
      return
    }
    setMkErrors({})
    setSavingMk(true)
    setMkMsg({ type: '', text: '' })

    const result = await doiMatKhau({
      matKhauHienTai: mkForm.matKhauHienTai,
      matKhauMoi: mkForm.matKhauMoi,
      xacNhanMatKhauMoi: mkForm.xacNhanMatKhauMoi,
    })

    setSavingMk(false)
    if (result.ok) {
      setMkMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Đang đăng xuất...' })
      setMkForm({ matKhauHienTai: '', matKhauMoi: '', xacNhanMatKhauMoi: '' })
      // Đăng xuất sau 2 giây để người dùng đọc thông báo
      setTimeout(async () => {
        await logout()
        navigate('/dang-nhap', { replace: true })
      }, 2000)
    } else {
      setMkMsg({ type: 'error', text: result.error || 'Đổi mật khẩu thất bại.' })
    }
  }

  function formatDate(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return iso
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <span className="ml-3 text-slate-500">Đang tải thông tin...</span>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-bold text-red-700">Không thể tải thông tin</p>
        <p className="mt-1 text-sm text-red-600">{profileError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
        >
          Thử lại
        </button>
      </div>
    )
  }

  const vaiTroLabel = {
    KhachHang: 'Khách hàng',
    NhanVien: `Nhân viên${profile?.chucVu ? ` — ${profile.chucVu}` : ''}`,
    Admin: 'Quản trị viên',
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Thông tin cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem và cập nhật thông tin tài khoản của bạn.
        </p>
      </div>

      {/* Thẻ thông tin tổng quan (chỉ đọc) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-700">Thông tin tài khoản</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tên đăng nhập</dt>
            <dd className="mt-1 font-bold text-slate-800">{profile?.tenDangNhap}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vai trò</dt>
            <dd className="mt-1 font-bold text-slate-800">
              {vaiTroLabel[profile?.vaiTro] || profile?.vaiTro}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ngày tạo tài khoản</dt>
            <dd className="mt-1 font-bold text-slate-800">{formatDate(profile?.ngayTao)}</dd>
          </div>
        </dl>
      </section>

      {/* Form cập nhật thông tin cá nhân */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-700">Cập nhật thông tin</h2>
        <form onSubmit={handleSaveInfo} className="space-y-4" noValidate>
          <Alert type={infoMsg.type} message={infoMsg.text} />

          <Field label="Họ và tên" required htmlFor="hoTen" error={formErrors.hoTen}>
            <input
              id="hoTen"
              type="text"
              value={form.hoTen}
              onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))}
              disabled={savingInfo}
              placeholder="Nguyễn Văn A"
              className={`${inputCls} ${formErrors.hoTen ? 'border-red-400' : ''}`}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={formErrors.email}
            hint="Để trống nếu không muốn cập nhật email">
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={savingInfo}
              placeholder="example@email.com"
              className={`${inputCls} ${formErrors.email ? 'border-red-400' : ''}`}
            />
          </Field>

          <Field label="Số điện thoại" htmlFor="soDienThoai" error={formErrors.soDienThoai}
            hint="Gồm đúng 10 chữ số">
            <input
              id="soDienThoai"
              type="tel"
              value={form.soDienThoai}
              onChange={(e) => setForm((f) => ({ ...f, soDienThoai: e.target.value }))}
              disabled={savingInfo}
              placeholder="0901234567"
              className={`${inputCls} ${formErrors.soDienThoai ? 'border-red-400' : ''}`}
            />
          </Field>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingInfo}
              className="rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </section>

      {/* Form đổi mật khẩu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-slate-700">Đổi mật khẩu</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sau khi đổi mật khẩu thành công, bạn sẽ được đăng xuất và cần đăng nhập lại.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
          <Alert type={mkMsg.type} message={mkMsg.text} />

          <PasswordField
            id="matKhauHienTai"
            label="Mật khẩu hiện tại"
            value={mkForm.matKhauHienTai}
            onChange={(e) => setMkForm((f) => ({ ...f, matKhauHienTai: e.target.value }))}
            error={mkErrors.matKhauHienTai}
            disabled={savingMk}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <PasswordField
            id="matKhauMoi"
            label="Mật khẩu mới"
            value={mkForm.matKhauMoi}
            onChange={(e) => setMkForm((f) => ({ ...f, matKhauMoi: e.target.value }))}
            error={mkErrors.matKhauMoi}
            disabled={savingMk}
            placeholder="Tối thiểu 8 ký tự"
          />

          <PasswordField
            id="xacNhanMatKhauMoi"
            label="Xác nhận mật khẩu mới"
            value={mkForm.xacNhanMatKhauMoi}
            onChange={(e) => setMkForm((f) => ({ ...f, xacNhanMatKhauMoi: e.target.value }))}
            error={mkErrors.xacNhanMatKhauMoi}
            disabled={savingMk}
            placeholder="Nhập lại mật khẩu mới"
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingMk}
              className="rounded-xl bg-accent-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingMk ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}