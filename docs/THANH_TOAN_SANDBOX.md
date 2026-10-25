# Thanh toán QR ngân hàng, MoMo và COD — sandbox cục bộ

Ngày kiểm tra: 25/10/2026. Đây là **bộ mô phỏng cục bộ**, chưa phải môi trường merchant test của MoMo/SePay, chưa gửi yêu cầu thanh toán tới nhà cung cấp và không nhận tiền thật.

## Mở bản thử hiện tại

- Web: http://127.0.0.1:5181/#/hoa-don-cua-toi ; API 5001.
- Database riêng: `petcare_test_demo_payments_20261025`, PostgreSQL test 55439.
- Đăng nhập `demo_khach` hoặc `demo_letan`; mật khẩu demo ngẫu nhiên nằm trong `.cache/payment-sandbox/petcare_test_demo_payments_20261025.txt`. File được Git bỏ qua, không dùng cho tài khoản thật.
- Không thay `.env`, mật khẩu hay database của web chính 5173/API 5000.

Trên hóa đơn còn nợ, chọn QR ngân hàng/MoMo và tạo yêu cầu. QR chỉ chứa chuỗi ghi rõ SANDBOX, **không phải VietQR hay mã thanh toán MoMo thật**. Nút mô phỏng gọi phía server, tạo thông báo có chữ ký rồi chạy cùng hàm tiếp nhận callback; UI kiểm tra trạng thái mỗi 3 giây và tải lại hóa đơn khi đã thanh toán.

COD nghĩa là thanh toán tiền mặt tại quầy khi nhận bé. Chọn COD không ghi nhận tiền và khách không được tự xác nhận. Lễ tân thu bằng mục “Tiền mặt / COD khi nhận bé”; sau khi nhận đủ tiền, trạng thái COD khi đọc lại là đã thanh toán.

## Khởi động lại

Giữ cụm PostgreSQL test chạy. Trong PowerShell:

```powershell
cd D:\dich_vu_thu_cung\server
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'postgres://petcare_test@127.0.0.1:55439/petcare_test_demo_payments_20261025'
$env:PETCARE_ALLOW_DB_WRITE = 'petcare_test_demo_payments_20261025'
npm run payments:sandbox
```

Lệnh mở lại không seed/migrate hoặc đổi mật khẩu. Nếu cổng đang được dùng bởi bản sandbox hiện tại thì dùng bản đang mở; không tắt mọi tiến trình Node.

Để tạo bộ mới, đổi tên database thành `petcare_test_demo_payments_<hậu tố mới>`, đặt `PETCARE_ALLOW_DB_WRITE` đúng tên đó rồi chạy `npm run payments:prepare`, sau đó `npm run payments:sandbox`. Chuẩn bị sẽ migrate 000–006 và tạo fixture bằng API trong **DB mới rỗng**; từ chối DB có schema sẵn. Mỗi bộ có file mật khẩu riêng ở thư mục `.cache/payment-sandbox/`.

## Ràng buộc và API

- Chỉ hoạt động khi `NODE_ENV=test`, `PAYMENT_MODE=sandbox`, kết nối loopback và `PETCARE_PAYMENT_SANDBOX_DB` khớp tên database thực tế `petcare_test_*`. Script khởi động sandbox thiết lập hai biến thanh toán này cho đúng bộ demo. Production và DB thật bị từ chối.
- Migration `006_payment_sandbox.sql` bổ sung `payment_intents` và phương thức sổ cái `MoMo`; không sửa migration đã phát hành. Schema cũ 000–005 vẫn chạy nghiệp vụ cũ; API sandbox báo cần migration 006 nếu chưa có bảng. Không tự migrate khi server khởi động.
- API tự lấy số tiền còn nợ từ DB, chỉ nhận số đồng nguyên dương; khóa hóa đơn trước khi xử lý. Một hóa đơn chỉ có một yêu cầu đang mở. Đổi phương thức/số còn nợ sẽ hủy yêu cầu cũ. Hết hạn sau 15 phút.
- Callback kiểm tra HMAC-SHA256, phương thức, số tiền và trạng thái; event ID/giao dịch/chống lặp có UNIQUE. Callback lặp trả thành công nhưng không thu lần hai; callback sai hoặc quá công nợ không ghi tiền.
- Giao dịch, trạng thái hóa đơn, trạng thái yêu cầu và thông báo cùng transaction. MoMo được cộng vào thực thu và hạn mức hoàn qua hàm tổng tiền chung; COD được ghi sổ là `TienMat`.
- Secret callback mặc định ngẫu nhiên, chỉ giữ trong server. Có thể truyền `PAYMENT_SANDBOX_SECRET` riêng cho test tự động; không đưa vào frontend hoặc Git.

