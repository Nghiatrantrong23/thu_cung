# Đối chiếu sơ đồ và mã nguồn PetCare

Ngày 08/11/2026. Đọc trực tiếp 17 PNG, route React/Express, middleware, các service và DDL liên quan. Đây là kiểm tra tĩnh, không phải kết quả chạy API/UI mới. Mã được đọc là workspace có thay đổi chưa commit; commit khảo sát chỉ lưu tài liệu, không tự đưa code đó lên GitHub.

| Mã | Bằng chứng mã đã định vị | Đối chiếu và cách trình bày |
|---|---|---|
| UC-01 | `backend/src/middleware/auth.middleware.js:100`; [frontend/src/App.jsx](<../../frontend/src/App.jsx>) | Admin được canManageAppointments/requireManager cho phép nghiệp vụ vận hành; requireCare chỉ dành nhân viên chăm sóc. Khách vãng lai là tác nhân chưa đăng nhập, không phải vai trò lưu DB thứ sáu. Chưa chứng nhận include/extend hoàn toàn đúng ký pháp. |
| AD-01 | `backend/src/controllers/auth.controller.js:164`; [frontend/src/pages/DangNhap.jsx](<../../frontend/src/pages/DangNhap.jsx>) | Có kiểm tra dữ liệu và băm bcrypt; đăng ký trở về tab login. Hình chỉ mô tả luồng nghiệp vụ chính, không bao quát hết guard mật khẩu/SQL. |
| AD-02 | `backend/src/services/booking.js:70`; [backend/src/services/depositStore.js](<../../backend/src/services/depositStore.js>) | Tạo chủ/thú cưng mới tại quầy và lịch/chi tiết/thông báo/cọc nằm trong transaction; khóa ngày trước đọc công suất. Không tự phân người ngay trong createBooking. Cọc phải đủ trước xác nhận khi chính sách bật. |
| AD-03 | `backend/src/services/dispatch.js:64`; [backend/src/routes/lichhen.routes.js](<../../backend/src/routes/lichhen.routes.js>) | Ba hành động phan-cong/giu-cho/tu-choi là loại trừ; từ chối lưu TuChoi và hủy chi tiết. Hình ghi Đã hủy cho nhánh từ chối; phải nêu khác biệt. |
| AD-04 | `backend/src/services/care.js:10`; [backend/src/services/care.js](<../../backend/src/services/care.js>) | Không đủ điều kiện chỉ trước bắt đầu; ghi vấn đề và báo tiếp nhận. Đổi giờ qua reschedule, hủy qua cancelBooking; hoàn tất chỉ khi mọi chi tiết xong. Nhánh hoãn trên hình không có nghĩa hệ thống tự đổi trạng thái thành DaHuy. |
| AD-05 | `backend/src/services/invoices.js:24`; [backend/src/routes/hoadon.routes.js](<../../backend/src/routes/hoadon.routes.js>) | Mã có snapshot, cọc, nhiều lần thu, tiền đưa/tiền thừa và chống lặp. Có hướng dẫn VietQR cấu hình; nhân sự xác nhận thực nhận, chưa có đối soát merchant/webhook. Bản in không phải tích hợp hóa đơn điện tử thuế. |
| AD-06 | `backend/src/services/complaints.js:42`; [backend/src/services/complaints.js](<../../backend/src/services/complaints.js>) | Hình tạo giao dịch/đã hoàn trước lễ tân chi. Mã chỉ duyệt ChoHoanTien; executeRefund thành công mới ghi tiền và cập nhật hóa đơn. Chi thất bại giữ chờ. DaTiepNhan/DaXuLy và quyết định TuChoi thay các nhãn Chờ xử lý/Đã từ chối trên hình. |
| SD-01 | `backend/src/controllers/auth.controller.js:11`; [backend/src/middleware/auth.middleware.js](<../../backend/src/middleware/auth.middleware.js>) | Mô hình phiên tổng quát tương ứng đăng nhập; mã thêm access/refresh JWT có purpose/version, kiểm trạng thái hiện hành và bắt đổi mật khẩu tạm. frm/ctrl/NguoiDung trên hình không phải tên endpoint hay module đầy đủ. |
| SD-02 | `backend/src/lib/scheduling.js:61`; [backend/src/services/booking.js](<../../backend/src/services/booking.js>) | Message 19–22 và guard trên hình so số lịch với số người trực ca. Mã kiểm tra ca bao trọn, thành phần các khoảng giao nhau, giữ người đã gán và quay lui ưu tiên việc ít lựa chọn; có budget. Hai cơ chế không tương đương; chỉ thuyết minh, không sửa hình. |
| SD-03 | `backend/src/services/dispatch.js:64`; [backend/test/dispatch.integration.test.js](<../../backend/test/dispatch.integration.test.js>) | Hình từ chối DaHuy và opt có thể nối tiếp phần phân công. Mã trả một quyết định và dùng TuChoi; các kiểm thử có concurrent rejection/assignment không cùng thành công. Không gọi thứ tự hình là toàn bộ luồng chạy hiện tại. |
| SD-04 | `backend/src/services/care.js:10`; [backend/src/services/dispatch.js](<../../backend/src/services/dispatch.js>) | Khối lễ tân hủy nằm sau alt ở hình. Mã không cho hủy lịch HoanThanh/DangThucHien bằng cancelBooking; hoàn tất từng dịch vụ trước lịch. Phải phân tích nhánh hủy là tình huống riêng trước thực hiện, không đi tiếp sau nhánh thành công. |
| SD-05 | `backend/src/services/invoices.js:47`; [backend/src/lib/money.js](<../../backend/src/lib/money.js>) | Không lấy số tiền khách đưa làm số tiền ghi nhận bắt buộc. Mã tách amount/cash, khóa hóa đơn và idempotency; kiểm nợ sau cọc. Vòng loop và công thức trên hình chỉ là thiết kế ban đầu. |
| SD-06 | `backend/src/services/complaints.js:64`; [migrations/005_complaints_refunds.sql](<../../migrations/005_complaints_refunds.sql>) | Các message 18–22 trong hình ghi giao dịch/DaHoanTien/DaXuLy ngay khi duyệt, khác hiện tại. Quyết định chỉ reserve hạn mức; một lần thực chi thành công mới đổi tiền. Mã có hoàn một phần, khóa, thất bại và chống lặp. |
| CD-01 | `thu_cung.sql:7`; [backend/src/services/booking.js](<../../backend/src/services/booking.js>) | Quan hệ khách–thú cưng–lịch và hóa đơn/chi tiết có đối chiếu SQL. Phương thức trên hình là thiết kế miền; backend dùng hàm ES module/SQL, không triển khai hệ class cùng tên. Hình chưa chứa cọc, payment intent, reset token và nhật ký, cần trình bày mở rộng qua bảng dữ liệu, không gọi hình là schema đầy đủ. |
| SM-01 | `backend/src/services/dispatch.js:101`; [migrations/001_schema_improvements.sql](<../../migrations/001_schema_improvements.sql>) | Mã có thêm TuChoi; hủy chỉ khi ChoXacNhan/DaXacNhan. Hình cho DangThucHien → DaHuy và chưa có TuChoi. Lịch/cọc là hai đối tượng trạng thái riêng, không đổi tên Unpaid thành trạng thái lịch. |
| SM-02 | `backend/src/services/complaints.js:84`; [migrations/005_complaints_refunds.sql](<../../migrations/005_complaints_refunds.sql>) | Mã phân HoanTienMotPhan/DaHoanTien sau chi thành công; sơ đồ chưa có hoàn một phần. Hoàn tiền không khôi phục công nợ. Hóa đơn giá trị 0/cọc đủ có thể tất toán theo service, không mặc định luôn khởi tạo ChuaThanhToan. |
| MH-TQ | `frontend/src/App.jsx:35`; [frontend/src/main.jsx](<../../frontend/src/main.jsx>) | Cây nhóm màn hình thiếu tổng quan khách, hóa đơn/khiếu nại riêng, đổi mật khẩu tạm, đặt lại mật khẩu, trang in và các trang Admin. Nhóm lễ tân/quản lý trên cây không thay kiểm tra quyền ở React/server. Các trang gốc vai trò còn có GiuChoVaiTro; cây không biểu diễn mọi link điều hướng. |

