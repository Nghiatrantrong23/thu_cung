import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { query } from '../config/db.js'

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.accessToken

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' })
        }

        const decoded = jwt.verify(token, env.jwt.secret)

        // Verify user still exists and is active
        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap, nd.email, nd.vai_tro, nd.trang_thai,
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu,
                    kh.ho_ten as khach_hang_ho_ten
             FROM nguoi_dung nd
             LEFT JOIN nhan_vien nv ON nd.ma_nguoi_dung = nv.ma_nhan_vien
             LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
             WHERE nd.ma_nguoi_dung = $1`,
            [decoded.userId]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' })
        }

        const user = result.rows[0]

        if (!user.trang_thai) {
            return res.status(403).json({ error: 'Account is locked' })
        }

        req.user = {
            userId: user.ma_nguoi_dung,
            username: user.ten_dang_nhap,
            email: user.email,
            role: user.vai_tro,
            hoTen: user.nhan_vien_ho_ten || user.khach_hang_ho_ten,
            chucVu: user.chuc_vu,
        }

        next()
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' })
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' })
        }
        next(err)
    }
}

/**
 * Require specific roles
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' })
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                required: allowedRoles,
                current: req.user.role
            })
        }

        next()
    }
}

/**
 * Require Admin role specifically
 */
export function requireAdmin(req, res, next) {
    return requireRole('Admin')(req, res, next)
}
