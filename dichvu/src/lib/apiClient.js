// Retry once after a shared refresh; concurrent expired requests share that refresh.
export function createApiClient({ request = fetch, getToken, onToken, onExpired }) {
  let refresh = null
  async function renew() {
    if (!refresh) refresh = (async () => {
      try {
        const response = await request('/api/auth/lam-moi-token', { method: 'POST', credentials: 'same-origin' })
        const body = await response.json()
        if (!response.ok || !body.accessToken) return false
        onToken(body.accessToken)
        return true
      } catch { return false }
    })().finally(() => { refresh = null })
    return refresh
  }
  return async (url, options = {}) => {
    try {
      async function send() {
        const token = getToken()
        return request(url, { ...options, credentials: 'same-origin', headers: {
          'Content-Type': 'application/json', ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        } })
      }
      let response = await send()
      if (response.status === 401) {
        if (await renew()) response = await send()
        else { onExpired(); return { ok: false, error: 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.', status: 401 } }
      }
      const data = await response.json()
      if (response.status === 401) onExpired()
      return response.ok ? { ok: true, data, status: response.status }
        : { ok: false, error: data.error || 'Có lỗi xảy ra.', code: data.code, status: response.status }
    } catch { return { ok: false, error: 'Không thể kết nối tới máy chủ.', status: 0 } }
  }
}
