import { query,withTransaction } from '../config/db.js'
import { integerId,lockedBooking } from './dispatch.js'
import { lockedInvoice,totals } from './invoices.js'
import { bookingError } from './booking.js'
import { string } from '../lib/validation.js'
import { cents,decimal,paymentKey } from '../lib/money.js'
import { notify } from './notifications.js'

export async function createComplaint(body,user,{customer=false}={}) {
    const bookingId=integerId(body?.maLichHen),note=string(body?.noiDung,'Nội dung khiếu nại',2000)
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,bookingId)
        if(customer && booking.ma_khach_hang!==user.userId)throw bookingError(404,'Không tìm thấy lịch hẹn.')
        let bill=null
        if(body.maHoaDon!=null) {
            bill=(await client.query('SELECT ma_hoa_don,ma_lich_hen FROM hoa_don WHERE ma_hoa_don=$1',[integerId(body.maHoaDon)])).rows[0]
            if(!bill||bill.ma_lich_hen!==bookingId)throw bookingError(400,'Hóa đơn không thuộc lịch hẹn này.')
        } else bill=(await client.query('SELECT ma_hoa_don FROM hoa_don WHERE ma_lich_hen=$1',[bookingId])).rows[0]
        const id=(await client.query(`INSERT INTO khieu_nai(ma_lich_hen,ma_hoa_don,noi_dung,nguoi_tiep_nhan,trang_thai)
            VALUES($1,$2,$3,$4,'DaTiepNhan') RETURNING ma_khieu_nai`,[bookingId,bill?.ma_hoa_don??null,note,user.userId])).rows[0].ma_khieu_nai
        await client.query(`INSERT INTO thong_bao(ma_nguoi_nhan,ma_lich_hen,tieu_de,noi_dung)
            SELECT nd.ma_nguoi_dung,$1,'Khiếu nại mới',$2 FROM nguoi_dung nd LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien=nd.ma_nguoi_dung
            WHERE nd.trang_thai=true AND (nd.vai_tro='Admin' OR (nd.vai_tro='NhanVien' AND nv.chuc_vu='Quản lý' AND nv.trang_thai=true))`,[bookingId,`Khiếu nại #${id}, lịch #${bookingId}.`])
        await notify(client,booking.ma_khach_hang,bookingId,'Đã tiếp nhận khiếu nại',`Khiếu nại #${id} đang chờ quản lý xử lý.`)
        return {message:'Đã tiếp nhận khiếu nại.',id}
    })
}
async function lockedComplaint(client,id) {
    const number=integerId(id)
    const first=(await client.query('SELECT ma_hoa_don FROM khieu_nai WHERE ma_khieu_nai=$1',[number])).rows[0]
    if(!first)throw bookingError(404,'Không tìm thấy khiếu nại.')
    const bill=first.ma_hoa_don?await lockedInvoice(client,first.ma_hoa_don):null
    const row=(await client.query(`SELECT kn.*,tc.ma_khach_hang FROM khieu_nai kn JOIN lich_hen lh USING(ma_lich_hen)
        JOIN thu_cung tc USING(ma_thu_cung) WHERE ma_khieu_nai=$1 FOR UPDATE OF kn`,[number])).rows[0]
    return {row,bill}
}
export async function decideComplaint(id,body,user) {
    const decision=body?.quyetDinh,note=string(body?.phuongAn,'Kết luận/phương án',2000)
    if(!['TuChoi','KhacPhuc','HoanTien'].includes(decision))throw bookingError(400,'Quyết định không hợp lệ.')
    const amount=decision==='HoanTien'?cents(body.soTienHoan,'Số tiền hoàn'):null
    if(amount===0)throw bookingError(400,'Số tiền hoàn phải lớn hơn 0.')
    return withTransaction(async client=>{
        const {row,bill}=await lockedComplaint(client,id)
        if(row.trang_thai!=='DaTiepNhan')throw bookingError(409,'Khiếu nại đã có quyết định.')
        if(decision==='HoanTien') {
            if(!bill||!['DaThanhToan','HoanTienMotPhan'].includes(bill.trang_thai))throw bookingError(409,'Chỉ duyệt hoàn cho hóa đơn đã thu đủ và còn tiền được hoàn.')
            const paid=await totals(client,bill.ma_hoa_don)
            const reserved=(await client.query("SELECT COALESCE(SUM(so_tien_hoan),0) AS amount FROM khieu_nai WHERE ma_hoa_don=$1 AND trang_thai='ChoHoanTien'",[bill.ma_hoa_don])).rows[0].amount
            if(amount>paid.paid-paid.refunded-cents(reserved))throw bookingError(400,'Số hoàn vượt tiền đã thu còn được hoàn, sau khi trừ các lần đã hoàn và khoản đang chờ chi.')
        }
        const state=decision==='HoanTien'?'ChoHoanTien':'DaXuLy'
        await client.query(`UPDATE khieu_nai SET quyet_dinh=$2,ket_qua_xu_ly=$3,so_tien_hoan=$4,trang_thai=$5::text,
            nguoi_duyet=$6,ngay_duyet=NOW(),nguoi_xu_ly=(SELECT ma_nhan_vien FROM nhan_vien WHERE ma_nhan_vien=$6),
            ngay_xu_ly=CASE WHEN $5::text='DaXuLy' THEN NOW() ELSE NULL END WHERE ma_khieu_nai=$1`,[row.ma_khieu_nai,decision,note,amount===null?null:decimal(amount),state,user.userId])
        await notify(client,row.ma_khach_hang,row.ma_lich_hen,decision==='HoanTien'?'Đã duyệt hoàn, đang chờ chi':'Kết quả khiếu nại',`Khiếu nại #${row.ma_khieu_nai}: ${note}${amount===null?'':`. Số tiền được duyệt ${decimal(amount)} VNĐ; chưa xác nhận đã trả.`}`)
        return {message:decision==='HoanTien'?'Đã duyệt hoàn. Chưa ghi nhận thực chi.':'Đã lưu kết quả xử lý.',status:state}
    })
}
export async function executeRefund(id,body,user) {
    const key=paymentKey(body?.khoaChongLap),state=body.ketQua==='ThatBai'?'ThatBai':'ThanhCong'
    if(!['TienMat','ChuyenKhoan'].includes(body.phuongThucChi))throw bookingError(400,'Chọn tiền mặt hoặc chuyển khoản để chi hoàn.')
    if(body.ketQua!=null&&!['ThanhCong','ThatBai'].includes(body.ketQua))throw bookingError(400,'Kết quả chi không hợp lệ.')
    if(state==='ThanhCong'&&body.xacNhanDaChi!==true)throw bookingError(400,'Chỉ xác nhận khi đã thực tế trả tiền cho khách.')
    const proof=string(body.bangChung,'Mã chứng từ/bằng chứng chi',100,state==='ThanhCong')
    const failure=state==='ThatBai'?string(body.loiChi,'Lý do chi thất bại',500):null
    return withTransaction(async client=>{
        const {row,bill}=await lockedComplaint(client,id)
        const existing=(await client.query('SELECT * FROM thanh_toan WHERE khoa_chong_lap=$1',[key])).rows[0]
        if(existing) {
            if(existing.ma_khieu_nai!==row.ma_khieu_nai||existing.phuong_thuc!=='HoanTien'||existing.trang_thai!==state||existing.ma_giao_dich!==(proof||null)||existing.ly_do_hoan_tien!==`Khiếu nại #${row.ma_khieu_nai}; ${body.phuongThucChi}`)throw bookingError(409,'Mã chống lặp đã dùng cho nội dung khác.')
            return {message:'Lần chi này đã ghi nhận trước đó.',id:existing.ma_thanh_toan,replayed:true}
        }
        if(!bill||row.trang_thai!=='ChoHoanTien'||row.quyet_dinh!=='HoanTien')throw bookingError(409,'Khiếu nại chưa được duyệt chi hoặc đã chi xong.')
        const amount=cents(row.so_tien_hoan),paid=await totals(client,bill.ma_hoa_don)
        if(!amount||amount>paid.paid-paid.refunded)throw bookingError(409,'Số tiền còn được hoàn đã thay đổi.')
        const transaction=(await client.query(`INSERT INTO thanh_toan(ma_hoa_don,ma_khieu_nai,phuong_thuc,so_tien,trang_thai,khoa_chong_lap,ma_giao_dich,ly_do_hoan_tien,nguoi_ghi_nhan)
            VALUES($1,$2,'HoanTien',$3,$4,$5,$6,$7,$8) RETURNING ma_thanh_toan`,[bill.ma_hoa_don,row.ma_khieu_nai,decimal(amount),state,key,proof||null,`Khiếu nại #${row.ma_khieu_nai}; ${body.phuongThucChi}`,user.userId])).rows[0].ma_thanh_toan
        if(state==='ThanhCong') {
            await client.query('UPDATE hoa_don SET trang_thai=$2 WHERE ma_hoa_don=$1',[bill.ma_hoa_don,paid.refunded+amount===paid.paid?'DaHoanTien':'HoanTienMotPhan'])
            await client.query(`UPDATE khieu_nai SET trang_thai='DaXuLy',nguoi_chi=$2,ngay_chi=NOW(),ngay_xu_ly=NOW(),bang_chung_chi=$3,phuong_thuc_hoan=$4,loi_chi=NULL WHERE ma_khieu_nai=$1`,[row.ma_khieu_nai,user.userId,proof,body.phuongThucChi])
            await notify(client,row.ma_khach_hang,row.ma_lich_hen,'Đã hoàn tiền cho khách',`Khiếu nại #${row.ma_khieu_nai}: đã chi ${decimal(amount)} VNĐ. Chứng từ: ${proof}`)
        } else await client.query('UPDATE khieu_nai SET loi_chi=$2 WHERE ma_khieu_nai=$1',[row.ma_khieu_nai,failure])
        return {message:state==='ThanhCong'?'Đã ghi nhận thực chi hoàn tiền.':'Đã lưu chi thất bại, giữ chờ hoàn; tiền và hóa đơn chưa thay đổi.',id:transaction}
    })
}
export async function complaintList(user,id=null) {
    return (await query(`SELECT kn.*,kh.ho_ten AS customer_name,tc.ten_thu_cung AS pet_name,
        to_char(kn.ngay_tiep_nhan,'YYYY-MM-DD HH24:MI') AS date,to_char(kn.ngay_chi,'YYYY-MM-DD HH24:MI') AS paid_date FROM khieu_nai kn JOIN lich_hen lh USING(ma_lich_hen)
        JOIN thu_cung tc USING(ma_thu_cung) JOIN khach_hang kh USING(ma_khach_hang)
        WHERE ($1::int IS NULL OR tc.ma_khach_hang=$1) AND ($2::int IS NULL OR kn.ma_khieu_nai=$2)
        ORDER BY kn.ma_khieu_nai DESC LIMIT 200`,[user.role==='KhachHang'?user.userId:null,id===null?null:integerId(id)])).rows
}
