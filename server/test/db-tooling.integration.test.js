import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { ensureDatabase, getSafeConfig, loadMigrations, migrateDatabase } from '../scripts/db-tooling.js'
import { seedDatabase } from '../scripts/seed.js'

// Must point at an isolated cluster. Never load the project's .env or drop data.
const testUrl = process.env.TEST_DATABASE_URL

test('database tooling on isolated PostgreSQL', { skip: !testUrl }, async (t) => {
    const url = new URL(testUrl)
    const database = decodeURIComponent(url.pathname.slice(1))
    const config = getSafeConfig({ NODE_ENV: 'test', DATABASE_URL: testUrl, PETCARE_ALLOW_DB_WRITE: database })
    assert.match(database, /^petcare_test_/)
    await ensureDatabase(config)
    const client = new pg.Client(config)
    await client.connect()
    const sources = await loadMigrations()
    const password = randomBytes(24).toString('base64url')
    try {
        await t.test('new database gets business tables, care audit and version history; rerun is a no-op', async () => {
            assert.equal((await migrateDatabase(client, sources)).length, sources.length)
            const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")
            assert.equal(rows.length, 17)
            assert.ok(rows.some((row) => row.tablename === 'petcare_schema_migrations'))
            assert.deepEqual(await migrateDatabase(client, sources), [])
        })

        await t.test('seed covers five groups and reruns without duplicates or password resets', async () => {
            // Sequence offsets prove fixture FKs do not assume generated IDs begin at 1.
            await client.query("SELECT setval(pg_get_serial_sequence('nguoi_dung','ma_nguoi_dung'), 40)")
            await seedDatabase(client, password)
            const before = (await client.query('SELECT ma_nguoi_dung,ten_dang_nhap,mat_khau_hash FROM nguoi_dung ORDER BY ma_nguoi_dung')).rows
            assert.equal(before.length, 7)
            assert.ok(before.every((row) => row.ma_nguoi_dung > 40))
            assert.ok(await bcrypt.compare(password, before[0].mat_khau_hash))
            await seedDatabase(client, randomBytes(24).toString('base64url'))
            const after = (await client.query('SELECT ma_nguoi_dung,ten_dang_nhap,mat_khau_hash FROM nguoi_dung ORDER BY ma_nguoi_dung')).rows
            assert.deepEqual(after, before)
            const { rows: groups } = await client.query(`SELECT DISTINCT COALESCE(nv.chuc_vu,nd.vai_tro) AS permission_group
                FROM nguoi_dung nd LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien=nd.ma_nguoi_dung`)
            assert.equal(groups.length, 5)
            const { rows: totals } = await client.query(`SELECT
                (SELECT COUNT(*) FROM thu_cung)::int AS pets,
                (SELECT COUNT(*) FROM dich_vu)::int AS services,
                (SELECT COUNT(*) FROM ca_lam_viec)::int AS shifts,
                (SELECT COUNT(*) FROM nguoi_dung WHERE NOT trang_thai)::int AS locked`)
            assert.deepEqual(totals[0], { pets: 2, services: 3, shifts: 14, locked: 1 })
        })

        await t.test('failed migration rolls back its DDL and history; checksum mismatch refuses', async () => {
            const failed = { version: '998', name: '998_deliberate_failure.sql', checksum: 'failure', sql: 'CREATE TABLE migration_rollback_probe(id INT); SELECT 1/0;' }
            await assert.rejects(migrateDatabase(client, [...sources, failed]), (error) => error.code === '22012')
            assert.equal((await client.query("SELECT to_regclass('public.migration_rollback_probe') AS name")).rows[0].name, null)
            assert.equal((await client.query('SELECT COUNT(*)::int AS total FROM petcare_schema_migrations')).rows[0].total, sources.length)
            const modified = sources.map((source, index) => index === 0 ? { ...source, checksum: 'changed' } : source)
            await assert.rejects(migrateDatabase(client, modified), /history differs/)
            assert.deepEqual(await migrateDatabase(client, sources), [])
        })

        await t.test('PK/FK/CHECK/UNIQUE restrictions reject invalid data without persisting fixtures', async () => {
            const pet = (await client.query('SELECT ma_thu_cung FROM thu_cung LIMIT 1')).rows[0].ma_thu_cung
            const customer = (await client.query('SELECT ma_khach_hang FROM khach_hang LIMIT 1')).rows[0].ma_khach_hang
            const staff = (await client.query("SELECT ma_nhan_vien FROM nhan_vien WHERE chuc_vu='Nhân viên chăm sóc' LIMIT 1")).rows[0].ma_nhan_vien
            const service = (await client.query('SELECT ma_dv FROM dich_vu LIMIT 1')).rows[0].ma_dv
            async function rejectsSql(code, sql, values = []) {
                await client.query('BEGIN')
                try { await assert.rejects(client.query(sql, values), (error) => error.code === code) }
                finally { await client.query('ROLLBACK') }
            }
            await rejectsSql('23505', 'INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES ($1,$2)', [customer, 'Duplicate'])
            await rejectsSql('23503', 'INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung) VALUES (-999,$1,$2)', ['FK probe', 'Chó'])
            await rejectsSql('23514', 'INSERT INTO thu_cung(ma_khach_hang,ten_thu_cung,loai_thu_cung,can_nang) VALUES ($1,$2,$3,-1)', [customer, 'Weight probe', 'Chó'])
            await rejectsSql('23514', "UPDATE dich_vu SET thoi_luong_phut=0 WHERE ma_dv=$1", [service])
            await rejectsSql('23514', "UPDATE dich_vu SET gia_hien_hanh=-1 WHERE ma_dv=$1", [service])
            await rejectsSql('23514', "UPDATE nguoi_dung SET vai_tro='Invalid' WHERE ma_nguoi_dung=$1", [customer])
            await rejectsSql('23514', "UPDATE nhan_vien SET chuc_vu='Invalid' WHERE ma_nhan_vien=$1", [staff])
            for (const column of ['ten_dang_nhap', 'email', 'so_dien_thoai']) {
                await rejectsSql('23505', `UPDATE nguoi_dung SET ${column}=(SELECT ${column} FROM nguoi_dung WHERE ma_nguoi_dung=$1) WHERE ma_nguoi_dung=$2`, [customer, staff])
            }
            await client.query('BEGIN')
            try {
                // Nullable optional emails remain valid on several accounts.
                await client.query('UPDATE nguoi_dung SET email=NULL WHERE ma_nguoi_dung IN ($1,$2)', [customer, staff])
                const { rows } = await client.query(`INSERT INTO lich_hen(ma_thu_cung,ma_nhan_vien,ngay_gio_hen,ngay_gio_ket_thuc_du_kien)
                    VALUES ($1,$2,CURRENT_DATE+TIME '09:00',CURRENT_DATE+TIME '10:00') RETURNING ma_lich_hen`, [pet, staff])
                const appointment = rows[0].ma_lich_hen
                await client.query('SAVEPOINT invalid_detail')
                await assert.rejects(client.query('INSERT INTO chi_tiet_lich_hen(ma_lich_hen,ma_dv,so_luong,gia_du_kien) VALUES ($1,$2,0,100)', [appointment, service]), (error) => error.code === '23514')
                await client.query('ROLLBACK TO SAVEPOINT invalid_detail')
                await client.query('SAVEPOINT invalid_stars')
                await assert.rejects(client.query('INSERT INTO danh_gia(ma_lich_hen,so_sao) VALUES ($1,6)', [appointment]), (error) => error.code === '23514')
                await client.query('ROLLBACK TO SAVEPOINT invalid_stars')
                // Adjacent schedules are allowed; an actual overlap returns exclusion violation.
                await client.query(`INSERT INTO lich_hen(ma_thu_cung,ma_nhan_vien,ngay_gio_hen,ngay_gio_ket_thuc_du_kien)
                    VALUES ($1,$2,CURRENT_DATE+TIME '10:00',CURRENT_DATE+TIME '11:00')`, [pet, staff])
                await client.query('SAVEPOINT overlap')
                await assert.rejects(client.query(`INSERT INTO lich_hen(ma_thu_cung,ma_nhan_vien,ngay_gio_hen,ngay_gio_ket_thuc_du_kien)
                    VALUES ($1,$2,CURRENT_DATE+TIME '09:30',CURRENT_DATE+TIME '10:30')`, [pet, staff]), (error) => error.code === '23P01')
                await client.query('ROLLBACK TO SAVEPOINT overlap')
                await client.query('SAVEPOINT shift_overlap')
                await assert.rejects(client.query(`INSERT INTO ca_lam_viec(ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc)
                    VALUES ($1,(SELECT MIN(ngay) FROM ca_lam_viec WHERE ma_nhan_vien=$1 AND trang_thai=true),TIME '09:00',TIME '10:00')`, [staff]), (error) => error.code === '23P01')
            } finally { await client.query('ROLLBACK') }
            assert.equal((await client.query('SELECT COUNT(*)::int AS total FROM lich_hen')).rows[0].total, 0)
        })

        await t.test('legacy database without migration history is refused and preserved', async () => {
            const legacyConfig = { ...config, database: `${database}_legacy` }
            await ensureDatabase(legacyConfig)
            const legacy = new pg.Client(legacyConfig)
            try {
                await legacy.connect()
                await legacy.query('CREATE TABLE existing_fixture (id INT PRIMARY KEY)')
                await assert.rejects(migrateDatabase(legacy, sources), /no migration history/)
                const { rows } = await legacy.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")
                assert.deepEqual(rows.map((row) => row.tablename), ['existing_fixture'])
            } finally { await legacy.end() }
        })

        await t.test('CLI setup/migrate/seed execute safely and never print supplied credentials', async () => {
            const cliDatabase = `${database}_cli`
            const cliUrl = new URL(testUrl)
            cliUrl.pathname = `/${cliDatabase}`
            const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: cliUrl.href,
                PETCARE_ALLOW_DB_WRITE: cliDatabase, PETCARE_DEMO_PASSWORD: password }
            for (const [script, args] of [['init-db.js', ['--seed']], ['migrate.js', []], ['seed.js', []]]) {
                const result = spawnSync(process.execPath, [`scripts/${script}`, ...args], {
                    cwd: new URL('../', import.meta.url), env, encoding: 'utf8', timeout: 30_000,
                })
                assert.equal(result.status, 0, result.stderr)
                assert.ok(!result.stdout.includes(password) && !result.stderr.includes(password))
                if (script === 'migrate.js') assert.match(result.stdout, /0 applied/)
            }
        })

        await t.test('concurrent migration runners serialize instead of applying SQL twice', async () => {
            const concurrentConfig = { ...config, database: `${database}_parallel` }
            await ensureDatabase(concurrentConfig)
            const clients = [new pg.Client(concurrentConfig), new pg.Client(concurrentConfig)]
            try {
                await Promise.all(clients.map((connection) => connection.connect()))
                const results = await Promise.all(clients.map((connection) => migrateDatabase(connection, sources)))
                assert.deepEqual(results.map((result) => result.length).sort(), [0, sources.length])
                const { rows } = await clients[0].query('SELECT COUNT(*)::int AS total FROM petcare_schema_migrations')
                assert.equal(rows[0].total, sources.length)
            } finally { await Promise.all(clients.map((connection) => connection.end())) }
        })
    } finally { await client.end() }
})
