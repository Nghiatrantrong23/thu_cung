import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { testConnection, query } from './config/db.js'
import { schemaReady } from './lib/readiness.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import petRoutes, { traCuuKhachHang } from './routes/pet.routes.js'
import dichVuRoutes from './routes/dichvu.routes.js'
import lichHenRoutes from './routes/lichhen.routes.js'
import thongBaoRoutes from './routes/thongbao.routes.js'
import caLamRoutes from './routes/calam.routes.js'
import hoaDonRoutes from './routes/hoadon.routes.js'
import khieuNaiRoutes from './routes/khieunai.routes.js'
import baoCaoRoutes from './routes/baocao.routes.js'
import { authenticate, requireReception } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'


const app = express()



// Middleware
app.use(cors({
    origin: env.corsOrigin,
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Request logger
app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
        const duration = Date.now() - start
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
    })
    next()
})

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/ready', async (req,res) => {
    try { const ready=await schemaReady(query);res.status(ready?200:503).json({status:ready?'ready':'migration_required'}) }
    catch { res.status(503).json({status:'database_unavailable'}) }
})
// Give a useful error on older local schemas instead of issuing incompatible SQL.
app.use('/api',async(req,res,next)=>{
    try {
        if(!await schemaReady(query))return res.status(503).json({code:'MIGRATION_REQUIRED',error:'Database chưa được nâng cấp theo mã nguồn hiện tại. Xem hướng dẫn database trong README; không chạy lại schema gốc trên dữ liệu cũ.'})
        next()
    } catch {res.status(503).json({code:'DATABASE_UNAVAILABLE',error:'Chưa kết nối được database. Kiểm tra cấu hình và dịch vụ PostgreSQL.'})}
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/thu-cung', petRoutes)
app.use('/api/dich-vu', dichVuRoutes)
app.use('/api/lich-hen', lichHenRoutes)
app.use('/api/thong-bao', thongBaoRoutes)
app.use('/api/ca-lam-viec', caLamRoutes)
app.use('/api/hoa-don', hoaDonRoutes)
app.use('/api/khieu-nai', khieuNaiRoutes)
app.use('/api/bao-cao', baoCaoRoutes)
app.get('/api/khach-hang/tra-cuu', authenticate, requireReception, traCuuKhachHang)


// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(errorHandler)

// Start server
const PORT = env.port
app.listen(PORT, async () => {
    try {
        const dbTime = await testConnection()
        console.log(`[server] Connected to database at ${dbTime}`)
        console.log(`[server] Listening on port ${PORT}`)
        console.log(`[server] Environment: ${env.nodeEnv}`)
    } catch (err) {
        console.error('[server] Failed to connect to database:', err)
        process.exit(1)
    }
})

export default app
