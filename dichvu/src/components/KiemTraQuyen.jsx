import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../data/khoXacThuc.jsx'
import { homePath } from '../lib/tienIchXacThuc.js'

// Chặn trang khi chưa đăng nhập, và đưa người dùng về đúng trang của vai trò mình nếu vào nhầm khu vực.
export default function RequireRole({ roleKey, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
  const allowed = Array.isArray(roleKey) ? roleKey.includes(user.roleKey) : user.roleKey === roleKey
  if (!allowed) return <Navigate to={homePath(user)} replace />
  return children
}
