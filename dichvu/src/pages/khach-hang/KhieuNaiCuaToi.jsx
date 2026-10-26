import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatVND } from '../../lib/tinhGioTrong.js'

const states = {
  DaTiepNhan: 'Đã tiếp nhận',
  ChoHoanTien: 'Đã duyệt, chờ hoàn tiền',
  DaXuLy: 'Đã xử lý',
}

export default function KhieuNaiCuaToi() {
  const { apiCall } = useAuth()
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailVersion, setDetailVersion] = useState(0)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await apiCall('/api/khieu-nai')
    if (result.ok && Array.isArray(result.data?.khieuNai)) {
      setRows(result.data.khieuNai)
      setSelected(current => result.data.khieuNai.some(row => row.ma_khieu_nai === current) ? current : null)
      setDetailVersion(version => version + 1)
    } else {
      setError(result.error || 'Không tải được khiếu nại. Vui lòng thử lại.')
    }
    setLoading(false)
  }, [apiCall])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (selected === null) return
    let active = true
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    apiCall(`/api/khieu-nai/${selected}`).then(result => {
      if (!active) return
      if (result.ok) setDetail(result.data.khieuNai)
      else setDetailError(result.error || 'Không tải được chi tiết khiếu nại.')
      setDetailLoading(false)
    })
    return () => { active = false }
  }, [selected, detailVersion, apiCall])

  const visible = rows.filter(row => !filter || row.trang_thai === filter)

  return <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-bold uppercase tracking-wide text-brand-700">Hỗ trợ khách hàng</p><h1 className="text-3xl font-extrabold text-slate-800">Khiếu nại của tôi</h1><p className="mt-1 text-slate-600">Theo dõi phản hồi và khoản hoàn tiền liên quan đến lịch hẹn của bạn.</p></div>
      <button type="button" onClick={load} disabled={loading} className="rounded-full border border-brand-700 px-4 py-2 font-bold text-brand-700 disabled:opacity-50">Tải lại</button>
    </header>
    <p className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-slate-700">Nếu cần gửi khiếu nại mới, hãy liên hệ lễ tân để được tiếp nhận. Tính năng gửi trực tiếp đang được phát triển.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div>
        <label className="mb-3 block text-sm font-bold text-slate-700">Trạng thái
          <select className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="">Tất cả</option>{Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        {loading ? <p role="status">Đang tải khiếu nại...</p> : !error && !rows.length ? <p className="rounded-xl border bg-white p-6">Bạn chưa có khiếu nại nào.</p> : !error && !visible.length ? <p className="rounded-xl border bg-white p-6">Không có khiếu nại ở trạng thái này.</p> : null}
        {!loading && !error && !!visible.length && <><ul className="space-y-3">{visible.map(row => <li key={row.ma_khieu_nai}><button type="button" onClick={() => setSelected(row.ma_khieu_nai)} aria-pressed={selected === row.ma_khieu_nai} className={`w-full rounded-xl border bg-white p-4 text-left focus-visible:outline-2 focus-visible:outline-brand-700 ${selected === row.ma_khieu_nai ? 'border-brand-700 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-500'}`}><strong>Khiếu nại #{row.ma_khieu_nai} · {row.pet_name}</strong><span className="block text-sm text-slate-600">Lịch #{row.ma_lich_hen} · {row.date}</span><span className="mt-2 block font-bold text-brand-700">{states[row.trang_thai] || row.trang_thai}</span></button></li>)}</ul><p className="mt-3 text-xs text-slate-500">Hiển thị tối đa 200 khiếu nại gần nhất.</p></>}
      </div>
      {!!rows.length && <div aria-live="polite">{selected !== null && detailLoading ? <p>Đang tải chi tiết...</p> : selected !== null && detailError ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{detailError}</p> : selected !== null && detail?.ma_khieu_nai === selected ? <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><div><h2 className="text-xl font-extrabold">Khiếu nại #{detail.ma_khieu_nai}</h2><p className="text-sm text-slate-600">{detail.pet_name} · Lịch #{detail.ma_lich_hen} · {detail.date}</p></div><p className="font-bold text-brand-700">{states[detail.trang_thai] || detail.trang_thai}</p><section><h3 className="font-bold">Nội dung đã tiếp nhận</h3><p className="whitespace-pre-wrap text-slate-700">{detail.noi_dung}</p></section>{detail.ket_qua_xu_ly && <section><h3 className="font-bold">Phản hồi</h3><p className="whitespace-pre-wrap text-slate-700">{detail.ket_qua_xu_ly}</p></section>}{detail.trang_thai === 'ChoHoanTien' && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Đã duyệt hoàn {formatVND(detail.so_tien_hoan)} VNĐ. Khoản này chưa được xác nhận đã trả.</p>}{detail.paid_date && <div className="rounded-lg bg-emerald-50 p-3"><p>Đã hoàn {formatVND(detail.so_tien_hoan)} VNĐ ngày {detail.paid_date}.</p><Link to={`/le-tan/khieu-nai/${detail.ma_khieu_nai}/in`} target="_blank" rel="noreferrer" className="font-bold text-brand-700">Mở phiếu hoàn tiền</Link></div>}</article> : <p className="rounded-xl border bg-white p-6">Chọn khiếu nại để xem chi tiết.</p>}</div>}
    </div>
  </section>
}
