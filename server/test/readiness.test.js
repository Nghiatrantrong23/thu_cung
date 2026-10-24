import test from 'node:test'
import assert from 'node:assert/strict'
import {schemaReady} from '../src/lib/readiness.js'
test('readiness refuses legacy and incomplete schemas without modifying them',async()=>{
    const calls=[]
    assert.equal(await schemaReady(async sql=>{calls.push(sql);return {rows:[{present:false}]}}),false)
    assert.equal(calls.length,1)
    assert.ok(calls.every(sql=>sql.startsWith('SELECT')))
    const check=versions=>schemaReady(async sql=>({rows:sql.includes('to_regclass')?[{present:true}]:versions.map(version=>({version}))}))
    assert.equal(await check(['000','001']),false)
    assert.equal(await check(['000','001','002','003','004','005']),true)
})
