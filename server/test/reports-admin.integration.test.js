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
test('reports catalog and administration stage 11 on isolated PostgreSQL', {
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
        f.admin=(await db.query("INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro) VALUES('fixture_admin',$1,'0900000007','Admin') RETURNING ma_nguoi_dung",[hash])).rows[0].ma_nguoi_dung
        const today=(await db.query("SELECT to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS date")).rows[0].date
        const report=(from=today,to=from,as='manager')=>call(`/api/bao-cao/doanh-thu?tuNgay=${from}&denNgay=${to}`,{as})
        const admin=(path,method='POST',body)=>call(`/api/admin/tai-khoan${path}`,{as:'admin',method,body})
        await t.test('reports enforce manager/Admin permission and strict date ranges',async()=>{
            for(const who of ['customer1','carer1','reception'])assert.equal((await report(today,today,who)).status,403)
            assert.equal((await report(today,today,'admin')).status,200)
            assert.equal((await report('bad',today)).status,400)
            assert.equal((await report('2026-12-31','2026-01-01')).status,400)
            assert.equal((await report('2020-01-01','2026-01-01')).status,400)
        })
        await t.test('report counts actual successful receipt/refund dates and never multiplies invoice lines by payments',async()=>{
            const booking=await completed(2),bill=(await create(booking)).body.id
            await pay(bill,payment(50000));await pay(bill,payment(150000))
            const data=(await call(`/api/hoa-don/${bill}`)).body
            assert.equal(data.invoice.date.slice(0,10),today,'App timestamp must use the Vietnamese business date')
            const baseline=(await report()).body
            assert.equal(baseline.collected,200000);assert.equal(baseline.net,200000)
            assert.equal(Number(baseline.invoices.count),1);assert.equal(Number(baseline.invoices.gross),200000)
            assert.equal(baseline.services.reduce((sum,row)=>sum+Number(row.gross),0),200000)
            const complaint=(await call('/api/khieu-nai',{as:'reception',method:'POST',body:{maLichHen:booking,noiDung:'Đề nghị hoàn demo'}})).body.id
            assert.equal((await call(`/api/khieu-nai/${complaint}/quyet-dinh`,{as:'manager',method:'PATCH',body:{quyetDinh:'HoanTien',soTienHoan:40000,phuongAn:'Hoàn một phần'}})).status,200)
            assert.equal((await report()).body.refunded,0)
            assert.equal((await call(`/api/khieu-nai/${complaint}/chi-hoan`,{as:'reception',method:'POST',body:{khoaChongLap:randomBytes(16).toString('hex'),phuongThucChi:'TienMat',xacNhanDaChi:true,bangChung:'REPORT-DEMO'}})).status,200)
            const net=(await report()).body
            assert.equal(net.refunded,40000);assert.equal(net.net,160000)
            const yesterday=new Date(Date.parse(`${today}T00:00:00Z`)-86400000).toISOString().slice(0,10)
            await db.query('UPDATE hoa_don SET ngay_lap=$2::date WHERE ma_hoa_don=$1',[bill,yesterday])
            const cashDate=(await report()).body
            assert.equal(cashDate.collected,200000);assert.equal(Number(cashDate.invoices.count),0)
            assert.equal((await report(yesterday)).body.collected,0)
        })
        await t.test('catalog is manager-only, public prices are real, disabling keeps snapshots',async()=>{
            const body={ten:'New catalog service',moTa:'Mô tả demo',maLoaiDichVu:kind,gia:'123.45',thoiLuongPhut:45,dangKinhDoanh:true}
            assert.equal((await call('/api/dich-vu',{as:'reception',method:'POST',body})).status,403)
            assert.equal((await call('/api/dich-vu',{as:'manager',method:'POST',body:{...body,thoiLuongPhut:0}})).status,400)
            const created=await call('/api/dich-vu',{as:'manager',method:'POST',body})
            assert.equal(created.status,201)
            const list=(await call('/api/dich-vu')).body.dichVu
            assert.equal(list.find(row=>row.id===created.body.id).gia,123.45)
            assert.equal((await call(`/api/dich-vu/${created.body.id}`,{as:'manager',method:'PATCH',body:{...body,dangKinhDoanh:false}})).status,200)
            assert.ok(!(await call('/api/dich-vu')).body.dichVu.some(row=>row.id===created.body.id))
            assert.equal((await db.query('SELECT COUNT(*) AS count FROM dich_vu WHERE ma_dv=$1',[created.body.id])).rows[0].count,'1')
        })
        await t.test('Admin account creation uses valid positions and returns a strong one-time password',async()=>{
            const body={tenDangNhap:'fixture_new_employee',hoTen:'Nhân viên demo',soDienThoai:'0900000040',email:'',chucVu:'Nhân viên chăm sóc'}
            assert.equal((await call('/api/admin/tai-khoan',{as:'manager',method:'POST',body})).status,403)
            assert.equal((await admin('','POST',{...body,chucVu:'Groomer'})).status,400)
            const created=await admin('','POST',body)
            assert.equal(created.status,201);assert.equal(created.body.data.matKhauTam.length,12)
            const list=await admin('','GET')
            assert.ok(Array.isArray(list.body.data));assert.ok(list.body.data.some(row=>row.maNguoiDung===created.body.data.maNguoiDung))
            const reset=await admin(`/${created.body.data.maNguoiDung}/dat-lai-mat-khau`)
            assert.equal(reset.status,200);assert.equal(reset.body.data.matKhauTam.length,12)
        })
        await t.test('self lock/demotion is blocked and role changes create profiles without deleting history',async()=>{
            assert.equal((await admin(`/${f.admin}/khoa`)).status,400)
            assert.equal((await admin(`/${f.admin}`,'PATCH',{vaiTro:'KhachHang'})).status,400)
            assert.equal((await admin(`/${f.customer2}`,'PATCH',{vaiTro:'NhanVien',chucVu:'Lễ tân',hoTen:'Nhân viên từ hồ sơ khách'})).status,200)
            assert.equal((await db.query('SELECT 1 FROM nhan_vien WHERE ma_nhan_vien=$1',[f.customer2])).rowCount,1)
            assert.equal((await db.query('SELECT 1 FROM khach_hang WHERE ma_khach_hang=$1',[f.customer2])).rowCount,1)
            assert.equal((await admin(`/${f.customer2}`,'PATCH',{vaiTro:'KhachHang',hoTen:'Tên khách mới'})).status,200)
            const login=await call('/api/auth/dang-nhap',{method:'POST',body:{tenDangNhap:'fixture_customer2',matKhau:password}})
            assert.equal(login.status,200);assert.equal(login.body.user.hoTen,'Tên khách mới')
        })
        await t.test('locking an assigned caregiver requires confirmation and preserves all existing capacity',async()=>{
            const start=await admin(`/${f.carer1}/khoa`)
            assert.equal(start.status,409);assert.equal(start.body.warning,true)
            assert.equal((await admin(`/${f.carer1}`,'PATCH',{vaiTro:'KhachHang'})).status,409)
            const ids=[]
            for(let i=0;i<2;i++)ids.push((await db.query('INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien) VALUES($1,$2,$3) RETURNING ma_lich_hen',[f.pet1,`${days.normal} 09:00`,`${days.normal} 09:30`])).rows[0].ma_lich_hen)
            assert.equal((await admin(`/${f.carer1}/khoa`,'POST',{xacNhan:true})).status,409)
            assert.equal((await db.query('SELECT trang_thai FROM nguoi_dung WHERE ma_nguoi_dung=$1',[f.carer1])).rows[0].trang_thai,true)
            for(const id of ids)assert.equal((await call(`/api/lich-hen/${id}/huy`,{as:'reception',method:'PATCH',body:{lyDo:'Giải phóng fixture'}})).status,200)
            assert.equal((await admin(`/${f.carer1}/khoa`,'POST',{xacNhan:true})).status,200)
            const row=(await db.query('SELECT trang_thai,ma_nhan_vien FROM lich_hen WHERE ma_lich_hen=$1',[assigned1])).rows[0]
            assert.equal(row.trang_thai,'ChoXacNhan');assert.equal(row.ma_nhan_vien,null)
            assert.equal((await admin(`/${f.carer1}/mo-khoa`)).status,200)
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
