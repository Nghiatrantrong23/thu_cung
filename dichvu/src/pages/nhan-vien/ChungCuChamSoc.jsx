import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'

const tabs=[['profile','Hồ sơ & ghi chú'],['photos','Ảnh trước / sau'],['incident','Báo sự cố']]
const types=[['BiThuong','Bị thương / trầy xước'],['DauHieuBenh','Có dấu hiệu bệnh'],['HungDu','Hung dữ, không thể thực hiện'],['DiUng','Dị ứng / phản ứng'],['Khac','Khác']]
const labelKind={Truoc:'Ảnh trước',Sau:'Ảnh sau',SuCo:'Ảnh sự cố'}
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-lg border border-brand-600 px-3 py-2 font-bold text-brand-700 disabled:opacity-40'

export function Photo({ bookingId, item, token }) {
  const [url,setUrl]=useState('')
  useEffect(()=>{
    let active=true,objectUrl=''
    fetch(`/api/lich-hen/${bookingId}/chung-cu/anh/${item.id}`,{headers:{Authorization:`Bearer ${token}`}}).then(response=>response.ok?response.blob():null).then(blob=>{
      if(!blob||!active)return
      objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)
    }).catch(()=>{})
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
  },[bookingId,item.id,token])
  return url?<img src={url} alt={`${labelKind[item.kind]} #${item.id}`} className="aspect-square w-full rounded-lg object-cover"/>:<span className="text-xs text-slate-500">Đang tải ảnh…</span>
}

