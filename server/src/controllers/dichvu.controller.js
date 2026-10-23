import { query } from '../config/db.js'

/**
 * GET /api/dich-vu
 * Danh sach dich vu dang kinh doanh (trang_thai = true).
 * Public - khong can dang nhap.
 */
export async function layDanhSachDichVu(req, res, next) {
    try {
        const result = await query(
            `SELECT dv.ma_dv, dv.ten_dv, dv.mo_ta, dv.gia_hien_hanh, dv.thoi_luong_phut, dv.trang_thai,
                    ldv.ten_loai_dv
             FROM dich_vu dv
             JOIN loai_dv ldv ON dv.ma_loai_dv = ldv.ma_loai_dv
             WHERE dv.trang_thai = true
             ORDER BY ldv.ma_loai_dv, dv.ma_dv`
        )

        const dichVu = result.rows.map((r) => ({
            id: r.ma_dv,
            ten: r.ten_dv,
            moTa: r.mo_ta ?? '',
            gia: Number(r.gia_hien_hanh),
            thoiLuongPhut: r.thoi_luong_phut,
            loai: r.ten_loai_dv,
            dangKinhDoanh: r.trang_thai,
        }))

        res.json({ dichVu })
    } catch (err) {
        next(err)
    }
}
