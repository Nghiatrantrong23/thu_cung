import test from 'node:test'
import assert from 'node:assert/strict'
import { demoConfig, demoConnectionString } from '../scripts/demo-scenarios.js'
import { accountTargets, newDemoAccounts } from '../scripts/new-demo-accounts.js'

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

test('new account set has exactly the requested 17 unique non-Admin accounts',()=>{
    assert.equal(newDemoAccounts.length,17)
    assert.equal(new Set(newDemoAccounts.map(a=>a.username)).size,17)
    assert.equal(newDemoAccounts.filter(a=>a.title==='Nhân viên chăm sóc').length,5)
    assert.equal(newDemoAccounts.filter(a=>a.title==='Lễ tân').length,5)
    assert.equal(newDemoAccounts.filter(a=>a.title==='Quản lý').length,2)
    assert.equal(newDemoAccounts.filter(a=>a.role==='KhachHang').length,5)
    assert.ok(newDemoAccounts.every(a=>a.role!=='Admin'&&!a.username.startsWith('demo_')))
})

test('account replacement requires different explicit source and target demo databases',()=>{
    const base={NODE_ENV:'test',DATABASE_URL:'postgres://fixture@127.0.0.1:55439/petcare_test_demo_new',PETCARE_ALLOW_DB_WRITE:'petcare_test_demo_new',
        DEMO_SOURCE_DATABASE_URL:'postgres://fixture@127.0.0.1:55439/petcare_test_demo_old',DEMO_SOURCE_DATABASE:'petcare_test_demo_old'}
    assert.equal(accountTargets(base).source.database,'petcare_test_demo_old')
    for(const overrides of [
        {DEMO_SOURCE_DATABASE_URL:''}, {DEMO_SOURCE_DATABASE:''},
        {DEMO_SOURCE_DATABASE_URL:base.DATABASE_URL,DEMO_SOURCE_DATABASE:'petcare_test_demo_new'},
        {DEMO_SOURCE_DATABASE_URL:'postgres://fixture@127.0.0.1:5432/petcare_test_demo_old'},
        {DEMO_SOURCE_DATABASE_URL:'postgres://fixture@remote.example/petcare_test_demo_old'},
    ]) assert.throws(()=>accountTargets({...base,...overrides}))
})
