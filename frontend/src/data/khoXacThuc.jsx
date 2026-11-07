import { createApiClient } from '../lib/apiClient.js'
import { registerAccount } from '../lib/dangKy.js'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { seedAccounts } from './duLieuMau.js'
import { publicUser } from '../lib/tienIchXacThuc.js'

const AuthContext = createContext(null)
const KEY_USER = 'petcare.session'
const KEY_TOKEN = 'petcare.token'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function loadToken() {
  try {
    return sessionStorage.getItem(KEY_TOKEN) || ''
  } catch {
    return ''
  }
}
function saveSession(user, token) {
  try {
    if (user) {
      sessionStorage.setItem(KEY_USER, JSON.stringify(user))
      sessionStorage.setItem(KEY_TOKEN, token || '')
      localStorage.setItem('accessToken', token || '')
    } else {
      sessionStorage.removeItem(KEY_USER)
      sessionStorage.removeItem(KEY_TOKEN)
      localStorage.removeItem('accessToken')
    }
  } catch {
    /* bỏ qua */
  }
}

export function AuthProvider({ children }) {
  const accounts = seedAccounts
  const [user, setUser] = useState(loadSession)
  const [token, setToken] = useState(loadToken)

  const userRef = useRef(user)
  userRef.current = user
  const apiCall = useMemo(() => createApiClient({
    getToken: loadToken,
    onToken: (value) => { setToken(value); saveSession(userRef.current, value) },
    onExpired: () => { setUser(null); setToken(''); saveSession(null, '') },
  }), [])

  const login = useCallback(
    async (identifier, password) => {
      try {
        const res = await fetch('/api/auth/dang-nhap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenDangNhap: identifier, matKhau: password }),
        })
        const data = await res.json()
        if (!res.ok) {
          return { ok: false, message: data.error || 'Đăng nhập không thành công.' }
        }

        const role = data.user.vaiTro === 'NhanVien' ? 'Nhân viên' : data.user.vaiTro
        const account = {
          id: data.user.maNguoiDung,
          username: data.user.tenDangNhap,
          fullName: data.user.hoTen,
          email: data.user.email,
          role: role,
          title: data.user.chucVu,
          mustChangePassword: Boolean(data.user.batDoiMatKhau),
        }
        const u = publicUser(account)
        setUser(u)
        setToken(data.accessToken)
        saveSession(u, data.accessToken)
        return { ok: true, user: u }
      } catch (err) {
        console.error('[auth] Lỗi kết nối server:', err)
        return { ok: false, message: 'Không thể kết nối tới máy chủ backend (port 5000).' }
      }
    },
    [],
  )

  const register = useCallback((form) => registerAccount(form), [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/dang-xuat', { method: 'POST' })
    } catch {
      /* ignore */
    }
    setUser(null)
    setToken('')
    saveSession(null, '')
  }, [])

  const capNhatThongTin = useCallback(
    async ({ hoTen, email, soDienThoai }) => {
      const result = await apiCall('/api/auth/cap-nhat', {
        method: 'PUT',
        body: JSON.stringify({ hoTen, email, soDienThoai }),
      })
      if (result.ok && user) {
        const updated = { ...user, fullName: hoTen, email }
        setUser(updated)
        saveSession(updated, token)
      }
      return result
    },
    [apiCall, user, token],
  )

  const doiMatKhau = useCallback(
    async ({ matKhauHienTai, matKhauMoi, xacNhanMatKhauMoi }) => {
      return apiCall('/api/auth/doi-mat-khau', {
        method: 'POST',
        body: JSON.stringify({ matKhauHienTai, matKhauMoi, xacNhanMatKhauMoi }),
      })
    },
    [apiCall],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      accounts,
      apiCall,
      login,
      register,
      logout,
      capNhatThongTin,
      doiMatKhau,
    }),
    [user, token, accounts, apiCall, login, register, logout, capNhatThongTin, doiMatKhau],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider')
  return ctx
}