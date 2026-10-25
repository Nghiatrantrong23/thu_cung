import ServiceIcon from '../../components/ui/ServiceIcon.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { formatDateVN, formatVND, toISODate } from '../../lib/tinhGioTrong.js'
import PetIllustration from '../../components/PetIllustration.jsx'
import ThongBao from '../../components/ThongBao.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import './TongQuan.css'

// Only reads existing APIs. Cleanup prevents results from an old visit overwriting this one.
function useOverviewList(endpoint, key) {
  const { apiCall } = useAuth()
  const [state, setState] = useState({ items: [], loading: true, error: '' })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setState(previous => ({ ...previous, loading: true, error: '' }))
    apiCall(endpoint).then(result => {
      if (!active) return
      const items = result.data?.[key]
      setState(result.ok && Array.isArray(items)
        ? { items, loading: false, error: '' }
        : { items: [], loading: false, error: result.error || 'Chưa tải được dữ liệu. Vui lòng thử lại.' })
    })
    return () => { active = false }
  }, [apiCall, endpoint, key, version])
  return { ...state, reload: () => setVersion(value => value + 1) }
}

function Icon({ type, className = '' }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
    paw: <><ellipse cx="8" cy="6" rx="2" ry="3" /><ellipse cx="16" cy="6" rx="2" ry="3" /><ellipse cx="4" cy="12" rx="2" ry="2.5" /><ellipse cx="20" cy="12" rx="2" ry="2.5" /><path d="M7 17c0-6 10-6 10 0s-4 3-5 3-5 3-5-3Z" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    service: <><path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z" /><path d="M9 15a3 3 0 0 0 3 3" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[type] || paths.calendar}</svg>
}

function LoadingCards({ count = 2 }) {
  return <div className="ov-loading" role="status" aria-label="Đang tải dữ liệu">
    {Array.from({ length: count }, (_, i) => <div key={i} className="ov-skeleton" aria-hidden="true"><span /><span /><span /></div>)}
    <span className="sr-only">Đang tải dữ liệu…</span>
  </div>
}
function DataError({ resource }) {
  return <div className="ov-error" role="alert"><p>{resource.error}</p><button type="button" onClick={resource.reload}>Thử lại</button></div>
}
function EmptyState({ icon, title, children, to, action }) {
  return <div className="ov-empty"><span className="ov-empty-icon"><Icon type={icon} /></span><h3>{title}</h3><p>{children}</p><Link className="ov-button ov-button-soft" to={to}>{action}<Icon type="arrow" /></Link></div>
}
function Metric({ icon, label, resource, value, to }) {
  return <Link to={to} className="ov-metric"><span className="ov-metric-icon"><Icon type={icon} /></span><div><p>{label}</p><strong>{resource.loading ? '…' : resource.error ? '—' : value}</strong></div><Icon type="arrow" className="ov-metric-arrow" /></Link>
}
function BookingCard({ booking }) {
  const date = new Date(`${booking.date}T00:00:00Z`)
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'UTC' }).format(date)
  const [, month, day] = booking.date.split('-')
  return <article className="ov-booking">
    <div className="ov-date" aria-label={formatDateVN(booking.date)}><span>{weekday}</span><strong>{day}</strong><span>Tháng {Number(month)}</span></div>
    <div className="ov-booking-info">
      <div className="ov-booking-heading"><h3>{booking.start} · {booking.petName}</h3><StatusBadge code={booking.trangThaiDB || booking.status} /></div>
      <p className="ov-service-names">{booking.serviceNames?.join(', ') || 'Xem dịch vụ trong lịch hẹn'}</p>
      <p className="ov-muted">{booking.start}–{booking.end} · {booking.staff || 'Chưa phân công nhân viên'}</p>
      {booking.total != null && <p className="ov-price">Dự kiến {formatVND(booking.total)} ₫</p>}
    </div>
    <Link to="/lich-hen" className="ov-icon-link" aria-label={`Xem lịch hẹn của ${booking.petName} ngày ${formatDateVN(booking.date)}`}><Icon type="arrow" /></Link>
  </article>
}

