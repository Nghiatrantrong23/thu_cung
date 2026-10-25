import { Link } from 'react-router-dom'
import BieuTuongDauChan from './BieuTuongDauChan.jsx'
import './SiteFooter.css'

export default function SiteFooter({ customer = false, compact = false }) {
  return <footer className={`site-footer${compact ? ' site-footer--compact' : ''}`}>
    <div className="site-footer__content">
      <div className="site-footer__brand">
        <div className="site-footer__logo"><span><BieuTuongDauChan className="h-6 w-6"/></span><strong>PetCare</strong></div>
        <p>Chăm sóc tận tâm cho người bạn nhỏ của bạn.</p>
        {!compact && <p className="site-footer__description">Quản lý hồ sơ, đặt lịch và theo dõi những lần chăm sóc thú cưng trong một nơi.</p>}
      </div>
      {!compact && <>
        <nav className="site-footer__links" aria-label="Liên kết cuối trang"><h2>Khám phá PetCare</h2><Link to="/bang-gia">Dịch vụ và bảng giá</Link>{customer ? <><Link to="/dat-lich">Đặt lịch chăm sóc</Link><Link to="/lich-hen">Lịch hẹn của tôi</Link><Link to="/ho-so-thu-cung">Hồ sơ thú cưng</Link></> : <Link to="/dang-nhap">Đăng nhập / Đăng ký</Link>}</nav>
        <section className="site-footer__hours" aria-labelledby="footer-hours"><h2 id="footer-hours">Giờ chăm sóc</h2><strong>08:00–19:00</strong><p>Đặt lịch trước để chọn khung giờ phù hợp. Giờ còn trống phụ thuộc ca làm và thời lượng dịch vụ.</p><span>Chăm sóc dành cho chó và mèo</span></section>
      </>}
    </div>
    <div className="site-footer__bottom"><span>© {new Date().getFullYear()} PetCare</span><span>Hệ thống quản lý và đặt lịch dịch vụ chăm sóc thú cưng</span></div>
  </footer>
}
