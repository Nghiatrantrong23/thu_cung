import { demoConfig } from './demo-scenarios.js'
const config=demoConfig()
process.env.PAYMENT_MODE='sandbox'
process.env.PETCARE_PAYMENT_SANDBOX_DB=config.database
await import('./start-demo.js')
