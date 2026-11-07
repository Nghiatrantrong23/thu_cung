// Quy tắc nghiệp vụ đặt lịch (theo đặc tả MH-02).
export const OPEN = 8 * 60 // 08:00
export const CLOSE = 19 * 60 // 19:00
export const STEP = 30 // bước giờ hẹn: 30 phút
export const CAPACITY = 2 // số lịch hẹn tối đa chạy song song (số nhân viên chăm sóc trong ca, dữ liệu giả)

// Ngày/giờ nghiệp vụ dùng giờ Việt Nam, không phụ thuộc múi giờ trình duyệt.
const businessClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function businessParts(date) {
  return Object.fromEntries(businessClock.formatToParts(date).map(({ type, value }) => [type, value]))
}

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
  const { year, month, day } = businessParts(d)
  return `${year}-${month}-${day}`
}

export function addDays(n, from = new Date()) {
  // Cộng ngày lịch bằng UTC, tránh bị thay đổi giờ do DST của máy người dùng.
  const d = new Date(`${toISODate(new Date(from))}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
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
 * Helper cho dữ liệu mẫu; API khung-gio-trong mới là nguồn công suất theo ca thực tế.
 * - Lịch hẹn phải nằm trong giờ mở cửa và kết thúc muộn nhất lúc 19:00.
 * - Mọi mốc 30 phút trong khoảng hẹn phải còn dưới CAPACITY lịch đang chạy.
 * - Lịch đã hủy không chiếm chỗ; ngày quá khứ và giờ đã qua trong hôm nay bị loại.
 */
export function getAvailableSlots({ date, duration, bookings, now = new Date() }) {
  if (!date || !duration) return []
  const todayISO = toISODate(now)
  if (date < todayISO) return []

  const isToday = date === todayISO
  const { hour, minute } = businessParts(now)
  const nowMin = Number(hour) * 60 + Number(minute)
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
