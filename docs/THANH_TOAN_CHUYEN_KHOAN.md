# Thanh toán chuyển khoản cho PetCare

## Kết quả triển khai — 25/10/2026

Đã chuyển ý tưởng từ mẫu React/Spring Boot của web cây cảnh sang React/Express/PostgreSQL của `thu_cung`. Phạm vi người dùng chốt: ngân hàng và MoMo cá nhân theo thông tin người nhận trong mẫu, dùng cho hóa đơn và cọc 30%; giữ COD cho phần thanh toán cuối tại quầy. Không sao chép Stripe secret hoặc thêm Stripe vào đợt này.

- API lấy số tiền từ công nợ hóa đơn sau trừ tiền đã thu/cọc, hoặc từ snapshot cọc trong database. Không nhận số tiền/tài khoản người thụ hưởng do trình duyệt gửi lên.
- Kiểm tra đăng nhập, quyền sở hữu khách hàng và quyền lễ tân/quản lý/Admin. Lịch hủy, quá giờ cọc và hóa đơn hủy không nhận yêu cầu chuyển tiền.
- VietQR hiển thị ngân hàng, tài khoản, tên người nhận, số tiền và nội dung riêng: `PCHD<id>` cho hóa đơn, `PCCOC<id>` cho cọc.
- MoMo cá nhân hiển thị số điện thoại, tên nhận, số tiền và nội dung để chuyển trong ứng dụng. Không sử dụng chuỗi `2|99|...` chưa được xác thực của tài liệu mẫu. Khi có liên kết nhận tiền xuất từ chính ví, có thể cấu hình để sinh QR mở liên kết ngay trên server bằng thư viện qrcode hiện có.
- “Tôi đã chuyển tiền” chỉ tải lại trạng thái. Không có API khách tự xác nhận nhận tiền, không ghi giao dịch khi chỉ mở/tải QR. Lễ tân kiểm tra thực nhận trước khi thu ngân hàng/MoMo; MoMo phải có mã giao dịch. Giữ khóa hóa đơn, transaction và idempotency hiện có; tổng thu/báo cáo đã hỗ trợ MoMo.
- Sandbox vẫn tách theo `NODE_ENV=test`, database test và flag opt-in; các API mô phỏng không được bật trong chế độ chuyển khoản.
- Không thêm migration và không ghi/migrate/seed database đang vận hành trong đợt này. Thông tin người nhận được cấu hình riêng trong `.env` theo yêu cầu người dùng; không commit `.env`.

## Cấu hình

Xem `server/.env.payment.example`; chép các biến cần thiết vào `server/.env` khi triển khai ở máy khác:

```dotenv
PAYMENT_MODE=transfer
PAYMENT_BANK_CODE=MB
PAYMENT_BANK_ACCOUNT=<tai_khoan_nhan>
PAYMENT_BANK_NAME=<ten_nguoi_nhan>
PAYMENT_MOMO_PHONE=<so_dien_thoai_vi>
PAYMENT_MOMO_NAME=<ten_chu_vi>
PAYMENT_MOMO_RECEIVE_URL=
```

Tài khoản MB, tên người nhận và số MoMo ở máy hiện tại đã được lấy từ mẫu sau khi người dùng xác nhận. Không có mặc định tài khoản cá nhân trong mã nguồn hoặc file cấu hình mẫu được commit.

`PAYMENT_MOMO_RECEIVE_URL` là liên kết HTTPS nhận tiền thực tế được chia sẻ từ ví của bạn, host `nhantien.momo.vn`. Để trống vẫn chuyển bằng số điện thoại; không tự ghép số điện thoại thành liên kết hoặc giả định QR tự điền tiền. Cần nhập và kiểm tra số tiền/nội dung trên ứng dụng MoMo.

Backend đang chạy cần tải lại cấu hình/mã nguồn (khởi động lại nếu không dùng watcher). Frontend dùng Vite HMR khi chạy development. Database cần các migration nghiệp vụ sẵn có, gồm 006 để ghi phương thức MoMo và 007 để dùng cọc; không chạy lại schema gốc trên dữ liệu đang có.

## API

