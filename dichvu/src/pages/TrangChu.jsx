import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import PetIllustration from '../components/PetIllustration.jsx'
import { formatVND } from '../lib/tinhGioTrong.js'
import './TrangChu.css'

function usePublicServices() {
  const [state, setState] = useState({ services: [], loading: true, error: '' })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState(previous => ({ ...previous, loading: true, error: '' }))
    fetch('/api/dich-vu', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Không tải được dịch vụ.')
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data.dichVu)) throw new Error('Dữ liệu dịch vụ không hợp lệ.')
        setState({ services: data.dichVu, loading: false, error: '' })
      })
      .catch(error => {
        if (error.name !== 'AbortError') setState({ services: [], loading: false, error: 'Chưa tải được dịch vụ. Vui lòng thử lại.' })
      })
    return () => controller.abort()
  }, [version])
  return { ...state, reload: () => setVersion(value => value + 1) }
}

export default function TrangChu() {
  const { services, loading, error, reload } = usePublicServices()
  return <div className="public-home">
    <header className="public-home-header">
      <div className="public-home-shell public-home-nav">
        <Link to="/" className="public-home-brand" aria-label="PetCare, trang chủ"><span><BieuTuongDauChan className="h-6 w-6" /></span>PetCare</Link>
        <nav aria-label="Điều hướng công khai"><a href="#dich-vu">Dịch vụ</a><a href="#quy-trinh">Cách đặt lịch</a><Link to="/bang-gia">Bảng giá</Link></nav>
        <Link className="public-home-login" to="/dang-nhap">Đăng nhập / Đăng ký</Link>
      </div>
    </header>

    <main>
      <section className="public-home-hero public-home-shell" aria-labelledby="public-home-title">
        <div className="public-home-hero-copy">
          <p className="public-home-kicker">CHĂM SÓC THÚ CƯNG CÙNG PETCARE</p>
          <h1 id="public-home-title">Một nơi để chăm sóc <em>người bạn nhỏ</em> của bạn</h1>
          <p>Chọn dịch vụ phù hợp, đặt lịch theo khung giờ còn trống và theo dõi hành trình chăm sóc của bé trong tài khoản PetCare.</p>
          <div className="public-home-actions"><Link className="public-home-primary" to="/dang-nhap">Đăng nhập để đặt lịch <span aria-hidden="true">→</span></Link><Link className="public-home-secondary" to="/bang-gia">Xem bảng giá</Link></div>
          <p className="public-home-hours">Giờ phục vụ: 08:00–19:00 mỗi ngày</p>
        </div>
        <div className="public-home-art" aria-hidden="true"><div className="public-home-art-glow" /><div className="public-home-art-dog"><PetIllustration species="Chó" className="w-full h-full" /></div><div className="public-home-art-cat"><PetIllustration species="Mèo" className="w-full h-full" /></div><span className="public-home-art-note">Chăm sóc bằng sự tận tâm</span></div>
      </section>

      <section className="public-home-services" id="dich-vu" aria-labelledby="public-home-services-title"><div className="public-home-shell">
        <div className="public-home-section-head"><div><p className="public-home-kicker">DÀNH CHO CÁC BÉ</p><h2 id="public-home-services-title">Dịch vụ đang phục vụ</h2><p>Thời lượng và giá được cập nhật từ danh mục hiện hành.</p></div><Link to="/bang-gia">Xem toàn bộ bảng giá <span aria-hidden="true">→</span></Link></div>
        {loading && <p role="status" className="public-home-state">Đang tải dịch vụ…</p>}
        {error && <div role="alert" className="public-home-state"><p>{error}</p><button type="button" onClick={reload}>Thử lại</button></div>}
        {!loading && !error && !services.length && <p className="public-home-state">Hiện chưa có dịch vụ đang kinh doanh.</p>}
        {!loading && !error && services.length > 0 && <div className="public-home-service-grid">{services.slice(0, 3).map(service => <article key={service.id} className="public-home-service-card"><span className="public-home-service-mark"><BieuTuongDauChan className="h-6 w-6" /></span><h3>{service.ten}</h3><p>{service.moTa || 'Xem chi tiết và chọn lịch phù hợp cho bé.'}</p><div className="public-home-service-meta"><span>{service.thoiLuongPhut} phút</span><strong>{formatVND(service.gia)} ₫</strong></div></article>)}</div>}
      </div></section>

      <section className="public-home-steps public-home-shell" id="quy-trinh" aria-labelledby="public-home-steps-title"><p className="public-home-kicker">BẮT ĐẦU THẬT DỄ</p><h2 id="public-home-steps-title">Đặt lịch chăm sóc trong tài khoản của bạn</h2><div className="public-home-step-grid"><article><span>01</span><h3>Tạo hồ sơ cho bé</h3><p>Lưu thông tin thú cưng để đặt lịch và theo dõi các lần chăm sóc.</p></article><article><span>02</span><h3>Chọn dịch vụ và giờ</h3><p>Xem dịch vụ đang bán và chọn khung giờ còn trống trước khi gửi yêu cầu.</p></article><article><span>03</span><h3>Theo dõi lịch hẹn</h3><p>Xem trạng thái lịch, thông tin chăm sóc và hóa đơn trong tài khoản.</p></article></div></section>

      <section className="public-home-review"><div className="public-home-shell public-home-review-inner"><div><p className="public-home-kicker">LẮNG NGHE KHÁCH HÀNG</p><h2>Ý kiến của bạn giúp PetCare tốt hơn</h2><p>Sau khi lịch hẹn hoàn thành, bạn có thể gửi đánh giá từ trang Lịch hẹn. Phản hồi của bạn được gắn với dịch vụ đã sử dụng.</p></div><Link className="public-home-secondary" to="/dang-nhap">Vào tài khoản của tôi</Link></div></section>
    </main>
    <footer className="public-home-footer"><div className="public-home-shell"><span>PetCare · Chăm sóc thú cưng</span><Link to="/bang-gia">Bảng giá dịch vụ</Link></div></footer>
  </div>
}
