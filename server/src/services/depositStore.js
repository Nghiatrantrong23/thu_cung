import { cents,decimal } from '../lib/money.js'
import { depositAmount,cancellationOutcome,DEPOSIT_POLICY_VERSION } from '../lib/depositPolicy.js'
const fail=(status,message)=>Object.assign(new Error(message),{status})
export async function depositsInstalled(client) {
    return (await client.query("SELECT to_regclass('public.booking_deposits') IS NOT NULL AS present")).rows[0].present
}
export async function depositRow(client,id) {
    if(!await depositsInstalled(client))return null
    return (await client.query('SELECT * FROM booking_deposits WHERE booking_id=$1 FOR UPDATE',[id])).rows[0]||null
}
export async function snapshotDeposit(client,id,total,start,accepted) {
    if(process.env.BOOKING_DEPOSIT_ENABLED!=='true')return null
    if(accepted!==true)throw fail(400,'Vui lòng đồng ý chính sách đặt cọc 30% và hủy lịch trước khi đặt.')
    if(!await depositsInstalled(client))throw fail(409,'Chưa nâng cấp dữ liệu đặt cọc. Vui lòng liên hệ cửa hàng.')
    const amount=depositAmount(total)
    if(amount>total)throw fail(400,'Giá dịch vụ không đủ để đặt cọc theo đơn vị đồng.')
    return (await client.query(`INSERT INTO booking_deposits(booking_id,policy_version,quoted_total,amount,original_start)
        VALUES($1,$2,$3,$4,$5::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') RETURNING *`,[id,DEPOSIT_POLICY_VERSION,decimal(total),decimal(amount),start])).rows[0]
}
export async function requirePaidDeposit(client,id) {
    const deposit=await depositRow(client,id)
    if(deposit && !['Paid','Applied'].includes(deposit.status))throw fail(409,'Lịch chưa đóng đủ tiền cọc 30%; chưa thể xác nhận hoặc bắt đầu chăm sóc.')
}
export async function cancelDeposit(client,booking,{storeCancelled=false,noShow=false,actor,reason,now=new Date()}={}) {
    const deposit=await depositRow(client,booking.ma_lich_hen)
    if(!deposit)return null
    if(!['Unpaid','Paid'].includes(deposit.status))throw fail(409,'Cọc đã được xử lý; không thể hủy lần nữa.')
    const start=`${booking.date}T${booking.start_time}:00+07:00`
    const status=cancellationOutcome({paid:deposit.status==='Paid',storeCancelled,noShow,refundLocked:deposit.refund_locked,start,now})
    await client.query('UPDATE booking_deposits SET status=$2,decision_reason=$3,decided_by=$4,decided_at=NOW() WHERE booking_id=$1',[deposit.booking_id,status,reason||null,actor||null])
    await client.query("UPDATE deposit_intents SET status='Cancelled' WHERE booking_id=$1 AND status='Pending'",[deposit.booking_id])
    return {status,amount:Number(deposit.amount)}
}
export async function recordDepositReschedule(client,booking,customer) {
    const deposit=await depositRow(client,booking.ma_lich_hen)
    if(!deposit)return
    if(!['Paid','Unpaid'].includes(deposit.status))throw fail(409,'Cọc không còn được giữ cho lịch này.')
    if(customer && Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)<=Date.now())throw fail(409,'Đã đến giờ hẹn. Vui lòng liên hệ cửa hàng.')
    if(customer&&deposit.late_reschedules>=1)throw fail(409,'Đã sử dụng một lần đổi lịch sát giờ để giữ cọc.')
    const late=Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)-Date.now()<86400000
    if(customer&&deposit.status==='Paid'&&late) {
        if(deposit.late_reschedules>=1)throw fail(409,'Đã sử dụng một lần đổi lịch sát giờ để giữ cọc.')
        await client.query('UPDATE booking_deposits SET late_reschedules=1,refund_locked=true WHERE booking_id=$1',[deposit.booking_id])
    }
}
export async function applyDeposit(client,bookingId,invoiceId,amount) {
    const deposit=await depositRow(client,bookingId)
    if(!deposit)return 0
    if(deposit.status!=='Paid')throw fail(409,'Lịch phải đóng đủ cọc trước khi lập hóa đơn.')
    if(cents(deposit.amount)>amount)throw fail(400,'Thành tiền sau giảm giá thấp hơn cọc đã thu. Cần xử lý chênh lệch trước khi lập hóa đơn.')
    await client.query("UPDATE booking_deposits SET status='Applied',invoice_id=$2 WHERE booking_id=$1",[bookingId,invoiceId])
    await client.query('UPDATE hoa_don SET deposit_credit=$2,trang_thai=$3 WHERE ma_hoa_don=$1',[invoiceId,deposit.amount,cents(deposit.amount)===amount?'DaThanhToan':'ThanhToanMotPhan'])
    return cents(deposit.amount)
}
