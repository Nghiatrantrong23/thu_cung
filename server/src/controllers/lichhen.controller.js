import { cancelBooking, getAvailableStaff, processBooking } from '../services/dispatch.js'
import { query } from '../config/db.js'
import { availability, createBooking } from '../services/booking.js'

// Map DB trang_thai -> frontend
const STATUS_DISPLAY = {
    ChoXacNhan: 'Chờ xác nhận',
    DaXacNhan: 'Đã xác nhận',
    DangThucHien: 'Đang thực hiện',
    HoanThanh: 'Hoàn thành',
    DaHuy: 'Đã hủy',
    TuChoi: 'Từ chối',
}

function mapLichHen(row, dichVuList = []) {
    const total = dichVuList.reduce((s, d) => s + d.gia * d.soLuong, 0)
    return {
        id: row.ma_lich_hen,
        owner: row.ten_dang_nhap ?? null,
        customerName: row.ten_khach_hang ?? row.ten_dang_nhap ?? '',
        customerPhone: row.so_dien_thoai ?? '',
        weightKg: row.can_nang == null ? null : Number(row.can_nang),
        healthNote: row.ghi_chu_suc_khoe ?? '',
        thuCungId: row.ma_thu_cung,
        petId: row.ma_thu_cung,
        petName: row.ten_thu_cung ?? '',
        species: row.loai_thu_cung ?? '',
        tenThuCung: row.ten_thu_cung ?? '',
        loaiThuCung: row.loai_thu_cung ?? '',
        nhanVienId: row.ma_nhan_vien,
        staff: row.ten_nhan_vien ?? null,
        tenNhanVien: row.ten_nhan_vien ?? null,
        date: row.ngay_hen || (row.ngay_gio_hen ? new Date(row.ngay_gio_hen).toISOString().slice(0, 10) : ''),
        start: row.gio_hen || (row.ngay_gio_hen ? new Date(row.ngay_gio_hen).toISOString().slice(11, 16) : ''),
        end: row.gio_ket_thuc || (row.ngay_gio_ket_thuc_du_kien ? new Date(row.ngay_gio_ket_thuc_du_kien).toISOString().slice(11, 16) : ''),
        status: STATUS_DISPLAY[row.trang_thai] ?? row.trang_thai,
        trangThai: STATUS_DISPLAY[row.trang_thai] ?? row.trang_thai,
        trangThaiDB: row.trang_thai,
        note: row.ghi_chu ?? '',
        ghiChu: row.ghi_chu ?? '',
        careIssue: row.yeu_cau_xu_ly ?? '',
        ngayTao: row.ngay_tao,
        dichVu: dichVuList,
        serviceNames: dichVuList.map((d) => d.ten),
        total,
        tongTien: total,
        review: row.so_sao ? { stars: Number(row.so_sao), comment: row.nhan_xet ?? '' } : null,
    }
}

// Availability is advisory; createBooking rechecks under a transaction day lock.
export async function layKhungGioTrong(req, res, next) {
    try { res.json(await availability(req.query.ngay, req.query.thoiLuong)) }
    catch (err) { next(err) }
}

/**
 * GET /api/lich-hen
 * Khach hang: lay lich hen cua minh.
 * NhanVien/Admin: xem tat ca hoac loc theo ngay / trangThai.
 */
