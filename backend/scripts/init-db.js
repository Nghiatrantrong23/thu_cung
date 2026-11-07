import { runCommand } from './db-tooling.js'

await runCommand('init', process.argv.slice(2))
