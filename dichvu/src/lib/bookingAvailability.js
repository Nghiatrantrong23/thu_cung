export function availabilityMessage({error,reason,duration}) {
  if(error)return `Không tải được giờ hẹn: ${error} Vui lòng thử tải lại.`
  if(reason==='NO_SHIFTS')return 'Ngày này chưa có ca nhân viên chăm sóc đang hoạt động. Vui lòng liên hệ cửa hàng để xếp ca hoặc chọn ngày khác.'
  if(reason==='PAST_DATE')return 'Ngày hẹn đã qua. Vui lòng chọn hôm nay hoặc ngày tương lai.'
  return `Chưa có khung giờ phù hợp cho ${duration} phút trong ca hiện có (08:00–19:00). Vui lòng chọn ngày khác hoặc bớt dịch vụ.`
}
