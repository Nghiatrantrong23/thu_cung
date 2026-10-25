import { useAuth } from '../../data/khoXacThuc.jsx'
import { Link } from 'react-router-dom'
import { useCallback,useEffect,useState } from 'react'
import HopThoaiXacNhan from '../../components/HopThoaiXacNhan.jsx'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'
import './QuanLyTaiKhoan.css'

const API_BASE = '/api'

// Tailwind utility classes
const inputCls =
    'rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-500 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const selectCls =
    'rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const btnPrimary =
    'rounded-lg bg-[#00877d] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#006b63] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'
const btnSecondary =
    'rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-700 transition hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400'
const btnDanger =
    'rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-100'
const btnWarning =
    'rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-amber-800 transition hover:bg-amber-100 hover:border-amber-500'

const ROLES = {
    Admin: 'Admin',
    NhanVien: 'Nhân viên',
    KhachHang: 'Khách hàng',
}

const POSITIONS = {
    'Lễ tân': 'Lễ tân',
    'Quản lý': 'Quản lý',
    'Nhân viên chăm sóc': 'Nhân viên chăm sóc',
}

function Info({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 font-bold text-slate-800">{children || <span className="text-slate-600">—</span>}</dd>
        </div>
    )
}

function TempPasswordModal({ password, onClose }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-extrabold text-slate-900">Mật khẩu tạm thời</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Lưu mật khẩu này ngay. Mật khẩu chỉ hiển thị một lần và không thể khôi phục.
                </p>
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
                    <code className="flex-1 select-all font-mono text-lg font-bold text-brand-800">{password}</code>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-lg bg-brand-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-brand-800 transition hover:bg-brand-200"
                    >
                        {copied ? '✓ Đã sao' : 'Sao chép'}
                    </button>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className={btnPrimary}>
                        Đã lưu
                    </button>
                </div>
            </div>
        </div>
    )
}

