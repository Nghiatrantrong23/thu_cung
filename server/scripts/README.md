# Công cụ database an toàn

Các lệnh DB **không tự đọc `server/.env`**. Chỉ chạy trên PostgreSQL local và database phát triển/kiểm thử riêng; không trỏ tới database đang vận hành. Không có lệnh xóa/reset dữ liệu.

Thiết lập biến trong PowerShell bằng giá trị của database riêng. Không đưa giá trị mật khẩu vào code, tài liệu hoặc Git:

```powershell
$env:NODE_ENV = 'development'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '5432'
$env:DB_USER = 'postgres'
$env:DB_NAME = 'petcare_dev'
$env:PETCARE_ALLOW_DB_WRITE = $env:DB_NAME
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu PostgreSQL local' -AsSecureString)).Password
$env:PETCARE_DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu demo riêng (ít nhất 12 ký tự)' -AsSecureString)).Password
npm.cmd run db:setup
```

Nếu đã đặt `DATABASE_URL`, URL đó được ưu tiên hơn các biến `DB_*`; phải trỏ local và cùng tên đã xác nhận trong `PETCARE_ALLOW_DB_WRITE`. URL không có query/hash. Tên được chấp nhận: `<project>_dev`, `<project>_test` hoặc thêm hậu tố `_...`.

- `db:init`: tạo database nếu chưa có, áp dụng schema và tất cả migration; không tự seed.
- `db:migrate`: áp dụng migration còn thiếu vào database đã tồn tại.
- `db:seed`: thêm dữ liệu demo khi đã áp dụng đủ migration. Yêu cầu `PETCARE_DEMO_PASSWORD` riêng, từ 12 ký tự, tối đa 72 byte UTF-8.
- `db:setup`: khởi tạo/migrate rồi seed.
- `db:reset`: luôn từ chối, không kết nối PostgreSQL và không xóa dữ liệu.

Schema/migration và SHA-256 được lưu trong `petcare_schema_migrations` (bảng kỹ thuật ngoài 15 bảng nghiệp vụ). Khóa advisory và transaction dùng chung cho toàn bộ lần migrate; lỗi dừng và rollback. Không sửa SQL đã ghi lịch sử; thêm file migration có số phiên bản mới. SQL không được chứa lệnh `BEGIN`/`COMMIT` riêng vì runner quản lý transaction. Database cũ có bảng nhưng chưa có lịch sử sẽ bị từ chối để rà soát/baseline riêng, không áp schema gốc lặp lên dữ liệu.

Dữ liệu demo có tiền tố `demo_`/`Demo -`, email `example.invalid`, gồm 7 tài khoản thuộc 5 nhóm quyền, 2 thú cưng, 3 dịch vụ và ca 08:00–19:00 trong 7 ngày tính từ ngày hiện tại ở Asia/Ho_Chi_Minh cho 2 nhân viên chăm sóc. Chạy lại không đổi mật khẩu hoặc ghi đè hồ sơ; không phụ thuộc ID cố định và không tạo lịch hẹn cố định. Username: `demo_admin`, `demo_quanly`, `demo_letan`, `demo_chamsoc1`, `demo_chamsoc2`, `demo_khach`, `demo_khoa` (khóa). Mật khẩu là giá trị bạn nhập, không in ra màn hình.

Unit tests: `node --test test/db-tooling.test.js`. Integration test chỉ chạy khi có `TEST_DATABASE_URL` tới **database test mới** tên `petcare_test_<hậu_tố_duy_nhất>` trên cụm PostgreSQL cô lập. Test không đọc `.env`, không DROP/DELETE, giữ nguyên database test sau khi chạy. Kiểm tra fixture dùng transaction rollback. Cần quyền CREATE DATABASE và extension `btree_gist` trên cụm test.
