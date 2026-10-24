import pg from 'pg'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
export const DATABASE_LOCK = 742640201

/** CLI tools deliberately do not load .env: write targets must be explicit. */
export function getSafeConfig(env = process.env) {
    if (!['development', 'test'].includes(env.NODE_ENV)) {
        throw new Error('Set NODE_ENV=development or test explicitly. Production writes are disabled.')
    }
    let config
    if (env.DATABASE_URL) {
        let url
        try { url = new URL(env.DATABASE_URL) } catch { throw new Error('DATABASE_URL is invalid.') }
        if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must use PostgreSQL.')
        config = {
            host: url.hostname.replace(/^\[|\]$/g, ''), port: Number(url.port || 5432),
            database: decodeURIComponent(url.pathname.slice(1)),
            user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
        }
        if (url.search || url.hash) throw new Error('Use a local DATABASE_URL without query/hash options for DB tooling.')
    } else {
        config = {
            host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 5432),
            database: env.DB_NAME, user: env.DB_USER || 'postgres', password: env.DB_PASSWORD || '',
        }
    }
    if (!localHosts.has(config.host)) throw new Error('DB tooling accepts local loopback hosts only.')
    if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('Invalid database port.')
    if (!/^[a-z][a-z0-9_]*_(?:dev|test)(?:_[a-z0-9_]+)?$/.test(config.database || '') || config.database.length > 63) {
        throw new Error('Use an explicit separate database named <project>_dev or <project>_test[_suffix].')
    }
    if (env.PETCARE_ALLOW_DB_WRITE !== config.database) {
        throw new Error('Set PETCARE_ALLOW_DB_WRITE to the exact development/test database name to opt in.')
    }
    return { ...config, connectionTimeoutMillis: 10_000, application_name: 'petcare-db-tooling' }
}

export function checksum(sql) {
    return createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex')
}

export async function loadMigrations(directory = root) {
    const base = await readFile(path.join(directory, 'thu_cung.sql'), 'utf8')
    const names = (await readdir(path.join(directory, 'migrations')))
        .filter((name) => /^\d{3}_[a-zA-Z0-9_-]+\.sql$/.test(name)).sort()
    const migrations = [{ version: '000', name: 'thu_cung.sql', sql: base, checksum: checksum(base) }]
    for (const name of names) {
        const version = name.slice(0, 3)
        if (migrations.some((item) => item.version === version)) throw new Error(`Duplicate migration version ${version}.`)
        const sql = await readFile(path.join(directory, 'migrations', name), 'utf8')
        migrations.push({ version, name, sql, checksum: checksum(sql) })
    }
    return migrations
}

export function validateHistory(history, migrations) {
    for (let i = 0; i < history.length; i += 1) {
        const recorded = history[i]
        const source = migrations[i]
        if (!source || source.version !== recorded.version || source.name !== recorded.name || source.checksum !== recorded.checksum) {
            throw new Error('Migration history differs from SQL sources. Stop and audit; no SQL will be reapplied.')
        }
    }
}

/** One transaction and one advisory lock cover both schema and its history. */
export async function migrateDatabase(client, migrations) {
    await client.query('BEGIN')
    try {
        await client.query('SELECT pg_advisory_xact_lock($1)', [DATABASE_LOCK])
        await client.query('SET LOCAL search_path TO public')
        const { rows: tables } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        const hasHistory = tables.some((item) => item.tablename === 'petcare_schema_migrations')
        const history = hasHistory
            ? (await client.query('SELECT version, name, checksum FROM petcare_schema_migrations ORDER BY version')).rows
            : []
        if (history.length === 0 && tables.some((item) => item.tablename !== 'petcare_schema_migrations')) {
            throw new Error('Existing schema has no migration history. Audit/baseline it separately; use a new dev/test database for automatic setup.')
        }
        validateHistory(history, migrations)
        await client.query(`CREATE TABLE IF NOT EXISTS petcare_schema_migrations (
            version VARCHAR(3) PRIMARY KEY, name TEXT NOT NULL, checksum CHAR(64) NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`)
        const applied = []
        for (const migration of migrations.slice(history.length)) {
            await client.query(migration.sql)
            await client.query('INSERT INTO petcare_schema_migrations(version, name, checksum) VALUES ($1,$2,$3)',
                [migration.version, migration.name, migration.checksum])
            applied.push(migration.name)
        }
        await client.query('COMMIT')
        return applied
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    }
}

export async function ensureDatabase(config) {
    const admin = new pg.Client({ ...config, database: 'postgres' })
    try {
        await admin.connect()
        const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [config.database])
        if (rows.length === 0) {
            // Name restricted to lowercase alphanumerics and underscores by getSafeConfig.
            try { await admin.query(`CREATE DATABASE "${config.database}"`) }
            catch (error) { if (error.code !== '42P04') throw error }
        }
    } finally { await admin.end() }
}

export async function runCommand(command, args = []) {
    let client
    try {
        if (args.some((arg) => arg !== '--seed') || (command !== 'init' && args.length)) {
            throw new Error('Unknown arguments. db:init accepts only optional --seed.')
        }
        const config = getSafeConfig()
        const seed = args.includes('--seed') ? await import('./seed.js') : null
        if (seed) seed.validateDemoPassword(process.env.PETCARE_DEMO_PASSWORD)
        if (command === 'init') await ensureDatabase(config)
        client = new pg.Client(config)
        await client.connect()
        const applied = await migrateDatabase(client, await loadMigrations())
        console.log(`[db:${command}] Migration succeeded (${applied.length} applied).`)
        if (seed) {
            const result = await seed.seedDatabase(client, process.env.PETCARE_DEMO_PASSWORD)
            console.log(`[db:init] Demo seed succeeded (${result.accounts} accounts, ${result.services} services, ${result.pets} pets, ${result.shiftDays} shift days). Passwords are never printed.`)
        }
    } catch (error) {
        // PostgreSQL errors can contain connection strings, SQL values and hashes.
        const message = error.code ? `Database operation failed (${error.code}); transaction rolled back. Inspect server diagnostics privately.` : error.message
        console.error(`[db:${command}] ${message}`)
        process.exitCode = 1
    } finally { if (client) await client.end() }
}
