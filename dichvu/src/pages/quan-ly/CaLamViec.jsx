import { Drawer } from '../../components/ui/Modal.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { DateInput, TimeInput } from '../../components/ui/DateTimeInput.jsx'
import { useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { toISODate } from '../../lib/tinhGioTrong.js'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
export default function CaLamViec() {
  const {apiCall}=useAuth()
  const [formOpen,setFormOpen]=useState(false)
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
    setBusy(false);if(result.ok){setFormOpen(false);setNotice(result.data.message);setForm(empty);setVersion(v=>v+1)}else setError(result.error)
  }
  async function cancel(id){setBusy(true);setError('');const result=await apiCall(`/api/ca-lam-viec/${id}/huy`,{method:'POST'});setBusy(false);if(result.ok){setNotice(result.data.message);setVersion(v=>v+1)}else setError(result.error)}
  return <main className="pc-page"><PageHeading title="Quản lý ca làm việc" description="Xem ca theo ngày, tạo và cập nhật lịch làm của nhân viên chăm sóc." actions={<button type="button" className="pc-primary-action" disabled={busy} onClick={()=>{setEditing(null);setForm(empty);setFormOpen(true)}}>+ Tạo ca mới</button>}/>
    <label className="block max-w-xs font-bold">Ngày<DateInput  value={day} disabled={busy} onChange={e=>{setDay(e.target.value);setForm(empty)}} className={input}/></label>
    {notice&&<p role="status" className="my-3 bg-emerald-50 p-3 text-emerald-800">{notice}</p>}{error&&<p role="alert" className="my-3 bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="my-4 grid gap-4"><section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-lg font-extrabold">Danh sách ca trong ngày</h2>{loading?<p>Đang tải...</p>:rows.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4"><strong>{row.name} · {row.start}–{row.end}</strong><p className="text-sm">{row.location} {row.note}</p><div className="my-2"><StatusBadge domain="shift" code={row.active?'Active':'Cancelled'}/></div>{row.active&&<div className="flex gap-3"><button disabled={busy} className={btn} onClick={()=>{setFormOpen(true);setEditing(row.id);setForm({nhanVienId:String(row.staffId),gioBatDau:row.start,gioKetThuc:row.end,ghiChu:row.note||'',viTri:row.location||''})}}>Sửa ca</button><button disabled={busy} className={`${btn} text-red-700`} onClick={()=>cancel(row.id)}>Hủy ca</button></div>}</article>)}{!loading&&!rows.length&&<p className="pc-page-empty">Chưa có ca trong ngày. Chọn “Tạo ca mới” để xếp ca.</p>}</section>
    <Drawer open={formOpen} title={editing?'Chỉnh sửa ca':'Tạo ca mới'} onClose={()=>setFormOpen(false)} busy={busy}>{error&&<p role="alert" className="pc-detail-notice">{error}</p>}    <form onSubmit={save} className="space-y-4">
      <label className="block font-bold">Nhân viên<select required disabled={busy||!!editing} value={form.nhanVienId} onChange={e=>setForm({...form,nhanVienId:e.target.value})} className={input}><option value="">Chọn nhân viên</option>{people.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      {[['gioBatDau','Giờ bắt đầu','time'],['gioKetThuc','Giờ kết thúc','time'],['viTri','Vị trí','text'],['ghiChu','Ghi chú','text']].map(([key,label,type])=>{const Control=type==='time'?TimeInput:'input';return <label key={key} className="block font-bold">{label}<Control type={type} placeholder={key==='viTri'?'Ví dụ: Khu chăm sóc':key==='ghiChu'?'Ghi chú bàn giao ca':'HH:mm'} value={form[key]} disabled={busy} required={type==='time'} maxLength={key==='viTri'?100:255} onChange={e=>setForm({...form,[key]:e.target.value})} className={input}/></label>})}
      <p className="text-sm text-slate-500">Ca trong 08:00–19:00. Hệ thống chặn chồng ca và thay đổi làm thiếu chỗ cho lịch đang mở.</p><button className={`${btn} bg-brand-700 text-white`} disabled={busy||loading}>{busy?'Đang lưu...':'Lưu ca'}</button>{editing&&<button type="button" className={`${btn} ml-2`} onClick={()=>{setEditing(null);setForm(empty)}}>Tạo ca khác</button>}
    </form></Drawer></div>
  </main>
}