export default function TongQuan() {
  const { user } = useAuth()
  const pets = useOverviewList('/api/thu-cung', 'pets')
  const bookings = useOverviewList('/api/lich-hen', 'lichHen')
  const services = useOverviewList('/api/dich-vu', 'dichVu')
  const now = new Date()
  const today = toISODate(now)
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
  const hour = Number(currentTime.slice(0, 2))
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const activePets = pets.items.filter(pet => pet.active)
  const upcoming = bookings.items.filter(booking => {
    const code = booking.trangThaiDB || booking.status
    const open = ['ChoXacNhan', 'DaXacNhan', 'DangThucHien', 'Chờ xác nhận', 'Đã xác nhận', 'Đang thực hiện'].includes(code)
    const running = ['DangThucHien', 'Đang thực hiện'].includes(code)
    return open && (booking.date > today || (booking.date === today && (running || booking.start >= currentTime)))
  }).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  const completed = bookings.items.filter(booking => ['HoanThanh', 'Hoàn thành'].includes(booking.trangThaiDB || booking.status)).length
  const next = upcoming[0]

  return <div className="customer-overview">
    <header className="ov-hero">
      <div className="ov-hero-content">
        <span className="ov-eyebrow"><Icon type="paw" /> PETCARE · GÓC CHĂM SÓC CỦA BẠN</span>
        <h1>{greeting},<br /><span>{user?.fullName || 'bạn'}!</span></h1>
        <p>{!bookings.loading && !bookings.error && next
          ? `${next.petName} có lịch hẹn lúc ${next.start}, ngày ${formatDateVN(next.date)}. Cùng chuẩn bị cho buổi chăm sóc sắp tới nhé.`
          : 'Chăm sóc các bé, theo dõi lịch hẹn và tìm dịch vụ phù hợp — tất cả trong một nơi.'}</p>
        <div className="ov-hero-actions"><Link className="ov-button ov-button-primary" to="/dat-lich"><Icon type="plus" />Đặt lịch nhanh</Link><Link className="ov-button ov-button-outline" to="/lich-hen">Xem lịch hẹn<Icon type="arrow" /></Link></div>
      </div>
      <div className="ov-hero-art" aria-hidden="true"><span className="ov-art-circle" /><div className="ov-pet-sticker ov-dog"><PetIllustration species="Chó" className="ov-pet-drawing" /></div><div className="ov-pet-sticker ov-cat"><PetIllustration species="Mèo" className="ov-pet-drawing" /></div><span className="ov-art-caption"><Icon type="paw" /> Mỗi bé đều xứng đáng được yêu thương</span></div>
    </header>

    <section className="ov-metrics" aria-label="Thống kê của bạn">
      <Metric icon="paw" label="Thú cưng đang theo dõi" resource={pets} value={activePets.length} to="/ho-so-thu-cung" />
      <Metric icon="calendar" label="Lịch hẹn sắp tới" resource={bookings} value={upcoming.length} to="/lich-hen" />
      <Metric icon="check" label="Lịch đã hoàn thành" resource={bookings} value={completed} to="/lich-hen" />
    </section>

    <div className="ov-main-grid">
      <section className="ov-panel" aria-labelledby="ov-bookings-title">
        <div className="ov-section-heading"><div><p className="ov-kicker">LỊCH CHĂM SÓC</p><h2 id="ov-bookings-title">Lịch hẹn sắp tới</h2></div><Link to="/lich-hen">Xem tất cả<Icon type="arrow" /></Link></div>
        {bookings.loading ? <LoadingCards /> : bookings.error ? <DataError resource={bookings} /> : upcoming.length ? <div className="ov-bookings">{upcoming.slice(0, 3).map(booking => <BookingCard key={booking.id} booking={booking} />)}</div> : <EmptyState icon="calendar" title="Chưa có lịch hẹn sắp tới" to="/dat-lich" action="Đặt lịch cho bé">Chọn một buổi chăm sóc phù hợp với thời gian của bạn.</EmptyState>}
      </section>
      <aside className="ov-notifications" aria-label="Thông báo của bạn"><ThongBao defaultOpen /></aside>
    </div>

    <section aria-labelledby="ov-pets-title">
      <div className="ov-section-heading"><div><p className="ov-kicker">NHỮNG NGƯỜI BẠN NHỎ</p><h2 id="ov-pets-title">Thú cưng của bạn</h2></div><Link to="/ho-so-thu-cung">Quản lý hồ sơ<Icon type="arrow" /></Link></div>
      {pets.loading ? <LoadingCards /> : pets.error ? <DataError resource={pets} /> : activePets.length ? <div className="ov-pets">
        {activePets.slice(0, 4).map(pet => <article className="ov-pet-card" key={pet.id}><div className="ov-pet-avatar"><PetIllustration species={pet.species} className="h-16 w-16" /></div><div className="ov-pet-info"><h3>{pet.name}</h3><p>{[pet.species, pet.breed].filter(Boolean).join(' · ')}</p><span className="ov-pet-status"><i />Đang theo dõi</span></div><Link className="ov-icon-link" to="/ho-so-thu-cung" aria-label={`Xem hồ sơ ${pet.name}`}><Icon type="arrow" /></Link></article>)}
        <Link className="ov-add-pet" to="/ho-so-thu-cung"><Icon type="plus" />{activePets.length > 4 ? `Xem thêm ${activePets.length - 4} thú cưng` : 'Quản lý và thêm thú cưng'}</Link>
      </div> : <div className="ov-panel"><EmptyState icon="paw" title="Thêm người bạn nhỏ đầu tiên" to="/ho-so-thu-cung" action="Tạo hồ sơ thú cưng">Lưu thông tin của bé để đặt lịch và theo dõi các lần chăm sóc.</EmptyState></div>}
    </section>

    <section aria-labelledby="ov-services-title">
      <div className="ov-section-heading"><div><p className="ov-kicker">DÀNH CHO CÁC BÉ</p><h2 id="ov-services-title">Dịch vụ hiện có</h2><p className="ov-muted">Thời lượng và giá từ bảng giá dịch vụ hiện tại.</p></div><Link to="/bang-gia">Xem bảng giá<Icon type="arrow" /></Link></div>
      {services.loading ? <LoadingCards count={3} /> : services.error ? <DataError resource={services} /> : services.items.length ? <div className="ov-services">{services.items.slice(0, 3).map(service => <article key={service.id} className="ov-service-card"><span className="ov-service-icon"><ServiceIcon name={service.ten}/></span><h3>{service.ten}</h3><p>{service.moTa || 'Chăm sóc thú cưng tại PetCare.'}</p><div className="ov-service-footer"><div><span>{service.thoiLuongPhut} phút</span><strong>{formatVND(service.gia)} ₫</strong></div><Link to="/dat-lich" className="ov-button ov-button-primary">Đặt lịch<Icon type="arrow" /></Link></div></article>)}</div> : <p className="ov-panel ov-muted">Chưa có dịch vụ đang kinh doanh.</p>}
    </section>
    <div className="ov-bottom-note"><Icon type="paw" /><p>Giờ chăm sóc <strong>08:00–19:00</strong> · Giờ đặt lịch phụ thuộc ca làm và chỗ trống thực tế.</p></div>
  </div>
}
