export const DEPOSIT_POLICY_VERSION='deposit-30-24h-v1'
export const DEPOSIT_POLICY_TEXT='Đặt cọc 30% giá dự kiến. Hủy trước ít nhất 24 giờ được hoàn đủ cọc. Hủy dưới 24 giờ không hoàn cọc; được đổi lịch một lần trước giờ hẹn và giữ cọc. Sau lần đổi sát giờ, cọc không hoàn khi hủy tiếp. Không đến, không báo: mất cọc. Cửa hàng hủy: hoàn đủ cọc. Bé bệnh đột xuất: quản lý xem xét ngoại lệ.'
export function depositAmount(totalCents) {
    if(!Number.isSafeInteger(totalCents)||totalCents<=0)throw new Error('Invalid quote')
    return Math.ceil(totalCents*30/10000)*100 // round UP to a whole VND
}
export function cancellationOutcome({paid,storeCancelled=false,noShow=false,refundLocked=false,start,now=new Date()}) {
    if(!paid)return 'Cancelled'
    if(storeCancelled)return 'RefundPending'
    if(noShow||refundLocked)return 'Forfeited'
    return new Date(start).getTime()-now.getTime()>=86400000?'RefundPending':'Forfeited'
}
