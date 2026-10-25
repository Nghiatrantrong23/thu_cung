import {useCallback,useEffect,useState} from 'react'
import {useAuth} from '../data/khoXacThuc.jsx'
import {DateInput,TimeInput} from './ui/DateTimeInput.jsx'
import {formatVND,toISODate} from '../lib/tinhGioTrong.js'
const labels={Unpaid:'Chờ đóng cọc',Paid:'Đã nhận cọc · chờ xác nhận lịch',Applied:'Đã trừ cọc vào hóa đơn',RefundPending:'Đủ điều kiện hoàn · đang chờ thực chi',Refunded:'Đã hoàn đủ cọc',Forfeited:'Cọc không hoàn theo chính sách',Cancelled:'Đã hủy yêu cầu cọc'}
const input='mt-1 w-full rounded-xl border border-slate-300 bg-white p-3'
const button='rounded-full border border-brand-600 px-4 py-2 font-bold text-brand-800 disabled:opacity-50'
export default function DepositPanel({bookingId,onChange}) {
  const {apiCall,user}=useAuth()
  const staff=['reception','manager','admin'].includes(user?.roleKey),manager=['manager','admin'].includes(user?.roleKey)
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const [method,setMethod]=useState('BankQR'),[cashMethod,setCashMethod]=useState('TienMat'),[reference,setReference]=useState(''),[received,setReceived]=useState(false)
  const [reason,setReason]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState('09:00'),[moving,setMoving]=useState(false)
  const load=useCallback(async()=>{const response=await apiCall(`/api/deposits/${bookingId}`);if(response.ok)setData(response.data);else setError(response.error);return response},[apiCall,bookingId])
  useEffect(()=>{let active=true;setData(null);setError('');apiCall(`/api/deposits/${bookingId}`).then(result=>{if(!active)return;if(result.ok)setData(result.data);else setError(result.error)});return()=>{active=false}},[apiCall,bookingId])
  useEffect(()=>{
    if(data?.deposit?.status!=='Unpaid'||data?.intent?.status!=='Pending')return
    let active=true,timer
    async function poll(){const result=await apiCall(`/api/deposits/${bookingId}`);if(!active)return;if(result.ok){setData(result.data);if(result.data.deposit?.status!=='Unpaid'||result.data.intent?.status!=='Pending')return}else{setError(result.error);return}timer=setTimeout(poll,3000)}
    timer=setTimeout(poll,3000);return()=>{active=false;clearTimeout(timer)}
  },[bookingId,apiCall,data?.deposit?.status,data?.intent?.status])
  async function act(action,body){
    setBusy(true);setError('')
    const response=await apiCall(`/api/deposits/${bookingId}/${action}`,{method:'POST',body:JSON.stringify(body)})
    if(response.ok){await load();onChange?.();setReceived(false);if(action==='reschedule')setMoving(false)}else setError(response.error)
    setBusy(false)
  }
  if(!data?.deposit)return error?<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>:null
  const deposit=data.deposit
  return <section className="my-5 space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
    <div><h2 className="text-lg font-extrabold">Tiền đặt cọc 30%</h2><p className="mt-2 text-2xl font-extrabold text-brand-800">{formatVND(deposit.amount)} ₫</p><p role="status" className="mt-2 font-bold">{labels[deposit.status]}</p></div>
    <p className="rounded-xl bg-brand-50 p-3 text-sm leading-7 text-brand-900">{deposit.policy}</p>
    {data.sandbox&&<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Sandbox cục bộ: QR, MoMo và hoàn cọc là mô phỏng, không chuyển tiền thật.</p>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {deposit.status==='Unpaid'&&<>
      {data.sandbox?<><div className="flex flex-wrap gap-2" role="group" aria-label="Phương thức đóng cọc">{[['BankQR','QR ngân hàng'],['MoMo','MoMo']].map(([value,label])=><button type="button" key={value} disabled={busy} aria-pressed={method===value} onClick={()=>setMethod(value)} className={`${button} ${method===value?'bg-brand-50':''}`}>{label}</button>)}</div><button type="button" disabled={busy} className={button} onClick={()=>act('intent',{method})}>Tạo mã đóng cọc thử</button></>:<p className="text-sm leading-7 text-slate-600">Chưa kết nối QR ngân hàng/MoMo thật. Liên hệ cửa hàng để nộp cọc; lễ tân xác nhận khi thực nhận. COD chỉ áp dụng phần còn lại, không thay thế tiền cọc.</p>}
      {data.intent&&<div className="space-y-3 rounded-xl bg-slate-50 p-3"><p className="font-bold">{data.intent.method==='MoMo'?'MoMo':'QR ngân hàng'} · {{Pending:'Chờ thanh toán',Paid:'Đã nhận',Failed:'Thất bại',Cancelled:'Đã hủy',Expired:'Đã hết hạn'}[data.intent.status]}</p>{data.intent.qr&&<img src={data.intent.qr} width="220" height="220" className="mx-auto" alt="Mã QR đóng cọc sandbox, không chuyển tiền thật"/>}{data.intent.status==='Pending'&&<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className={button} onClick={()=>act('simulate',{result:'success'})}>Mô phỏng đóng cọc thành công</button><button type="button" disabled={busy} className={button} onClick={()=>act('simulate',{result:'failed'})}>Mô phỏng thất bại</button></div>}</div>}
    </>}
    {staff&&['Unpaid','RefundPending'].includes(deposit.status)&&<div className="space-y-3 border-t pt-4">
      <h3 className="font-bold">{deposit.status==='Unpaid'?'Lễ tân xác nhận tiền cọc thực nhận':'Ghi nhận hoàn đủ tiền cọc'}</h3>
      <label className="block">Phương thức<select className={input} value={cashMethod} disabled={busy} onChange={e=>setCashMethod(e.target.value)}><option value="TienMat">Tiền mặt</option><option value="ChuyenKhoanQR">Chuyển khoản ngân hàng</option><option value="MoMo">MoMo</option></select></label>
      <label className="block">Mã tham chiếu / chứng từ<input className={input} value={reference} maxLength={100} disabled={busy} onChange={e=>setReference(e.target.value)}/></label>
      <label className="flex items-start gap-2"><input type="checkbox" checked={received} disabled={busy} onChange={e=>setReceived(e.target.checked)}/>Tôi đã kiểm tra và thực tế {deposit.status==='Unpaid'?'nhận đủ tiền cọc':'trả đủ tiền cọc cho khách'}.</label>
      <button type="button" disabled={busy||!received} className={button} onClick={()=>act(deposit.status==='Unpaid'?'collect':'refund',{key:crypto.randomUUID(),method:cashMethod,reference,received})}>{deposit.status==='Unpaid'?'Ghi nhận đã nhận cọc':'Xác nhận hoàn cọc thực chi'}</button>
      {data.sandbox&&deposit.status==='RefundPending'&&<button type="button" disabled={busy} className={button} onClick={()=>act('refund',{key:crypto.randomUUID(),method:'MoMo',reference:`SBREF-${crypto.randomUUID()}`,sandbox:true})}>Mô phỏng hoàn đủ cọc</button>}
    </div>}
    {!staff&&['Paid','Unpaid'].includes(deposit.status)&&<div className="space-y-3"><button type="button" className={button} disabled={busy||deposit.lateReschedules>=1} onClick={()=>setMoving(!moving)}>Đổi lịch và giữ cọc</button>{moving&&<div className="space-y-3"><label className="block">Ngày mới<DateInput value={date} min={toISODate(new Date())} onChange={e=>setDate(e.target.value)} className={input}/></label><label className="block">Giờ mới<TimeInput value={time} onChange={e=>setTime(e.target.value)} className={input}/></label><label className="block">Lý do<input value={reason} maxLength={300} onChange={e=>setReason(e.target.value)} className={input}/></label><button type="button" disabled={busy||!date||!reason.trim()} className={button} onClick={()=>act('reschedule',{ngay:date,gioStart:time,lyDo:reason})}>Xác nhận đổi lịch</button></div>}</div>}
    {manager&&['Paid','Forfeited'].includes(deposit.status)&&<div className="space-y-3 border-t pt-4"><label className="block">Lý do quản lý xử lý (ví dụ bé bệnh đột xuất)<textarea className={input} value={reason} maxLength={300} onChange={e=>setReason(e.target.value)}/></label><div className="flex flex-wrap gap-2"><button type="button" disabled={busy||!reason.trim()} className={button} onClick={()=>act('decision',{action:'exception-refund',reason})}>Duyệt ngoại lệ: hủy và hoàn đủ cọc</button>{deposit.status==='Paid'&&<button type="button" disabled={busy||!reason.trim()} className={button} onClick={()=>act('decision',{action:'no-show',reason})}>Khách vắng không báo: mất cọc</button>}</div></div>}
    {deposit.reason&&<p className="text-sm text-slate-600">Lý do xử lý: {deposit.reason}</p>}
    {!!data.transactions.length&&<ul className="space-y-2 text-sm">{data.transactions.map(row=><li key={row.id}>{row.kind==='Collect'?'Đã thu cọc':'Đã hoàn cọc'}: <strong>{formatVND(row.amount)} ₫</strong> · {row.method==='TienMat'?'Tiền mặt':row.method==='MoMo'?'MoMo':'Chuyển khoản'}{row.sandbox?' · Sandbox':''}</li>)}</ul>}
    <button type="button" disabled={busy} onClick={load} className="text-sm font-bold text-brand-700 underline">Cập nhật trạng thái cọc</button>
  </section>
}
