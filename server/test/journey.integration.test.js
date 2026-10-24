import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { getSafeConfig, ensureDatabase, loadMigrations, migrateDatabase } from '../scripts/db-tooling.js'

const testUrl = process.env.TEST_DATABASE_URL
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
test('complete customer-to-refund journey through real HTTP and real role logins', {
    skip: !testUrl && 'Select a fresh isolated TEST_DATABASE_URL.', timeout: 90000,
}, async t => {
    const database = decodeURIComponent(new URL(testUrl).pathname.slice(1))
    assert.match(database, /^[a-z][a-z0-9_]*_test_[a-z0-9_]+$/)
    const config = getSafeConfig({ NODE_ENV: 'test', DATABASE_URL: testUrl, PETCARE_ALLOW_DB_WRITE: database })
    await ensureDatabase(config)
    const db = new pg.Client(config)
    let child
    await db.connect()
    try {
        assert.equal((await db.query("SELECT 1 FROM pg_tables WHERE schemaname='public'")).rowCount, 0)
        await migrateDatabase(db, await loadMigrations())
        const password = `Fixture-${randomBytes(16).toString('hex')}`
        const hash = await bcrypt.hash(password, 4), staff = {}, tokens = {}
        // Bootstrap identities only. Every business transition below uses HTTP.
        for (const [i, [key, position]] of Object.entries([['manager','Quản lý'],['reception','Lễ tân'],['care','Nhân viên chăm sóc']])) {
            const id = (await db.query("INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro) VALUES($1,$2,$3,'NhanVien') RETURNING ma_nguoi_dung", [key,hash,`091000000${i}`])).rows[0].ma_nguoi_dung
            await db.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,$2,$3)',[id,key,position])
            staff[key] = id
        }
        const today = (await db.query("SELECT to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
        const clockDir = fileURLToPath(new URL('../../.cache/test-clocks/',import.meta.url))
        await mkdir(clockDir,{recursive:true})
        const clock = `${clockDir}/${database}.txt`
        async function setClock(time) {
            // Atomic replacement: a concurrent request must never read a truncated clock file.
            await writeFile(`${clock}.next`,`${today}T${time}:00+07:00`)
            await rename(`${clock}.next`,clock)
        }
        await setClock('09:00')
        const socket = createServer()
        await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve))
        const port = socket.address().port
        await new Promise(resolve=>socket.close(resolve))
        child = spawn(process.execPath,['--import','./test/fixtures/fixed-clock.js','src/server.js'],{
            cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,stdio:'ignore',
            env:{...process.env,NODE_ENV:'test',DATABASE_URL:testUrl,PORT:String(port),DB_SSL:'false',
                JWT_SECRET:randomBytes(48).toString('hex'),JWT_REFRESH_SECRET:randomBytes(48).toString('hex'),
                JWT_EXPIRES_IN:'2h',BCRYPT_ROUNDS:'4',TEST_CLOCK_FILE:clock},
        })
        const base=`http://127.0.0.1:${port}`
        let healthy=false
        for(let i=0;i<100;i++) {try{healthy=(await fetch(`${base}/health`)).ok}catch{} if(healthy)break;await delay(100)}
        assert.ok(healthy)
        assert.equal((await fetch(`${base}/ready`)).status,200)
        async function call(path,as,method='GET',body) {
            const response=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json',...(tokens[as]?{Authorization:`Bearer ${tokens[as]}`}:{})},body:body===undefined?undefined:JSON.stringify(body)})
            return {status:response.status,body:await response.json()}
        }
        async function ok(path,as,method,body,status=200) {const result=await call(path,as,method,body);assert.equal(result.status,status,`${method||'GET'} ${path}: ${JSON.stringify(result.body)}`);return result.body}
        let pet, service, booking, invoice, complaint
        await t.test('register and log in using actual passwords for four roles',async()=>{
            await ok('/auth/dang-ky',null,'POST',{username:'journey_customer',fullName:'Khách hành trình',phone:'0920000000',email:'',password},201)
            for(const name of ['manager','reception','care','customer']) {
                const login=await ok('/auth/dang-nhap',null,'POST',{tenDangNhap:name==='customer'?'journey_customer':name,matKhau:password})
                assert.ok(login.accessToken);tokens[name]=login.accessToken
            }
        })
        await t.test('manager creates service and shift; owner creates pet',async()=>{
            const kind=await ok('/dich-vu/loai','manager','POST',{ten:'Nhóm hành trình'},201)
            service=(await ok('/dich-vu','manager','POST',{ten:'Chăm sóc hành trình',maLoaiDichVu:kind.id,gia:400000,thoiLuongPhut:60,dangKinhDoanh:true},201)).id
            await ok('/ca-lam-viec','manager','POST',{nhanVienId:staff.care,ngay:today,gioBatDau:'08:00',gioKetThuc:'19:00'},201)
            const createdPet=(await ok('/thu-cung','customer','POST',{name:'Miu hành trình',species:'Mèo',gender:'Cái',weightKg:3},201)).pet
            assert.equal(createdPet.weightKg,3);pet=createdPet.id
        })
        await t.test('customer books and reception assigns a real available caregiver',async()=>{
            booking=(await ok('/lich-hen','customer','POST',{thuCungId:pet,ngay:today,gioStart:'10:00',dichVuIds:[service]},201)).lichHenId
            await ok(`/lich-hen/${booking}/xu-ly`,'reception','PATCH',{hanhDong:'phan-cong',nhanVienId:staff.care})
        })
        await t.test('assigned caregiver completes each service; completed job cannot be canceled',async()=>{
            await setClock('10:00')
            for(const name of ['manager','reception','care','customer']) {
                tokens[name]=(await ok('/auth/dang-nhap',null,'POST',{tenDangNhap:name==='customer'?'journey_customer':name,matKhau:password})).accessToken
            }
            const care=(body)=>ok(`/lich-hen/${booking}/cham-soc`,'care','PATCH',body)
            await care({hanhDong:'bat-dau'})
            await care({hanhDong:'dich-vu',maDichVu:service,trangThai:'DangThucHien'})
            await care({hanhDong:'dich-vu',maDichVu:service,trangThai:'HoanThanh',ghiChu:'Thú cưng khỏe, bàn giao bình thường'})
            await care({hanhDong:'hoan-thanh'})
            assert.equal((await call(`/lich-hen/${booking}/huy`,'reception','PATCH',{lyDo:'Không được hủy lịch hoàn thành'})).status,409)
        })
        await t.test('reception creates invoice, records partial cash then confirmed transfer',async()=>{
            invoice=(await ok('/hoa-don','reception','POST',{maLichHen:booking,giamGia:0},201)).id
            const pay=body=>ok(`/hoa-don/${invoice}/thanh-toan`,'reception','POST',{khoaChongLap:randomBytes(16).toString('hex'),...body})
            await pay({soTien:100000,tienKhachDua:200000,phuongThuc:'TienMat'})
            assert.equal((await ok(`/hoa-don/${invoice}`,'customer')).remaining,300000)
            await pay({soTien:300000,phuongThuc:'ChuyenKhoanQR',daNhanTien:true})
            assert.equal((await ok(`/hoa-don/${invoice}`,'customer')).invoice.trang_thai,'DaThanhToan')
            assert.equal((await call(`/hoa-don/${invoice}/qr`,'reception')).status,503)
        })
        await t.test('approval reserves 100,000 of 400,000; only actual payout reduces net receipts',async()=>{
            complaint=(await ok('/khieu-nai','reception','POST',{maLichHen:booking,noiDung:'Đề nghị hoàn một phần'},201)).id
            await ok(`/khieu-nai/${complaint}/quyet-dinh`,'manager','PATCH',{quyetDinh:'HoanTien',soTienHoan:100000,phuongAn:'Chấp thuận hoàn một phần'})
            const report=()=>ok(`/bao-cao/doanh-thu?tuNgay=${today}&denNgay=${today}`,'manager')
            assert.equal((await report()).net,400000)
            await ok(`/khieu-nai/${complaint}/chi-hoan`,'reception','POST',{khoaChongLap:randomBytes(16).toString('hex'),phuongThucChi:'TienMat',xacNhanDaChi:true,bangChung:'JOURNEY-TEST-ONLY'})
            assert.equal((await ok(`/hoa-don/${invoice}`,'customer')).invoice.trang_thai,'HoanTienMotPhan')
            assert.equal((await report()).refunded,100000);assert.equal((await report()).net,300000)
            assert.ok((await ok(`/khieu-nai/${complaint}`,'customer')).khieuNai.paid_date)
        })
        await t.test('owner reviews once and receives history and notifications',async()=>{
            await ok(`/lich-hen/${booking}/danh-gia`,'customer','POST',{stars:5,comment:'Hài lòng'},201)
            const history=await ok(`/lich-hen/${booking}/nhat-ky`,'customer')
            assert.ok(history.nhatKy.some(row=>row.action==='hoan-thanh'))
            assert.ok((await ok('/thong-bao','customer')).thongBao.length>0)
        })
        t.diagnostic(`All business transitions used HTTP; retained ${database}. Clock affects test process only.`)
    } finally {
        if(child&&child.exitCode===null)child.kill()
        await db.end()
    }
})
