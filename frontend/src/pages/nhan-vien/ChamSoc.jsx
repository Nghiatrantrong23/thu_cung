import ScheduleGrid from '../../components/ui/ScheduleGrid.jsx'
import { DateInput } from '../../components/ui/DateTimeInput.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { toISODate } from '../../lib/tinhGioTrong.js'

import NhatKyLich from '../../components/NhatKyLich.jsx'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
export default function ChamSoc() {
  const {apiCall}=useAuth()
  const [day,setDay]=useState(toISODate(new Date())),[rows,setRows]=useState([]),[shifts,setShifts]=useState([])
  const [selected,setSelected]=useState(null),[note,setNote]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('')
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[version,setVersion]=useState(0)
  useEffect(()=>{
    let active=true;setLoading(true);setError('')
    Promise.all([apiCall(`/api/lich-hen?ngay=${day}`),apiCall(`/api/ca-lam-viec?ngay=${day}`)]).then(([appointments,ca])=>{
      if(!active)return
      if(appointments.ok){setRows(appointments.data.lichHen);setSelected(current=>current?appointments.data.lichHen.find(row=>row.id===current.id)||null:null)}else {setRows([]);setSelected(null);setError(appointments.error)}
      if(ca.ok)setShifts(ca.data.caLam.filter(row=>row.active));else setError(ca.error)
      setLoading(false)
    });return()=>{active=false}
  },[day,version,apiCall])
  async function act(action,service,status) {
    if(busy||!selected)return
    if(action==='khong-du-dieu-kien'&&!note.trim()){setError('Nhập lý do không đủ điều kiện.');return}
    setBusy(true);setError('');setMessage('')
    const result=await apiCall(`/api/lich-hen/${selected.id}/cham-soc`,{method:'PATCH',body:JSON.stringify({hanhDong:action,maDichVu:service,trangThai:status,ghiChu:note})})
    setBusy(false)
    if(result.ok){setMessage(result.data.message);setVersion(v=>v+1)}else {setError(result.error);if(result.status===409)setVersion(v=>v+1)}
  }
  return <main className="pc-page">
    <Link to="/nhan-vien" className="font-bold text-brand-700">← Trang nhân viên</Link><h1 className="my-4 text-2xl font-extrabold">Lịch làm việc và chăm sóc thú cưng</h1>
    <label className="block max-w-xs font-bold">Ngày làm việc<DateInput aria-label="Ngày làm việc"  value={day} disabled={busy} onChange={e=>{setSelected(null);setNote('');setDay(e.target.value)}} className={input}/></label>
    <p className="my-3 text-sm text-slate-600">Ca của bạn: {shifts.map(row=>`${row.start}–${row.end}`).join(', ')||'Không có ca'}</p>
    <button className={btn} disabled={busy||loading} onClick={()=>setVersion(v=>v+1)}>Tải lại</button>
    {message&&<p role="status" className="my-3 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>}{error&&<p role="alert" className="my-3 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {!loading&&<div className="my-5"><ScheduleGrid rows={rows.map(row=>({...row,staff:'Lịch của bạn'}))} busy={busy} onSelect={row=>{setSelected(row);setNote('');setError('')}}/></div>}
    {loading?<p>Đang tải...</p>:<div className="mt-4 grid gap-4 md:grid-cols-2"><section className="space-y-3">
      {!rows.length&&<p>Không có lịch được phân công trong ngày.</p>}{rows.map(row=><button disabled={busy} key={row.id} className={`block w-full rounded-xl border p-4 text-left ${selected?.id===row.id?'border-brand-600 bg-brand-50':'border-slate-200 bg-white'}`} onClick={()=>{setSelected(row);setNote('');setError('')}}><strong>#{row.id} · {row.start}–{row.end} · {row.petName}</strong><p className="my-2 text-sm">{row.serviceNames.join(', ')}</p><HuyHieuTrangThai status={row.status}/></button>)}
    </section><section className="rounded-xl border border-slate-200 bg-white p-5">{!selected?<p>Chọn lịch để tiếp nhận và cập nhật.</p>:<>
      <h2 className="text-lg font-extrabold">Lịch #{selected.id} · {selected.petName}</h2><p className="my-2">{selected.species}{selected.weightKg?` · ${selected.weightKg} kg`:''}</p><p className={selected.healthNote?'my-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900':'text-sm text-slate-500'}>Ghi chú sức khỏe: {selected.healthNote||'Không có'}</p>
      <ol className="my-4 flex flex-wrap gap-2" aria-label="Tiến trình chăm sóc">{[['DaXacNhan','Tiếp nhận'],['DangThucHien','Đang chăm sóc'],['HoanThanh','Hoàn tất']].map(([code,label])=><li key={code} aria-current={selected.trangThaiDB===code?'step':undefined} className={`rounded-full px-3 py-2 text-sm font-bold ${selected.trangThaiDB===code?'bg-brand-700 text-white':'bg-slate-100 text-slate-600'}`}>{label}</li>)}</ol>
      {selected.careIssue&&<p className="my-3 rounded-lg bg-amber-50 p-3 text-amber-800">Đang chờ lễ tân xử lý: {selected.careIssue}</p>}
      {['DaXacNhan','DangThucHien'].includes(selected.trangThaiDB)&&<><label className="mt-4 block font-bold">Ghi chú chăm sóc / Lý do không đủ điều kiện<textarea aria-label="Ghi chú chăm sóc" value={note} maxLength={500} disabled={busy} onChange={e=>setNote(e.target.value)} className={input} rows={3}/></label>
      {selected.trangThaiDB==='DaXacNhan'&&<div className="my-3 flex flex-wrap gap-3"><button className={`${btn} bg-brand-700 text-white`} disabled={busy||!!selected.careIssue} onClick={()=>act('bat-dau')}>Bắt đầu thực hiện</button><button className={`${btn} text-red-700`} disabled={busy} onClick={()=>act('khong-du-dieu-kien')}>Không đủ điều kiện</button></div>}</>}
      <ul className="my-4 space-y-3">{selected.dichVu.map(service=><li key={service.id} className="rounded-lg border border-slate-200 p-3"><strong>{service.ten}</strong><p className="my-1 text-sm">{{ChoThucHien:'Chờ thực hiện',DangThucHien:'Đang thực hiện',HoanThanh:'Hoàn thành',DaHuy:'Đã hủy'}[service.trangThai]||service.trangThai}</p><p className="whitespace-pre-wrap text-sm text-slate-500">{service.careNote}</p>
        {selected.trangThaiDB==='DangThucHien'&&['ChoThucHien','DangThucHien'].includes(service.trangThai)&&<button className={`${btn} mt-2`} disabled={busy} onClick={()=>act('dich-vu',service.id,service.trangThai==='ChoThucHien'?'DangThucHien':'HoanThanh')}>{service.trangThai==='ChoThucHien'?'Bắt đầu dịch vụ':'Hoàn tất dịch vụ này'}</button>}
      </li>)}</ul>
      {selected.trangThaiDB==='DangThucHien'&&<button className={`${btn} bg-brand-700 text-white`} disabled={busy||!selected.dichVu.length||selected.dichVu.some(row=>row.trangThai!=='HoanThanh')} onClick={()=>act('hoan-thanh')}>Hoàn thành lịch chăm sóc</button>}
      <NhatKyLich id={selected.id} version={version}/>
    </>}</section></div>}
  </main>
}
