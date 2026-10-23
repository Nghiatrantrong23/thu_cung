import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { testConnection } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import petRoutes, { traCuuKhachHang } from './routes/pet.routes.js'
import dichVuRoutes from './routes/dichvu.routes.js'
import lichHenRoutes from './routes/lichhen.routes.js'
import { authenticate } from './middleware/auth.middleware.js'


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

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/thu-cung', petRoutes)
app.use('/api/dich-vu', dichVuRoutes)
app.use('/api/lich-hen', lichHenRoutes)
app.get('/api/khach-hang/tra-cuu', authenticate, traCuuKhachHang)


// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
    console.error('[error]', err)
    const status = err.status || 500
    res.status(status).json({
        error: err.message || 'Internal server error',
        ...(env.nodeEnv === 'development' && { stack: err.stack }),
    })
})

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
