# Đặt cọc 30% và chính sách hủy lịch

Triển khai local ngày 25/10/2026, chính sách `deposit-30-24h-v1`.

## Luồng sử dụng

1. Khách chọn thú cưng, dịch vụ, ngày/giờ; đọc và tích đồng ý chính sách. Hệ thống tính cọc 30% từ giá snapshot trên server, làm tròn lên một đồng. Ví dụ 150.000đ → cọc 45.000đ; 800.000đ → cọc 240.000đ.
2. Tạo yêu cầu đặt lịch và cọc cùng transaction; trạng thái lịch `ChoXacNhan`, trạng thái cọc `Unpaid`. Chưa được phân công/xác nhận hoặc bắt đầu chăm sóc trước khi cọc đủ. Giá cọc không lấy từ client.
3. Khách đóng cọc QR/MoMo trong sandbox, hoặc lễ tân ghi nhận tiền mặt/chuyển khoản/MoMo đã thực nhận tại cửa hàng. COD chỉ dùng trả phần còn lại, không thay thế cọc.
4. Đã nhận cọc vẫn chờ lễ tân xác nhận và chọn nhân viên khả dụng.
5. Hoàn tất dịch vụ rồi lập hóa đơn: trừ cọc đã nhận vào khoản phải trả. Ví dụ hóa đơn 150.000đ, cọc 45.000đ → còn 105.000đ. Không ghi thêm một giao dịch thu khi chuyển cọc vào hóa đơn.

Khách có thể xem cọc, giao dịch và đổi lịch tại chi tiết lịch hẹn. Lễ tân/quản lý xem cùng khối cọc trong màn hình điều phối; có các thao tác thu cọc, thực chi hoàn và quyết định ngoại lệ theo quyền.

## Chính sách đã chốt

| Tình huống | Xử lý |
| --- | --- |
| Hủy trước ít nhất 24 giờ, kể cả đúng mốc 24 giờ | Hoàn đủ cọc, chuyển `RefundPending` |
| Hủy dưới 24 giờ | Không hoàn cọc (`Forfeited`) |
| Muốn đổi lịch sát giờ trước khi đến giờ hẹn | Cho đổi một lần, giữ cọc; lịch về chờ xác nhận và bỏ phân công cũ |
| Hủy sau lần đã đổi sát giờ | Không mở lại quyền hoàn cọc, tránh đổi sang ngày xa rồi hủy để vượt chính sách; nội dung này hiện trước khi khách đồng ý |
| Khách không đến, không báo | Quản lý đánh dấu sau giờ hẹn; hủy lịch, cọc `Forfeited` |
| Cửa hàng hủy hoặc từ chối cung cấp dịch vụ | Hoàn đủ cọc, kể cả sát giờ |
| Bé bệnh đột xuất/ngoại lệ | Quản lý nhập lý do, hủy và duyệt hoàn đủ cọc; có nhật ký người duyệt |

Khách hủy chỉ tác động lịch của mình. Lễ tân phải chọn nguồn hủy “Cửa hàng” hoặc “Khách yêu cầu” để xét đúng điều kiện. Đổi lịch do khách dù qua lễ tân cũng áp dụng giới hạn giữ cọc; chỉ quản lý/Admin được xác nhận đổi do cửa hàng qua API `initiatedBy=store`.

**Duyệt hoàn không đồng nghĩa đã trả tiền.** Lễ tân nhập phương thức/chứng từ và xác nhận thực chi; chỉ khi đó mới `Refunded` và ghi giao dịch hoàn. Sandbox có nút mô phỏng hoàn; DB thật không nhận mô phỏng. Mã callback/chống lặp và UNIQUE ngăn thu/hoàn hai lần.

## Dữ liệu và công thức

- Migration mới 007: `booking_deposits` (snapshot tổng/cọc/chính sách, trạng thái, lần đổi sát giờ, lý do/người quyết định), `deposit_transactions` (thu/hoàn thực nhận, phương thức, tham chiếu, người ghi, cờ sandbox) và `deposit_intents` (QR/MoMo sandbox, hết hạn 15 phút, event/transaction unique).
- Hóa đơn có `deposit_credit`; tổng đã thu = thu hóa đơn thành công + cọc đã áp dụng. Công nợ = thành tiền − tổng đã thu. Hoàn hóa đơn sau chăm sóc sử dụng tổng có cả cọc để tính hạn mức.
- Báo cáo cộng cọc theo ngày nhận tiền, trừ hoàn cọc theo ngày thực chi ở giờ Việt Nam. Áp cọc vào hóa đơn không cộng thu lần nữa. `Forfeited` giữ nguyên khoản đã thu, không sinh thêm thu hoặc hoàn.
- Lịch không có bản ghi cọc, gồm toàn bộ lịch cũ, tiếp tục quy trình cũ; không áp cọc hồi tố.
- Snapshot/thu/callback/hủy/đổi/hoàn dùng cùng khóa lịch và khóa ngày; giao dịch, trạng thái và thông báo cùng transaction. Lỗi thông báo rollback cả tiền và trạng thái.

