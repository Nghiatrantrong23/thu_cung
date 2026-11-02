import { bookingError } from './booking.js'
import { cents } from '../lib/money.js'
import { businessNow } from '../lib/scheduling.js'

export async function promotionDiscount(client, code, customerId, details, lock = true) {
    if (typeof code !== 'string' || !/^[A-Z0-9]{4,12}$/.test(code.trim().toUpperCase())) throw bookingError(400,'Mã khuyến mãi không hợp lệ.')
    const result = await client.query(`SELECT *,to_char(tu_ngay,'YYYY-MM-DD') AS from_date,to_char(den_ngay,'YYYY-MM-DD') AS to_date
        FROM khuyen_mai WHERE ma_code=$1 ${lock?'FOR UPDATE':''}`,[code.trim().toUpperCase()])
    const promo = result.rows[0]
    if(!promo)throw bookingError(404,'Mã khuyến mãi không tồn tại.')
    const today=businessNow().date
    if(!promo.dang_bat || today<promo.from_date || today>promo.to_date)
        throw bookingError(409,'Mã chưa có hiệu lực hoặc đã tắt.')
    const usage=(await client.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE ma_khach_hang=$2)::int AS customer
        FROM khuyen_mai_su_dung WHERE ma_khuyen_mai=$1`,[promo.ma_khuyen_mai,customerId])).rows[0]
    if(usage.total>=promo.tong_luot || usage.customer>=promo.moi_khach)throw bookingError(409,'Mã đã hết lượt sử dụng.')
    const services=(await client.query('SELECT ma_dv FROM khuyen_mai_dich_vu WHERE ma_khuyen_mai=$1',[promo.ma_khuyen_mai])).rows.map(row=>row.ma_dv)
    const total=details.reduce((sum,row)=>sum+cents(row.gia_du_kien)*Number(row.so_luong),0)
    if(total<cents(promo.don_toi_thieu))throw bookingError(400,'Đơn chưa đạt mức tối thiểu của mã.')
    const eligible=services.length ? details.filter(row=>services.includes(row.ma_dv)) : details
    const base=eligible.reduce((sum,row)=>sum+cents(row.gia_du_kien)*Number(row.so_luong),0)
    if(!base)throw bookingError(400,'Không có dịch vụ được áp dụng mã.')
    let discount=promo.loai==='PhanTram'?Math.round(base*Number(promo.gia_tri)/100):cents(promo.gia_tri)
    if(promo.loai==='PhanTram' && Number(promo.giam_toi_da)>0)discount=Math.min(discount,cents(promo.giam_toi_da))
    discount=Math.min(discount,base,total)
    if(discount<=0)throw bookingError(400,'Mã không tạo khoản giảm hợp lệ.')
    return { id:promo.ma_khuyen_mai, code:promo.ma_code, discount, total }
}
