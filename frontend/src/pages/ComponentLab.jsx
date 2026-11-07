import {useState} from 'react'
import Button from '../components/ui/Button.jsx'
import FormField from '../components/ui/FormField.jsx'
import Modal,{Drawer} from '../components/ui/Modal.jsx'
import {Skeleton,EmptyState,ErrorState} from '../components/ui/Feedback.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import {useToast} from '../components/ui/Toast.jsx'
import {StaffNavigation} from '../layouts/StaffLayout.jsx'

// Development-only showcase: no business API, account impersonation or persisted data.
export default function ComponentLab(){
  const [modal,setModal]=useState(false),[drawer,setDrawer]=useState(false),[busy,setBusy]=useState(false),[role,setRole]=useState('care')
  const notify=useToast()
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header><p className="text-sm font-bold text-brand-700">PETCARE · DEVELOPMENT</p><h1 className="mt-2 text-3xl font-extrabold">Emerald UI</h1><p className="mt-2 text-slate-600">Mẫu thành phần giao diện. Không đọc hoặc ghi dữ liệu nghiệp vụ.</p></header>
    <section className="grid gap-6 md:grid-cols-2"><div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Thao tác & biểu mẫu</h2>
      <div className="flex flex-wrap gap-3"><Button onClick={()=>setModal(true)}>Mở hộp thoại</Button><Button variant="secondary" onClick={()=>setDrawer(true)}>Mở drawer</Button><Button pending>Đang xử lý</Button><Button variant="danger" disabled>Vô hiệu hóa</Button></div>
      <FormField label="Tên hiển thị" required hint="Nhập tên để kiểm tra label và focus."><input placeholder="Ví dụ: Nguyễn An"/></FormField>
      <FormField label="Email mẫu" error="Địa chỉ email chưa hợp lệ."><input type="email" defaultValue="sai-dinh-dang"/></FormField>
      <Button variant="ghost" onClick={()=>notify('Đây là thông báo mẫu, không có thao tác lưu dữ liệu.')}>Thông báo thành công mẫu</Button>
      <Button variant="ghost" onClick={()=>notify('Thông báo lỗi mẫu. Đóng bằng nút bên cạnh.',{kind:'error'})}>Thông báo lỗi mẫu</Button>
    </div><div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Trạng thái & phản hồi</h2><div className="flex flex-wrap gap-2"><StatusBadge domain="appointment" code="ChoXacNhan"/><StatusBadge domain="appointment" code="DangThucHien"/><StatusBadge domain="invoice" code="HoanTienMotPhan"/><StatusBadge domain="complaint" code="ChoHoanTien"/></div><Skeleton rows={2}/><ErrorState message="Mẫu lỗi tải dữ liệu. Đây không phải danh sách rỗng." onRetry={()=>notify('Đã bấm thử lại mẫu.')}/><EmptyState title="Chưa có dữ liệu mẫu" description="Trạng thái rỗng được hiển thị riêng với lỗi kết nối."/></div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-lg font-bold">Danh mục menu theo vai trò</h2><div className="max-w-sm"><FormField label="Vai trò xem mẫu"><select value={role} onChange={e=>setRole(e.target.value)}><option value="care">Chăm sóc</option><option value="reception">Lễ tân</option><option value="manager">Quản lý</option><option value="admin">Admin</option><option value="customer">Khách hàng (không có menu nhân sự)</option></select></FormField><StaffNavigation role={role}/></div></section>
    <Modal open={modal} title="Kiểm tra hộp thoại" busy={busy} onClose={()=>setModal(false)} footer={<Button variant="secondary" disabled={busy} onClick={()=>setModal(false)}>Quay lại</Button>}><p className="mb-4 text-sm text-slate-600">Tab chỉ di chuyển trong hộp thoại. Escape đóng và trả focus về nút mở. Khi bận, Escape và nút đóng bị chặn.</p><FormField label="Ghi chú mẫu"><input/></FormField><label className="mt-5 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={busy} onChange={e=>setBusy(e.target.checked)}/>Giả lập đang xử lý</label></Modal>
    <Drawer open={drawer} title="Menu mẫu trên điện thoại" onClose={()=>setDrawer(false)}><p className="mb-4 text-sm">Đây là drawer kiểm tra bàn phím và kích thước.</p><Button variant="secondary" onClick={()=>setDrawer(false)}>Đóng drawer</Button></Drawer>
  </main>
}
