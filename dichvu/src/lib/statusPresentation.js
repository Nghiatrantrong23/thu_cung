const entries={
 catalog:{Active:['Đang bán','emerald'],Inactive:['Ngừng bán','slate']},
 shift:{Active:['Đang áp dụng','emerald'],Cancelled:['Đã hủy','slate']},
 pet:{Active:['Đang theo dõi','emerald'],Inactive:['Ngừng theo dõi','slate']},
 appointment:{ChoXacNhan:['Chờ xác nhận','amber'],DaXacNhan:['Đã xác nhận','sky'],DangThucHien:['Đang thực hiện','indigo'],HoanThanh:['Hoàn thành','emerald'],DaHuy:['Đã hủy','slate'],TuChoi:['Từ chối','rose']},
 service:{ChoThucHien:['Chờ thực hiện','amber'],DangThucHien:['Đang thực hiện','indigo'],HoanThanh:['Hoàn thành','emerald'],DaHuy:['Đã hủy','slate']},
 invoice:{ChuaThanhToan:['Chưa thanh toán','amber'],ThanhToanMotPhan:['Thanh toán một phần','amber'],DaThanhToan:['Đã thanh toán','emerald'],HoanTienMotPhan:['Hoàn tiền một phần','indigo'],DaHoanTien:['Đã hoàn tiền','slate'],DaHuy:['Đã hủy','slate']},
 complaint:{DaTiepNhan:['Đã tiếp nhận','amber'],ChoHoanTien:['Đã duyệt, chờ thực chi','sky'],DaXuLy:['Đã xử lý','emerald']},
 transaction:{ThanhCong:['Thành công','emerald'],ThatBai:['Thất bại','rose']},
}
export const badgeClasses={amber:'bg-amber-100 text-amber-900',sky:'bg-sky-100 text-sky-900',indigo:'bg-indigo-100 text-indigo-900',emerald:'bg-emerald-100 text-emerald-900',slate:'bg-slate-100 text-slate-700',rose:'bg-rose-100 text-rose-900'}
export function statusPresentation(domain,code){const group=entries[domain];const value=group?.[code]||Object.values(group||{}).find(item=>item[0]===code);return {label:value?.[0]||code||'Chưa xác định',tone:value?.[1]||'slate'}}
