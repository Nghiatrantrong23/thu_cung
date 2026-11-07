import PageHeading from '../../components/ui/PageHeading.jsx'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'

// ── Utility classes (same design system as QuanLyTaiKhoan) ──
const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-500 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const selectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const btnPrimary =
  'rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'
const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-600 hover:text-brand-700'
const btnDanger =
  'rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100'
const btnSm =
  'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700'

const TABS = [
  { key: 'find', label: 'Tra cứu khách' },
  { key: 'new', label: 'Tạo hồ sơ khách' },
  { key: 'merge', label: 'Gộp hồ sơ' },
]

// ── Helpers ──
function normPhone(p) {
  let d = String(p).replace(/\D/g, '')
  if (d.startsWith('84')) d = '0' + d.slice(2)
  return d
}

// ── Sub-components ──

function Tag({ color, children }) {
  const cls = {
    green: 'bg-success-bg text-success-text',
    yellow: 'bg-warning-bg text-warning-text',
    red: 'bg-error-bg text-error-text',
    gray: 'bg-slate-100 text-slate-600',
  }[color] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{children || <span className="text-slate-400">—</span>}</dd>
    </div>
  )
}

function SimpleTable({ headers, rows, emptyText = 'Chưa có.' }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{emptyText}</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>{headers.map(h => <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              {row.map((cell, j) => <td key={j} className="px-3 py-2.5 text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Customer Card ──
function CustomerCard({ customer, appointments, invoices, onAddPet }) {
  const [petForm, setPetForm] = useState(false)
  const [petData, setPetData] = useState({ n: '', sp: '', br: '', age: '', w: '', g: '', v: '', al: '', tp: '' })
  const [petError, setPetError] = useState('')
  const [saving, setSaving] = useState(false)

  const accColor = { 'Đã có': 'green', 'Đã mời': 'yellow', 'Chưa có': 'gray' }[customer.acc] || 'gray'

  async function savePet() {
    if (!petData.n.trim()) return setPetError('Nhập tên thú cưng.')
    if (!petData.sp) return setPetError('Chọn loài.')
    if (!petData.g) return setPetError('Chọn giới tính.')
    if (!petData.v) return setPetError('Chọn tình trạng tiêm phòng.')
    if (petData.w && (isNaN(+petData.w) || +petData.w <= 0 || +petData.w >= 120)) return setPetError('Cân nặng không hợp lệ.')
    setSaving(true); setPetError('')
    try {
      await onAddPet(customer.id, { ...petData, w: petData.w ? +petData.w : null })
      setPetForm(false)
      setPetData({ n: '', sp: '', br: '', age: '', w: '', g: '', v: '', al: '', tp: '' })
    } catch (e) {
      setPetError(e.message || 'Lỗi khi lưu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{customer.name}</h2>
          <p className="text-sm text-slate-500">Tạo bởi {customer.by} · {customer.at}</p>
        </div>
        <Tag color={accColor}>Tài khoản: {customer.acc || 'Chưa có'}</Tag>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Số điện thoại">{customer.phone}</InfoRow>
          <InfoRow label="Email">{customer.email || 'Chưa có'}</InfoRow>
          <InfoRow label="Mã khách">{customer.id}</InfoRow>
        </dl>
        <p className="mt-3 text-xs text-slate-400">Không hiển thị mật khẩu hay dữ liệu thanh toán nhạy cảm.</p>
      </div>
      <div className="border-t border-slate-100 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Thú cưng ({(customer.pets || []).length})</h3>
          <button className={btnSm} onClick={() => setPetForm(v => !v)}>
            {petForm ? 'Đóng form' : '+ Thêm thú cưng'}
          </button>
        </div>
        <div className="space-y-2">
          {(customer.pets || []).map((p, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">{p.n || p.ten} <span className="font-normal text-slate-500">· {p.sp || p.loai}{p.br ? ' · ' + p.br : ''} · {p.g || p.gioiTinh}{p.age || p.tuoi ? ' · ' + (p.age || p.tuoi) : ''}{p.w ? ` · ${p.w} kg` : ''}</span></div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Tag color={(p.v || p.tiemPhong) === 'Đã tiêm' ? 'green' : 'yellow'}>{p.v || p.tiemPhong || '?'}</Tag>
                {(p.al || p.diUng) && <Tag color="red">Dị ứng: {p.al || p.diUng}</Tag>}
                {(p.tp || p.tinhCach) && <Tag color="yellow">{p.tp || p.tinhCach}</Tag>}
              </div>
            </div>
          ))}
          {!(customer.pets || []).length && <p className="text-sm text-slate-400">Chưa có thú cưng.</p>}
        </div>
        {petForm && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
            <h4 className="mb-3 font-bold text-brand-800">Thêm thú cưng mới</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[{ label: 'Tên *', key: 'n' }, { label: 'Giống', key: 'br' }, { label: 'Tuổi', key: 'age', placeholder: 'VD: 2 tuổi' }, { label: 'Cân nặng (kg)', key: 'w', type: 'number' }, { label: 'Dị ứng', key: 'al' }, { label: 'Tính cách / lưu ý', key: 'tp', placeholder: 'VD: sợ nước' }].map(f => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} value={petData[f.key]} onChange={e => setPetData(d => ({ ...d, [f.key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              {[{ label: 'Loài *', key: 'sp', opts: ['', 'Chó', 'Mèo', 'Khác'] }, { label: 'Giới tính *', key: 'g', opts: ['', 'Đực', 'Cái'] }, { label: 'Tiêm phòng *', key: 'v', opts: ['', 'Đã tiêm', 'Chưa tiêm', 'Không rõ'] }].map(f => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</label>
                  <select value={petData[f.key]} onChange={e => setPetData(d => ({ ...d, [f.key]: e.target.value }))} className={selectCls}>
                    {f.opts.map(o => <option key={o} value={o}>{o || 'Chọn...'}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {petError && <p className="mt-2 rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">{petError}</p>}
            <div className="mt-3 flex gap-2">
              <button className={btnPrimary} onClick={savePet} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thú cưng'}</button>
              <button className={btnSecondary} onClick={() => setPetForm(false)}>Hủy</button>
            </div>
          </div>
        )}
      </div>
      {appointments?.length > 0 && (
        <div className="border-t border-slate-100 p-5">
          <h3 className="mb-3 font-bold text-slate-800">Lịch hẹn ({appointments.length})</h3>
          <SimpleTable headers={['Mã', 'Thú cưng', 'Dịch vụ', 'Ngày', 'Trạng thái']} rows={appointments.map(a => [a.id, a.petName, (a.serviceNames || []).join(', '), a.date, a.status])} />
        </div>
      )}
      {invoices?.length > 0 && (
        <div className="border-t border-slate-100 p-5">
          <h3 className="mb-3 font-bold text-slate-800">Hóa đơn ({invoices.length})</h3>
          <SimpleTable headers={['Số', 'Tổng', 'Trạng thái']} rows={invoices.map(v => [v.id, `${(v.amount || 0).toLocaleString('vi-VN')}đ`, v.status])} />
        </div>
      )}
    </div>
  )
}

// ── TAB 1: Find ──
function FindTab({ apiCall }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true); setError('')
    const res = await apiCall(`/api/khach-hang?q=${encodeURIComponent(q)}`)
    if (res.ok) setResults(res.data?.khachHang || res.data?.customers || [])
    else setError(res.error)
    setLoading(false)
  }, [apiCall])

  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  const openCustomer = useCallback(async (id) => {
    setSelected(id); setDetail(null); setDetailLoading(true)
    const [cRes, aRes, iRes] = await Promise.all([
      apiCall(`/api/khach-hang/${id}`),
      apiCall(`/api/lich-hen?khachHangId=${id}`),
      apiCall(`/api/hoa-don?khachHangId=${id}`),
    ])
    setDetail({
      customer: cRes.ok ? (cRes.data?.khachHang || cRes.data) : null,
      appointments: aRes.ok ? (aRes.data?.lichHen || []) : [],
      invoices: iRes.ok ? (iRes.data?.hoaDon || []) : [],
    })
    setDetailLoading(false)
  }, [apiCall])

  async function handleAddPet(customerId, pet) {
    const res = await apiCall(`/api/khach-hang/${customerId}/thu-cung`, { method: 'POST', body: pet })
    if (!res.ok) throw new Error(res.error)
    await openCustomer(customerId)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="kh-search" className="mb-2 block text-sm font-semibold text-slate-700">Tìm theo tên, SĐT, email, tên thú cưng hoặc mã lịch</label>
        <input id="kh-search" type="text" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setDetail(null) }} placeholder="VD: 0912, Mochi, L-2301" className={`${inputCls} max-w-md`} autoFocus />
        {loading && <p className="mt-3 text-sm text-slate-500">Đang tìm kiếm...</p>}
        {error && <p className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">{error}</p>}
        {!loading && query && (
          <div className="mt-3 space-y-2">
            {results.length ? results.map(c => (
              <button key={c.id} onClick={() => openCustomer(c.id)} className={`w-full rounded-lg border px-4 py-3 text-left transition ${selected === c.id ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-200' : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-slate-50'}`}>
                <span className="font-semibold text-slate-900">{c.name || c.hoTen}</span>
                <span className="ml-2 text-slate-500">· {c.phone || c.soDienThoai}</span>
                {(c.email) && <span className="ml-2 text-xs text-slate-400">{c.email}</span>}
                <div className="mt-0.5 text-xs text-slate-500">{(c.pets || c.thuCung || []).map(p => p.n || p.ten).filter(Boolean).join(', ') || 'Chưa có thú cưng'}</div>
              </button>
            )) : <p className="text-sm text-slate-500">Không tìm thấy. Có thể tạo hồ sơ mới ở tab "Tạo hồ sơ khách".</p>}
          </div>
        )}
        {!query && <p className="mt-3 text-sm text-slate-400">Nhập từ khóa để tìm khách.</p>}
      </div>
      {detailLoading && <p className="text-sm text-slate-500">Đang tải hồ sơ khách...</p>}
      {detail?.customer && <CustomerCard customer={detail.customer} appointments={detail.appointments} invoices={detail.invoices} onAddPet={handleAddPet} />}
    </div>
  )
}

// ── TAB 2: New ──
function NewTab({ apiCall, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', acc: 'none' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    const ph = normPhone(form.phone)
    if (!form.name.trim()) return setError('Nhập họ tên.')
    if (!/^0\d{9}$/.test(ph)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0 (hoặc +84).')
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Email không hợp lệ.')
    if (form.acc === 'invite' && !form.email) return setError('Cần email để gửi lời mời kích hoạt.')
    setSaving(true); setError(''); setSuccess('')
    const res = await apiCall('/api/khach-hang', { method: 'POST', body: { name: form.name.trim(), phone: ph, email: form.email || null, sendInvite: form.acc === 'invite' } })
    setSaving(false)
    if (res.ok) { setSuccess('Đã tạo hồ sơ' + (form.acc === 'invite' ? ' và gửi lời mời kích hoạt.' : '.')); setForm({ name: '', phone: '', email: '', acc: 'none' }); onCreated?.(res.data) }
    else setError(res.error)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-extrabold text-slate-900">Tạo hồ sơ khách tại quầy</h2>
      <p className="mb-4 text-sm text-slate-500">Hệ thống kiểm tra trùng số điện thoại trước khi lưu. Trường có * là bắt buộc.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Họ tên *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Số điện thoại *</label>
          <input type="text" inputMode="tel" placeholder="09xx xxx xxx" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Email (tùy chọn)</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">Tài khoản</p>
        <div className="flex flex-wrap gap-4">
          {[{ v: 'none', l: 'Chỉ tạo hồ sơ, chưa cần tài khoản' }, { v: 'invite', l: 'Gửi lời mời kích hoạt (cần email)' }].map(o => (
            <label key={o.v} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="new-acc" value={o.v} checked={form.acc === o.v} onChange={() => set('acc', o.v)} className="accent-brand-600" />{o.l}</label>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">{error}</p>}
      {success && <p className="mt-3 rounded-lg bg-success-bg px-3 py-2 text-sm text-success-text">{success}</p>}
      <div className="mt-4">
        <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo hồ sơ'}</button>
      </div>
    </div>
  )
}

// ── TAB 3: Merge ──
function MergeTab({ apiCall, isManager }) {
  const [customers, setCustomers] = useState([])
  const [mA, setMA] = useState('')
  const [mB, setMB] = useState('')
  const [reason, setReason] = useState('')
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [cRes, rRes] = await Promise.all([
      apiCall('/api/khach-hang?limit=500'),
      apiCall('/api/khach-hang/yeu-cau-gop'),
    ])
    if (cRes.ok) setCustomers(cRes.data?.khachHang || cRes.data?.customers || [])
    if (rRes.ok) { setRequests(rRes.data?.yeuCau || []); setLogs(rRes.data?.nhatKy || []) }
  }, [apiCall])

  useEffect(() => { load() }, [load])

  const cA = customers.find(c => c.id === mA)
  const cB = customers.find(c => c.id === mB)

  async function submit(endpoint) {
    if (!mA || !mB || mA === mB) return setError('Chọn hai hồ sơ khác nhau.')
    if (!reason.trim()) return setError('Nhập lý do gộp.')
    if (endpoint === '/api/khach-hang/gop' && !window.confirm(`Gộp "${cB?.name}" vào "${cA?.name}"? Hành động này không thể hoàn tác dễ dàng.`)) return
    setSaving(true); setError('')
    const res = await apiCall(endpoint, { method: 'POST', body: { keepId: mA, mergeId: mB, reason: reason.trim() } })
    setSaving(false)
    if (res.ok) { setMA(''); setMB(''); setReason(''); load() }
    else setError(res.error)
  }

  const opts = [<option key="" value="">— Chọn khách —</option>, ...customers.map(c => <option key={c.id} value={c.id}>{c.name || c.hoTen} · {c.phone || c.soDienThoai}</option>)]

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-extrabold text-slate-900">Gộp hồ sơ trùng</h2>
        <p className="mb-4 text-sm text-slate-500">{isManager ? 'Bạn đang xem với vai trò Quản lý: có quyền gộp trực tiếp.' : 'Chỉ Quản lý được gộp. Lễ tân gửi yêu cầu kèm lý do.'}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-semibold text-slate-600">Hồ sơ giữ lại</label><select value={mA} onChange={e => setMA(e.target.value)} className={selectCls}>{opts}</select></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-600">Hồ sơ bị gộp vào (sẽ ẩn)</label><select value={mB} onChange={e => setMB(e.target.value)} className={selectCls}>{opts}</select></div>
        </div>
        {cA && cB && mA !== mB && (
          <div className="mt-3 rounded-lg bg-warning-bg px-4 py-3 text-sm text-warning-text">Giữ <strong>{cA.name || cA.hoTen}</strong>. Chuyển dữ liệu từ <strong>{cB.name || cB.hoTen}</strong> sang. SĐT của hồ sơ bị gộp sẽ trở thành SĐT phụ.</div>
        )}
        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Lý do / ghi chú *</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} className={`${inputCls} max-w-md`} placeholder="VD: Cùng người, đăng ký 2 lần" />
        </div>
        {error && <p className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {isManager
            ? <button className={btnDanger} onClick={() => submit('/api/khach-hang/gop')} disabled={saving}>{saving ? 'Đang gộp...' : 'Gộp hồ sơ'}</button>
            : <button className={btnPrimary} onClick={() => submit('/api/khach-hang/yeu-cau-gop')} disabled={saving}>{saving ? 'Đang gửi...' : 'Gửi yêu cầu cho Quản lý'}</button>}
        </div>
      </div>
      {requests.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-800">Yêu cầu gộp ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map((r, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                <div><span className="font-semibold">{r.keepName}</span><span className="mx-1 text-slate-400">←</span><span className="font-semibold">{r.mergeName}</span><div className="text-xs text-slate-500">{r.by} · {r.at}{r.reason ? ' · ' + r.reason : ''}</div></div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === 'Chờ duyệt' ? 'bg-warning-bg text-warning-text' : 'bg-success-bg text-success-text'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {logs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-800">Nhật ký gộp</h3>
          <div className="space-y-1">{logs.map((l, i) => <p key={i} className="text-sm text-slate-500">{l}</p>)}</div>
        </div>
      )}
    </div>
  )
}

// ── Main ──
export default function TraCuuKhach() {
  const { apiCall, user } = useAuth()
  const [tab, setTab] = useState('find')
  const isManager = ['manager', 'admin'].includes(user?.roleKey)

  return (
    <section className="space-y-5">
      <PageHeading title="Tra cứu & Quản lý khách hàng" description="Tìm kiếm hồ sơ, thêm thú cưng, tạo hồ sơ tại quầy hoặc gộp hồ sơ trùng." />
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'find' && <FindTab apiCall={apiCall} />}
      {tab === 'new' && <NewTab apiCall={apiCall} onCreated={() => setTab('find')} />}
      {tab === 'merge' && <MergeTab apiCall={apiCall} isManager={isManager} />}
    </section>
  )
}
