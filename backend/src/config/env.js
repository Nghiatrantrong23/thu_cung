import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const explicitDepositFlag=process.env.BOOKING_DEPOSIT_ENABLED
const explicitPaymentMode=process.env.PAYMENT_MODE
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
// A local development .env must not change opt-in behavior of isolated tests.
if(process.env.NODE_ENV==='test'&&explicitDepositFlag===undefined)process.env.BOOKING_DEPOSIT_ENABLED='false'
if(process.env.NODE_ENV==='test'&&explicitPaymentMode===undefined)process.env.PAYMENT_MODE='disabled'

function required(name, fallback = undefined) {
    const value = process.env[name] ?? fallback
    if (value === undefined || value === '') {
        throw new Error(`Missing required environment variable: ${name}`)
    }
    return value
}

export const env = {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    bookingDepositEnabled: process.env.BOOKING_DEPOSIT_ENABLED === 'true',
    isProd: process.env.NODE_ENV === 'production',

    db: {
        host: required('DB_HOST', 'localhost'),
        port: Number(process.env.DB_PORT || 5432),
        database: required('DB_NAME', 'dich_vu_thu_cung'),
        user: required('DB_USER', 'postgres'),
        password: process.env.DB_PASSWORD ?? '',
        // For hosted providers (Neon, Supabase...) set DATABASE_URL to override.
        connectionString: process.env.DATABASE_URL || undefined,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },

    jwt: {
        secret: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

    bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
}
