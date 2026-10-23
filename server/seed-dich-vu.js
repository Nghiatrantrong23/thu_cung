import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

async function run() {
    const dvCount = await pool.query(`SELECT COUNT(*) FROM dich_vu`)
    const loaiCount = await pool.query(`SELECT COUNT(*) FROM loai_dv`)
    console.log('loai_dv count:', loaiCount.rows[0].count)
    console.log('dich_vu count:', dvCount.rows[0].count)

    if (Number(loaiCount.rows[0].count) === 0) {
        console.log('Seeding services...')
        const loaiRes = await pool.query(`
            INSERT INTO loai_dv (ten_loai_dv, mo_ta)
            VALUES ('Chăm sóc cơ bản', 'Các dịch vụ tắm rửa, tỉa lông cơ bản')
            RETURNING ma_loai_dv
        `)
        const maLoai = loaiRes.rows[0].ma_loai_dv
        await pool.query(`
            INSERT INTO dich_vu (ma_loai_dv, ten_dv, mo_ta, gia_hien_hanh, thoi_luong_phut, trang_thai)
            VALUES
            ($1, 'Tắm sấy', 'Tắm sấy thơm tho sạch sẽ', 150000, 60, true),
            ($1, 'Cắt tỉa lông', 'Cắt tỉa tạo kiểu cho thú cưng', 250000, 90, true),
            ($1, 'Spa thư giãn', 'Combo chăm sóc toàn diện cao cấp', 400000, 120, true)
        `, [maLoai])
        console.log('Seeded 3 services.')
    } else {
        const dvRows = await pool.query(`SELECT ma_dv, ten_dv, gia_hien_hanh, thoi_luong_phut FROM dich_vu`)
        console.log('Existing services:', dvRows.rows)
    }

    await pool.end()
}
run().catch(console.error)
