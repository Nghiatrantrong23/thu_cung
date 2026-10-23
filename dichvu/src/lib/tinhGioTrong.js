// Quy tắc nghiệp vụ đặt lịch (theo đặc tả MH-02).
export const OPEN = 8 * 60 // 08:00
export const CLOSE = 19 * 60 // 19:00
export const STEP = 30 // bước giờ hẹn: 30 phút
export const CAPACITY = 2 // số lịch hẹn tối đa chạy song song (số nhân viên chăm sóc trong ca, dữ liệu giả)

export function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function toHHMM(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(n, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function formatDateVN(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatVND(n) {
  return new Intl.NumberFormat('vi-VN').format(n)
}

/**
 * Trả về danh sách giờ bắt đầu còn trống ("HH:MM") cho một ngày và tổng thời lượng.
 * - Lịch hẹn phải nằm trong giờ mở cửa và kết thúc muộn nhất lúc 19:00.
 * - Mọi mốc 30 phút trong khoảng hẹn phải còn dưới CAPACITY lịch đang chạy.
 * - Lịch đã hủy không chiếm chỗ; ngày quá khứ và giờ đã qua trong hôm nay bị loại.
 */
export function getAvailableSlots({ date, duration, bookings, now = new Date() }) {
  if (!date || !duration) return []
  const todayISO = toISODate(now)
  if (date < todayISO) return []

  const isToday = date === todayISO
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const sameDay = bookings
    .filter((b) => b.date === date && b.status !== 'Đã hủy')
    .map((b) => ({ s: toMin(b.start), e: toMin(b.end) }))

  const slots = []
  for (let s = OPEN; s + duration <= CLOSE; s += STEP) {
    if (isToday && s <= nowMin) continue
    const e = s + duration
    let free = true
    for (let t = s; t < e; t += STEP) {
      const busy = sameDay.filter((b) => b.s <= t && t < b.e).length
      if (busy >= CAPACITY) {
        free = false
        break
      }
    }
    if (free) slots.push(toHHMM(s))
  }
  return slots
}
