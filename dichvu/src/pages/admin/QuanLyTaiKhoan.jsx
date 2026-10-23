import { useEffect, useState } from 'react'
import HopThoaiXacNhan from '../../components/HopThoaiXacNhan.jsx'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'

const API_BASE = 'http://localhost:5000/api'

// Tailwind utility classes
const inputCls =
    'rounded-lg border border-slate-700/30 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
const selectCls =
    'rounded-lg border border-slate-700/30 bg-slate-800/50 px-3.5 py-2.5 text-slate-100 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
const btnPrimary =
    'rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500'
const btnSecondary =
    'rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-300 transition hover:border-sky-500 hover:text-sky-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600'
const btnDanger =
    'rounded-lg border border-rose-600/50 bg-rose-900/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-rose-400 transition hover:bg-rose-900/40 hover:border-rose-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600 disabled:bg-slate-800/30'
const btnWarning =
    'rounded-lg border border-amber-600/50 bg-amber-900/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-amber-400 transition hover:bg-amber-900/40 hover:border-amber-500'

const ROLES = {
    Admin: 'Admin',
    NhanVien: 'Nhân viên',
    KhachHang: 'Khách hàng',
}

const POSITIONS = {
    'Lễ tân': 'Lễ tân',
    'Quản lý': 'Quản lý',
    'Nhân viên chăm sóc': 'Nhân viên chăm sóc',
    'Bác sĩ thú y': 'Bác sĩ thú y',
    Groomer: 'Groomer',
}

