import { randomBytes, randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import { query, withTransaction } from '../config/db.js'
import { lockedInvoice, totals } from './invoices.js'
import { bookingError } from './booking.js'
import { cents, decimal } from '../lib/money.js'
import { sandboxAllowed, callbackSignature, validCallback } from '../lib/paymentSandbox.js'
import { notify } from './notifications.js'

const secret = process.env.PAYMENT_SANDBOX_SECRET || randomBytes(48).toString('hex')
export async function sandboxEnabled() {
    if(process.env.NODE_ENV !== 'test' || process.env.PAYMENT_MODE !== 'sandbox') return false
    const database = (await query('SELECT current_database() AS name')).rows[0].name
    return sandboxAllowed(process.env,database)
}
async function requireSandbox() {
    if(!await sandboxEnabled()) throw bookingError(403,'Thanh toán mô phỏng chỉ chạy trên database test được chỉ định; không được bật trên dữ liệu thật.')
    const exists=(await query("SELECT to_regclass('public.payment_intents') IS NOT NULL AS present")).rows[0].present
    if(!exists) throw bookingError(409,'Database thử nghiệm chưa có migration 006. Chạy migration trên database test riêng trước.')
}
function ownership(bill,user) {
    if(user.role==='KhachHang' && bill.ma_khach_hang!==user.userId) throw bookingError(403,'Bạn không có quyền thanh toán hóa đơn này.')
}
function payable(bill) {
    if(!['ChuaThanhToan','ThanhToanMotPhan'].includes(bill.trang_thai)) throw bookingError(409,'Hóa đơn đã thanh toán, đã hủy hoặc đang hoàn tiền.')
}
async function publicIntent(row) {
    const payload=`PETCARE SANDBOX | ${row.method} | ${row.id} | ${row.amount} VND | KHONG CHUYEN TIEN THAT`
    return {id:row.id,invoiceId:row.invoice_id,method:row.method,amount:Number(row.amount),status:row.status,
        mode:'sandbox',expiresAt:row.expires_at,
        qr:row.method==='COD'?null:await QRCode.toDataURL(payload,{width:256,margin:2}),
        message:row.method==='COD'?'Thanh toán tiền mặt tại quầy khi nhận bé. Chỉ lễ tân xác nhận sau khi nhận tiền.':'Mã QR mô phỏng, không dùng để chuyển tiền thật.'}
}
export async function createIntent(invoiceId,body,user) {
    await requireSandbox()
    if(!['BankQR','MoMo','COD'].includes(body?.method)) throw bookingError(400,'Chọn QR ngân hàng, MoMo hoặc COD.')
    const row=await withTransaction(async client=>{
        const bill=await lockedInvoice(client,invoiceId); ownership(bill,user); payable(bill)
        const amount=cents(bill.thanh_tien)-(await totals(client,bill.ma_hoa_don)).paid
        if(amount<=0 || amount%100) throw bookingError(409,'Số tiền thanh toán phải là số đồng nguyên dương.')
        const open=(await client.query("SELECT * FROM payment_intents WHERE invoice_id=$1 AND status IN ('Pending','AwaitingCash') FOR UPDATE",[bill.ma_hoa_don])).rows[0]
        if(open && open.method===body.method && cents(open.amount)===amount && new Date(open.expires_at)>new Date()) return open
        if(open) await client.query("UPDATE payment_intents SET status=$2 WHERE id=$1",[open.id,new Date(open.expires_at)<=new Date()?'Expired':'Cancelled'])
        return (await client.query(`INSERT INTO payment_intents(id,invoice_id,created_by,method,amount,status,expires_at)
            VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '15 minutes') RETURNING *`,
            [randomUUID(),bill.ma_hoa_don,user.userId,body.method,decimal(amount),body.method==='COD'?'AwaitingCash':'Pending'])).rows[0]
    })
    return publicIntent(row)
}
export async function readIntent(id,user) {
    await requireSandbox()
    const row=(await query('SELECT * FROM payment_intents WHERE id=$1',[id])).rows[0]
    if(!row) throw bookingError(404,'Không tìm thấy yêu cầu thanh toán.')
    const result=await withTransaction(async client=>{
        const bill=await lockedInvoice(client,row.invoice_id);ownership(bill,user)
        const current=(await client.query('SELECT * FROM payment_intents WHERE id=$1 FOR UPDATE',[id])).rows[0]
        if(['Pending','AwaitingCash'].includes(current.status)) {
            let status=current.status
            if(new Date(current.expires_at)<=new Date()) status='Expired'
            if(bill.trang_thai==='DaThanhToan') status=current.method==='COD'?'Paid':'Cancelled'
            if(['DaHuy','DaHoanTien','HoanTienMotPhan'].includes(bill.trang_thai)) status='Cancelled'
            if(status!==current.status) return (await client.query('UPDATE payment_intents SET status=$2 WHERE id=$1 RETURNING *',[id,status])).rows[0]
        }
        return current
    })
    return publicIntent(result)
}
export async function settleCallback(body,signature) {
    await requireSandbox()
    if(!validCallback(body,signature,secret)) throw bookingError(401,'Chữ ký thông báo thanh toán không hợp lệ.')
    const initial=(await query('SELECT invoice_id FROM payment_intents WHERE id=$1',[body.intentId])).rows[0]
    if(!initial) throw bookingError(404,'Không tìm thấy yêu cầu thanh toán.')
    return withTransaction(async client=>{
        const bill=await lockedInvoice(client,initial.invoice_id)
        const row=(await client.query('SELECT * FROM payment_intents WHERE id=$1 FOR UPDATE',[body.intentId])).rows[0]
        if(row.method!==body.method || cents(row.amount)!==body.amount*100) throw bookingError(409,'Phương thức hoặc số tiền callback không khớp.')
        const next=body.result==='success'?'Paid':'Failed'
        if(row.event_id===body.eventId && row.status===next) return {success:true,replayed:true}
        if(row.status!=='Pending' || new Date(row.expires_at)<=new Date()) throw bookingError(409,'Yêu cầu đã hết hạn hoặc đã được xử lý.')
        if(body.result==='failed') {
            await client.query("UPDATE payment_intents SET status='Failed',event_id=$2,settled_at=NOW() WHERE id=$1",[row.id,body.eventId])
            return {success:true}
        }
        payable(bill)
        const paid=await totals(client,bill.ma_hoa_don),remaining=cents(bill.thanh_tien)-paid.paid,amount=cents(row.amount)
        if(amount>remaining) throw bookingError(409,'Công nợ đã thay đổi. Tạo yêu cầu thanh toán mới.')
        const transaction=(await client.query(`INSERT INTO thanh_toan(ma_hoa_don,phuong_thuc,so_tien,trang_thai,khoa_chong_lap,ma_giao_dich)
            VALUES($1,$2,$3,'ThanhCong',$4,$5) RETURNING ma_thanh_toan`,
            [bill.ma_hoa_don,row.method==='MoMo'?'MoMo':'ChuyenKhoanQR',row.amount,`sandbox:${row.id}`,body.eventId])).rows[0].ma_thanh_toan
        await client.query('UPDATE hoa_don SET trang_thai=$2 WHERE ma_hoa_don=$1',[bill.ma_hoa_don,amount===remaining?'DaThanhToan':'ThanhToanMotPhan'])
        await client.query("UPDATE payment_intents SET status='Paid',event_id=$2,transaction_id=$3,settled_at=NOW() WHERE id=$1",[row.id,body.eventId,transaction])
        await notify(client,bill.ma_khach_hang,bill.ma_lich_hen,'Thanh toán sandbox thành công',`Hóa đơn #${bill.ma_hoa_don}: ${row.amount} VNĐ (mô phỏng ${row.method}, không có tiền thật).`)
        return {success:true}
    })
}
export async function simulatePayment(id,result,user) {
    const intent=await readIntent(id,user)
    if(intent.method==='COD') throw bookingError(400,'COD chỉ được lễ tân ghi nhận tiền mặt sau khi nhận tiền.')
    if(!['success','failed'].includes(result)) throw bookingError(400,'Kết quả mô phỏng không hợp lệ.')
    const body={intentId:intent.id,eventId:`sandbox:${intent.id}`,method:intent.method,amount:intent.amount,result}
    return settleCallback(body,callbackSignature(body,secret))
}
