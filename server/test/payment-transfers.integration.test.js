import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes,randomUUID} from 'node:crypto'
import {spawn} from 'node:child_process'
import {createServer} from 'node:net'
import {fileURLToPath} from 'node:url'
import pg from 'pg'
import jwt from 'jsonwebtoken'
import {getSafeConfig,ensureDatabase,loadMigrations,migrateDatabase} from '../scripts/db-tooling.js'

const testUrl=process.env.TEST_DATABASE_URL
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
test('manual bank/MoMo invoice and deposit payments on a NEW isolated database',{
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
        const users={}
        for(const [name,role,phone,position] of [['owner','KhachHang','0900000001'],['other','KhachHang','0900000002'],['reception','NhanVien','0900000003','Lễ tân'],['care','NhanVien','0900000004','Nhân viên chăm sóc'],['manager','NhanVien','0900000005','Quản lý']]) {
            users[name]=(await db.query("INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,so_dien_thoai,vai_tro) VALUES($1,'fixture-no-login',$2,$3) RETURNING ma_nguoi_dung",[name,phone,role])).rows[0].ma_nguoi_dung
            if(role==='KhachHang')await db.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES($1,$2)',[users[name],name])
            else await db.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,$2,$3)',[users[name],name,position])
        }
        const pet=(await db.query("INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung) VALUES($1,'Transfer fixture','Mèo') RETURNING ma_thu_cung",[users.owner])).rows[0].ma_thu_cung
        async function booking(state='HoanThanh') {
            return (await db.query("INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien,trang_thai) VALUES($1,CURRENT_DATE+INTERVAL '30 days'+TIME '09:00',CURRENT_DATE+INTERVAL '30 days'+TIME '10:00',$2) RETURNING ma_lich_hen",[pet,state])).rows[0].ma_lich_hen
        }
        async function bill() {
            return (await db.query("INSERT INTO hoa_don(ma_lich_hen,tong_tien,giam_gia,thanh_tien,trang_thai) VALUES($1,150000,0,150000,'ChuaThanhToan') RETURNING ma_hoa_don",[await booking()])).rows[0].ma_hoa_don
        }
        async function deposit() {
            const id=await booking('ChoXacNhan')
            await db.query("INSERT INTO booking_deposits(booking_id,quoted_total,amount,original_start) VALUES($1,150000,45000,NOW()+INTERVAL '30 days')",[id])
            return id
        }
        const socket=createServer();await new Promise((resolve,reject)=>socket.once('error',reject).listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve))
        const secret=randomBytes(48).toString('hex')
        child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,stdio:'ignore',env:{...process.env,
            NODE_ENV:'test',DATABASE_URL:testUrl,DB_SSL:'false',PORT:String(port),JWT_SECRET:secret,JWT_REFRESH_SECRET:secret,PAYMENT_MODE:'transfer',
            PAYMENT_BANK_CODE:'MB',PAYMENT_BANK_ACCOUNT:'0000000001',PAYMENT_BANK_NAME:'TEST RECIPIENT',PAYMENT_MOMO_PHONE:'0900000001',PAYMENT_MOMO_NAME:'TEST WALLET',PAYMENT_MOMO_RECEIVE_URL:'',
        }})
        let spawnError;child.on('error',error=>{spawnError=error})
        const base=`http://127.0.0.1:${port}`;let ready=false
        for(let i=0;i<100;i++){
            if(spawnError)throw spawnError
            if(child.exitCode!==null)throw new Error('Transfer test server stopped.')
            try{ready=(await fetch(`${base}/ready`)).ok}catch{}
            if(ready)break;await delay(100)
        }
        assert.ok(ready)
        async function call(path,{as='owner',method='GET',body}={}) {
            const token=as?jwt.sign({type:'access',version:0,userId:users[as]},secret,{expiresIn:'5m'}):null
            const response=await fetch(`${base}/api/${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)})
            return {status:response.status,body:await response.json()}
        }
        const instructions=(id,method='BankQR',as='owner')=>call(`payments/transfers/invoices/${id}?method=${method}&amount=1&accountNumber=ATTACKER`,{as})
        const pay=(id,overrides={},as='reception')=>call(`hoa-don/${id}/thanh-toan`,{as,method:'POST',body:{soTien:150000,phuongThuc:'MoMo',maGiaoDich:`TEST-${randomUUID()}`,daNhanTien:true,khoaChongLap:randomUUID(),...overrides}})
        const detail=id=>call(`hoa-don/${id}`)
        await t.test('config exposes recipient methods; authentication, ownership and staff roles enforced',async()=>{
            const cfg=await call('payments/config');assert.equal(cfg.body.mode,'transfer');assert.deepEqual(cfg.body.methods,['BankQR','MoMo','COD'])
            const id=await bill()
            assert.equal((await instructions(id,'BankQR',null)).status,401)
            assert.equal((await instructions(id,'BankQR','other')).status,403)
            assert.equal((await instructions(id,'BankQR','care')).status,403)
            assert.equal((await instructions(id,'BankQR','reception')).status,200)
            assert.equal((await instructions('bad')).status,400)
            assert.equal((await instructions(id,'Stripe')).status,400)
        })
        await t.test('QR amount and recipient come from server, generating or refreshing never writes money',async()=>{
            const id=await bill(),first=await instructions(id)
            assert.equal(first.status,200);assert.equal(first.body.amount,150000);assert.equal(first.body.accountNumber,'0000000001')
            assert.equal(first.body.status,'AwaitingReceipt');assert.equal(first.body.content,`PCHD${id}`)
            assert.equal(new URL(first.body.qr).searchParams.get('amount'),'150000')
            await instructions(id);await instructions(id,'MoMo');await instructions(id,'COD')
            assert.equal((await detail(id)).body.paid,0)
            assert.equal((await db.query('SELECT 1 FROM payment_intents')).rowCount,0)
            assert.equal((await db.query('SELECT 1 FROM thanh_toan')).rowCount,0)
            assert.equal((await call(`hoa-don/${id}/qr`,{as:'reception'})).body.amount,150000)
        })
        await t.test('personal MoMo has correct phone, no fake QR and no customer-controlled success',async()=>{
            const id=await bill(),momo=(await instructions(id,'MoMo')).body
            assert.equal(momo.phoneNumber,'0900000001');assert.equal(momo.qr,null);assert.equal(momo.status,'AwaitingReceipt')
            assert.equal((await pay(id,{},'owner')).status,403)
            assert.equal((await pay(id,{daNhanTien:false})).status,400)
            assert.equal((await pay(id,{maGiaoDich:''})).status,400)
            assert.equal((await call('payments/intents/fake/simulate',{method:'POST',body:{result:'success'}})).status,403)
            assert.equal((await detail(id)).body.paid,0)
        })
        await t.test('staff confirmation is atomic/idempotent and MoMo totals are included',async()=>{
            const id=await bill(),body={khoaChongLap:randomUUID(),maGiaoDich:`TEST-${randomUUID()}`}
            const results=await Promise.all([pay(id,body),pay(id,body)])
            assert.deepEqual(results.map(result=>result.status),[200,200]);assert.equal(results.filter(result=>result.body.replayed).length,1)
            const result=(await detail(id)).body
            assert.equal(result.paid,150000);assert.equal(result.remaining,0);assert.equal(result.transactions.length,1);assert.equal(result.transactions[0].method,'MoMo')
            const settled=(await instructions(id,'MoMo')).body;assert.equal(settled.status,'Paid');assert.equal(settled.qr,null)
            assert.equal((await pay(id,{...body,soTien:1})).status,409)
        })
        await t.test('partial cash changes QR debt; COD leaves debt until cashier actually collects',async()=>{
            const id=await bill()
            const cod=(await instructions(id,'COD')).body;assert.equal(cod.status,'AwaitingCash');assert.equal(cod.qr,null)
            await pay(id,{phuongThuc:'TienMat',soTien:50000,tienKhachDua:50000})
            assert.equal((await instructions(id)).body.amount,100000)
            assert.equal((await pay(id,{soTien:100001})).status,400)
            assert.equal((await pay(id,{soTien:100000,ketQua:'ThatBai',daNhanTien:false})).status,200)
            assert.equal((await detail(id)).body.remaining,100000)
            assert.equal((await pay(id,{soTien:100000})).status,200)
            assert.equal((await instructions(id,'COD')).body.status,'Paid')
        })
        await t.test('deposit QR takes 30% snapshot, rejects COD, wrong owner and cancelled bookings',async()=>{
            const id=await deposit(),path=`payments/transfers/deposits/${id}`
            const result=await call(path);assert.equal(result.status,200);assert.equal(result.body.amount,45000);assert.equal(result.body.content,`PCCOC${id}`)
            assert.equal((await call(path+'?method=MoMo')).body.phoneNumber,'0900000001')
            assert.equal((await call(path,{as:'other'})).status,403)
            assert.equal((await call(path+'?method=COD')).status,400)
            assert.equal((await db.query('SELECT 1 FROM deposit_transactions')).rowCount,0)
            await db.query("UPDATE lich_hen SET trang_thai='DaHuy' WHERE ma_lich_hen=$1",[id])
            assert.equal((await call(path)).status,409)
        })
        await t.test('deposit only becomes Paid after staff receipt and is counted once',async()=>{
            const id=await deposit(),path=`payments/transfers/deposits/${id}`,body={key:randomUUID(),method:'MoMo',reference:`TEST-${randomUUID()}`,received:true}
            assert.equal((await call(`deposits/${id}/collect`,{as:'owner',method:'POST',body})).status,403)
            assert.equal((await call(`deposits/${id}/collect`,{as:'reception',method:'POST',body:{...body,received:false}})).status,400)
            assert.equal((await call(`deposits/${id}/collect`,{as:'reception',method:'POST',body})).status,200)
            assert.equal((await call(`deposits/${id}/collect`,{as:'reception',method:'POST',body})).body.replayed,true)
            assert.equal((await call(path)).body.status,'Paid')
            const row=(await db.query('SELECT * FROM deposit_transactions WHERE booking_id=$1',[id])).rows[0]
            assert.equal(row.sandbox,false);assert.equal(row.method,'MoMo');assert.equal(Number(row.amount),45000)
        })
        await t.test('already cancelled invoice and past booking never show a payable QR',async()=>{
            const id=await bill();await db.query("UPDATE hoa_don SET trang_thai='DaHuy' WHERE ma_hoa_don=$1",[id])
            assert.equal((await instructions(id)).status,409)
            const appointment=await deposit()
            await db.query("UPDATE lich_hen SET ngay_gio_hen=CURRENT_DATE-INTERVAL '1 day'+TIME '09:00',ngay_gio_ket_thuc_du_kien=CURRENT_DATE-INTERVAL '1 day'+TIME '10:00' WHERE ma_lich_hen=$1",[appointment])
            assert.equal((await call(`payments/transfers/deposits/${appointment}`)).status,409)
        })
        t.diagnostic(`Retained isolated database: ${database}`)
    } finally {
        if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)])}
        await db.end()
    }
})
