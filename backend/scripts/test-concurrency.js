import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Never load .env or send requests to the user's running application.
if (!process.env.TEST_DATABASE_URL) {
    console.error('Set TEST_DATABASE_URL to a NEW local <project>_test_<unique> database. Existing schemas are refused.')
    process.exitCode = 1
} else {
    const result = spawnSync(process.execPath, ['--test', 'test/booking.integration.test.js'], {
        cwd: fileURLToPath(new URL('../', import.meta.url)), env: process.env, windowsHide: true, stdio: 'inherit',
    })
    if (result.error) console.error(`Cannot start integration tests (${result.error.code}).`)
    process.exitCode = result.status ?? 1
}
