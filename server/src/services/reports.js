import { query } from '../config/db.js'
import { isValidDate } from '../lib/scheduling.js'
import { bookingError } from './booking.js'
export function reportPeriod(from,to) {
    if(!isValidDate(from)||!isValidDate(to)||from>to)throw bookingError(400,'Khoảng ngày báo cáo không hợp lệ.')
    if((Date.parse(to)-Date.parse(from))/86400000>365)throw bookingError(400,'Mỗi báo cáo tối đa 366 ngày.')
    return [from,to]
}
export async function revenue(from,to) {
    const params=reportPeriod(from,to)
    // Payments are aggregated independently of invoice lines to avoid fan-out/double counting.
    const daily=await query(`SELECT to_char(ngay_thanh_toan,'YYYY-MM-DD') AS date,
        COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc IN ('TienMat','ChuyenKhoanQR')),0) AS collected,
        COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc='HoanTien'),0) AS refunded
        FROM thanh_toan WHERE trang_thai='ThanhCong' AND ngay_thanh_toan >= $1::date AND ngay_thanh_toan < $2::date+INTERVAL '1 day'
        GROUP BY ngay_thanh_toan::date,to_char(ngay_thanh_toan,'YYYY-MM-DD') ORDER BY date`,params)
    const services=await query(`SELECT ct.ma_dv AS id,ct.ten_dv_luu_lai AS name,SUM(ct.so_luong) AS quantity,SUM(ct.thanh_tien) AS gross
        FROM chi_tiet_hoa_don ct JOIN hoa_don hd USING(ma_hoa_don) WHERE hd.trang_thai<>'DaHuy'
        AND hd.ngay_lap >= $1::date AND hd.ngay_lap < $2::date+INTERVAL '1 day'
        GROUP BY ct.ma_dv,ct.ten_dv_luu_lai ORDER BY gross DESC`,params)
    const states=await query(`SELECT trang_thai AS status,COUNT(*) AS count FROM lich_hen
        WHERE ngay_gio_hen >= $1::date AND ngay_gio_hen < $2::date+INTERVAL '1 day' GROUP BY trang_thai ORDER BY trang_thai`,params)
    const legacy=await query("SELECT COUNT(*) AS count FROM thanh_toan WHERE trang_thai='HoanTien' AND ngay_thanh_toan >= $1::date AND ngay_thanh_toan < $2::date+INTERVAL '1 day'",params)
    const invoices=(await query(`SELECT COUNT(*) AS count,COALESCE(SUM(tong_tien),0) AS gross,COALESCE(SUM(giam_gia),0) AS discount
        FROM hoa_don WHERE trang_thai<>'DaHuy' AND ngay_lap >= $1::date AND ngay_lap < $2::date+INTERVAL '1 day'`,params)).rows[0]
    const totals=daily.rows.reduce((value,row)=>({collected:value.collected+Math.round(Number(row.collected)*100),refunded:value.refunded+Math.round(Number(row.refunded)*100)}),{collected:0,refunded:0})
    return {from,to,invoices,daily:daily.rows.map(row=>({...row,net:(Math.round(Number(row.collected)*100)-Math.round(Number(row.refunded)*100))/100})),services:services.rows,statuses:states.rows,
        collected:totals.collected/100,refunded:totals.refunded/100,net:(totals.collected-totals.refunded)/100,legacyRefundRows:Number(legacy.rows[0].count),timezone:'Asia/Ho_Chi_Minh'}
}
