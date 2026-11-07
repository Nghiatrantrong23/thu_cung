import TransferPayment from './TransferPayment.jsx'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../data/khoXacThuc.jsx'
import { formatVND } from '../lib/tinhGioTrong.js'

const labels={BankQR:'QR ngân hàng',MoMo:'Ví MoMo',COD:'COD · Trả tại quầy'}
const statuses={Pending:'Đang chờ thanh toán',AwaitingCash:'Chờ thanh toán tiền mặt tại quầy',Paid:'Đã thanh toán',Failed:'Thanh toán thất bại',Expired:'Yêu cầu đã hết hạn',Cancelled:'Yêu cầu đã hủy'}
export default function PaymentOptions({invoiceId,remaining,onPaid}) {
  const {apiCall}=useAuth()
  const [config,setConfig]=useState(null),[method,setMethod]=useState('BankQR')
  const [intent,setIntent]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const paidRef=useRef(onPaid),currentInvoice=useRef(invoiceId),mounted=useRef(true)
  paidRef.current=onPaid;currentInvoice.current=invoiceId
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  useEffect(()=>{let active=true;setIntent(null);setError('');setConfig(null)
    apiCall('/api/payments/config').then(result=>{if(!active)return;if(result.ok)setConfig(result.data);else setError(result.error)})
    return()=>{active=false}
  },[apiCall,invoiceId])
  useEffect(()=>{
    if(!intent||!['Pending','AwaitingCash'].includes(intent.status))return
    let active=true,timer
    async function poll(){
      const result=await apiCall(`/api/payments/intents/${intent.id}`)
      if(!active)return
      if(result.ok){setIntent(result.data);if(result.data.status==='Paid'){paidRef.current?.();return}
        if(!['Pending','AwaitingCash'].includes(result.data.status))return
      } else {setError(result.error);return}
      timer=setTimeout(poll,3000)
    }
    timer=setTimeout(poll,3000)
    return()=>{active=false;clearTimeout(timer)}
  },[intent?.id,intent?.status,apiCall])
  async function create(){
    const id=invoiceId;setBusy(true);setError('')
    const result=await apiCall(`/api/payments/invoices/${id}`,{method:'POST',body:JSON.stringify({method})})
    if(!mounted.current||currentInvoice.current!==id)return
    setBusy(false);if(result.ok)setIntent(result.data);else setError(result.error)
  }
  async function simulate(result){
    const id=invoiceId;setBusy(true);setError('')
    const response=await apiCall(`/api/payments/intents/${intent.id}/simulate`,{method:'POST',body:JSON.stringify({result})})
    if(!mounted.current||currentInvoice.current!==id)return
    setBusy(false)
    if(!response.ok){setError(response.error);return}
    const latest=await apiCall(`/api/payments/intents/${intent.id}`)
    if(!mounted.current||currentInvoice.current!==id)return
    if(latest.ok){setIntent(latest.data);if(latest.data.status==='Paid')paidRef.current?.()}else setError(latest.error)
  }
  if(config?.mode!=='sandbox')return <TransferPayment key={invoiceId} targetId={invoiceId} onPaid={onPaid}/>
  return <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
    <h2 className="text-lg font-extrabold">Chọn phương thức thanh toán</h2>
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Bản thử nghiệm sandbox. QR và MoMo được mô phỏng, không chuyển tiền thật. COD là trả tiền tại quầy khi nhận bé.</p>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {config?.mode==='unconfigured'&&<p className="text-sm text-slate-600">Bản web này chưa bật sandbox thanh toán. Hãy mở bản thử nghiệm riêng để thử QR và MoMo. Bạn vẫn có thể trả tiền mặt tại quầy.</p>}
    <div role="group" aria-label="Phương thức thanh toán" className="grid gap-2 sm:grid-cols-3">{Object.entries(labels).map(([key,label])=><button key={key} type="button" disabled={busy} aria-pressed={method===key} onClick={()=>setMethod(key)} className={`rounded-xl border p-3 text-sm font-bold ${method===key?'border-brand-700 bg-brand-50 text-brand-800':'border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
    <p>Còn thanh toán: <strong>{formatVND(remaining)} ₫</strong></p>
    <button type="button" disabled={busy||config?.mode!=='sandbox'||remaining<=0} onClick={create} className="rounded-full bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy?'Đang xử lý...':method==='COD'?'Chọn trả tại quầy':'Tạo yêu cầu thanh toán thử'}</button>
    {intent&&<div className="space-y-3 rounded-xl bg-slate-50 p-4">
      <p role="status" className="font-bold">{labels[intent.method]} · {statuses[intent.status]}</p>
      <p className="text-sm text-slate-600">{intent.message}</p>
      {intent.qr&&intent.status==='Pending'&&<img src={intent.qr} alt={`Mã QR thử nghiệm ${labels[intent.method]}, không dùng chuyển tiền thật`} width="256" height="256" className="mx-auto rounded-xl"/>}
      <p className="text-sm">Số tiền: {formatVND(intent.amount)} ₫ · Hết hạn: {new Date(intent.expiresAt).toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})} (giờ Việt Nam)</p>
      {intent.status==='Pending'&&<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>simulate('success')} className="rounded-full bg-brand-700 px-4 py-2 font-bold text-white disabled:opacity-50">Mô phỏng thanh toán thành công</button><button type="button" disabled={busy} onClick={()=>simulate('failed')} className="rounded-full border border-slate-300 px-4 py-2 font-bold disabled:opacity-50">Mô phỏng thất bại</button></div>}
      {['Failed','Expired','Cancelled'].includes(intent.status)&&<p className="text-sm text-slate-600">Chưa ghi nhận thanh toán từ yêu cầu này. Bấm tạo yêu cầu mới để thử lại.</p>}
    </div>}
  </section>
}
