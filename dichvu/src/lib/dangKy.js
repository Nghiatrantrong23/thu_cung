import { validateRegister } from './tienIchXacThuc.js'

export async function registerAccount(form, request = fetch) {
  // Only the backend knows which accounts exist; demo accounts are not authoritative.
  const errors = validateRegister(form, [])
  if (Object.keys(errors).length) return { ok: false, errors }
  try {
    const response = await request('/api/auth/dang-ky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, fullName: form.fullName,
        phone: form.phone, email: form.email, password: form.password }),
    })
    const data = await response.json()
    if (!response.ok) {
      const message = data.error || 'Đăng ký không thành công. Vui lòng thử lại.'
      return { ok: false, errors: { form: message }, message }
    }
    return { ok: true }
  } catch {
    const message = 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    return { ok: false, errors: { form: message }, message }
  }
}