## Môi trường đã bật

- **5173/API 5000:** DB local `Thu_cung`, bật `BOOKING_DEPOSIT_ENABLED=true`. Chưa kết nối cổng online thật; giao diện hướng dẫn nộp cọc tại cửa hàng và lễ tân xác nhận thực nhận. Không có mô phỏng thanh toán trên DB này.
- **5181/API 5001:** DB riêng `petcare_test_demo_payments_20261025`, QR/MoMo và hoàn cọc mô phỏng. Tài khoản/mật khẩu demo giữ nguyên, xem [hướng dẫn sandbox](THANH_TOAN_SANDBOX.md).
- Cờ trong `.env.example` mặc định false; chỉ bật khi đã có migration 007. Runtime sandbox tự bật; script chuẩn bị fixture tắt cọc để dựng các tình huống lịch sử. Test cô lập không lấy cờ nghiệp vụ từ `.env` development; test đặt cọc bật cờ tường minh.
- Không đổi mật khẩu hoặc thông tin kết nối. `.env`, dump, dữ liệu kiểm tra và ảnh không đưa vào Git.

DB chính đã backup custom ở `backups/petcare_before_deposits_20261025115343.dump`, kiểm tra đọc dump, restore vào `petcare_test_depositcopy_20261025115343`, thử 006–007 trên bản sao rồi mới áp dụng lên nguồn. Hash các cột nghiệp vụ cũ của 16 bảng giữ nguyên qua cả copy và nâng cấp nguồn. Audit riêng ở `.cache/payment-sandbox/deposit-upgrade-main-audit.json`. Không seed/test ghi dữ liệu trên DB chính. Sandbox có thêm lịch demo #18, đóng cọc MoMo 45.000đ qua UI.

## Kiểm tra

- Unit backend: 74 PASS, 11 nhóm tích hợp SKIP khi không truyền DB.
- Chín nhóm tích hợp chạy trên DB test mới riêng: đặt cọc 12, hóa đơn 8, hoàn tiền 8, báo cáo/quản trị 7, payment sandbox 9, đặt lịch 14, điều phối 14, ca/chăm sóc 6, hành trình 8 = **86 PASS / 0 FAIL / 0 SKIP** (gồm parent của Node).
- Đặt cọc kiểm tra đồng ý chính sách, giá server, quyền sở hữu, chặn xác nhận khi thiếu cọc, callback giả/lặp, thu tiền mặt, hủy đồng thời callback, mốc 24 giờ, giữ cọc một lần, ngoại lệ, no-show, chờ hoàn/thực chi, rollback thông báo và không đếm hai lần khi lập hóa đơn.
- Frontend: 20 PASS, lint PASS, build 100 modules PASS. UI sandbox: đặt lịch 150.000đ, cọc 45.000đ, đồng ý chính sách, tạo MoMo và callback thành công, cọc `Paid` và lịch chờ xác nhận. Ảnh `.cache/payment-sandbox/deposit-paid-preview.png`.
- Bản chính xác nhận policy enabled, sandbox false, không có bản ghi cọc giả; ready của cả hai API trả 200.

## Giới hạn hiện tại

Chưa tích hợp merchant/IPN MoMo hoặc webhook ngân hàng thật; không tự chuyển tiền hoàn. Mã sandbox hết hạn 15 phút có thể tạo lại, nhưng chưa tự hủy yêu cầu đặt lịch chưa cọc để giải phóng chỗ; lễ tân có thể hủy yêu cầu đó. Nếu giảm giá khiến thành tiền hóa đơn thấp hơn cọc, hệ thống chặn lập hóa đơn để quản lý xử lý chênh lệch trước, chưa tự chia hoàn phần cọc dư. Chưa triển khai production hoặc nghiệm thu mọi thiết bị.
