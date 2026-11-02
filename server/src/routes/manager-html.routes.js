import express from 'express'
import { authenticate, requireManager } from '../middleware/auth.middleware.js'
import { query, withTransaction } from '../config/db.js'
import { integerId } from '../services/dispatch.js'
import { bookingError } from '../services/booking.js'
import { isValidDate, businessNow } from '../lib/scheduling.js'
import { string } from '../lib/validation.js'
import { reportPeriod, revenue } from '../services/reports.js'
import { promotionDiscount } from '../services/promotions.js'

const router=express.Router()
router.use(authenticate,requireManager)
const nonnegative=(value,label)=>{
    const number=Number(value)
    if (!Number.isSafeInteger(number)||number<0) throw bookingError(400,`${label} phải là số nguyên không âm.`)
    return number
}
const positive=(value,label)=>{
    const number=nonnegative(value,label)
    if(!number)throw bookingError(400,`${label} phải lớn hơn 0.`)
    return number
}

router.get('/nhan-vien',async(req,res,next)=>{
    try {
        const rows=await query(`SELECT nv.ma_nhan_vien AS id,nv.ho_ten AS name,nd.ten_dang_nhap AS username,
            nd.so_dien_thoai AS phone,nv.trang_thai AS active,nv.ky_nang_da_cau_hinh AS "skillsConfigured",
            COALESCE((SELECT array_agg(ma_dv ORDER BY ma_dv) FROM nhan_vien_dich_vu WHERE ma_nhan_vien=nv.ma_nhan_vien),'{}'::int[]) AS skills,
            (SELECT to_char(tu_ngay,'YYYY-MM-DD') FROM nghi_phep_nhan_vien np WHERE np.ma_nhan_vien=nv.ma_nhan_vien AND np.trang_thai=true AND np.den_ngay>=CURRENT_DATE ORDER BY tu_ngay LIMIT 1) AS "leaveFrom",
            (SELECT to_char(den_ngay,'YYYY-MM-DD') FROM nghi_phep_nhan_vien np WHERE np.ma_nhan_vien=nv.ma_nhan_vien AND np.trang_thai=true AND np.den_ngay>=CURRENT_DATE ORDER BY tu_ngay LIMIT 1) AS "leaveTo"
            FROM nhan_vien nv JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
            WHERE nd.vai_tro='NhanVien' AND nv.chuc_vu='Nhân viên chăm sóc' ORDER BY nv.ho_ten`)
        res.json({staff:rows.rows})
    }catch(err){next(err)}
})

