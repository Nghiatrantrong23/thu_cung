import {useCallback,useEffect,useRef,useState} from 'react'
import {useAuth} from '../data/khoXacThuc.jsx'
import {formatVND} from '../lib/tinhGioTrong.js'

const labels={BankQR:'Chuyển khoản VietQR',MoMo:'Ví MoMo',COD:'Tiền mặt khi nhận bé'}
const button='rounded-full border border-brand-600 px-4 py-2 font-bold text-brand-800 disabled:opacity-50'
export default function TransferPayment({kind='invoice',targetId,onPaid}) {
  const {apiCall}=useAuth()
  const [config,setConfig]=useState(null),[method,setMethod]=useState('BankQR')
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[imageFailed,setImageFailed]=useState(false)
  const callback=useRef(onPaid),generation=useRef(0),paid=useRef(false),request=useRef(0)
  callback.current=onPaid
  useEffect(()=>{
    const current=++generation.current;paid.current=false;setConfig(null);setData(null);setError('');setNotice('');setBusy(false)
    apiCall('/api/payments/config').then(result=>{
      if(generation.current!==current)return
      if(result.ok){setConfig(result.data);setMethod(result.data.methods.find(item=>kind!=='deposit'||item!=='COD')||'BankQR')}
      else setError(result.error)
    })
    return()=>{generation.current++;request.current++}
  },[apiCall,kind,targetId])
  const load=useCallback(async(manual=false)=>{
    const current=generation.current,sequence=++request.current
    setBusy(true);setError('');setNotice('')
    const result=await apiCall(`/api/payments/transfers/${kind==='deposit'?'deposits':'invoices'}/${targetId}?method=${encodeURIComponent(method)}`)
    if(generation.current!==current||request.current!==sequence)return
    setBusy(false)
    if(!result.ok){setData(null);setError(result.error);return}
    setData(result.data)
    if(result.data.status==='Paid'){
      if(!paid.current){paid.current=true;callback.current?.()}
    } else if(manual)setNotice('Chưa có xác nhận thực nhận từ cửa hàng. Nếu bạn đã chuyển, vui lòng chờ lễ tân kiểm tra; không chuyển lại.')
  },[apiCall,kind,targetId,method])
  useEffect(()=>{
    if(!data||!['AwaitingReceipt','AwaitingCash'].includes(data.status))return
    const timer=setTimeout(()=>load(),5000)
    return()=>clearTimeout(timer)
  },[data,load])
  useEffect(()=>{setImageFailed(false)},[data?.qr])
  const methods=(config?.methods||[]).filter(item=>kind!=='deposit'||item!=='COD')
  function choose(value){request.current++;setMethod(value);setData(null);setBusy(false);setError('');setNotice('')}
  return <section className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5" aria-label={kind==='deposit'?'Chuyển tiền đặt cọc':'Thanh toán hóa đơn'}>
    <h3 className="text-lg font-extrabold">{kind==='deposit'?'Chọn cách chuyển tiền cọc':'Chọn phương thức thanh toán'}</h3>
    {!config&&!error&&<p role="status">Đang tải phương thức nhận tiền...</p>}
    {config?.mode!=='transfer'&&config&&<p className="text-sm text-slate-600">Chưa cấu hình nhận chuyển khoản. Vui lòng liên hệ cửa hàng.</p>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div role="group" aria-label="Phương thức chuyển tiền" className="flex flex-wrap gap-2">{methods.map(value=><button key={value} type="button" disabled={busy} aria-pressed={method===value} className={`${button} ${method===value?'bg-brand-50':''}`} onClick={()=>choose(value)}>{labels[value]}</button>)}</div>
    <button type="button" className={button} disabled={busy||config?.mode!=='transfer'||!methods.includes(method)} onClick={()=>load()}>{busy?'Đang kiểm tra...':method==='COD'?'Xem hướng dẫn trả tại quầy':'Xem thông tin chuyển tiền'}</button>
    {data&&<div className="space-y-3 rounded-xl bg-slate-50 p-4">
      <p role="status" className="font-bold">{data.status==='Paid'?'Cửa hàng đã xác nhận thanh toán':data.status==='AwaitingCash'?'Trả tiền mặt tại quầy khi nhận bé':'Chờ cửa hàng xác nhận thực nhận'}</p>
      {data.status!=='Paid'&&<>
        <p className="text-sm leading-6 text-slate-600">{data.message}</p>
        {data.qr&&!imageFailed&&<img src={data.qr} alt={data.method==='MoMo'?'Mã mở liên kết nhận tiền MoMo':'Mã chuyển khoản VietQR'} width="256" height="256" referrerPolicy="no-referrer" className="mx-auto max-w-full rounded-xl bg-white" onError={()=>setImageFailed(true)}/>}
        {imageFailed&&<p role="alert" className="text-sm text-amber-800">Không tải được QR. Bạn có thể chuyển theo thông tin bên dưới.</p>}
        <dl className="space-y-2 break-words text-sm">
          {data.bankCode&&<div><dt className="text-slate-600">Ngân hàng</dt><dd className="font-bold">{data.bankCode}</dd></div>}
          {(data.accountNumber||data.phoneNumber)&&<div><dt className="text-slate-600">{data.phoneNumber?'Số điện thoại MoMo':'Số tài khoản'}</dt><dd className="select-all font-bold">{data.accountNumber||data.phoneNumber}</dd></div>}
          {data.accountName&&<div><dt className="text-slate-600">Người nhận</dt><dd className="font-bold">{data.accountName}</dd></div>}
          <div><dt className="text-slate-600">Số tiền</dt><dd className="text-xl font-extrabold text-brand-800">{formatVND(data.amount)} ₫</dd></div>
          {data.method!=='COD'&&<div><dt className="text-slate-600">Nội dung chuyển tiền</dt><dd className="select-all font-extrabold">{data.content}</dd></div>}
        </dl>
        {data.method==='MoMo'&&<p className="text-sm text-slate-600">Nhập số tiền và nội dung ở trên trong MoMo, kiểm tra đúng người nhận trước khi xác nhận.</p>}
        {data.receiveUrl&&<a href={data.receiveUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-bold text-brand-700 underline">Mở liên kết nhận tiền MoMo</a>}
        <button type="button" disabled={busy} className={button} onClick={()=>load(true)}>{data.method==='COD'?'Kiểm tra trạng thái':'Tôi đã chuyển tiền · kiểm tra xác nhận'}</button>
      </>}
      {notice&&<p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">{notice}</p>}
    </div>}
  </section>
}
