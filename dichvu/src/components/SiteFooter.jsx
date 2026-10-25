import { Link } from 'react-router-dom'
import BieuTuongDauChan from './BieuTuongDauChan.jsx'
import WorkIcon from './ui/WorkIcon.jsx'
import {staffNavigation} from '../lib/staffNavigation.js'
import './SiteFooter.css'

export default function SiteFooter({ customer = false, compact = false, role }) {
  if(compact) {
    const priorities=role==='admin'?['/admin/tai-khoan','/quan-ly/bao-cao','/le-tan/lich-hen']
      :role==='manager'?['/le-tan/lich-hen','/quan-ly/ca-lam-viec','/quan-ly/bao-cao']
      :role==='care'?['/nhan-vien/lich-lam-viec']
      :['/le-tan/lich-hen','/le-tan/dat-lich-tai-quay','/le-tan/hoa-don']
    const allowed=staffNavigation(role)
    const shortcuts=priorities.map(path=>allowed.find(link=>link.path===path)).filter(Boolean)
    return <footer className="site-footer site-footer--compact">
      <div className="site-footer__content site-footer__workspace">
        <section className="site-footer__identity" aria-label="PetCare">
          <div className="site-footer__logo"><span><BieuTuongDauChan className="h-6 w-6"/></span><div><strong>PetCare</strong><small>{shortcuts.length?'KHÔNG GIAN LÀM VIỆC':'CHĂM SÓC & KẾT NỐI'}</small></div></div>
          <p>Mỗi lần chăm sóc,<br/><strong>một niềm an tâm.</strong></p>
          <span className="site-footer__pet-note"><BieuTuongDauChan className="h-3.5 w-3.5"/>Dành cho chó và mèo</span>
        </section>
        <section className="site-footer__time-card" aria-label="Giờ chăm sóc"><span className="site-footer__time-icon"><WorkIcon name="cham-soc" className="h-5 w-5"/></span><div><h2>Giờ chăm sóc</h2><strong>08:00 <span>—</span> 19:00</strong><p>Theo ca làm và lịch hẹn đã xác nhận.</p></div></section>
        <nav className="site-footer__quick" aria-label="Lối tắt cuối trang"><h2>{shortcuts.length?'Tiếp tục công việc':'Khám phá PetCare'}</h2>{shortcuts.length?shortcuts.map(link=><Link key={link.path} to={link.path}><WorkIcon name={link.path} className="h-4 w-4"/><span>{link.label}</span><span aria-hidden="true">↗</span></Link>):<><Link to="/bang-gia"><WorkIcon name="dich-vu" className="h-4 w-4"/><span>Dịch vụ và bảng giá</span><span aria-hidden="true">↗</span></Link><Link to="/dang-nhap"><WorkIcon name="tai-khoan" className="h-4 w-4"/><span>Đăng nhập / Đăng ký</span><span aria-hidden="true">↗</span></Link></>}</nav>
      </div>
      <div className="site-footer__bottom"><span>© {new Date().getFullYear()} PetCare <span className="site-footer__bottom-dot" aria-hidden="true">·</span> Chăm sóc tận tâm, mỗi ngày.</span><span>Đồng hành cùng bạn và những người bạn nhỏ.</span></div>
    </footer>
  }
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
