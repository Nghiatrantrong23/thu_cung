import { string,phone as checkPhone,email as checkEmail } from '../lib/validation.js'
import { integerId } from '../services/dispatch.js'
import { BOOKING_LOCK_NAMESPACE,bookingError } from '../services/booking.js'
import { validateDayCapacity } from '../services/shifts.js'
import { notify,notifyReception } from '../services/notifications.js'
import { audit } from '../services/audit.js'
import bcrypt from 'bcrypt'
import { query, withTransaction } from '../config/db.js'
import { env } from '../config/env.js'
import { generateMatKhauTam } from '../utils/matKhau.js'

/**
 * GET /api/admin/tai-khoan?q=&vaiTro=
 * Danh sách tài khoản với tìm kiếm và lọc
 */
export async function layDanhSachTaiKhoan(req, res, next) {
    try {
        const { q = '', vaiTro = '' } = req.query

        let sql = `
            SELECT
                nd.ma_nguoi_dung,
                nd.ten_dang_nhap,
                nd.email,
                nd.so_dien_thoai,
                nd.vai_tro,
                nd.trang_thai,
                nv.ho_ten as nhan_vien_ho_ten,
                nv.chuc_vu,
                kh.ho_ten as khach_hang_ho_ten
            FROM nguoi_dung nd
            LEFT JOIN nhan_vien nv ON nd.ma_nguoi_dung = nv.ma_nhan_vien
            LEFT JOIN khach_hang kh ON nd.ma_nguoi_dung = kh.ma_khach_hang
            WHERE 1=1
        `
        const params = []

        if (q) {
            params.push(`%${q}%`)
            sql += ` AND (nd.ten_dang_nhap ILIKE $${params.length}
                     OR nv.ho_ten ILIKE $${params.length}
                     OR kh.ho_ten ILIKE $${params.length}
                     OR nd.so_dien_thoai ILIKE $${params.length})`
        }

        if (vaiTro) {
            params.push(vaiTro)
            sql += ` AND nd.vai_tro = $${params.length}`
        }

        sql += ` ORDER BY nd.ngay_tao DESC`

        const result = await query(sql, params)

        const danhSach = result.rows.map(row => ({
            maNguoiDung: row.ma_nguoi_dung,
            tenDangNhap: row.ten_dang_nhap,
            email: row.email || '',
            soDienThoai: row.so_dien_thoai || '',
            vaiTro: row.vai_tro,
            trangThai: row.trang_thai,
            hoTen: row.vai_tro==='NhanVien'?row.nhan_vien_ho_ten:row.vai_tro==='KhachHang'?row.khach_hang_ho_ten:row.ten_dang_nhap,
            chucVu: row.chuc_vu || '',
        }))

        res.json({ data: danhSach })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan
 * Tạo tài khoản nhân viên (vai_tro='NhanVien', chuc_vu là Lễ tân/Quản lý/...)
 */
export async function taoTaiKhoan(req, res, next) {
    try {
        let { tenDangNhap, hoTen, soDienThoai, email, chucVu } = req.body

        tenDangNhap=string(tenDangNhap,'Tên đăng nhập',30)
        if(!/^[A-Za-z0-9._]{4,30}$/.test(tenDangNhap)) throw bookingError(400,'Tên đăng nhập không hợp lệ.')
        hoTen=string(hoTen,'Họ tên',100)
        soDienThoai=checkPhone(soDienThoai,false);email=checkEmail(email)
        if(!['Lễ tân','Quản lý','Nhân viên chăm sóc'].includes(chucVu)) throw bookingError(400,'Chức vụ không hợp lệ.')
        // Validation
        if (!tenDangNhap || !hoTen || !chucVu) {
            return res.status(400).json({
                error: 'tenDangNhap, hoTen và chucVu là bắt buộc'
            })
        }

        // Sinh mật khẩu tạm
        const matKhauTam = generateMatKhauTam(12)
        const matKhauHash = await bcrypt.hash(matKhauTam, env.bcryptRounds)

        const result = await withTransaction(async (client) => {
            await client.query('SELECT pg_advisory_xact_lock(171719,hashtext(lower($1)))',[tenDangNhap])
            // Kiểm tra trùng
            const checkResult = await client.query(
                `SELECT
                    (SELECT COUNT(*) FROM nguoi_dung WHERE LOWER(ten_dang_nhap)=LOWER($1)) as trung_ten,
                    (SELECT COUNT(*) FROM nguoi_dung WHERE so_dien_thoai = $2 AND so_dien_thoai IS NOT NULL) as trung_sdt,
                    (SELECT COUNT(*) FROM nguoi_dung WHERE email = $3 AND email IS NOT NULL) as trung_email`,
                [tenDangNhap, soDienThoai || null, email || null]
            )

            const dup = checkResult.rows[0]
            if (parseInt(dup.trung_ten) > 0) {
                throw Object.assign(new Error('Tên đăng nhập đã tồn tại'), { status: 409 })
            }
            if (soDienThoai && parseInt(dup.trung_sdt) > 0) {
                throw Object.assign(new Error('Số điện thoại đã tồn tại'), { status: 409 })
            }
            if (email && parseInt(dup.trung_email) > 0) {
                throw Object.assign(new Error('Email đã tồn tại'), { status: 409 })
            }

            // Tạo nguoi_dung với vai_tro='NhanVien'
            const userResult = await client.query(
                `INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, email, so_dien_thoai, vai_tro, trang_thai, bat_doi_mat_khau)
                 VALUES ($1, $2, $3, $4, 'NhanVien', true, true)
                 RETURNING ma_nguoi_dung`,
                [tenDangNhap, matKhauHash, email || null, soDienThoai || null]
            )

            const maNguoiDung = userResult.rows[0].ma_nguoi_dung

            // Tạo nhan_vien
            await client.query(
                `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, chuc_vu)
                 VALUES ($1, $2, $3)`,
                [maNguoiDung, hoTen, chucVu]
            )

            return { maNguoiDung, matKhauTam }
        })

        res.status(201).json({
            message: 'Tạo tài khoản thành công',
            data: {
                maNguoiDung: result.maNguoiDung,
                tenDangNhap,
                hoTen,
                soDienThoai: soDienThoai || '',
                email: email || '',
                vaiTro: 'NhanVien',
                chucVu,
                trangThai: true,
                matKhauTam: result.matKhauTam, // Chỉ hiển thị 1 lần
            },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * PATCH /api/admin/tai-khoan/:id
 * Cập nhật thông tin tài khoản
 */
async function lockAccountDays(client,id) {
    await client.query('SELECT pg_advisory_xact_lock(171720,$1::int)',[id])
    const dates=await client.query(`SELECT DISTINCT day FROM (
        SELECT ngay AS day FROM ca_lam_viec WHERE ma_nhan_vien=$1 AND trang_thai=true
        UNION SELECT ngay_gio_hen::date FROM lich_hen WHERE ma_nhan_vien=$1 AND trang_thai IN ('ChoXacNhan','DaXacNhan','DangThucHien')
        ) days ORDER BY day`,[id])
    const days=dates.rows.map(row=>`${row.day.getFullYear()}-${String(row.day.getMonth()+1).padStart(2,'0')}-${String(row.day.getDate()).padStart(2,'0')}`)
    for(const day of days)await client.query('SELECT pg_advisory_xact_lock($1::int,$2::int)',[BOOKING_LOCK_NAMESPACE,Number(day.replaceAll('-',''))])
    const row=(await client.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung=$1 FOR UPDATE',[id])).rows[0]
    if(!row)throw bookingError(404,'Không tìm thấy tài khoản.')
    return {row,days}
}
export async function capNhatTaiKhoan(req,res,next) {
    try {
        const id=integerId(req.params.id),body=req.body||{}
        const result=await withTransaction(async client=>{
            const {row,days}=await lockAccountDays(client,id)
            const role=body.vaiTro??row.vai_tro
            if(!['Admin','NhanVien','KhachHang'].includes(role))throw bookingError(400,'Vai trò không hợp lệ.')
            if(id===req.user.userId && role!==row.vai_tro)throw bookingError(400,'Không thể tự thay vai trò quản trị của chính mình.')
            const currentStaff=(await client.query('SELECT chuc_vu,ho_ten FROM nhan_vien WHERE ma_nhan_vien=$1',[id])).rows[0]
            const position=body.chucVu||currentStaff?.chuc_vu
            if(role==='NhanVien'&&!['Lễ tân','Quản lý','Nhân viên chăm sóc'].includes(position))throw bookingError(400,'Chức vụ nhân viên không hợp lệ.')
            const changed=role!==row.vai_tro || (role==='NhanVien'&&position!==currentStaff?.chuc_vu)
            if(changed&&(await client.query("SELECT 1 FROM lich_hen WHERE ma_nhan_vien=$1 AND trang_thai IN ('DaXacNhan','DangThucHien') LIMIT 1",[id])).rowCount)throw bookingError(409,'Điều phối lịch đang mở trước khi đổi vai trò/chức vụ.')
            const fullName=body.hoTen!==undefined?string(body.hoTen,'Họ tên',100):currentStaff?.ho_ten||row.ten_dang_nhap
            const email=body.email!==undefined?checkEmail(body.email):row.email
            const phone=body.soDienThoai!==undefined?(checkPhone(body.soDienThoai,false)||null):row.so_dien_thoai
            await client.query('UPDATE nguoi_dung SET vai_tro=$2,email=$3,so_dien_thoai=$4,token_version=token_version+$5,ngay_cap_nhat=NOW() WHERE ma_nguoi_dung=$1',[id,role,email,phone,changed?1:0])
            if(role==='NhanVien')await client.query('INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,chuc_vu) VALUES($1,$2,$3) ON CONFLICT(ma_nhan_vien) DO UPDATE SET ho_ten=$2,chuc_vu=$3,ngay_cap_nhat=NOW()',[id,fullName,position])
            if(role==='KhachHang')await client.query('INSERT INTO khach_hang(ma_khach_hang,ho_ten) VALUES($1,$2) ON CONFLICT(ma_khach_hang) DO UPDATE SET ho_ten=$2,ngay_cap_nhat=NOW()',[id,fullName])
            // Keep old profiles for FK/history, but effective role controls access and capacity.
            if(changed)for(const day of days)await validateDayCapacity(client,day)
            return {maNguoiDung:id}
        })
        res.json({message:'Đã cập nhật tài khoản.',data:result})
    } catch(err){next(err)}
}
export async function khoaTaiKhoan(req,res,next) {
    try {
        const id=integerId(req.params.id)
        if(id===req.user.userId)throw bookingError(400,'Không thể khóa chính mình.')
        const result=await withTransaction(async client=>{
            const {row,days}=await lockAccountDays(client,id)
            const appointments=await client.query(`SELECT lh.*,to_char(lh.ngay_gio_hen,'YYYY-MM-DD') AS date,tc.ma_khach_hang
                FROM lich_hen lh JOIN thu_cung tc USING(ma_thu_cung) WHERE lh.ma_nhan_vien=$1 AND lh.trang_thai IN ('DaXacNhan','DangThucHien') FOR UPDATE OF lh`,[id])
            if(appointments.rows.some(item=>item.trang_thai==='DangThucHien'))throw bookingError(409,'Không thể khóa nhân viên đang thực hiện dịch vụ.')
            if(appointments.rowCount && req.body?.xacNhan!==true)return {warning:true,error:'Nhân viên có lịch đã xác nhận. Xác nhận để đưa về chờ phân công lại nếu vẫn đủ công suất.',lichDaXacNhan:appointments.rows.map(item=>({maLichHen:item.ma_lich_hen,trangThai:item.trang_thai,ngayGioHen:item.date}))}
            if(!row.trang_thai)return {message:'Tài khoản đã khóa.',data:{maNguoiDung:id,trangThai:false}}
            await client.query('UPDATE nguoi_dung SET trang_thai=false,token_version=token_version+1,ngay_cap_nhat=NOW() WHERE ma_nguoi_dung=$1',[id])
            for(const booking of appointments.rows){
                await client.query("UPDATE lich_hen SET ma_nhan_vien=NULL,trang_thai='ChoXacNhan',ngay_cap_nhat=NOW() WHERE ma_lich_hen=$1",[booking.ma_lich_hen])
                await audit(client,booking,req.user,'tai-khoan-bi-khoa','ChoXacNhan','Nhân viên phụ trách bị khóa; chờ phân công lại.')
                await notify(client,booking.ma_khach_hang,booking.ma_lich_hen,'Lịch chờ phân công lại',`Lịch #${booking.ma_lich_hen} cần đổi nhân viên phụ trách.`)
                await notifyReception(client,booking.ma_lich_hen,'Cần phân công lại nhân viên',`Lịch #${booking.ma_lich_hen} do tài khoản phụ trách bị khóa.`)
            }
            for(const day of days)await validateDayCapacity(client,day)
            return {message:'Đã khóa tài khoản, các lịch bị ảnh hưởng vẫn được bảo vệ công suất.',data:{maNguoiDung:id,trangThai:false}}
        })
        res.status(result.warning?409:200).json(result)
    } catch(err){next(err)}
}

/**
 * POST /api/admin/tai-khoan/:id/mo-khoa
 * Mở khóa tài khoản
 */
export async function moKhoaTaiKhoan(req, res, next) {
    try {
        const id = integerId(req.params.id)

        const result = await query(
            'UPDATE nguoi_dung SET trang_thai = true WHERE ma_nguoi_dung = $1 RETURNING ma_nguoi_dung',
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' })
        }

        res.json({
            message: 'Mở khóa tài khoản thành công',
            data: { maNguoiDung: parseInt(id), trangThai: true },
        })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/admin/tai-khoan/:id/dat-lai-mat-khau
 * Đặt lại mật khẩu (sinh mật khẩu tạm mới)
 */
export async function datLaiMatKhau(req, res, next) {
    try {
        const id = integerId(req.params.id)

        // Sinh mật khẩu tạm mới
        const matKhauTam = generateMatKhauTam(12)
        const matKhauHash = await bcrypt.hash(matKhauTam, env.bcryptRounds)

        const result = await query(
            'UPDATE nguoi_dung SET mat_khau_hash=$1,token_version=token_version+1,bat_doi_mat_khau=true WHERE ma_nguoi_dung=$2 RETURNING ma_nguoi_dung, ten_dang_nhap',
            [matKhauHash, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tài khoản không tồn tại' })
        }

        res.json({
            message: 'Đặt lại mật khẩu thành công',
            data: {
                maNguoiDung: parseInt(id),
                tenDangNhap: result.rows[0].ten_dang_nhap,
                matKhauTam, // Chỉ hiển thị 1 lần
            },
        })
    } catch (err) {
        next(err)
    }
}
