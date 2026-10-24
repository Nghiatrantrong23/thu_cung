import crypto from 'node:crypto'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'

/**
 * Sinh mật khẩu tạm ngẫu nhiên.
 * Dùng crypto.randomInt để tránh modulo bias của randomBytes.
 * Luôn bảo đảm có chữ hoa, chữ thường và số.
 */
export function generateMatKhauTam(length = 12) {
    if (!Number.isInteger(length) || length < 1 || length > 72) throw new RangeError('Độ dài mật khẩu không hợp lệ.')
    const len = Math.max(8, length)

    const nhom = [
        'ABCDEFGHJKLMNPQRSTUVWXYZ',      // hoa (không I, O)
        'abcdefghijkmnopqrstuvwxyz',     // thường (không l)
        '23456789',                      // số
        CHARSET,                         // đặc biệt (cho phần dư)
    ]

    const chars = []
    for (const nhomKyTu of nhom.slice(0, 3)) {
        chars.push(nhomKyTu[crypto.randomInt(nhomKyTu.length)])
    }

    const tatCa = CHARSET
    while (chars.length < len) {
        chars.push(tatCa[crypto.randomInt(tatCa.length)])
    }

    // Trộn ngẫu nhiên (Fisher–Yates với crypto.randomInt)
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1)
            ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }

    return chars.join('')
}

/**
 * Kiểm tra độ mạnh mật khẩu.
 * @returns {{ hopLe: boolean, loi: string[] }}
 */
export function kiemTraMatKhau(password) {
    const loi = []

    if (!password || password.length < 8) {
        loi.push('Mật khẩu phải có ít nhất 8 ký tự')
    }
    if (!/[A-Z]/.test(password || '')) {
        loi.push('Mật khẩu phải có ít nhất 1 chữ hoa')
    }
    if (!/[a-z]/.test(password || '')) {
        loi.push('Mật khẩu phải có ít nhất 1 chữ thường')
    }
    if (!/[0-9]/.test(password || '')) {
        loi.push('Mật khẩu phải có ít nhất 1 chữ số')
    }

    return { hopLe: loi.length === 0, loi }
}