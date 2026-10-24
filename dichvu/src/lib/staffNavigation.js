const intake=['reception','manager','admin'],management=['manager','admin']
const home={care:'/nhan-vien',reception:'/le-tan',manager:'/quan-ly',admin:'/admin'}
const links=[
  {path:'/nhan-vien/lich-lam-viec',label:'Lịch làm việc & chăm sóc',short:'CS',group:'Công việc',roles:['care']},
  {path:'/le-tan/lich-hen',label:'Lịch hẹn & phân công',short:'LH',group:'Vận hành',roles:intake},
  {path:'/le-tan/dat-lich-tai-quay',label:'Đặt lịch tại quầy',short:'ĐL',group:'Vận hành',roles:intake},
  {path:'/le-tan/hoa-don',label:'Hóa đơn & thanh toán',short:'HĐ',group:'Tài chính',roles:intake},
  {path:'/le-tan/khieu-nai',label:'Khiếu nại & hoàn tiền',short:'KN',group:'Tài chính',roles:intake},
  {path:'/quan-ly/ca-lam-viec',label:'Ca làm việc',short:'CA',group:'Quản lý',roles:management},
  {path:'/quan-ly/dich-vu',label:'Dịch vụ & bảng giá',short:'DV',group:'Quản lý',roles:management},
  {path:'/quan-ly/bao-cao',label:'Thống kê & báo cáo',short:'BC',group:'Quản lý',roles:management},
  {path:'/admin/tai-khoan',label:'Tài khoản & phân quyền',short:'TK',group:'Hệ thống',roles:['admin']},
]
export function staffNavigation(role){return Object.hasOwn(home,role)?[{path:home[role],label:'Không gian làm việc',short:'PC',group:'Tổng quan'},...links.filter(link=>link.roles.includes(role))]:[]}
