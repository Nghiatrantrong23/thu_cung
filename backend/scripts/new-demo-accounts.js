// Replace the active demo dataset by preparing a fresh DB, retaining the old DB as backup.
// No DELETE, TRUNCATE, DROP, .env loading or writes to the source database.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { demoConfig } from './demo-scenarios.js'
import { ensureDatabase, loadMigrations, migrateDatabase, validateHistory } from './db-tooling.js'
import { validateDemoPassword } from './seed.js'

export const newDemoAccounts = [
    ...Array.from({length:5},(_,i)=>({username:`chamsoc0${i+1}`,role:'NhanVien',title:'Nhân viên chăm sóc',name:`Chăm sóc ${i+1}`})),
    ...Array.from({length:5},(_,i)=>({username:`letan0${i+1}`,role:'NhanVien',title:'Lễ tân',name:`Lễ tân ${i+1}`})),
    ...Array.from({length:2},(_,i)=>({username:`quanly0${i+1}`,role:'NhanVien',title:'Quản lý',name:`Quản lý ${i+1}`})),
    ...Array.from({length:5},(_,i)=>({username:`khach0${i+1}`,role:'KhachHang',name:`Khách hàng ${i+1}`})),
]

export function accountTargets(env=process.env) {
    const target=demoConfig(env)
    if(!env.DEMO_SOURCE_DATABASE_URL || !env.DEMO_SOURCE_DATABASE) throw new Error('Select the previous demo DB explicitly.')
    const source=demoConfig({...env,DATABASE_URL:env.DEMO_SOURCE_DATABASE_URL,PETCARE_ALLOW_DB_WRITE:env.DEMO_SOURCE_DATABASE})
    if(source.database===target.database || source.host!==target.host || source.port!==target.port) {
        throw new Error('Use different demo DB names on the same isolated local cluster.')
    }
    return {source,target}
}

