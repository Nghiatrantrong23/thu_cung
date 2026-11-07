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
test('auth and pet regression on isolated PostgreSQL', {
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
                JWT_SECRET: jwtSecret, JWT_REFRESH_SECRET: jwtSecret, BCRYPT_ROUNDS: '4' },
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
        await t.test('registration validates password, username and phone on the server', async () => {
            const good={username:'valid_regression',fullName:'Khách test',phone:'0900000020',email:'',password:randomBytes(15).toString('hex')}
            for(const change of [{password:'a'},{username:'!!'},{phone:'123'},{fullName:42},{email:{}}]) {
                const result=await call('/api/auth/dang-ky',{method:'POST',body:{...good,...change}})
                assert.equal(result.status,400)
            }
            const created=await call('/api/auth/dang-ky',{method:'POST',body:good})
            assert.equal(created.status,201)
            const record=(await db.query('SELECT nd.vai_tro,nd.mat_khau_hash,kh.ho_ten FROM nguoi_dung nd JOIN khach_hang kh ON kh.ma_khach_hang=nd.ma_nguoi_dung WHERE nd.ma_nguoi_dung=$1',[created.body.userId])).rows[0]
            assert.equal(record.vai_tro,'KhachHang');assert.ok(await bcrypt.compare(good.password,record.mat_khau_hash))
        })
        await t.test('malformed login input is a 400, not an internal error', async () => {
            assert.equal((await call('/api/auth/dang-nhap',{method:'POST',body:{tenDangNhap:[],matKhau:{}}})).status,400)
        })
        await t.test('JWT validates token purpose, signature, expiry and integer subject', async () => {
            const claims={userId:f.customer1,type:'access',version:0}
            const tokens=[
                jwt.sign({...claims,type:'refresh'},jwtSecret),
                jwt.sign({...claims,userId:'not-an-integer'},jwtSecret),
                jwt.sign({...claims,userId:2147483648},jwtSecret),
                jwt.sign(claims,'wrong-test-secret'),
                jwt.sign(claims,jwtSecret,{expiresIn:-1}),
            ]
            for(const token of tokens) assert.equal((await call('/api/auth/toi',{authToken:token})).status,401)
            const noAuth=await fetch(`${base}/api/auth/toi`)
            assert.equal(noAuth.status,401)
        })
        await t.test('a disabled employee profile cannot log in or use an old token', async () => {
            await db.query('UPDATE nhan_vien SET trang_thai=false WHERE ma_nhan_vien=$1',[f.carer1])
            assert.equal((await call('/api/auth/dang-nhap',{method:'POST',body:{tenDangNhap:'fixture_carer1',matKhau:password}})).status,403)
            assert.equal((await call('/api/lich-hen',{as:'carer1'})).status,403)
            await db.query('UPDATE nhan_vien SET trang_thai=true WHERE ma_nhan_vien=$1',[f.carer1])
        })
        await t.test('staff cannot create a customer profile by posting a pet', async () => {
            const result=await call('/api/thu-cung',{as:'carer1',method:'POST',body:{name:'Unauthorized pet',species:'Chó'}})
            assert.equal(result.status,403)
            assert.equal((await db.query('SELECT 1 FROM khach_hang WHERE ma_khach_hang=$1',[f.carer1])).rowCount,0)
        })
        await t.test('pet owner CRUD validates fields and prevents cross-owner access', async () => {
            const good={name:'Regression pet',species:'Mèo',gender:'Cái',birthDate:'2020-02-29',weightKg:3,healthNote:'Ghi chú demo'}
            for(const change of [{name:[]},{species:{}},{weightKg:true},{weightKg:-1},{gender:'unknown'},{birthDate:'2026-02-30'}])
                assert.equal((await call('/api/thu-cung',{method:'POST',body:{...good,...change}})).status,400)
            const created=await call('/api/thu-cung',{method:'POST',body:good})
            assert.equal(created.status,201)
            const id=created.body.pet.id
            assert.equal(created.body.pet.birthDate,'2020-02-29')
            assert.equal((await call(`/api/thu-cung/${id}`,{as:'customer2'})).status,403)
            assert.equal((await call(`/api/thu-cung/${id}`,{as:'customer2',method:'PUT',body:good})).status,403)
            assert.equal((await call(`/api/thu-cung/${id}/trang-thai`,{as:'customer2',method:'PATCH',body:{active:false}})).status,403)
            assert.equal((await call(`/api/thu-cung/${id}`,{method:'PUT',body:{...good,name:'Updated pet'}})).status,200)
            assert.equal((await call(`/api/thu-cung/${id}/trang-thai`,{method:'PATCH',body:{active:false}})).status,200)
            assert.equal((await call(`/api/thu-cung/${id}`,{method:'PUT',body:good})).status,400)
            assert.equal((await call(`/api/thu-cung/${id}/trang-thai`,{method:'PATCH',body:{active:true}})).status,200)
        })
        async function realLogin(username, secret) {
            const response=await fetch(`${base}/api/auth/dang-nhap`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenDangNhap:username,matKhau:secret})})
            return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}
        }
        async function refreshCookie(cookie) {
            const result=await fetch(`${base}/api/auth/lam-moi-token`,{method:'POST',headers:{Cookie:cookie}})
            return {status:result.status,body:await result.json()}
        }
        await t.test('refresh purpose is enforced even when test signing secrets match; logout revokes sessions', async()=>{
            const login=await realLogin('fixture_customer2',password)
            assert.equal(login.status,200)
            assert.equal((await refreshCookie(login.cookie)).status,200)
            assert.equal((await refreshCookie(`refreshToken=${login.body.accessToken}`)).status,401)
            const refresh=login.cookie.slice('refreshToken='.length)
            assert.equal((await call('/api/auth/toi',{authToken:refresh})).status,401)
            const logout=await fetch(`${base}/api/auth/dang-xuat`,{method:'POST',headers:{Cookie:login.cookie}})
            assert.equal(logout.status,200)
            assert.equal((await refreshCookie(login.cookie)).status,401)
            assert.equal((await call('/api/auth/toi',{authToken:login.body.accessToken})).status,401)
        })
        await t.test('password change revokes old access/refresh tokens and only accepts the new password',async()=>{
            const login=await realLogin('fixture_customer2',password)
            const next=randomBytes(18).toString('hex')
            const changed=await call('/api/auth/doi-mat-khau',{method:'POST',authToken:login.body.accessToken,body:{matKhauHienTai:password,matKhauMoi:next,xacNhanMatKhauMoi:next}})
            assert.equal(changed.status,200)
            assert.equal((await call('/api/auth/toi',{authToken:login.body.accessToken})).status,401)
            assert.equal((await refreshCookie(login.cookie)).status,401)
            assert.equal((await realLogin('fixture_customer2',password)).status,401)
            assert.equal((await realLogin('fixture_customer2',next)).status,200)
        })
        await t.test('new counter account gets a one-time temporary password and must change it before booking',async()=>{
            const created=await bookCounter(counter({thuCungId:null,khachHangId:null,sdt:'0900000044',hoTen:'Khách tạm',tenThuCung:'Demo temp',loaiThuCung:'Chó',gioStart:'17:00'}))
            assert.equal(created.status,201)
            const account=created.body.taiKhoanTam
            assert.equal(account.username,'0900000044');assert.ok(account.password.length>=8)
            const login=await realLogin(account.username,account.password)
            assert.equal(login.status,200);assert.equal(login.body.user.batDoiMatKhau,true)
            assert.equal((await call('/api/auth/toi',{authToken:login.body.accessToken})).status,200)
            const blocked=await call('/api/lich-hen',{authToken:login.body.accessToken})
            assert.equal(blocked.status,403);assert.equal(blocked.body.code,'PASSWORD_CHANGE_REQUIRED')
            const next=randomBytes(18).toString('hex')
            assert.equal((await call('/api/auth/doi-mat-khau',{method:'POST',authToken:login.body.accessToken,body:{matKhauHienTai:account.password,matKhauMoi:next,xacNhanMatKhauMoi:next}})).status,200)
            const relog=await realLogin(account.username,next)
            assert.equal(relog.body.user.batDoiMatKhau,false)
            assert.equal((await call('/api/lich-hen',{authToken:relog.body.accessToken})).status,200)
            const existing=await bookCounter(counter({gioStart:'18:00'}))
            assert.equal(existing.status,201);assert.equal(existing.body.taiKhoanTam,undefined)
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
