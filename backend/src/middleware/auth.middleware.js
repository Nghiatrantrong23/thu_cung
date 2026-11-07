import { validClaims } from '../lib/validation.js'
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
        if (!validClaims(decoded, 'access')) return res.status(401).json({ error: 'Invalid token claims' })

        // Verify user still exists and is active
        const result = await query(
            `SELECT nd.ma_nguoi_dung, nd.ten_dang_nhap, nd.email, nd.vai_tro, nd.trang_thai,
                    COALESCE((to_jsonb(nd)->>'token_version')::int,0) AS token_version,
                    COALESCE((to_jsonb(nd)->>'bat_doi_mat_khau')::boolean,false) AS bat_doi_mat_khau,
                    nv.ho_ten as nhan_vien_ho_ten, nv.chuc_vu, nv.trang_thai AS staff_active,
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

        if (decoded.version !== user.token_version) return res.status(401).json({error:'Phiên đăng nhập đã hết hiệu lực.'})
        if (!user.trang_thai || (user.vai_tro === 'NhanVien' && user.staff_active !== true)) {
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

        if (user.bat_doi_mat_khau && !['/toi','/doi-mat-khau'].includes(req.path)) return res.status(403).json({error:'Vui lòng đổi mật khẩu tạm trước khi sử dụng.',code:'PASSWORD_CHANGE_REQUIRED'})
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

/** Reception/management permissions depend on the position read from the DB,
 * not a role or position supplied by the client. */
export function canManageAppointments(user) {
    return user?.role === 'Admin'
        || (user?.role === 'NhanVien' && ['Lễ tân', 'Quản lý'].includes(user.chucVu))
}

function checkPermission(req, res, next, allowed) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    if (!allowed) {
        return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' })
    }
    return next()
}

export function requireReception(req, res, next) {
    return checkPermission(req, res, next, canManageAppointments(req.user))
}

export function requireManager(req, res, next) {
    return checkPermission(req,res,next,req.user?.role==='Admin' || (req.user?.role==='NhanVien' && req.user.chucVu==='Quản lý'))
}
export function requireCare(req,res,next) {
    return checkPermission(req,res,next,req.user?.role==='NhanVien' && req.user.chucVu==='Nhân viên chăm sóc')
}

// Customers still need ownership checks in the controller.
export function requireCustomerOrReception(req, res, next) {
    return checkPermission(req, res, next,
        req.user?.role === 'KhachHang' || canManageAppointments(req.user))
}

// Care staff may read only their assigned appointments (controller filter).
export function requireAppointmentReader(req, res, next) {
    return checkPermission(req, res, next,
        req.user?.role === 'KhachHang'
        || canManageAppointments(req.user)
        || (req.user?.role === 'NhanVien' && req.user.chucVu === 'Nhân viên chăm sóc'))
}
