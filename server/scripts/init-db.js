import pg from 'pg'
import bcrypt from 'bcrypt'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const { Client, Pool } = pg

const dbHost = process.env.DB_HOST || 'localhost'
const dbPort = Number(process.env.DB_PORT || 5432)
const dbUser = process.env.DB_USER || 'postgres'
const dbPassword = process.env.DB_PASSWORD || ''
const dbName = process.env.DB_NAME || 'dich_vu_thu_cung'

async function init() {
    console.log(`[db:init] Connecting to PostgreSQL on ${dbHost}:${dbPort} as ${dbUser}...`)

    // 1. Connect to default postgres DB to create target DB if not exists
    const adminClient = new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: 'postgres',
    })

    await adminClient.connect()
    const checkDb = await adminClient.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
    )

    if (checkDb.rows.length === 0) {
        console.log(`[db:init] Creating database "${dbName}"...`)
        await adminClient.query(`CREATE DATABASE "${dbName}"`)
        console.log(`[db:init] Database "${dbName}" created successfully.`)
    } else {
        console.log(`[db:init] Database "${dbName}" already exists.`)
    }
    await adminClient.end()

    // 2. Connect to the target database
    const pool = new Pool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
    })

    console.log(`[db:init] Running schema from thu_cung.sql...`)
    const rootDir = path.resolve(__dirname, '../../')
    const sqlPath = path.join(rootDir, 'thu_cung.sql')
    if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8')
        try {
            await pool.query(sql)
            console.log(`[db:init] Applied thu_cung.sql`)
        } catch (err) {
            console.warn(`[db:init] Notice while running thu_cung.sql:`, err.message)
        }
    }

    // 3. Apply migration 001 if exists
    const migPath = path.join(rootDir, 'migrations', '001_schema_improvements.sql')
    if (fs.existsSync(migPath)) {
        console.log(`[db:init] Running migration 001_schema_improvements.sql...`)
        const migSql = fs.readFileSync(migPath, 'utf8')
        try {
            await pool.query(migSql)
            console.log(`[db:init] Applied 001_schema_improvements.sql`)
        } catch (err) {
            console.warn(`[db:init] Notice while running migration:`, err.message)
        }
    }

    // 4. Seed initial accounts if table is empty
    const checkUsers = await pool.query('SELECT COUNT(*) FROM nguoi_dung')
    const count = Number(checkUsers.rows[0].count)
    if (count === 0) {
        console.log(`[db:init] Seeding default accounts...`)

        const accounts = [
            { username: 'admin', pass: 'admin123', role: 'Admin', title: 'Admin', name: 'Lê Văn Quản Trị', phone: '0900000001', email: 'admin@petcare.vn', locked: false },
            { username: 'quanly01', pass: 'quanly123', role: 'NhanVien', title: 'Quản lý', name: 'Hoàng Văn Chủ', phone: '0900000005', email: 'quanly@petcare.vn', locked: false },
            { username: 'letan01', pass: 'letan123', role: 'NhanVien', title: 'Lễ tân', name: 'Phạm Thị Mai', phone: '0900000002', email: 'letan@petcare.vn', locked: false },
            { username: 'nhanvien01', pass: 'nhanvien123', role: 'NhanVien', title: 'Nhân viên chăm sóc', name: 'Lê Văn B', phone: '0900000003', email: 'nhanvien@petcare.vn', locked: false },
            { username: 'nguyenan', pass: '12345678', role: 'KhachHang', title: null, name: 'Nguyễn An', phone: '0912345678', email: 'an@email.com', locked: false },
            { username: 'khachkhoa', pass: '12345678', role: 'KhachHang', title: null, name: 'Khách Bị Khóa', phone: '0911111111', email: 'khoa@email.com', locked: true },
        ]

        for (const acc of accounts) {
            const hash = await bcrypt.hash(acc.pass, 10)
            const res = await pool.query(
                `INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, email, so_dien_thoai, vai_tro, trang_thai)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING ma_nguoi_dung`,
                [acc.username, hash, acc.email, acc.phone, acc.role, !acc.locked]
            )
            const userId = res.rows[0].ma_nguoi_dung

            if (acc.role === 'KhachHang') {
                await pool.query(
                    `INSERT INTO khach_hang (ma_khach_hang, ho_ten) VALUES ($1, $2)`,
                    [userId, acc.name]
                )
            } else if (acc.role === 'NhanVien') {
                await pool.query(
                    `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, chuc_vu, ngay_vao_lam) VALUES ($1, $2, $3, CURRENT_DATE)`,
                    [userId, acc.name, acc.title]
                )
            }
        }
        console.log(`[db:init] Seeded 6 default accounts successfully.`)

        // Seed default service type and services
        const loaiDvRes = await pool.query(`
            INSERT INTO loai_dv (ten_loai_dv, mo_ta)
            VALUES ('Chăm sóc cơ bản', 'Các dịch vụ tắm rửa, tỉa lông')
            RETURNING ma_loai_dv;
        `)
        const maLoaiDv = loaiDvRes.rows[0].ma_loai_dv

        await pool.query(`
            INSERT INTO dich_vu (ma_loai_dv, ten_dv, mo_ta, gia_hien_hanh, thoi_luong_phut, trang_thai)
            VALUES 
            ($1, 'Tắm sấy', 'Dịch vụ tắm sấy thơm tho sạch sẽ', 150000, 60, true),
            ($1, 'Cắt tỉa lông', 'Dịch vụ cắt tỉa tạo kiểu cho thú cưng', 250000, 90, true),
            ($1, 'Spa thư giãn', 'Combo chăm sóc toàn diện cao cấp', 400000, 120, true);
        `, [maLoaiDv])
        console.log(`[db:init] Seeded default services.`)
    }

    await pool.end()
    console.log(`[db:init] Complete! All ready.`)
}

init().catch((err) => {
    console.error(`[db:init] Error:`, err)
    process.exit(1)
})
