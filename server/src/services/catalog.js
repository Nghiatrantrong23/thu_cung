import { query,withTransaction } from '../config/db.js'
import { cents,decimal } from '../lib/money.js'
import { string } from '../lib/validation.js'
import { validateDuration } from '../lib/scheduling.js'
import { integerId } from './dispatch.js'
import { bookingError } from './booking.js'
export async function catalog() {
    const [types,services]=await Promise.all([query('SELECT ma_loai_dv AS id,ten_loai_dv AS name FROM loai_dv ORDER BY ten_loai_dv'),query(`SELECT ma_dv AS id,ma_loai_dv AS "typeId",ten_dv AS name,mo_ta AS description,gia_hien_hanh AS price,thoi_luong_phut AS duration,trang_thai AS active FROM dich_vu ORDER BY ma_dv`)])
    return {loaiDichVu:types.rows,dichVu:services.rows}
}
export async function saveService(id,body) {
    const name=string(body?.ten,'Tên dịch vụ',100),description=string(body?.moTa,'Mô tả',500,false)||null
    const type=integerId(body?.maLoaiDichVu),price=decimal(cents(body?.gia)),duration=validateDuration(body?.thoiLuongPhut)
    if(typeof body.dangKinhDoanh!=='boolean')throw bookingError(400,'Trạng thái dịch vụ phải là true hoặc false.')
    return withTransaction(async client=>{
        const params=[name,description,type,price,duration,body.dangKinhDoanh]
        const result=id?await client.query('UPDATE dich_vu SET ten_dv=$1,mo_ta=$2,ma_loai_dv=$3,gia_hien_hanh=$4,thoi_luong_phut=$5,trang_thai=$6,ngay_cap_nhat=NOW() WHERE ma_dv=$7 RETURNING ma_dv AS id',[...params,integerId(id)])
            :await client.query('INSERT INTO dich_vu(ten_dv,mo_ta,ma_loai_dv,gia_hien_hanh,thoi_luong_phut,trang_thai) VALUES($1,$2,$3,$4,$5,$6) RETURNING ma_dv AS id',params)
        if(!result.rowCount)throw bookingError(404,'Không tìm thấy dịch vụ.')
        return {id:result.rows[0].id,message:'Đã lưu danh mục; giá lịch/hóa đơn cũ được giữ nguyên.'}
    })
}
export async function saveServiceType(body) {
    const name=string(body?.ten,'Tên nhóm dịch vụ',100),description=string(body?.moTa,'Mô tả',255,false)||null
    const result=await query('INSERT INTO loai_dv(ten_loai_dv,mo_ta) VALUES($1,$2) RETURNING ma_loai_dv AS id',[name,description])
    return {id:result.rows[0].id,message:'Đã tạo nhóm dịch vụ.'}
}
