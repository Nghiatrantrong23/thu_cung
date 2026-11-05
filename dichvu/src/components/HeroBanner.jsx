import { Link } from 'react-router-dom'
import petsImage from '../assets/petcare-hero-pets.png'
import './HeroBanner.css'

export default function HeroBanner({
  title = 'Một nơi để chăm sóc người bạn nhỏ của bạn',
  description = 'Chọn dịch vụ phù hợp, đặt lịch theo khung giờ còn trống và theo dõi hành trình chăm sóc của bé trong tài khoản PetCare.',
  image = petsImage,
  imageAlt = 'Chó golden retriever và mèo lông vàng trắng ngồi bên nhau',
}) {
  return <section className="petcare-hero public-home-shell" aria-labelledby="petcare-hero-title">
    <div className="petcare-hero-copy">
      <p className="public-home-kicker">CHĂM SÓC THÚ CƯNG CÙNG PETCARE</p>
      <h1 id="petcare-hero-title">{title}</h1>
      <p className="petcare-hero-description">{description}</p>
      <div className="petcare-hero-actions">
        <Link className="public-home-primary" to="/dat-lich">Đặt lịch ngay <span aria-hidden="true">→</span></Link>
        <a className="public-home-secondary" href="#dich-vu">Khám phá dịch vụ</a>
      </div>
      <p className="petcare-hero-hours">Giờ phục vụ: 08:00–19:00 mỗi ngày</p>
    </div>
    <div className="petcare-hero-image-wrap">
      <img className="petcare-hero-image" src={image} alt={imageAlt} fetchPriority="high" />
    </div>
  </section>
}
