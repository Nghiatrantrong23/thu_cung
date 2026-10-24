# Kiểm thử backend

Chạy `npm test` trong server: unit/RBAC chạy bình thường; ba nhóm tích hợp được bỏ qua nếu chưa đặt TEST_DATABASE_URL.

Kiểm thử tích hợp cần cụm PostgreSQL local dành riêng cho test, quyền tạo database và btree_gist. Mỗi lần chạy, mỗi file phải dùng **tên database mới khác nhau**; không chạy toàn bộ `npm test` với một TEST_DATABASE_URL dùng chung. Runner từ chối database không rỗng hoặc mục tiêu không phải local test. Không dùng DB đang vận hành. Thay user/cổng cho đúng cụm test của bạn; không đưa mật khẩu vào source.

Ví dụ PowerShell, tại server, với cụm test riêng đang chạy cổng 55439:

```powershell
$taskSuffix = Get-Date -Format 'yyyyMMddHHmmssfff'
$env:TEST_DATABASE_URL = "postgres://petcare_test@127.0.0.1:55439/petcare_test_booking_$taskSuffix"
node --test test/booking.integration.test.js

$taskSuffix = Get-Date -Format 'yyyyMMddHHmmssfff'
$env:TEST_DATABASE_URL = "postgres://petcare_test@127.0.0.1:55439/petcare_test_dispatch_$taskSuffix"
node --test test/dispatch.integration.test.js

$taskSuffix = Get-Date -Format 'yyyyMMddHHmmssfff'
$env:TEST_DATABASE_URL = "postgres://petcare_test@127.0.0.1:55439/petcare_test_tooling_$taskSuffix"
node --test test/db-tooling.integration.test.js

Remove-Item Env:TEST_DATABASE_URL
```

Các bài HTTP tự chạy backend ở cổng ngẫu nhiên, dùng mật khẩu/JWT fixture sinh ngẫu nhiên, rồi dừng backend test. Giữ nguyên database test để kiểm toán; không DROP/DELETE. Bài dispatch kiểm tra ba nhánh xử lý, tranh chấp, quyền, ca bao trọn khoảng, bảo toàn chỗ của lịch chờ khác, hủy có lý do và thông báo cùng transaction. Chi tiết kết quả đã chạy ghi trong plans/NHAT_KY_KIEM_TRA.md.
