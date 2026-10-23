import { query, withTransaction } from '../config/db.js'

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const OPEN_HOUR = 8   // 08:00
const CLOSE_HOUR = 19 // 19:00
const STEP_MIN = 30   // buoc gio hen: 30 phut

// Trang thai lich hen dang chiem giu khung gio
const ACTIVE_STATUSES = ['ChoXacNhan', 'DaXacNhan', 'DangThucHien']

// Map DB trang_thai -> frontend
const STATUS_DISPLAY = {
    ChoXacNhan: 'Chờ xác nhận',
    DaXacNhan: 'Đã xác nhận',
    DangThucHien: 'Đang thực hiện',
    HoanThanh: 'Hoàn thành',
    DaHuy: 'Đã hủy',
}

function toMin(hhmm) {
    if (!hhmm) return 0
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
}

function toHHMM(minutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0')
    const m = String(minutes % 60).padStart(2, '0')
    return `${h}:${m}`
}

function mapLichHen(row, dichVuList = []) {
    const total = dichVuList.reduce((s, d) => s + d.gia * d.soLuong, 0)
    return {
        id: row.ma_lich_hen,
        owner: row.ten_dang_nhap ?? null,
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
        ngayTao: row.ngay_tao,
        dichVu: dichVuList,
        serviceNames: dichVuList.map((d) => d.ten),
        total,
        tongTien: total,
        review: row.so_sao ? { stars: Number(row.so_sao), comment: row.nhan_xet ?? '' } : null,
    }
}

// -------------------------------------------------------
// Tinh khung gio trong trong ngay
// -------------------------------------------------------
async function tinhKhungGioTrong(date, durationMin) {
    if (!date || !durationMin || durationMin <= 0) return []

    // Lay tat ca lich hen chua huy trong ngay (dinh dang HH24:MI)
    const result = await query(
        `SELECT to_char(ngay_gio_hen, 'HH24:MI') as start_str,
                to_char(ngay_gio_ket_thuc_du_kien, 'HH24:MI') as end_str
         FROM lich_hen
         WHERE to_char(ngay_gio_hen, 'YYYY-MM-DD') = $1
           AND trang_thai = ANY($2::text[])`,
        [date, ACTIVE_STATUSES]
    )

    // Moi lich hen chiem 1 "slot" trong capacity (toi da 2 lich chay song song)
    const CAPACITY = 2
    const busy = result.rows.map((r) => ({
        s: toMin(r.start_str),
        e: toMin(r.end_str),
    }))

    const openMin = OPEN_HOUR * 60
    const closeMin = CLOSE_HOUR * 60
    const now = new Date()
    const todayISO = now.toISOString().slice(0, 10)
    const isToday = date === todayISO
    // Tinh gio hien tai (UTC+7 o VN hoac local)
    const nowMin = now.getHours() * 60 + now.getMinutes()

    const slots = []
    for (let s = openMin; s + durationMin <= closeMin; s += STEP_MIN) {
        if (isToday && s <= nowMin) continue
        const e = s + durationMin
        let free = true
        for (let t = s; t < e; t += STEP_MIN) {
            const count = busy.filter((b) => b.s <= t && t < b.e).length
            if (count >= CAPACITY) {
                free = false
                break
            }
        }
        if (free) {
            slots.push(toHHMM(s))
        }
    }
    return slots
}

/**
 * GET /api/lich-hen/khung-gio-trong?ngay=YYYY-MM-DD&thoiLuong=90
 * Tra ve danh sach gio bat dau con trong.
 */