function Info({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 font-bold text-slate-200">{children || <span className="text-slate-600">—</span>}</dd>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-extrabold text-slate-100">Mật khẩu tạm thời</h2>
                <p className="mt-2 text-sm text-slate-400">
                    Lưu mật khẩu này ngay. Mật khẩu chỉ hiển thị một lần và không thể khôi phục.
                </p>
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-sky-700/50 bg-sky-950/30 p-4">
                    <code className="flex-1 select-all font-mono text-lg font-bold text-sky-300">{password}</code>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-lg bg-sky-700/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-sky-200 transition hover:bg-sky-600"
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-2xl rounded-2xl border border-rose-700/50 bg-slate-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-extrabold text-rose-400">{title}</h2>
                <p className="mt-2 text-slate-300">{message}</p>
                {appointments && appointments.length > 0 && (
                    <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-700/50 bg-slate-950/50">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900 text-left">
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-3 py-2 font-semibold text-slate-400">Mã lịch</th>
                                    <th className="px-3 py-2 font-semibold text-slate-400">Khách hàng</th>
                                    <th className="px-3 py-2 font-semibold text-slate-400">Ngày giờ</th>
                                    <th className="px-3 py-2 font-semibold text-slate-400">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {appointments.map((apt, idx) => (
                                    <tr key={idx} className="text-slate-300">
                                        <td className="px-3 py-2 font-mono text-xs">{apt.maLichHen}</td>
                                        <td className="px-3 py-2">{apt.tenKhachHang}</td>
                                        <td className="px-3 py-2">{apt.ngayGioHen}</td>
                                        <td className="px-3 py-2">
                                            <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
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

    const fetchAccounts = async () => {
        try {
            setLoading(true)
            setError(null)
            const params = new URLSearchParams()
            if (search) params.set('q', search)
            if (roleFilter) params.set('vaiTro', roleFilter)

            const res = await fetch(`${API_BASE}/admin/tai-khoan?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Không thể tải danh sách tài khoản')
            }

            const data = await res.json()
            setAccounts(data.taiKhoan || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [search, roleFilter])

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
                const res = await fetch(`${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}`, {
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

                await fetchAccounts()
                setEditing(false)
                const updated = accounts.find((a) => a.maNguoiDung === selected.maNguoiDung)
                if (updated) handleSelectAccount(updated)
            } else {
                // Create new
                const res = await fetch(`${API_BASE}/admin/tai-khoan`, {
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
                setTempPassword(data.matKhauTam)
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
            const res = await fetch(`${API_BASE}/admin/tai-khoan/${selected.maNguoiDung}/dat-lai-mat-khau`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Đặt lại mật khẩu thất bại')
            }

            const data = await res.json()
            setTempPassword(data.matKhauTam)
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

            const res = await fetch(endpoint, {
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
                    canConfirm: !data.lichDangThucHien,
                })
                return
            }

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Thao tác thất bại')
            }

            await fetchAccounts()
            const updated = accounts.find((a) => a.maNguoiDung === selected.maNguoiDung)
            if (updated) handleSelectAccount(updated)
            setLockWarning(null)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tight text-slate-100">Quản lý tài khoản</h1>
                    <p className="mt-1 text-sm text-slate-400">Quản trị viên hệ thống</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-rose-700/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                        <strong className="font-bold">Lỗi:</strong> {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                    {/* Account List */}
                    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 shadow-2xl backdrop-blur">
                        <div className="mb-4 flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${inputCls} flex-1`}
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

                        <button type="button" onClick={handleCreateNew} className={`${btnPrimary} mb-4 w-full`}>
                            + Thêm tài khoản
                        </button>

                        {loading ? (
                            <div className="py-12 text-center text-slate-500">Đang tải...</div>
                        ) : accounts.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">Không tìm thấy tài khoản</div>
                        ) : (
                            <div className="space-y-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
                                {accounts.map((acc) => (
                                    <button
                                        key={acc.maNguoiDung}
                                        type="button"
                                        onClick={() => handleSelectAccount(acc)}
                                        className={`w-full rounded-lg border p-4 text-left transition ${selected?.maNguoiDung === acc.maNguoiDung
                                                ? 'border-sky-500 bg-sky-950/30'
                                                : 'border-slate-700/30 bg-slate-800/30 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-bold text-slate-200">{acc.hoTen || acc.tenDangNhap}</div>
                                                <div className="mt-0.5 text-xs text-slate-500">@{acc.tenDangNhap}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-semibold text-slate-300">
                                                    {ROLES[acc.vaiTro] || acc.vaiTro}
                                                </span>
                                                {!acc.trangThai && (
                                                    <span className="rounded-full bg-rose-900/30 px-2 py-0.5 text-xs font-semibold text-rose-400">
                                                        Đã khóa
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {acc.chucVu && <div className="mt-2 text-xs text-slate-400">{acc.chucVu}</div>}
                                        {acc.soDienThoai && <div className="mt-1 text-xs text-slate-400">{acc.soDienThoai}</div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 shadow-2xl backdrop-blur">
                        {!selected && !editing ? (
                            <div className="flex h-full items-center justify-center py-24 text-slate-500">
                                Chọn tài khoản hoặc tạo mới
                            </div>
                        ) : (
                            <div>
                                <h2 className="mb-6 text-xl font-extrabold text-slate-100">
                                    {editing && !selected ? 'Tạo tài khoản mới' : editing ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}
                                </h2>

                                {editing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-300">
                                                Tên đăng nhập <span className="text-rose-400">*</span>
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
                                            <label className="mb-1 block text-sm font-semibold text-slate-300">
                                                Họ tên <span className="text-rose-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.hoTen}
                                                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-300">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-300">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                value={formData.soDienThoai}
                                                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-300">
                                                Vai trò <span className="text-rose-400">*</span>
                                            </label>
                                            <select
                                                value={formData.vaiTro}
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
                                                <label className="mb-1 block text-sm font-semibold text-slate-300">
                                                    Chức vụ <span className="text-rose-400">*</span>
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
                                        <dl className="space-y-4">
                                            <Info label="Mã người dùng">{selected.maNguoiDung}</Info>
                                            <Info label="Tên đăng nhập">{selected.tenDangNhap}</Info>
                                            <Info label="Họ tên">{selected.hoTen}</Info>
                                            <Info label="Email">{selected.email}</Info>
                                            <Info label="Số điện thoại">{selected.soDienThoai}</Info>
                                            <Info label="Vai trò">{ROLES[selected.vaiTro] || selected.vaiTro}</Info>
                                            {selected.chucVu && <Info label="Chức vụ">{selected.chucVu}</Info>}
                                            <Info label="Trạng thái">
                                                {selected.trangThai ? (
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-rose-400">
                                                        <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                                                        Đã khóa
                                                    </span>
                                                )}
                                            </Info>
                                        </dl>

                                        <div className="mt-8 space-y-3">
                                            <button type="button" onClick={() => setEditing(true)} className={`${btnPrimary} w-full`}>
                                                Chỉnh sửa
                                            </button>
                                            <button type="button" onClick={handleResetPassword} className={`${btnSecondary} w-full`}>
                                                Đặt lại mật khẩu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleLockToggle(false)}
                                                className={`${selected.trangThai ? btnDanger : btnWarning} w-full`}
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
