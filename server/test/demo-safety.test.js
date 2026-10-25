import test from 'node:test'
import assert from 'node:assert/strict'
import { demoConfig, demoConnectionString } from '../scripts/demo-scenarios.js'

test('full demo requires explicit isolated demo-test target and never loads .env',()=>{
    const base={NODE_ENV:'test',DATABASE_URL:'postgres://fixture@127.0.0.1:55439/petcare_test_demo_safety',PETCARE_ALLOW_DB_WRITE:'petcare_test_demo_safety'}
    assert.equal(demoConfig(base).database,'petcare_test_demo_safety')
    for(const overrides of [
        {NODE_ENV:'production'}, {NODE_ENV:'development'}, {PETCARE_ALLOW_DB_WRITE:''},
        {DATABASE_URL:'postgres://fixture@remote.example/petcare_test_demo_safety'},
        {DATABASE_URL:'postgres://fixture@localhost/petcare_dev',PETCARE_ALLOW_DB_WRITE:'petcare_dev'},
        {DATABASE_URL:'postgres://fixture@localhost/petcare_test_existing',PETCARE_ALLOW_DB_WRITE:'petcare_test_existing'},
    ]) assert.throws(()=>demoConfig({...base,...overrides}))
    const ipv6=demoConfig({...base,DATABASE_URL:'postgres://fixture:p%23demo@[::1]:55439/petcare_test_demo_safety'})
    const url=new URL(demoConnectionString(ipv6))
    assert.equal(url.hostname,'[::1]')
    assert.equal(decodeURIComponent(url.password),'p#demo')
})
