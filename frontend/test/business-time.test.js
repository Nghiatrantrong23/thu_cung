import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays, getAvailableSlots, toISODate } from '../src/lib/tinhGioTrong.js'

describe('Ngày nghiệp vụ Asia/Ho_Chi_Minh', () => {
  it('đổi ngày tại nửa đêm Việt Nam dù UTC còn ngày trước', () => {
    assert.equal(toISODate(new Date('2026-10-23T16:59:59Z')), '2026-10-23')
    assert.equal(toISODate(new Date('2026-10-23T17:00:00Z')), '2026-10-24')
    assert.equal(toISODate(new Date('2026-10-24T00:00:00Z')), '2026-10-24')
  })

  it('cộng ngày qua tháng, năm và ngày nhuận', () => {
    assert.equal(addDays(1, new Date('2026-10-31T12:00:00+07:00')), '2026-11-01')
    assert.equal(addDays(1, new Date('2026-12-31T12:00:00+07:00')), '2027-01-01')
    assert.equal(addDays(1, new Date('2028-02-28T12:00:00+07:00')), '2028-02-29')
    assert.equal(addDays(2, new Date('2028-02-28T12:00:00+07:00')), '2028-03-01')
    assert.equal(addDays(-1, new Date('2027-01-01T12:00:00+07:00')), '2026-12-31')
  })

  it('cộng ngày từ ngày Việt Nam hiện tại, giữ tương thích Date và chuỗi', () => {
    assert.equal(addDays(0, new Date('2026-10-23T17:00:00Z')), '2026-10-24')
    assert.equal(addDays(1, '2026-10-23T17:00:00Z'), '2026-10-25')
    assert.equal(addDays(1, '2026-10-23'), '2026-10-24')
  })

  it('không phụ thuộc múi giờ hệ điều hành hoặc thời điểm đổi DST', () => {
    const originalTZ = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/Berlin', 'Asia/Ho_Chi_Minh']) {
        process.env.TZ = tz
        assert.equal(addDays(1, '2026-03-07T17:30:00Z'), '2026-03-09', tz)
        assert.equal(addDays(1, '2026-10-31T17:30:00Z'), '2026-11-02', tz)
        assert.equal(toISODate(new Date('2026-10-23T17:00:00Z')), '2026-10-24', tz)
      }
    } finally {
      if (originalTZ === undefined) delete process.env.TZ
      else process.env.TZ = originalTZ
    }
  })
})

describe('Giờ Việt Nam trong helper khung giờ dữ liệu mẫu', () => {
  it('loại ngày quá khứ theo Việt Nam sau nửa đêm', () => {
    assert.deepEqual(getAvailableSlots({
      date: '2026-10-23', duration: 30, bookings: [], now: new Date('2026-10-23T17:00:00Z'),
    }), [])
  })

  it('loại giờ đã qua theo Việt Nam thay vì giờ máy', () => {
    const slots = getAvailableSlots({
      date: '2026-10-24', duration: 30, bookings: [], now: new Date('2026-10-24T01:45:00Z'),
    })
    assert.equal(slots[0], '09:00')
    assert.equal(slots.at(-1), '18:30')
    assert.equal(slots.includes('08:30'), false)
  })

  it('nửa đêm không làm mất giờ mở cửa; giờ đóng cửa hết lịch hôm nay', () => {
    assert.equal(getAvailableSlots({
      date: '2026-10-24', duration: 30, bookings: [], now: new Date('2026-10-23T17:00:00Z'),
    })[0], '08:00')
    assert.deepEqual(getAvailableSlots({
      date: '2026-10-24', duration: 30, bookings: [], now: new Date('2026-10-24T12:00:00Z'),
    }), [])
  })
})
