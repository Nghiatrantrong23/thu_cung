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
test('complaints and refunds stage 10 on isolated PostgreSQL', {
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
        await account('manager','NhanVien','0900000006','Quản lý')
        async function paidBill(amount=400000) {
            const booking=await completed()
            await db.query('UPDATE chi_tiet_lich_hen SET gia_du_kien=$2 WHERE ma_lich_hen=$1',[booking,amount])
            const bill=(await create(booking)).body.id
            assert.equal((await pay(bill,payment(amount))).status,200)
            return {booking,bill}
        }
        const receive=(booking,as='reception',bill)=>call('/api/khieu-nai',{as,method:'POST',body:{maLichHen:booking,maHoaDon:bill,noiDung:'Dịch vụ chưa đạt yêu cầu demo'}})
        const decide=(id,amount,decision='HoanTien',as='manager')=>call(`/api/khieu-nai/${id}/quyet-dinh`,{as,method:'PATCH',body:{quyetDinh:decision,soTienHoan:amount,phuongAn:'Kết luận sau kiểm tra và thống nhất với khách demo'}})
        const execute=(id,body,as='reception')=>call(`/api/khieu-nai/${id}/chi-hoan`,{as,method:'POST',body})
        const refund=()=>({khoaChongLap:randomBytes(16).toString('hex'),phuongThucChi:'TienMat',xacNhanDaChi:true,bangChung:'PC-DEMO-001'})
        await t.test('receipt and decision enforce roles and the invoice belongs to the booking',async()=>{
            const a=await paidBill(),b=await paidBill()
            assert.equal((await receive(a.booking,'customer1')).status,403)
            assert.equal((await receive(a.booking,'carer1')).status,403)
            assert.equal((await receive(a.booking,'reception',b.bill)).status,400)
            const id=(await receive(a.booking)).body.id
            assert.equal((await decide(id,100000,'HoanTien','reception')).status,403)
            assert.equal((await decide(id,100000,'HoanTien','customer1')).status,403)
            assert.deepEqual((await call('/api/khieu-nai',{as:'customer2'})).body.khieuNai,[])
        })
        await t.test('rejected and nonrefund complaints close without financial transactions',async()=>{
            const a=await paidBill()
            for(const decision of ['TuChoi','KhacPhuc']) {
                const id=(await receive(a.booking)).body.id
                assert.equal((await call(`/api/khieu-nai/${id}/quyet-dinh`,{as:'manager',method:'PATCH',body:{quyetDinh:decision,phuongAn:''}})).status,400)
                assert.equal((await decide(id,0,decision)).status,200)
                const row=(await db.query('SELECT trang_thai,quyet_dinh FROM khieu_nai WHERE ma_khieu_nai=$1',[id])).rows[0]
                assert.equal(row.trang_thai,'DaXuLy');assert.equal(row.quyet_dinh,decision)
                assert.equal((await execute(id,refund())).status,409)
            }
            assert.equal((await call(`/api/hoa-don/${a.bill}`)).body.refunded,0)
        })
        await t.test('approval is not payment; failed payout stays pending; 100000/400000 is a partial refund',async()=>{
            const a=await paidBill(),id=(await receive(a.booking)).body.id
            assert.equal((await decide(id,100000)).status,200)
            let data=(await call(`/api/hoa-don/${a.bill}`)).body
            assert.equal(data.refunded,0);assert.equal(data.invoice.trang_thai,'DaThanhToan')
            const body=refund()
            assert.equal((await execute(id,{...body,xacNhanDaChi:false})).status,400)
            assert.equal((await execute(id,{...body,ketQua:'ThatBai',loiChi:'Chuyển khoản demo bị lỗi',bangChung:''})).status,200)
            assert.equal((await db.query('SELECT trang_thai FROM khieu_nai WHERE ma_khieu_nai=$1',[id])).rows[0].trang_thai,'ChoHoanTien')
            assert.equal((await call(`/api/hoa-don/${a.bill}`)).body.refunded,0)
            const success=refund()
            assert.equal((await execute(id,success)).status,200)
            assert.equal((await execute(id,success)).body.replayed,true)
            data=(await call(`/api/hoa-don/${a.bill}`)).body
            assert.equal(data.refunded,100000);assert.equal(data.invoice.trang_thai,'HoanTienMotPhan')
            const next=(await receive(a.booking)).body.id
            assert.equal((await decide(next,300001)).status,400)
            assert.equal((await decide(next,300000)).status,200)
            assert.equal((await execute(next,refund())).status,200)
            data=(await call(`/api/hoa-don/${a.bill}`)).body
            assert.equal(data.refunded,400000);assert.equal(data.invoice.trang_thai,'DaHoanTien')
        })
        await t.test('pending approvals reserve refundable balance and concurrent payouts cannot exceed receipts',async()=>{
            const a=await paidBill(100000),first=(await receive(a.booking)).body.id,second=(await receive(a.booking)).body.id
            assert.equal((await decide(first,80000)).status,200)
            assert.equal((await decide(second,30000)).status,400)
            assert.equal((await decide(second,20000)).status,200)
            const results=await Promise.all([execute(first,refund()),execute(second,refund())])
            assert.ok(results.every(row=>row.status===200))
            assert.equal((await call(`/api/hoa-don/${a.bill}`)).body.refunded,100000)
        })
        await t.test('two payout requests for one approval produce one successful ledger entry',async()=>{
            const a=await paidBill(),id=(await receive(a.booking)).body.id
            await decide(id,50000)
            const results=await Promise.all([execute(id,refund()),execute(id,refund())])
            assert.deepEqual(results.map(row=>row.status).sort(),[200,409])
            assert.equal((await db.query("SELECT COUNT(*) AS count FROM thanh_toan WHERE ma_khieu_nai=$1 AND trang_thai='ThanhCong'",[id])).rows[0].count,'1')
        })
        await t.test('zero, negative, excessive and partially paid invoice refunds are rejected',async()=>{
            const a=await paidBill(),id=(await receive(a.booking)).body.id
            for(const amount of [0,-1,400001,true])assert.equal((await decide(id,amount)).status,400)
            const booking=await completed(),bill=(await create(booking)).body.id
            await pay(bill,payment(50000))
            const partial=(await receive(booking)).body.id
            assert.equal((await decide(partial,10000)).status,409)
        })
        await t.test('failed notification rolls successful payout, complaint and invoice state back together',async()=>{
            const a=await paidBill(),id=(await receive(a.booking)).body.id
            await decide(id,50000)
            await db.query(`CREATE FUNCTION fixture_refund_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.ma_lich_hen=${a.booking} THEN RAISE EXCEPTION 'PRIVATE_REFUND_DETAIL'; END IF;RETURN NEW;END $$`)
            await db.query('CREATE TRIGGER fixture_refund_failure BEFORE INSERT ON thong_bao FOR EACH ROW EXECUTE FUNCTION fixture_refund_failure()')
            const result=await execute(id,refund())
            assert.equal(result.status,500);assert.doesNotMatch(JSON.stringify(result.body),/PRIVATE_REFUND_DETAIL|INSERT|stack/)
            assert.equal((await call(`/api/hoa-don/${a.bill}`)).body.refunded,0)
            assert.equal((await db.query('SELECT trang_thai FROM khieu_nai WHERE ma_khieu_nai=$1',[id])).rows[0].trang_thai,'ChoHoanTien')
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
