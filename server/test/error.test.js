import test from 'node:test'
import assert from 'node:assert/strict'
import { publicError } from '../src/middleware/error.middleware.js'

test('SQL errors map to useful status without disclosing SQL detail', () => {
    for (const [code, status] of [['23505',409],['23P01',409],['23514',400],['23503',400],['22P02',400],['40001',409]]) {
        const result = publicError({code,message:'sensitive SQL and values'})
        assert.equal(result.status,status)
        assert.ok(!result.message.includes('sensitive'))
    }
})
test('malformed JSON, validation, business errors and solver overload', () => {
    assert.equal(publicError({type:'entity.parse.failed'}).status,400)
    assert.equal(publicError({name:'ZodError'}).status,422)
    assert.equal(publicError({status:403,message:'Không có quyền'}).message,'Không có quyền')
    assert.equal(publicError({code:'SCHEDULING_BUDGET',status:503}).status,503)
    assert.equal(publicError({message:'secret'}).message.includes('secret'),false)
})
