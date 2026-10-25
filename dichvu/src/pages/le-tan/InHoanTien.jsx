import { displayDate } from '../../lib/displayDate.js'
import { useEffect,useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND } from '../../lib/tinhGioTrong.js'
export default function InHoanTien(){const {id}=useParams(),{apiCall}=useAuth();const [row,setRow]=useState(null),[error,setError]=useState('')
  useEffect(()=>{let active=true;apiCall(`/api/khieu-nai/${id}`).then(result=>{if(!active)return;if(result.ok)setRow(result.data.khieuNai);else setError(result.error)});return()=>{active=false}},[id,apiCall])
  return <main className="mx-auto max-w-2xl p-6"><style>{'@media print {.print-hide{display:none!important} body{background:white!important}}'}</style>{error&&<p role="alert">{error}</p>}{row?.paid_date?<><button className="print-hide my-4 rounded-full bg-brand-700 px-5 py-2 font-bold text-white" onClick={()=>window.print()}>In phiếu / Lưu PDF</button><article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"><h1 className="text-2xl font-extrabold">PetCare · Phiếu hoàn tiền</h1><p>Khiếu nại #{row.ma_khieu_nai} · Hóa đơn #{row.ma_hoa_don} · Lịch #{row.ma_lich_hen}</p><p>Ngày thực chi: {displayDate(row.paid_date)}</p><p>Khách hàng: {row.customer_name}</p><p>Số tiền đã trả: <strong>{formatVND(row.so_tien_hoan)} ₫</strong></p><p>Phương thức: {row.phuong_thuc_hoan==='TienMat'?'Tiền mặt':'Chuyển khoản'}</p><p>Chứng từ: {row.bang_chung_chi}</p><p>Lý do/kết luận: {row.ket_qua_xu_ly}</p><div className="flex justify-between pt-8 font-bold"><span>Người chi tiền</span><span>Khách nhận tiền</span></div></article></>:row?<p>Chưa có thực chi thành công để lập phiếu hoàn tiền.</p>:!error&&<p>Đang tải...</p>}</main>
}
