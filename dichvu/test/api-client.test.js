import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from '../src/lib/apiClient.js'
const response = (status, body) => ({ status, ok: status < 400, json: async () => body })
test('concurrent expired requests share refresh and retry with fresh token', async () => {
  let token = 'expired', refreshes = 0, retries = 0
  const api = createApiClient({ getToken: () => token, onToken: value => { token = value }, onExpired: () => assert.fail('Session should refresh'),
    request: async (url, options) => {
      if (url.includes('lam-moi-token')) { refreshes++; return response(200, { accessToken: 'fresh' }) }
      if (options.headers.Authorization === 'Bearer expired') return response(401, {})
      retries++; return response(200, { value: 1 })
    } })
  const results = await Promise.all([api('/api/lich-hen'), api('/api/thu-cung')])
  assert.ok(results.every(result => result.ok)); assert.equal(refreshes, 1); assert.equal(retries, 2)
})
test('failed refresh clears session; permissions errors are not retried', async () => {
  let expired = 0, calls = 0
  const api = createApiClient({ getToken: () => '', onToken: () => {}, onExpired: () => expired++, request: async () => { calls++; return response(401, {}) } })
  assert.equal((await api('/api/lich-hen')).status, 401); assert.equal(expired, 1); assert.equal(calls, 2)
  const forbidden = createApiClient({ getToken: () => '', onToken: () => assert.fail(), onExpired: () => assert.fail(), request: async () => response(403, { error: 'Forbidden' }) })
  assert.equal((await forbidden('/api/lich-hen')).status, 403)
})
