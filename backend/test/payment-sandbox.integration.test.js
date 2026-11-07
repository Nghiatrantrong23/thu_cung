import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import jwt from 'jsonwebtoken'
import { getSafeConfig,ensureDatabase,loadMigrations,migrateDatabase } from '../scripts/db-tooling.js'
import { callbackSignature } from '../src/lib/paymentSandbox.js'
const testUrl=process.env.TEST_DATABASE_URL
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
test('payment sandbox HTTP lifecycle on a NEW isolated database',{
    skip:!testUrl&&'Requires a new TEST_DATABASE_URL.',timeout:90000,
},async t=>{
    const database=decodeURIComponent(new URL(testUrl).pathname.slice(1))
    assert.match(database,/^petcare_test_[a-z0-9_]+$/)
    const config=getSafeConfig({NODE_ENV:'test',DATABASE_URL:testUrl,PETCARE_ALLOW_DB_WRITE:database})
    await ensureDatabase(config)
    const db=new pg.Client(config);await db.connect();let child
    try {
        assert.equal((await db.query("SELECT 1 FROM pg_tables WHERE schemaname='public'")).rowCount,0,'Refuse existing data.')
        await migrateDatabase(db,await loadMigrations())
        const ids={}
        for(const [name,role,phone] of [['owner','KhachHang','0900000001'],['other','KhachHang','0900000002'],['reception','NhanVien','0900000003'],['care','NhanVien','0900000004'],['manager','NhanVien','0900000005']]) {
            ids[name]=(await db.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro) VALUES($1,'fixture-no-login',$2,$3) RETURNING ma_nguoi_dung`,[name,phone,role])).rows[0].ma_nguoi_dung
            if(role==='KhachHang') await db.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES($1,$2)',[ids[name],name])
            else await db.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,$2,$3)',[ids[name],name,name==='care'?'Nhân viên chăm sóc':name==='manager'?'Quản lý':'Lễ tân'])
        }
        const pet=(await db.query("INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung) VALUES($1,'Sandbox pet','Mèo') RETURNING ma_thu_cung",[ids.owner])).rows[0].ma_thu_cung
        async function bill(){
            const booking=(await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai) VALUES($1,CURRENT_DATE+TIME '09:00',CURRENT_DATE+TIME '10:00','HoanThanh') RETURNING ma_lich_hen",[pet])).rows[0].ma_lich_hen
            return (await db.query("INSERT INTO hoa_don(ma_lich_hen,tong_tien,giam_gia,thanh_tien,trang_thai) VALUES($1,150000,0,150000,'ChuaThanhToan') RETURNING ma_hoa_don",[booking])).rows[0].ma_hoa_don
        }
        const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve))
        const jwtSecret=randomBytes(48).toString('hex'),secret=randomBytes(48).toString('hex')
        child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,stdio:'ignore',env:{...process.env,NODE_ENV:'test',DATABASE_URL:testUrl,DB_SSL:'false',PORT:String(port),JWT_SECRET:jwtSecret,JWT_REFRESH_SECRET:jwtSecret,PAYMENT_MODE:'sandbox',PETCARE_PAYMENT_SANDBOX_DB:database,PAYMENT_SANDBOX_SECRET:secret}})
        const base=`http://127.0.0.1:${port}`;let healthy=false
        for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Sandbox test server stopped.');try{healthy=(await fetch(`${base}/ready`)).ok}catch{}if(healthy)break;await delay(100)}
        assert.ok(healthy)
        async function call(path,{as='owner',method='GET',body,signature}={}) {
            const token=jwt.sign({type:'access',version:0,userId:ids[as]},jwtSecret,{expiresIn:'5m'})
            const response=await fetch(`${base}/api/${path}`,{method,headers:{'Content-Type':'application/json',...(as?{Authorization:`Bearer ${token}`} : {}),...(signature?{'x-payment-signature':signature}:{})},body:body===undefined?undefined:JSON.stringify(body)})
            return {status:response.status,body:await response.json()}
        }
        const create=(id,method='MoMo',as='owner')=>call(`payments/invoices/${id}`,{as,method:'POST',body:{method}})
        const simulate=(id,result='success',as='owner')=>call(`payments/intents/${id}/simulate`,{as,method:'POST',body:{result}})
        const detail=id=>call(`hoa-don/${id}`)
        const cash=(id,amount=150000)=>call(`hoa-don/${id}/thanh-toan`,{as:'reception',method:'POST',body:{soTien:amount,tienKhachDua:amount,phuongThuc:'TienMat',khoaChongLap:randomUUID()}})
        await t.test('ownership, role and server-owned amount; create is reusable',async()=>{
            const id=await bill()
            assert.equal((await create(id,'MoMo','other')).status,403)
            assert.equal((await create(id,'MoMo','care')).status,403)
            const first=await call(`payments/invoices/${id}`,{method:'POST',body:{method:'MoMo',amount:1}})
            assert.equal(first.status,200);assert.equal(first.body.amount,150000);assert.match(first.body.qr,/^data:image\/png;base64,/)
            assert.equal((await create(id)).body.id,first.body.id)
            assert.equal((await simulate(first.body.id,'success','other')).status,403)
        })
        await t.test('MoMo settles once under concurrent delivery and appears in ledger',async()=>{
            const id=await bill(),intent=(await create(id)).body
            const results=await Promise.all([simulate(intent.id),simulate(intent.id)])
            assert.deepEqual(results.map(r=>r.status),[200,200])
            const result=(await detail(id)).body
            assert.equal(result.remaining,0);assert.equal(result.paid,150000);assert.equal(result.transactions.length,1);assert.equal(result.transactions[0].method,'MoMo')
            assert.equal((await create(id)).status,409)
        })
        await t.test('unsigned, forged and mismatched callbacks never settle an invoice',async()=>{
            const id=await bill(),intent=(await create(id,'BankQR')).body
            const body={intentId:intent.id,eventId:`sandbox:${intent.id}`,method:'BankQR',amount:1,result:'success'}
            assert.equal((await call('payments/sandbox/callback',{method:'POST',body})).status,401)
            assert.equal((await call('payments/sandbox/callback',{method:'POST',body,signature:'0'.repeat(64)})).status,401)
            assert.equal((await call('payments/sandbox/callback',{method:'POST',body,signature:callbackSignature(body,secret)})).status,409)
            assert.equal((await detail(id)).body.paid,0)
            assert.equal((await simulate(intent.id)).status,200)
            assert.equal((await detail(id)).body.transactions[0].method,'ChuyenKhoanQR')
        })
        await t.test('failure, expiry and replaced requests keep debt unchanged',async()=>{
            const id=await bill(),intent=(await create(id)).body
            assert.equal((await simulate(intent.id,'failed')).status,200)
            assert.equal((await detail(id)).body.paid,0)
            assert.equal((await simulate(intent.id)).status,409)
            const next=(await create(id,'BankQR')).body
            await db.query("UPDATE payment_intents SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1",[next.id])
            assert.equal((await simulate(next.id)).status,409)
            const fresh=(await create(id)).body
            await create(id,'COD')
            assert.equal((await simulate(fresh.id)).status,409)
        })
        await t.test('COD never self-settles; receptionist cash confirms receipt',async()=>{
            const id=await bill(),intent=(await create(id,'COD')).body
            assert.equal(intent.qr,null);assert.equal(intent.status,'AwaitingCash')
            assert.equal((await simulate(intent.id)).status,400)
            assert.equal((await detail(id)).body.paid,0)
            assert.equal((await cash(id)).status,200)
            assert.equal((await call(`payments/intents/${intent.id}`)).body.status,'Paid')
            assert.equal((await detail(id)).body.transactions[0].method,'TienMat')
        })
        await t.test('changed cash balance rejects stale callback; retry uses new remaining amount',async()=>{
            const id=await bill(),intent=(await create(id)).body
            await cash(id,50000)
            assert.equal((await simulate(intent.id)).status,409)
            assert.equal((await detail(id)).body.paid,50000)
            const next=(await create(id)).body
            assert.equal(next.amount,100000);assert.notEqual(next.id,intent.id)
            assert.equal((await simulate(next.id)).status,200)
            assert.equal((await detail(id)).body.paid,150000)
        })
        await t.test('cash and online callback racing each other cannot double collect',async()=>{
            const id=await bill(),intent=(await create(id)).body
            const results=await Promise.all([cash(id),simulate(intent.id)])
            assert.deepEqual(results.map(result=>result.status).sort(),[200,409])
            const result=(await detail(id)).body
            assert.equal(result.paid,150000);assert.equal(result.transactions.length,1)
        })
        await t.test('revenue includes MoMo without double counting',async()=>{
            const day=(await db.query("SELECT to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
            const report=await call(`bao-cao/doanh-thu?tuNgay=${day}&denNgay=${day}`,{as:'manager'})
            assert.equal(report.status,200);assert.equal(report.body.collected,750000);assert.equal(report.body.net,750000)
            const total=(await db.query("SELECT SUM(so_tien) AS total FROM thanh_toan WHERE trang_thai='ThanhCong'")).rows[0].total
            assert.equal(Number(total),750000)
        })
        t.diagnostic(`Retained isolated sandbox database: ${database}`)
    } finally {if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)])}await db.end()}
})
