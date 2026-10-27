# Hợp đồng API PetCare

Base `/api`; JSON UTF-8. Frontend HashRouter không ảnh hưởng đường dẫn API. Mặc định backend 5000, Vite proxy `/api`. Mã nguồn hiện tại là nguồn chuẩn khi mở rộng trường; không ghi secrets vào tài liệu.

## Quy ước

- Access token: `Authorization: Bearer <accessToken>`; refresh qua cookie HttpOnly, request dùng `credentials: include`. Access/refresh khác purpose và cùng kiểm tra phiên version trong DB.
- Ký hiệu quyền: K khách hàng (chỉ dữ liệu của mình), C chăm sóc (lịch được giao), T lễ tân, Q quản lý, A Admin. `T/Q/A` gọi là bộ phận tiếp nhận; `Q/A` quản lý nghiệp vụ.
- 200 đọc/cập nhật/ghi giao dịch, 201 tạo mới, 400 sai dữ liệu, 401 chưa đăng nhập/hết phiên, 403 ngoài quyền, 404 không có bản ghi, 409 xung đột/trạng thái vừa đổi hoặc chống lặp, 422 validation, 503 thiếu migration/DB/QR hoặc solver quá tải.
- Lỗi dạng `{ "error": "Thông báo" }`, một số route thêm `code`/`warning`. Không trả SQL, stack, mật khẩu hash. Tài khoản tạm chưa đổi mật khẩu trả 403 `PASSWORD_CHANGE_REQUIRED`.
- Ngày `YYYY-MM-DD`, giờ `HH:mm` theo **Asia/Ho_Chi_Minh**; khoảng thời gian nửa mở `[bắt đầu, kết thúc)`. Tiền VNĐ, không âm, tối đa 2 chữ số lẻ. Khóa ID số nguyên dương.
- Thanh toán/chi hoàn yêu cầu `khoaChongLap` 16–100 ký tự chữ/số/`._:-`, nên UUID ngẫu nhiên. Retry **đúng payload và cùng khóa** sau lỗi mạng. Đổi nội dung/cùng khóa trả 409. Sau thành công mới tạo khóa mới cho thao tác mới.
- Các list hóa đơn/khiếu nại hiện giới hạn 200 gần nhất; thông báo 50. Chưa có phân trang toàn bộ lịch sử.

## Health và database

`GET /health` (ngoài `/api`) 200 nếu tiến trình sống. `GET /ready` 200 `{status:'ready'}` khi DB đủ lịch sử 000–005; 503 `migration_required`/`database_unavailable` nếu chưa sẵn sàng. `/api/*` có kiểm tra readiness, trả 503 `MIGRATION_REQUIRED` hoặc `DATABASE_UNAVAILABLE`, không tự chạy migration và không tự baseline.

## Xác thực

| Method/route | Quyền | Body/kết quả chính |
| --- | --- | --- |
| POST `/auth/dang-ky` | Công khai | `username, fullName, phone, email?, password` → 201 `userId` |
| POST `/auth/dang-nhap` | Công khai | `tenDangNhap, matKhau` → `accessToken, user` và cookie refresh |
| POST `/auth/lam-moi-token` | Cookie refresh | → `accessToken`; version cũ/tài khoản khóa bị từ chối |
| POST `/auth/dang-xuat` | Cookie nếu có | Thu hồi phiên tương ứng, xóa cookie |
| GET `/auth/toi` | Đã đăng nhập | Thông tin người dùng; không hash/mật khẩu |
| PUT `/auth/cap-nhat` | Đã đăng nhập | `hoTen, email, soDienThoai` |
| POST `/auth/doi-mat-khau` | Đã đăng nhập | `matKhauHienTai, matKhauMoi, xacNhanMatKhauMoi`; thu hồi phiên, đăng nhập lại |

Username 4–30 chữ/số/chấm/gạch dưới; SĐT 10 số; email tùy chọn; mật khẩu >=8 ký tự, <=72 byte UTF-8. Tài khoản tạm chỉ được `/auth/toi`, `/auth/doi-mat-khau` trước khi đổi. Không có API quên mật khẩu/email OTP đã hoàn thành.

## Thú cưng, tra khách và danh mục

