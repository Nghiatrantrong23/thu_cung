import { audit } from './audit.js'
import { withTransaction } from '../config/db.js'
import { BOOKING_LOCK_NAMESPACE, bookingError, readSchedule } from './booking.js'
import { canSchedule } from '../lib/scheduling.js'
import { canManageAppointments } from '../middleware/auth.middleware.js'
import { notify } from './notifications.js'

export function integerId(value) {
    if (!/^[1-9]\d*$/.test(String(value)) || Number(value) > 2147483647) throw bookingError(400, 'Mã không hợp lệ.')
    return Number(value)
}
export function reason(value, required = true) {
    if (value == null && !required) return ''
    if (typeof value !== 'string' || value.trim().length > 300 || (required && !value.trim()))
        throw bookingError(400, 'Nhập lý do/ghi chú từ 1 đến 300 ký tự.')
    return value.trim()
}
export async function lockedBooking(client, value) {
    const id = integerId(value)
    const first = await client.query("SELECT to_char(ngay_gio_hen,'YYYY-MM-DD') AS date FROM lich_hen WHERE ma_lich_hen=$1", [id])
    if (!first.rows.length) throw bookingError(404, 'Không tìm thấy lịch hẹn.')
    const date = first.rows[0].date
    await client.query('SELECT pg_advisory_xact_lock($1::int,$2::int)', [BOOKING_LOCK_NAMESPACE, Number(date.replaceAll('-', ''))])
    const result = await client.query(`SELECT lh.*,tc.ma_khach_hang,
        to_char(lh.ngay_gio_hen,'YYYY-MM-DD') AS date,
        to_char(lh.ngay_gio_hen,'HH24:MI') AS start_time
        FROM lich_hen lh JOIN thu_cung tc USING(ma_thu_cung)
        WHERE ma_lich_hen=$1 FOR UPDATE OF lh`, [id])
    if (!result.rows.length) throw bookingError(404, 'Không tìm thấy lịch hẹn.')
    if (result.rows[0].date !== date) throw bookingError(409, 'Lịch đã đổi ngày. Vui lòng tải lại.')
    return result.rows[0]
}
async function availableStaff(client, booking) {
    const schedule = await readSchedule(client, booking.date)
    const job = schedule.bookings.find(b => b.id === booking.ma_lich_hen)
    if (!job || !Number.isFinite(job.end)) throw bookingError(409, 'Lịch không còn chờ hoặc thiếu thời gian kết thúc.')
    const others = schedule.bookings.filter(b => b.id !== booking.ma_lich_hen)
    const people = await client.query(`SELECT nv.ma_nhan_vien AS id,nv.ho_ten AS name,
        to_char(ca.gio_bat_dau,'HH24:MI') AS start,to_char(ca.gio_ket_thuc,'HH24:MI') AS end
        FROM ca_lam_viec ca JOIN nhan_vien nv USING(ma_nhan_vien)
        JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
        WHERE ca.ngay=$1::date AND ca.trang_thai=true AND nd.vai_tro='NhanVien' AND nd.trang_thai=true
        AND nv.trang_thai=true AND nv.chuc_vu='Nhân viên chăm sóc'
        AND ca.gio_bat_dau <= $2::timestamp::time AND ca.gio_ket_thuc >= $3::timestamp::time
        ORDER BY nv.ho_ten FOR SHARE OF ca,nv,nd`,
    [booking.date, booking.ngay_gio_hen, booking.ngay_gio_ket_thuc_du_kien])
    return people.rows.filter(person => canSchedule({ shifts: schedule.shifts, bookings: others,
        candidate: { start: job.start, end: job.end, staffId: person.id } }))
}
function appendNote(current, label, note) {
    const result = [current, `${label}: ${note}`].filter(Boolean).join('\n')
    // Full processing reason is retained in the audit log; never truncate the customer's original note.
    if (result.length > 500) return current
    return result
}
export async function getAvailableStaff(id) {
    return withTransaction(async client => {
        const booking = await lockedBooking(client, id)
        if (booking.trang_thai !== 'ChoXacNhan') throw bookingError(409, 'Lịch không còn ở trạng thái chờ xác nhận.')
        return availableStaff(client, booking)
    })
}
export async function processBooking(id, body, user) {
    if (!canManageAppointments(user)) throw bookingError(403, 'Bạn không có quyền điều phối.')
    const action = body?.hanhDong
    if (!['phan-cong', 'giu-cho', 'tu-choi'].includes(action)) throw bookingError(400, 'Chọn một thao tác xử lý lịch.')
    const note = reason(body.lyDo, action !== 'phan-cong')
    const staffId = action === 'phan-cong' ? integerId(body.nhanVienId) : null
    return withTransaction(async client => {
        const booking = await lockedBooking(client, id)
        if (booking.trang_thai !== 'ChoXacNhan') throw bookingError(409, 'Lịch đã đổi trạng thái. Vui lòng tải lại.')
        if (action === 'phan-cong') {
            const staff = await availableStaff(client, booking)
            if (!staff.some(s => s.id === staffId)) throw bookingError(409, 'Nhân viên không đủ ca, trùng lịch hoặc ảnh hưởng chỗ đã giữ. Vui lòng chọn lại.')
        }
        const state = action === 'phan-cong' ? 'DaXacNhan' : action === 'tu-choi' ? 'TuChoi' : 'ChoXacNhan'
        const label = action === 'tu-choi' ? 'Từ chối' : action === 'giu-cho' ? 'Giữ chờ' : 'Phân công'
        const notes = note ? appendNote(booking.ghi_chu, label, note) : booking.ghi_chu
        await client.query(`UPDATE lich_hen SET trang_thai=$2,ma_nhan_vien=$3,ghi_chu=$4,ngay_cap_nhat=NOW()
            WHERE ma_lich_hen=$1`, [booking.ma_lich_hen, state, staffId, notes])
        if (action === 'tu-choi') await client.query("UPDATE chi_tiet_lich_hen SET trang_thai='DaHuy' WHERE ma_lich_hen=$1", [booking.ma_lich_hen])
        await audit(client,booking,user,action,state,note || 'Xác nhận và phân công nhân viên')
        if (action !== 'giu-cho') {
            await notify(client, booking.ma_khach_hang, booking.ma_lich_hen, label === 'Từ chối' ? 'Lịch hẹn bị từ chối' : 'Lịch hẹn đã xác nhận',
                `Lịch #${booking.ma_lich_hen}, ${booking.date} ${booking.start_time}.${note ? ` ${note}` : ''}`)
        }
        if (staffId) await notify(client, staffId, booking.ma_lich_hen, 'Lịch mới được phân công', `Bạn phụ trách lịch #${booking.ma_lich_hen}, ${booking.date} ${booking.start_time}.`)
        return { message: action === 'phan-cong' ? 'Đã xác nhận và phân công.' : action === 'tu-choi' ? 'Đã từ chối lịch hẹn.' : 'Đã lưu ghi chú, giữ chờ xác nhận.', trangThaiDB: state }
    })
}
export async function cancelBooking(id, body, user) {
    const staff = canManageAppointments(user)
    if (!staff && user.role !== 'KhachHang') throw bookingError(403, 'Bạn không có quyền hủy lịch.')
    const note = reason(body?.lyDo, staff) || 'Khách hàng yêu cầu hủy.'
    return withTransaction(async client => {
        const booking = await lockedBooking(client, id)
        if (!staff && booking.ma_khach_hang !== user.userId) throw bookingError(403, 'Bạn không có quyền hủy lịch này.')
        if (!['ChoXacNhan', 'DaXacNhan'].includes(booking.trang_thai)) throw bookingError(409, 'Lịch đã đổi trạng thái, không thể hủy.')
        await client.query("UPDATE lich_hen SET trang_thai='DaHuy',ghi_chu=$2,ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",
            [booking.ma_lich_hen, appendNote(booking.ghi_chu, 'Hủy lịch', note)])
        await client.query("UPDATE chi_tiet_lich_hen SET trang_thai='DaHuy' WHERE ma_lich_hen=$1", [booking.ma_lich_hen])
        await audit(client,booking,user,'huy','DaHuy',note)
        await notify(client, booking.ma_khach_hang, booking.ma_lich_hen, 'Lịch hẹn đã hủy', `Lịch #${booking.ma_lich_hen}: ${note}`)
        if (booking.ma_nhan_vien) await notify(client, booking.ma_nhan_vien, booking.ma_lich_hen, 'Lịch được phân công đã hủy', `Lịch #${booking.ma_lich_hen}: ${note}`)
        return { message: 'Đã hủy lịch hẹn.', trangThaiDB: 'DaHuy' }
    })
}
