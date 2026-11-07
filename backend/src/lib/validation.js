export function invalid(message) { return Object.assign(new Error(message), { status: 400 }) }
export function string(value, label, max, required = true) {
    if (value == null && !required) return ''
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw invalid(`${label} không hợp lệ.`)
    return value.trim()
}
export function password(value) {
    if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72)
        throw invalid('Mật khẩu cần ít nhất 8 ký tự, tối đa 72 byte UTF-8.')
    return value
}
export function phone(value, required = true) {
    const result = string(value, 'Số điện thoại', 10, required)
    if (result && !/^\d{10}$/.test(result)) throw invalid('Số điện thoại phải gồm đúng 10 chữ số.')
    return result
}
export function email(value) {
    const result = string(value, 'Email', 100, false)
    if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw invalid('Email không hợp lệ.')
    return result || null
}
export function validClaims(claims, purpose) {
    return claims && claims.type === purpose && Number.isInteger(claims.userId) && claims.userId > 0
        && claims.userId <= 2147483647 && Number.isInteger(claims.version) && claims.version >= 0
}