export async function layDanhSachLichHen(req, res, next) {
    try {
        const userId = req.user.userId
        const role = req.user.role

        let whereClause = ''
        let params = []

        if (role === 'KhachHang') {
            whereClause = 'WHERE tc.ma_khach_hang = $1'
            params = [userId]
        } else {
            const { ngay, trangThai } = req.query
            const conditions = []
            if (req.user.role === 'NhanVien' && req.user.chucVu === 'Nhân viên chăm sóc') {
                params.push(userId)
                conditions.push(`lh.ma_nhan_vien = $${params.length}`)
            }
            if (ngay) {
                conditions.push(`to_char(lh.ngay_gio_hen, 'YYYY-MM-DD') = $${params.length + 1}`)
                params.push(ngay)
            }
            if (trangThai) {
                conditions.push(`lh.trang_thai = $${params.length + 1}`)
                params.push(trangThai)
            }
            whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
        }

        const result = await query(
            `SELECT lh.ma_lich_hen, lh.ma_thu_cung, lh.ma_nhan_vien,
                    lh.ngay_gio_hen, lh.ngay_gio_ket_thuc_du_kien,
                    to_char(lh.ngay_gio_hen, 'YYYY-MM-DD') AS ngay_hen,
                    to_char(lh.ngay_gio_hen, 'HH24:MI') AS gio_hen,
                    to_char(lh.ngay_gio_ket_thuc_du_kien, 'HH24:MI') AS gio_ket_thuc,
                    lh.trang_thai, lh.ghi_chu, lh.ngay_tao, lh.yeu_cau_xu_ly,
                    tc.ten_thu_cung, tc.loai_thu_cung,
                    nv.ho_ten AS ten_nhan_vien,
                    nd.ten_dang_nhap, nd.so_dien_thoai, kh.ho_ten AS ten_khach_hang,
                    tc.can_nang, tc.ghi_chu_suc_khoe,
                    dg.so_sao, dg.nhan_xet
             FROM lich_hen lh
             JOIN thu_cung tc ON lh.ma_thu_cung = tc.ma_thu_cung
             JOIN nguoi_dung nd ON tc.ma_khach_hang = nd.ma_nguoi_dung
             JOIN khach_hang kh ON kh.ma_khach_hang = tc.ma_khach_hang
             LEFT JOIN nhan_vien nv ON lh.ma_nhan_vien = nv.ma_nhan_vien
             LEFT JOIN danh_gia dg ON lh.ma_lich_hen = dg.ma_lich_hen
             ${whereClause}
             ORDER BY lh.ngay_gio_hen DESC`,
            params
        )

        // Lay danh sach dich vu cho moi lich hen
        const lichHenIds = result.rows.map((r) => r.ma_lich_hen)
        let dichVuMap = {}
        if (lichHenIds.length > 0) {
            const dvResult = await query(
                `SELECT ctlh.ma_lich_hen, ctlh.ma_dv, dv.ten_dv, ctlh.gia_du_kien, ctlh.so_luong, ctlh.trang_thai, ctlh.ghi_chu_cham_soc
                 FROM chi_tiet_lich_hen ctlh
                 JOIN dich_vu dv ON ctlh.ma_dv = dv.ma_dv
                 WHERE ctlh.ma_lich_hen = ANY($1::int[])`,
                [lichHenIds]
            )
            for (const dv of dvResult.rows) {
                if (!dichVuMap[dv.ma_lich_hen]) dichVuMap[dv.ma_lich_hen] = []
                dichVuMap[dv.ma_lich_hen].push({
                    id: dv.ma_dv,
                    ten: dv.ten_dv,
                    gia: Number(dv.gia_du_kien),
                    soLuong: dv.so_luong,
                    trangThai: dv.trang_thai,
                    careNote: dv.ghi_chu_cham_soc ?? '',
                })
            }
        }

        const lichHenList = result.rows.map((r) => mapLichHen(r, dichVuMap[r.ma_lich_hen] ?? []))
        res.json({ lichHen: lichHenList })
    } catch (err) {
        next(err)
    }
}

