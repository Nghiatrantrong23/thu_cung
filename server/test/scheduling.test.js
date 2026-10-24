import test from 'node:test'
import assert from 'node:assert/strict'
import { businessNow, isValidDate, isValidTime, toMinutes, validateDuration, canSchedule } from '../src/lib/scheduling.js'

const shift = (staffId, start, end) => ({ staffId, start, end })
const job = (start, end, staffId = null) => ({ start, end, staffId })

test('business date and time use Vietnam, including UTC day and year rollover', () => {
    assert.deepEqual(businessNow(new Date('2026-12-31T18:25:30Z')), {
        date: '2027-01-01', minutes: 85, timestampMs: Date.parse('2026-12-31T18:25:30Z'),
    })
    assert.equal(businessNow(new Date('2026-10-23T17:00:00Z')).minutes, 0)
})

test('strict date, clock and duration validation rejects normalization and partial parsing', () => {
    for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '26-01-01', '2026-1-01', '0000-01-01', null]) {
        assert.equal(isValidDate(value), false, String(value))
    }
    assert.equal(isValidDate('2024-02-29'), true)
    assert.equal(isValidDate('2026-10-23'), true)
    for (const value of ['9:00', '24:00', '09:60', '09:00:00', null]) assert.equal(isValidTime(value), false)
    assert.equal(toMinutes('19:00'), 1140)
    assert.ok(Number.isNaN(toMinutes('09:99')))
    assert.equal(validateDuration('90'), 90)
    assert.equal(validateDuration(660), 660)
    for (const value of ['60oops', '01', '1.5', 0, -1, 661, 1.5, null, NaN]) {
        assert.throws(() => validateDuration(value), (error) => error.status === 400)
    }
})

test('requires a single shift covering the full interval, not adjacent partial shifts', () => {
    assert.equal(canSchedule({ shifts: [], bookings: [], candidate: job(540, 600) }), false)
    assert.equal(canSchedule({ shifts: [shift('A', 480, 570), shift('A', 570, 660)], bookings: [], candidate: job(540, 600) }), false)
    assert.equal(canSchedule({ shifts: [shift('A', 480, 660)], bookings: [], candidate: job(540, 600) }), true)
})

test('rejects fragmented availability even when concurrent headcount fits', () => {
    assert.equal(canSchedule({
        shifts: [shift('A', 480, 600), shift('B', 540, 660)],
        bookings: [job(480, 570, 'A'), job(570, 660, 'B')], candidate: job(540, 600),
    }), false)
})

test('can recolor pending bookings, while existing assignments cannot move', () => {
    const shifts = [shift('A', 540, 660), shift('B', 540, 600)]
    assert.equal(canSchedule({ shifts, bookings: [job(540, 600)], candidate: job(570, 630) }), true)
    assert.equal(canSchedule({ shifts, bookings: [job(540, 600, 'A')], candidate: job(570, 630) }), false)
})

test('detects off-grid overlap; adjacent endpoints allow sequential appointments', () => {
    const shifts = [shift('A', 480, 1140)]
    assert.equal(canSchedule({ shifts, bookings: [job(555, 585)], candidate: job(540, 570) }), false)
    assert.equal(canSchedule({ shifts, bookings: [job(540, 600, 'A')], candidate: job(600, 660) }), true)
})

test('duplicate shifts for one staff do not create extra capacity', () => {
    assert.equal(canSchedule({ shifts: [shift(1, 480, 1140), shift('1', 480, 1140)], bookings: [job(540, 600)], candidate: job(540, 600) }), false)
})

test('checks the transitive overlap component, not only direct neighbors', () => {
    // J1 overlaps J2; new job overlaps J1 but not J2. J2 forces J1 onto A,
    // where it blocks the candidate. Ignoring J2 would incorrectly accept.
    assert.equal(canSchedule({
        shifts: [shift('A', 480, 660), shift('B', 540, 660)],
        bookings: [job(540, 630), job(600, 660, 'B')], candidate: job(480, 600),
    }), false)
})

test('unrelated historical invalid assignments do not block a separate component', () => {
    assert.equal(canSchedule({ shifts: [shift('A', 480, 1140)], bookings: [job(480, 540, 'retired')], candidate: job(600, 660) }), true)
})

test('unknown active end fails closed for overlapping candidate only', () => {
    const shifts = [shift('A', 480, 1440)]
    assert.equal(canSchedule({ shifts, bookings: [job(600, null, 'A')], candidate: job(660, 720) }), false)
    assert.equal(canSchedule({ shifts, bookings: [job(600, null, 'A')], candidate: job(540, 600) }), true)
    assert.equal(canSchedule({ shifts, bookings: [job(null, null, 'A')], candidate: job(540, 600) }), false)
})

test('returns no assignment and does not mutate inputs', () => {
    const data = { shifts: [shift('A', 480, 1140)], bookings: [job(480, 540)], candidate: job(540, 600) }
    const copy = structuredClone(data)
    assert.equal(canSchedule(data), true)
    assert.deepEqual(data, copy)
})

test('bounded search fails closed with 503 instead of hanging', () => {
    assert.throws(() => canSchedule({ shifts: [shift('A', 480, 1140)], bookings: [], candidate: job(540, 600), maxSteps: 1 }),
        (error) => error.status === 503 && error.code === 'SCHEDULING_BUDGET')
})

test('rejects invalid candidates and ignores invalid shifts', () => {
    assert.equal(canSchedule({ shifts: [shift('A', 480, 1140)], bookings: [], candidate: job(600, 600) }), false)
    assert.equal(canSchedule({ shifts: [shift('A', 660, 480)], bookings: [], candidate: job(540, 600) }), false)
})

test('solver agrees with exhaustive staff assignments across varied small schedules', () => {
    let seed = 24567
    const random = (limit) => {
        seed = (seed * 16807) % 2147483647
        return seed % limit
    }
    const intersects = (a, b) => a.start < b.end && b.start < a.end
    function exhaustive({ shifts, bookings, candidate }) {
        const all = [...bookings, candidate]
        const relevant = new Set([all.length - 1])
        let changed = true
        while (changed) {
            changed = false
            for (let i = 0; i < all.length; i++) {
                if (!relevant.has(i) && [...relevant].some((index) => intersects(all[i], all[index]))) {
                    relevant.add(i)
                    changed = true
                }
            }
        }
        const jobs = [...relevant].map((index) => all[index])
        const assigned = []
        function enumerate(index) {
            if (index === jobs.length) return true
            const current = jobs[index]
            for (const staff of ['A', 'B', 'C']) {
                if (current.staffId != null && current.staffId !== staff) continue
                if (!shifts.some((s) => s.staffId === staff && s.start <= current.start && s.end >= current.end)) continue
                if (assigned.some((a) => a.staff === staff && intersects(a.interval, current))) continue
                assigned.push({ staff, interval: current })
                if (enumerate(index + 1)) return true
                assigned.pop()
            }
            return false
        }
        return enumerate(0)
    }
    for (let iteration = 0; iteration < 200; iteration++) {
        const shifts = ['A', 'B', 'C'].map((staff) => {
            const start = 480 + random(4) * 30
            return shift(staff, start, start + (1 + random(5)) * 30)
        })
        const makeJob = () => {
            const start = 480 + random(6) * 30
            return job(start, start + (1 + random(3)) * 30, random(4) === 0 ? ['A', 'B', 'C'][random(3)] : null)
        }
        const data = { shifts, bookings: Array.from({ length: random(6) }, makeJob), candidate: makeJob() }
        assert.equal(canSchedule(data), exhaustive(data), JSON.stringify(data))
    }
})
