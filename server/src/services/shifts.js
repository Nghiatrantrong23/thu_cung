import { query, withTransaction } from '../config/db.js'
import { integerId } from './dispatch.js'
import { BOOKING_LOCK_NAMESPACE, bookingError, readSchedule } from './booking.js'
import { businessNow, isValidDate, isValidTime, toMinutes, canSchedule } from '../lib/scheduling.js'
import { string } from '../lib/validation.js'

export async function listShifts(date,user) {
    if (!isValidDate(date)) throw bookingError(400,'Ngày xem ca không hợp lệ.')
    const rows=await query(`SELECT ca.ma_ca_lam_viec AS id,ca.ma_nhan_vien AS "staffId",nv.ho_ten AS name,
        to_char(ca.ngay,'YYYY-MM-DD') AS date,to_char(ca.gio_bat_dau,'HH24:MI') AS start,
        to_char(ca.gio_ket_thuc,'HH24:MI') AS end,ca.trang_thai AS active,ca.ghi_chu AS note,ca.vi_tri AS location
        FROM ca_lam_viec ca JOIN nhan_vien nv USING(ma_nhan_vien) WHERE ca.ngay=$1::date
        AND ($2::int IS NULL OR ca.ma_nhan_vien=$2) ORDER BY nv.ho_ten,ca.gio_bat_dau`,[date,user.chucVu==='Nhân viên chăm sóc'?user.userId:null])
    return rows.rows
}
export async function caregivers() {
    return (await query(`SELECT nv.ma_nhan_vien AS id,nv.ho_ten AS name FROM nhan_vien nv JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
        WHERE nd.vai_tro='NhanVien' AND nd.trang_thai=true AND nv.trang_thai=true AND nv.chuc_vu='Nhân viên chăm sóc' ORDER BY nv.ho_ten`)).rows
}
export async function validateDayCapacity(client,day) {
    const schedule=await readSchedule(client,day)
    for (const job of schedule.bookings) {
        if (!canSchedule({shifts:schedule.shifts,bookings:schedule.bookings.filter(row=>row.id!==job.id),candidate:job}))
            throw bookingError(409,'Thay đổi làm mất ca bao phủ hoặc thiếu chỗ cho lịch đang mở. Hãy điều phối các lịch bị ảnh hưởng trước.')
    }
}
export async function saveShift(id,body,cancel=false) {
    return withTransaction(async client=>{
        const old=id?(await client.query("SELECT *,to_char(ngay,'YYYY-MM-DD') AS date FROM ca_lam_viec WHERE ma_ca_lam_viec=$1",[integerId(id)])).rows[0]:null
        if (id&&!old) throw bookingError(404,'Không tìm thấy ca làm.')
        const staff=old?old.ma_nhan_vien:integerId(body?.nhanVienId)
        const date=cancel?old.date:body?.ngay
        if (!isValidDate(date)||date<businessNow().date || (old&&old.date<businessNow().date)) throw bookingError(400,'Chỉ chỉnh ca hôm nay hoặc tương lai.')
        const start=cancel?null:body?.gioBatDau, end=cancel?null:body?.gioKetThuc
        if (!cancel&&(!isValidTime(start)||!isValidTime(end)||toMinutes(start)<480||toMinutes(end)>1140||toMinutes(end)<=toMinutes(start))) throw bookingError(400,'Ca phải trong 08:00–19:00, giờ kết thúc sau bắt đầu.')
        await client.query('SELECT pg_advisory_xact_lock(171720,$1::int)',[staff])
        const days=[...new Set([date,old?.date].filter(Boolean))].sort()
        for (const day of days) await client.query('SELECT pg_advisory_xact_lock($1::int,$2::int)',[BOOKING_LOCK_NAMESPACE,Number(day.replaceAll('-',''))])
        if (old) {
            const current=(await client.query('SELECT *,to_char(ngay,\'YYYY-MM-DD\') AS date FROM ca_lam_viec WHERE ma_ca_lam_viec=$1 FOR UPDATE',[id])).rows[0]
            if (!current.trang_thai||current.date!==old.date||String(current.gio_bat_dau)!==String(old.gio_bat_dau)||String(current.gio_ket_thuc)!==String(old.gio_ket_thuc)) throw bookingError(409,'Ca đã thay đổi. Vui lòng tải lại.')
        }
        const active=await client.query(`SELECT nv.ma_nhan_vien FROM nhan_vien nv JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
            WHERE nv.ma_nhan_vien=$1 AND nv.chuc_vu='Nhân viên chăm sóc' AND nv.trang_thai=true AND nd.trang_thai=true AND nd.vai_tro='NhanVien' FOR SHARE OF nv,nd`,[staff])
        if (!active.rowCount&&!cancel) throw bookingError(400,'Nhân viên không hoạt động hoặc không đúng chức vụ chăm sóc.')
        let result
        if (cancel) result=await client.query('UPDATE ca_lam_viec SET trang_thai=false WHERE ma_ca_lam_viec=$1 RETURNING ma_ca_lam_viec AS id',[id])
        else {
            const note=string(body.ghiChu,'Ghi chú',255,false)||null,location=string(body.viTri,'Vị trí',100,false)||null
            result=id?await client.query('UPDATE ca_lam_viec SET ngay=$2,gio_bat_dau=$3,gio_ket_thuc=$4,ghi_chu=$5,vi_tri=$6 WHERE ma_ca_lam_viec=$1 RETURNING ma_ca_lam_viec AS id',[id,date,start,end,note,location])
                :await client.query('INSERT INTO ca_lam_viec(ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc,ghi_chu,vi_tri) VALUES($1,$2,$3,$4,$5,$6) RETURNING ma_ca_lam_viec AS id',[staff,date,start,end,note,location])
        }
        for (const day of days) await validateDayCapacity(client,day)
        return {id:result.rows[0].id,message:cancel?'Đã hủy ca, giữ lại lịch sử.':'Đã lưu ca làm.'}
    })
}
