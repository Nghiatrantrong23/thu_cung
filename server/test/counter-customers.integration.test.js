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
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test('counter customer and pet profiles on an isolated PostgreSQL database', {
    skip: !testUrl && 'Set TEST_DATABASE_URL to a fresh dedicated test database.', timeout: 90000,
}, async () => {
    const database = decodeURIComponent(new URL(testUrl).pathname.slice(1))
    assert.match(database, /^[a-z][a-z0-9_]*_test_[a-z0-9_]+$/)
    const config = getSafeConfig({ NODE_ENV: 'test', DATABASE_URL: testUrl, PETCARE_ALLOW_DB_WRITE: database })
    await ensureDatabase(config)
    const db = new pg.Client(config)
    let child
    await db.connect()
    try {
        const existing = await db.query(`SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' LIMIT 1`)
        assert.equal(existing.rowCount, 0, 'Use a fresh empty test database.')
        await migrateDatabase(db, await loadMigrations())
        const password = randomBytes(24).toString('base64url')
        const hash = await bcrypt.hash(password, 4)
        const staff = (await db.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,vai_tro)
            VALUES ('fixture_reception',$1,'NhanVien') RETURNING ma_nguoi_dung`, [hash])).rows[0].ma_nguoi_dung
        await db.query("INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,'Fixture Reception','Lễ tân')", [staff])
        const carer = (await db.query(`INSERT INTO nguoi_dung(ten_dang_nhap,mat_khau_hash,vai_tro)
            VALUES ('fixture_care',$1,'NhanVien') RETURNING ma_nguoi_dung`, [hash])).rows[0].ma_nguoi_dung
        await db.query("INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,'Fixture Care','Nhân viên chăm sóc')", [carer])
        const secret = randomBytes(48).toString('hex')
        const socket = createServer()
        await new Promise((resolve, reject) => socket.once('error', reject).listen(0, '127.0.0.1', resolve))
        const port = socket.address().port
        await new Promise(resolve => socket.close(resolve))
        child = spawn(process.execPath, ['src/server.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'ignore',
            env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test', PORT: String(port), DB_SSL: 'false', JWT_SECRET: secret, JWT_REFRESH_SECRET: secret, BCRYPT_ROUNDS: '4' } })
        const base = `http://127.0.0.1:${port}`
        let ready = false
        for (let i = 0; i < 150; i++) {
            if (child.exitCode != null) throw new Error('Test server exited before ready.')
            try { ready = (await fetch(`${base}/ready`)).ok } catch { /* Starting. */ }
            if (ready) break
            await delay(100)
        }
        assert.ok(ready, 'Test server did not become ready.')
        async function call(path, method = 'GET', body, actor = staff) {
            const token = jwt.sign({ type: 'access', version: 0, userId: actor }, secret, { expiresIn: '5m' })
            const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body == null ? undefined : JSON.stringify(body) })
            return { status: response.status, body: await response.json() }
        }
        const create = await call('/api/khach-hang/tai-quay', 'POST', { fullName: 'Khách Tại Quầy', phone: '0901234567', email: 'counter@example.test' })
        assert.equal(create.status, 201)
        const id = create.body.customer.id
        assert.equal(create.body.customer.loginActive, false)
        const account = (await db.query('SELECT mat_khau_hash,kich_hoat_dang_nhap FROM nguoi_dung WHERE ma_nguoi_dung=$1', [id])).rows[0]
        assert.equal(account.mat_khau_hash, null)
        assert.equal(account.kich_hoat_dang_nhap, false)
        assert.equal((await call('/api/auth/dang-nhap', 'POST', { tenDangNhap: '0901234567', matKhau: password })).status, 401)
        assert.equal((await call('/api/khach-hang/tai-quay', 'POST', { fullName: 'Trùng', phone: '0901234567' })).status, 409)
        assert.equal((await call('/api/khach-hang/tai-quay', 'POST', { fullName: 'Không quyền', phone: '0901234568' }, carer)).status, 403)
        const pet = await call(`/api/khach-hang/${id}/thu-cung`, 'POST', { name: 'Mướp', species: 'Mèo', vaccination: 'DaTiem', allergy: 'Cá', temperament: 'Nhút nhát' })
        assert.equal(pet.status, 201)
        assert.equal((await call(`/api/khach-hang/${id}/thu-cung`, 'POST', { name: 'mướp', species: 'Mèo' })).status, 409)
        const pets = await call(`/api/khach-hang/${id}/thu-cung`)
        assert.equal(pets.body.total, 1)
        assert.equal(pets.body.items[0].allergy, 'Cá')
        const secondPet = await call(`/api/khach-hang/${id}/thu-cung`, 'POST', { name: 'Bông', species: 'Chó' })
        assert.equal(secondPet.status, 201)
        assert.equal((await call(`/api/khach-hang/${id}/thu-cung`)).body.total, 2)
        const appointment = (await db.query(`INSERT INTO lich_hen(ma_thu_cung,ngay_gio_hen,ngay_gio_ket_thuc_du_kien)
            VALUES($1,'2030-01-01 10:00','2030-01-01 10:30') RETURNING ma_lich_hen`, [pet.body.petId])).rows[0].ma_lich_hen
        const invoice = (await db.query(`INSERT INTO hoa_don(ma_lich_hen,tong_tien,thanh_tien)
            VALUES($1,100000,100000) RETURNING ma_hoa_don`, [appointment])).rows[0].ma_hoa_don
        await db.query(`INSERT INTO khieu_nai(ma_lich_hen,ma_hoa_don,noi_dung,nguoi_tiep_nhan)
            VALUES($1,$2,'Fixture complaint',$3)`, [appointment, invoice, staff])
        assert.equal((await call(`/api/khach-hang?loai=ma-lich&tim=${appointment}`)).body.customers[0].id, id)
        for (const section of ['lich-hen','hoa-don','khieu-nai']) {
            const history = await call(`/api/khach-hang/${id}/${section}`)
            assert.equal(history.status, 200)
            assert.equal(history.body.total, 1)
        }
        assert.equal((await call(`/api/khach-hang/${id}/khieu-nai`, 'GET', undefined, carer)).status, 403)
        for (const [kind, term] of [['ten','Khách'],['sdt','0901234567'],['email','counter@example.test'],['thu-cung','Mướp']]) {
            const result = await call(`/api/khach-hang?loai=${kind}&tim=${encodeURIComponent(term)}`)
            assert.equal(result.status, 200)
            assert.equal(result.body.customers[0].id, id)
            assert.ok(!JSON.stringify(result.body).includes('mat_khau_hash'))
        }
        const audit = (await db.query('SELECT loai_doi_tuong,ma_nguoi_thuc_hien FROM nhat_ky_ho_so ORDER BY ma_nhat_ky')).rows
        assert.deepEqual(audit.map(row => row.loai_doi_tuong), ['KhachHang','ThuCung','ThuCung'])
        assert.ok(audit.every(row => row.ma_nguoi_thuc_hien === staff))
        await db.query('UPDATE nguoi_dung SET trang_thai=false WHERE ma_nguoi_dung=$1', [id])
        assert.equal((await call(`/api/khach-hang/${id}/thu-cung`, 'POST', { name: 'Không thêm', species: 'Mèo' })).status, 409)
    } finally {
        if (child) { child.kill(); await delay(250) }
        await db.end()
    }
})
