import { notifyReception } from './notifications.js'
import bcrypt from 'bcrypt'
import { generateMatKhauTam } from '../utils/matKhau.js'
import { query, withTransaction } from '../config/db.js'
import { env } from '../config/env.js'
import { businessNow, isValidDate, isValidTime, toMinutes, validateDuration, canSchedule } from '../lib/scheduling.js'

export const BOOKING_LOCK_NAMESPACE = 171717
const active = ['ChoXacNhan', 'DaXacNhan', 'DangThucHien']
export function bookingError(status, message) { return Object.assign(new Error(message), { status }) }
function id(value, label) {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) throw bookingError(400, `${label} không hợp lệ.`)
    return Number(value)
}
function text(value, max, label, required = false) {
    if (value == null && !required) return ''
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw bookingError(400, `${label} không hợp lệ.`)
    return value.trim()
}
export function validateBookingInput(body, now = new Date()) {
    if (!body || !isValidDate(body.ngay) || !isValidTime(body.gioStart)) throw bookingError(400, 'Ngày hoặc giờ hẹn không hợp lệ.')
    const start = toMinutes(body.gioStart)
    if (start < 480 || start >= 1140 || start % 30) throw bookingError(400, 'Chọn giờ hẹn theo bước 30 phút trong 08:00–19:00.')
    if (Date.parse(`${body.ngay}T${body.gioStart}:00+07:00`) <= now.getTime()) throw bookingError(400, 'Giờ hẹn phải ở tương lai (giờ Việt Nam).')
    if (!Array.isArray(body.dichVuIds) || !body.dichVuIds.length) throw bookingError(400, 'Vui lòng chọn dịch vụ.')
    const services = body.dichVuIds.map((v) => id(v, 'Mã dịch vụ'))
    if (new Set(services).size !== services.length) throw bookingError(400, 'Không chọn trùng dịch vụ.')
    return { date: body.ngay, start, time: body.gioStart, services, note: text(body.ghiChu, 500, 'Ghi chú') }
}

export async function readSchedule(db, date) {
    const shifts = await db.query(`SELECT ca.ma_nhan_vien AS staff_id,
        CEIL(EXTRACT(EPOCH FROM ca.gio_bat_dau)/60)::int AS start,
        FLOOR(EXTRACT(EPOCH FROM ca.gio_ket_thuc)/60)::int AS end
        FROM ca_lam_viec ca JOIN nhan_vien nv ON nv.ma_nhan_vien=ca.ma_nhan_vien
        JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
        WHERE ca.ngay=$1::date AND ca.trang_thai=true AND nv.chuc_vu='Nhân viên chăm sóc'
        AND nv.trang_thai=true AND nd.trang_thai=true AND nd.vai_tro='NhanVien' FOR SHARE OF ca,nv,nd`, [date])
    const bookings = await db.query(`SELECT ma_lich_hen AS id, ma_nhan_vien AS staff_id,
        FLOOR(EXTRACT(EPOCH FROM ngay_gio_hen::time)/60)::int AS start,
        CEIL(EXTRACT(EPOCH FROM ngay_gio_ket_thuc_du_kien::time)/60)::int AS end
        FROM lich_hen WHERE ngay_gio_hen >= $1::date AND ngay_gio_hen < $1::date + INTERVAL '1 day'
        AND trang_thai=ANY($2::text[])`, [date, active])
    // Round occupied intervals outward and shifts inward: legacy seconds cannot create false capacity.
    const map = (r) => ({ id: r.id, staffId: r.staff_id, start: r.start == null ? NaN : Number(r.start), end: r.end == null ? NaN : Number(r.end) })
    return { shifts: shifts.rows.map(map), bookings: bookings.rows.map(map) }
}

