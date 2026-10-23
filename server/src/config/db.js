import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

// pg returns NUMERIC as string by default to preserve precision. For this app
// money values fit safely in JS numbers, so parse them to float for convenience.
pg.types.setTypeParser(1700, (value) => (value === null ? null : Number.parseFloat(value)))
// Parse COUNT(*) and other bigint aggregates as Number.
pg.types.setTypeParser(20, (value) => (value === null ? null : Number.parseInt(value, 10)))

const poolConfig = env.db.connectionString
    ? { connectionString: env.db.connectionString, ssl: env.db.ssl }
    : {
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
        user: env.db.user,
        password: env.db.password,
        ssl: env.db.ssl,
    }

export const pool = new Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
})

pool.on('error', (err) => {
    // Unexpected error on an idle client; log rather than crash.
    console.error('[db] unexpected idle client error:', err)
})

export function query(text, params) {
    return pool.query(text, params)
}

/** Run a callback inside a transaction, rolling back on any thrown error. */
export async function withTransaction(fn) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await fn(client)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

export async function testConnection() {
    const { rows } = await pool.query('SELECT NOW() AS now')
    return rows[0].now
}

export async function closePool() {
    await pool.end()
}