| Method/route | Quyền | Body/kết quả |
| --- | --- | --- |
| GET `/thu-cung` | K | `{pets:[...]}` |
| GET `/thu-cung/:id` | K sở hữu, C được giao, T/Q/A | `{pet}` |
| POST `/thu-cung` | K | `name, species, breed?, gender?, birthDate?, weightKg?, healthNote?` → 201 `{pet}` |
| PUT `/thu-cung/:id` | K sở hữu | Cùng trường như tạo |
| PATCH `/thu-cung/:id/trang-thai` | K sở hữu | `active:boolean`; không ngừng khi còn lịch mở |
| GET `/khach-hang/tra-cuu?sdt=...` | T/Q/A | SĐT đúng 10 số; khách và thú cưng; không có thì 404 |
| GET `/dich-vu` | Công khai | `{dichVu:[{id,ten,gia,thoiLuongPhut,...}]}` chỉ dịch vụ đang bán |
| GET `/dich-vu/quan-ly` | Q/A | `{loaiDichVu,dichVu}` gồm dịch vụ ngừng bán |
| POST `/dich-vu/loai` | Q/A | `ten, moTa?` → 201 `{id}` |
| POST `/dich-vu` | Q/A | `ten, moTa?, maLoaiDichVu, gia, thoiLuongPhut, dangKinhDoanh:boolean` → 201 `{id}` |
| PATCH `/dich-vu/:id` | Q/A | Cùng trường như tạo; ngừng bán mềm |

Loài Chó/Mèo, giới tính Đực/Cái, ngày sinh không ở tương lai, cân nặng dương <=999,99 kg. Thời lượng 1–660 phút. Đổi danh mục không đổi snapshot lịch/hóa đơn cũ.

## Lịch hẹn, điều phối, chăm sóc và ca

| Method/route | Quyền | Body/query/kết quả |
| --- | --- | --- |
| GET `/lich-hen` | K, C, T/Q/A | `?ngay=&trangThai=` cho nhân sự; K chỉ lịch của mình; C chỉ lịch được giao; `{lichHen}` |
| GET `/lich-hen/khung-gio-trong` | K/T/Q/A | `?ngay=YYYY-MM-DD&thoiLuong=60` → `{slots}` |
| POST `/lich-hen` | K | `thuCungId, ngay, gioStart, dichVuIds:[], ghiChu?` → 201 `lichHenId,booking,lichHen` |
| POST `/lich-hen/tai-quay` | T/Q/A | Cùng trường lịch; `khachHangId` nếu có, `sdt`; hoặc hồ sơ mới theo hợp đồng dưới |
| GET `/lich-hen/:id/nhan-vien-kha-dung` | T/Q/A | `{nhanVien}` |
| PATCH `/lich-hen/:id/xu-ly` | T/Q/A | `hanhDong:'phan-cong',nhanVienId`; hoặc `hanhDong:'giu-cho'/'tu-choi',lyDo` |
| PATCH `/lich-hen/:id/huy` | K sở hữu/T/Q/A | `lyDo` bắt buộc cho nhân sự; chỉ lịch chờ/xác nhận |
| PATCH `/lich-hen/:id/doi-lich` | T/Q/A | `ngay,gioStart,lyDo`; kiểm tra công suất, bỏ gán người, về chờ |
| PATCH `/lich-hen/:id/cham-soc` | C được giao | `hanhDong` theo bảng dưới, `ghiChu?` |
| GET `/lich-hen/:id/nhat-ky` | K sở hữu/C được giao/T/Q/A | `{nhatKy}` lịch sử hành động/người/trạng thái/ghi chú |
| POST `/lich-hen/:id/danh-gia` | K sở hữu | `stars:1..5,comment?` → 201, chỉ lịch hoàn thành, một lần |
| GET `/ca-lam-viec?ngay=...` | C/T/Q/A | `{caLam}`; C chỉ ca mình |
| GET `/ca-lam-viec/nhan-vien` | Q/A | Danh sách người chăm sóc hoạt động |
| POST `/ca-lam-viec` | Q/A | `nhanVienId,ngay,gioBatDau,gioKetThuc,viTri?,ghiChu?` → 201 `{id}` |
| PATCH `/ca-lam-viec/:id` | Q/A | `ngay,gioBatDau,gioKetThuc,viTri?,ghiChu?` |
| POST `/ca-lam-viec/:id/huy` | Q/A | Hủy mềm; kiểm tra ảnh hưởng lịch |

