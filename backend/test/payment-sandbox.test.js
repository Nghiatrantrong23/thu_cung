import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { sandboxAllowed, callbackSignature, validCallback } from '../src/lib/paymentSandbox.js'

test('sandbox requires test environment, exact database opt-in and test naming',()=>{
    const env={NODE_ENV:'test',PAYMENT_MODE:'sandbox',PETCARE_PAYMENT_SANDBOX_DB:'petcare_test_payments'}
    assert.equal(sandboxAllowed(env,'petcare_test_payments'),true)
    for(const change of [{NODE_ENV:'production'},{NODE_ENV:'development'},{PAYMENT_MODE:'live'},{PETCARE_PAYMENT_SANDBOX_DB:'other'}]) {
        assert.equal(sandboxAllowed({...env,...change},'petcare_test_payments'),false)
    }
    assert.equal(sandboxAllowed({...env,PETCARE_PAYMENT_SANDBOX_DB:'dich_vu_thu_cung'},'dich_vu_thu_cung'),false)
    assert.equal(sandboxAllowed({...env,DB_HOST:'remote.example.invalid'},'petcare_test_payments'),false)
    assert.equal(sandboxAllowed({...env,DATABASE_URL:'postgres://local@127.0.0.1/petcare_test_payments'},'petcare_test_payments'),true)
    assert.equal(sandboxAllowed({...env,DATABASE_URL:'postgres://local@127.0.0.1/other'},'petcare_test_payments'),false)
})
test('signed callback rejects tampered money, method, result, malformed or unsigned payloads',()=>{
    const body={intentId:randomUUID(),eventId:'sandbox:valid-event',method:'MoMo',amount:150000,result:'success'}
    const signature=callbackSignature(body,'fixture-secret')
    assert.equal(validCallback(body,signature,'fixture-secret'),true)
    for(const change of [{amount:1},{method:'BankQR'},{result:'failed'},{eventId:'other-event'}]) assert.equal(validCallback({...body,...change},signature,'fixture-secret'),false)
    for(const bad of [null,[],{}, {...body,amount:'150000'}, {...body,amount:1.5}, {...body,method:'COD'}]) assert.equal(validCallback(bad,signature,'fixture-secret'),false)
    for(const bad of [undefined,'',signature.toUpperCase(),'x'.repeat(64)]) assert.equal(validCallback(body,bad,'fixture-secret'),false)
})
