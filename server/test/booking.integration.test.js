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
test('booking HTTP acceptance on a new isolated PostgreSQL database', {
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
        const token = (key) => jwt.sign({ userId: f[key], role: key.startsWith('customer') ? 'KhachHang' : 'NhanVien' }, jwtSecret, { expiresIn: '5m' })
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
        await t.test('real bcrypt login succeeds with a random fixture password', async () => {
            const response = await call('/api/auth/dang-nhap', { method: 'POST', body: { tenDangNhap: 'fixture_customer1', matKhau: password } })
            assert.equal(response.status, 200)
            assert.equal(typeof response.body.accessToken, 'string')
            assert.equal((await call('/api/lich-hen', { authToken: response.body.accessToken })).status, 200)
        })
        await t.test('two requests for the final slot yield exactly one 201 and one 409', async () => {
            const responses = await Promise.all([book(online({ ngay: days.race })), book(online({ ngay: days.race, thuCungId: f.pet2 }), 'customer2')])
            assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409])
            const winner = responses.find((r) => r.status === 201)
            const row = (await db.query('SELECT ma_nhan_vien,trang_thai FROM lich_hen WHERE ma_lich_hen=$1', [winner.body.lichHenId])).rows[0]
            assert.equal(row.ma_nhan_vien, null, 'Feasibility must not secretly assign staff.')
            assert.equal(row.trang_thai, 'ChoXacNhan')
        })
        await t.test('a day without care shifts has no slots and rejects booking', async () => {
            const slots = await call(`/api/lich-hen/khung-gio-trong?ngay=${days.empty}&thoiLuong=30`)
            assert.deepEqual(slots.body.slots, [])
            assert.equal((await book(online({ ngay: days.empty }))).status, 409)
        })
        await t.test('strict validation and customer ownership are enforced through HTTP', async () => {
            for (const change of [{ ngay: '2027-02-30' }, { ngay: '2020-01-01' }, { gioStart: '9:00' }, { gioStart: '09:15' },
                { gioStart: '19:00' }, { dichVuIds: [f.service, f.service] }, { dichVuIds: ['1oops'] }]) {
                assert.equal((await book(online(change))).status, 400, JSON.stringify(change))
            }
            assert.equal((await call(`/api/lich-hen/khung-gio-trong?ngay=${days.normal}&thoiLuong=30oops`)).status, 400)
            assert.equal((await book(online({ thuCungId: f.pet2 }))).status, 403)
        })
        await t.test('care staff cannot create counter bookings, cancel, or look up customers', async () => {
            assert.equal((await call('/api/lich-hen/tai-quay', { method: 'POST', as: 'carer1', body: counter() })).status, 403)
            assert.equal((await call(`/api/lich-hen/${assigned1}/huy`, { method: 'PATCH', as: 'carer1' })).status, 403)
            assert.equal((await call('/api/khach-hang/tra-cuu?sdt=0900000001', { as: 'carer1' })).status, 403)
            assert.equal((await call('/api/khach-hang/tra-cuu?sdt=0900000001')).status, 403)
        })
        await t.test('counter rejects inactive pets and a phone belonging to staff', async () => {
            assert.equal((await bookCounter(counter({ thuCungId: f.inactivePet }))).status, 403)
            assert.equal((await bookCounter(counter({ khachHangId: null, sdt: '0900000004', thuCungId: null,
                tenThuCung: 'must_not_create', loaiThuCung: 'Chó', hoTen: 'Not customer' }))).status, 403)
        })
        await t.test('no capacity rolls back the entire new customer and pet creation', async () => {
            const before = await counts()
            assert.equal((await bookCounter(counter({ ngay: days.empty, khachHangId: null, sdt: '0900000101',
                thuCungId: null, tenThuCung: 'rollback_no_slots', loaiThuCung: 'Mèo', hoTen: 'Rollback test' }))).status, 409)
            assert.deepEqual(await counts(), before)
        })
        await t.test('forced detail INSERT failure rolls back ALL records and exposes no diagnostics', async () => {
            // Fault injection is limited to one service in this new fixture DB.
            await db.query(`CREATE FUNCTION fixture_reject_detail() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN IF NEW.ma_dv=${f.failService} THEN RAISE EXCEPTION 'PRIVATE_FIXTURE_SQL_DETAIL'; END IF; RETURN NEW; END $$`)
            await db.query(`CREATE TRIGGER fixture_detail_failure BEFORE INSERT ON chi_tiet_lich_hen FOR EACH ROW EXECUTE FUNCTION fixture_reject_detail()`)
            const before = await counts()
            const response = await bookCounter(counter({ ngay: days.failure, khachHangId: null, sdt: '0900000102',
                thuCungId: null, tenThuCung: 'rollback_detail_failure', loaiThuCung: 'Chó', hoTen: 'Rollback detail', dichVuIds: [f.failService] }))
            assert.equal(response.status, 500)
            assert.deepEqual(await counts(), before)
            assert.doesNotMatch(JSON.stringify(response.body), /PRIVATE_FIXTURE_SQL_DETAIL|fixture_reject_detail|INSERT|stack|mat_khau_hash/i)
            assert.deepEqual(Object.keys(response.body), ['error'])
        })
        await t.test('care list only contains appointments assigned to that employee', async () => {
            const response = await call('/api/lich-hen', { as: 'carer1' })
            assert.equal(response.status, 200)
            assert.deepEqual(response.body.lichHen.map((row) => row.id), [assigned1])
            assert.ok(!response.body.lichHen.some((row) => row.id === assigned2))
        })
        await t.test('valid counter booking creates a pending appointment and priced detail', async () => {
            const response = await bookCounter(counter({ gioStart: '11:00' }))
            assert.equal(response.status, 201)
            const row = (await db.query(`SELECT lh.trang_thai,lh.ma_nhan_vien,ct.gia_du_kien,ct.so_luong
                FROM lich_hen lh JOIN chi_tiet_lich_hen ct USING(ma_lich_hen) WHERE lh.ma_lich_hen=$1`, [response.body.lichHenId])).rows[0]
            assert.equal(row.trang_thai, 'ChoXacNhan')
            assert.equal(row.ma_nhan_vien, null)
            assert.equal(Number(row.gia_du_kien), 100000)
            assert.equal(row.so_luong, 1)
        })
        await t.test('out-of-range integer IDs return validation errors', async () => {
            assert.equal((await book(online({ thuCungId: 2147483648 }))).status, 400)
            assert.equal((await book(online({ dichVuIds: [2147483648] }))).status, 400)
        })
        await t.test('care staff can only inspect pets assigned to them', async () => {
            assert.equal((await call(`/api/thu-cung/${f.pet1}`, { as: 'carer1' })).status, 200)
            assert.equal((await call(`/api/thu-cung/${f.pet2}`, { as: 'carer1' })).status, 403)
        })
        await t.test('pet deactivation and booking serialize without an inactive booked pet', async () => {
            const newPet = await pet(f.customer1, 'fixture_race_pet')
            const [booking, status] = await Promise.all([
                book(online({ thuCungId: newPet, gioStart: '13:00' })),
                call(`/api/thu-cung/${newPet}/trang-thai`, { method: 'PATCH', body: { active: false } }),
            ])
            assert.ok((booking.status === 201 && status.status === 400) || (booking.status === 403 && status.status === 200), JSON.stringify([booking, status]))
            const state = (await db.query('SELECT trang_thai,(SELECT COUNT(*) FROM lich_hen WHERE ma_thu_cung=$1) AS bookings FROM thu_cung WHERE ma_thu_cung=$1', [newPet])).rows[0]
            assert.ok(state.trang_thai || Number(state.bookings) === 0)
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
