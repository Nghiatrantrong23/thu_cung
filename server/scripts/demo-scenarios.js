// Standalone, opt-in demo fixtures. Never imports the application's .env.
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import pg from 'pg'
import { getSafeConfig, ensureDatabase, migrateDatabase, loadMigrations } from './db-tooling.js'
import { seedDatabase, validateDemoPassword } from './seed.js'

const serverRoot = fileURLToPath(new URL('../', import.meta.url))
const cacheRoot = fileURLToPath(new URL('../../.cache/demo/', import.meta.url))
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export function demoConfig(env = process.env) {
    const config = getSafeConfig(env)
    if (env.NODE_ENV !== 'test' || !/^petcare_test_demo_[a-z0-9_]+$/.test(config.database)) {
        throw new Error('Demo requires NODE_ENV=test and a fresh petcare_test_demo_<unique> database.')
    }
    return config
}

export function demoConnectionString(config) {
    const host=config.host.includes(':')?`[${config.host}]`:config.host
    return `postgres://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${host}:${config.port}/${config.database}`
}

export async function createDemo(env = process.env) {
    const config = demoConfig(env)
    const password = validateDemoPassword(env.PETCARE_DEMO_PASSWORD)
    await ensureDatabase(config)
    const db = new pg.Client(config)
    let child
    await db.connect()
    try {
        const existing = await db.query("SELECT 1 FROM pg_tables WHERE schemaname='public' LIMIT 1")
        if (existing.rowCount) throw new Error('Demo refuses an existing schema. Choose a NEW database; existing data was preserved.')
        await migrateDatabase(db, await loadMigrations())
        await seedDatabase(db, password)
        const users = Object.fromEntries((await db.query('SELECT ten_dang_nhap,ma_nguoi_dung FROM nguoi_dung')).rows.map(r => [r.ten_dang_nhap,r.ma_nguoi_dung]))
        const pets = (await db.query('SELECT ma_thu_cung FROM thu_cung ORDER BY ma_thu_cung')).rows.map(r => r.ma_thu_cung)
        const services = (await db.query('SELECT ma_dv,thoi_luong_phut FROM dich_vu ORDER BY thoi_luong_phut')).rows
        const bath = services[0].ma_dv, spa = services[2].ma_dv
        const today = (await db.query("SELECT to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
        const day = n => new Date(Date.parse(`${today}T12:00:00Z`) + n * 86400000).toISOString().slice(0,10)
        await mkdir(cacheRoot, { recursive:true })
        const clock = `${cacheRoot}/${config.database}-clock.txt`
        await writeFile(clock, `${today}T07:00:00+07:00`)
        const socket = createServer()
        await new Promise((resolve,reject) => socket.once('error',reject).listen(0,'127.0.0.1',resolve))
        const port = socket.address().port
        await new Promise(resolve => socket.close(resolve))
        child = spawn(process.execPath,['--import','./test/fixtures/fixed-clock.js','src/server.js'], {
            cwd:serverRoot, windowsHide:true, stdio:'ignore',
            env:{...env, DATABASE_URL:demoConnectionString(config),
                NODE_ENV:'test', PORT:String(port), DB_SSL:'false', TEST_CLOCK_FILE:clock,
                JWT_SECRET:randomBytes(48).toString('hex'), JWT_REFRESH_SECRET:randomBytes(48).toString('hex'), JWT_EXPIRES_IN:'2h'},
        })
        let spawnError
        child.on('error',error => { spawnError=error })
        const base = `http://127.0.0.1:${port}`
        let ready = false
        for (let i=0; i<100; i++) {
            if (spawnError) throw new Error(`Demo API could not start (${spawnError.code}).`)
            try { ready=(await fetch(`${base}/ready`)).ok } catch {}
            if (ready) break
            await delay(100)
        }
        assert.ok(ready, 'Demo API did not become ready.')
        const tokens = {}
        async function api(path,as,method='GET',body,status=200) {
            const response = await fetch(`${base}/api${path}`, {method,headers:{'Content-Type':'application/json',...(tokens[as]?{Authorization:`Bearer ${tokens[as]}`}:{})},body:body===undefined?undefined:JSON.stringify(body)})
            const data = await response.json()
            // Do not include request bodies, credentials or tokens in error logs.
            assert.equal(response.status,status,`${method} ${path}: expected ${status}, got ${response.status}; ${data.error || ''}`)
            return data
        }
        for (const username of ['demo_admin','demo_quanly','demo_letan','demo_chamsoc1','demo_chamsoc2','demo_khach']) {
            tokens[username]=(await api('/auth/dang-nhap',null,'POST',{tenDangNhap:username,matKhau:password})).accessToken
            assert.ok(tokens[username])
        }
        const customer='demo_khach', reception='demo_letan', manager='demo_quanly', care='demo_chamsoc1'
        const bookings={}, invoices={}, complaints={}
        async function book(key,date,time,service=bath,pet=pets[0]) {
            const id=(await api('/lich-hen',customer,'POST',{thuCungId:pet,ngay:date,gioStart:time,dichVuIds:[service],ghiChu:`[DEMO] ${key}`},201)).lichHenId
            bookings[key]=id
            return id
        }
        const assign = (id,who=care) => api(`/lich-hen/${id}/xu-ly`,reception,'PATCH',{hanhDong:'phan-cong',nhanVienId:users[who]})
        const careAction = (id,body) => api(`/lich-hen/${id}/cham-soc`,care,'PATCH',body)
        const invoice = async (key,id) => invoices[key]=(await api('/hoa-don',reception,'POST',{maLichHen:id,giamGia:0},201)).id
        const pay = (id,amount,extra={}) => api(`/hoa-don/${id}/thanh-toan`,reception,'POST',{khoaChongLap:randomBytes(16).toString('hex'),soTien:amount,phuongThuc:'TienMat',tienKhachDua:amount,...extra})
        const complaint = async (key,booking) => complaints[key]=(await api('/khieu-nai',reception,'POST',{maLichHen:booking,noiDung:`[DEMO] ${key}`},201)).id
        const approve = (id,amount) => api(`/khieu-nai/${id}/quyet-dinh`,manager,'PATCH',{quyetDinh:'HoanTien',soTienHoan:amount,phuongAn:'[DEMO] Duyệt hoàn thử nghiệm, không có giao dịch ngân hàng thật'})
        const payout = (id,extra={}) => api(`/khieu-nai/${id}/chi-hoan`,reception,'POST',{khoaChongLap:randomBytes(16).toString('hex'),phuongThucChi:'TienMat',xacNhanDaChi:true,bangChung:`DEMO-${id}`,...extra})

        // Controlled setup clock allows today's scenarios at any real time of day.
        // Runtime demo:start uses the REAL clock, never this fixture clock.
        const finished=['cho-lap-hoa-don','chua-thanh-toan','thanh-toan-mot-phan','da-thanh-toan','hoan-mot-phan','hoan-toan-bo','cho-chi-hoan','chi-hoan-that-bai','khac-phuc']
        for (const [i,key] of finished.entries()) {
            const service=i===0?spa:bath
            const time=i===0?'08:00':`${String(9+i).padStart(2,'0')}:00`
            const id=await book(key,today,time,service,pets[i%pets.length])
            await assign(id)
            await careAction(id,{hanhDong:'bat-dau'})
            await careAction(id,{hanhDong:'dich-vu',maDichVu:service,trangThai:'DangThucHien'})
            await careAction(id,{hanhDong:'dich-vu',maDichVu:service,trangThai:'HoanThanh',ghiChu:'[DEMO] Thú cưng khỏe, chăm sóc hoàn tất'})
            await careAction(id,{hanhDong:'hoan-thanh'})
            if(i===0) continue
            const bill=await invoice(key,id)
            if(i===1) continue
            if(i===2) await pay(bill,50000,{tienKhachDua:100000})
            else if(i===3) {
                await pay(bill,50000)
                await pay(bill,100000,{phuongThuc:'ChuyenKhoanQR',daNhanTien:true,tienKhachDua:100000})
                await api(`/lich-hen/${id}/danh-gia`,customer,'POST',{stars:5,comment:'[DEMO] Hài lòng với dịch vụ'},201)
            } else await pay(bill,150000)
            if(i>=4 && i<=7) {
                const c=await complaint(key,id)
                await approve(c,i===5?150000:50000)
                if(i<=5) await payout(c)
                if(i===7) await payout(c,{ketQua:'ThatBai',xacNhanDaChi:false,loiChi:'[DEMO] Chưa chi được, cần thử lại'})
            }
            if(i===8) {
                const c=await complaint(key,id)
                await api(`/khieu-nai/${c}/quyet-dinh`,manager,'PATCH',{quyetDinh:'KhacPhuc',phuongAn:'[DEMO] Hẹn chăm sóc lại, không hoàn tiền'})
            }
        }
        await complaint('cho-quan-ly-xem',bookings['da-thanh-toan'])
        const refused=await complaint('tu-choi-khieu-nai',bookings['khac-phuc'])
        await api(`/khieu-nai/${refused}/quyet-dinh`,manager,'PATCH',{quyetDinh:'TuChoi',phuongAn:'[DEMO] Không đủ căn cứ, đã giải thích cho khách'})
        const working=await book('dang-cham-soc',today,'18:00')
        await assign(working)
        await careAction(working,{hanhDong:'bat-dau'})
        await careAction(working,{hanhDong:'dich-vu',maDichVu:bath,trangThai:'DangThucHien'})
        const issue=await book('cho-le-tan-xu-ly',today,'18:00',bath,pets[1])
        await assign(issue,'demo_chamsoc2')
        await api(`/lich-hen/${issue}/cham-soc`,'demo_chamsoc2','PATCH',{hanhDong:'khong-du-dieu-kien',ghiChu:'[DEMO] Thú cưng cần dời lịch, lễ tân liên hệ khách'})
        await book('cho-xac-nhan',day(1),'09:00')
        await assign(await book('da-xac-nhan',day(1),'11:00'))
        const hold=await book('giu-cho',day(1),'14:00')
        await api(`/lich-hen/${hold}/xu-ly`,reception,'PATCH',{hanhDong:'giu-cho',lyDo:'[DEMO] Chờ khách xác nhận yêu cầu'})
        const canceled=await book('khach-da-huy',day(1),'15:00')
        await api(`/lich-hen/${canceled}/huy`,customer,'PATCH',{lyDo:'[DEMO] Khách bận'})
        const rejected=await book('le-tan-tu-choi',day(1),'16:00')
        await api(`/lich-hen/${rejected}/xu-ly`,reception,'PATCH',{hanhDong:'tu-choi',lyDo:'[DEMO] Dịch vụ không phù hợp'})
        const moved=await book('doi-lich',day(2),'10:00')
        await assign(moved)
        await api(`/lich-hen/${moved}/doi-lich`,reception,'PATCH',{ngay:day(3),gioStart:'09:00',lyDo:'[DEMO] Khách yêu cầu chuyển ngày'})
        const states=async(table,column)=>(await db.query(`SELECT ${column} AS state,COUNT(*)::int AS count FROM ${table} GROUP BY ${column} ORDER BY ${column}`)).rows
        const summary={database:config.database,businessDate:today,bookings,invoices,complaints,
            appointmentStates:await states('lich_hen','trang_thai'),invoiceStates:await states('hoa_don','trang_thai'),complaintStates:await states('khieu_nai','trang_thai'),
            report:await api(`/bao-cao/doanh-thu?tuNgay=${today}&denNgay=${today}`,manager)}
        assert.equal(Object.keys(bookings).length,17)
        assert.equal(Object.keys(invoices).length,8)
        assert.equal(summary.report.collected,950000)
        assert.equal(summary.report.refunded,200000)
        assert.equal(summary.report.net,750000)
        await writeFile(`${cacheRoot}/${config.database}.json`,JSON.stringify(summary,null,2))
        console.log(`[demo] Ready: ${config.database}; 17 appointments, 8 invoices, 7 complaints; net 750000. Manifest in .cache/demo (no credentials).`)
        return summary
    } finally {
        if(child && child.exitCode===null) {
            const exited = new Promise(resolve=>child.once('exit',resolve))
            child.kill()
            await exited
        }
        await db.end()
    }
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
    try { await createDemo() }
    catch(error) { console.error(`[demo] ${error.code || error.message}`); process.exitCode=1 }
}
