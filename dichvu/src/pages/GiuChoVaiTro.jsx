import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../data/khoXacThuc.jsx'
import { staffNavigation } from '../lib/staffNavigation.js'
import { ROLE_LABEL } from '../lib/tienIchXacThuc.js'
import { toISODate, formatDateVN, formatVND } from '../lib/tinhGioTrong.js'
import WorkIcon from '../components/ui/WorkIcon.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'

export default function RoleHome() {
  const { user, apiCall } = useAuth()
  const links = staffNavigation(user.roleKey).slice(1)
  const today = toISODate(new Date())
  const manager = ['manager', 'admin'].includes(user.roleKey)
  const care = user.roleKey === 'care'
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ rows: [], report: null, loading: true, error: '', reportError: '' })
  useEffect(() => {
    let active = true
    setState(previous => ({ ...previous, loading: true, error: '', reportError: '' }))
    Promise.all([
      apiCall(`/api/lich-hen?${new URLSearchParams({ ngay: today })}`),
      manager ? apiCall(`/api/bao-cao/doanh-thu?${new URLSearchParams({ tuNgay: today, denNgay: today })}`) : Promise.resolve(null),
    ]).then(([appointments, report]) => {
      if (!active) return
      setState({ rows: appointments.ok ? appointments.data.lichHen : [], report: report?.ok ? report.data : null,
        loading: false, error: appointments.ok ? '' : appointments.error, reportError: report && !report.ok ? report.error : '' })
    })
    return () => { active = false }
  }, [apiCall, today, manager, version])
  const listPath = care ? '/nhan-vien/lich-lam-viec' : '/le-tan/lich-hen'
  const count = code => state.rows.filter(row => row.trangThaiDB === code).length
  const metrics = care
    ? [['Đã xác nhận, được giao', count('DaXacNhan')], ['Đang chăm sóc', count('DangThucHien')], ['Đã hoàn thành', count('HoanThanh')]]
    : [['Chờ xác nhận', count('ChoXacNhan')], ['Đã xác nhận', count('DaXacNhan')], ['Đang thực hiện', count('DangThucHien')]]
  const rows = [...state.rows].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5)
  return <main className="pc-page">
    <PageHeading title={`Xin chào, ${user.fullName}`} description={`${ROLE_LABEL[user.roleKey]} · Công việc ngày ${formatDateVN(today)} (giờ Việt Nam).`} actions={<button type="button" onClick={() => setVersion(value => value + 1)} disabled={state.loading} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold">{state.loading ? 'Đang tải...' : 'Tải lại tổng quan'}</button>}/>
    {state.error && <p role="alert" className="pc-detail-notice">{state.error}</p>}
    {state.reportError && <p role="alert" className="pc-detail-notice">Chưa tải được số liệu thu/hoàn: {state.reportError}</p>}
    <section aria-label="Công việc hôm nay" className={`mb-7 grid gap-4 sm:grid-cols-2 ${manager ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {metrics.map(([label, value]) => <Link key={label} to={listPath} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-400"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><WorkIcon name={listPath}/></span><h2 className="text-sm font-semibold text-slate-600">{label}</h2><p className="mt-2 text-3xl font-extrabold">{state.loading ? '…' : state.error ? '—' : value}</p></Link>)}
      {manager && <Link to="/quan-ly/bao-cao" className="rounded-2xl border border-brand-700 bg-brand-700 p-5 text-white"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/15"><WorkIcon name="bao-cao"/></span><h2 className="text-sm font-semibold">Thực thu hôm nay</h2><p className="mt-2 text-2xl font-extrabold">{state.loading ? '…' : state.report ? `${formatVND(state.report.net)} ₫` : '—'}</p><p className="mt-2 text-xs leading-5">Thu thành công trừ thực chi hoàn; chưa trừ chi phí.</p></Link>}
    </section>
    <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold">{care ? 'Lịch được phân công hôm nay' : 'Lịch hẹn hôm nay'}</h2><Link to={listPath} className="inline-flex min-h-11 items-center text-sm font-bold text-brand-700">Mở danh sách lịch →</Link></div>
      {state.loading ? <p role="status">Đang tải công việc hôm nay...</p> : state.error ? <p className="text-slate-600">Chưa có dữ liệu để hiển thị.</p> : !rows.length ? <p className="pc-page-empty">Chưa có lịch hẹn trong ngày.</p> : <ul className="divide-y divide-slate-100">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{row.start}–{row.end} · {row.petName}</p><p className="mt-1 text-sm text-slate-600">#{row.id} · {row.customerName} · {row.serviceNames.join(', ')}</p></div><StatusBadge code={row.trangThaiDB}/></li>)}</ul>}
      {state.rows.length > 5 && <p className="mt-3 text-xs text-slate-600">Hiển thị 5 trong {state.rows.length} lịch hẹn hôm nay.</p>}
    </section>
    <section aria-label="Lối tắt công việc"><h2 className="mb-3 text-lg font-extrabold">Lối tắt công việc</h2><div className="flex flex-wrap gap-3">{links.map(item => <Link key={item.path} to={item.path} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700"><WorkIcon name={item.path}/>{item.label}</Link>)}</div></section>
  </main>
}
