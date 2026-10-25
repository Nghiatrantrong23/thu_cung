import { requirePaidDeposit,recordDepositReschedule } from './depositStore.js'
import { audit } from './audit.js'
import { withTransaction, query } from '../config/db.js'
import { lockedBooking, integerId } from './dispatch.js'
import { bookingError, BOOKING_LOCK_NAMESPACE, readSchedule } from './booking.js'
import { businessNow, isValidDate, isValidTime, toMinutes, canSchedule } from '../lib/scheduling.js'
import { string } from '../lib/validation.js'
import { notify, notifyReception } from './notifications.js'

export async function updateCare(id, body, user) {
    const action=body?.hanhDong
    if (!['bat-dau','khong-du-dieu-kien','dich-vu','hoan-thanh'].includes(action)) throw bookingError(400,'Thao tác chăm sóc không hợp lệ.')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id)
        if (booking.ma_nhan_vien!==user.userId) throw bookingError(403,'Chỉ nhân viên được phân công được thực hiện dịch vụ.')
        if (!['DaXacNhan','DangThucHien'].includes(booking.trang_thai)) throw bookingError(409,'Trạng thái lịch đã thay đổi.')
        let state=booking.trang_thai, note=string(body.ghiChu,'Ghi chú chăm sóc',500,false)
        if (action==='khong-du-dieu-kien') {
            if (state!=='DaXacNhan') throw bookingError(409,'Chỉ báo không đủ điều kiện trước khi bắt đầu. Dừng dịch vụ đang làm cần quyết toán riêng.')
            note=string(body.ghiChu,'Lý do không đủ điều kiện',500)
            await client.query('UPDATE lich_hen SET yeu_cau_xu_ly=$2,ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1',[booking.ma_lich_hen,note])
            await notifyReception(client,booking.ma_lich_hen,'Thú cưng không đủ điều kiện phục vụ',`Lịch #${booking.ma_lich_hen}: ${note}. Vui lòng liên hệ khách để hủy hoặc đổi lịch.`)
        } else if (action==='bat-dau') {
            await requirePaidDeposit(client,booking.ma_lich_hen)
            if (state!=='DaXacNhan' || booking.yeu_cau_xu_ly) throw bookingError(409,'Lịch chưa sẵn sàng bắt đầu hoặc đang chờ lễ tân xử lý.')
            if (booking.date!==businessNow().date) throw bookingError(400,'Chỉ bắt đầu lịch của ngày hôm nay (giờ Việt Nam).')
            const schedule=await readSchedule(client,booking.date)
            const current=schedule.bookings.find(row=>row.id===booking.ma_lich_hen)
            if (!current || !canSchedule({shifts:schedule.shifts,bookings:schedule.bookings.filter(row=>row.id!==current.id),candidate:current})) throw bookingError(409,'Phân công không còn được ca làm bao phủ.')
            state='DangThucHien'
            await client.query("UPDATE lich_hen SET trang_thai='DangThucHien',ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",[booking.ma_lich_hen])
            await notify(client,booking.ma_khach_hang,booking.ma_lich_hen,'Bắt đầu chăm sóc',`Lịch #${booking.ma_lich_hen} đã bắt đầu thực hiện.`)
        } else if (action==='dich-vu') {
            if (state!=='DangThucHien') throw bookingError(409,'Cần bắt đầu lịch trước khi cập nhật dịch vụ.')
            const service=integerId(body.maDichVu)
            const detail=(await client.query('SELECT * FROM chi_tiet_lich_hen WHERE ma_lich_hen=$1 AND ma_dv=$2 FOR UPDATE',[booking.ma_lich_hen,service])).rows[0]
            if (!detail) throw bookingError(404,'Dịch vụ không thuộc lịch này.')
            const next=body.trangThai
            if (!((detail.trang_thai==='ChoThucHien' && next==='DangThucHien') || (detail.trang_thai==='DangThucHien' && next==='HoanThanh')))
                throw bookingError(409,'Dịch vụ chỉ được chuyển Chờ thực hiện → Đang thực hiện → Hoàn thành.')
            await client.query('UPDATE chi_tiet_lich_hen SET trang_thai=$3,ghi_chu_cham_soc=$4 WHERE ma_lich_hen=$1 AND ma_dv=$2',[booking.ma_lich_hen,service,next,note||detail.ghi_chu_cham_soc])
            note=`Dịch vụ #${service}: ${next}. ${note}`
        } else {
            if (state!=='DangThucHien') throw bookingError(409,'Lịch chưa bắt đầu thực hiện.')
            const details=await client.query('SELECT trang_thai FROM chi_tiet_lich_hen WHERE ma_lich_hen=$1 FOR UPDATE',[booking.ma_lich_hen])
            if (!details.rowCount || details.rows.some(row=>row.trang_thai!=='HoanThanh')) throw bookingError(409,'Phải hoàn thành tất cả chi tiết dịch vụ trước.')
            state='HoanThanh'
            await client.query("UPDATE lich_hen SET trang_thai='HoanThanh',ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",[booking.ma_lich_hen])
            await notifyReception(client,booking.ma_lich_hen,'Sẵn sàng lập hóa đơn',`Lịch #${booking.ma_lich_hen} đã hoàn thành dịch vụ.`)
            await notify(client,booking.ma_khach_hang,booking.ma_lich_hen,'Hoàn thành chăm sóc',`Lịch #${booking.ma_lich_hen} đã hoàn thành.`)
        }
        await audit(client,booking,user,action,state,note||'Cập nhật chăm sóc')
        return {message:'Đã lưu cập nhật chăm sóc.',trangThaiDB:state}
    })
}
export async function reschedule(id, body, user) {
    const date=body?.ngay, time=body?.gioStart
    const note=string(body?.lyDo,'Lý do đổi lịch',500)
    const start=toMinutes(time)
    if (!isValidDate(date)||!isValidTime(time)||start%30||start<480||start>=1140||Date.parse(`${date}T${time}:00+07:00`)<=Date.now()) throw bookingError(400,'Ngày giờ đổi lịch không hợp lệ hoặc ở quá khứ.')
    return withTransaction(async client=>{
        const idNumber=integerId(id)
        const first=(await client.query("SELECT to_char(ngay_gio_hen,'YYYY-MM-DD') AS date FROM lich_hen WHERE ma_lich_hen=$1",[idNumber])).rows[0]
        if (!first) throw bookingError(404,'Không tìm thấy lịch.')
        for (const day of [...new Set([first.date,date])].sort()) await client.query('SELECT pg_advisory_xact_lock($1::int,$2::int)',[BOOKING_LOCK_NAMESPACE,Number(day.replaceAll('-',''))])
        const booking=await lockedBooking(client,idNumber)
        if (booking.date!==first.date || !['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai)) throw bookingError(409,'Lịch đã thay đổi, không thể đổi giờ.')
        if(user.role==='KhachHang'&&booking.ma_khach_hang!==user.userId)throw bookingError(403,'Bạn không có quyền đổi lịch này.')
        if(body?.initiatedBy==='store'&&user.role!=='KhachHang'&&user.role!=='Admin'&&user.chucVu!=='Quản lý')throw bookingError(403,'Chỉ quản lý xác nhận đổi lịch do cửa hàng.')
        await recordDepositReschedule(client,booking,user.role==='KhachHang'||body?.initiatedBy!=='store')
        const duration=(await client.query('SELECT EXTRACT(EPOCH FROM (ngay_gio_ket_thuc_du_kien-ngay_gio_hen))/60 AS duration FROM lich_hen WHERE ma_lich_hen=$1',[idNumber])).rows[0].duration
        const end=start+Number(duration)
        if (!Number.isInteger(end)||end<=start||end>1140) throw bookingError(400,'Thời lượng lịch không hợp lệ hoặc kết thúc quá 19:00.')
        const schedule=await readSchedule(client,date)
        if (!canSchedule({shifts:schedule.shifts,bookings:schedule.bookings.filter(row=>row.id!==idNumber),candidate:{start,end}})) throw bookingError(409,'Giờ mới không còn đủ chỗ.')
        if (Date.parse(`${date}T${time}:00+07:00`)<=Date.now()) throw bookingError(409,'Giờ mới đã qua trong khi chờ xử lý.')
        const endTime=`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`
        await client.query("UPDATE lich_hen SET ngay_gio_hen=$2,ngay_gio_ket_thuc_du_kien=$3,ma_nhan_vien=NULL,trang_thai='ChoXacNhan',yeu_cau_xu_ly=NULL,ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",[idNumber,`${date} ${time}`,`${date} ${endTime}`])
        await audit(client,booking,user,'doi-lich','ChoXacNhan',`${booking.date} ${booking.start_time} → ${date} ${time}. ${note}`)
        await notify(client,booking.ma_khach_hang,idNumber,'Lịch hẹn đổi thời gian',`Lịch #${idNumber}: ${date} ${time}, chờ phân công lại. ${note}`)
        if (booking.ma_nhan_vien) await notify(client,booking.ma_nhan_vien,idNumber,'Lịch được chuyển giờ',`Lịch #${idNumber} được đổi giờ và sẽ phân công lại.`)
        return {message:'Đã đổi giờ, lịch chờ xác nhận và phân công lại.'}
    })
}
export async function history(id,user) {
    const booking=(await query('SELECT lh.ma_nhan_vien,tc.ma_khach_hang FROM lich_hen lh JOIN thu_cung tc USING(ma_thu_cung) WHERE ma_lich_hen=$1',[integerId(id)])).rows[0]
    if (!booking) throw bookingError(404,'Không tìm thấy lịch.')
    if (user.role==='KhachHang' && booking.ma_khach_hang!==user.userId) throw bookingError(403,'Không có quyền xem lịch sử.')
    if (user.chucVu==='Nhân viên chăm sóc' && booking.ma_nhan_vien!==user.userId) throw bookingError(403,'Chỉ xem lịch được giao.')
    return (await query(`SELECT nk.ma_nhat_ky AS id,nk.hanh_dong AS action,nk.noi_dung AS note,
        nk.trang_thai_cu AS "previousStatus",nk.trang_thai_moi AS status,nk.ngay_tao AS "createdAt",nd.ten_dang_nhap AS actor
        FROM nhat_ky_lich_hen nk JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nk.ma_nguoi_thuc_hien
        WHERE ma_lich_hen=$1 ORDER BY ma_nhat_ky DESC`,[id])).rows
}
