import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { homePath } from '../../lib/tienIchXacThuc.js'
import { toISODate } from '../../lib/tinhGioTrong.js'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
export default function CaLamViec() {
  const {user,apiCall}=useAuth()
  const [day,setDay]=useState(toISODate(new Date())),[rows,setRows]=useState([]),[people,setPeople]=useState([]),[editing,setEditing]=useState(null)
  const empty={nhanVienId:'',gioBatDau:'08:00',gioKetThuc:'19:00',ghiChu:'',viTri:''}
  const [form,setForm]=useState(empty),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[version,setVersion]=useState(0)
  useEffect(()=>{let active=true;setLoading(true);setError('');setEditing(null)
    Promise.all([apiCall(`/api/ca-lam-viec?ngay=${day}`),apiCall('/api/ca-lam-viec/nhan-vien')]).then(([ca,staff])=>{if(!active)return
      if(ca.ok)setRows(ca.data.caLam);else{setRows([]);setError(ca.error)}
      if(staff.ok)setPeople(staff.data.nhanVien);else setError(staff.error)
      setLoading(false)
    });return()=>{active=false}
  },[day,apiCall,version])
  async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('')
    const result=await apiCall(`/api/ca-lam-viec${editing?`/${editing}`:''}`,{method:editing?'PATCH':'POST',body:JSON.stringify({...form,nhanVienId:Number(form.nhanVienId),ngay:day})})
    setBusy(false);if(result.ok){setNotice(result.data.message);setForm(empty);setVersion(v=>v+1)}else setError(result.error)
  }
  async function cancel(id){setBusy(true);setError('');const result=await apiCall(`/api/ca-lam-viec/${id}/huy`,{method:'POST'});setBusy(false);if(result.ok){setNotice(result.data.message);setVersion(v=>v+1)}else setError(result.error)}
  return <main className="mx-auto max-w-5xl p-5"><Link to={homePath(user)} className="font-bold text-brand-700">← Trang nhân sự</Link><h1 className="my-4 text-2xl font-extrabold">Quản lý ca làm việc</h1>
    <label className="block max-w-xs font-bold">Ngày<input type="date" value={day} disabled={busy} onChange={e=>{setDay(e.target.value);setForm(empty)}} className={input}/></label>
    {notice&&<p role="status" className="my-3 bg-emerald-50 p-3 text-emerald-800">{notice}</p>}{error&&<p role="alert" className="my-3 bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="my-4 grid gap-4 md:grid-cols-2"><section className="space-y-3">{loading?<p>Đang tải...</p>:rows.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4"><strong>{row.name} · {row.start}–{row.end}</strong><p className="text-sm">{row.location} {row.note}</p><p className="my-2 text-sm">{row.active?'Đang áp dụng':'Đã hủy'}</p>{row.active&&<div className="flex gap-3"><button disabled={busy} className={btn} onClick={()=>{setEditing(row.id);setForm({nhanVienId:String(row.staffId),gioBatDau:row.start,gioKetThuc:row.end,ghiChu:row.note||'',viTri:row.location||''})}}>Sửa ca</button><button disabled={busy} className={`${btn} text-red-700`} onClick={()=>cancel(row.id)}>Hủy ca</button></div>}</article>)}{!loading&&!rows.length&&<p>Chưa có ca trong ngày.</p>}</section>
    <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">{editing?'Chỉnh sửa ca':'Tạo ca mới'}</h2>
      <label className="block font-bold">Nhân viên<select required disabled={busy||!!editing} value={form.nhanVienId} onChange={e=>setForm({...form,nhanVienId:e.target.value})} className={input}><option value="">Chọn nhân viên</option>{people.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {[['gioBatDau','Giờ bắt đầu','time'],['gioKetThuc','Giờ kết thúc','time'],['viTri','Vị trí','text'],['ghiChu','Ghi chú','text']].map(([key,label,type])=><label key={key} className="block font-bold">{label}<input type={type} value={form[key]} disabled={busy} required={type==='time'} maxLength={key==='viTri'?100:255} onChange={e=>setForm({...form,[key]:e.target.value})} className={input}/></label>)}
      <p className="text-sm text-slate-500">Ca trong 08:00–19:00. Hệ thống chặn chồng ca và thay đổi làm thiếu chỗ cho lịch đang mở.</p><button className={`${btn} bg-brand-700 text-white`} disabled={busy||loading}>{busy?'Đang lưu...':'Lưu ca'}</button>{editing&&<button type="button" className={`${btn} ml-2`} onClick={()=>{setEditing(null);setForm(empty)}}>Tạo ca khác</button>}
    </form></div>
  </main>
}