export default function ChungCuChamSoc({ booking, onChange }) {
  const {apiCall,token}=useAuth()
  const [tab,setTab]=useState('profile'),[data,setData]=useState(null),[version,setVersion]=useState(0)
  const [note,setNote]=useState(''),[type,setType]=useState('BiThuong'),[severity,setSeverity]=useState('Thap'),[description,setDescription]=useState('')
  const [files,setFiles]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const base=`/api/lich-hen/${booking.id}/chung-cu`
  const reload=useCallback(()=>setVersion(v=>v+1),[])
  useEffect(()=>{
    let active=true
    apiCall(base).then(result=>{if(!active)return;if(result.ok)setData(result.data);else setError(result.error)})
    return()=>{active=false}
  },[apiCall,base,version])
  async function saveNote(e){
    e.preventDefault();setBusy(true);setError('');setMessage('')
    const result=await apiCall(`${base}/ghi-chu`,{method:'POST',body:JSON.stringify({text:note})})
    setBusy(false);if(result.ok){setNote('');setMessage('Đã lưu ghi chú.');reload()}else setError(result.error)
  }
  async function upload(selected,kind,incidentId){
    const list=[...selected]
    if(list.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){
      setError('Chỉ nhận JPG, PNG, WebP tối đa 5 MB mỗi ảnh.');return false
    }
    setBusy(true);setError('');setMessage('')
    for(const file of list){
      const query=new URLSearchParams({loai:kind,...(incidentId?{suCoId:String(incidentId)}:{})})
      const result=await apiCall(`${base}/anh?${query}`,{method:'POST',headers:{'Content-Type':file.type},body:file})
      if(!result.ok){setError(result.error);setBusy(false);reload();return false}
    }
    setBusy(false);setMessage(`Đã lưu ${list.length} ảnh.`);reload();onChange?.();return true
  }
  async function remove(id){
    setBusy(true);setError('')
    const result=await apiCall(`${base}/anh/${id}`,{method:'DELETE'})
    setBusy(false);if(result.ok){reload();onChange?.()}else setError(result.error)
  }
  async function sendIncident(e){
    e.preventDefault();setBusy(true);setError('');setMessage('')
    const result=await apiCall(`${base}/su-co`,{method:'POST',body:JSON.stringify({type,severity,description})})
    setBusy(false)
    if(!result.ok){setError(result.error);return}
    setDescription('')
    if(files.length){const saved=await upload(files,'su-co',result.data.id);if(!saved){setMessage('Đã gửi sự cố; một số ảnh chưa lưu. Bạn có thể thêm ảnh cho sự cố bên dưới.');return}}
    setFiles([]);setMessage('Đã gửi sự cố cho lễ tân và quản lý.');reload()
  }
  const images=data?.images||[]
  const canEdit=['DaXacNhan','DangThucHien'].includes(booking.trangThaiDB)
  return <section className="mt-5 border-t border-slate-200 pt-4">
    <div role="tablist" aria-label="Thông tin chăm sóc" className="flex flex-wrap gap-2">{tabs.map(([key,label])=><button type="button" key={key} role="tab" aria-selected={tab===key} className={`${btn} ${tab===key?'bg-brand-700 text-white':''}`} onClick={()=>setTab(key)}>{label}</button>)}</div>
    {error&&<p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}{message&&<p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    {tab==='profile'&&<div className="mt-4 space-y-3"><h3 className="font-extrabold">Hồ sơ thú cưng</h3>
      {booking.allergy&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Dị ứng: {booking.allergy}</p>}
      {booking.temperament&&<p className="rounded-lg bg-amber-50 p-3 text-amber-900">Tính cách: {booking.temperament}</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm"><dt>Loài</dt><dd>{booking.species}</dd><dt>Tiêm phòng</dt><dd>{{ChuaRo:'Chưa rõ',DaTiem:'Đã tiêm',ChuaTiem:'Chưa tiêm'}[booking.vaccination]||'Chưa rõ'}</dd><dt>Ghi chú sức khỏe</dt><dd>{booking.healthNote||'Không có'}</dd><dt>Dặn của chủ</dt><dd>{booking.note||'Không có'}</dd><dt>Hiển thị ảnh cho chủ</dt><dd>{booking.photoConsent?'Đã đồng ý':'Chưa đồng ý; ảnh chỉ dùng nội bộ'}</dd></dl>
      <h3 className="font-extrabold">Ghi chú chăm sóc</h3>{data?.notes?.length?<ul className="space-y-2">{data.notes.map(item=><li key={item.id} className="rounded-lg border-l-4 border-brand-600 bg-slate-50 p-3"><p>{item.text}</p><small>{item.author} · {new Date(item.createdAt).toLocaleString('vi-VN')}</small></li>)}</ul>:<p className="text-sm text-slate-500">Chưa có ghi chú cho lịch này.</p>}
      {canEdit&&<form onSubmit={saveNote}><label className="block font-bold">Thêm ghi chú<textarea className={input} maxLength={500} required value={note} onChange={e=>setNote(e.target.value)}/></label><button className={btn} disabled={busy}>Lưu ghi chú</button></form>}
    </div>}
    {tab==='photos'&&<div className="mt-4 space-y-5"><p className="text-sm text-slate-600">JPG, PNG, WebP · tối đa 5 MB và 5 ảnh mỗi nhóm. {booking.photoConsent?'Chủ nuôi được xem ảnh trước/sau.':'Chủ nuôi chưa đồng ý hiển thị; ảnh chỉ dùng nội bộ.'}</p>
      {[["Truoc","truoc","Ảnh trước chăm sóc"],["Sau","sau","Ảnh sau chăm sóc"]].map(([kind,query,label])=><div key={kind}><h3 className="font-extrabold">{label} ({images.filter(item=>item.kind===kind).length}/5)</h3><div className="mt-2 grid grid-cols-3 gap-2">{images.filter(item=>item.kind===kind).map(item=><div key={item.id} className="relative"><Photo bookingId={booking.id} item={item} token={token}/>{canEdit&&<button type="button" aria-label={`Xóa ảnh #${item.id}`} className="absolute right-1 top-1 rounded-full bg-slate-900 px-2 text-white" disabled={busy} onClick={()=>remove(item.id)}>×</button>}</div>)}</div>
        {canEdit&&((kind==='Truoc'&&booking.trangThaiDB==='DaXacNhan')||(kind==='Sau'&&booking.trangThaiDB==='DangThucHien'))&&<label className="mt-2 block text-sm font-bold">Thêm {label.toLowerCase()}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>{if(e.target.files?.length)upload(e.target.files,query);e.target.value=''}}/></label>}</div>)}
    </div>}
    {tab==='incident'&&<div className="mt-4 space-y-4"><p className="text-sm text-slate-600">Báo cáo và ảnh sự cố chỉ nhân sự có quyền xem; không hiển thị cho khách.</p>
      {canEdit&&<form onSubmit={sendIncident} className="space-y-2"><label className="block font-bold">Loại sự cố<select className={input} value={type} onChange={e=>setType(e.target.value)}>{types.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="block font-bold">Mức độ<select className={input} value={severity} onChange={e=>setSeverity(e.target.value)}><option value="Thap">Thấp</option><option value="TrungBinh">Trung bình</option><option value="Cao">Cao, cần xử lý ngay</option></select></label><label className="block font-bold">Mô tả<textarea className={input} maxLength={800} required value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="block text-sm font-bold">Ảnh bằng chứng<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles([...e.target.files])}/></label><button className={btn} disabled={busy}>Gửi báo cáo</button></form>}
      <h3 className="font-extrabold">Báo cáo đã gửi ({data?.incidents?.length||0})</h3>{data?.incidents?.map(item=><article key={item.id} className="rounded-lg border p-3"><strong>{types.find(([key])=>key===item.type)?.[1]||item.type} · {item.severity}</strong><p>{item.description}</p><small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small><div className="mt-2 grid grid-cols-3 gap-2">{images.filter(photo=>photo.incidentId===item.id).map(photo=><Photo key={photo.id} bookingId={booking.id} item={photo} token={token}/>)}</div>{canEdit&&<label className="mt-2 block text-sm font-bold">Thêm ảnh bằng chứng<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{if(e.target.files?.length)upload(e.target.files,'su-co',item.id);e.target.value=''}}/></label>}</article>)}
    </div>}
  </section>
}
