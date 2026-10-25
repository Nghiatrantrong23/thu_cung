import HuyHieuTrangThai from '../HuyHieuTrangThai.jsx'
const hours=Array.from({length:12},(_,i)=>i+8)
const minutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m}
export default function ScheduleGrid({rows,onSelect,busy=false,shifts=false}) {
  const names=[...new Set(rows.map(row=>shifts?row.name:row.staff||'Chưa phân công'))]
  return <section className="pc-schedule" aria-label={shifts?'Lưới ca làm việc':'Lịch biểu theo nhân viên'}>
    {!rows.length?<div className="pc-page-empty"><strong>Chưa có lịch trong ngày</strong><p>Chọn ngày khác hoặc tạo lịch mới để bắt đầu.</p></div>:<div className="pc-schedule-inner"><div className="pc-schedule-row"><strong>Nhân viên / Giờ</strong><div className="pc-schedule-hours">{hours.map(hour=><span key={hour}>{hour}:00</span>)}</div></div>{names.map(name=><div className="pc-schedule-row" key={name}><strong>{name}</strong><div className="pc-schedule-track">{rows.filter(row=>(shifts?row.name:row.staff||'Chưa phân công')===name).map(row=><button type="button" key={row.id} disabled={busy} onClick={()=>onSelect(row)} className={`pc-schedule-event ${shifts&&!row.active?'pc-schedule-event--cancelled':''}`} style={{gridColumn:`${Math.max(1,Math.floor((minutes(row.start)-480)/30)+1)} / ${Math.min(23,Math.ceil((minutes(row.end)-480)/30)+1)}`}}><span className="block font-bold">{row.start}–{row.end}</span><span className="block">{shifts?row.location||'Ca chăm sóc':row.petName}</span>{!shifts&&<HuyHieuTrangThai status={row.status}/>}</button>)}</div></div>)}</div>}
  </section>
}
