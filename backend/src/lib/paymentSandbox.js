import { createHmac, timingSafeEqual } from 'node:crypto'

export function sandboxAllowed(env, database) {
    let host=env.DB_HOST || 'localhost'
    if(env.DATABASE_URL) {
        try {
            const url=new URL(env.DATABASE_URL)
            if(!['postgres:','postgresql:'].includes(url.protocol) || url.search || url.hash) return false
            host=url.hostname
            if(decodeURIComponent(url.pathname.slice(1))!==database) return false
        } catch { return false }
    }
    return env.NODE_ENV === 'test' && env.PAYMENT_MODE === 'sandbox'
        && ['localhost','127.0.0.1','::1','[::1]'].includes(host)
        && /^petcare_test_[a-z0-9_]+$/.test(database)
        && env.PETCARE_PAYMENT_SANDBOX_DB === database
}

export function callbackSignature(body, secret) {
    return createHmac('sha256', secret).update(JSON.stringify([
        body.intentId, body.eventId, body.method, body.amount, body.result,
    ])).digest('hex')
}

export function validCallback(body, signature, secret) {
    if (!body || typeof body !== 'object' || Array.isArray(body)
        || !/^[a-f0-9-]{36}$/.test(body.intentId || '')
        || typeof body.eventId !== 'string' || !/^[A-Za-z0-9:-]{10,100}$/.test(body.eventId)
        || !['BankQR','MoMo'].includes(body.method)
        || !Number.isSafeInteger(body.amount) || body.amount <= 0
        || !['success','failed'].includes(body.result)
        || typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) return false
    return timingSafeEqual(Buffer.from(signature,'hex'), Buffer.from(callbackSignature(body,secret),'hex'))
}
