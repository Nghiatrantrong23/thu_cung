import DepositPanel from '../../components/DepositPanel.jsx'
import './DanhSachLichHen.css'
import Modal from '../../components/ui/Modal.jsx'
import PetIllustration from '../../components/PetIllustration.jsx'
import { Skeleton } from '../../components/ui/Feedback.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import CustomerEmptyState from '../../components/ui/CustomerEmptyState.jsx'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { useBookings } from '../../data/khoLichHen.jsx'
import { formatDateVN, formatVND, toMin } from '../../lib/tinhGioTrong.js'
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
  return <Modal open title={`Hủy lịch hẹn ${formatCode(booking.id)}?`} onClose={onClose} busy={isProcessing}>
    <p className="text-sm leading-7 text-slate-600">{booking.petName}, {(booking.serviceNames || []).join(', ')}, {formatDateVN(booking.date)} {booking.start}. Hủy trước ít nhất 24 giờ được hoàn đủ cọc; hủy dưới 24 giờ không hoàn cọc. Nếu muốn giữ cọc khi đổi lịch sát giờ, chọn “Đổi lịch và giữ cọc” trong chi tiết trước khi hủy. Lịch đã hủy không thể khôi phục.</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={onClose} disabled={isProcessing} className={btnGhost} autoFocus>Giữ lịch</button><button type="button" onClick={onConfirm} disabled={isProcessing} className="rounded-xl bg-rose-600 px-6 py-2.5 font-bold text-white hover:bg-rose-700 disabled:opacity-50">{isProcessing ? 'Đang hủy...' : 'Hủy lịch'}</button></div>
  </Modal>
}

// These helpers only choose how the existing customer records are presented.
function isUpcoming(booking) {
  return ['Chờ xác nhận', 'Đã xác nhận'].includes(booking.status)
    && new Date(`${booking.date}T${booking.start}:00+07:00`).getTime() >= Date.now()
}
function timelineRank(booking) {
  return booking.status === 'Đang thực hiện' ? 0 : isUpcoming(booking) ? 1 : 2
}
function TimelineDate({ date }) {
  const [year, month, day] = date.split('-')
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(`${date}T00:00:00Z`).getUTCDay()]
  return <time dateTime={date} className="at-date" aria-label={formatDateVN(date)} title={formatDateVN(date)}><span>{weekday}</span><strong>{day}</strong><span>Tháng {Number(month)}</span>{Number(year) !== new Date().getFullYear() && <span>{year}</span>}</time>
}
function AppointmentCard({ booking, busy, onView, onCancel, onReview }) {
  const duration = toMin(booking.end || '') - toMin(booking.start || '')
  const services = booking.dichVu?.length ? booking.dichVu : (booking.serviceNames || []).map(ten => ({ ten }))
  const tone = booking.status === 'Chờ xác nhận' ? 'waiting' : ['Đã xác nhận', 'Hoàn thành'].includes(booking.status) ? 'success' : ['Đã hủy', 'Từ chối'].includes(booking.status) ? 'cancelled' : 'working'
  return <article className="at-card" aria-label={`Lịch hẹn ${formatCode(booking.id)} của ${booking.petName}`}>
    <header className="at-card-heading">
      <div className="at-pet"><span className="at-avatar"><PetIllustration species={booking.species} className="h-10 w-10"/></span><div className="at-identity"><div className="at-title-line"><h2>{booking.start} · {booking.petName}</h2><span className={`at-status at-status--${tone}`}><HuyHieuTrangThai status={booking.status}/></span></div><p>{Number.isFinite(duration) && duration > 0 ? `${duration} phút · ` : ''}{booking.staff ? `Nhân viên: ${booking.staff}` : 'Chưa phân công'}</p></div></div>
      <div className="at-total"><span>Tổng tiền dự kiến</span><strong>{booking.total != null ? `${formatVND(booking.total)} ₫` : '—'}</strong></div>
    </header>
    <ul className="at-services" aria-label="Dịch vụ đã đặt">{services.map((service, index) => <li key={service.id ?? index}><div><span>{service.ten}</span>{Number(service.soLuong) > 1 && <small> × {service.soLuong}</small>}{Number(service.thoiLuongPhut) > 0 && <small> · {service.thoiLuongPhut} phút</small>}</div><strong>{service.gia != null ? `${formatVND(Number(service.gia) * Number(service.soLuong ?? 1))} ₫` : '—'}</strong></li>)}{!services.length && <li>Chưa có chi tiết dịch vụ.</li>}</ul>
    <footer className="at-card-actions">
      <div className="at-primary-actions">
        {canCancel(booking) && <><button type="button" className="at-cancel" disabled={busy} onClick={onCancel}>Hủy lịch</button><span className="at-muted">Có thể hủy khi lịch đang chờ hoặc đã xác nhận.</span></>}
        {canReview(booking) && <button type="button" className="at-primary" disabled={busy} onClick={onReview}>Đánh giá dịch vụ</button>}
        {booking.review && <span className="at-reviewed">Bạn đã đánh giá {booking.review.stars} /5</span>}
        {booking.status === 'Đã hủy' && <span className="at-muted">Lịch hẹn đã hủy.</span>}
        {booking.status === 'Từ chối' && <span className="at-muted">Lịch hẹn đã được từ chối.</span>}
        {booking.status === 'Đang thực hiện' && <span className="at-muted">Dịch vụ đang được thực hiện.</span>}
      </div>
      <button type="button" className="at-details" disabled={busy} onClick={onView} aria-label={`Xem chi tiết lịch hẹn ${formatCode(booking.id)}`}>Chi tiết <span aria-hidden="true">→</span></button>
    </footer>
  </article>
}