router.put('/nhan-vien/:id',async(req,res,next)=>{
    try {
        const id=integerId(req.params.id),name=string(req.body?.name,'Họ tên',100)
        const phone=req.body?.phone==null||req.body.phone===''?null:string(req.body.phone,'Số điện thoại',10)
        if(phone&&!/^\d{10}$/.test(phone))throw bookingError(400,'Số điện thoại phải gồm 10 chữ số.')
        const skills=req.body?.skills
        if(!Array.isArray(skills)||!skills.length||skills.length>100)throw bookingError(400,'Chọn ít nhất một dịch vụ được phép làm.')
        const ids=skills.map(integerId)
        if(new Set(ids).size!==ids.length)throw bookingError(400,'Dịch vụ không được trùng.')
        const active=req.body?.active
        if(typeof active!=='boolean')throw bookingError(400,'Trạng thái nhân viên không hợp lệ.')
        const leaveFrom=req.body?.leaveFrom||null,leaveTo=req.body?.leaveTo||null
        if((leaveFrom||leaveTo)&&(!isValidDate(leaveFrom)||!isValidDate(leaveTo)||leaveTo<leaveFrom||leaveFrom<businessNow().date||
            (Date.parse(leaveTo)-Date.parse(leaveFrom))/86400000>366))throw bookingError(400,'Khoảng nghỉ phép không hợp lệ (tối đa 367 ngày).')
        const result=await withTransaction(async client=>{
            const staff=(await client.query(`SELECT nv.ma_nhan_vien FROM nhan_vien nv JOIN nguoi_dung nd ON nd.ma_nguoi_dung=nv.ma_nhan_vien
                WHERE nv.ma_nhan_vien=$1 AND nd.vai_tro='NhanVien' AND nv.chuc_vu='Nhân viên chăm sóc' FOR UPDATE OF nv,nd`,[id])).rows[0]
            if(!staff)throw bookingError(404,'Không tìm thấy nhân viên chăm sóc; Admin cần cấp tài khoản trước.')
            const valid=await client.query('SELECT ma_dv FROM dich_vu WHERE ma_dv=ANY($1::int[]) AND trang_thai=true',[ids])
            if(valid.rowCount!==ids.length)throw bookingError(400,'Có dịch vụ không còn được cung cấp.')
            const conflicts=await client.query(`SELECT 1 FROM lich_hen lh LEFT JOIN chi_tiet_lich_hen ct ON ct.ma_lich_hen=lh.ma_lich_hen
                WHERE lh.ma_nhan_vien=$1 AND lh.ngay_gio_hen>=CURRENT_DATE AND lh.trang_thai IN ('DaXacNhan','DangThucHien')
                AND (NOT $2::boolean OR ($3::date IS NOT NULL AND lh.ngay_gio_hen::date BETWEEN $3::date AND $4::date)
                    OR (ct.ma_dv IS NOT NULL AND NOT ct.ma_dv=ANY($5::int[]))) LIMIT 1`,[id,active,leaveFrom,leaveTo,ids])
            if(conflicts.rowCount)throw bookingError(409,'Nhân viên có lịch mở bị ảnh hưởng. Hãy điều phối trước khi đổi trạng thái, nghỉ phép hoặc kỹ năng.')
            await client.query('UPDATE nhan_vien SET ho_ten=$2,trang_thai=$3,ky_nang_da_cau_hinh=true,ngay_cap_nhat=NOW() WHERE ma_nhan_vien=$1',[id,name,active])
            await client.query('UPDATE nguoi_dung SET so_dien_thoai=$2,ngay_cap_nhat=NOW() WHERE ma_nguoi_dung=$1',[id,phone])
            await client.query('DELETE FROM nhan_vien_dich_vu WHERE ma_nhan_vien=$1',[id])
            for(const serviceId of ids)await client.query('INSERT INTO nhan_vien_dich_vu(ma_nhan_vien,ma_dv) VALUES($1,$2)',[id,serviceId])
            await client.query('UPDATE nghi_phep_nhan_vien SET trang_thai=false WHERE ma_nhan_vien=$1 AND trang_thai=true AND den_ngay>=CURRENT_DATE',[id])
            if(leaveFrom)await client.query('INSERT INTO nghi_phep_nhan_vien(ma_nhan_vien,tu_ngay,den_ngay,ma_nguoi_tao) VALUES($1,$2,$3,$4)',[id,leaveFrom,leaveTo,req.user.userId])
            return id
        })
        res.json({id:result,message:'Đã lưu hồ sơ nhân sự.'})
    }catch(err){next(err)}
})

router.get('/khuyen-mai',async(req,res,next)=>{
    try{
        const result=await query(`SELECT km.ma_khuyen_mai AS id,km.ma_code AS code,km.loai AS type,km.gia_tri AS value,
            km.giam_toi_da AS "maxDiscount",km.don_toi_thieu AS "minOrder",to_char(km.tu_ngay,'YYYY-MM-DD') AS "from",
            to_char(km.den_ngay,'YYYY-MM-DD') AS "to",km.tong_luot AS "totalUses",km.moi_khach AS "perCustomer",km.dang_bat AS active,
            (SELECT count(*)::int FROM khuyen_mai_su_dung ksd WHERE ksd.ma_khuyen_mai=km.ma_khuyen_mai) AS used,
            COALESCE((SELECT array_agg(ma_dv ORDER BY ma_dv) FROM khuyen_mai_dich_vu WHERE ma_khuyen_mai=km.ma_khuyen_mai),'{}'::int[]) AS services
            FROM khuyen_mai km ORDER BY km.ma_khuyen_mai DESC`)
        res.json({promotions:result.rows})
    }catch(err){next(err)}
})

