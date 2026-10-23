/**
 * Trạng thái lịch hẹn, hóa đơn, khiếu nại (State Pattern)
 */
export const APPOINTMENT_STATUS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
};

export const INVOICE_STATUS = {
  CREATED: "Đã lập",
  PARTIAL: "Thanh toán một phần",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

export const COMPLAINT_STATUS = {
  RECEIVED: "Tiếp nhận",
  RESOLVED: "Đã xử lý",
};
