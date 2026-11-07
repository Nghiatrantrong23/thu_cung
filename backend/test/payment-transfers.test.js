import test from 'node:test'
import assert from 'node:assert/strict'
import {transferConfig,transferInstructions} from '../src/lib/paymentTransfers.js'
import {publicError} from '../src/middleware/error.middleware.js'
const settings={PAYMENT_MODE:'transfer',PAYMENT_BANK_CODE:'MB',PAYMENT_BANK_ACCOUNT:'0000000001',PAYMENT_BANK_NAME:'TEST RECIPIENT',PAYMENT_MOMO_PHONE:'0900000001',PAYMENT_MOMO_NAME:'TEST WALLET'}
const config=()=>transferConfig(settings)
test('transfer mode requires explicit configuration and advertises only available methods',()=>{
    assert.equal(transferConfig({}).mode,'unconfigured')
    assert.deepEqual(transferConfig({PAYMENT_MODE:'transfer'}).methods,['COD'])
    assert.deepEqual(config().methods,['BankQR','MoMo','COD'])
    assert.equal(transferConfig({...settings,PAYMENT_BANK_ACCOUNT:'../not-bank'}).bank,null)
    assert.equal(transferConfig({...settings,PAYMENT_MOMO_PHONE:'123'}).momo,null)
})
test('VietQR encodes server-selected VND and distinguishes invoice from deposit',()=>{
    const invoice=transferInstructions({kind:'invoice',id:12,amount:'105000.00',method:'BankQR'},config())
    const url=new URL(invoice.qr)
    assert.equal(url.hostname,'img.vietqr.io');assert.match(url.pathname,/MB-0000000001-compact2\.svg$/)
    assert.equal(url.searchParams.get('amount'),'105000');assert.equal(url.searchParams.get('addInfo'),'PCHD12')
    assert.equal(invoice.status,'AwaitingReceipt');assert.equal(invoice.amount,105000)
    assert.equal(transferInstructions({kind:'deposit',id:12,amount:45000,method:'BankQR'},config()).content,'PCCOC12')
})
test('personal MoMo uses phone and only an exported receive link, never invented QR grammar',()=>{
    const momo=transferInstructions({kind:'invoice',id:1,amount:1000,method:'MoMo'},config())
    assert.equal(momo.phoneNumber,'0900000001');assert.equal(momo.qr,null);assert.equal(momo.receiveUrl,null)
    assert.equal(transferConfig({...settings,PAYMENT_MOMO_RECEIVE_URL:'https://nhantien.momo.vn/actual-link'}).momo.receiveUrl,'https://nhantien.momo.vn/actual-link')
    for(const value of ['javascript:alert(1)','https://nhantien.momo.vn.evil.test/link','https://example.test/qr','https://evil@nhantien.momo.vn/link'])assert.equal(transferConfig({...settings,PAYMENT_MOMO_RECEIVE_URL:value}).momo.receiveUrl,null)
})
test('COD never confirms money received and cannot replace deposit',()=>{
    const result=transferInstructions({kind:'invoice',id:1,amount:1000,method:'COD'},config())
    assert.equal(result.status,'AwaitingCash');assert.equal(result.qr,null)
    assert.throws(()=>transferInstructions({kind:'deposit',id:1,amount:1000,method:'COD'},config()))
})
test('rejects missing configuration, bad IDs, fractional/zero/negative VND and arbitrary methods',()=>{
    const valid={kind:'invoice',id:1,amount:1000,method:'BankQR'}
    assert.throws(()=>transferInstructions(valid,transferConfig({})),error=>error.status===503)
    for(const override of [{id:0},{id:'1'},{kind:'fake'},{amount:0},{amount:-1},{amount:'1.50'},{method:'Stripe'}])assert.throws(()=>transferInstructions({...valid,...override},config()))
})

test('missing payment configuration is a public 503 without exposing other server errors',()=>{
    assert.deepEqual(publicError({status:503,code:'QR_NOT_CONFIGURED',message:'Configure bank'}),{status:503,code:'QR_NOT_CONFIGURED',message:'Configure bank'})
    assert.equal(publicError({status:503,code:'SQL_INTERNAL',message:'private'}).status,500)
})
