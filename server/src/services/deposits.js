import { randomBytes,randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import { query,withTransaction } from '../config/db.js'
import { lockedBooking } from './dispatch.js'
import { bookingError } from './booking.js'
import { depositRow,depositsInstalled,cancelDeposit } from './depositStore.js'
import { cents,paymentKey } from '../lib/money.js'
import { callbackSignature,validCallback } from '../lib/paymentSandbox.js'
import { DEPOSIT_POLICY_TEXT,DEPOSIT_POLICY_VERSION } from '../lib/depositPolicy.js'
import { sandboxEnabled } from './paymentSandbox.js'
import { notify,notifyReception } from './notifications.js'
import { audit } from './audit.js'
const secret=process.env.PAYMENT_SANDBOX_SECRET||randomBytes(48).toString('hex')
function owns(booking,user) {
    if(user.role==='KhachHang'&&booking.ma_khach_hang!==user.userId)throw bookingError(403,'Bạn không có quyền xem hoặc thanh toán cọc này.')
}
function publicDeposit(row) {
    if(!row)return null
    return {bookingId:row.booking_id,amount:Number(row.amount),quotedTotal:Number(row.quoted_total),status:row.status,
        version:row.policy_version,lateReschedules:row.late_reschedules,refundLocked:row.refund_locked,
        reason:row.decision_reason,invoiceId:row.invoice_id,policy:DEPOSIT_POLICY_TEXT}
}
export async function depositPolicy() {
    return {enabled:process.env.BOOKING_DEPOSIT_ENABLED==='true'&&await depositsInstalled({query}),rate:30,version:DEPOSIT_POLICY_VERSION,text:DEPOSIT_POLICY_TEXT,sandbox:await sandboxEnabled()}
}
export async function depositDetail(id,user) {
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id);owns(booking,user)
        const row=await depositRow(client,booking.ma_lich_hen)
        if(!row)return {deposit:null,transactions:[],intent:null,sandbox:await sandboxEnabled()}
        const transactions=(await client.query('SELECT id,kind,amount,method,sandbox,created_at AS date FROM deposit_transactions WHERE booking_id=$1 ORDER BY id',[row.booking_id])).rows
        const intent=(await client.query("SELECT * FROM deposit_intents WHERE booking_id=$1 ORDER BY expires_at DESC LIMIT 1",[row.booking_id])).rows[0]
        if(intent?.status==='Pending'&&new Date(intent.expires_at)<=new Date()){
            await client.query("UPDATE deposit_intents SET status='Expired' WHERE id=$1",[intent.id]);intent.status='Expired'
        }
        return {deposit:publicDeposit(row),transactions,intent:intent?await publicIntent(intent):null,sandbox:await sandboxEnabled()}
    })
}
async function publicIntent(row) {
    return {id:row.id,method:row.method,amount:Number(row.amount),status:row.status,expiresAt:row.expires_at,
        qr:row.status==='Pending'?await QRCode.toDataURL(`PETCARE SANDBOX DEPOSIT | ${row.id} | ${row.amount} VND | KHONG CHUYEN TIEN THAT`,{width:220,margin:2}):null}
}
async function needSandbox() {
    if(!await sandboxEnabled())throw bookingError(403,'Chưa kết nối cổng thanh toán thật. Mô phỏng cọc chỉ được dùng trên sandbox riêng.')
}
export async function createDepositIntent(id,body,user) {
    await needSandbox()
    if(!['BankQR','MoMo'].includes(body?.method))throw bookingError(400,'Cọc chỉ nhận QR ngân hàng hoặc MoMo; COD dùng trả phần còn lại.')
    const row=await withTransaction(async client=>{
        const booking=await lockedBooking(client,id);owns(booking,user)
        const deposit=await depositRow(client,booking.ma_lich_hen)
        if(!deposit||deposit.status!=='Unpaid'||!['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai))throw bookingError(409,'Lịch không còn chờ đóng cọc.')
        if(Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)<=Date.now())throw bookingError(409,'Đã đến giờ hẹn; liên hệ cửa hàng.')
        const open=(await client.query("SELECT * FROM deposit_intents WHERE booking_id=$1 AND status='Pending' FOR UPDATE",[id])).rows[0]
        if(open&&open.method===body.method&&new Date(open.expires_at)>new Date())return open
        if(open)await client.query("UPDATE deposit_intents SET status=$2 WHERE id=$1",[open.id,new Date(open.expires_at)<=new Date()?'Expired':'Cancelled'])
        return (await client.query("INSERT INTO deposit_intents(id,booking_id,method,amount,expires_at) VALUES($1,$2,$3,$4,NOW()+INTERVAL '15 minutes') RETURNING *",[randomUUID(),id,body.method,deposit.amount])).rows[0]
    })
    return publicIntent(row)
}
export async function depositCallback(body,signature) {
    await needSandbox()
    if(!validCallback(body,signature,secret))throw bookingError(401,'Chữ ký callback cọc không hợp lệ.')
    const found=(await query('SELECT booking_id FROM deposit_intents WHERE id=$1',[body.intentId])).rows[0]
    if(!found)throw bookingError(404,'Không tìm thấy yêu cầu cọc.')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,found.booking_id)
        const deposit=await depositRow(client,found.booking_id)
        const intent=(await client.query('SELECT * FROM deposit_intents WHERE id=$1 FOR UPDATE',[body.intentId])).rows[0]
        const next=body.result==='success'?'Paid':'Failed'
        if(intent.method!==body.method||cents(intent.amount)!==body.amount*100)throw bookingError(409,'Số tiền hoặc phương thức cọc không khớp.')
        if(intent.event_id===body.eventId&&intent.status===next)return {success:true,replayed:true}
        if(intent.status!=='Pending'||new Date(intent.expires_at)<=new Date()||deposit.status!=='Unpaid'||!['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai))throw bookingError(409,'Yêu cầu cọc hết hạn hoặc đã được xử lý.')
        if(Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)<=Date.now())throw bookingError(409,'Đã đến giờ hẹn, không nhận cọc từ yêu cầu cũ.')
        let transaction=null
        if(next==='Paid') {
            transaction=(await client.query("INSERT INTO deposit_transactions(booking_id,kind,amount,method,reference,idempotency_key,sandbox) VALUES($1,'Collect',$2,$3,$4,$5,true) RETURNING id",[deposit.booking_id,deposit.amount,intent.method==='MoMo'?'MoMo':'ChuyenKhoanQR',body.eventId,`deposit:${intent.id}`])).rows[0].id
            await client.query("UPDATE booking_deposits SET status='Paid' WHERE booking_id=$1",[deposit.booking_id])
            await notify(client,booking.ma_khach_hang,deposit.booking_id,'Đã nhận cọc (sandbox)',`Đã ghi nhận cọc mô phỏng ${deposit.amount} VNĐ. Lịch chờ lễ tân xác nhận; không có chuyển tiền thật.`)
            await notifyReception(client,deposit.booking_id,'Lịch đã đóng cọc',`Lịch #${deposit.booking_id} đã đóng cọc sandbox, cần xác nhận và phân công.`)
        }
        await client.query('UPDATE deposit_intents SET status=$2,event_id=$3,transaction_id=$4 WHERE id=$1',[intent.id,next,body.eventId,transaction])
        return {success:true}
    })
}
export async function simulateDeposit(id,body,user) {
    const detail=await depositDetail(id,user)
    if(!detail.intent||!['success','failed'].includes(body?.result))throw bookingError(400,'Chọn yêu cầu cọc và kết quả hợp lệ.')
    const payload={intentId:detail.intent.id,eventId:`deposit:${detail.intent.id}`,method:detail.intent.method,amount:detail.intent.amount,result:body.result}
    return depositCallback(payload,callbackSignature(payload,secret))
}
export async function collectDeposit(id,body,user) {
    const key=paymentKey(body?.key)
    if(!['TienMat','ChuyenKhoanQR','MoMo'].includes(body?.method)||body.received!==true)throw bookingError(400,'Phải xác nhận thực nhận tiền cọc và chọn phương thức.')
    const reference=typeof body.reference==='string'?body.reference.trim():''
    if(reference.length>100||body.method!=='TienMat'&&!reference)throw bookingError(400,'Cần mã tham chiếu chuyển tiền tối đa 100 ký tự.')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id),deposit=await depositRow(client,booking.ma_lich_hen)
        if(!deposit)throw bookingError(404,'Lịch không áp dụng cọc.')
        const existing=(await client.query('SELECT * FROM deposit_transactions WHERE idempotency_key=$1',[key])).rows[0]
        if(existing){if(existing.booking_id!==deposit.booking_id||existing.kind!=='Collect'||existing.method!==body.method||existing.reference!==(reference||null))throw bookingError(409,'Khóa chống lặp đã dùng cho giao dịch khác.');return {message:'Cọc đã được ghi nhận.',replayed:true}}
        if(deposit.status!=='Unpaid'||!['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai))throw bookingError(409,'Không còn chờ thu cọc.')
        await client.query("INSERT INTO deposit_transactions(booking_id,kind,amount,method,reference,idempotency_key,actor,sandbox) VALUES($1,'Collect',$2,$3,$4,$5,$6,$7)",[deposit.booking_id,deposit.amount,body.method,reference||null,key,user.userId,await sandboxEnabled()])
        await client.query("UPDATE booking_deposits SET status='Paid' WHERE booking_id=$1",[deposit.booking_id])
        await client.query("UPDATE deposit_intents SET status='Cancelled' WHERE booking_id=$1 AND status='Pending'",[deposit.booking_id])
        await audit(client,booking,user,'thu-coc',booking.trang_thai,`Đã nhận cọc ${deposit.amount} VNĐ qua ${body.method}.`)
        await notify(client,booking.ma_khach_hang,id,'Đã nhận tiền cọc',`Lịch #${id}: cọc ${deposit.amount} VNĐ, chờ xác nhận.`)
        return {message:'Đã ghi nhận tiền cọc thực nhận.'}
    })
}
export async function refundDeposit(id,body,user) {
    const key=paymentKey(body?.key)
    if(body?.sandbox===true)await needSandbox()
    else if(body?.received!==true)throw bookingError(400,'Chỉ xác nhận hoàn khi đã thực tế trả tiền cho khách.')
    if(!['TienMat','ChuyenKhoanQR','MoMo'].includes(body?.method))throw bookingError(400,'Chọn phương thức hoàn cọc.')
    const reference=typeof body.reference==='string'?body.reference.trim():''
    if(!reference||reference.length>100)throw bookingError(400,'Cần chứng từ hoàn cọc tối đa 100 ký tự.')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id),deposit=await depositRow(client,booking.ma_lich_hen)
        if(!deposit)throw bookingError(404,'Không tìm thấy tiền cọc.')
        const existing=(await client.query('SELECT * FROM deposit_transactions WHERE idempotency_key=$1',[key])).rows[0]
        if(existing){if(existing.booking_id!==deposit.booking_id||existing.kind!=='Refund'||existing.method!==body.method||existing.reference!==reference)throw bookingError(409,'Khóa chống lặp đã dùng cho giao dịch khác.');return {message:'Đã hoàn cọc trước đó.',replayed:true}}
        if(deposit.status!=='RefundPending')throw bookingError(409,'Cọc chưa đủ điều kiện hoàn hoặc đã hoàn.')
        await client.query("INSERT INTO deposit_transactions(booking_id,kind,amount,method,reference,idempotency_key,actor,sandbox) VALUES($1,'Refund',$2,$3,$4,$5,$6,$7)",[id,deposit.amount,body.method,reference,key,user.userId,await sandboxEnabled()])
        await client.query("UPDATE booking_deposits SET status='Refunded' WHERE booking_id=$1",[id])
        await audit(client,booking,user,'hoan-coc',booking.trang_thai,`Đã thực chi hoàn cọc ${deposit.amount} VNĐ, chứng từ ${reference}.`)
        await notify(client,booking.ma_khach_hang,id,'Đã hoàn tiền cọc',`Đã hoàn đủ ${deposit.amount} VNĐ cho lịch #${id}.`)
        return {message:await sandboxEnabled()?'Đã hoàn cọc mô phỏng trong sandbox.':'Đã ghi nhận hoàn cọc thực chi.'}
    })
}
export async function decideDeposit(id,body,user) {
    if(!['no-show','exception-refund'].includes(body?.action))throw bookingError(400,'Thao tác cọc không hợp lệ.')
    const note=typeof body.reason==='string'?body.reason.trim():''
    if(!note||note.length>300)throw bookingError(400,'Cần lý do xử lý cọc từ 1–300 ký tự.')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id),deposit=await depositRow(client,booking.ma_lich_hen)
        if(!deposit||!['Paid','Forfeited'].includes(deposit.status)||deposit.invoice_id)throw bookingError(409,'Cọc không còn được xử lý theo chính sách hủy.')
        if(body.action==='no-show') {
            if(!['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai)||Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)>Date.now())throw bookingError(409,'Chỉ đánh dấu vắng khi đã đến giờ hẹn và chưa bắt đầu dịch vụ.')
            await cancelDeposit(client,booking,{noShow:true,actor:user.userId,reason:note})
        } else {
            if(!['ChoXacNhan','DaXacNhan','DaHuy','TuChoi'].includes(booking.trang_thai))throw bookingError(409,'Không hủy lịch đang chăm sóc hoặc đã hoàn thành theo chính sách cọc.')
            await client.query("UPDATE booking_deposits SET status='RefundPending',decision_reason=$2,decided_by=$3,decided_at=NOW() WHERE booking_id=$1",[id,note,user.userId])
        }
        await client.query("UPDATE lich_hen SET trang_thai='DaHuy',ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",[id])
        await client.query("UPDATE chi_tiet_lich_hen SET trang_thai='DaHuy' WHERE ma_lich_hen=$1",[id])
        await client.query("UPDATE deposit_intents SET status='Cancelled' WHERE booking_id=$1 AND status='Pending'",[id])
        await audit(client,booking,user,body.action,'DaHuy',note)
        await notify(client,booking.ma_khach_hang,id,'Xử lý tiền cọc',`${body.action==='no-show'?'Không đến không báo, cọc không hoàn':'Quản lý duyệt ngoại lệ hoàn đủ cọc, đang chờ chi'}. ${note}`)
        return {message:body.action==='no-show'?'Đã ghi nhận khách vắng và mất cọc.':'Đã duyệt hoàn đủ cọc theo ngoại lệ; chưa ghi thực chi.'}
    })
}
