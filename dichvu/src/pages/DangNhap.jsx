import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import { useAuth } from '../data/khoXacThuc.jsx'
import { homePath } from '../lib/tienIchXacThuc.js'

const inputCls =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

function TextField({ id, label, required, error, hint, right, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`${inputCls} ${error ? 'border-red-400' : 'border-slate-300'} ${right ? 'pr-20' : ''}`}
          {...props}
        />
        {right}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordField({ id, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <TextField
      id={id}
      type={show ? 'text' : 'password'}
      right={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
        >
          {show ? 'Ẩn' : 'Hiện'}
        </button>
      }
      {...props}
    />
  )
}

const EMPTY_REGISTER = { username: '', fullName: '', phone: '', email: '', password: '', confirm: '' }

export default function LoginPage() {
  const { user, accounts, login, register } = useAuth()

  const [tab, setTab] = useState('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState(EMPTY_REGISTER)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePath(user)} replace />

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }))
  }

  function switchTab(next) {
    setTab(next)
    setLoginError('')
    setErrors({})
    if (next === 'register') setNotice('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setNotice('')
    if (!identifier.trim() || !password) {
      setLoginError('Vui lòng nhập tên đăng nhập / email và mật khẩu.')
      return
    }
    setLoading(true)
    try {
      const res = await login(identifier, password)
      if (!res.ok) setLoginError(res.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await register(form)
      if (!res.ok) {
        setErrors({ ...res.errors, ...(res.message ? { form: res.message } : {}) })
        return
      }
      setIdentifier(form.username.trim())
      setPassword('')
      setForm(EMPTY_REGISTER)
      setErrors({})
      setLoginError('')
      setNotice('Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo.')
      setTab('login')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(a) {
    setIdentifier(a.username)
    setPassword(a.password)
    setLoginError('')
    setNotice('')
  }

  const tabCls = (active) =>
    `flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold tracking-normal transition ${
      active ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500 hover:text-brand-700'
    }`

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <BieuTuongDauChan className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold uppercase leading-snug tracking-wide text-slate-800">
            Hệ thống quản lý và đặt lịch
            <br />
            dịch vụ chăm sóc thú cưng
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div role="tablist" aria-label="Đăng nhập hoặc đăng ký" className="flex gap-1 rounded-full bg-slate-100 p-1">
            <button role="tab" id="tab-login" aria-selected={tab === 'login'} aria-controls="panel-login" className={tabCls(tab === 'login')} onClick={() => switchTab('login')}>
              Đăng nhập
            </button>
            <button role="tab" id="tab-register" aria-selected={tab === 'register'} aria-controls="panel-register" className={tabCls(tab === 'register')} onClick={() => switchTab('register')}>
              Đăng ký
            </button>
          </div>

          {tab === 'login' ? (
            <form id="panel-login" role="tabpanel" aria-labelledby="tab-login" onSubmit={handleLogin} noValidate className="mt-6 space-y-5">
              {notice && (
                <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {notice}
                </p>
              )}
              {loginError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <strong>Lỗi:</strong> {loginError}
                </p>
              )}

              <TextField
                id="identifier"
                label="Tên đăng nhập / Email:"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <div>
                <PasswordField
                  id="password"
                  label="Mật khẩu:"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Link to="/quen-mat-khau" className="mt-2 inline-block text-sm font-bold text-brand-700 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-brand-700 px-6 py-3 text-sm font-extrabold tracking-normal text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60">
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <div className="space-y-1.5 text-center text-sm text-slate-600">
                <p>
                  Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => switchTab('register')} className="font-extrabold text-brand-700 hover:underline">
                    Đăng ký ngay
                  </button>
                </p>
                <p>
                  Xem{' '}
                  <Link to="/bang-gia" className="font-extrabold text-brand-700 hover:underline">
                    bảng giá dịch vụ
                  </Link>{' '}
                  (không cần đăng nhập)
                </p>
              </div>
            </form>
          ) : (
            <form id="panel-register" role="tabpanel" aria-labelledby="tab-register" onSubmit={handleRegister} noValidate className="mt-6 space-y-5">
              <TextField id="r-username" label="Tên đăng nhập:" required autoComplete="username" value={form.username} onChange={setField('username')} error={errors.username} />
              <TextField id="r-fullName" label="Họ tên:" required autoComplete="name" value={form.fullName} onChange={setField('fullName')} error={errors.fullName} />
              <TextField id="r-phone" label="Số điện thoại:" required type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" value={form.phone} onChange={setField('phone')} error={errors.phone} hint="Gồm 10 chữ số" />
              <TextField id="r-email" label="Email:" type="email" autoComplete="email" value={form.email} onChange={setField('email')} error={errors.email} />
              <PasswordField id="r-password" label="Mật khẩu:" required autoComplete="new-password" value={form.password} onChange={setField('password')} error={errors.password} hint="Tối thiểu 8 ký tự" />
              <PasswordField id="r-confirm" label="Nhập lại mật khẩu:" required autoComplete="new-password" value={form.confirm} onChange={setField('confirm')} error={errors.confirm} />

              <button type="submit" disabled={loading} className="w-full rounded-full bg-brand-700 px-6 py-3 text-sm font-extrabold tracking-normal text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60">
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>

              {errors.form && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <strong>Không thể đăng ký:</strong> {errors.form}
                </p>
              )}

              <p className="text-center text-sm text-slate-600">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => switchTab('login')} className="font-extrabold text-brand-700 hover:underline">
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>

        {tab === 'login' && (
          <details className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm">
            <summary className="cursor-pointer font-bold text-slate-600">Tài khoản dùng thử (chỉ có trong bản demo)</summary>
            <ul className="mt-3 divide-y divide-slate-100">
              {accounts
                .filter((a) => a.password)
                .map((a) => (
                  <li key={a.username} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="font-bold text-slate-800">{a.username}</span>
                      <span className="text-slate-500"> / {a.password}</span>
                      <span className="block text-xs text-slate-500">
                        {a.title ?? a.role}
                        {a.locked ? ' (đã khóa)' : ''}
                      </span>
                    </span>
                    <button type="button" onClick={() => fillDemo(a)} className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:border-brand-600 hover:text-brand-700">
                      Điền
                    </button>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
