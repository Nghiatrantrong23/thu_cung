import test from 'node:test'
import assert from 'node:assert/strict'
import {depositAmount,cancellationOutcome} from '../src/lib/depositPolicy.js'
test('deposit is 30 percent rounded up to whole VND, never binary money',()=>{
    assert.equal(depositAmount(80000000),24000000)
    assert.equal(depositAmount(15000000),4500000)
    assert.equal(depositAmount(10001),3100)
})
test('24 hour cutoff is inclusive; late reschedule does not reset refund entitlement',()=>{
    const now=new Date('2026-10-25T08:00:00Z')
    assert.equal(cancellationOutcome({paid:true,start:'2026-10-26T15:00:00+07:00',now}),'RefundPending')
    assert.equal(cancellationOutcome({paid:true,start:'2026-10-26T14:59:59+07:00',now}),'Forfeited')
    assert.equal(cancellationOutcome({paid:true,start:'2026-12-01T08:00:00+07:00',now,refundLocked:true}),'Forfeited')
    assert.equal(cancellationOutcome({paid:true,start:now,now,storeCancelled:true}),'RefundPending')
    assert.equal(cancellationOutcome({paid:true,start:now,now,noShow:true}),'Forfeited')
    assert.equal(cancellationOutcome({paid:false,start:now,now}),'Cancelled')
})
