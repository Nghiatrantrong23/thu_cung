// Loaded only by the isolated journey test, never by the application entry point.
import { readFileSync } from 'node:fs'
if (process.env.NODE_ENV !== 'test' || !process.env.TEST_CLOCK_FILE) throw new Error('Test clock requires an explicit test fixture.')
const RealDate = Date
function instant() {
    const value = RealDate.parse(readFileSync(process.env.TEST_CLOCK_FILE, 'utf8').trim())
    if (!Number.isFinite(value)) throw new Error('Invalid test clock.')
    return value
}
globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [instant()])) }
    static now() { return instant() }
}