## API tiêu biểu đã kiểm tra trong routes

Các endpoint dưới đây được ghép từ prefix trong `server.js` với route con; tên message trong Sequence không được dùng để tự tạo API.

| Method và đường dẫn | Nơi xác định | Quyền/phạm vi |
|---|---|---|
| POST `/api/auth/dang-nhap`, POST `/api/auth/dang-ky` | `auth.routes.js` | Công khai, có validation ở controller |
| POST `/api/auth/forgot-password`, POST `/api/auth/reset-password` | `auth.routes.js` gắn `passwordReset.routes.js` | Public có hạn mức; chưa nghiệm thu SMTP Mailtrap thật |
| GET `/api/lich-hen/khung-gio-trong`, POST `/api/lich-hen` | `lichhen.routes.js` | Đăng nhập; tạo online chỉ khách |
| POST `/api/lich-hen/tai-quay`, PATCH `/api/lich-hen/:id/xu-ly` | `lichhen.routes.js` | Lễ tân/quản lý/Admin theo middleware hiện hành |
| PATCH `/api/lich-hen/:id/cham-soc` | `lichhen.routes.js` | Nhân viên chăm sóc, còn kiểm tra người được giao |
| PATCH `/api/lich-hen/:id/doi-lich`, PATCH `/api/lich-hen/:id/huy` | `lichhen.routes.js` | Đổi giờ qua tiếp nhận; hủy theo quyền và sở hữu/trạng thái |
| POST `/api/hoa-don`, POST `/api/hoa-don/:id/thanh-toan` | `hoadon.routes.js` | Nhân sự tiếp nhận, kiểm nợ/khóa/chống lặp |
| GET `/api/payments/transfers/invoices/:id`, GET `/api/payments/transfers/deposits/:id` | `payments.routes.js` | Hướng dẫn chuyển tiền của dữ liệu được phép đọc, không tự ghi tiền |
| POST `/api/deposits/:id/collect`, POST `/api/deposits/:id/refund` | `deposits.routes.js` | Nhân sự tiếp nhận; kiểm tra chính sách và giao dịch |
| POST `/api/khieu-nai/cua-toi` | `khieunai.routes.js` | Khách, server suy chủ và hóa đơn |
| PATCH `/api/khieu-nai/:id/quyet-dinh`, POST `/api/khieu-nai/:id/chi-hoan` | `khieunai.routes.js` | Quyết định quản lý/Admin; thực chi tiếp nhận |
| GET `/api/bao-cao/doanh-thu` | `baocao.routes.js` | Quản lý/Admin; không phải lợi nhuận |
| GET/POST `/api/admin/tai-khoan`, PATCH `/api/admin/tai-khoan/:id` | `admin.routes.js` | Chỉ Admin; có route khóa/mở/reset riêng |

