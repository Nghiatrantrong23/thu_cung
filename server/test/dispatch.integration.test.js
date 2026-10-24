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
test('dispatch stage 7 HTTP acceptance on a new isolated PostgreSQL database', {
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
        const act = (id, body, as = 'reception') => call(`/api/lich-hen/${id}/xu-ly`, { method: 'PATCH', body, as })
        const candidates = (id, as = 'reception') => call(`/api/lich-hen/${id}/nhan-vien-kha-dung`, { as })
        const allocate = (id, staff, as) => act(id, { hanhDong: 'phan-cong', nhanVienId: staff }, as)
        const state = async (id) => (await db.query('SELECT trang_thai,ma_nhan_vien,ghi_chu FROM lich_hen WHERE ma_lich_hen=$1', [id])).rows[0]
        async function pending(time, day = days.normal) {
            const response = await book(online({ ngay: day, gioStart: time }))
            assert.equal(response.status, 201, JSON.stringify(response.body))
            return response.body.lichHenId
        }
        await account('manager', 'NhanVien', '0900000006', 'Quản lý')
        await db.query("INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro) VALUES('fixture_admin',$1,'0900000007','Admin')", [hash])
        f.admin = (await db.query("SELECT ma_nguoi_dung FROM nguoi_dung WHERE ten_dang_nhap='fixture_admin'")).rows[0].ma_nguoi_dung
        await t.test('only reception, manager and Admin may read candidates or process appointments', async () => {
            const id = await pending('08:00')
            for (const who of ['customer1','carer1','carer2']) {
                assert.equal((await candidates(id,who)).status,403)
                assert.equal((await allocate(id,f.carer1,who)).status,403)
            }
            for (const who of ['reception','manager','admin']) assert.equal((await candidates(id,who)).status,200)
            assert.equal((await allocate(id,f.carer1,'manager')).status,200)
            assert.equal((await allocate(id,f.carer2,'admin')).status,409)
        })
        await t.test('two pending jobs assigned concurrently to one staff yield one 200 and one 409', async () => {
            const a = await pending('09:00'), b = await pending('09:00')
            const results = await Promise.all([allocate(a,f.carer1),allocate(b,f.carer1)])
            assert.deepEqual(results.map(r=>r.status).sort(),[200,409])
            const loser = results[0].status === 409 ? a : b
            const staff = await candidates(loser)
            assert.deepEqual(staff.body.nhanVien.map(s=>s.id),[f.carer2])
            assert.equal((await allocate(loser,f.carer2)).status,200)
        })
        await t.test('hold requires a note and preserves pending status and no assignment', async () => {
            const id = await pending('10:00')
            assert.equal((await act(id,{hanhDong:'giu-cho',lyDo:' '})).status,400)
            assert.equal((await act(id,{hanhDong:'giu-cho',lyDo:'Chờ trao đổi khách hàng',nhanVienId:f.carer1})).status,200)
            const row = await state(id)
            assert.equal(row.trang_thai,'ChoXacNhan'); assert.equal(row.ma_nhan_vien,null)
            assert.match(row.ghi_chu,/Chờ trao đổi khách hàng/)
        })
        await t.test('rejection requires reason, releases capacity, cancels details, cannot be allocated later', async () => {
            const id = await pending('09:00',days.race)
            assert.equal((await act(id,{hanhDong:'tu-choi'})).status,400)
            assert.equal((await act(id,{hanhDong:'tu-choi',lyDo:'Không thể phục vụ',nhanVienId:f.carer1})).status,200)
            const row = await state(id)
            assert.equal(row.trang_thai,'TuChoi'); assert.equal(row.ma_nhan_vien,null)
            assert.equal((await db.query('SELECT trang_thai FROM chi_tiet_lich_hen WHERE ma_lich_hen=$1',[id])).rows[0].trang_thai,'DaHuy')
            assert.equal((await allocate(id,f.carer1)).status,409)
            const slots = await call(`/api/lich-hen/khung-gio-trong?ngay=${days.race}&thoiLuong=30`)
            assert.ok(slots.body.slots.includes('09:00'))
        })
        await t.test('outside shift, occupied and wrong-position staff are rejected', async () => {
            const id = await pending('09:00',days.assigned)
            assert.deepEqual((await candidates(id)).body.nhanVien.map(s=>s.id),[f.carer2])
            assert.equal((await allocate(id,f.carer1)).status,409)
            assert.equal((await allocate(id,f.reception)).status,409)
            const short = await pending('09:00',days.race)
            assert.equal((await allocate(short,f.carer2)).status,409)
            await db.query('UPDATE nhan_vien SET trang_thai=false WHERE ma_nhan_vien=$1',[f.carer1])
            assert.deepEqual((await candidates(short)).body.nhanVien,[])
            await db.query('UPDATE nhan_vien SET trang_thai=true WHERE ma_nhan_vien=$1',[f.carer1])
        })
        await t.test('notification failure rolls assignment and all notifications back', async () => {
            const id = await pending('12:00')
            const before = (await db.query('SELECT COUNT(*) AS count FROM thong_bao WHERE ma_lich_hen=$1',[id])).rows[0].count
            await db.query(`CREATE FUNCTION fixture_dispatch_failure() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN IF NEW.ma_lich_hen=${id} THEN RAISE EXCEPTION 'PRIVATE_DISPATCH_DETAIL'; END IF; RETURN NEW; END $$`)
            await db.query('CREATE TRIGGER fixture_dispatch_failure BEFORE INSERT ON thong_bao FOR EACH ROW EXECUTE FUNCTION fixture_dispatch_failure()')
            const result = await allocate(id,f.carer1)
            assert.equal(result.status,500)
            assert.doesNotMatch(JSON.stringify(result.body),/PRIVATE_DISPATCH_DETAIL|INSERT|stack/i)
            const row = await state(id)
            assert.equal(row.trang_thai,'ChoXacNhan'); assert.equal(row.ma_nhan_vien,null)
            assert.equal((await db.query('SELECT COUNT(*) AS count FROM thong_bao WHERE ma_lich_hen=$1',[id])).rows[0].count,before)
        })
        await t.test('staff cancellation requires reason; double cancel conflicts and preserves history', async () => {
            const id = await pending('13:00')
            assert.equal((await allocate(id,f.carer1)).status,200)
            const path = `/api/lich-hen/${id}/huy`
            assert.equal((await call(path,{method:'PATCH',as:'reception'})).status,400)
            const body = {lyDo:'Khách báo không đến'}
            const result = await Promise.all([call(path,{method:'PATCH',as:'reception',body}),call(path,{method:'PATCH',as:'reception',body})])
            assert.deepEqual(result.map(r=>r.status).sort(),[200,409])
            const row = await state(id)
            assert.equal(row.trang_thai,'DaHuy');assert.match(row.ghi_chu,/Khách báo không đến/)
            assert.equal((await db.query('SELECT trang_thai FROM chi_tiet_lich_hen WHERE ma_lich_hen=$1',[id])).rows[0].trang_thai,'DaHuy')
        })
        await t.test('customer cancellation stays owner-only and supports existing request without reason', async () => {
            const id = await pending('14:00')
            const path = `/api/lich-hen/${id}/huy`
            assert.equal((await call(path,{method:'PATCH',as:'customer2'})).status,403)
            assert.equal((await call(path,{method:'PATCH'})).status,200)
        })
        await t.test('new booking and allocation notify reception, customer and employee; reads are owner-only', async () => {
            const id = await pending('15:00')
            assert.equal((await allocate(id,f.carer2,'admin')).status,200)
            for (const who of ['reception','manager','admin','customer1','carer2']) {
                const result = await call('/api/thong-bao',{as:who})
                assert.equal(result.status,200)
                assert.ok(result.body.thongBao.some(item=>item.bookingId===id),who)
            }
            const own = (await call('/api/thong-bao')).body.thongBao.find(item=>item.bookingId===id)
            assert.equal(own.read,false)
            const path=`/api/thong-bao/${own.id}/da-doc`
            assert.equal((await call(path,{method:'PATCH',as:'customer2'})).status,404)
            assert.equal((await call(path,{method:'PATCH'})).status,200)
            assert.equal((await call('/api/thong-bao')).body.thongBao.find(item=>item.id===own.id).read,true)
            assert.deepEqual((await call('/api/thong-bao',{as:'customer2'})).body.thongBao,[])
        })
        await t.test('single booking concurrent rejection and assignment cannot both succeed', async () => {
            const id=await pending('16:00')
            const results=await Promise.all([allocate(id,f.carer1),act(id,{hanhDong:'tu-choi',lyDo:'Khách không thể đến'})])
            assert.deepEqual(results.map(r=>r.status).sort(),[200,409])
            assert.ok(['DaXacNhan','TuChoi'].includes((await state(id)).trang_thai))
        })
        await t.test('invalid actions, ID, notes and missing employee fail safely', async () => {
            const id=await pending('17:00')
            for(const body of [{hanhDong:'unknown'},{hanhDong:'phan-cong'},{hanhDong:'tu-choi',lyDo:5},{hanhDong:'giu-cho',lyDo:'x'.repeat(301)}])
                assert.equal((await act(id,body)).status,400)
            assert.equal((await candidates('2147483648')).status,400)
            assert.equal((await candidates(2147483647)).status,404)
            assert.equal((await state(id)).trang_thai,'ChoXacNhan')
        })
        await t.test('candidate selection preserves feasibility for all pending bookings', async () => {
            const day=date(35)
            await shift(f.carer1,day,'08:00','12:00');await shift(f.carer2,day,'08:00','10:00')
            await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien) VALUES($1,$2,$3)",[f.pet1,`${day} 08:00`,`${day} 11:00`])
            const row=(await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien) VALUES($1,$2,$3) RETURNING ma_lich_hen",[f.pet2,`${day} 08:00`,`${day} 09:00`])).rows[0]
            assert.deepEqual((await candidates(row.ma_lich_hen)).body.nhanVien.map(s=>s.id),[f.carer2])
            assert.equal((await allocate(row.ma_lich_hen,f.carer1)).status,409)
            assert.equal((await allocate(row.ma_lich_hen,f.carer2)).status,200)
        })
        await t.test('partial shifts and locked employee accounts cannot be assigned', async () => {
            const day=date(36)
            await shift(f.carer1,day,'08:00','09:00')
            const id=(await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien) VALUES($1,$2,$3) RETURNING ma_lich_hen",[f.pet1,`${day} 08:30`,`${day} 09:30`])).rows[0].ma_lich_hen
            assert.deepEqual((await candidates(id)).body.nhanVien,[])
            assert.equal((await allocate(id,f.carer1)).status,409)
            const short = await pending('18:00')
            await db.query('UPDATE nguoi_dung SET trang_thai=false WHERE ma_nguoi_dung=$1',[f.carer1])
            assert.deepEqual((await candidates(short)).body.nhanVien.map(s=>s.id),[f.carer2])
            assert.equal((await allocate(short,f.carer1)).status,409)
            await db.query('UPDATE nguoi_dung SET trang_thai=true WHERE ma_nguoi_dung=$1',[f.carer1])
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
