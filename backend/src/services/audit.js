export async function audit(client, booking, user, action, state, note) {
    await client.query(`INSERT INTO nhat_ky_lich_hen(ma_lich_hen,ma_nguoi_thuc_hien,hanh_dong,trang_thai_cu,trang_thai_moi,noi_dung)
        VALUES($1,$2,$3,$4,$5,$6)`, [booking.ma_lich_hen,user.userId,action,booking.trang_thai,state,note])
}