async function respondCreated(req, res, next, counter) {
    try {
        const created = await createBooking(req.body, req.user, { counter })
        const serviceList = created.services.map((d) => ({ id: d.ma_dv, ten: d.ten_dv, gia: Number(d.gia_hien_hanh), soLuong: 1, trangThai: 'ChoThucHien' }))
        const booking = mapLichHen({
            ma_lich_hen: created.id, ma_thu_cung: created.pet.ma_thu_cung,
            ten_thu_cung: created.pet.ten_thu_cung, loai_thu_cung: created.pet.loai_thu_cung,
            ngay_hen: created.date, gio_hen: created.start, gio_ket_thuc: created.end,
            trang_thai: 'ChoXacNhan', ghi_chu: created.note, ngay_tao: new Date(),
        }, serviceList)
        booking.depositRequired=Boolean(created.deposit)
        res.status(201).json({ message: created.deposit?'Đã tạo yêu cầu. Vui lòng đóng cọc 30% để được xác nhận.':'Đặt lịch thành công. Lịch đang chờ xác nhận.', lichHenId: created.id, booking, lichHen: booking, ...(created.temporaryAccount ? { taiKhoanTam: created.temporaryAccount } : {}) })
    } catch (err) { next(err) }
}
export async function datLichOnline(req, res, next) { return respondCreated(req, res, next, false) }
export async function datLichTaiQuay(req, res, next) { return respondCreated(req, res, next, true) }

/**
 * PATCH /api/lich-hen/:id/huy
 * Khach hang huy lich hen cua minh (chi ChoXacNhan hoac DaXacNhan).
 * NhanVien/Admin huy bat ky lich ChoXacNhan / DaXacNhan.
 */
export async function huyLichHen(req, res, next) {
    try { res.json(await cancelBooking(req.params.id, req.body, req.user)) }
    catch (err) { next(err) }
}
export async function nhanVienKhaDung(req, res, next) {
    try { res.json({ nhanVien: await getAvailableStaff(req.params.id) }) }
    catch (err) { next(err) }
}
export async function xuLyLichHen(req, res, next) {
    try { res.json(await processBooking(req.params.id, req.body, req.user)) }
    catch (err) { next(err) }
}

/**
 * POST /api/lich-hen/:id/danh-gia
 * Khach hang danh gia lich hen da hoan thanh.
 */
export async function danhGiaLichHen(req, res, next) {
    try {
        const { id } = req.params
        const { stars, comment } = req.body
        const userId = req.user.userId
        const role = req.user.role

        const numStars = typeof stars === 'number' || (typeof stars === 'string' && /^[1-5]$/.test(stars)) ? Number(stars) : NaN
        if (!Number.isInteger(numStars) || numStars < 1 || numStars > 5) {
            return res.status(400).json({ error: 'Số sao đánh giá phải từ 1 đến 5.' })
        }

        if (comment != null && (typeof comment !== 'string' || comment.trim().length > 500)) return res.status(400).json({error:'Nhận xét tối đa 500 ký tự.'})
        const lhResult = await query(
            `SELECT lh.ma_lich_hen, lh.trang_thai, tc.ma_khach_hang
             FROM lich_hen lh
             JOIN thu_cung tc ON lh.ma_thu_cung = tc.ma_thu_cung
             WHERE lh.ma_lich_hen = $1`,
            [id]
        )
        if (lhResult.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' })
        }
        const lh = lhResult.rows[0]

        if (role === 'KhachHang' && lh.ma_khach_hang !== userId) {
            return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá lịch hẹn của mình.' })
        }

        if (lh.trang_thai !== 'HoanThanh') {
            return res.status(400).json({ error: 'Chỉ đánh giá được lịch hẹn đã hoàn thành.' })
        }

        // Kiem tra da danh gia chua
        const dgResult = await query(
            `SELECT ma_danh_gia FROM danh_gia WHERE ma_lich_hen = $1`,
            [id]
        )
        if (dgResult.rows.length > 0) {
            return res.status(400).json({ error: 'Lịch hẹn này đã được đánh giá.' })
        }

        await query(
            `INSERT INTO danh_gia (ma_lich_hen, so_sao, nhan_xet) VALUES ($1, $2, $3)`,
            [id, numStars, comment?.trim() || null]
        )

        console.log(`[lichhen] Danh gia lich #${id}: ${numStars} sao - user=${userId}`)
        res.status(201).json({
            message: 'Đã gửi đánh giá thành công. Cảm ơn quý khách!',
            review: { stars: numStars, comment: comment?.trim() || '' }
        })
    } catch (err) {
        next(err)
    }
}
