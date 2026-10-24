# Kiểm thử backend

Tại `server`, chạy `npm.cmd test`: hiện 67 unit/RBAC/readiness PASS; 9 nhóm tích hợp skip nếu chưa đặt TEST_DATABASE_URL. Không gọi skip là thành công tích hợp.

Các bài tích hợp cần PostgreSQL local **dành riêng test**, quyền tạo database/btree_gist. Mỗi file và mỗi lần chạy phải dùng DB mới riêng; không chạy tất cả `npm test` với một URL. Không trỏ DB đang vận hành. Không đọc `.env`, không DROP/DELETE, giữ DB để kiểm toán. Mật khẩu/JWT fixture sinh ngẫu nhiên, không in log.

PowerShell tại `server`, ví dụ cụm test riêng đã chạy cổng 55439 (thay user/cổng cho đúng cụm của bạn):

```powershell
$taskRun = Get-Date -Format 'yyyyMMddHHmmssfff'
foreach ($taskGroup in @('db-tooling','auth-pets','booking','dispatch','care-shifts','invoices','refunds','reports-admin','journey')) {
    $taskDatabase = 'petcare_test_' + $taskGroup.Replace('-','_') + '_' + $taskRun
    $env:TEST_DATABASE_URL = 'postgres://petcare_test@127.0.0.1:55439/' + $taskDatabase
    node --test ('test/' + $taskGroup + '.integration.test.js')
    if ($LASTEXITCODE -ne 0) { throw ('Kiểm thử thất bại: ' + $taskGroup) }
}
Remove-Item Env:TEST_DATABASE_URL
```

| Nhóm | Số test đạt cuối | Nội dung |
| --- | --- | --- |
| db-tooling | 8 | Schema/migrate/seed/ràng buộc/idempotency/rollback |
| auth-pets | 10 | Đăng ký/login/JWT/phiên/profile/tài khoản tạm/CRUD/sở hữu |
| booking | 14 | Công suất, quyền, tranh chỗ, rollback, ngừng theo dõi |
| dispatch | 14 | Ba nhánh loại trừ, nhân viên khả dụng, tranh phân công, thông báo |
| care-shifts | 6 | Ca/chăm sóc/từng dịch vụ/không đủ điều kiện/đổi lịch/nhật ký |
| invoices | 8 | Snapshot, giảm giá, thu nhiều lần, tiền thừa, thất bại/chống lặp |
| refunds | 8 | Duyệt khác thực chi, một phần/toàn bộ, chống vượt/lặp/reserve, rollback |
| reports-admin | 7 | Ngày thu/chi, không nhân tổng, quyền, danh mục, quản trị/khóa |
| journey | 8 | Đăng ký → hồ sơ → đặt → phân công → chăm sóc → thu → hoàn → báo cáo/đánh giá |

Tổng 83 gồm parent test của Node. Các bài HTTP tự chạy/dừng backend ở cổng ngẫu nhiên. Fixture chỉ bootstrap danh tính/danh mục/lịch khi cần cô lập phân hệ; bài journey bootstrap nhân sự, mọi chuyển nghiệp vụ dùng HTTP và mật khẩu thật của fixture, không SQL ép hoàn thành.

`journey` nạp `test/fixtures/fixed-clock.js` chỉ trong process test, với NODE_ENV=test và TEST_CLOCK_FILE. Đồng hồ sáng/10 giờ cùng ngày Việt Nam giúp chạy được ngoài giờ mở cửa; PostgreSQL dùng ngày thực tế Việt Nam. Ghi file đồng hồ bằng thay thế nguyên tử; không có clock override trong entry point ứng dụng. Không dùng fixture này để chạy app thật.

Frontend tại `dichvu`: `node --test test/*.test.js` (13 PASS) và `npm.cmd run build` (71 modules). QA trình duyệt thủ công là kết quả riêng, không giả làm automated E2E. Xem [báo cáo](../../plans/BAO_CAO_KIEM_THU_HE_THONG.md) và [nhật ký](../../plans/NHAT_KY_KIEM_TRA.md).
