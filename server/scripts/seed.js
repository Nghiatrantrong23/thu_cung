import pg from 'pg'
import bcrypt from 'bcrypt'
import { pathToFileURL } from 'node:url'
import { DATABASE_LOCK, getSafeConfig, loadMigrations, validateHistory } from './db-tooling.js'

const marker = '[PETCARE_DEMO_V1]'
export const demoAccounts = [
    { username: 'demo_admin', role: 'Admin', name: 'Demo Quản trị', phone: '0909000001' },
    { username: 'demo_quanly', role: 'NhanVien', title: 'Quản lý', name: 'Demo Quản lý', phone: '0909000002' },
    { username: 'demo_letan', role: 'NhanVien', title: 'Lễ tân', name: 'Demo Lễ tân', phone: '0909000003' },
    { username: 'demo_chamsoc1', role: 'NhanVien', title: 'Nhân viên chăm sóc', name: 'Demo Chăm sóc 1', phone: '0909000004' },
    { username: 'demo_chamsoc2', role: 'NhanVien', title: 'Nhân viên chăm sóc', name: 'Demo Chăm sóc 2', phone: '0909000005' },
    { username: 'demo_khach', role: 'KhachHang', name: 'Demo Khách hàng', phone: '0909000006' },
    { username: 'demo_khoa', role: 'KhachHang', name: 'Demo Tài khoản khóa', phone: '0909000007', locked: true },
]

export function validateDemoPassword(password) {
    if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password) > 72) {
        throw new Error('Set PETCARE_DEMO_PASSWORD to a private demo password (12+ characters, at most 72 UTF-8 bytes). It will not be printed or stored in source files.')
    }
    return password
}

/** Insert-only fixture: reruns never reset passwords or overwrite existing user data. */
export async function seedDatabase(client, password) {
    validateDemoPassword(password)
    const migrations = await loadMigrations()
    const hash = await bcrypt.hash(password, 10)
    await client.query('BEGIN')
    try {
        await client.query('SELECT pg_advisory_xact_lock($1)', [DATABASE_LOCK])
        await client.query('SET LOCAL search_path TO public')
        await client.query("SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh'")
        const { rows: history } = await client.query('SELECT version, name, checksum FROM petcare_schema_migrations ORDER BY version')
        validateHistory(history, migrations)
        if (history.length !== migrations.length) throw new Error('Apply all pending migrations before seeding.')
        const ids = new Map()
        for (const account of demoAccounts) {
            const email = `${account.username}@example.invalid`
            const { rows: old } = await client.query('SELECT ma_nguoi_dung, vai_tro, email FROM nguoi_dung WHERE ten_dang_nhap=$1', [account.username])
            if (old.length && (old[0].vai_tro !== account.role || old[0].email !== email)) {
                throw new Error('Reserved demo username conflicts with existing data. Seed stopped without modifying it.')
            }
            let id = old[0]?.ma_nguoi_dung
            if (!id) {
                const { rows } = await client.query(`INSERT INTO nguoi_dung
                    (ten_dang_nhap, mat_khau_hash, email, so_dien_thoai, vai_tro, trang_thai)
                    VALUES ($1,$2,$3,$4,$5,$6) RETURNING ma_nguoi_dung`,
                [account.username, hash, email, account.phone, account.role, !account.locked])
                id = rows[0].ma_nguoi_dung
            }
            ids.set(account.username, id)
            if (account.role === 'NhanVien') {
                await client.query(`INSERT INTO nhan_vien (ma_nhan_vien,ho_ten,chuc_vu,ngay_vao_lam)
                    VALUES ($1,$2,$3,CURRENT_DATE) ON CONFLICT (ma_nhan_vien) DO NOTHING`, [id, account.name, account.title])
            } else if (account.role === 'KhachHang') {
                await client.query(`INSERT INTO khach_hang (ma_khach_hang,ho_ten,ghi_chu)
                    VALUES ($1,$2,$3) ON CONFLICT (ma_khach_hang) DO NOTHING`, [id, account.name, marker])
            }
        }
        const { rows: categories } = await client.query(`INSERT INTO loai_dv (ten_loai_dv,mo_ta)
            VALUES ('Demo - Chăm sóc thú cưng',$1) ON CONFLICT (ten_loai_dv) DO NOTHING RETURNING ma_loai_dv`, [marker])
        const category = categories[0] || (await client.query('SELECT ma_loai_dv,mo_ta FROM loai_dv WHERE ten_loai_dv=$1', ['Demo - Chăm sóc thú cưng'])).rows[0]
        if (!categories.length && category.mo_ta !== marker) throw new Error('Demo category conflicts with existing data.')
        for (const [name, price, duration] of [['Demo - Tắm sấy', 150000, 60], ['Demo - Cắt tỉa lông', 250000, 90], ['Demo - Spa', 400000, 120]]) {
            await client.query(`INSERT INTO dich_vu (ma_loai_dv,ten_dv,mo_ta,gia_hien_hanh,thoi_luong_phut)
                SELECT $1::integer,$2::varchar(100),$3::varchar(500),$4::numeric,$5::integer
                WHERE NOT EXISTS (SELECT 1 FROM dich_vu WHERE ma_loai_dv=$1 AND ten_dv=$2)`,
            [category.ma_loai_dv, name, marker, price, duration])
        }
        for (const [name, species] of [['Demo - Bông', 'Chó'], ['Demo - Miu', 'Mèo']]) {
            await client.query(`INSERT INTO thu_cung (ma_khach_hang,ten_thu_cung,loai_thu_cung,can_nang,ghi_chu_suc_khoe)
                SELECT $1::integer,$2::varchar(50),$3::varchar(10),5,$4::varchar(500)
                WHERE NOT EXISTS (SELECT 1 FROM thu_cung WHERE ma_khach_hang=$1 AND ten_thu_cung=$2)`,
            [ids.get('demo_khach'), name, species, marker])
        }
        for (const username of ['demo_chamsoc1', 'demo_chamsoc2']) {
            await client.query(`INSERT INTO ca_lam_viec (ma_nhan_vien,ngay,gio_bat_dau,gio_ket_thuc,ghi_chu)
                SELECT $1,CURRENT_DATE + d,TIME '08:00',TIME '19:00',$2 FROM generate_series(0,6) d
                WHERE NOT EXISTS (SELECT 1 FROM ca_lam_viec WHERE ma_nhan_vien=$1 AND ngay=CURRENT_DATE+d)`,
            [ids.get(username), marker])
        }
        await client.query('COMMIT')
        return { accounts: demoAccounts.length, services: 3, pets: 2, shiftDays: 7 }
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    }
}

async function main() {
    let client
    try {
        if (process.argv.length > 2) throw new Error('db:seed accepts no arguments.')
        const config = getSafeConfig()
        validateDemoPassword(process.env.PETCARE_DEMO_PASSWORD)
        client = new pg.Client(config)
        await client.connect()
        const result = await seedDatabase(client, process.env.PETCARE_DEMO_PASSWORD)
        console.log(`[db:seed] Succeeded (${result.accounts} accounts across 5 groups, ${result.services} services, ${result.pets} pets, 7 days of care shifts). Existing passwords were preserved; no passwords printed.`)
    } catch (error) {
        console.error(error.code ? `[db:seed] Database operation failed (${error.code}); seed rolled back.` : `[db:seed] ${error.message}`)
        process.exitCode = 1
    } finally { if (client) await client.end() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
