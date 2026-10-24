import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { checksum, getSafeConfig, loadMigrations, migrateDatabase, validateHistory } from '../scripts/db-tooling.js'
import { demoAccounts, validateDemoPassword } from '../scripts/seed.js'

const safeEnv = { NODE_ENV: 'test', DB_NAME: 'petcare_test_unit', PETCARE_ALLOW_DB_WRITE: 'petcare_test_unit' }

test('DB tooling requires an explicit nonproduction environment and exact opt-in', () => {
    assert.throws(() => getSafeConfig({}), /NODE_ENV/)
    assert.throws(() => getSafeConfig({ ...safeEnv, NODE_ENV: 'production' }), /Production/)
    assert.throws(() => getSafeConfig({ ...safeEnv, PETCARE_ALLOW_DB_WRITE: 'yes' }), /exact/)
    assert.throws(() => getSafeConfig({ ...safeEnv, DB_NAME: 'dich_vu_thu_cung' }), /separate/)
    assert.throws(() => getSafeConfig({ ...safeEnv, DB_NAME: 'test' }), /separate/)
    assert.equal(getSafeConfig(safeEnv).database, 'petcare_test_unit')
})

test('DB tooling rejects hosted targets and URL options; validates the effective URL target', () => {
    assert.throws(() => getSafeConfig({ ...safeEnv, DB_HOST: 'db.example.com' }), /loopback/)
    assert.throws(() => getSafeConfig({ ...safeEnv, DATABASE_URL: 'postgres://localhost/production' }), /separate/)
    assert.throws(() => getSafeConfig({ ...safeEnv, DATABASE_URL: 'postgres://localhost/petcare_test_unit?host=db.example.com' }), /options/)
    assert.throws(() => getSafeConfig({ ...safeEnv, DB_PORT: 'abc' }), /port/)
    const config = getSafeConfig({ ...safeEnv, DATABASE_URL: 'postgres://demo:p%40ss@localhost:5433/petcare_test_unit' })
    assert.equal(config.port, 5433)
    assert.equal(config.password, 'p@ss')
})

test('checksums ignore platform line endings but detect SQL changes', async () => {
    assert.equal(checksum('select 1;\r\n'), checksum('select 1;\n'))
    assert.notEqual(checksum('select 1;'), checksum('select 2;'))
    const sources = await loadMigrations()
    assert.equal(sources[0].version, '000')
    assert.equal(sources[1].version, '001')
    assert.match(sources[0].sql, /CREATE TABLE nguoi_dung/)
})

test('history must be an unchanged prefix; unknown/out-of-order SQL refuses execution', () => {
    const a = { version: '000', name: 'base.sql', checksum: 'a' }
    const b = { version: '001', name: 'one.sql', checksum: 'b' }
    assert.doesNotThrow(() => validateHistory([a], [a, b]))
    assert.throws(() => validateHistory([b], [a, b]), /history differs/)
    assert.throws(() => validateHistory([{ ...a, checksum: 'changed' }], [a]), /history differs/)
    assert.throws(() => validateHistory([a, b], [a]), /history differs/)
})

function fakeClient({ tables = [], history = [], failOn } = {}) {
    const calls = []
    return { calls, async query(sql, params) {
        calls.push({ sql, params })
        if (sql === failOn) throw new Error('simulated SQL failure')
        if (sql.startsWith('SELECT tablename')) return { rows: tables.map((tablename) => ({ tablename })) }
        if (sql.startsWith('SELECT version')) return { rows: history }
        return { rows: [] }
    } }
}

test('migration runs schema and history under one transaction and advisory lock', async () => {
    const client = fakeClient()
    const sources = [{ version: '000', name: 'base.sql', checksum: 'x', sql: 'BASE SQL' }]
    assert.deepEqual(await migrateDatabase(client, sources), ['base.sql'])
    assert.equal(client.calls[0].sql, 'BEGIN')
    assert.match(client.calls[1].sql, /advisory_xact_lock/)
    const sql = client.calls.map((entry) => entry.sql)
    assert.ok(sql.indexOf('BASE SQL') < sql.findIndex((entry) => entry.startsWith('INSERT INTO petcare_schema_migrations')))
    assert.equal(sql.at(-1), 'COMMIT')
})

test('migration reruns skip previously recorded schema and SQL', async () => {
    const source = { version: '000', name: 'base.sql', checksum: 'x', sql: 'BASE SQL' }
    const client = fakeClient({ tables: ['petcare_schema_migrations', 'nguoi_dung'], history: [source] })
    assert.deepEqual(await migrateDatabase(client, [source]), [])
    assert.ok(!client.calls.some((call) => call.sql === source.sql))
})

test('legacy schema and checksum mismatch roll back without applying any source SQL', async () => {
    const source = { version: '000', name: 'base.sql', checksum: 'x', sql: 'BASE SQL' }
    for (const client of [
        fakeClient({ tables: ['nguoi_dung'] }),
        fakeClient({ tables: ['petcare_schema_migrations'], history: [{ ...source, checksum: 'edited' }] }),
    ]) {
        await assert.rejects(migrateDatabase(client, [source]))
        assert.equal(client.calls.at(-1).sql, 'ROLLBACK')
        assert.ok(!client.calls.some((call) => call.sql === source.sql))
    }
})

test('SQL failure rolls back instead of recording success or continuing', async () => {
    const client = fakeClient({ failOn: 'BROKEN SQL' })
    const sources = [
        { version: '000', name: 'base.sql', checksum: 'x', sql: 'BROKEN SQL' },
        { version: '001', name: 'next.sql', checksum: 'y', sql: 'NEXT SQL' },
    ]
    await assert.rejects(migrateDatabase(client, sources), /simulated/)
    assert.equal(client.calls.at(-1).sql, 'ROLLBACK')
    assert.ok(!client.calls.some((call) => call.sql === 'NEXT SQL' || call.sql === 'COMMIT'))
})

test('demo fixture covers all five permission groups and has no hard-coded password', () => {
    const groups = new Set(demoAccounts.map((account) => account.title || account.role))
    assert.equal(groups.size, 5)
    assert.ok(demoAccounts.some((account) => account.locked))
    assert.ok(demoAccounts.every((account) => !('pass' in account) && !('password' in account)))
    assert.throws(() => validateDemoPassword(undefined), /PETCARE_DEMO_PASSWORD/)
    assert.throws(() => validateDemoPassword('short'), /12/)
    assert.throws(() => validateDemoPassword('😀'.repeat(20)), /72/)
    assert.equal(validateDemoPassword('private-test-value-1234'), 'private-test-value-1234')
})

test('unsafe CLI and reset refuse without database access or loading configured .env', () => {
    const env = { ...process.env, NODE_ENV: 'production' }
    for (const script of ['init-db.js', 'migrate.js', 'seed.js', 'reset-db.js']) {
        const result = spawnSync(process.execPath, [`scripts/${script}`], { cwd: new URL('../', import.meta.url), env, encoding: 'utf8' })
        assert.equal(result.status, 1, script)
        assert.match(result.stderr, /Production writes are disabled|Disabled/)
        assert.doesNotMatch(result.stderr, /password=|postgres:\/\//)
    }
})
