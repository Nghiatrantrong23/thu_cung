import QRCode from 'qrcode'
import { withTransaction } from '../config/db.js'
import { lockedInvoice,totals } from './invoices.js'
import { lockedBooking } from './dispatch.js'
import { depositRow } from './depositStore.js'
import { bookingError } from './booking.js'
import { cents,decimal } from '../lib/money.js'
import { transferConfig,transferInstructions } from '../lib/paymentTransfers.js'

export function manualPaymentConfig() {
    const config=transferConfig()
    return {mode:config.mode,methods:config.methods,confirmation:'staff',bank:config.bank,momo:config.momo}
}
function ownership(owner,user) {
    if(user.role==='KhachHang'&&owner!==user.userId)throw bookingError(403,'Bạn không có quyền thanh toán hóa đơn hoặc cọc này.')
}
function requireTransferMethod(method,kind) {
    if(!['BankQR','MoMo','COD'].includes(method)||kind==='deposit'&&method==='COD')throw bookingError(400,'Phương thức thanh toán không hợp lệ; cọc không dùng COD.')
    const config=transferConfig()
    if(config.mode!=='transfer'||!config.methods.includes(method)) {
        const error=bookingError(503,'Chưa cấu hình phương thức nhận tiền. Vui lòng liên hệ cửa hàng.')
        error.code=method==='BankQR'?'QR_NOT_CONFIGURED':'PAYMENT_NOT_CONFIGURED';throw error
    }
}
async function present(kind,id,amount,method) {
    const result=transferInstructions({kind,id,amount,method})
    // Only an actual receive link exported by the wallet is encoded. Do not
    // invent personal MoMo payloads or send recipient details to a QR service.
    if(method==='MoMo'&&result.receiveUrl)result.qr=await QRCode.toDataURL(result.receiveUrl,{width:256,margin:2})
    return result
}
export async function invoiceTransfer(id,method,user) {
    requireTransferMethod(method,'invoice')
    return withTransaction(async client=>{
        const bill=await lockedInvoice(client,id);ownership(bill.ma_khach_hang,user)
        if(bill.trang_thai==='DaThanhToan')return {mode:'transfer',kind:'invoice',targetId:bill.ma_hoa_don,status:'Paid',amount:0,method,qr:null}
        if(!['ChuaThanhToan','ThanhToanMotPhan'].includes(bill.trang_thai))throw bookingError(409,'Hóa đơn không còn chờ thanh toán.')
        const remaining=cents(bill.thanh_tien)-(await totals(client,bill.ma_hoa_don)).paid
        return present('invoice',bill.ma_hoa_don,decimal(remaining),method)
    })
}
export async function depositTransfer(id,method,user) {
    requireTransferMethod(method,'deposit')
    return withTransaction(async client=>{
        const booking=await lockedBooking(client,id);ownership(booking.ma_khach_hang,user)
        const deposit=await depositRow(client,booking.ma_lich_hen)
        if(!deposit)throw bookingError(404,'Lịch hẹn này không áp dụng tiền đặt cọc.')
        if(['Paid','Applied'].includes(deposit.status))return {mode:'transfer',kind:'deposit',targetId:booking.ma_lich_hen,status:'Paid',amount:0,method,qr:null}
        if(deposit.status!=='Unpaid'||!['ChoXacNhan','DaXacNhan'].includes(booking.trang_thai))throw bookingError(409,'Lịch không còn chờ đóng cọc.')
        if(Date.parse(`${booking.date}T${booking.start_time}:00+07:00`)<=Date.now())throw bookingError(409,'Đã đến giờ hẹn; liên hệ cửa hàng để xử lý tiền cọc.')
        return present('deposit',booking.ma_lich_hen,deposit.amount,method)
    })
}
