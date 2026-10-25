// Local demo runtime: explicit isolated DB, real clock, separate frontend proxy.
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { demoConfig, demoConnectionString } from './demo-scenarios.js'

const config = demoConfig()
const manifest = JSON.parse(await readFile(new URL(`../../.cache/demo/${config.database}.json`,import.meta.url),'utf8'))
if(manifest.database!==config.database) throw new Error('Demo manifest does not match the selected database.')
const apiPort=Number(process.env.DEMO_API_PORT || 5001)
const webPort=Number(process.env.DEMO_WEB_PORT || 5181)
if(![apiPort,webPort].every(port=>Number.isInteger(port)&&port>=1024&&port<=65535)||apiPort===webPort) throw new Error('Choose two different unprivileged demo ports.')
// Refuse occupied ports before starting a proxy; never accidentally target another API.
for(const port of [apiPort,webPort]) {
    const probe=createServer()
    await new Promise((resolve,reject)=>probe.once('error',reject).listen(port,'127.0.0.1',resolve))
    await new Promise(resolve=>probe.close(resolve))
}
const runtimeEnv={...process.env,NODE_ENV:'test',PORT:String(apiPort),DB_SSL:'false',
    DATABASE_URL:demoConnectionString(config),
    CORS_ORIGIN:`http://127.0.0.1:${webPort},http://localhost:${webPort}`,
    JWT_SECRET:randomBytes(48).toString('hex'),JWT_REFRESH_SECRET:randomBytes(48).toString('hex'),JWT_EXPIRES_IN:'2h'}
delete runtimeEnv.TEST_CLOCK_FILE
delete runtimeEnv.PETCARE_DEMO_PASSWORD
const child=spawn(process.execPath,['src/server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:runtimeEnv,windowsHide:true,stdio:['ignore','pipe','pipe']})
let vite,stopping=false
async function stop(code=0) {
    if(stopping)return
    stopping=true
    if(vite)await vite.close()
    if(child.exitCode===null)child.kill()
    process.exitCode=code
}
child.stdout.on('data',chunk=>process.stdout.write(chunk))
child.stderr.on('data',chunk=>process.stderr.write(chunk))
child.on('error',async error=>{console.error(`[demo] API could not start (${error.code}).`);await stop(1)})
child.on('exit',async code=>{if(!stopping)await stop(code || 1)})
process.on('SIGINT',()=>stop())
process.on('SIGTERM',()=>stop())
try {
    let ready=false
    for(let i=0;i<100;i++) {
        if(stopping)throw new Error('Demo API stopped during startup; check the port above.')
        try{ready=(await fetch(`http://127.0.0.1:${apiPort}/ready`)).ok}catch{}
        if(ready)break
        await new Promise(resolve=>setTimeout(resolve,100))
    }
    if(!ready)throw new Error('Demo database/API did not become ready.')
    const {createServer}=await import('../../dichvu/node_modules/vite/dist/node/index.js')
    vite=await createServer({root:fileURLToPath(new URL('../../dichvu/',import.meta.url)),
        server:{host:'127.0.0.1',port:webPort,strictPort:true,proxy:{'/api':{target:`http://127.0.0.1:${apiPort}`,changeOrigin:true}}}})
    if(stopping)await vite.close()
    else {
        await vite.listen()
        console.log(`[demo] Web: http://127.0.0.1:${webPort}/ — DB: ${config.database}. REAL clock. Existing 5173/5000 configuration unchanged.`)
    }
} catch(error) {
    console.error(`[demo] ${error.code || error.message}`)
    await stop(1)
}
