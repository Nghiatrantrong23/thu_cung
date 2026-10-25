import { formatDateVN } from './tinhGioTrong.js'

// DB timestamps without an offset already use the business timezone.
export function displayDate(value) {
  if (!value) return '—'
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(date)
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/)
  return match ? `${formatDateVN(match[1])}${match[2] ? ` ${match[2]}` : ''}` : value
}