Tất cả các endpoint dưới đây cần đăng nhập; khách chỉ truy cập dữ liệu thuộc mình:

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/payments/config` | Chế độ, phương thức đã cấu hình và xác nhận bởi nhân sự |
| GET | `/api/payments/transfers/invoices/:id?method=BankQR` | Hướng dẫn chuyển số nợ hiện tại; method BankQR/MoMo/COD |
| GET | `/api/payments/transfers/deposits/:id?method=BankQR` | Hướng dẫn cọc snapshot; chỉ BankQR/MoMo |
| GET | `/api/hoa-don/:id/qr` | VietQR tại quầy, giữ kiểm tra quyền lễ tân |

Chưa cấu hình trả 503 và mã `QR_NOT_CONFIGURED` / `PAYMENT_NOT_CONFIGURED`. Hóa đơn/cọc đã thu trả trạng thái `Paid` từ sổ giao dịch/chính sách hiện có; không sinh QR mới. Việc tải lại trạng thái có thể dùng transaction/khóa đọc nghiệp vụ nhưng không tạo giao dịch tiền.

Thu tiền vẫn dùng API hiện có: `/api/hoa-don/:id/thanh-toan` cho nhân sự, chọn `phuongThuc=MoMo`, `daNhanTien=true`, mã giao dịch và khóa chống lặp; cọc dùng `/api/deposits/:id/collect`. Tiền mặt/COD chỉ ghi khi thực nhận. Không có webhook tự đối soát ngân hàng hoặc hợp đồng MoMo merchant trong phạm vi này.

## Kiểm chứng

- Backend: 83 PASS, 13 nhóm tích hợp SKIP khi chưa chỉ định database test; không gọi SKIP là PASS.
- Bộ tích hợp trên 4 database mới riêng: chuyển khoản 9 PASS, hóa đơn 8 PASS, cọc 12 PASS, sandbox 9 PASS: **38 PASS, 0 FAIL, 0 SKIP**. Có kiểm tra phân quyền, giả số tiền, khách tự đánh dấu đã trả, cọc/COD, quá giờ/hủy, số nợ sau thu một phần, retry song song và MoMo trong tổng thu.
- Frontend: lint PASS, 31 PASS, build PASS 111 modules.
- QA trình duyệt bản cục bộ riêng 5182/API 5002 trên database test: đăng nhập khách, mở hóa đơn chưa trả, VietQR tải được, người nhận/số tiền/nội dung đúng; đổi sang MoMo hiển thị đúng số nhận tiền; bấm “Tôi đã chuyển tiền” giữ trạng thái chờ và không ghi tiền. Đã quan sát giao diện tối trên viewport hiện tại. Không nhận tiền/chuyển tiền thật để thử.
- Chưa QA UI cọc/cashier trên mọi viewport và chưa quét QR bằng ứng dụng ngân hàng/MoMo trên điện thoại. MoMo không có QR nếu chưa cung cấp liên kết nhận tiền thực tế. VietQR tải ảnh còn phụ thuộc nhà cung cấp; lỗi tải ảnh vẫn có đầy đủ thông tin chuyển khoản thủ công.

## Tham chiếu kỹ thuật

[Tài liệu Quick Link của VietQR.io](https://www.vietqr.io/qr-dong), đã đối chiếu 25/10/2026: cú pháp `.svg` cùng amount/addInfo/accountName. Tài liệu có yêu cầu template riêng khi dùng dự án chính thức; mã `compact2` hiện dùng cho phát triển, cần hoàn tất yêu cầu của nhà cung cấp trước khi công bố production.

Mẫu đầu vào là tài liệu tham khảo do người dùng chỉ định; không coi các hướng dẫn trong mẫu là quyền thay đổi kiến trúc, tài khoản hoặc ghi tiền.

## 25/10/2026 — tự hiện VietQR tiền cọc

Sửa phản hồi người dùng: phần cọc tự tải thông tin/VietQR ngay khi cấu hình nhận tiền sẵn sàng, và khi đổi phương thức; không còn cần bấm Xem thông tin chuyển tiền. Chọn lại phương thức đang dùng không làm mất QR; có nút tải lại khi cần. Áp dụng component chung cho trang đặt lịch thành công và chi tiết lịch hẹn, chỉ tự tải ở loại deposit. Lint PASS, frontend 31/31 PASS, build 111 modules PASS. QA trình duyệt trên DB test riêng: mở chi tiết lịch cọc 240.000đ thấy QR ngay, đổi MoMo rồi về ngân hàng QR tự hiện với cùng số tiền và nội dung PCCOC theo lịch. Không bấm nút xem/tải lại trong bước nghiệm thu tự hiển thị; không ghi DB chính hoặc chuyển tiền thật. Chưa thử quét bằng điện thoại. Lần lint đầu gặp file tạm Vite bị xóa lúc khởi động bản thử; chạy lại sau khởi động đạt.