Đặt quầy khi khách mới: trường phẳng `hoTen,sdt,tenThuCung,loaiThuCung` (Chó/Mèo), cùng ngày/giờ/dịch vụ; bỏ `thuCungId` khi tạo thú cưng mới. Khi chọn thú cưng cũ dùng `thuCungId` và mã khách hoặc SĐT tương ứng. API quầy tối thiểu hiện không nhận hồ sơ mới lồng `thuCungMoi` hoặc email. Phản hồi chỉ khi tạo tài khoản mới có `taiKhoanTam:{username,password}` một lần, phải bàn giao kín và đổi trước khi dùng. Hợp đồng thực tại `server/src/services/booking.js` và MH-02b.

Chăm sóc:

- `bat-dau`: lịch xác nhận của mình, ngày hôm nay VN, không có vấn đề chờ xử lý → DangThucHien.
- `khong-du-dieu-kien`: `ghiChu` bắt buộc, trước khi bắt đầu; báo lễ tân, không tự hủy.
- `dich-vu`: thêm `maDichVu,trangThai:'DangThucHien'/'HoanThanh'`; từng dịch vụ phải theo thứ tự.
- `hoan-thanh`: chỉ khi mọi chi tiết hoàn thành; thông báo sẵn sàng lập hóa đơn.

Lịch: `ChoXacNhan → DaXacNhan → DangThucHien → HoanThanh`; từ chối `TuChoi`, hủy `DaHuy` tách riêng. Đổi giờ về chờ phân công lại. Hủy/thu hẹp ca và thay tài khoản đều kiểm tra công suất trong khóa; không cộng hai ca kề nhau thành một ca.

Khung giờ trống giữ trường `slots` và bổ sung `reason`: `NO_SHIFTS` khi không có ca chăm sóc hoạt động; `PAST_DATE` khi ngày đã qua; `NO_CAPACITY` khi có ca nhưng không còn khoảng phục vụ phù hợp; `null` khi có giờ chọn. Không trả thông tin cá nhân nhân viên cho khách. Giờ mở cửa không tự tạo ca; quản lý xếp ca qua MH-09. Lỗi API phải hiện thông báo lỗi, không diễn giải thành hết chỗ.

## Hóa đơn và thu tiền

| Method/route | Quyền | Hợp đồng |
| --- | --- | --- |
| GET `/hoa-don` | K/T/Q/A | `{hoaDon}` K chỉ của mình |
| GET `/hoa-don/:id` | K sở hữu/T/Q/A | `invoice,details,transactions,paid,refunded,remaining` |
| POST `/hoa-don` | T/Q/A | `maLichHen,giamGia?` → 201 `{id,message}` |
| POST `/hoa-don/:id/thanh-toan` | T/Q/A | Body dưới, → `id,message,tienThua` hoặc `replayed:true` |
| GET `/hoa-don/:id/qr` | T/Q/A | Hiện 503 `QR_NOT_CONFIGURED`, ngân hàng để sau |

```json
{
  "soTien": 100000,
  "phuongThuc": "TienMat",
  "tienKhachDua": 200000,
  "khoaChongLap": "example-unique-operation-01",
  "ketQua": "ThanhCong"
}
```

Chuyển khoản: `phuongThuc:'ChuyenKhoanQR',daNhanTien:true,maGiaoDich?`; đây là ghi nhận tiền đã nhận, không tự xác minh ngân hàng. `ketQua:'ThatBai'` lưu thất bại không giảm nợ. Mỗi lần >0 và <= còn nợ; khóa hóa đơn chống thu đồng thời vượt nợ. Tiền thừa 100.000 trong ví dụ; chỉ 100.000 giảm nợ.

Chỉ lập từ lịch và mọi chi tiết đã hoàn thành, một hóa đơn/lịch, snapshot tên/giá; giảm <= tổng. Thành tiền 0 tất toán không có giao dịch 0. Trạng thái `ChuaThanhToan`, `ThanhToanMotPhan`, `DaThanhToan`, `HoanTienMotPhan`, `DaHoanTien`, `DaHuy`.

## Khiếu nại, duyệt và thực chi hoàn

