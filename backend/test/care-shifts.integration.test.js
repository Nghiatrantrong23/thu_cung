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
test('shifts and care stage 8 on isolated PostgreSQL', {
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
        await account('manager','NhanVien','0900000006','Quản lý')
        const allocate=(id,staff)=>call(`/api/lich-hen/${id}/xu-ly`,{as:'reception',method:'PATCH',body:{hanhDong:'phan-cong',nhanVienId:staff}})
        const care=(id,body,as='carer1')=>call(`/api/lich-hen/${id}/cham-soc`,{as,method:'PATCH',body})
        const shiftBody=(day,start='08:00',end='19:00')=>({nhanVienId:f.carer1,ngay:day,gioBatDau:start,gioKetThuc:end})
        const today=(await db.query("SELECT to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
        await shift(f.carer1,today)
        async function todayBooking(start,end,serviceIds=[f.service]) {
            const id=(await db.query("INSERT INTO lich_hen(ma_thu_cung,ma_nhan_vien,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai) VALUES($1,$2,$3,$4,'DaXacNhan') RETURNING ma_lich_hen",[f.pet1,f.carer1,`${today} ${start}`,`${today} ${end}`])).rows[0].ma_lich_hen
            for(const sid of serviceIds) await db.query('INSERT INTO chi_tiet_lich_hen(ma_lich_hen,ma_dv,gia_du_kien) VALUES($1,$2,100000)',[id,sid])
            return id
        }
        await t.test('shift writes are manager-only; care reads own shifts; overlap is rejected',async()=>{
            const day=date(40)
            for(const who of ['customer1','carer1','reception']) assert.equal((await call('/api/ca-lam-viec',{as:who,method:'POST',body:shiftBody(day)})).status,403)
            assert.equal((await call('/api/ca-lam-viec',{as:'manager',method:'POST',body:shiftBody(day,'08:00','12:00')})).status,201)
            assert.equal((await call('/api/ca-lam-viec',{as:'manager',method:'POST',body:shiftBody(day,'11:00','13:00')})).status,409)
            const own=await call(`/api/ca-lam-viec?ngay=${today}`,{as:'carer2'})
            assert.equal(own.status,200);assert.deepEqual(own.body.caLam,[])
            assert.equal((await call(`/api/ca-lam-viec?ngay=${today}`)).status,403)
        })
        await t.test('shrinking/canceling shifts preserves pending capacity and assigned appointments',async()=>{
            const a=await book(online()),b=await book(online())
            assert.equal(a.status,201);assert.equal(b.status,201)
            const id=(await db.query('SELECT ma_ca_lam_viec FROM ca_lam_viec WHERE ma_nhan_vien=$1 AND ngay=$2',[f.carer1,days.normal])).rows[0].ma_ca_lam_viec
            assert.equal((await call(`/api/ca-lam-viec/${id}`,{as:'manager',method:'PATCH',body:shiftBody(days.normal,'08:00','09:00')})).status,409)
            assert.equal((await allocate(a.body.lichHenId,f.carer1)).status,200)
            assert.equal((await call(`/api/ca-lam-viec/${id}/huy`,{as:'manager',method:'POST'})).status,409)
            assert.equal((await call(`/api/lich-hen/${a.body.lichHenId}/huy`,{as:'reception',method:'PATCH',body:{lyDo:'Khách demo hủy'}})).status,200)
            assert.equal((await call(`/api/ca-lam-viec/${id}/huy`,{as:'manager',method:'POST'})).status,200)
            assert.equal((await db.query('SELECT trang_thai FROM ca_lam_viec WHERE ma_ca_lam_viec=$1',[id])).rows[0].trang_thai,false)
            assert.equal((await call('/api/ca-lam-viec',{as:'manager',method:'POST',body:shiftBody(days.normal)})).status,201)
        })
        await t.test('care is assigned-only; details must progress before appointment completes',async()=>{
            const id=await todayBooking('08:00','09:00',[f.service,f.failService])
            assert.equal((await care(id,{hanhDong:'bat-dau'},'carer2')).status,403)
            assert.equal((await care(id,{hanhDong:'bat-dau'},'manager')).status,403)
            assert.equal((await care(id,{hanhDong:'hoan-thanh'})).status,409)
            assert.equal((await care(id,{hanhDong:'bat-dau'})).status,200)
            assert.equal((await care(id,{hanhDong:'hoan-thanh'})).status,409)
            assert.equal((await care(id,{hanhDong:'dich-vu',maDichVu:f.service,trangThai:'HoanThanh'})).status,409)
            for(const service of [f.service,f.failService]) {
                assert.equal((await care(id,{hanhDong:'dich-vu',maDichVu:service,trangThai:'DangThucHien'})).status,200)
                assert.equal((await care(id,{hanhDong:'dich-vu',maDichVu:service,trangThai:'HoanThanh',ghiChu:'Chăm sóc xong, khỏe mạnh'})).status,200)
            }
            assert.equal((await care(id,{hanhDong:'hoan-thanh',ghiChu:'Bàn giao lễ tân'})).status,200)
            assert.equal((await db.query('SELECT trang_thai FROM lich_hen WHERE ma_lich_hen=$1',[id])).rows[0].trang_thai,'HoanThanh')
            assert.equal((await care(id,{hanhDong:'khong-du-dieu-kien',ghiChu:'Không được đi nhánh này'})).status,409)
            const history=await call(`/api/lich-hen/${id}/nhat-ky`)
            assert.equal(history.status,200);assert.ok(history.body.nhatKy.some(row=>row.action==='hoan-thanh'))
            assert.equal((await call(`/api/lich-hen/${id}/nhat-ky`,{as:'customer2'})).status,403)
            assert.equal((await call(`/api/lich-hen/${id}/nhat-ky`,{as:'carer2'})).status,403)
            for(const stars of [1.5,'3x',true]) assert.equal((await call(`/api/lich-hen/${id}/danh-gia`,{method:'POST',body:{stars}})).status,400)
            assert.equal((await call(`/api/lich-hen/${id}/danh-gia`,{method:'POST',body:{stars:5,comment:'Chăm sóc tốt'}})).status,201)
        })
        await t.test('ineligible branch alerts reception, never auto-cancels, and rescheduling returns to pending',async()=>{
            const id=await todayBooking('10:00','11:00')
            assert.equal((await care(id,{hanhDong:'khong-du-dieu-kien',ghiChu:''})).status,400)
            assert.equal((await care(id,{hanhDong:'khong-du-dieu-kien',ghiChu:'Thú cưng bị bệnh'})).status,200)
            assert.equal((await db.query('SELECT trang_thai FROM lich_hen WHERE ma_lich_hen=$1',[id])).rows[0].trang_thai,'DaXacNhan')
            assert.equal((await care(id,{hanhDong:'bat-dau'})).status,409)
            const notes=(await call('/api/thong-bao',{as:'reception'})).body.thongBao
            assert.ok(notes.some(row=>row.bookingId===id&&row.title.includes('không đủ')))
            const moved=await call(`/api/lich-hen/${id}/doi-lich`,{as:'reception',method:'PATCH',body:{ngay:days.normal,gioStart:'14:00',lyDo:'Khách đồng ý chăm sóc vào ngày khác'}})
            assert.equal(moved.status,200)
            const row=(await db.query('SELECT trang_thai,ma_nhan_vien,yeu_cau_xu_ly FROM lich_hen WHERE ma_lich_hen=$1',[id])).rows[0]
            assert.equal(row.trang_thai,'ChoXacNhan');assert.equal(row.ma_nhan_vien,null);assert.equal(row.yeu_cau_xu_ly,null)
            assert.equal((await care(id,{hanhDong:'bat-dau'})).status,403)
        })
        await t.test('full original note does not prevent cancel; reason is retained in audit',async()=>{
            const result=await book(online({gioStart:'16:00',ghiChu:'x'.repeat(500)}))
            assert.equal(result.status,201)
            const id=result.body.lichHenId
            assert.equal((await call(`/api/lich-hen/${id}/huy`,{method:'PATCH'})).status,200)
            assert.equal((await db.query('SELECT ghi_chu FROM lich_hen WHERE ma_lich_hen=$1',[id])).rows[0].ghi_chu.length,500)
            assert.match((await call(`/api/lich-hen/${id}/nhat-ky`)).body.nhatKy[0].note,/Khách hàng yêu cầu/)
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