router.post('/khuyen-mai',async(req,res,next)=>{
    try{
        const code=string(req.body?.code,'Mã khuyến mãi',12).toUpperCase()
        if(!/^[A-Z0-9]{4,12}$/.test(code))throw bookingError(400,'Mã gồm 4–12 chữ hoặc số.')
        const type=req.body?.type
        if(!['PhanTram','SoTien'].includes(type))throw bookingError(400,'Loại giảm không hợp lệ.')
        const value=positive(req.body?.value,'Giá trị giảm'),maxDiscount=nonnegative(req.body?.maxDiscount??0,'Giảm tối đa')
        const minOrder=nonnegative(req.body?.minOrder??0,'Đơn tối thiểu')
        if(type==='PhanTram'&&value>100)throw bookingError(400,'Phần trăm tối đa 100.')
        const from=req.body?.from,to=req.body?.to
        if(!isValidDate(from)||!isValidDate(to)||to<from)throw bookingError(400,'Ngày hiệu lực không hợp lệ.')
        const totalUses=positive(req.body?.totalUses,'Tổng lượt'),perCustomer=positive(req.body?.perCustomer,'Lượt mỗi khách')
        const services=req.body?.services??[]
        if(!Array.isArray(services)||services.length>100)throw bookingError(400,'Danh sách dịch vụ không hợp lệ.')
        const ids=services.map(integerId)
        if(new Set(ids).size!==ids.length)throw bookingError(400,'Dịch vụ bị trùng.')
        const id=await withTransaction(async client=>{
            if(ids.length){const found=await client.query('SELECT ma_dv FROM dich_vu WHERE ma_dv=ANY($1::int[]) AND trang_thai=true',[ids]);if(found.rowCount!==ids.length)throw bookingError(400,'Dịch vụ không hợp lệ.')}
            const row=await client.query(`INSERT INTO khuyen_mai(ma_code,loai,gia_tri,giam_toi_da,don_toi_thieu,tu_ngay,den_ngay,tong_luot,moi_khach,nguoi_tao)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ma_khuyen_mai`,[code,type,value,maxDiscount,minOrder,from,to,totalUses,perCustomer,req.user.userId])
            for(const serviceId of ids)await client.query('INSERT INTO khuyen_mai_dich_vu(ma_khuyen_mai,ma_dv) VALUES($1,$2)',[row.rows[0].ma_khuyen_mai,serviceId])
            return row.rows[0].ma_khuyen_mai
        })
        res.status(201).json({id})
    }catch(err){next(err)}
})
router.patch('/khuyen-mai/:id',async(req,res,next)=>{
    try{
        if(typeof req.body?.active!=='boolean')throw bookingError(400,'Trạng thái không hợp lệ.')
        const row=await query('UPDATE khuyen_mai SET dang_bat=$2 WHERE ma_khuyen_mai=$1 RETURNING ma_khuyen_mai AS id',[integerId(req.params.id),req.body.active])
        if(!row.rowCount)throw bookingError(404,'Không tìm thấy mã khuyến mãi.')
        res.json({id:row.rows[0].id})
    }catch(err){next(err)}
})
router.post('/khuyen-mai/thu',async(req,res,next)=>{
    try{
        const customerId=integerId(req.body?.customerId)
        if (!(await query('SELECT 1 FROM khach_hang WHERE ma_khach_hang=$1',[customerId])).rowCount) throw bookingError(404,'Không tìm thấy khách hàng để thử mã.')
        const serviceIds=req.body?.serviceIds
        if(!Array.isArray(serviceIds)||!serviceIds.length||serviceIds.length>100)throw bookingError(400,'Chọn dịch vụ để thử mã.')
        const ids=serviceIds.map(integerId)
        const details=(await query('SELECT ma_dv,gia_hien_hanh AS gia_du_kien,1 AS so_luong FROM dich_vu WHERE ma_dv=ANY($1::int[]) AND trang_thai=true',[ids])).rows
        if(details.length!==new Set(ids).size)throw bookingError(400,'Dịch vụ không hợp lệ.')
        const result=await promotionDiscount({query},req.body?.code,customerId,details,false)
        res.json({subtotal:result.total/100,discount:result.discount/100,total:(result.total-result.discount)/100})
    }catch(err){next(err)}
})

