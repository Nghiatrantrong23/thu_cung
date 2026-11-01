import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND, toISODate } from '../../lib/tinhGioTrong.js'

export default function TongQuanQuanLy() {
  const { apiCall, user } = useAuth()
  const [day] = useState(() => toISODate(new Date()))
  const [result, setResult] = useState({ loading: true, error: '', appointments: null, revenue: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([
      apiCall(`/api/lich-hen?ngay=${day}`),
      apiCall(`/api/bao-cao/doanh-thu?${new URLSearchParams({ tuNgay: day, denNgay: day })}`),
    ]).then(([appointments, revenue]) => {
      if (!active) return
      setResult({
        loading: false,
        error: [appointments, revenue].filter(response => !response.ok).map(response => response.error).join(' · '),
        appointments: appointments.ok ? appointments.data.lichHen : null,
        revenue: revenue.ok ? revenue.data : null,
      })
    }).catch(() => {
      if (active) setResult(previous => ({ ...previous, loading: false, error: 'Không tải được tổng quan. Vui lòng thử lại.' }))
    })
    return () => { active = false }
  }, [apiCall, day, version])

  const appointments = result.appointments || []
  const cards = [
    ['Lịch hôm nay', appointments.length],
    ['Chờ xác nhận', appointments.filter(row => row.trangThaiDB === 'ChoXacNhan').length],
    ['Đang chăm sóc', appointments.filter(row => row.trangThaiDB === 'DangThucHien').length],
    ['Cần xử lý', appointments.filter(row => row.careIssue && !['HoanThanh', 'DaHuy', 'TuChoi'].includes(row.trangThaiDB)).length],
  ]
  return <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-7">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Quản lý · {day}</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Xin chào, {user.fullName}</h1><p className="mt-2 text-slate-600">Tình hình vận hành và giao dịch trong ngày.</p></div><button type="button" className="rounded-full border border-brand-600 px-4 py-2 font-bold text-brand-700 disabled:opacity-50" disabled={result.loading} onClick={() => { setResult(previous => ({ ...previous, loading: true, error: '' })); setVersion(value => value + 1) }}>Tải lại</button></header>
    {result.loading ? <p role="status">Đang tải tổng quan…</p> : <>{result.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{result.error}</p>}
      {result.appointments && <section aria-label="Lịch hẹn hôm nay" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm text-slate-600">{label}</h2><p className="mt-2 text-3xl font-extrabold text-brand-800">{value}</p></article>)}</section>}
      {result.revenue && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Giao dịch hôm nay</h2><Link to="/quan-ly/bao-cao" className="font-bold text-brand-700 underline">Xem báo cáo</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Đã thu', result.revenue.collected], ['Đã hoàn', result.revenue.refunded], ['Thực thu', result.revenue.net]].map(([label, value]) => <div key={label}><p className="text-sm text-slate-600">{label}</p><p className="mt-1 text-xl font-extrabold text-brand-800">{formatVND(value)} VNĐ</p></div>)}</div><p className="mt-4 text-sm text-slate-500">Theo ngày giao dịch thành công, giờ Việt Nam.</p></section>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-extrabold">Công việc quản lý</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['Điều phối lịch hẹn', '/le-tan/lich-hen'], ['Xử lý khiếu nại', '/le-tan/khieu-nai'], ['Quản lý ca làm việc', '/quan-ly/ca-lam-viec'], ['Dịch vụ và bảng giá', '/quan-ly/dich-vu']].map(([label, path]) => <Link key={path} to={path} className="rounded-xl border border-slate-200 p-4 font-bold text-brand-700 hover:border-brand-500">{label} →</Link>)}</div></section>
    </>}
  </main>
}
