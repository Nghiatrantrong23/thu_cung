// Quy tắc nghiệp vụ cho màn hình Danh sách lịch hẹn (MH-03).
// Vòng đời: Chờ xác nhận -> Đã xác nhận -> Đang thực hiện -> Hoàn thành, hoặc Đã hủy.
export const STATUSES = ['Chờ xác nhận', 'Đã xác nhận', 'Đang thực hiện', 'Hoàn thành', 'Đã hủy']

// Hủy lịch chỉ áp dụng cho lịch "Chờ xác nhận" hoặc "Đã xác nhận".
export function canCancel(b) {
  return b.status === 'Chờ xác nhận' || b.status === 'Đã xác nhận'
}

// Đánh giá chỉ áp dụng cho lịch "Hoàn thành", mỗi lịch một đánh giá.
export function canReview(b) {
  return b.status === 'Hoàn thành' && !b.review
}

export function formatCode(id) {
  return String(id).padStart(3, '0')
}

export function filterByStatus(list, status) {
  return status === 'Tất cả' ? list : list.filter((b) => b.status === status)
}

// Mới nhất trước (mã lớn trước), giống thứ tự trong đặc tả: 101, 098, 090, 085.
export function sortNewestFirst(list) {
  return [...list].sort((a, b) => b.id - a.id)
}