router.get('/thanh-vien',async(req,res,next)=>{
    try{
        const tiers=await query('SELECT ma_hang AS id,ten AS name,nguong_chi_tieu AS threshold,giam_gia AS discount,uu_tien AS priority FROM hang_thanh_vien ORDER BY nguong_chi_tieu')
        const points=(await query('SELECT dong_moi_diem AS "perPoint",han_thang AS "expiryMonths" FROM cau_hinh_diem_thanh_vien WHERE id=true')).rows[0]
        const packages=await query(`SELECT gt.ma_goi AS id,gt.ma_dv AS "serviceId",dv.ten_dv AS "serviceName",gt.so_lan AS quantity,gt.gia_goi AS price,gt.dang_ban AS active
            FROM goi_tra_truoc gt JOIN dich_vu dv USING(ma_dv) ORDER BY gt.ma_goi DESC`)
        res.json({tiers:tiers.rows,points,packages:packages.rows})
    }catch(err){next(err)}
})
router.put('/thanh-vien',async(req,res,next)=>{
    try{
        const tiers=req.body?.tiers,points=req.body?.points
        if(!Array.isArray(tiers)||tiers.length<1||tiers.length>10||!points)throw bookingError(400,'Cấu hình thành viên không hợp lệ.')
        const validated=tiers.map((tier,i)=>({id:integerId(tier.id),threshold:nonnegative(tier.threshold,'Ngưỡng chi tiêu'),discount:nonnegative(tier.discount,'Giảm giá'),priority:tier.priority}))
        if(validated[0].threshold!==0||validated.some((t,i)=>t.discount>50||typeof t.priority!=='boolean'||(i&&t.threshold<=validated[i-1].threshold)))throw bookingError(400,'Ngưỡng phải tăng, giảm giá 0–50% và hạng đầu bắt đầu từ 0.')
        const perPoint=positive(points.perPoint,'Số đồng mỗi điểm'),expiryMonths=positive(points.expiryMonths,'Hạn điểm')
        if(perPoint<1000||expiryMonths>120)throw bookingError(400,'Quy đổi điểm hoặc hạn dùng không hợp lệ.')
        await withTransaction(async client=>{
            const current=await client.query('SELECT ma_hang FROM hang_thanh_vien ORDER BY nguong_chi_tieu FOR UPDATE')
            if(current.rowCount!==validated.length||current.rows.some((r,i)=>r.ma_hang!==validated[i].id))throw bookingError(409,'Danh sách hạng đã thay đổi. Vui lòng tải lại.')
            for(const tier of validated)await client.query('UPDATE hang_thanh_vien SET nguong_chi_tieu=$2,giam_gia=$3,uu_tien=$4 WHERE ma_hang=$1',[tier.id,tier.threshold,tier.discount,tier.priority])
            await client.query('UPDATE cau_hinh_diem_thanh_vien SET dong_moi_diem=$1,han_thang=$2 WHERE id=true',[perPoint,expiryMonths])
        })
        res.json({message:'Đã lưu cấu hình thành viên.'})
    }catch(err){next(err)}
})
router.post('/goi-tra-truoc',async(req,res,next)=>{
    try{
        const serviceId=integerId(req.body?.serviceId),quantity=positive(req.body?.quantity,'Số lần'),price=positive(req.body?.price,'Giá gói')
        if(quantity<2)throw bookingError(400,'Gói cần ít nhất hai lần sử dụng.')
        const result=await withTransaction(async client=>{
            const service=(await client.query('SELECT gia_hien_hanh FROM dich_vu WHERE ma_dv=$1 AND trang_thai=true FOR SHARE',[serviceId])).rows[0]
            if(!service)throw bookingError(404,'Dịch vụ không còn bán.')
            if(price>=Number(service.gia_hien_hanh)*quantity)throw bookingError(400,'Giá gói phải thấp hơn tổng giá lẻ hiện tại.')
            return client.query('INSERT INTO goi_tra_truoc(ma_dv,so_lan,gia_goi,nguoi_tao) VALUES($1,$2,$3,$4) RETURNING ma_goi AS id',[serviceId,quantity,price,req.user.userId])
        })
        res.status(201).json({id:result.rows[0].id,message:'Đã lưu gói. Chưa mở bán khi chưa có luồng mua và sử dụng.'})
    }catch(err){next(err)}
})

