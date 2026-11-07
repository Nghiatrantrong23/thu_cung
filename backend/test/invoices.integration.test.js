import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getSafeConfig, ensureDatabase, loadMigrations, migrateDatabase } from '../scripts/db-tooling.js'

const testUrl = process.env.TEST_DATABASE_URL
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const date = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
async function freePort() {
    const socket = createServer()
    await new Promise((resolve, reject) => socket.once('error', reject).listen(0, '127.0.0.1', resolve))
    const port = socket.address().port
    await new Promise((resolve) => socket.close(resolve))
    return port
}

// No .env, deletes or drops. Retain a fresh, explicitly selected DB for audit.
test('invoices and payments stage 9 on isolated PostgreSQL', {
    skip: !testUrl && 'Set TEST_DATABASE_URL to a new local <project>_test_<unique> database.', timeout: 90000,
}, async (t) => {
    const database = decodeURIComponent(new URL(testUrl).pathname.slice(1))
    assert.match(database, /^[a-z][a-z0-9_]*_test_[a-z0-9_]+$/, 'A unique test database suffix is required.')
    const config = getSafeConfig({ NODE_ENV: 'test', DATABASE_URL: testUrl, PETCARE_ALLOW_DB_WRITE: database })
    await ensureDatabase(config)
    const db = new pg.Client(config)
    let child
    await db.connect()
    try {
        const existing = await db.query(`SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' LIMIT 1`)
        assert.equal(existing.rows.length, 0, 'Refusing a nonempty database; use a fresh test database name.')
        await migrateDatabase(db, await loadMigrations())
        const password = randomBytes(24).toString('base64url')
        const hash = await bcrypt.hash(password, 4)
        const f = {}
        async function account(key, role, phone, position) {
            const row = (await db.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro)
                VALUES ($1,$2,$3,$4) RETURNING ma_nguoi_dung`, [`fixture_${key}`, hash, phone, role])).rows[0]
            f[key] = row.ma_nguoi_dung
            if (role === 'KhachHang') await db.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES($1,$2)', [f[key], key])
            else await db.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,$2,$3)', [f[key], key, position])
        }
        await account('customer1', 'KhachHang', '0900000001')
        await account('customer2', 'KhachHang', '0900000002')
        await account('reception', 'NhanVien', '0900000003', 'Lễ tân')
        await account('carer1', 'NhanVien', '0900000004', 'Nhân viên chăm sóc')
        await account('carer2', 'NhanVien', '0900000005', 'Nhân viên chăm sóc')
        async function pet(owner, name, active = true) {
            return (await db.query(`INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung,trang_thai)
                VALUES($1,$2,'Mèo',$3) RETURNING ma_thu_cung`, [owner, name, active])).rows[0].ma_thu_cung
        }
        f.pet1 = await pet(f.customer1, 'fixture_pet1')
        f.pet2 = await pet(f.customer2, 'fixture_pet2')
        f.inactivePet = await pet(f.customer1, 'fixture_inactive_pet', false)
        const kind = (await db.query("INSERT INTO loai_dv(ten_loai_dv) VALUES('fixture_services') RETURNING ma_loai_dv")).rows[0].ma_loai_dv
        async function service(name) {
            return (await db.query(`INSERT INTO dich_vu(ma_loai_dv,ten_dv,gia_hien_hanh,thoi_luong_phut)
                VALUES($1,$2,100000,30) RETURNING ma_dv`, [kind, name])).rows[0].ma_dv
        }
        f.service = await service('fixture_30_minutes')
        f.failService = await service('fixture_forced_detail_failure')
        async function shift(staff, day, start = '08:00', end = '19:00') {
            await db.query('INSERT INTO ca_lam_viec(ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc) VALUES($1,$2,$3,$4)', [staff, day, start, end])
        }
        const days = { race: date(30), normal: date(31), empty: date(32), failure: date(33), assigned: date(34) }
        await shift(f.carer1, days.race, '09:00', '09:30')
        for (const day of [days.normal, days.failure, days.assigned]) {
            await shift(f.carer1, day)
            await shift(f.carer2, day)
        }
        async function assignedBooking(staff, start, end, petId) {
            return (await db.query(`INSERT INTO lich_hen(ma_thu_cung,ma_nhan_vien,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai)
                VALUES($1,$2,$3,$4,'DaXacNhan') RETURNING ma_lich_hen`, [petId, staff, `${days.assigned} ${start}`, `${days.assigned} ${end}`])).rows[0].ma_lich_hen
        }
        const assigned1 = await assignedBooking(f.carer1, '09:00', '09:30', f.pet1)
        const assigned2 = await assignedBooking(f.carer2, '09:30', '10:00', f.pet2)
        const jwtSecret = randomBytes(48).toString('hex')
        const port = await freePort()
        const base = `http://127.0.0.1:${port}`
        child = spawn(process.execPath, ['src/server.js'], {
            cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'ignore',
            env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test', PORT: String(port), DB_SSL: 'false',
                JWT_SECRET: jwtSecret, JWT_REFRESH_SECRET: randomBytes(48).toString('hex'), BCRYPT_ROUNDS: '4' },
        })
        let spawnError
        child.on('error', (error) => { spawnError = error })
        let healthy = false
        for (let attempt = 0; attempt < 150; attempt++) {
            if (spawnError) throw new Error(`Test server could not start (${spawnError.code}).`)
            if (child.exitCode != null) throw new Error('Test server exited before health check.')
            try { healthy = (await fetch(`${base}/health`)).ok } catch { /* Await startup. */ }
            if (healthy) break
            await delay(100)
        }
        assert.ok(healthy, 'Test server did not become healthy.')
        const token = (key) => jwt.sign({ type: 'access', version: 0, userId: f[key], role: key.startsWith('customer') ? 'KhachHang' : 'NhanVien' }, jwtSecret, { expiresIn: '5m' })
        async function call(path, { as = 'customer1', method = 'GET', body, authToken } = {}) {
            const response = await fetch(`${base}${path}`, { method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken || token(as)}` },
                body: body === undefined ? undefined : JSON.stringify(body),
            })
            return { status: response.status, body: await response.json() }
        }
        const online = (overrides = {}) => ({ thuCungId: f.pet1, ngay: days.normal, gioStart: '09:00', dichVuIds: [f.service], ...overrides })
        const counter = (overrides = {}) => ({ ...online(), khachHangId: f.customer1, sdt: '0900000001', ...overrides })
        const book = (body, as = 'customer1') => call('/api/lich-hen', { method: 'POST', body, as })
        const bookCounter = (body) => call('/api/lich-hen/tai-quay', { method: 'POST', body, as: 'reception' })
        async function counts() {
            return (await db.query(`SELECT (SELECT COUNT(*) FROM nguoi_dung) AS users,
                (SELECT COUNT(*) FROM khach_hang) AS customers,(SELECT COUNT(*) FROM thu_cung) AS pets,
                (SELECT COUNT(*) FROM lich_hen) AS bookings,(SELECT COUNT(*) FROM chi_tiet_lich_hen) AS details`)).rows[0]
        }
        async function completed(count=1) {
            const id=(await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai) VALUES($1,$2,$3,'HoanThanh') RETURNING ma_lich_hen",[f.pet1,`${days.normal} 08:00`,`${days.normal} 09:00`])).rows[0].ma_lich_hen
            for(const service of [f.service,f.failService].slice(0,count)) await db.query("INSERT INTO chi_tiet_lich_hen(ma_lich_hen,ma_dv,gia_du_kien,trang_thai) VALUES($1,$2,100000,'HoanThanh')",[id,service])
            return id
        }
        const create=(id,discount=0,as='reception')=>call('/api/hoa-don',{as,method:'POST',body:{maLichHen:id,giamGia:discount}})
        const pay=(id,body)=>call(`/api/hoa-don/${id}/thanh-toan`,{as:'reception',method:'POST',body})
        const payment=(amount,cash=amount)=>({soTien:amount,tienKhachDua:cash,phuongThuc:'TienMat',khoaChongLap:randomBytes(16).toString('hex')})
        await t.test('invoices require completed service details, reception permission and valid discount',async()=>{
            assert.equal((await create(assigned1)).status,409)
            const id=await completed()
            assert.equal((await create(id,0,'customer1')).status,403)
            assert.equal((await create(id,-1)).status,400)
            assert.equal((await create(id,100001)).status,400)
            const results=await Promise.all([create(id),create(id)])
            assert.deepEqual(results.map(row=>row.status).sort(),[201,409])
            assert.equal((await db.query('SELECT COUNT(*) AS count FROM hoa_don WHERE ma_lich_hen=$1',[id])).rows[0].count,'1')
        })
        await t.test('invoice item names/prices remain snapshots and read access stays owner-only',async()=>{
            const id=(await create(await completed())).body.id
            const before=(await call(`/api/hoa-don/${id}`)).body
            await db.query('UPDATE dich_vu SET ten_dv=$2,gia_hien_hanh=999999 WHERE ma_dv=$1',[f.service,'Changed catalog name'])
            const after=(await call(`/api/hoa-don/${id}`)).body
            assert.deepEqual(after.details,before.details)
            assert.equal((await call(`/api/hoa-don/${id}`,{as:'customer2'})).status,403)
            assert.equal((await call('/api/hoa-don',{as:'carer1'})).status,403)
            assert.deepEqual((await call('/api/hoa-don',{as:'customer2'})).body.hoaDon,[])
        })
        await t.test('partial cash payment records change, failed transfer leaves debt, confirmed transfer settles',async()=>{
            const id=(await create(await completed(2))).body.id
            const cash=await pay(id,payment(40000,100000))
            assert.equal(cash.status,200);assert.equal(cash.body.tienThua,60000)
            assert.equal((await call(`/api/hoa-don/${id}`)).body.remaining,160000)
            const transfer={soTien:160000,phuongThuc:'ChuyenKhoanQR',khoaChongLap:randomBytes(16).toString('hex')}
            assert.equal((await pay(id,transfer)).status,400)
            assert.equal((await pay(id,{...transfer,ketQua:'ThatBai'})).status,200)
            assert.equal((await call(`/api/hoa-don/${id}`)).body.remaining,160000)
            assert.equal((await pay(id,{...transfer,khoaChongLap:randomBytes(16).toString('hex'),daNhanTien:true})).status,200)
            const bill=(await call(`/api/hoa-don/${id}`)).body
            assert.equal(bill.remaining,0);assert.equal(bill.paid,200000);assert.equal(bill.invoice.trang_thai,'DaThanhToan')
        })
        await t.test('concurrent same-key payment creates one transaction; altered replay conflicts',async()=>{
            const id=(await create(await completed())).body.id
            const body=payment(100000)
            const results=await Promise.all([pay(id,body),pay(id,body)])
            assert.ok(results.every(row=>row.status===200));assert.equal(results.filter(row=>row.body.replayed).length,1)
            assert.equal((await db.query('SELECT COUNT(*) AS count FROM thanh_toan WHERE ma_hoa_don=$1',[id])).rows[0].count,'1')
            assert.equal((await pay(id,{...body,soTien:50000})).status,409)
        })
        await t.test('two distinct requests cannot overcollect the last remaining amount',async()=>{
            const id=(await create(await completed())).body.id
            const results=await Promise.all([pay(id,payment(100000)),pay(id,payment(100000))])
            assert.deepEqual(results.map(row=>row.status).sort(),[200,409])
            assert.equal((await call(`/api/hoa-don/${id}`)).body.paid,100000)
        })
        await t.test('zero invoice settles without zero-value transaction; QR clearly requires deferred configuration',async()=>{
            const id=(await create(await completed(),100000)).body.id
            const result=(await call(`/api/hoa-don/${id}`)).body
            assert.equal(result.invoice.trang_thai,'DaThanhToan');assert.equal(result.transactions.length,0)
            assert.equal((await pay(id,payment(1))).status,409)
            const qr=await call(`/api/hoa-don/${id}/qr`,{as:'reception'})
            assert.equal(qr.status,503);assert.equal(qr.body.code,'QR_NOT_CONFIGURED')
        })
        await t.test('invalid money and insufficient cash never create transactions',async()=>{
            const id=(await create(await completed())).body.id
            for(const body of [payment(0),payment(-1),payment(true),payment('1.001'),payment(100,50),{...payment(1),khoaChongLap:'short'}]) assert.equal((await pay(id,body)).status,400)
            assert.equal((await db.query('SELECT COUNT(*) AS count FROM thanh_toan WHERE ma_hoa_don=$1',[id])).rows[0].count,'0')
        })
        t.diagnostic(`Fixture database retained for audit: ${database}; no existing application database was used.`)
    } finally {
        if (child && child.exitCode == null) {
            child.kill()
            await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(3000)])
        }
        await db.end()
    }
})
