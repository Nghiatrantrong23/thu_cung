import { Drawer } from '../../components/ui/Modal.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useCallback,useEffect,useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND } from '../../lib/tinhGioTrong.js'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
export default function DichVu(){const {apiCall}=useAuth()
  const [panel,setPanel]=useState('')
  const empty={ten:'',moTa:'',maLoaiDichVu:'',gia:'0',thoiLuongPhut:60,dangKinhDoanh:true}
  const [rows,setRows]=useState([]),[types,setTypes]=useState([]),[form,setForm]=useState(empty),[id,setId]=useState(null),[typeName,setTypeName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const load=useCallback(async()=>{const result=await apiCall('/api/dich-vu/quan-ly');if(result.ok){setRows(result.data.dichVu);setTypes(result.data.loaiDichVu)}else setError(result.error)},[apiCall])
  useEffect(()=>{load()},[load])
  async function save(e){e.preventDefault();setBusy(true);setError('');const result=await apiCall(`/api/dich-vu${id?`/${id}`:''}`,{method:id?'PATCH':'POST',body:JSON.stringify({...form,maLoaiDichVu:Number(form.maLoaiDichVu),thoiLuongPhut:Number(form.thoiLuongPhut)})});setBusy(false);if(result.ok){setPanel('');setMessage(result.data.message);setId(null);setForm(empty);await load()}else setError(result.error)}
  async function type(e){e.preventDefault();setBusy(true);setError('');const result=await apiCall('/api/dich-vu/loai',{method:'POST',body:JSON.stringify({ten:typeName})});setBusy(false);if(result.ok){setPanel('');setTypeName('');setMessage(result.data.message);await load()}else setError(result.error)}
  return <main className="pc-page"><PageHeading title="Dịch vụ và bảng giá" description="Quản lý dịch vụ đang bán và giữ nguyên giá trong lịch hẹn, hóa đơn cũ." actions={<><button type="button" className={btn} disabled={busy} onClick={()=>{setError('');setPanel('type')}}>+ Nhóm dịch vụ</button><button type="button" className="pc-primary-action" disabled={busy} onClick={()=>{setId(null);setForm(empty);setError('');setPanel('service')}}>+ Thêm dịch vụ</button></>}/>{error&&<p role="alert" className="my-3 bg-red-50 p-3 text-red-700">{error}</p>}{message&&<p role="status" className="my-3 bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    <div className="grid gap-4"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{!rows.length&&<p className="pc-page-empty">Chưa có dịch vụ. Chọn “Thêm dịch vụ” để bắt đầu.</p>}{rows.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="font-extrabold">{row.name}</h2><p>{row.duration} phút · {formatVND(row.price)} ₫</p><div className="my-3"><StatusBadge domain="catalog" code={row.active?'Active':'Inactive'}/></div><button disabled={busy} className={`${btn} mt-2`} onClick={()=>{setPanel('service');setError('');setId(row.id);setForm({ten:row.name,moTa:row.description||'',maLoaiDichVu:String(row.typeId),gia:String(row.price),thoiLuongPhut:row.duration,dangKinhDoanh:row.active})}}>Sửa dịch vụ</button></article>)}</section>

    </div>
    <Drawer open={panel==='service'} title={id?'Chỉnh sửa dịch vụ':'Thêm dịch vụ'} onClose={()=>setPanel('')} busy={busy}>{error&&<p role="alert" className="pc-detail-notice">{error}</p>}<form onSubmit={save} className="space-y-4">
        <label className="block font-bold">Tên dịch vụ<input className={input} maxLength={100} required disabled={busy} value={form.ten} onChange={e=>setForm({...form,ten:e.target.value})}/></label>
        <label className="block font-bold">Nhóm<select className={input} required disabled={busy} value={form.maLoaiDichVu} onChange={e=>setForm({...form,maLoaiDichVu:e.target.value})}><option value="">Chọn nhóm</option>{types.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="block font-bold">Giá (₫)<input className={input} type="number" min="0" step="0.01" required disabled={busy} value={form.gia} onChange={e=>setForm({...form,gia:e.target.value})}/></label>
        <label className="block font-bold">Thời lượng (phút)<input className={input} type="number" min="1" max="660" required disabled={busy} value={form.thoiLuongPhut} onChange={e=>setForm({...form,thoiLuongPhut:e.target.value})}/></label>
        <label className="block font-bold">Mô tả<textarea className={input} maxLength={500} disabled={busy} value={form.moTa} onChange={e=>setForm({...form,moTa:e.target.value})}/></label><label className="flex gap-2"><input type="checkbox" disabled={busy} checked={form.dangKinhDoanh} onChange={e=>setForm({...form,dangKinhDoanh:e.target.checked})}/>Đang kinh doanh</label>
        <button disabled={busy} className={`${btn} bg-brand-700 text-white`}>Lưu dịch vụ</button>{id&&<button type="button" disabled={busy} className={`${btn} ml-2`} onClick={()=>{setId(null);setForm(empty)}}>Thêm mới</button>}<p className="text-sm text-slate-500">Ngừng bán giữ lịch sử. Giá đã chụp trên lịch và hóa đơn không bị cập nhật theo bảng giá mới.</p>
      </form></Drawer>
    <Drawer open={panel==='type'} title="Nhóm dịch vụ mới" onClose={()=>setPanel('')} busy={busy}>{error&&<p role="alert" className="pc-detail-notice">{error}</p>}<form onSubmit={type} className="space-y-4"><label className="block font-bold">Nhóm dịch vụ mới<input className={input} maxLength={100} required disabled={busy} value={typeName} onChange={e=>setTypeName(e.target.value)}/></label><button disabled={busy} className={btn}>Tạo nhóm</button></form></Drawer>
  </main>
}
