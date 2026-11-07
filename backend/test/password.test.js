import test from 'node:test'
import assert from 'node:assert/strict'
import { generateMatKhauTam, kiemTraMatKhau } from '../src/utils/matKhau.js'
test('temporary password meets requested length and strength across repeated generations', () => {
    const values = new Set()
    for (let i = 0; i < 100; i++) {
        const value = generateMatKhauTam(12)
        assert.equal(value.length, 12)
        assert.ok(kiemTraMatKhau(value).hopLe)
        values.add(value)
    }
    assert.equal(values.size, 100)
    assert.equal(generateMatKhauTam(4).length, 8)
    for (const value of [NaN, 1.5, Infinity, 1000, -1]) assert.throws(() => generateMatKhauTam(value))
})
