# Khôi phục đăng nhập DB development local — 24/10/2026

## Nguyên nhân

Mã giai đoạn 8–11 yêu cầu migration 002–005, trong khi DB ứng dụng local còn 15 bảng và chưa có lịch sử migration. Middleware readiness chặn toàn bộ API bằng 503 MIGRATION_REQUIRED, gồm đăng nhập. Frontend và backend vẫn chạy; đây là thiếu bước nâng cấp môi trường khi bàn giao, chưa phải bằng chứng người dùng nhập sai mật khẩu.

## Thao tác đã thực hiện

1. Xác minh cấu hình đang dùng NODE_ENV=development và DB loopback. Không in mật khẩu/chuỗi kết nối, không truy cập production.
2. Backup custom mới: `backups/petcare_before_upgrade_20261024130112.dump` (gitignore). Restore vào DB riêng, so 15 bảng và hash dữ liệu; thử migration 002–005 trên bản sao đạt.
3. Đối chiếu columns/types/defaults/identity, constraints, indexes, triggers/functions. Schema DB gốc khớp chính xác schema reference 000/001. Bản dump/restore khớp reference cùng roundtrip; không bỏ qua constraint để ép khớp.
4. Ghi baseline 000/001 có checksum vào DB development, không chạy lại SQL gốc. Dùng migration runner hiện có áp 002–005 trong transaction và advisory lock.
5. So hash toàn bộ giá trị mọi cột nghiệp vụ cũ trước/sau: khớp. Giữ nguyên password hash, tài khoản và dữ liệu. Không seed, không reset mật khẩu, không chuyển DB đích hoặc sửa `.env`.

Đây là xử lý một lần cho database đã kiểm chứng, không thêm đường bỏ qua guard vào DB CLI. Không sao chép quy trình baseline sang database khác chưa đối chiếu. Các script chứa thao tác môi trường nằm private trong `.cache/local-run/`; audit/hash backup cũng ở đó, không commit dump hay dữ liệu thật.

## Kiểm tra sau sửa

- GET backend `/ready`: 200.
- GET `http://localhost:5173/api/dich-vu`: 200 qua proxy frontend.
- POST đăng nhập với tài khoản cố ý không tồn tại: 401, đúng thông báo tài khoản/mật khẩu, không còn 503.
- Không sử dụng/đọc mật khẩu thật của người dùng để xác nhận đăng nhập. Hồi quy auth/hồ sơ **10/10 PASS** trên `petcare_test_auth_loginfix_20261024a`, chạy riêng trên DB test mới, có đăng nhập bcrypt thật, token/refresh/quyền/khóa và tài khoản tạm.

Người dùng thử lại tài khoản cũ tại `http://localhost:5173/#/dang-nhap`. Nếu vẫn trả 401/403, kiểm tra thông báo cụ thể: thông tin đăng nhập sai hoặc tài khoản ngừng hoạt động là lỗi khác; không tự reset mật khẩu.

Không sửa code để bỏ readiness, không thay production và không xóa dữ liệu. Thay đổi tài liệu được lưu trên nhánh `codex/sua-dang-nhap-db-local`, không push main.
