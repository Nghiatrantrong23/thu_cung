import { cents } from './money.js'
import { invalid } from './validation.js'

const clean=value=>typeof value==='string'?value.trim():''
export function transferConfig(env=process.env) {
    const enabled=env.PAYMENT_MODE==='transfer'
    const bankCode=clean(env.PAYMENT_BANK_CODE),accountNumber=clean(env.PAYMENT_BANK_ACCOUNT),accountName=clean(env.PAYMENT_BANK_NAME)
    const phoneNumber=clean(env.PAYMENT_MOMO_PHONE),momoName=clean(env.PAYMENT_MOMO_NAME)
    let receiveUrl=null
    try {
        const url=new URL(clean(env.PAYMENT_MOMO_RECEIVE_URL))
        if(url.protocol==='https:'&&url.hostname==='nhantien.momo.vn'&&url.pathname.length>1&&!url.username&&!url.password&&!url.port)receiveUrl=url.href
    } catch { /* A shared MoMo receive link is optional; phone transfer still works. */ }
    const bank=enabled&&/^[A-Za-z0-9]{2,20}$/.test(bankCode)&&/^[A-Za-z0-9]{1,19}$/.test(accountNumber)&&accountName.length>0&&accountName.length<=80
        ?{bankCode,accountNumber,accountName}:null
    const momo=enabled&&/^0\d{9}$/.test(phoneNumber)&&momoName.length>0&&momoName.length<=80
        ?{phoneNumber,accountName:momoName,receiveUrl}:null
    return {mode:enabled?'transfer':'unconfigured',methods:[...(bank?['BankQR']:[]),...(momo?['MoMo']:[]),'COD'],bank,momo}
}

export function transferInstructions({kind,id,amount,method},config=transferConfig()) {
    if(!['invoice','deposit'].includes(kind)||!Number.isSafeInteger(id)||id<=0)throw invalid('Mã hóa đơn hoặc lịch hẹn không hợp lệ.')
    if(!['BankQR','MoMo','COD'].includes(method)||kind==='deposit'&&method==='COD')throw invalid('Phương thức thanh toán không hợp lệ; tiền cọc không dùng COD.')
    const money=cents(amount)
    if(money<=0||money%100)throw invalid('Số tiền chuyển khoản phải là số đồng nguyên dương.')
    if(config.mode!=='transfer'||!config.methods.includes(method)) {
        const error=new Error('Chưa cấu hình phương thức nhận tiền này. Vui lòng liên hệ cửa hàng.')
        error.status=503;error.code='PAYMENT_NOT_CONFIGURED';throw error
    }
    const content=`PC${kind==='invoice'?'HD':'COC'}${id}`
    const result={kind,targetId:id,mode:'transfer',method,amount:money/100,content,
        status:method==='COD'?'AwaitingCash':'AwaitingReceipt',qr:null,
        message:method==='COD'?'Thanh toán tiền mặt tại quầy khi nhận bé. Lễ tân ghi nhận sau khi thực nhận.':'Chuyển đúng số tiền và nội dung. Cửa hàng kiểm tra thực nhận rồi mới xác nhận thanh toán.'}
    if(method==='BankQR') {
        Object.assign(result,config.bank)
        const url=new URL(`https://img.vietqr.io/image/${config.bank.bankCode}-${config.bank.accountNumber}-compact2.svg`)
        url.search=new URLSearchParams({amount:String(result.amount),addInfo:content,accountName:config.bank.accountName}).toString()
        result.qr=url.href
    }
    if(method==='MoMo') {
        Object.assign(result,config.momo)
        result.message='Mở MoMo, chuyển đến số điện thoại bên dưới và nhập đúng số tiền, nội dung. Cửa hàng xác nhận sau khi thực nhận.'
    }
    return result
}
