import { query,withTransaction } from '../config/db.js'
import { integerId,lockedBooking } from './dispatch.js'
import { bookingError } from './booking.js'
import { cents,decimal,paymentKey } from '../lib/money.js'
import { string } from '../lib/validation.js'
import { notify } from './notifications.js'
import { audit } from './audit.js'

export async function lockedInvoice(client,id) {
    const row=(await client.query(`SELECT hd.*,tc.ma_khach_hang FROM hoa_don hd JOIN lich_hen lh USING(ma_lich_hen)
        JOIN thu_cung tc USING(ma_thu_cung) WHERE hd.ma_hoa_don=$1 FOR UPDATE OF hd`,[integerId(id)])).rows[0]
    if(!row)throw bookingError(404,'Không tìm thấy hóa đơn.')
    return row
}
export async function totals(client,id) {
    const row=(await client.query(`SELECT
        COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc IN ('TienMat','ChuyenKhoanQR','MoMo') AND trang_thai='ThanhCong'),0) AS paid,
        COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc='HoanTien' AND trang_thai='ThanhCong'),0) AS refunded
        FROM thanh_toan WHERE ma_hoa_don=$1`,[id])).rows[0]
    return {paid:cents(row.paid),refunded:cents(row.refunded)}
}
export async function createInvoice(body,user) {
    const id=integerId(body?.maLichHen),discount=cents(body?.giamGia??0,'Giảm giá')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id)
        if(booking.trang_thai!=='HoanThanh')throw bookingError(409,'Chỉ lập hóa đơn cho lịch đã hoàn thành dịch vụ.')
        if((await client.query('SELECT 1 FROM hoa_don WHERE ma_lich_hen=$1',[id])).rowCount)throw bookingError(409,'Lịch đã có hóa đơn.')
        const details=await client.query(`SELECT ct.ma_dv,dv.ten_dv,ct.so_luong,ct.gia_du_kien,ct.trang_thai
            FROM chi_tiet_lich_hen ct JOIN dich_vu dv USING(ma_dv) WHERE ct.ma_lich_hen=$1 FOR SHARE OF ct,dv`,[id])
        if(!details.rowCount||details.rows.some(row=>row.trang_thai!=='HoanThanh'))throw bookingError(409,'Chi tiết dịch vụ chưa hoàn thành đầy đủ.')
        const total=details.rows.reduce((sum,row)=>sum+cents(row.gia_du_kien)*row.so_luong,0)
        decimal(total)
        if(discount>total)throw bookingError(400,'Giảm giá không được vượt tổng dịch vụ.')
        const amount=total-discount,state=amount===0?'DaThanhToan':'ChuaThanhToan'
        const bill=(await client.query(`INSERT INTO hoa_don(ma_lich_hen,tong_tien,giam_gia,thanh_tien,trang_thai,nguoi_lap)
            VALUES($1,$2,$3,$4,$5,$6) RETURNING ma_hoa_don`,[id,decimal(total),decimal(discount),decimal(amount),state,user.userId])).rows[0].ma_hoa_don
        for(const row of details.rows)await client.query(`INSERT INTO chi_tiet_hoa_don(ma_hoa_don,ma_dv,ten_dv_luu_lai,so_luong,don_gia,thanh_tien)
            VALUES($1,$2,$3,$4,$5,$6)`,[bill,row.ma_dv,row.ten_dv,row.so_luong,decimal(cents(row.gia_du_kien)),decimal(cents(row.gia_du_kien)*row.so_luong)])
        await audit(client,booking,user,'lap-hoa-don',booking.trang_thai,`Hóa đơn #${bill}, thành tiền ${decimal(amount)}.`)
        await notify(client,booking.ma_khach_hang,id,'Hóa đơn dịch vụ',`Hóa đơn #${bill}, cần thanh toán ${decimal(amount)} VNĐ.`)
        return {message:amount===0?'Hóa đơn 0 đồng đã tất toán, không tạo giao dịch 0 đồng.':'Đã lập hóa đơn.',id:bill}
    })
}
export async function collectPayment(id,body,user) {
    const key=paymentKey(body?.khoaChongLap),amount=cents(body?.soTien),method=body?.phuongThuc
    if(!amount||!['TienMat','ChuyenKhoanQR'].includes(method))throw bookingError(400,'Số tiền phải dương, phương thức tiền mặt hoặc chuyển khoản.')
    const cash=method==='TienMat'?cents(body.tienKhachDua,'Tiền khách đưa'):null
    if(cash!==null&&cash<amount)throw bookingError(400,'Tiền khách đưa phải đủ số tiền ghi nhận.')
    const state=body.ketQua==='ThatBai'?'ThatBai':'ThanhCong'
    if(body.ketQua!=null&&!['ThatBai','ThanhCong'].includes(body.ketQua))throw bookingError(400,'Kết quả giao dịch không hợp lệ.')
    if(method==='ChuyenKhoanQR'&&state==='ThanhCong'&&body.daNhanTien!==true)throw bookingError(400,'Phải xác nhận thực tế đã nhận tiền chuyển khoản.')
    const reference=string(body.maGiaoDich,'Mã tham chiếu',100,false)||null
    return withTransaction(async client=>{
        const bill=await lockedInvoice(client,id)
        const existing=(await client.query('SELECT * FROM thanh_toan WHERE khoa_chong_lap=$1',[key])).rows[0]
        if(existing) {
            if(existing.ma_hoa_don!==bill.ma_hoa_don||existing.phuong_thuc!==method||cents(existing.so_tien)!==amount||existing.trang_thai!==state||
                (cash!==null&&cents(existing.tien_khach_dua)!==cash)||existing.ma_giao_dich!==reference)throw bookingError(409,'Mã chống lặp đã dùng cho nội dung khác.')
            return {message:'Giao dịch đã ghi nhận trước đó.',id:existing.ma_thanh_toan,replayed:true}
        }
        if(!['ChuaThanhToan','ThanhToanMotPhan'].includes(bill.trang_thai))throw bookingError(409,'Hóa đơn đã tất toán, hủy hoặc đang hoàn tiền.')
        const paid=await totals(client,bill.ma_hoa_don),remaining=cents(bill.thanh_tien)-paid.paid
        if(amount>remaining)throw bookingError(400,'Số tiền ghi nhận vượt số còn nợ.')
        const transaction=(await client.query(`INSERT INTO thanh_toan(ma_hoa_don,phuong_thuc,so_tien,trang_thai,khoa_chong_lap,tien_khach_dua,tien_thua,ma_giao_dich,nguoi_ghi_nhan)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ma_thanh_toan`,[bill.ma_hoa_don,method,decimal(amount),state,key,cash===null?null:decimal(cash),cash===null?null:decimal(cash-amount),reference,user.userId])).rows[0].ma_thanh_toan
        if(state==='ThanhCong') {
            const next=paid.paid+amount===cents(bill.thanh_tien)?'DaThanhToan':'ThanhToanMotPhan'
            await client.query('UPDATE hoa_don SET trang_thai=$2 WHERE ma_hoa_don=$1',[bill.ma_hoa_don,next])
            await notify(client,bill.ma_khach_hang,bill.ma_lich_hen,'Đã ghi nhận thanh toán',`Hóa đơn #${bill.ma_hoa_don}: ${decimal(amount)} VNĐ, còn nợ ${decimal(remaining-amount)} VNĐ.`)
        }
        return {message:state==='ThanhCong'?'Đã ghi nhận tiền thực nhận.':'Đã lưu giao dịch thất bại; công nợ không đổi.',id:transaction,tienThua:cash===null?0:Number(decimal(cash-amount))}
    })
}
export async function invoiceList(user) {
    const rows=await query(`SELECT hd.ma_hoa_don AS id,hd.ma_lich_hen AS "bookingId",hd.tong_tien AS total,hd.giam_gia AS discount,hd.thanh_tien AS amount,
        hd.trang_thai AS status,to_char(hd.ngay_lap,'YYYY-MM-DD HH24:MI') AS date,kh.ho_ten AS "customerName",tc.ten_thu_cung AS "petName"
        FROM hoa_don hd JOIN lich_hen lh USING(ma_lich_hen) JOIN thu_cung tc USING(ma_thu_cung) JOIN khach_hang kh USING(ma_khach_hang)
        WHERE ($1::int IS NULL OR tc.ma_khach_hang=$1) ORDER BY hd.ma_hoa_don DESC LIMIT 200`,[user.role==='KhachHang'?user.userId:null])
    return rows.rows
}
export async function invoiceDetail(id,user) {
    const bill=(await query(`SELECT hd.*,tc.ma_khach_hang,tc.ten_thu_cung AS pet_name,kh.ho_ten AS customer_name,nd.so_dien_thoai,
        to_char(hd.ngay_lap,'YYYY-MM-DD HH24:MI') AS date FROM hoa_don hd JOIN lich_hen lh USING(ma_lich_hen)
        JOIN thu_cung tc USING(ma_thu_cung) JOIN khach_hang kh USING(ma_khach_hang) JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang
        WHERE hd.ma_hoa_don=$1`,[integerId(id)])).rows[0]
    if(!bill)throw bookingError(404,'Không tìm thấy hóa đơn.')
    if(user.role==='KhachHang'&&bill.ma_khach_hang!==user.userId)throw bookingError(403,'Bạn không có quyền xem hóa đơn.')
    const details=await query('SELECT ten_dv_luu_lai AS name,so_luong AS quantity,don_gia AS price,thanh_tien AS amount FROM chi_tiet_hoa_don WHERE ma_hoa_don=$1 ORDER BY ma_chi_tiet_hoa_don',[id])
    const transactions=await query(`SELECT ma_thanh_toan AS id,phuong_thuc AS method,so_tien AS amount,trang_thai AS status,
        tien_khach_dua AS cash,tien_thua AS change,ma_giao_dich AS reference,to_char(ngay_thanh_toan,'YYYY-MM-DD HH24:MI') AS date
        FROM thanh_toan WHERE ma_hoa_don=$1 ORDER BY ma_thanh_toan`,[id])
    const amounts=await totals({query},id)
    return {invoice:bill,details:details.rows,transactions:transactions.rows,paid:Number(decimal(amounts.paid)),refunded:Number(decimal(amounts.refunded)),remaining:Number(decimal(Math.max(0,cents(bill.thanh_tien)-amounts.paid)))}
}
