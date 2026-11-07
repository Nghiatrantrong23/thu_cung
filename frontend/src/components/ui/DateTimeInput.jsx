import { formatDateVN } from '../../lib/tinhGioTrong.js'

// Keep the native ISO value, validation, calendar and original onChange handler.
// Only the visible date is overlaid, so OS locale cannot swap month and day.
export function DateInput({ value = '', className = '', ...props }) {
  return <span className="pc-date-field">
    <input {...props} value={value} type="date" lang="vi-VN" className={`${className} pc-date-native`} onClick={event => {
      props.onClick?.(event)
      try { if (!event.defaultPrevented) event.currentTarget.showPicker?.() } catch { /* Native calendar remains available. */ }
    }}/>
    <span aria-hidden="true" className={`pc-date-value ${value ? '' : 'pc-date-placeholder'}`}>{value ? formatDateVN(value) : 'dd/mm/yyyy'}</span>
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pc-date-icon" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>
  </span>
}

export function TimeInput({ step: _step, ...props }) {
  return <input {...props} type="text" inputMode="numeric" placeholder="HH:mm" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="Nhập giờ 24h, ví dụ 08:00 hoặc 19:00"/>
}
