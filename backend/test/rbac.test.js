import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    canManageAppointments,
    requireReception,
    requireCustomerOrReception,
    requireAppointmentReader,
} from '../src/middleware/auth.middleware.js'
import appointmentRoutes from '../src/routes/lichhen.routes.js'

const users = {
    customer: { userId: 10, role: 'KhachHang' },
    care: { userId: 11, role: 'NhanVien', chucVu: 'Nhân viên chăm sóc' },
    reception: { userId: 12, role: 'NhanVien', chucVu: 'Lễ tân' },
    manager: { userId: 13, role: 'NhanVien', chucVu: 'Quản lý' },
    admin: { userId: 14, role: 'Admin' },
    missingPosition: { userId: 15, role: 'NhanVien' },
    unknownPosition: { userId: 16, role: 'NhanVien', chucVu: 'Không hợp lệ' },
    forgedPosition: { userId: 17, role: 'KhachHang', chucVu: 'Quản lý' },
    unknownRole: { userId: 18, role: 'manager', chucVu: 'Quản lý' },
}

function runGuard(guard, user) {
    const result = { status: 200, continued: false, body: null }
    const req = {
        user,
        // Client-supplied privileges must never override the authenticated user.
        body: { role: 'Admin', chucVu: 'Quản lý' },
        query: { role: 'Admin', chucVu: 'Quản lý' },
    }
    const res = {
        status(code) { result.status = code; return this },
        json(body) { result.body = body; return this },
    }
    guard(req, res, () => { result.continued = true })
    return result
}

describe('Quyền theo vai trò và chức vụ đã xác thực', () => {
    it('chỉ Admin, lễ tân, quản lý có quyền điều phối', () => {
        for (const [name, user] of Object.entries(users)) {
            assert.equal(canManageAppointments(user), ['reception', 'manager', 'admin'].includes(name), name)
        }
        assert.equal(canManageAppointments(undefined), false)
    })

    const policies = [
        ['tại quầy/tra khách', requireReception, ['reception', 'manager', 'admin']],
        ['hủy lịch/giờ trống', requireCustomerOrReception, ['customer', 'forgedPosition', 'reception', 'manager', 'admin']],
        ['đọc lịch', requireAppointmentReader, ['customer', 'forgedPosition', 'care', 'reception', 'manager', 'admin']],
    ]

    for (const [label, guard, allowedUsers] of policies) {
        it(`${label}: chưa đăng nhập trả 401`, () => {
            const result = runGuard(guard)
            assert.equal(result.status, 401)
            assert.equal(result.continued, false)
        })
        for (const [name, user] of Object.entries(users)) {
            it(`${label}: ${name}`, () => {
                const result = runGuard(guard, user)
                const allowed = allowedUsers.includes(name)
                assert.equal(result.continued, allowed)
                assert.equal(result.status, allowed ? 200 : 403)
                if (!allowed) assert.equal(typeof result.body.error, 'string')
            })
        }
    }
})

describe('Route lịch hẹn áp dụng kiểm tra quyền trước controller', () => {
    const routePolicies = [
        ['get', '/:id/nhan-vien-kha-dung', ['reception', 'manager', 'admin']],
        ['patch', '/:id/xu-ly', ['reception', 'manager', 'admin']],
        ['post', '/', ['customer', 'forgedPosition']],
        ['post', '/tai-quay', ['reception', 'manager', 'admin']],
        ['patch', '/:id/huy', ['customer', 'forgedPosition', 'reception', 'manager', 'admin']],
        ['get', '/khung-gio-trong', ['customer', 'forgedPosition', 'reception', 'manager', 'admin']],
        ['get', '/', ['customer', 'forgedPosition', 'care', 'reception', 'manager', 'admin']],
        ['post', '/:id/danh-gia', ['customer', 'forgedPosition']],
    ]
    for (const [method, path, allowedUsers] of routePolicies) {
        it(`${method.toUpperCase()} ${path} chặn đúng nhóm quyền`, () => {
            const route = appointmentRoutes.stack.find(layer => layer.route?.path === path && layer.route.methods[method])?.route
            assert.ok(route, 'Route phải tồn tại')
            assert.ok(route.stack.length >= 2, 'Kiểm tra quyền phải đứng trước controller')
            for (const [name, user] of Object.entries(users)) {
                const result = runGuard(route.stack[0].handle, user)
                assert.equal(result.continued, allowedUsers.includes(name), name)
                assert.equal(result.status, allowedUsers.includes(name) ? 200 : 403, name)
            }
        })
    }
})
