import { runCommand } from './db-tooling.js'

await runCommand('migrate', process.argv.slice(2))
