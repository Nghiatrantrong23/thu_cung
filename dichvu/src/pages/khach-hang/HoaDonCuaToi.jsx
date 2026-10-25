import PageHeading from '../../components/ui/PageHeading.jsx'
import CustomerEmptyState from '../../components/ui/CustomerEmptyState.jsx'
import { displayDate } from '../../lib/displayDate.js'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND } from '../../lib/tinhGioTrong.js'
import { billLabels, Receipt } from '../le-tan/HoaDon.jsx'

export default function HoaDonCuaToi() {
  const { apiCall } = useAuth()
  const [bills, setBills] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await apiCall('/api/hoa-don')
    if (result.ok) setBills(result.data.hoaDon)
    else setError(result.error)
    setLoading(false)
  }, [apiCall])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!selected) return
    let active = true
    apiCall(`/api/hoa-don/${selected}`).then(result => {
      if (!active) return
      if (result.ok) setDetail(result.data)
      else setError(result.error)
      setDetailLoading(false)
    })
    return () => { active = false }
  }, [selected, apiCall])

  function choose(id) {
    if (selected === id) return
    setSelected(id)
    setDetail(null)
    setDetailLoading(true)
    setError('')
  }

  return <section className="space-y-6">
    <PageHeading title="Hóa đơn của tôi" description="Xem hóa đơn và các giao dịch đã được ghi nhận." actions={<button type="button" onClick={load} disabled={loading} className="customer-secondary-action">{loading ? 'Đang tải...' : 'Tải lại'}</button>}/>

    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
    {loading ? <p role="status">Đang tải hóa đơn...</p> : !bills.length && !error ? <CustomerEmptyState title="Bạn chưa có hóa đơn" description="Hóa đơn sẽ xuất hiện khi dịch vụ hoàn thành và lễ tân lập hóa đơn. Bạn có thể xem lịch hẹn hoặc đặt buổi chăm sóc cho bé." to="/lich-hen" action="Xem lịch hẹn" secondary={<Link to="/dat-lich" className="customer-secondary-action">Đặt lịch mới</Link>}/> : null}
    <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]' : ''}`}>
      {!!bills.length && <div><h2 className="mb-3 text-lg font-extrabold">Danh sách hóa đơn</h2><ul className="space-y-3">{bills.map(row => <li key={row.id}><button type="button" onClick={() => choose(row.id)} aria-pressed={selected === row.id} className={`w-full rounded-xl border bg-white p-4 text-left transition focus-visible:outline-2 focus-visible:outline-brand-700 ${selected === row.id ? 'border-brand-700 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-500'}`}><strong>Hóa đơn #{row.id} · {row.petName}</strong><span className="block text-sm text-slate-500">Lịch #{row.bookingId} · {displayDate(row.date)}</span><span className="mt-2 block font-bold text-brand-700">{formatVND(row.amount)} ₫</span><span className="text-sm text-slate-600">{billLabels[row.status] || row.status}</span></button></li>)}</ul><p className="mt-3 text-xs text-slate-500">Hiển thị tối đa 200 hóa đơn gần nhất.</p></div>}
      {!!bills.length && selected && <div aria-live="polite">{detailLoading ? <p>Đang tải chi tiết...</p> : detail ? <div className="space-y-4"><Receipt data={detail}/><Link to={`/le-tan/hoa-don/${selected}/in`} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-brand-700 px-5 py-2 font-bold text-white">Mở bản in hóa đơn</Link><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Lịch sử giao dịch</h2>{detail.transactions.length ? <ul className="mt-3 space-y-2">{detail.transactions.map(row => <li key={row.id} className="border-t pt-2 text-sm"><strong>{displayDate(row.date)} · {formatVND(row.amount)} ₫</strong><p>{row.method === 'HoanTien' ? 'Hoàn tiền' : row.method === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản'} · {row.status === 'ThanhCong' ? 'Thành công' : 'Thất bại'}</p></li>)}</ul> : <p className="mt-2 text-slate-600">Chưa có giao dịch.</p>}</section></div> : <p className="rounded-xl border border-slate-200 bg-white p-6">Chọn hóa đơn để xem chi tiết.</p>}</div>}
    </div>
  </section>
}