export async function layKhungGioTrong(req, res, next) {
    try {
        const { ngay, thoiLuong } = req.query
        if (!ngay || !thoiLuong) {
            return res.status(400).json({ error: 'Thiếu tham số ngay hoặc thoiLuong.' })
        }
        const duration = parseInt(thoiLuong, 10)
        if (isNaN(duration) || duration <= 0) {
            return res.status(400).json({ error: 'thoiLuong phải là số nguyên dương.' })
        }

        const slots = await tinhKhungGioTrong(ngay, duration)
        res.json({ slots })
    } catch (err) {
        next(err)
    }
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
                    lh.trang_thai, lh.ghi_chu, lh.ngay_tao,
                    tc.ten_thu_cung, tc.loai_thu_cung,
                    nv.ho_ten AS ten_nhan_vien,
                    nd.ten_dang_nhap,
                    dg.so_sao, dg.nhan_xet
             FROM lich_hen lh
             JOIN thu_cung tc ON lh.ma_thu_cung = tc.ma_thu_cung
             JOIN nguoi_dung nd ON tc.ma_khach_hang = nd.ma_nguoi_dung
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
                `SELECT ctlh.ma_lich_hen, ctlh.ma_dv, dv.ten_dv, ctlh.gia_du_kien, ctlh.so_luong, ctlh.trang_thai
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
                })
            }
        }

        const lichHenList = result.rows.map((r) => mapLichHen(r, dichVuMap[r.ma_lich_hen] ?? []))
        res.json({ lichHen: lichHenList })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/lich-hen
 * Khach hang tu dat lich truc tuyen (AD-02, MH-02).
 * Body: { thuCungId, ngay, gioStart, dichVuIds[], ghiChu }
 */
export async function datLichOnline(req, res, next) {
    try {
        const userId = req.user.userId
        const { thuCungId, ngay, gioStart, dichVuIds, ghiChu } = req.body

        // Validate input
        if (!thuCungId || !ngay || !gioStart || !dichVuIds || dichVuIds.length === 0) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ: thú cưng, ngày, giờ và dịch vụ.' })
        }

        // Kiem tra thu cung thuoc ve khach hang nay
        const tcResult = await query(
            `SELECT ma_thu_cung, ten_thu_cung, loai_thu_cung, trang_thai FROM thu_cung WHERE ma_thu_cung = $1 AND ma_khach_hang = $2`,
            [thuCungId, userId]
        )
        if (tcResult.rows.length === 0) {
            return res.status(403).json({ error: 'Không tìm thấy thú cưng hoặc bạn không có quyền.' })
        }
        const thuCung = tcResult.rows[0]
        if (!thuCung.trang_thai) {
            return res.status(400).json({ error: `${thuCung.ten_thu_cung} đang ở trạng thái ngừng theo dõi.` })
        }

        // Lay thong tin dich vu
        const dvResult = await query(
            `SELECT ma_dv, ten_dv, gia_hien_hanh, thoi_luong_phut FROM dich_vu WHERE ma_dv = ANY($1::int[]) AND trang_thai = true`,
            [dichVuIds]
        )
        if (dvResult.rows.length !== dichVuIds.length) {
            return res.status(400).json({ error: 'Một hoặc nhiều dịch vụ không hợp lệ hoặc đã ngừng cung cấp.' })
        }

        const totalDuration = dvResult.rows.reduce((s, d) => s + (d.thoi_luong_phut || 0), 0)
        if (totalDuration <= 0) {
            return res.status(400).json({ error: 'Không tính được tổng thời lượng dịch vụ.' })
        }

        // Tinh thoi gian ket thuc
        const [h, m] = gioStart.split(':').map(Number)
        const startMin = h * 60 + m
        const endMin = startMin + totalDuration
        const CLOSE_MIN = CLOSE_HOUR * 60

        if (startMin < OPEN_HOUR * 60 || endMin > CLOSE_MIN) {
            return res.status(400).json({ error: `Lịch hẹn phải nằm trong khung 08:00 – 19:00 (kết thúc lúc ${toHHMM(endMin)}).` })
        }

        const endHH = String(Math.floor(endMin / 60)).padStart(2, '0')
        const endMM = String(endMin % 60).padStart(2, '0')
        const ngayGioHen = `${ngay} ${gioStart}:00`
        const ngayGioKetThuc = `${ngay} ${endHH}:${endMM}:00`

        // Kiem tra khung gio con trong truoc khi insert (tranh double-booking)
        const slots = await tinhKhungGioTrong(ngay, totalDuration)
        if (!slots.includes(gioStart)) {
            return res.status(409).json({ error: 'Khung giờ này vừa có người đặt hoặc không còn trống. Vui lòng chọn giờ khác.' })
        }

        // Tao lich hen trong transaction
        const lichHenId = await withTransaction(async (client) => {
            const lhResult = await client.query(
                `INSERT INTO lich_hen (ma_thu_cung, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
                 VALUES ($1, $2, $3, 'ChoXacNhan', $4)
                 RETURNING ma_lich_hen`,
                [thuCungId, ngayGioHen, ngayGioKetThuc, ghiChu?.trim() || null]
            )
            const newId = lhResult.rows[0].ma_lich_hen

            // Insert chi_tiet_lich_hen
            for (const dv of dvResult.rows) {
                await client.query(
                    `INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
                     VALUES ($1, $2, 1, $3, 'ChoThucHien')`,
                    [newId, dv.ma_dv, dv.gia_hien_hanh]
                )
            }

            return newId
        })

        console.log(`[lichhen] Dat lich moi: #${lichHenId} - thuCung=${thuCungId} - user=${userId}`)

        // Tra ve lich hen vua tao
        const dvList = dvResult.rows.map((d) => ({
            id: d.ma_dv, ten: d.ten_dv, gia: Number(d.gia_hien_hanh), soLuong: 1, trangThai: 'ChoThucHien'
        }))

        const createdBooking = mapLichHen({
            ma_lich_hen: lichHenId,
            ma_thu_cung: thuCungId,
            ten_thu_cung: thuCung.ten_thu_cung,
            loai_thu_cung: thuCung.loai_thu_cung,
            ma_nhan_vien: null,
            ten_nhan_vien: null,
            ngay_hen: ngay,
            gio_hen: gioStart,
            gio_ket_thuc: `${endHH}:${endMM}`,
            trang_thai: 'ChoXacNhan',
            ghi_chu: ghiChu?.trim() || '',
            ngay_tao: new Date(),
        }, dvList)

        res.status(201).json({
            message: 'Đặt lịch thành công. Lễ tân sẽ xác nhận và phân công nhân viên cho bé.',
            booking: createdBooking,
            lichHen: createdBooking
        })
    } catch (err) {
        if (err.code === '23P01') {
            return res.status(409).json({ error: 'Khung giờ này vừa có người đặt. Vui lòng chọn giờ khác.' })
        }
        if (err.code === '23514') {
            return res.status(400).json({ error: 'Lịch hẹn nằm ngoài giờ mở cửa (08:00 – 19:00) hoặc không hợp lệ.' })
        }
        next(err)
    }
}