export default function AppointmentsPage() {
  const { bookings, cancelBooking, reviewBooking, loading, fetchBookings } = useBookings()
  const { user } = useAuth()
  const location = useLocation()

  const [filter, setFilter] = useState('Tất cả')
  const [tab, setTab] = useState('Tất cả')
  const [detailOpen, setDetailOpen] = useState(Boolean(location.state?.select))
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
  const tabs = [
    { label: 'Tất cả', count: mine.length },
    { label: 'Sắp tới', count: mine.filter(isUpcoming).length },
    { label: 'Hoàn thành', count: mine.filter(b => b.status === 'Hoàn thành').length },
    { label: 'Đã hủy', count: mine.filter(b => b.status === 'Đã hủy').length },
  ]
  const rows = filterByStatus(mine, filter).filter(booking => tab === 'Tất cả' || (tab === 'Sắp tới' ? isUpcoming(booking) : booking.status === tab))
    .sort((a, b) => timelineRank(a) - timelineRank(b) || (timelineRank(a) === 1
      ? a.date.localeCompare(b.date) || a.start.localeCompare(b.start)
      : b.date.localeCompare(a.date) || b.start.localeCompare(a.start)))
  const selected = mine.find((b) => b.id === selectedId) ?? null

  function select(id) {
    setSelectedId(id)
    setStars(0)
    setComment('')
    setNotice(null)
  }

  function onFilterChange(value) {
    setDetailOpen(false)
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
          ? { type: 'ok', text: res.message }
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

  return <div className="appointment-timeline">
    <PageHeading title="Lịch hẹn của tôi" description="Theo dõi trạng thái, xem chi tiết dịch vụ và đánh giá sau khi hoàn thành." actions={<Link to="/dat-lich" className="at-primary">Đặt lịch mới</Link>}/>
    <div className="at-filters">
      <div className="at-tabs" role="group" aria-label="Nhóm lịch hẹn">{tabs.map(item => <button type="button" key={item.label} className={`at-tab ${tab === item.label ? 'at-tab--active' : ''}`} aria-pressed={tab === item.label} disabled={isProcessing} onClick={() => { setTab(item.label); onFilterChange('Tất cả') }}>{item.label}<span>{loading ? '…' : item.count}</span></button>)}</div>
      <label className="at-status-filter" htmlFor="timeline-status">Trạng thái<select id="timeline-status" className={inputCls} value={filter} disabled={isProcessing} onChange={e => { setTab('Tất cả'); onFilterChange(e.target.value) }}><option>Tất cả</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
    </div>
    {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`at-notice ${notice.type === 'error' ? 'at-notice--error' : ''}`}>{notice.text}</p>}
    {loading ? <Skeleton label="Đang tải lịch hẹn" rows={3}/> : !rows.length ? <CustomerEmptyState title={tab === 'Tất cả' && filter === 'Tất cả' ? 'Chưa có lịch hẹn nào' : 'Không có lịch hẹn trong nhóm này'} description="Chọn nhóm hoặc trạng thái khác để xem lịch, hoặc đặt một buổi chăm sóc mới cho bé." to="/dat-lich" action="Đặt lịch cho bé"/> : <ol className="at-list" aria-label="Dòng thời gian lịch hẹn">{rows.map(booking => <li key={booking.id} className="at-item"><TimelineDate date={booking.date}/><AppointmentCard booking={booking} busy={isProcessing} onView={() => { select(booking.id); setDetailOpen(true) }} onCancel={() => { select(booking.id); setDetailOpen(false); setConfirming(true) }} onReview={() => { select(booking.id); setDetailOpen(true) }}/></li>)}</ol>}

    {selected && <Modal open={detailOpen} title={`Chi tiết lịch hẹn ${formatCode(selected.id)}`} busy={isProcessing} onClose={() => { setDetailOpen(false); select(null) }}>
      {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`at-notice ${notice.type === 'error' ? 'at-notice--error' : ''}`}>{notice.text}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-3"><h3 className="font-extrabold text-slate-800">{selected.petName}</h3><HuyHieuTrangThai status={selected.status}/></div>
      <dl className="grid gap-4 sm:grid-cols-2"><Info label="Thời gian">{formatDateVN(selected.date)}, {selected.start}–{selected.end}</Info><Info label="Nhân viên phụ trách">{selected.staff || 'Chưa phân công'}</Info><Info label="Dịch vụ">{selected.serviceNames.join(', ')}</Info><Info label="Tổng tiền dự kiến">{formatVND(selected.total)} ₫</Info></dl>
      {selected.note && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">Ghi chú: {selected.note}</p>}
      {selected.status === 'Hoàn thành' && <form onSubmit={submitReview} className="mt-6 space-y-4 border-t border-slate-200 pt-5">
        <h3 className="font-extrabold text-slate-800">Đánh giá dịch vụ</h3>
        {selected.review ? <><Stars value={selected.review.stars} readOnly/><p className="text-slate-700">{selected.review.comment || 'Không có nhận xét.'}</p><p className="text-sm text-slate-600">Mỗi lịch hẹn chỉ đánh giá một lần.</p></> : <>
          <div><p className="mb-2 text-sm font-bold text-slate-700">Số sao <span className="text-rose-700">*</span></p><Stars value={stars} onChange={setStars}/></div>
          <div><label htmlFor="comment" className="mb-2 block text-sm font-bold text-slate-700">Nhận xét</label><textarea id="comment" rows={3} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} disabled={isProcessing} placeholder="Chia sẻ trải nghiệm của bạn và bé." className={`${inputCls} w-full`}/></div>
          <button type="submit" disabled={!canReview(selected) || stars === 0 || isProcessing} className={btnPrimary}>{isProcessing ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
        </>}
      </form>}
      <DepositPanel key={selected.id} bookingId={selected.id} onChange={fetchBookings}/>
      <div className="mt-5 flex flex-wrap gap-3">{canCancel(selected) && <button type="button" disabled={isProcessing} className={btnDanger} onClick={() => { setDetailOpen(false); setConfirming(true) }}>Hủy lịch</button>}<button type="button" disabled={isProcessing} onClick={() => { setDetailOpen(false); select(null) }} className={btnGhost}>Đóng</button></div>
    </Modal>}
    {confirming && selected && <ConfirmCancel booking={selected} onConfirm={doCancel} onClose={() => setConfirming(false)} isProcessing={isProcessing}/>}
  </div>
}
