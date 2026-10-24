import { useEffect,useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { Receipt } from './HoaDon.jsx'
export default function InHoaDon(){const {id}=useParams(),{apiCall}=useAuth();const [data,setData]=useState(null),[error,setError]=useState('')
  useEffect(()=>{let active=true;apiCall(`/api/hoa-don/${id}`).then(result=>{if(active){if(result.ok)setData(result.data);else setError(result.error)}});return()=>{active=false}},[id,apiCall])
  return <main className="mx-auto max-w-3xl p-6"><style>{'@media print {.print-hide{display:none!important} body{background:white!important}}'}</style><button className="print-hide my-3 rounded-full bg-brand-700 px-5 py-2 font-bold text-white" disabled={!data} onClick={()=>window.print()}>In / Lưu PDF</button>{error&&<p role="alert">{error}</p>}{data?<Receipt data={data}/>:!error&&<p>Đang tải hóa đơn...</p>}</main>
}
