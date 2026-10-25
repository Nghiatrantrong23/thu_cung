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
test('booking deposits, cancellation policy and invoice credit on isolated PostgreSQL',{
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
        const kind=(await db.query("INSERT INTO loai_dv(ten_loai_dv) VALUES('deposit_fixture') RETURNING ma_loai_dv")).rows[0].ma_loai_dv
        const service=(await db.query("INSERT INTO dich_vu(ma_loai_dv,ten_dv,gia_hien_hanh,thoi_luong_phut) VALUES($1,'deposit_service',150000,60) RETURNING ma_dv",[kind])).rows[0].ma_dv
        let sequence=10
        const day=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10)
        async function shift(date){await db.query("INSERT INTO ca_lam_viec(ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc) VALUES($1,$2,'08:00','19:00')",[ids.care,date])}
        const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve))
        const jwtSecret=randomBytes(48).toString('hex'),secret=randomBytes(48).toString('hex')
        child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,stdio:'ignore',env:{...process.env,NODE_ENV:'test',DATABASE_URL:testUrl,DB_SSL:'false',PORT:String(port),JWT_SECRET:jwtSecret,JWT_REFRESH_SECRET:jwtSecret,BOOKING_DEPOSIT_ENABLED:'true',PAYMENT_MODE:'sandbox',PETCARE_PAYMENT_SANDBOX_DB:database,PAYMENT_SANDBOX_SECRET:secret}})
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
        async function book(accepted=true){const date=day(sequence++);await shift(date);const response=await call('lich-hen',{method:'POST',body:{thuCungId:pet,ngay:date,gioStart:'09:00',dichVuIds:[service],depositPolicyAccepted:accepted}});return response}
        const dep=id=>call(`deposits/${id}`)
        const intent=(id,method='MoMo',as='owner')=>call(`deposits/${id}/intent`,{method:'POST',as,body:{method}})
        const payDeposit=id=>call(`deposits/${id}/simulate`,{method:'POST',body:{result:'success'}})
        const cancel=(id,as='owner')=>call(`lich-hen/${id}/huy`,{method:'PATCH',as,body:{lyDo:'Fixture cancellation'}})
        async function paid(){const result=await book();assert.equal(result.status,201,JSON.stringify(result.body));const id=result.body.lichHenId;assert.equal((await intent(id)).status,200);assert.equal((await payDeposit(id)).status,200);return id}
        await t.test('consent required, quote is server-owned and confirmation waits for deposit',async()=>{
            assert.equal((await book(false)).status,400)
            const result=await book();assert.equal(result.status,201);assert.equal(result.body.booking.depositRequired,true)
            const id=result.body.lichHenId
            assert.equal((await dep(id)).body.deposit.amount,45000)
            assert.equal((await intent(id,'COD')).status,400)
            assert.equal((await intent(id,'MoMo','other')).status,403)
            const dispatch=()=>call(`lich-hen/${id}/xu-ly`,{method:'PATCH',as:'reception',body:{hanhDong:'phan-cong',nhanVienId:ids.care}})
            assert.equal((await dispatch()).status,409)
            const first=(await intent(id)).body;assert.equal(first.amount,45000)
            const bad={intentId:first.id,eventId:`deposit:${first.id}`,method:'MoMo',amount:1,result:'success'}
            assert.equal((await call('deposits/sandbox/callback',{method:'POST',body:bad,signature:callbackSignature(bad,secret)})).status,409)
            assert.equal((await call('deposits/sandbox/callback',{method:'POST',body:bad})).status,401)
            const outcomes=await Promise.all([payDeposit(id),payDeposit(id)])
            assert.deepEqual(outcomes.map(r=>r.status),[200,200])
            assert.equal((await dep(id)).body.transactions.length,1)
            assert.equal((await dispatch()).status,200)
        })
        await t.test('early cancellation marks refund pending; only actual/sandbox payout refunds once',async()=>{
            const id=await paid();assert.equal((await cancel(id)).status,200)
            assert.equal((await dep(id)).body.deposit.status,'RefundPending')
            const body={key:randomUUID(),method:'MoMo',reference:'SANDBOX-REFUND',sandbox:true}
            assert.equal((await call(`deposits/${id}/refund`,{method:'POST',body})).status,403)
            assert.equal((await call(`deposits/${id}/refund`,{as:'reception',method:'POST',body:{...body,sandbox:false}})).status,400)
            const results=await Promise.all([1,2].map(()=>call(`deposits/${id}/refund`,{as:'reception',method:'POST',body})))
            assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal((await dep(id)).body.deposit.status,'Refunded')
            assert.equal((await dep(id)).body.transactions.filter(row=>row.kind==='Refund').length,1)
        })
        await t.test('late cancellation forfeits; manager exception approves but never pays automatically',async()=>{
            const id=await paid()
            await db.query("UPDATE lich_hen SET ngay_gio_hen=($2::date+TIME '08:00'),ngay_gio_ket_thuc_du_kien=($2::date+TIME '09:00') WHERE ma_lich_hen=$1",[id,day(1)])
            await cancel(id);assert.equal((await dep(id)).body.deposit.status,'Forfeited')
            const body={action:'exception-refund',reason:'Pet suddenly ill'}
            assert.equal((await call(`deposits/${id}/decision`,{as:'reception',method:'POST',body})).status,403)
            assert.equal((await call(`deposits/${id}/decision`,{as:'manager',method:'POST',body})).status,200)
            const result=(await dep(id)).body;assert.equal(result.deposit.status,'RefundPending');assert.equal(result.transactions.length,1)
        })
        await t.test('one late reschedule retains deposit and does not reopen early refund loophole',async()=>{
            const id=await paid()
            await db.query("UPDATE lich_hen SET ngay_gio_hen=($2::date+TIME '08:00'),ngay_gio_ket_thuc_du_kien=($2::date+TIME '09:00') WHERE ma_lich_hen=$1",[id,day(1)])
            const target=day(sequence++);await shift(target)
            const moved=await call(`deposits/${id}/reschedule`,{method:'POST',body:{ngay:target,gioStart:'10:00',lyDo:'Busy'}})
            assert.equal(moved.status,200,JSON.stringify(moved.body))
            const result=(await dep(id)).body.deposit;assert.equal(result.status,'Paid');assert.equal(result.lateReschedules,1);assert.equal(result.refundLocked,true)
            assert.equal((await call(`deposits/${id}/reschedule`,{method:'POST',body:{ngay:target,gioStart:'11:00',lyDo:'Move again'}})).status,409)
            await cancel(id);assert.equal((await dep(id)).body.deposit.status,'Forfeited')
        })
        await t.test('cash deposit is reception-only, idempotent and cancels a pending online QR',async()=>{
            const result=await book(),id=result.body.lichHenId;await intent(id,'BankQR')
            const body={key:randomUUID(),method:'TienMat',received:true}
            assert.equal((await call(`deposits/${id}/collect`,{method:'POST',body})).status,403)
            assert.equal((await call(`deposits/${id}/collect`,{method:'POST',as:'reception',body:{...body,received:false}})).status,400)
            const results=await Promise.all([1,2].map(()=>call(`deposits/${id}/collect`,{method:'POST',as:'reception',body})))
            assert.deepEqual(results.map(r=>r.status),[200,200])
            assert.equal((await dep(id)).body.transactions.length,1)
            assert.equal((await payDeposit(id)).status,409)
        })
        await t.test('notification failure rolls back deposit, ledger and callback together',async()=>{
            const response=await book(),id=response.body.lichHenId;await intent(id)
            await db.query(`CREATE FUNCTION fail_deposit_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tieu_de='Đã nhận cọc (sandbox)' THEN RAISE EXCEPTION 'fixture_failure'; END IF; RETURN NEW; END $$`)
            await db.query('CREATE TRIGGER fail_deposit_notification BEFORE INSERT ON thong_bao FOR EACH ROW EXECUTE FUNCTION fail_deposit_notification()')
            try {
                assert.equal((await payDeposit(id)).status,500)
                const result=(await dep(id)).body
                assert.equal(result.deposit.status,'Unpaid');assert.equal(result.transactions.length,0);assert.equal(result.intent.status,'Pending')
            } finally {await db.query('DROP TRIGGER fail_deposit_notification ON thong_bao');await db.query('DROP FUNCTION fail_deposit_notification()')}
            assert.equal((await payDeposit(id)).status,200)
        })
        await t.test('no-show only after scheduled time and only manager',async()=>{
            const id=await paid(),body={action:'no-show',reason:'Did not arrive, no contact'}
            assert.equal((await call(`deposits/${id}/decision`,{as:'manager',method:'POST',body})).status,409)
            await db.query("UPDATE lich_hen SET ngay_gio_hen=($2::date+TIME '08:00'),ngay_gio_ket_thuc_du_kien=($2::date+TIME '09:00') WHERE ma_lich_hen=$1",[id,day(-1)])
            assert.equal((await call(`deposits/${id}/decision`,{method:'POST',body})).status,403)
            assert.equal((await call(`deposits/${id}/decision`,{as:'manager',method:'POST',body})).status,200)
            assert.equal((await dep(id)).body.deposit.status,'Forfeited')
        })
        await t.test('store cancellation always returns full deposit entitlement',async()=>{
            const id=await paid();await db.query("UPDATE lich_hen SET ngay_gio_hen=($2::date+TIME '08:00'),ngay_gio_ket_thuc_du_kien=($2::date+TIME '09:00') WHERE ma_lich_hen=$1",[id,day(1)])
            await cancel(id,'reception');assert.equal((await dep(id)).body.deposit.status,'RefundPending')
        })
        await t.test('cancellation racing payment cannot leave money without a policy decision',async()=>{
            const result=await book(),id=result.body.lichHenId;await intent(id)
            const results=await Promise.all([payDeposit(id),cancel(id)])
            assert.equal(results[1].status,200)
            const detail=(await dep(id)).body
            assert.ok(['RefundPending','Cancelled'].includes(detail.deposit.status))
            assert.equal(detail.transactions.length,detail.deposit.status==='RefundPending'?1:0)
        })
        await t.test('invoice subtracts deposit and reports count only new cash movement',async()=>{
            const id=await paid()
            await db.query("UPDATE lich_hen SET trang_thai='HoanThanh' WHERE ma_lich_hen=$1",[id])
            await db.query("UPDATE chi_tiet_lich_hen SET trang_thai='HoanThanh' WHERE ma_lich_hen=$1",[id])
            const currentDay=(await db.query("SELECT to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
            const report=async()=> (await call(`bao-cao/doanh-thu?tuNgay=${currentDay}&denNgay=${currentDay}`,{as:'manager'})).body
            const before=await report()
            const response=await call('hoa-don',{method:'POST',as:'reception',body:{maLichHen:id,giamGia:0}})
            assert.equal(response.status,201,JSON.stringify(response.body));const invoiceId=response.body.id
            const invoice=(await detail(invoiceId)).body
            assert.equal(invoice.invoice.deposit_credit,45000);assert.equal(invoice.paid,45000);assert.equal(invoice.remaining,105000)
            assert.equal((await dep(id)).body.deposit.status,'Applied')
            assert.equal((await report()).collected,before.collected)
            assert.equal((await cash(invoiceId,105000)).status,200)
            assert.equal((await detail(invoiceId)).body.remaining,0)
            assert.equal((await report()).collected,before.collected+105000)
        })
        await t.test('report subtracts actual deposit refunds once, including after invoice application',async()=>{
            const currentDay=(await db.query("SELECT to_char(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day")).rows[0].day
            const report=(await call(`bao-cao/doanh-thu?tuNgay=${currentDay}&denNgay=${currentDay}`,{as:'manager'})).body
            const deposits=(await db.query("SELECT COALESCE(SUM(amount) FILTER(WHERE kind='Collect'),0) AS collected,COALESCE(SUM(amount) FILTER(WHERE kind='Refund'),0) AS refunded FROM deposit_transactions")).rows[0]
            const ledger=(await db.query("SELECT COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc<>'HoanTien'),0) AS collected,COALESCE(SUM(so_tien) FILTER(WHERE phuong_thuc='HoanTien'),0) AS refunded FROM thanh_toan WHERE trang_thai='ThanhCong'")).rows[0]
            assert.equal(report.collected,Number(deposits.collected)+Number(ledger.collected))
            assert.equal(report.refunded,45000)
            assert.equal(report.net,report.collected-report.refunded)
        })
        t.diagnostic(`Retained isolated deposit database: ${database}`)
    } finally {if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)])}await db.end()}
})
