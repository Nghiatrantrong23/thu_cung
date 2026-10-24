import test from 'node:test'
import assert from 'node:assert/strict'
import { registerAccount } from '../src/lib/dangKy.js'

const form = { username: 'test_customer', fullName: 'Khách kiểm thử', phone: '0900000001',
  email: '', password: 'test-only-password', confirm: 'test-only-password' }

test('API duplicate phone error remains available on the registration form', async () => {
  const result = await registerAccount(form, async () => ({ ok: false, json: async () => ({ error: 'Số điện thoại đã được đăng ký' }) }))
  assert.equal(result.ok, false)
  assert.equal(result.errors.form, 'Số điện thoại đã được đăng ký')
})

test('all invalid fields prevent the API call', async () => {
  for (const [key, value] of [['username', 'x!'], ['fullName', ''], ['phone', '123'], ['email', 'invalid'], ['password', '123'], ['confirm', 'wrong']]) {
    const result = await registerAccount({ ...form, [key]: value }, () => assert.fail('Invalid input must not reach API'))
    assert.ok(result.errors[key], key)
  }
})

test('successful registration sends the existing API contract without confirmation', async () => {
  const result = await registerAccount(form, async (url, options) => {
    assert.equal(url, '/api/auth/dang-ky')
    assert.equal(options.method, 'POST')
    const body = JSON.parse(options.body)
    assert.equal(body.phone, form.phone)
    assert.equal(body.confirm, undefined)
    return { ok: true, json: async () => ({ message: 'Đăng ký thành công' }) }
  })
  assert.deepEqual(result, { ok: true })
})

test('network and non-JSON failures return a visible form error', async () => {
  for (const request of [async () => { throw new Error('offline') }, async () => ({ json: async () => { throw new Error('invalid JSON') } })]) {
    const result = await registerAccount(form, request)
    assert.equal(result.ok, false)
    assert.ok(result.errors.form)
  }
})
