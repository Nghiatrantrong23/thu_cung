// Quy tắc xác thực và đăng ký (MH-01). Khi có backend, các hàm này chuyển sang phía server.
export const LOGIN_FAILED = 'Tài khoản hoặc mật khẩu không đúng.'
export const ACCOUNT_LOCKED = 'Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng để được hỗ trợ.'

const norm = (s) => String(s ?? '').trim().toLowerCase()

// Đăng nhập bằng tên đăng nhập hoặc email. Thông báo lỗi chung để không lộ tài khoản nào tồn tại;
// chỉ báo "bị khóa" khi mật khẩu đã đúng.
export function authenticate(accounts, identifier, password) {
  const id = norm(identifier)
  const acc = accounts.find((a) => norm(a.username) === id || (a.email && norm(a.email) === id))
  if (!acc || acc.password !== password) return { ok: false, message: LOGIN_FAILED }
  if (acc.locked) return { ok: false, message: ACCOUNT_LOCKED }
  return { ok: true, account: acc }
}

export function validateRegister(form, accounts) {
  const e = {}
  const username = form.username.trim()
  const email = form.email.trim()
  const phone = form.phone.trim()

  if (!username) e.username = 'Vui lòng nhập tên đăng nhập.'
  else if (!/^[A-Za-z0-9._]{4,30}$/.test(username))
    e.username = 'Từ 4 đến 30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc gạch dưới.'
  else if (accounts.some((a) => norm(a.username) === norm(username))) e.username = 'Tên đăng nhập đã được sử dụng.'

  if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên.'

  if (!phone) e.phone = 'Vui lòng nhập số điện thoại.'
  else if (!/^\d{10}$/.test(phone)) e.phone = 'Số điện thoại gồm đúng 10 chữ số.'
  else if (accounts.some((a) => a.phone === phone)) e.phone = 'Số điện thoại đã được đăng ký.'

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ.'
    else if (accounts.some((a) => a.email && norm(a.email) === norm(email))) e.email = 'Email đã được đăng ký.'
  }

  if (!form.password) e.password = 'Vui lòng nhập mật khẩu.'
  else if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự.'

  if (!form.confirm) e.confirm = 'Vui lòng nhập lại mật khẩu.'
  else if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp.'

  return e
}

export function newCustomerAccount(form) {
  return {
    username: form.username.trim(),
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    password: form.password,
    role: 'Khách hàng',
    title: null,
    locked: false,
  }
}

// Khóa vai trò dùng để phân luồng giao diện: khách hàng hoặc 4 nhóm nhân sự.
export function roleKey(acc) {
  if (acc.role === 'Admin') return 'admin'
  if (acc.role === 'Nhân viên') {
    if (acc.title === 'Quản lý') return 'manager'
    if (acc.title === 'Lễ tân') return 'reception'
    return 'care'
  }
  return 'customer'
}

const HOME = { customer: '/tong-quan', admin: '/admin', manager: '/quan-ly', reception: '/le-tan', care: '/nhan-vien' }
export const ROLE_LABEL = {
  customer: 'Khách hàng',
  admin: 'Quản trị viên',
  manager: 'Quản lý cửa hàng',
  reception: 'Lễ tân',
  care: 'Nhân viên chăm sóc',
}

export function homePath(acc) {
  return acc.mustChangePassword ? '/doi-mat-khau' : HOME[roleKey(acc)]
}

// Không bao giờ giữ mật khẩu trong phiên đăng nhập.
export function publicUser(acc) {
  const { password, ...rest } = acc
  return { ...rest, roleKey: roleKey(acc) }
}