export async function availableSlots(date, duration, now = new Date()) {
    if (!isValidDate(date)) throw bookingError(400, 'Ngày hẹn không hợp lệ.')
    duration = validateDuration(duration)
    const current = businessNow(now)
    if (date < current.date) return []
    const schedule = await readSchedule({ query }, date)
    const result = []
    for (let start = 480; start + duration <= 1140; start += 30) {
        if (date === current.date && start <= current.minutes) continue
        if (canSchedule({ ...schedule, candidate: { start, end: start + duration } })) result.push(hhmm(start))
    }
    return result
}
function hhmm(n) { return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}` }

export async function createBooking(body, user, { counter = false, now } = {}) {
    const input = validateBookingInput(body, now ?? new Date())
    return withTransaction(async (client) => {
        // Every creator uses the same day lock BEFORE reading capacity, on the same transaction client.
        await client.query('SELECT pg_advisory_xact_lock($1::int, $2::int)', [BOOKING_LOCK_NAMESPACE, Number(input.date.replaceAll('-', ''))])
        let ownerId = user.userId
        let temporaryAccount = null
        if (counter) {
            const phone = text(body.sdt, 10, 'Số điện thoại')
            if (phone && !/^\d{10}$/.test(phone)) throw bookingError(400, 'Số điện thoại phải gồm 10 chữ số.')
            if (body.khachHangId != null) {
                ownerId = id(body.khachHangId, 'Mã khách hàng')
            } else {
                if (!phone) throw bookingError(400, 'Vui lòng cung cấp số điện thoại hoặc mã khách hàng.')
                // Concurrent reception requests for the same new customer on different days must serialize too.
                await client.query('SELECT pg_advisory_xact_lock(171718, hashtext($1))', [phone])
                const existing = await client.query('SELECT ma_nguoi_dung FROM nguoi_dung WHERE so_dien_thoai=$1', [phone])
                if (existing.rows.length) ownerId = existing.rows[0].ma_nguoi_dung
                else {
                    const fullName = text(body.hoTen, 100, 'Họ tên khách hàng', true)
                    const temporaryPassword = generateMatKhauTam(12)
                    const hash = await bcrypt.hash(temporaryPassword, env.bcryptRounds)
                    const result = await client.query(`INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, so_dien_thoai, vai_tro, bat_doi_mat_khau)
                        VALUES ($1,$2,$1,'KhachHang',true) RETURNING ma_nguoi_dung`, [phone, hash])
                    ownerId = result.rows[0].ma_nguoi_dung
                    temporaryAccount = { username: phone, password: temporaryPassword }
                    await client.query('INSERT INTO khach_hang (ma_khach_hang,ho_ten) VALUES ($1,$2)', [ownerId, fullName])
                }
            }
            const customer = await client.query(`SELECT nd.so_dien_thoai FROM nguoi_dung nd
                JOIN khach_hang kh ON kh.ma_khach_hang=nd.ma_nguoi_dung
                WHERE nd.ma_nguoi_dung=$1 AND nd.vai_tro='KhachHang' AND nd.trang_thai=true FOR SHARE OF nd`, [ownerId])
            if (!customer.rows.length) throw bookingError(403, 'Không tìm thấy khách hàng đang hoạt động.')
            if (phone && customer.rows[0].so_dien_thoai !== phone) throw bookingError(400, 'Số điện thoại không khớp khách hàng.')
        }
        let petId
        if (counter && body.thuCungId == null) {
            const name = text(body.tenThuCung, 50, 'Tên thú cưng', true)
            const species = body.loaiThuCung
            if (!['Chó', 'Mèo'].includes(species)) throw bookingError(400, 'Chỉ nhận Chó hoặc Mèo.')
            const result = await client.query(`INSERT INTO thu_cung (ma_khach_hang,ten_thu_cung,loai_thu_cung)
                VALUES ($1,$2,$3) RETURNING ma_thu_cung`, [ownerId, name, species])
            petId = result.rows[0].ma_thu_cung
        } else petId = id(body.thuCungId, 'Mã thú cưng')
        const pet = await client.query(`SELECT ma_thu_cung,ten_thu_cung,loai_thu_cung FROM thu_cung
            WHERE ma_thu_cung=$1 AND ma_khach_hang=$2 AND trang_thai=true FOR SHARE`, [petId, ownerId])
        if (!pet.rows.length) throw bookingError(403, 'Không tìm thấy thú cưng đang theo dõi thuộc khách hàng này.')
        const services = await client.query(`SELECT ma_dv,ten_dv,gia_hien_hanh,thoi_luong_phut FROM dich_vu
            WHERE ma_dv=ANY($1::int[]) AND trang_thai=true FOR SHARE`, [input.services])
        if (services.rows.length !== input.services.length) throw bookingError(400, 'Dịch vụ không hợp lệ hoặc đã ngừng cung cấp.')
        const duration = validateDuration(services.rows.reduce((sum, s) => sum + validateDuration(s.thoi_luong_phut), 0))
        const end = input.start + duration
        if (end > 1140) throw bookingError(400, 'Lịch hẹn phải kết thúc không quá 19:00.')
        const schedule = await readSchedule(client, input.date)
        if (!canSchedule({ ...schedule, candidate: { start: input.start, end } })) throw bookingError(409, 'Khung giờ đã hết chỗ hoặc không có nhân viên đủ ca phục vụ.')
        // Locks/queries may have taken time; do not commit an appointment whose start has passed.
        validateBookingInput(body, now ?? new Date())
        const result = await client.query(`INSERT INTO lich_hen (ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai,ghi_chu)
            VALUES ($1,$2,$3,'ChoXacNhan',$4) RETURNING ma_lich_hen`,
        [petId, `${input.date} ${input.time}:00`, `${input.date} ${hhmm(end)}:00`, input.note || null])
        const bookingId = result.rows[0].ma_lich_hen
        for (const service of services.rows) await client.query(`INSERT INTO chi_tiet_lich_hen (ma_lich_hen,ma_dv,so_luong,gia_du_kien)
            VALUES ($1,$2,1,$3)`, [bookingId, service.ma_dv, service.gia_hien_hanh])
        await notifyReception(client, bookingId, 'Lịch hẹn mới chờ xác nhận', `Lịch #${bookingId}, ${input.date} ${input.time}.`)
        return { temporaryAccount, id: bookingId, pet: pet.rows[0], services: services.rows, date: input.date, start: input.time, end: hhmm(end), note: input.note }
    })
}