export async function prepareNewDemo(env=process.env) {
    const {source,target}=accountTargets(env)
    const password=validateDemoPassword(env.PETCARE_DEMO_PASSWORD)
    const from=new pg.Client(source),to=new pg.Client(target)
    let targetConnected=false,sourceConnected=false
    try {
        await from.connect();sourceConnected=true
        // Enforce read-only even if future edits accidentally issue a source write.
        await from.query('BEGIN READ ONLY')
        const migrations=await loadMigrations()
        const history=(await from.query('SELECT version,name,checksum FROM petcare_schema_migrations ORDER BY version')).rows
        validateHistory(history,migrations)
        assert.equal(history.length,migrations.length,'Source demo schema must be up to date.')
        const admins=(await from.query("SELECT * FROM nguoi_dung WHERE vai_tro='Admin'")).rows
        assert.equal(admins.length,1,'Exactly one existing Admin is required; no account was changed.')
        const admin=admins[0]
        assert.equal(admin.trang_thai,true,'Existing Admin must be active.')
        assert.ok(!newDemoAccounts.some(a=>a.username===admin.ten_dang_nhap))
        const catalog=(await from.query(`SELECT dv.*,ldv.ten_loai_dv FROM dich_vu dv
            JOIN loai_dv ldv USING(ma_loai_dv) ORDER BY ma_dv`)).rows
        await ensureDatabase(target)
        await to.connect();targetConnected=true
        assert.equal((await to.query("SELECT 1 FROM pg_tables WHERE schemaname='public' LIMIT 1")).rowCount,0,
            'Target already has a schema. Refusing to overwrite any existing data.')
        await migrateDatabase(to,migrations)
        const hash=await bcrypt.hash(password,10)
        await to.query('BEGIN')
        await to.query("SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh'")
        const columns=['ma_nguoi_dung','ten_dang_nhap','mat_khau_hash','email','so_dien_thoai','vai_tro','trang_thai','ngay_tao','ngay_cap_nhat','token_version','bat_doi_mat_khau']
        await to.query(`INSERT INTO nguoi_dung (${columns.join(',')}) OVERRIDING SYSTEM VALUE
            VALUES (${columns.map((_,i)=>`$${i+1}`).join(',')})`,columns.map(key=>admin[key]))
        await to.query("SELECT setval(pg_get_serial_sequence('nguoi_dung','ma_nguoi_dung'),$1,true)",[admin.ma_nguoi_dung])
        const accounts=[]
        for(const [i,account] of newDemoAccounts.entries()) {
            const id=(await to.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,email,so_dien_thoai,vai_tro)
                VALUES($1,$2,$3,$4,$5) RETURNING ma_nguoi_dung`,
            [account.username,hash,`${account.username}@example.invalid`,`09180000${String(i+1).padStart(2,'0')}`,account.role])).rows[0].ma_nguoi_dung
            if(account.role==='NhanVien') {
                await to.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu,ngay_vao_lam) VALUES($1,$2,$3,CURRENT_DATE)',[id,account.name,account.title])
                if(account.title==='Nhân viên chăm sóc') await to.query(`INSERT INTO ca_lam_viec(ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc,ghi_chu)
                    SELECT $1,CURRENT_DATE+d,TIME '08:00',TIME '19:00','[DEMO] Ca thử nghiệm' FROM generate_series(0,6) d`,[id])
            } else {
                await to.query("INSERT INTO khach_hang(ma_khach_hang,ho_ten,ghi_chu) VALUES($1,$2,'[DEMO] Hồ sơ mới')",[id,account.name])
                await to.query(`INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung,can_nang,ghi_chu_suc_khoe)
                    VALUES($1,$2,$3,5,'[DEMO] Khỏe mạnh')`,[id,`Bé ${account.name}`,i%2?'Chó':'Mèo'])
            }
            accounts.push({...account,id})
        }
        const categories=new Map()
        for(const service of catalog) {
            if(!categories.has(service.ma_loai_dv)) {
                const id=(await to.query("INSERT INTO loai_dv(ten_loai_dv,mo_ta) VALUES($1,'[DEMO] Danh mục giữ lại') RETURNING ma_loai_dv",[service.ten_loai_dv])).rows[0].ma_loai_dv
                categories.set(service.ma_loai_dv,id)
            }
            await to.query(`INSERT INTO dich_vu(ma_loai_dv,ten_dv,mo_ta,gia_hien_hanh,thoi_luong_phut,trang_thai)
                VALUES($1,$2,$3,$4,$5,$6)`,[categories.get(service.ma_loai_dv),service.ten_dv,service.mo_ta,service.gia_hien_hanh,service.thoi_luong_phut,service.trang_thai])
        }
        const saved=(await to.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=$1',[admin.ma_nguoi_dung])).rows[0]
        for(const key of columns) {
            if(!isDeepStrictEqual(saved[key],admin[key])) throw new Error('Admin preservation check failed; no credentials printed.')
        }
        assert.equal((await to.query('SELECT COUNT(*)::int AS n FROM nguoi_dung')).rows[0].n,18)
        const oldNames=(await from.query("SELECT ten_dang_nhap FROM nguoi_dung WHERE vai_tro<>'Admin'")).rows.map(row=>row.ten_dang_nhap)
        assert.equal((await to.query('SELECT 1 FROM nguoi_dung WHERE ten_dang_nhap=ANY($1::text[])',[oldNames])).rowCount,0)
        const businessDate=(await to.query("SELECT to_char(CURRENT_DATE,'YYYY-MM-DD') AS day")).rows[0].day
        await to.query('COMMIT')
        await from.query('COMMIT')
        const manifest={database:target.database,sourceDatabase:source.database,businessDate,profile:'accounts-v2',adminUsername:admin.ten_dang_nhap,
            accounts,careStaff:5,receptionists:5,managers:2,customers:5,shiftDays:7,shifts:35,pets:5,services:catalog.length,
            note:'Previous accounts and business history are kept only in the archived source DB; this active dataset starts fresh.'}
        const cache=new URL('../../.cache/demo/',import.meta.url)
        await mkdir(cache,{recursive:true})
        await writeFile(new URL(`${target.database}.json`,cache),JSON.stringify(manifest,null,2))
        console.log(`[demo] Prepared ${target.database}: 18 accounts (1 preserved Admin, 5 care, 5 reception, 2 managers, 5 customers); 35 shifts; 5 pets. No credentials printed.`)
        return manifest
    } catch(error) {
        if(targetConnected)await to.query('ROLLBACK').catch(()=>{})
        if(sourceConnected)await from.query('ROLLBACK').catch(()=>{})
        throw error
    } finally {
        if(targetConnected)await to.end()
        if(sourceConnected)await from.end()
    }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
    try{await prepareNewDemo()}
    catch(error){console.error(`[demo] ${error.code || error.message}`);process.exitCode=1}
}