/**
 * POST /api/lich-hen/tai-quay
 * Le tan dat lich ho khach tai quay (AD-02, MH-02b).
 * Body: { khachHangId?, sdt?, hoTen?, thuCungId, ngay, gioStart, dichVuIds[], ghiChu }
 * Neu khachHangId = null va co sdt: tu sinh tai khoan tam.
 */
export async function datLichTaiQuay(req, res, next) {
    try {
        const { khachHangId, sdt, hoTen, thuCungId, tenThuCung, loaiThuCung, ngay, gioStart, dichVuIds, ghiChu } = req.body
        const leTanId = req.user.userId

        if ((!thuCungId && !tenThuCung) || !ngay || !gioStart || !dichVuIds || dichVuIds.length === 0) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ: thú cưng, ngày, giờ và dịch vụ.' })
        }

        let targetKhachHangId = khachHangId

        // Neu chua co khach hang: tu sinh tai khoan tam (khach moi)
        if (!targetKhachHangId && sdt) {
            const existing = await query(
                `SELECT ma_nguoi_dung FROM nguoi_dung WHERE so_dien_thoai = $1`, [sdt.trim()]
            )
            if (existing.rows.length > 0) {
                targetKhachHangId = existing.rows[0].ma_nguoi_dung
            } else {
                // Sinh tai khoan tam
                targetKhachHangId = await withTransaction(async (client) => {
                    const tenDangNhap = sdt.trim()
                    const randomPass = Math.random().toString(36).slice(2, 10)
                    const bcrypt = await import('bcrypt')
                    const hash = await bcrypt.default.hash(randomPass, 10)
                    const uRes = await client.query(
                        `INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau_hash, so_dien_thoai, vai_tro, trang_thai)
                         VALUES ($1, $2, $3, 'KhachHang', true) RETURNING ma_nguoi_dung`,
                        [tenDangNhap, hash, sdt.trim()]
                    )
                    const uid = uRes.rows[0].ma_nguoi_dung
                    await client.query(
                        `INSERT INTO khach_hang (ma_khach_hang, ho_ten) VALUES ($1, $2)`,
                        [uid, hoTen?.trim() || 'Khách vãng lai']
                    )
                    console.log(`[lichhen] Tao tai khoan tam cho khach moi: ${tenDangNhap} (SDT: ${sdt})`)
                    return uid
                })
            }
        }

        if (!targetKhachHangId) {
            return res.status(400).json({ error: 'Vui lòng cung cấp mã khách hàng hoặc số điện thoại.' })
        }

        // Kiem tra thu cung hoac tao moi neu can
        let finalThuCungId = thuCungId ? Number(thuCungId) : null
        if (!finalThuCungId && tenThuCung) {
            const newPetRes = await query(
                `INSERT INTO thu_cung (ma_khach_hang, ten_thu_cung, loai_thu_cung, trang_thai)
                 VALUES ($1, $2, $3, true) RETURNING ma_thu_cung`,
                [targetKhachHangId, tenThuCung.trim(), loaiThuCung?.trim() || 'Chó']
            )
            finalThuCungId = newPetRes.rows[0].ma_thu_cung
        }

        const tcResult = await query(
            `SELECT ma_thu_cung, ten_thu_cung, loai_thu_cung, trang_thai FROM thu_cung WHERE ma_thu_cung = $1 AND ma_khach_hang = $2`,
            [finalThuCungId, targetKhachHangId]
        )
        if (tcResult.rows.length === 0) {
            return res.status(403).json({ error: 'Không tìm thấy thú cưng của khách hàng này.' })
        }

        const dvResult = await query(
            `SELECT ma_dv, ten_dv, gia_hien_hanh, thoi_luong_phut FROM dich_vu WHERE ma_dv = ANY($1::int[]) AND trang_thai = true`,
            [dichVuIds]
        )
        if (dvResult.rows.length !== dichVuIds.length) {
            return res.status(400).json({ error: 'Một hoặc nhiều dịch vụ không hợp lệ.' })
        }

        const totalDuration = dvResult.rows.reduce((s, d) => s + (d.thoi_luong_phut || 0), 0)
        const [h, m] = gioStart.split(':').map(Number)
        const startMin = h * 60 + m
        const endMin = startMin + totalDuration

        if (startMin < OPEN_HOUR * 60 || endMin > CLOSE_HOUR * 60) {
            return res.status(400).json({ error: 'Lịch hẹn phải nằm trong khung 08:00 – 19:00.' })
        }

        const endHH = String(Math.floor(endMin / 60)).padStart(2, '0')
        const endMM = String(endMin % 60).padStart(2, '0')
        const ngayGioHen = `${ngay} ${gioStart}:00`
        const ngayGioKetThuc = `${ngay} ${endHH}:${endMM}:00`

        const slots = await tinhKhungGioTrong(ngay, totalDuration)
        if (!slots.includes(gioStart)) {
            return res.status(409).json({ error: 'Khung giờ này không còn trống. Vui lòng chọn giờ khác.' })
        }

        const lichHenId = await withTransaction(async (client) => {
            const lhResult = await client.query(
                `INSERT INTO lich_hen (ma_thu_cung, ngay_gio_hen, ngay_gio_ket_thuc_du_kien, trang_thai, ghi_chu)
                 VALUES ($1, $2, $3, 'ChoXacNhan', $4)
                 RETURNING ma_lich_hen`,
                [finalThuCungId, ngayGioHen, ngayGioKetThuc, ghiChu?.trim() || null]
            )
            const newId = lhResult.rows[0].ma_lich_hen
            for (const dv of dvResult.rows) {
                await client.query(
                    `INSERT INTO chi_tiet_lich_hen (ma_lich_hen, ma_dv, so_luong, gia_du_kien, trang_thai)
                     VALUES ($1, $2, 1, $3, 'ChoThucHien')`,
                    [newId, dv.ma_dv, dv.gia_hien_hanh]
                )
            }
            return newId
        })

        console.log(`[lichhen] Dat lich tai quay: #${lichHenId} - letan=${leTanId} - khach=${targetKhachHangId}`)

        res.status(201).json({
            message: `Đã đặt lịch hẹn #${lichHenId} tại quầy thành công.`,
            lichHenId,
        })
    } catch (err) {
        if (err.code === '23P01') {
            return res.status(409).json({ error: 'Khung giờ này vừa có người đặt. Vui lòng chọn giờ khác.' })
        }
        if (err.code === '23514') {
            return res.status(400).json({ error: 'Lịch hẹn nằm ngoài giờ mở cửa hoặc không hợp lệ.' })
        }
        next(err)
    }
}

