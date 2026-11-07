export async function notify(client, recipient, bookingId, title, message) {
    await client.query(`INSERT INTO thong_bao(ma_nguoi_nhan,ma_lich_hen,tieu_de,noi_dung)
        VALUES($1,$2,$3,$4)`, [recipient, bookingId, title, message])
}

export async function notifyReception(client, bookingId, title, message) {
    await client.query(`INSERT INTO thong_bao(ma_nguoi_nhan,ma_lich_hen,tieu_de,noi_dung)
        SELECT nd.ma_nguoi_dung,$1,$2,$3 FROM nguoi_dung nd
        LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien=nd.ma_nguoi_dung
        WHERE nd.trang_thai=true AND (nd.vai_tro='Admin' OR
        (nd.vai_tro='NhanVien' AND nv.trang_thai=true AND nv.chuc_vu IN ('Lễ tân','Quản lý')))`,
    [bookingId, title, message])
}
