import RevenueChart from '../../components/RevenueChart.jsx'
import {reportPeriod,revenueBuckets} from '../../lib/reportPeriods.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { toISODate, formatVND } from '../../lib/tinhGioTrong.js'
import { displayDate } from '../../lib/displayDate.js'
import { DateInput } from '../../components/ui/DateTimeInput.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
const statusOrder = ['ChoXacNhan', 'DaXacNhan', 'DangThucHien', 'HoanThanh', 'DaHuy', 'TuChoi']
export default function BaoCao() {
  const { apiCall } = useAuth(), today = toISODate(new Date())
  const [mode,setMode]=useState('month'),[day,setDay]=useState(today),[month,setMonth]=useState(today.slice(0,7))
  const [year,setYear]=useState(today.slice(0,4)),[quarter,setQuarter]=useState(String(Math.ceil(Number(today.slice(5,7))/3)))
  const [from,setFrom]=useState(today.slice(0,8)+'01'),[to,setTo]=useState(today),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[applied,setApplied]=useState(null)
  const requestVersion=useRef(0)
  async function load(event,selectedMode=mode){
    event?.preventDefault()
    let period
    try{period=reportPeriod({mode:selectedMode,day,month,year,quarter,from,to})}catch(cause){setError(cause.message);return}
    const version=++requestVersion.current
    setBusy(true);setError('');setData(null)
    const result=await apiCall(`/api/bao-cao/doanh-thu?${new URLSearchParams({tuNgay:period.from,denNgay:period.to})}`)
    if(version!==requestVersion.current)return
    if(result.ok){setData(result.data);setApplied(period)}else setError(result.error)
    setBusy(false)
  }
  useEffect(()=>{load(null,'month');return()=>{requestVersion.current++}},[apiCall])
  const series=useMemo(()=>data&&applied?revenueBuckets(data.daily,data.from,data.to,applied.unit):[],[data,applied])
  const totalAppointments = data?.statuses.reduce((sum, row) => sum + Number(row.count), 0) || 0
  return <main className="pc-page">
    <PageHeading title="Thống kê và báo cáo doanh thu" description="Thu và hoàn theo giao dịch thành công. Thực thu chưa trừ chi phí, không phải lợi nhuận." actions={<button type="button" className="print-hide rounded-xl border border-brand-600 bg-white px-4 py-2 font-bold text-brand-800" disabled={!data || busy} onClick={()=>window.print()}>In báo cáo / Lưu PDF</button>}/>
    <form onSubmit={load} className="print-hide mb-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="revenue-period-tabs" role="group" aria-label="Kỳ báo cáo doanh thu">{[['day','Ngày'],['month','Tháng'],['quarter','Quý'],['year','Năm'],['custom','Tùy chọn']].map(([key,label])=><button key={key} type="button" disabled={busy} aria-pressed={mode===key} onClick={()=>{setMode(key);load(null,key)}}>{label}</button>)}</div>
      <div className="flex flex-wrap items-end gap-4">
        {mode==='day'&&<label className="block font-bold">Ngày báo cáo<DateInput required className="mt-1 rounded-lg border border-slate-300 p-2" value={day} disabled={busy} onChange={e=>setDay(e.target.value)}/></label>}
        {mode==='month'&&<label className="block font-bold">Tháng báo cáo<input aria-label="Tháng báo cáo" type="month" required className="mt-1 block rounded-lg border border-slate-300 p-2" value={month} disabled={busy} onChange={e=>setMonth(e.target.value)}/></label>}
        {mode==='quarter'&&<label className="block font-bold">Quý<select className="mt-1 block rounded-lg border border-slate-300 p-2" value={quarter} disabled={busy} onChange={e=>setQuarter(e.target.value)}>{[1,2,3,4].map(q=><option key={q} value={q}>Quý {q}</option>)}</select></label>}
        {['quarter','year'].includes(mode)&&<label className="block font-bold">Năm<input aria-label="Năm báo cáo" type="number" required min="1900" max="9999" className="mt-1 block w-32 rounded-lg border border-slate-300 p-2" value={year} disabled={busy} onChange={e=>setYear(e.target.value)}/></label>}
        {mode==='custom'&&<><label className="block font-bold">Từ ngày<DateInput required className="mt-1 rounded-lg border border-slate-300 p-2" value={from} max={to||undefined} disabled={busy} onChange={e=>setFrom(e.target.value)}/></label><label className="block font-bold">Đến ngày<DateInput required className="mt-1 rounded-lg border border-slate-300 p-2" value={to} min={from||undefined} disabled={busy} onChange={e=>setTo(e.target.value)}/></label></>}
        <button disabled={busy} className="pc-primary-action">{busy?'Đang tải...':'Xem biểu đồ'}</button>
      </div><p className="mt-3 text-sm text-slate-500">Chọn kỳ, điều chỉnh thời gian rồi bấm “Xem biểu đồ”. Tháng hiển thị từng ngày; quý và năm tổng hợp theo tháng.</p>
    </form>
    {error&&<p role="alert" className="pc-detail-notice">{error}</p>}
    {busy&&<p role="status">Đang tải báo cáo...</p>}
    {data&&<>
      <p className="my-4 text-sm text-slate-600">Kỳ {displayDate(data.from)} đến {displayDate(data.to)} · Giờ Việt Nam. Khoản hoàn mới được duyệt, chưa thực chi không bị trừ.</p>
      {!!data.legacyRefundRows&&<p role="alert" className="my-3 rounded-xl bg-amber-50 p-4 text-amber-800">Có {data.legacyRefundRows} giao dịch hoàn theo quy ước cũ cần đối soát trước khi nghiệm thu số liệu.</p>}
      <div className="grid gap-4 sm:grid-cols-3">{[['Đã thu thành công',data.collected],['Đã thực chi hoàn',data.refunded],['Thực thu trong kỳ',data.net]].map(([label,value])=><article key={label} className="pc-report-kpi"><h2 className="text-sm font-semibold text-slate-600">{label}</h2><p className="mt-3 text-2xl font-extrabold text-brand-800">{formatVND(value)} ₫</p></article>)}</div>
      <RevenueChart key={`${data.from}-${data.to}-${applied.unit}`} rows={series} title={applied.title} unit={applied.unit}/>
      <section className="my-5 rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-lg font-extrabold">Hóa đơn lập trong kỳ</h2><dl className="grid gap-4 sm:grid-cols-3">{[['Số hóa đơn',data.invoices.count],['Tổng giá trị dịch vụ',`${formatVND(data.invoices.gross)} ₫`],['Giảm giá',`${formatVND(data.invoices.discount)} ₫`]].map(([label,value])=><div key={label}><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 text-lg font-bold">{value}</dd></div>)}</dl><p className="mt-4 text-sm leading-6 text-slate-600">Giá trị hóa đơn theo ngày lập; thực thu theo ngày nhận hoặc hoàn tiền. Chưa có dữ liệu chi phí để tính lợi nhuận.</p></section>

      <section className="my-6"><h2 className="mb-3 text-lg font-extrabold">Thu và hoàn theo ngày giao dịch</h2><div className="pc-table-region"><table className="pc-data-table"><thead><tr><th>Ngày</th><th className="pc-money">Thu thành công (₫)</th><th className="pc-money">Hoàn thành công (₫)</th><th className="pc-money">Thực thu (₫)</th></tr></thead><tbody>{data.daily.map(row=><tr key={row.date}><td className="whitespace-nowrap">{displayDate(row.date)}</td><td className="pc-money">{formatVND(row.collected)}</td><td className="pc-money">{formatVND(row.refunded)}</td><td className="pc-money font-bold">{formatVND(row.net)}</td></tr>)}</tbody></table>{!data.daily.length&&<p className="p-5 text-sm text-slate-600">Không có giao dịch thành công trong kỳ.</p>}</div></section>
      <section className="my-6"><h2 className="mb-2 text-lg font-extrabold">Giá trị dịch vụ đã lập hóa đơn trong kỳ</h2><p className="mb-3 text-sm text-slate-600">Trước giảm giá và hoàn tiền, không đồng nghĩa tiền thực thu.</p><div className="pc-table-region"><table className="pc-data-table"><thead><tr><th>Dịch vụ</th><th className="text-right">Số lượt</th><th className="pc-money">Giá trị (₫)</th></tr></thead><tbody>{data.services.map((row,index)=><tr key={index}><td>{row.name}</td><td className="text-right">{row.quantity}</td><td className="pc-money">{formatVND(row.gross)}</td></tr>)}</tbody></table>{!data.services.length&&<p className="p-5 text-sm text-slate-600">Chưa có dịch vụ đã lập hóa đơn trong kỳ.</p>}</div></section>
      <section className="my-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-lg font-extrabold">Lịch hẹn theo ngày hẹn</h2><ul className="pc-report-statuses">{[...data.statuses].sort((a,b)=>statusOrder.indexOf(a.status)-statusOrder.indexOf(b.status)).map(row=><li key={row.status}><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge code={row.status}/><strong className="text-xl">{row.count}</strong></div><progress value={Number(row.count)} max={totalAppointments||1} aria-label={`Số lịch ${row.status}`} /></li>)}</ul>{!data.statuses.length&&<p className="text-sm text-slate-600">Chưa có lịch hẹn trong kỳ.</p>}</section>
    </>}
  </main>
}
