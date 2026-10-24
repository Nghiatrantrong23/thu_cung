import { useCallback,useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { homePath } from '../../lib/tienIchXacThuc.js'
import { formatVND } from '../../lib/tinhGioTrong.js'
const input='w-full rounded-lg border border-slate-300 bg-white p-2'
const btn='rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-40'
export const billLabels={ChuaThanhToan:'Chưa thanh toán',ThanhToanMotPhan:'Thanh toán một phần',DaThanhToan:'Đã thanh toán',DaHoanTien:'Đã hoàn tiền',HoanTienMotPhan:'Hoàn tiền một phần',DaHuy:'Đã hủy'}
export function Receipt({data}) {
  const {invoice,details,paid,refunded,remaining}=data
  return <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-extrabold">PetCare · Hóa đơn #{invoice.ma_hoa_don}</h2><p>Ngày lập: {invoice.date}</p><p>Khách hàng: {invoice.customer_name} · {invoice.so_dien_thoai}</p><p>Thú cưng: {invoice.pet_name} · Lịch #{invoice.ma_lich_hen}</p><p className="my-3 font-bold">{billLabels[invoice.trang_thai]||invoice.trang_thai}</p>
    <table className="my-4 w-full text-left text-sm"><thead><tr><th>Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{details.map((row,index)=><tr key={index} className="border-t border-slate-100"><td className="py-2">{row.name}</td><td>{row.quantity}</td><td>{formatVND(row.price)}</td><td>{formatVND(row.amount)}</td></tr>)}</tbody></table>
    <dl className="space-y-1 text-right">{[['Tổng dịch vụ',invoice.tong_tien],['Giảm giá',invoice.giam_gia],['Thành tiền',invoice.thanh_tien],['Đã thu',paid],['Đã hoàn',refunded],['Còn nợ',remaining]].map(([label,value])=><div key={label}><dt className="inline">{label}: </dt><dd className="inline font-bold">{formatVND(value)} VNĐ</dd></div>)}</dl>
  </article>
}
export default function HoaDon() {
  const {user,apiCall}=useAuth()
  const [bills,setBills]=useState([]),[bookings,setBookings]=useState([]),[selected,setSelected]=useState(''),[data,setData]=useState(null)
  const [booking,setBooking]=useState(''),[discount,setDiscount]=useState('0'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
  const [amount,setAmount]=useState(''),[cash,setCash]=useState(''),[method,setMethod]=useState('TienMat'),[received,setReceived]=useState(false),[reference,setReference]=useState(''),[key,setKey]=useState(()=>crypto.randomUUID())
  const load=useCallback(async()=>{
    const [invoices,appointments]=await Promise.all([apiCall('/api/hoa-don'),apiCall('/api/lich-hen?trangThai=HoanThanh')])
    if(invoices.ok)setBills(invoices.data.hoaDon);else setError(invoices.error)
    if(appointments.ok)setBookings(appointments.data.lichHen);else setError(appointments.error)
  },[apiCall])
  useEffect(()=>{load()},[load])
  const detail=useCallback(async(id)=>{const result=await apiCall(`/api/hoa-don/${id}`);if(result.ok){setData(result.data);setAmount(String(result.data.remaining));setCash(String(result.data.remaining));setReceived(false)}else setError(result.error)},[apiCall])
  useEffect(()=>{setData(null);if(selected){detail(selected);setKey(crypto.randomUUID())}},[selected,detail])
  async function create(e){e.preventDefault();setBusy(true);setError('');setNotice('')
    const result=await apiCall('/api/hoa-don',{method:'POST',body:JSON.stringify({maLichHen:Number(booking),giamGia:discount})})
    setBusy(false);if(result.ok){setNotice(result.data.message);await load();setSelected(String(result.data.id));setBooking('')}else setError(result.error)
  }
  async function pay(failed=false){setBusy(true);setError('');setNotice('')
    const result=await apiCall(`/api/hoa-don/${selected}/thanh-toan`,{method:'POST',body:JSON.stringify({soTien:amount,phuongThuc:method,tienKhachDua:cash,daNhanTien:received,maGiaoDich:reference,khoaChongLap:key,ketQua:failed?'ThatBai':'ThanhCong'})})
    if(result.ok){setNotice(result.data.message);setKey(crypto.randomUUID());await detail(selected);await load()}else setError(result.error)
    setBusy(false)
  }
  async function qr(){const result=await apiCall(`/api/hoa-don/${selected}/qr`);if(!result.ok)setError(result.error)}
  const available=bookings.filter(row=>!bills.some(b=>b.bookingId===row.id))
  return <main className="mx-auto max-w-6xl p-5"><Link to={homePath(user)} className="font-bold text-brand-700">← Trang nhân sự</Link><h1 className="my-4 text-2xl font-extrabold">Lập hóa đơn và thanh toán</h1>
    {error&&<p role="alert" className="my-3 bg-red-50 p-3 text-red-700">{error}</p>}{notice&&<p role="status" className="my-3 bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
    <div className="grid gap-5 md:grid-cols-2"><section className="space-y-4"><form onSubmit={create} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Lập hóa đơn mới</h2>
      <label className="block font-bold">Lịch đã hoàn thành<select className={input} value={booking} disabled={busy} required onChange={e=>setBooking(e.target.value)}><option value="">Chọn lịch</option>{available.map(row=><option key={row.id} value={row.id}>#{row.id} · {row.customerName} · {row.petName} · {formatVND(row.total)} VNĐ</option>)}</select></label>
      <label className="block font-bold">Giảm giá (VNĐ)<input className={input} value={discount} type="number" min="0" step="0.01" required disabled={busy} onChange={e=>setDiscount(e.target.value)}/></label><button className={`${btn} bg-brand-700 text-white`} disabled={busy||!booking}>Lập hóa đơn</button>
    </form><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-3 flex justify-between"><h2 className="font-extrabold">Hóa đơn gần nhất</h2><button className="font-bold text-brand-700" disabled={busy} onClick={load}>Tải lại</button></div>
      {!bills.length&&<p>Chưa có hóa đơn.</p>}<ul className="max-h-96 space-y-2 overflow-auto">{bills.map(row=><li key={row.id}><button disabled={busy} onClick={()=>{setSelected(String(row.id));setError('');setNotice('')}} className={`w-full rounded-lg border p-3 text-left ${selected===String(row.id)?'border-brand-600 bg-brand-50':'border-slate-200'}`}><strong>HD-{row.id} · {row.customerName}</strong><p>{formatVND(row.amount)} VNĐ · {billLabels[row.status]}</p></button></li>)}</ul></div>
    </section><section>{!data?<p>Chọn hóa đơn để xem chi tiết.</p>:<><Receipt data={data}/><Link to={`/le-tan/hoa-don/${selected}/in`} target="_blank" rel="noreferrer" className="my-3 inline-block font-bold text-brand-700">Mở bản in hóa đơn</Link>
      {data.remaining>0&&['ChuaThanhToan','ThanhToanMotPhan'].includes(data.invoice.trang_thai)&&<div className="my-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Ghi nhận thanh toán</h2>
        <label className="block font-bold">Phương thức<select className={input} disabled={busy} value={method} onChange={e=>{setMethod(e.target.value);setKey(crypto.randomUUID())}}><option value="TienMat">Tiền mặt</option><option value="ChuyenKhoanQR">Chuyển khoản</option></select></label>
        <label className="block font-bold">Số tiền ghi nhận (VNĐ)<input className={input} disabled={busy} value={amount} type="number" min="0.01" max={data.remaining} step="0.01" onChange={e=>{setAmount(e.target.value);setKey(crypto.randomUUID())}}/></label>
        {method==='TienMat'?<><label className="block font-bold">Tiền khách đưa (VNĐ)<input className={input} disabled={busy} value={cash} type="number" step="0.01" min={amount} onChange={e=>{setCash(e.target.value);setKey(crypto.randomUUID())}}/></label><p>Tiền thừa: <strong>{formatVND(Math.max(0,Number(cash)-Number(amount)))} VNĐ</strong></p></>:<><button type="button" className={btn} onClick={qr}>Tạo mã QR</button><label className="block">Mã tham chiếu chuyển khoản<input className={input} value={reference} maxLength={100} disabled={busy} onChange={e=>{setReference(e.target.value);setKey(crypto.randomUUID())}}/></label><label className="flex gap-2"><input type="checkbox" checked={received} disabled={busy} onChange={e=>setReceived(e.target.checked)}/>Tôi đã kiểm tra và thực tế nhận được tiền</label></>}
        <div className="flex flex-wrap gap-3"><button className={`${btn} bg-brand-700 text-white`} disabled={busy} onClick={()=>pay()}>Ghi nhận thanh toán</button><button className={btn} disabled={busy} onClick={()=>pay(true)}>Lưu giao dịch thất bại</button></div><p className="text-sm text-slate-500">Có thể thu nhiều lần; số tiền còn nợ được giữ để thu tiếp ở phiên sau.</p>
      </div>}
      <h2 className="my-3 font-extrabold">Lịch sử giao dịch</h2><ul className="space-y-2 text-sm">{data.transactions.map(row=><li key={row.id} className="rounded-lg border border-slate-200 bg-white p-3"><strong>#{row.id} · {row.date} · {{TienMat:'Tiền mặt',ChuyenKhoanQR:'Chuyển khoản',HoanTien:'Hoàn tiền'}[row.method]||row.method}</strong><p>{formatVND(row.amount)} VNĐ · {{ThanhCong:'Thành công',ThatBai:'Thất bại'}[row.status]||row.status}</p>{row.cash!=null&&<p>Khách đưa: {formatVND(row.cash)} · Trả lại: {formatVND(row.change)}</p>}</li>)}</ul>
    </>}</section></div>
  </main>
}