/**
 * PATCH /api/lich-hen/:id/huy
 * Khach hang huy lich hen cua minh (chi ChoXacNhan hoac DaXacNhan).
 * NhanVien/Admin huy bat ky lich ChoXacNhan / DaXacNhan.
 */
export async function huyLichHen(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.user.userId
        const role = req.user.role

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

        // Khach hang chi huy duoc lich cua minh
        if (role === 'KhachHang' && lh.ma_khach_hang !== userId) {
            return res.status(403).json({ error: 'Bạn không có quyền hủy lịch hẹn này.' })
        }

        if (!['ChoXacNhan', 'DaXacNhan'].includes(lh.trang_thai)) {
            return res.status(400).json({ error: `Không thể hủy lịch đang ở trạng thái "${STATUS_DISPLAY[lh.trang_thai] ?? lh.trang_thai}".` })
        }

        await query(
            `UPDATE lich_hen SET trang_thai = 'DaHuy' WHERE ma_lich_hen = $1`,
            [id]
        )

        console.log(`[lichhen] Huy lich #${id} - user=${userId}`)
        res.json({ message: `Đã hủy lịch hẹn #${id} thành công.` })
    } catch (err) {
        next(err)
    }
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

        const numStars = parseInt(stars, 10)
        if (isNaN(numStars) || numStars < 1 || numStars > 5) {
            return res.status(400).json({ error: 'Số sao đánh giá phải từ 1 đến 5.' })
        }

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
