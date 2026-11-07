import { Drawer } from '../../components/ui/Modal.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { displayDate } from '../../lib/displayDate.js'
import { useCallback,useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND } from '../../lib/tinhGioTrong.js'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
const states={DaTiepNhan:'Đã tiếp nhận',ChoHoanTien:'Đã duyệt, chờ thực chi',DaXuLy:'Đã xử lý'}
export default function KhieuNai(){
  const [creating,setCreating]=useState(false)
  const {user,apiCall}=useAuth(),manager=['manager','admin'].includes(user.roleKey)
  const [rows,setRows]=useState([]),[bookings,setBookings]=useState([]),[selected,setSelected]=useState(null),[filter,setFilter]=useState('')
  const [booking,setBooking]=useState(''),[content,setContent]=useState(''),[decision,setDecision]=useState('KhacPhuc'),[plan,setPlan]=useState(''),[amount,setAmount]=useState('0')
  const [method,setMethod]=useState('TienMat'),[proof,setProof]=useState(''),[confirmed,setConfirmed]=useState(false),[failure,setFailure]=useState(''),[key,setKey]=useState(()=>crypto.randomUUID())
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[bill,setBill]=useState(null)
  const load=useCallback(async()=>{const [complaints,appointments]=await Promise.all([apiCall('/api/khieu-nai'),apiCall('/api/lich-hen')]);if(complaints.ok)setRows(complaints.data.khieuNai);else setError(complaints.error);if(appointments.ok)setBookings(appointments.data.lichHen);else setError(appointments.error)},[apiCall])
  useEffect(()=>{load()},[load])
  useEffect(()=>{let active=true;setBill(null);setPlan('');setAmount('0');setProof('');setConfirmed(false);setFailure('');setKey(crypto.randomUUID())
    if(selected?.ma_hoa_don)apiCall(`/api/hoa-don/${selected.ma_hoa_don}`).then(result=>{if(!active)return;if(result.ok)setBill(result.data);else setError(result.error)})
    return()=>{active=false}
  },[selected,apiCall])
  async function submit(e){e.preventDefault();setBusy(true);setError('');setNotice('')
    const result=await apiCall('/api/khieu-nai',{method:'POST',body:JSON.stringify({maLichHen:Number(booking),noiDung:content})});setBusy(false)
    if(result.ok){setCreating(false);setNotice(result.data.message);setContent('');setBooking('');await load()}else setError(result.error)
  }
  async function decide(){setBusy(true);setError('');setNotice('')
    const result=await apiCall(`/api/khieu-nai/${selected.ma_khieu_nai}/quyet-dinh`,{method:'PATCH',body:JSON.stringify({quyetDinh:decision,phuongAn:plan,soTienHoan:amount})});setBusy(false)
    if(result.ok){setNotice(result.data.message);setSelected(null);await load()}else setError(result.error)
  }
  async function execute(failed=false){setBusy(true);setError('');setNotice('')
    const result=await apiCall(`/api/khieu-nai/${selected.ma_khieu_nai}/chi-hoan`,{method:'POST',body:JSON.stringify({khoaChongLap:key,phuongThucChi:method,xacNhanDaChi:confirmed,bangChung:proof,ketQua:failed?'ThatBai':'ThanhCong',loiChi:failure})});setBusy(false)
    if(result.ok){setNotice(result.data.message);setSelected(null);setKey(crypto.randomUUID());await load()}else setError(result.error)
  }
  return <main className="pc-page"><PageHeading title="Khiếu nại và hoàn tiền" description="Theo dõi tiếp nhận, quyết định xử lý và các khoản hoàn tiền." actions={<button type="button" className="pc-primary-action" disabled={busy} onClick={()=>{setError('');setCreating(true)}}>+ Tiếp nhận khiếu nại</button>}/>
    {notice&&<p role="status" className="my-3 bg-emerald-50 p-3 text-emerald-800">{notice}</p>}{error&&<p role="alert" className="my-3 bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="space-y-5"><section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-lg font-extrabold">Danh sách khiếu nại</h2><div className="mb-3 flex flex-wrap items-end gap-3"><label className="font-bold">Lọc trạng thái<select className={input} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Tất cả</option>{Object.entries(states).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className={btn} disabled={busy} onClick={load}>Tải lại</button></div><ul className="grid gap-3 md:grid-cols-2">{rows.filter(row=>!filter||row.trang_thai===filter).map(row=><li key={row.ma_khieu_nai}><button disabled={busy} className={`w-full rounded-lg border p-3 text-left ${selected?.ma_khieu_nai===row.ma_khieu_nai?'border-brand-600 bg-brand-50':'border-slate-200'}`} onClick={()=>{setSelected(row);setError('');setNotice('')}}><strong>KN-{row.ma_khieu_nai} · {row.customer_name}</strong><p>Lịch #{row.ma_lich_hen}</p><StatusBadge domain="complaint" code={row.trang_thai}/></button></li>)}</ul>{!rows.filter(row=>!filter||row.trang_thai===filter).length&&<p className="pc-page-empty">Không có khiếu nại phù hợp với bộ lọc.</p>}</div>
    </section><Drawer open={!!selected} title={selected?`Khiếu nại #${selected.ma_khieu_nai}`:'Chi tiết khiếu nại'} onClose={()=>setSelected(null)} busy={busy}>{error&&<p role="alert" className="pc-detail-notice">{error}</p>}{!selected?null:<><h2 className="text-lg font-extrabold">Khiếu nại #{selected.ma_khieu_nai}</h2><p className="my-2">{selected.customer_name} · {selected.pet_name} · {displayDate(selected.date)}</p><p className="my-3 whitespace-pre-wrap">{selected.noi_dung}</p><p className="font-bold">{states[selected.trang_thai]}</p>
      {bill&&<div className="my-3 rounded-lg bg-slate-50 p-3 text-sm"><p>Hóa đơn #{bill.invoice.ma_hoa_don} · Thành tiền {formatVND(bill.invoice.thanh_tien)} ₫</p><p>Đã thu: {formatVND(bill.paid)} · Đã hoàn: {formatVND(bill.refunded)} ₫</p><p>Còn có thể hoàn trước các khoản đang chờ chi: {formatVND(bill.paid-bill.refunded)} ₫</p></div>}
      {selected.ket_qua_xu_ly&&<p className="my-3 whitespace-pre-wrap">Kết luận: {selected.ket_qua_xu_ly}</p>}
      {manager&&selected.trang_thai==='DaTiepNhan'&&<div className="my-4 space-y-4"><label className="block font-bold">Quyết định<select className={input} value={decision} disabled={busy} onChange={e=>setDecision(e.target.value)}><option value="KhacPhuc">Chấp nhận, khắc phục không hoàn tiền</option><option value="TuChoi">Bác bỏ khiếu nại</option><option value="HoanTien">Chấp nhận, duyệt hoàn tiền</option></select></label><label className="block font-bold">Phương án / Lý do<textarea className={input} value={plan} maxLength={2000} rows={3} disabled={busy} onChange={e=>setPlan(e.target.value)}/></label>{decision==='HoanTien'&&<label className="block font-bold">Số tiền duyệt hoàn (₫)<input className={input} type="number" min="0.01" step="0.01" value={amount} disabled={busy} onChange={e=>setAmount(e.target.value)}/></label>}<button className={`${btn} bg-brand-700 text-white`} disabled={busy} onClick={decide}>Lưu quyết định</button></div>}
      {selected.trang_thai==='ChoHoanTien'&&<div className="my-4 space-y-4"><p className="rounded-lg bg-amber-50 p-3 font-bold text-amber-800">Đã duyệt {formatVND(selected.so_tien_hoan)} ₫. Chưa xác nhận đã trả tiền.</p>{selected.loi_chi&&<p className="text-red-700">Lần chi trước chưa thành công: {selected.loi_chi}</p>}
        <label className="block font-bold">Phương thức chi<select className={input} value={method} disabled={busy} onChange={e=>setMethod(e.target.value)}><option value="TienMat">Tiền mặt</option><option value="ChuyenKhoan">Chuyển khoản</option></select></label><label className="block font-bold">Mã phiếu chi / tham chiếu bằng chứng<input className={input} value={proof} disabled={busy} maxLength={100} onChange={e=>setProof(e.target.value)}/></label><label className="flex gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>Tôi đã thực tế trả tiền hoàn cho khách</label><button className={`${btn} bg-brand-700 text-white`} disabled={busy} onClick={()=>execute()}>Xác nhận đã chi hoàn</button>
        <label className="block">Nếu chi thất bại, nhập nguyên nhân<textarea className={input} value={failure} maxLength={500} disabled={busy} onChange={e=>setFailure(e.target.value)}/></label><button className={btn} disabled={busy} onClick={()=>execute(true)}>Lưu chi thất bại, giữ chờ xử lý</button>
      </div>}
      {selected.ngay_chi&&<div className="my-4 rounded-lg bg-emerald-50 p-3"><p>Đã chi {formatVND(selected.so_tien_hoan)} ₫ qua {selected.phuong_thuc_hoan}.</p><p>Chứng từ: {selected.bang_chung_chi}</p><Link className="font-bold text-brand-700" to={`/le-tan/hoa-don/${selected.ma_hoa_don}/in`} target="_blank" rel="noreferrer">In hóa đơn sau hoàn tiền</Link><Link className="ml-4 font-bold text-brand-700" to={`/le-tan/khieu-nai/${selected.ma_khieu_nai}/in`} target="_blank" rel="noreferrer">In phiếu hoàn tiền</Link></div>}
    </>}</Drawer></div>
    <Drawer open={creating} title="Tiếp nhận khiếu nại" onClose={()=>setCreating(false)} busy={busy}>{error&&<p role="alert" className="pc-detail-notice">{error}</p>}<form onSubmit={submit} className="space-y-4"><label className="block font-bold">Lịch liên quan<select className={input} required value={booking} disabled={busy} onChange={e=>setBooking(e.target.value)}><option value="">Chọn lịch</option>{bookings.map(row=><option key={row.id} value={row.id}>#{row.id} · {row.customerName} · {row.petName} · {displayDate(row.date)}</option>)}</select></label><label className="block font-bold">Nội dung<textarea className={input} required maxLength={2000} rows={3} value={content} disabled={busy} onChange={e=>setContent(e.target.value)}/></label><button className={`${btn} bg-brand-700 text-white`} disabled={busy}>Tiếp nhận khiếu nại</button></form></Drawer>
  </main>
}
