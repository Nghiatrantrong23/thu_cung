import { useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import { formatVND } from '../lib/tinhGioTrong.js'

// Bảng giá công khai, xem được mà không cần đăng nhập (use case "Tra cứu dịch vụ và bảng giá").
export default function PricingPage() {
  const [services,setServices]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{let active=true;fetch('/api/dich-vu').then(async response=>{if(!response.ok)throw new Error();return response.json()}).then(data=>{if(active)setServices(data.dichVu.map(row=>({id:row.id,name:row.ten,durationMin:row.thoiLuongPhut,price:row.gia})))}).catch(()=>{if(active)setError('Không tải được bảng giá. Vui lòng thử lại.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/dang-nhap" className="flex items-center gap-2 text-brand-700">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100">
              <BieuTuongDauChan className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">PetCare</span>
          </Link>
          <Link to="/dang-nhap" className="rounded-full bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800">
            Đăng nhập để đặt lịch
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Bảng giá dịch vụ</h1>
        <p className="mt-2 text-slate-600">Giờ mở cửa 08:00 đến 19:00 mỗi ngày. Giá tham khảo, thanh toán tại quầy sau khi hoàn thành dịch vụ.</p>

        {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
        {loading&&<p role="status">Đang tải bảng giá...</p>}
        {!loading&&!error&&!services.length&&<p>Chưa có dịch vụ đang kinh doanh.</p>}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-brand-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Dịch vụ</th>
                <th className="px-4 py-3 font-bold">Thời lượng</th>
                <th className="px-4 py-3 text-right font-bold">Giá (₫)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.durationMin} phút</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatVND(s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">Hệ thống hiện nhận chó và mèo.</p>
      </main>
    </div>
  )
}