| API | Quyền / ý nghĩa |
| --- | --- |
| GET `/api/payments/config` | Khách / lễ tân / quản lý / Admin; trả sandbox hoặc chưa cấu hình |
| POST `/api/payments/invoices/:id` | Cùng quyền; khách chỉ hóa đơn của mình; body `method`: `BankQR`, `MoMo`, `COD` |
| GET `/api/payments/intents/:id` | Cùng quyền và quyền sở hữu |
| POST `/api/payments/intents/:id/simulate` | Cùng quyền và quyền sở hữu; `result`: `success` hoặc `failed`; COD bị chặn |
| POST `/api/payments/sandbox/callback` | Không dùng phiên người dùng; phải có header `x-payment-signature`, giới hạn 120 lần/phút/IP; chỉ dùng sandbox |

## Kết quả kiểm tra

- Backend mặc định: 72 PASS, 10 nhóm tích hợp SKIP vì không truyền DB; không gọi SKIP là PASS.
- Thanh toán mới: 9 PASS / 0 FAIL / 0 SKIP (gồm parent): quyền, số tiền server, callback giả/lặp đồng thời, thất bại/hết hạn/đổi phương thức, COD, thay đổi công nợ, tranh chấp tiền mặt và callback, báo cáo có MoMo.
- Hồi quy trên ba DB mới độc lập: hóa đơn 8 PASS, hoàn tiền 8 PASS, báo cáo/quản trị 7 PASS. Tổng bốn nhóm: 32 PASS / 0 FAIL / 0 SKIP.
- Frontend: 20 PASS, lint PASS, build 99 modules PASS.
- Trình duyệt ở kích thước hẹp: đăng nhập khách; QR ngân hàng thành công hóa đơn #1, đã thu 150.000/còn nợ 0; MoMo thất bại hóa đơn #2 giữ nợ 100.000; COD chờ nhận tiền; tạo lại MoMo được. Ảnh cục bộ `.cache/payment-sandbox/momo-preview.png`.
- Kiểm tra trước sửa fixture từng thất bại vì tên cột mật khẩu và giờ ngoài giờ mở cửa; đã sửa fixture, chạy lại trên DB mới và đạt. Không hạ ràng buộc database.

## Bước kết nối nhà cung cấp thật sau này

Cần merchant MoMo test/production, thông tin nhận tiền và nhà cung cấp thông báo ngân hàng được chọn, cùng URL HTTPS công khai nhận IPN/webhook. Cần adapter tạo giao dịch/query trạng thái, xác thực chữ ký theo từng nhà cung cấp, lưu mã giao dịch đối tác, đối soát, kiểm thử callback thật và chính sách nhận tiền thiếu/thừa/trễ. Không dùng nút mô phỏng hay chữ ký sandbox cho giao dịch thật; redirect của trình duyệt không được coi là bằng chứng đã thanh toán.

Tài liệu chính thức tham khảo: [MoMo captureWallet/IPN](https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/), [SePay webhook](https://docs.sepay.vn/tich-hop-webhooks.html). Đợt này chưa kết nối hai dịch vụ này.
