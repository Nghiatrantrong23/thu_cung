// Pure scheduling rules. Times are minutes in the Vietnam business day;
// timestamps stored without time zone must not be converted through UTC here.
const businessClock = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export function businessNow(now = new Date()) {
    const parts = Object.fromEntries(businessClock.formatToParts(now).map(({ type, value }) => [type, value]))
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        minutes: Number(parts.hour) * 60 + Number(parts.minute),
        timestampMs: now.getTime(),
    }
}

export function isValidDate(value) {
    if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isValidTime(value) {
    return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function toMinutes(value) {
    if (!isValidTime(value)) return NaN
    return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
}

export function validateDuration(value) {
    const numeric = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
    if (typeof numeric !== 'number' || !Number.isInteger(numeric) || numeric < 1 || numeric > 660) {
        const error = new Error('Thời lượng phải là số nguyên từ 1 đến 660 phút.')
        error.status = error.statusCode = 400
        throw error
    }
    return numeric
}

function validMinute(value) {
    return Number.isInteger(value) && value >= 0 && value <= 1440
}

function validInterval(value) {
    return value && validMinute(value.start) && validMinute(value.end) && value.start < value.end
}

function overlaps(a, b) {
    return a.start < b.end && b.start < a.end
}

/**
 * Prove that every job in the candidate's overlap component can be assigned
 * one staff member for its entire interval. Existing assignments stay fixed.
 * The witness is deliberately not returned or persisted: reception assigns it.
 * One shift must cover the whole job; adjacent shifts are not merged.
 * Exhausting the work budget fails closed with a retriable service error.
 */
export function canSchedule({ shifts, bookings, candidate, maxSteps = 100_000 }) {
    if (!validInterval(candidate)) return false
    if (!Array.isArray(shifts) || !Array.isArray(bookings)) return false
    if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new TypeError('maxSteps must be a positive integer')
    let steps = 0
    function spend() {
        if (++steps > maxSteps) {
            const error = new Error('Chưa thể kiểm tra công suất. Vui lòng thử lại.')
            error.status = error.statusCode = 503
            error.code = 'SCHEDULING_BUDGET'
            throw error
        }
    }

    const staffShifts = new Map()
    for (const shift of shifts) {
        spend()
        if (!validInterval(shift) || shift.staffId == null) continue
        const staff = String(shift.staffId)
        if (!staffShifts.has(staff)) staffShifts.set(staff, [])
        staffShifts.get(staff).push(shift)
    }
    if (staffShifts.size === 0) return false

    // Legacy active rows with an unknown end conservatively occupy the rest
    // of the day. An unknown start begins at midnight, never zero minutes.
    const jobs = bookings.map((booking) => {
        spend()
        const start = validMinute(booking.start) && booking.start < 1440 ? booking.start : 0
        const end = validMinute(booking.end) && booking.end > start ? booking.end : 1440
        return { start, end, staffId: booking.staffId }
    })
    const newJob = { ...candidate }
    jobs.push(newJob)
    jobs.sort((a, b) => a.start - b.start || a.end - b.end)

    // Sorted interval components avoid unrelated historical inconsistencies
    // rejecting a slot. Touching endpoints belong to separate components.
    let component = []
    let componentEnd = -1
    for (const job of jobs) {
        spend()
        if (component.length && job.start >= componentEnd) {
            if (component.includes(newJob)) break
            component = []
            componentEnd = -1
        }
        component.push(job)
        componentEnd = Math.max(componentEnd, job.end)
    }

    const occupied = new Map([...staffShifts.keys()].map((staff) => [staff, []]))
    const pending = []
    function compatible(staff, job) {
        for (const existing of occupied.get(staff)) {
            spend()
            if (overlaps(existing, job)) return false
        }
        return true
    }
    for (const job of component) {
        spend()
        job.candidates = []
        for (const [staff, intervals] of staffShifts) {
            spend()
            if (job.staffId != null && String(job.staffId) !== staff) continue
            if (intervals.some((shift) => {
                spend()
                return shift.start <= job.start && shift.end >= job.end
            })) job.candidates.push(staff)
        }
        if (job.candidates.length === 0) return false
        if (job.staffId == null) {
            pending.push(job)
        } else {
            const staff = job.candidates[0]
            if (!compatible(staff, job)) return false
            occupied.get(staff).push(job)
        }
    }

    function search(remaining) {
        spend()
        if (remaining.length === 0) return true
        let chosenIndex = 0
        let options = null
        for (let index = 0; index < remaining.length; index++) {
            spend()
            const available = remaining[index].candidates.filter((staff) => {
                spend()
                return compatible(staff, remaining[index])
            })
            if (available.length === 0) return false
            if (options === null || available.length < options.length) {
                chosenIndex = index
                options = available
            }
        }
        const job = remaining[chosenIndex]
        const rest = remaining.filter((_, index) => index !== chosenIndex)
        for (const staff of options) {
            occupied.get(staff).push(job)
            if (search(rest)) return true
            occupied.get(staff).pop()
        }
        return false
    }
    return search(pending)
}
