import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { useBookings } from '../../data/khoLichHen.jsx'
import { formatDateVN, formatVND } from '../../lib/tinhGioTrong.js'
import { STATUSES, canCancel, canReview, filterByStatus, formatCode, sortNewestFirst } from '../../lib/tienIchLichHen.js'

const inputCls =
  'rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

const btnPrimary =
  'rounded-full bg-brand-700 px-6 py-2.5 text-sm font-extrabold tracking-normal text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400'
const btnDanger =
  'rounded-full border border-rose-300 px-6 py-2.5 text-sm font-extrabold tracking-normal text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent'
const btnGhost =
  'rounded-full border border-slate-300 px-6 py-2.5 text-sm font-extrabold tracking-normal text-slate-600 transition hover:border-brand-600 hover:text-brand-700'

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{children}</dd>
    </div>
  )
}

function Stars({ value, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-1" role={readOnly ? 'img' : 'group'} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const star = (
          <svg viewBox="0 0 24 24" className={`h-8 w-8 ${filled ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" aria-hidden="true">
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
        )
        return readOnly ? (
          <span key={n}>{star}</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} sao`}
            aria-pressed={n === value}
            className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}

function ConfirmCancel({ booking, onConfirm, onClose, isProcessing }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cancel-title" className="text-xl font-extrabold text-slate-800">
          Hủy lịch hẹn {formatCode(booking.id)}?
        </h2>
        <p className="mt-2 text-slate-600">
          {booking.petName}, {(booking.serviceNames || []).join(', ')}, {formatDateVN(booking.date)} {booking.start}. Lịch đã hủy
          không thể khôi phục, bạn cần đặt lại nếu vẫn muốn sử dụng dịch vụ.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isProcessing} className={btnGhost} autoFocus>
            Giữ lịch
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-extrabold tracking-normal text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessing ? 'Đang hủy...' : 'Hủy lịch'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const { bookings, cancelBooking, reviewBooking, loading, fetchBookings } = useBookings()
  const { user } = useAuth()
  const location = useLocation()

  const [filter, setFilter] = useState('Tất cả')
  const [selectedId, setSelectedId] = useState(location.state?.select ?? null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState(null) // { type: 'ok' | 'error', text }
  const [isProcessing, setIsProcessing] = useState(false)

  const mine = useMemo(
    () => sortNewestFirst(bookings.filter((b) => !b.owner || !user?.username || b.owner === user.username)),
    [bookings, user?.username],
  )
  const rows = useMemo(() => filterByStatus(mine, filter), [mine, filter])
  const selected = mine.find((b) => b.id === selectedId) ?? null

  function select(id) {
    setSelectedId(id)
    setStars(0)
    setComment('')
    setNotice(null)
  }

  function onFilterChange(value) {
    setFilter(value)
    setSelectedId(null)
    setNotice(null)
  }

  async function doCancel() {
    if (!selected) return
    setIsProcessing(true)
    try {
      const res = await cancelBooking(selected.id)
      setConfirming(false)
      setNotice(
        res.ok
          ? { type: 'ok', text: `Đã hủy lịch hẹn ${formatCode(selected.id)} thành công.` }
          : { type: 'error', text: res.message },
      )
    } finally {
      setIsProcessing(false)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!selected) return
    setIsProcessing(true)
    try {
      const res = await reviewBooking(selected.id, stars, comment)
      setNotice(
        res.ok
          ? { type: 'ok', text: 'Cảm ơn bạn đã gửi đánh giá!' }
          : { type: 'error', text: res.message },
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Danh sách lịch hẹn của tôi</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-bold text-slate-700">
            Trạng thái:
          </label>
          <select id="status" value={filter} onChange={(e) => onFilterChange(e.target.value)} className={inputCls}>
            <option>Tất cả</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-brand-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-bold">Mã</th>
              <th className="px-4 py-3 font-bold">Thú cưng</th>
              <th className="px-4 py-3 font-bold">Dịch vụ</th>
              <th className="px-4 py-3 font-bold">Ngày giờ hẹn</th>
              <th className="px-4 py-3 font-bold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Không có lịch hẹn nào{filter !== 'Tất cả' ? ` ở trạng thái “${filter}”` : ''}.{' '}
                  <Link to="/dat-lich" className="font-bold text-brand-700 hover:underline">
                    Đặt lịch mới
                  </Link>
                </td>
              </tr>
            )}
            {rows.map((b) => {
              const active = b.id === selectedId
              return (
                <tr
                  key={b.id}
                  onClick={() => select(b.id)}
                  className={`cursor-pointer transition ${active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                  aria-selected={active}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-extrabold text-brand-700 underline-offset-2 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        select(b.id)
                      }}
                      aria-label={`Xem chi tiết lịch hẹn ${formatCode(b.id)}`}
                    >
                      {formatCode(b.id)}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {b.petName} ({b.species})
                  </td>
                  <td className="px-4 py-3 text-slate-700">{b.serviceNames.join(', ')}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {formatDateVN(b.date)} {b.start}
                  </td>
                  <td className="px-4 py-3">
                    <HuyHieuTrangThai status={b.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      {selected ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-800">Chi tiết lịch hẹn {formatCode(selected.id)}</h2>
            <HuyHieuTrangThai status={selected.status} />
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <Info label="Thời gian:">
              {formatDateVN(selected.date)}, {selected.start} đến {selected.end}
            </Info>
            <Info label="Nhân viên phụ trách:">
              {selected.staff ?? <span className="font-semibold text-slate-500">Chưa phân công</span>}
            </Info>
            <Info label="Tạm tính:">{formatVND(selected.total)} ₫</Info>
          </dl>
          {selected.note && <p className="mt-3 text-sm text-slate-500">Ghi chú: {selected.note}</p>}

          <form onSubmit={submitReview} className="mt-6 border-t border-slate-100 pt-5">
            {selected.status === 'Hoàn thành' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-800">Đánh giá dịch vụ (lịch hẹn {formatCode(selected.id)})</h3>
                {selected.review ? (
                  <>
                    <Stars value={selected.review.stars} readOnly />
                    <p className="text-slate-700">{selected.review.comment || 'Không có nhận xét.'}</p>
                    <p className="text-sm text-slate-500">Lịch hẹn này đã được đánh giá, mỗi lịch chỉ đánh giá một lần.</p>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-1.5 text-sm font-bold text-slate-700">
                        Số sao: <span className="text-accent-600">*</span>
                      </p>
                      <Stars value={stars} onChange={setStars} />
                    </div>
                    <div>
                      <label htmlFor="comment" className="mb-1.5 block text-sm font-bold text-slate-700">
                        Nhận xét:
                      </label>
                      <textarea
                        id="comment"
                        rows={3}
                        maxLength={500}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn và bé."
                        className={`${inputCls} w-full`}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canCancel(selected) || isProcessing}
                onClick={() => setConfirming(true)}
                className={btnDanger}
              >
                Hủy lịch
              </button>
              <button
                type="submit"
                disabled={!canReview(selected) || stars === 0 || isProcessing}
                className={btnPrimary}
              >
                {isProcessing ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button type="button" onClick={() => select(null)} className={btnGhost}>
                Quay lại
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Hủy lịch chỉ áp dụng cho lịch “Chờ xác nhận” hoặc “Đã xác nhận”. Đánh giá chỉ áp dụng cho lịch “Hoàn thành”,
              mỗi lịch một đánh giá.
            </p>
          </form>
        </section>
      ) : (
        rows.length > 0 && <p className="mt-4 text-sm text-slate-500">Chọn một lịch hẹn trong bảng để xem chi tiết.</p>
      )}

      {confirming && selected && (
        <ConfirmCancel
          booking={selected}
          onConfirm={doCancel}
          onClose={() => setConfirming(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}
