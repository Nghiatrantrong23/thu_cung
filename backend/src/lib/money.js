import { invalid } from './validation.js'
// NUMERIC(12,2) fits exactly in safe integer cents. Never add binary floats as money.
export function cents(value,label='Số tiền') {
    if (!['string','number'].includes(typeof value)||!/^\d{1,10}(?:\.\d{1,2})?$/.test(String(value))) throw invalid(`${label} không hợp lệ.`)
    const [whole,fraction='']=String(value).split('.')
    const result=Number(whole)*100+Number(fraction.padEnd(2,'0'))
    if (!Number.isSafeInteger(result)||result>999999999999) throw invalid(`${label} vượt giới hạn.`)
    return result
}
export function decimal(value) {
    if(!Number.isSafeInteger(value)||value<0||value>999999999999) throw invalid('Tổng tiền vượt giới hạn.')
    return `${Math.floor(value/100)}.${String(value%100).padStart(2,'0')}`
}
export function paymentKey(value) {
    if(typeof value!=='string'||!/^[A-Za-z0-9._:-]{16,100}$/.test(value)) throw invalid('Thiếu mã chống lặp hợp lệ.')
    return value
}
