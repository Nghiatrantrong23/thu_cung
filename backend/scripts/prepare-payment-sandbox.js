// Creates a NEW isolated demo; never reads application .env or resets existing data.
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { demoConfig, createDemo } from './demo-scenarios.js'
import { demoAccounts } from './seed.js'
const config=demoConfig()
const password=randomBytes(18).toString('base64url')
await createDemo({...process.env,PETCARE_DEMO_PASSWORD:password,PAYMENT_MODE:'disabled',BOOKING_DEPOSIT_ENABLED:'false'})
const directory=new URL('../../.cache/payment-sandbox/',import.meta.url)
await mkdir(directory,{recursive:true})
await writeFile(new URL(`${config.database}.txt`,directory),[
    'TAI KHOAN CHI DUNG CHO SANDBOX PETCARE - KHONG PHAI TAI KHOAN THAT',
    `Database: ${config.database}`,
    ...demoAccounts.map(account=>account.username),
    `Mat khau chung cho demo sandbox: ${password}`,
    'Mo web sandbox, dang nhap demo_khach; vao Hoa don de thu QR/MoMo/COD.',
].join('\n'))
console.log('[payments] Sandbox ready. Local demo credentials: .cache/payment-sandbox/'+config.database+'.txt (gitignored).')
