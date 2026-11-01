import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatDateVN, toISODate } from '../../lib/tinhGioTrong.js'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'

export default function TongQuanChamSoc() {
  const { apiCall, user } = useAuth()
  const [day] = useState(() => toISODate(new Date()))
  const [rows, setRows] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    apiCall(`/api/lich-hen?ngay=${day}`).then(result => {
      if (!active) return
      setRows(result.ok ? result.data.lichHen : [])
      setState({ loading: false, error: result.ok ? '' : result.error })
    })
    return () => { active = false }
  }, [apiCall, day, version])

  const counts = [
    ['Được giao hôm nay', rows.length],
    ['Đang thực hiện', rows.filter(row => row.trangThaiDB === 'DangThucHien').length],
    ['Hoàn thành', rows.filter(row => row.trangThaiDB === 'HoanThanh').length],
    ['Cần xử lý', rows.filter(row => row.careIssue && !['HoanThanh', 'DaHuy'].includes(row.trangThaiDB)).length],
  ]
  const upcoming = [...rows].filter(row => !['HoanThanh', 'DaHuy'].includes(row.trangThaiDB))
    .sort((a, b) => a.start.localeCompare(b.start))

  return <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Chăm sóc · {formatDateVN(day)}</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Xin chào, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">Lịch và công việc được giao cho bạn hôm nay.</p></div>
      <button className="rounded-full border border-brand-600 px-4 py-2 font-bold text-brand-700 disabled:opacity-50" disabled={state.loading} onClick={() => { setState({ loading: true, error: '' }); setVersion(v => v + 1) }}>Tải lại</button>
    </header>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{state.error}</p>}
    {state.loading ? <p role="status">Đang tải lịch hôm nay…</p> : state.error ? null : <>
      <section aria-label="Tổng quan lịch hôm nay" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-extrabold text-brand-800">{count}</p></div>)}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Công việc tiếp theo</h2><Link to="/nhan-vien/lich-lam-viec" className="font-bold text-brand-700 underline underline-offset-4">Mở lịch chăm sóc</Link></div>
        {upcoming.length ? <ul className="mt-4 divide-y divide-slate-200">{upcoming.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{row.start}–{row.end} · {row.petName}</p><p className="mt-1 text-sm text-slate-600">{row.serviceNames.join(', ')}</p>{row.careIssue && <p className="mt-2 text-sm font-semibold text-amber-800">Cần xử lý: {row.careIssue}</p>}</div><HuyHieuTrangThai status={row.status}/></li>)}</ul> : <p className="mt-4 text-slate-600">Không có lịch cần thực hiện hôm nay.</p>}
      </section>
    </>}
  </main>
}
