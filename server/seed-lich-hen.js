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
    const existing = await pool.query('SELECT COUNT(*) FROM lich_hen')
    console.log('Current lich_hen count:', existing.rows[0].count)

    if (Number(existing.rows[0].count) === 0) {
        console.log('Seeding initial appointments...')
        // 1. Hoàn thành - chưa đánh giá
        const lh1 = await pool.query(`
            INSERT INTO lich_hen (ma_thu_cung, ma_nhan_vien, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
            VALUES (1, 4, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 'HoanThanh', 'Bé thích massage đầu')
            RETURNING ma_lich_hen
        `)
        await pool.query(`
            INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
            VALUES ($1, 3, 1, 400000, 'HoanThanh')
        `, [lh1.rows[0].ma_lich_hen])

        // 2. Hoàn thành - đã đánh giá 5 sao
        const lh2 = await pool.query(`
            INSERT INTO lich_hen (ma_thu_cung, ma_nhan_vien, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
            VALUES (1, 4, '2026-10-12 09:00:00', '2026-10-12 10:00:00', 'HoanThanh', '')
            RETURNING ma_lich_hen
        `)
        await pool.query(`
            INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
            VALUES ($1, 1, 1, 150000, 'HoanThanh')
        `, [lh2.rows[0].ma_lich_hen])
        await pool.query(`
            INSERT INTO danh_gia (ma_lich_hen, so_sao, nhan_xet)
            VALUES ($1, 5, 'Bé rất thơm và nhân viên chăm sóc rất nhẹ nhàng, chu đáo!')
        `, [lh2.rows[0].ma_lich_hen])

        // 3. Đã xác nhận - sắp tới
        const lh3 = await pool.query(`
            INSERT INTO lich_hen (ma_thu_cung, ma_nhan_vien, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
            VALUES (2, 4, '2026-10-22 14:00:00', '2026-10-22 15:30:00', 'DaXacNhan', 'Tỉa gọn lông vùng mắt')
            RETURNING ma_lich_hen
        `)
        await pool.query(`
            INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
            VALUES ($1, 2, 1, 250000, 'ChoThucHien')
        `, [lh3.rows[0].ma_lich_hen])

        // 4. Chờ xác nhận
        const lh4 = await pool.query(`
            INSERT INTO lich_hen (ma_thu_cung, ma_nhan_vien, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
            VALUES (1, NULL, '2026-10-23 09:00:00', '2026-10-23 10:00:00', 'ChoXacNhan', 'Bé hơi nhát nước.')
            RETURNING ma_lich_hen
        `)
        await pool.query(`
            INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
            VALUES ($1, 1, 1, 150000, 'ChoThucHien')
        `, [lh4.rows[0].ma_lich_hen])

        // 5. Đã hủy
        const lh5 = await pool.query(`
            INSERT INTO lich_hen (ma_thu_cung, ma_nhan_vien, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
            VALUES (2, NULL, '2026-10-05 08:00:00', '2026-10-05 09:00:00', 'DaHuy', 'Khách bận việc đột xuất')
            RETURNING ma_lich_hen
        `)
        await pool.query(`
            INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
            VALUES ($1, 1, 1, 150000, 'DaHuy')
        `, [lh5.rows[0].ma_lich_hen])

        console.log('Seeded 5 appointments successfully.')
    } else {
        console.log('Appointments already seeded.')
    }

    await pool.end()
}

run().catch(console.error)