function WarningModal({ title, message, appointments, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-extrabold text-rose-700">{title}</h2>
                <p className="mt-2 text-slate-700">{message}</p>
                {appointments && appointments.length > 0 && (
                    <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white text-left">
                                <tr className="border-b border-slate-200">
                                    <th className="px-3 py-2 font-semibold text-slate-500">Mã lịch</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Khách hàng</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Ngày giờ</th>
                                    <th className="px-3 py-2 font-semibold text-slate-500">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.map((apt, idx) => (
                                    <tr key={idx} className="text-slate-700">
                                        <td className="px-3 py-2 font-mono text-xs">{apt.maLichHen}</td>
                                        <td className="px-3 py-2">{apt.tenKhachHang}</td>
                                        <td className="px-3 py-2">{apt.ngayGioHen}</td>
                                        <td className="px-3 py-2">
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                                {apt.trangThai}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button type="button" onClick={onClose} className={btnSecondary}>
                        Hủy
                    </button>
                    {onConfirm && (
                        <button type="button" onClick={onConfirm} className={btnWarning}>
                            Xác nhận khóa
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function QuanLyTaiKhoan() {
    const {apiCall}=useAuth()
    const apiFetch=useCallback(async(url,options={})=>{const result=await apiCall(url,options);return {ok:result.ok,status:result.status,json:async()=>result.ok?result.data:(result.payload||{error:result.error})}},[apiCall])
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [selected, setSelected] = useState(null)
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({})
    const [tempPassword, setTempPassword] = useState(null)
    const [lockWarning, setLockWarning] = useState(null)

    // Get access token from context or localStorage (simplified for demo)
    const getToken = () => localStorage.getItem('accessToken') || ''

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const params = new URLSearchParams()
            if (search) params.set('q', search)
            if (roleFilter) params.set('vaiTro', roleFilter)

            const res = await apiFetch(`${API_BASE}/admin/tai-khoan?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Không thể tải danh sách tài khoản')
            }

            const data = await res.json()
            const rows=data.data||[]
            setAccounts(rows)
            return rows
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    },[apiFetch,search,roleFilter])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const handleSelectAccount = (account) => {
        setSelected(account)
        setEditing(false)
        setFormData({
            tenDangNhap: account.tenDangNhap,
            email: account.email || '',
            soDienThoai: account.soDienThoai || '',
            vaiTro: account.vaiTro,
            hoTen: account.hoTen || '',
            chucVu: account.chucVu || '',
        })
    }

    const handleCreateNew = () => {
        setSelected(null)
        setEditing(true)
        setFormData({
            tenDangNhap: '',
            email: '',
            soDienThoai: '',
            vaiTro: 'NhanVien',
            hoTen: '',
            chucVu: 'Lễ tân',
        })
    }

    const handleSave = async () => {
        try {
            setError(null)
            if (selected) {
                // Update existing
                const res = await apiFetch(`${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(formData),
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Cập nhật thất bại')
                }

                const fresh=await fetchAccounts()
                setEditing(false)
                const updated = (fresh||[]).find((a) => a.maNguoiDung === selected.maNguoiDung)
                if (updated) handleSelectAccount(updated)
            } else {
                // Create new
                const res = await apiFetch(`${API_BASE}/admin/tai-khoan`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(formData),
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Tạo tài khoản thất bại')
                }

                const data = await res.json()
                setTempPassword(data.data.matKhauTam)
                await fetchAccounts()
                setEditing(false)
                setSelected(null)
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleResetPassword = async () => {
        if (!selected) return
        try {
            setError(null)
            const res = await apiFetch(`${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}/dat-lai-mat-khau`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Đặt lại mật khẩu thất bại')
            }

            const data = await res.json()
            setTempPassword(data.data.matKhauTam)
        } catch (err) {
            setError(err.message)
        }
    }

    const handleLockToggle = async (confirmed = false) => {
        if (!selected) return

        try {
            setError(null)
            const isLocked = !selected.trangThai
            const endpoint = isLocked
                ? `${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}/mo-khoa`
                : `${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}/khoa`

            const body = confirmed ? JSON.stringify({ xacNhan: true }) : undefined

            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body,
            })

            if (res.status === 409) {
                const data = await res.json()
                // Show warning modal
                setLockWarning({
                    title: data.lichDangThucHien ? 'Không thể khóa tài khoản' : 'Xác nhận khóa tài khoản',
                    message: data.thongBao || data.error,
                    appointments: data.lichDangThucHien || data.lichDaXacNhan || data.lichBiAnhHuong || [],
                    canConfirm: Boolean(data.warning),
                })
                return
            }

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Thao tác thất bại')
            }

            const fresh=await fetchAccounts()
            const updated = (fresh||[]).find((a) => a.maNguoiDung === selected.maNguoiDung)
            if (updated) handleSelectAccount(updated)
            setLockWarning(null)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="admin-accounts">
            <div className="mx-auto max-w-7xl">
                <header className="admin-accounts__heading">
                    <div>
                        <Link to="/admin" className="admin-accounts__breadcrumb">← Trang quản trị</Link>
                        <h1>Quản lý tài khoản</h1>
                        <p>Quản trị viên hệ thống</p>
                    </div>
                    <button type="button" onClick={handleCreateNew} className={btnPrimary}>+ Tạo tài khoản nhân viên</button>
                </header>

                <div className="admin-accounts__warning">
                    <span aria-hidden="true" className="admin-accounts__warning-icon">!</span>
                    <p>Khóa tài khoản hoặc đổi quyền nhân viên có thể ảnh hưởng đến các lịch hẹn đã phân công. Kiểm tra thông tin trước khi áp dụng.</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        <strong className="font-bold">Lỗi:</strong> {error}
                    </div>
                )}

                <div className="admin-accounts__content">
                    {/* Account List */}
                    <div className="admin-accounts__list">
                        <div className="admin-accounts__filters">
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${inputCls} admin-accounts__search`}
                            />
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls}>
                                <option value="">Tất cả vai trò</option>
                                {Object.entries(ROLES).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-500">Đang tải...</div>
                        ) : accounts.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">Không tìm thấy tài khoản</div>
                        ) : (
                            <div className="admin-accounts__table-scroll">
                                <table className="admin-accounts__table">
                                    <thead><tr><th>Họ tên / Email</th><th>Vai trò</th><th>Liên hệ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                                    <tbody>{accounts.map((acc) => (
                                        <tr key={acc.maNguoiDung} className={selected?.maNguoiDung === acc.maNguoiDung ? 'admin-accounts__row--selected' : ''}>
                                            <td>
                                                <button type="button" onClick={() => handleSelectAccount(acc)} className="admin-accounts__name">{acc.hoTen || acc.tenDangNhap}</button>
                                                <p className="admin-accounts__muted">{acc.email || `@${acc.tenDangNhap}`}</p>
                                            </td>
                                            <td><span className="admin-accounts__role">{ROLES[acc.vaiTro] || acc.vaiTro}</span>{acc.chucVu && <p className="admin-accounts__muted">{acc.chucVu}</p>}</td>
                                            <td><p>{acc.soDienThoai || '—'}</p><p className="admin-accounts__muted">@{acc.tenDangNhap}</p></td>
                                            <td><span className={`admin-accounts__status ${acc.trangThai ? 'admin-accounts__status--active' : 'admin-accounts__status--locked'}`}><span aria-hidden="true"/>{acc.trangThai ? 'Hoạt động' : 'Đã khóa'}</span></td>
                                            <td><button type="button" onClick={() => handleSelectAccount(acc)} className="admin-accounts__detail-button">Chi tiết</button></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="admin-account-detail">
                        {!selected && !editing ? (
                            <div className="flex items-center justify-center py-8 text-slate-500">
                                Chọn tài khoản hoặc tạo mới
                            </div>
                        ) : (
                            <div>
                                <h2 className="mb-6 text-xl font-extrabold text-slate-900">
                                    {editing && !selected ? 'Tạo tài khoản mới' : editing ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}
                                </h2>

                                {editing ? (
                                    <div className="admin-account-detail__form">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">
                                                Tên đăng nhập <span className="text-rose-700">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.tenDangNhap}
                                                onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })}
                                                disabled={!!selected}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">
                                                Họ tên <span className="text-rose-700">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.hoTen}
                                                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                value={formData.soDienThoai}
                                                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">
                                                Vai trò <span className="text-rose-700">*</span>
                                            </label>
                                            <select
                                                value={formData.vaiTro}
                                                disabled={!selected}
                                                onChange={(e) => setFormData({ ...formData, vaiTro: e.target.value })}
                                                className={selectCls}
                                            >
                                                {Object.entries(ROLES).map(([key, label]) => (
                                                    <option key={key} value={key}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {formData.vaiTro === 'NhanVien' && (
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-slate-700">
                                                    Chức vụ <span className="text-rose-700">*</span>
                                                </label>
                                                <select
                                                    value={formData.chucVu}
                                                    onChange={(e) => setFormData({ ...formData, chucVu: e.target.value })}
                                                    className={selectCls}
                                                >
                                                    {Object.entries(POSITIONS).map(([key, label]) => (
                                                        <option key={key} value={key}>
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(false)
                                                    if (!selected) setFormData({})
                                                }}
                                                className={btnSecondary}
                                            >
                                                Hủy
                                            </button>
                                            <button type="button" onClick={handleSave} className={`${btnPrimary} flex-1`}>
                                                {selected ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <dl className="admin-account-detail__fields">
                                            <Info label="Mã người dùng">{selected.maNguoiDung}</Info>
                                            <Info label="Tên đăng nhập">{selected.tenDangNhap}</Info>
                                            <Info label="Họ tên">{selected.hoTen}</Info>
                                            <Info label="Email">{selected.email}</Info>
                                            <Info label="Số điện thoại">{selected.soDienThoai}</Info>
                                            <Info label="Vai trò">{ROLES[selected.vaiTro] || selected.vaiTro}</Info>
                                            {selected.chucVu && <Info label="Chức vụ">{selected.chucVu}</Info>}
                                            <Info label="Trạng thái">
                                                {selected.trangThai ? (
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-rose-700">
                                                        <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                                                        Đã khóa
                                                    </span>
                                                )}
                                            </Info>
                                        </dl>

                                        <div className="admin-account-detail__actions">
                                            <button type="button" onClick={() => setEditing(true)} className={btnPrimary}>
                                                Chỉnh sửa
                                            </button>
                                            <button type="button" onClick={handleResetPassword} className={btnSecondary}>
                                                Đặt lại mật khẩu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleLockToggle(false)}
                                                className={selected.trangThai ? btnDanger : btnWarning}
                                            >
                                                {selected.trangThai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {tempPassword && <TempPasswordModal password={tempPassword} onClose={() => setTempPassword(null)} />}
            {lockWarning && (
                <WarningModal
                    title={lockWarning.title}
                    message={lockWarning.message}
                    appointments={lockWarning.appointments}
                    onConfirm={lockWarning.canConfirm ? () => handleLockToggle(true) : null}
                    onClose={() => setLockWarning(null)}
                />
            )}
        </div>
    )
}