router.get('/bao-cao',async(req,res,next)=>{
    try{
        const from=req.query.tuNgay,to=req.query.denNgay
        reportPeriod(from,to)
        const summary=await revenue(from,to)
        const appointments=await query(`SELECT ngay_gio_hen::date::text AS date,trang_thai AS status,count(*)::int AS count FROM lich_hen
            WHERE ngay_gio_hen>=$1::date AND ngay_gio_hen<$2::date+INTERVAL '1 day' GROUP BY ngay_gio_hen::date,trang_thai ORDER BY date`,[from,to])
        const reviews=await query(`SELECT round(avg(dg.so_sao)::numeric,2) AS average,count(*)::int AS count FROM danh_gia dg JOIN lich_hen lh USING(ma_lich_hen)
            WHERE lh.ngay_gio_hen>=$1::date AND lh.ngay_gio_hen<$2::date+INTERVAL '1 day'`,[from,to])
        const complaints=await query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE kn.trang_thai='DaXuLy')::int AS resolved FROM khieu_nai kn
            WHERE kn.ngay_tiep_nhan>=$1::date AND kn.ngay_tiep_nhan<$2::date+INTERVAL '1 day'`,[from,to])
        const customers=await query(`SELECT count(*)::int AS count FROM khach_hang kh JOIN nguoi_dung nd ON nd.ma_nguoi_dung=kh.ma_khach_hang
            WHERE nd.ngay_tao>=$1::date AND nd.ngay_tao<$2::date+INTERVAL '1 day'`,[from,to])
        const staff=await query(`SELECT nv.ma_nhan_vien AS id,nv.ho_ten AS name,count(lh.ma_lich_hen) FILTER(WHERE lh.trang_thai='HoanThanh')::int AS completed,
            round(avg(dg.so_sao)::numeric,2) AS rating,round(avg(EXTRACT(EPOCH FROM (lh.ngay_gio_ket_thuc_du_kien-lh.ngay_gio_hen))/60)::numeric,1) AS "scheduledMinutes"
            FROM nhan_vien nv LEFT JOIN lich_hen lh ON lh.ma_nhan_vien=nv.ma_nhan_vien AND lh.ngay_gio_hen>=$1::date AND lh.ngay_gio_hen<$2::date+INTERVAL '1 day'
            LEFT JOIN danh_gia dg ON dg.ma_lich_hen=lh.ma_lich_hen WHERE nv.chuc_vu='Nhân viên chăm sóc' GROUP BY nv.ma_nhan_vien,nv.ho_ten ORDER BY nv.ho_ten`,[from,to])
        res.json({summary,appointments:appointments.rows,reviews:reviews.rows[0],complaints:complaints.rows[0],newCustomers:customers.rows[0].count,staff:staff.rows})
    }catch(err){next(err)}
})

export default router