| Method/route | Quyền | Hợp đồng |
| --- | --- | --- |
| GET `/khieu-nai` | K/T/Q/A | `{khieuNai:[...]}`; K chỉ của mình |
| GET `/khieu-nai/:id` | K sở hữu/T/Q/A | `{khieuNai:row}`; không thuộc mình 404 |
| POST `/khieu-nai` | T/Q/A | `maLichHen,maHoaDon?,noiDung` → 201 `{id}` |
| POST `/khieu-nai/cua-toi` | K | `maLichHen,noiDung` → 201 `{id}`; server kiểm sở hữu lịch, tự lấy hóa đơn và người gửi; lịch không thuộc khách trả 404 |
| PATCH `/khieu-nai/:id/quyet-dinh` | Q/A | `quyetDinh:'TuChoi'/'KhacPhuc'/'HoanTien',phuongAn,soTienHoan?` |
| POST `/khieu-nai/:id/chi-hoan` | T/Q/A | Body dưới; thành công mới đóng khiếu nại và đổi tiền |

```json
{
  "phuongThucChi": "TienMat",
  "xacNhanDaChi": true,
  "bangChung": "PHIEU-CHI-DEMO-001",
  "khoaChongLap": "example-refund-operation-01",
  "ketQua": "ThanhCong"
}
```

Chuyển khoản dùng `phuongThucChi:'ChuyenKhoan'`. Chi thất bại: `ketQua:'ThatBai',loiChi:'Lý do'`, vẫn phải chọn phương thức/khóa; không cần xác nhận đã trả. Trường chứng từ tối đa 100 ký tự, lý do lỗi tối đa 500.

`DaTiepNhan → ChoHoanTien` khi duyệt; tiền chưa thay đổi. Duyệt dương <= đã thu - đã hoàn thành công - các khoản duyệt khác chờ chi; chỉ bill đã thu đủ/còn hoàn. Thực chi thành công mới ghi `HoanTien/ThanhCong`, ngày/người/chứng từ và `DaXuLy`; bill hoàn một phần/toàn bộ. Không có API tự chuyển tiền qua ngân hàng.

## Báo cáo, Admin và thông báo

| Method/route | Quyền | Hợp đồng |
| --- | --- | --- |
| GET `/bao-cao/doanh-thu` | Q/A | `?tuNgay=&denNgay=` tối đa 366 ngày → `collected,refunded,net,daily,services,statuses,invoices,legacyRefundRows,timezone` |
| GET `/admin/tai-khoan` | A | `?q=&vaiTro=` → `{data:[...]}` |
| POST `/admin/tai-khoan` | A | `tenDangNhap,hoTen,chucVu,soDienThoai?,email?` → 201 `{data:{maNguoiDung,matKhauTam,...}}` |
| PATCH `/admin/tai-khoan/:id` | A | `vaiTro?,chucVu?,hoTen?,email?,soDienThoai?` |
| POST `/admin/tai-khoan/:id/khoa` | A | `{xacNhan:true}` nếu lịch đã xác nhận; 409 warning trước xác nhận, hoặc 409 thiếu công suất không được bỏ qua |
| POST `/admin/tai-khoan/:id/mo-khoa` | A | Không reset mật khẩu |
| POST `/admin/tai-khoan/:id/dat-lai-mat-khau` | A | Trả mật khẩu tạm một lần, bắt đổi, thu hồi phiên |
| GET `/thong-bao` | Đăng nhập | `{thongBao}` chỉ người nhận, 50 gần nhất |
| PATCH `/thong-bao/:id/da-doc` | Người nhận | 404 nếu không thuộc mình |

Báo cáo `net = collected - refunded` chỉ giao dịch thành công theo ngày giao dịch VN. Duyệt chưa chi và thất bại không trừ tiền. Tổng dịch vụ trước giảm theo ngày lập hóa đơn, trạng thái lịch theo ngày hẹn; không phải lợi nhuận. `legacyRefundRows > 0` yêu cầu đối soát dữ liệu cũ, không tự diễn giải thành khoản chi đã xác minh.

Admin tạo nhân viên chỉ chức vụ Lễ tân/Quản lý/Nhân viên chăm sóc. Không tự khóa/hạ vai trò; đổi quyền thu hồi phiên và giữ profile cũ cho lịch sử. Nhân viên đang làm không khóa; lịch đã giao chỉ đưa về chờ nếu vẫn đủ ca. Không có endpoint xóa dữ liệu trong phạm vi này.