## Quy tắc dữ liệu và trạng thái phải dùng trong báo cáo

- SQL gốc + migrations 000–008 là nguồn DDL hiện tại; kế hoạch CSDL phần lõi mô tả 000–005 nên không dùng riêng số bảng cũ cho Chương 3.
- Lịch: ChoXacNhan, DaXacNhan, DangThucHien, HoanThanh, DaHuy, TuChoi. Khiếu nại: DaTiepNhan, ChoHoanTien, DaXuLy; quyết định TuChoi/KhacPhuc/HoanTien là cột riêng.
- Hóa đơn có HoanTienMotPhan ngoài các trạng thái trong hình. Cọc có máy trạng thái riêng trong `007_booking_deposits.sql`.
- Báo cáo thực thu lấy giao dịch thành công và trừ thực chi hoàn; dữ liệu minh họa wireframe không phải số thu của dự án. Không có chi phí để kết luận lợi nhuận.
- Các trang Admin `NhatKy`, `CauHinh`, `SaoLuu` gọi đường dẫn `/admin/...` và chứa fallback/mô phỏng; `admin.routes.js` hiện chỉ phục vụ tài khoản. Không gọi nhật ký lịch hẹn là audit toàn hệ thống.
- Bộ khảo sát không sửa PNG, schema, route hoặc logic để khắc phục các sai khác. Các điểm cần chỉnh hình sẽ chờ yêu cầu riêng.
