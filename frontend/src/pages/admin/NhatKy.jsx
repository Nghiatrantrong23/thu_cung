import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

const inputCls = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 w-full'
const selectCls = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 w-full'

function StatusTag({ result }) {
  const ok = result === 'Thành công'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
      {result}
    </span>
  )
}

function DiffCell({ before, after }) {
  if (!before && !after) return <span className="text-slate-400">—</span>
  return (
    <span className="text-sm">
      {before && <s className="mr-1 text-rose-500 decoration-rose-400">{before}</s>}
      {after && <b className="text-emerald-700">{after}</b>}
    </span>
  )
}

const DEMO_LOGS = [
  { time: '2026-11-02 08:12', user: 'mai.nt', action: 'Đăng nhập', target: 'Phiên đăng nhập', before: '', after: '', result: 'Thành công', ip: '10.0.1.21' },
  { time: '2026-11-02 07:58', user: 'lan.nt', action: 'Đăng nhập', target: 'Phiên đăng nhập', before: '', after: '', result: 'Thành công', ip: '10.0.1.34' },
  { time: '2026-11-01 22:41', user: '(không rõ)', action: 'Đăng nhập', target: 'Tài khoản huy.pq', before: '', after: '5 lần sai mật khẩu liên tiếp', result: 'Thất bại', ip: '113.190.4.77' },
  { time: '2026-11-01 22:43', user: 'admin.hoang', action: 'Tài khoản', target: 'Khóa huy.pq', before: 'Hoạt động', after: 'Bị khóa (nghi dò mật khẩu)', result: 'Thành công', ip: '10.0.1.5' },
  { time: '2026-10-31 16:20', user: 'minh.tv', action: 'Giá dịch vụ', target: 'Spa', before: '350.000đ', after: '400.000đ', result: 'Thành công', ip: '10.0.1.12' },
  { time: '2026-10-31 11:05', user: 'minh.tv', action: 'Khiếu nại', target: 'KN-014', before: 'Chờ xử lý', after: 'Đã xử lý, hoàn 50.000đ', result: 'Thành công', ip: '10.0.1.12' },
  { time: '2026-10-30 15:30', user: 'mai.nt', action: 'Hoàn tiền', target: 'HD-0905', before: '', after: 'Ghi nhận hoàn 50.000đ (chờ duyệt)', result: 'Thành công', ip: '10.0.1.21' },
  { time: '2026-10-30 15:45', user: 'minh.tv', action: 'Hoàn tiền', target: 'HD-0905', before: 'Chờ duyệt', after: 'Đã duyệt', result: 'Thành công', ip: '10.0.1.12' },
  { time: '2026-10-28 09:10', user: 'admin.hoang', action: 'Phân quyền', target: 'mai.nt', before: 'Nhân viên', after: 'Lễ tân', result: 'Thành công', ip: '10.0.1.5' },
  { time: '2026-10-25 10:02', user: 'admin.hoang', action: 'Cấu hình', target: 'Chính sách hủy lịch', before: 'Miễn phí trước 12 giờ', after: 'Miễn phí trước 24 giờ', result: 'Thành công', ip: '10.0.1.5' },
]

export default function NhatKy() {
  const { apiCall } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ user: '', action: '', result: '', from: '', to: '' })
  const abortRef = useRef(null)

  const load = useCallback(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true); setError('')
    apiCall('/admin/logs', { signal: ctrl.signal })
      .then(res => {
        if (ctrl.signal.aborted) return
        if (res.ok && Array.isArray(res.data?.logs)) {
          setLogs(res.data.logs)
        } else {
          setLogs(DEMO_LOGS)
          if (!res.ok) setError('API chưa sẵn sàng – hiển thị dữ liệu mẫu.')
        }
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setLogs(DEMO_LOGS)
        setError('Không thể tải nhật ký – hiển thị dữ liệu mẫu.')
        setLoading(false)
      })
  }, [apiCall])

  useEffect(() => { load() }, [load])

  const users = [...new Set(logs.map(x => x.user).filter(Boolean))]
  const actions = [...new Set(logs.map(x => x.action).filter(Boolean))]
  const filtered = logs.filter(x =>
    (!filters.user || x.user === filters.user) &&
    (!filters.action || x.action === filters.action) &&
    (!filters.result || x.result === filters.result) &&
    (!filters.from || (x.time || '').slice(0, 10) >= filters.from) &&
    (!filters.to || (x.time || '').slice(0, 10) <= filters.to)
  )
  function setF(key, value) { setFilters(f => ({ ...f, [key]: value })) }

  return (
    <div>
      <PageHeading
        title="Nhật ký hoạt động"
        subtitle="Ghi chỉ thêm – không sửa, không xóa. Ghi đầy đủ người thực hiện, hành động, giá trị trước/sau và kết quả."
        actions={
          <button onClick={load} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Làm mới
          </button>
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Người dùng</label>
          <select className={selectCls} value={filters.user} onChange={e => setF('user', e.target.value)}>
            <option value="">Tất cả</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Hành động</label>
          <select className={selectCls} value={filters.action} onChange={e => setF('action', e.target.value)}>
            <option value="">Tất cả</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Kết quả</label>
          <select className={selectCls} value={filters.result} onChange={e => setF('result', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Thành công">Thành công</option>
            <option value="Thất bại">Thất bại</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Từ ngày</label>
          <input type="date" className={inputCls} value={filters.from} onChange={e => setF('from', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Đến ngày</label>
          <input type="date" className={inputCls} value={filters.to} onChange={e => setF('to', e.target.value)} />
        </div>
      </div>
      {error && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          {loading ? 'Đang tải…' : `${filtered.length}/${logs.length} bản ghi`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Thời gian','Người dùng','Hành động','Đối tượng','Thay đổi (trước → sau)','Kết quả','IP'].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Đang tải dữ liệu…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Không có bản ghi phù hợp.</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 font-mono text-xs">{row.time}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-800">{row.user}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{row.action}</td>
                  <td className="px-4 py-2.5 text-slate-700">{row.target}</td>
                  <td className="px-4 py-2.5"><DiffCell before={row.before} after={row.after} /></td>
                  <td className="whitespace-nowrap px-4 py-2.5"><StatusTag result={row.result} /></td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-400">{row.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
