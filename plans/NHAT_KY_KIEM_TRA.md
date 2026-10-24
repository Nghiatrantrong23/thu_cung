# Nhật ký kiểm tra và lưu Git

## 23/10/2026 - Bản lưu ban đầu

- Dự án chính: `D:/dich_vu_thu_cung`. Ban đầu chưa có quyền ghi; sau khi người dùng đồng ý, Windows đã cấp quyền Modify cho tài khoản hiện tại trên riêng thư mục dự án. Git sẽ được khởi tạo và sử dụng tại đây.
- Thư mục `output/thu_cung_git` của chat chỉ dùng để chuẩn bị bản chụp và kiểm tra trong lúc xử lý quyền ghi; không phải nơi tiếp tục phát triển.
- Nhánh dự kiến: `main`; remote: `https://github.com/Nghiatrantrong23/thu_cung.git`.
- Mã nguồn sao chép khớp bản gốc qua SHA-256. Hai kế hoạch được thay bằng phiên bản 2.0 đã gửi người dùng; thêm `.gitignore`, `AGENTS.md`, `README.md` và nhật ký này.
- Frontend: `npm run build` trong bản sao, Vite 5.4.21, 55 modules; **đạt**. Dependency dùng để build được sao chép từ máy, không đưa vào Git.
- Backend: `node --check` trên 19 file JavaScript trong server; **đạt kiểm tra cú pháp**. Chưa chạy API hoặc kiểm thử tích hợp PostgreSQL.
- `.gitignore`: kiểm tra chặn `.env`, `.env.local`, `node_modules`, `dist`, log và dump; cho phép `.env.example` an toàn.
- Quét 66 file văn bản của bản chụp trước khi thêm nhật ký: chưa phát hiện mẫu token GitHub/OpenAI/AWS, JWT cố định, khóa riêng hoặc URL database có mật khẩu. Đây là kiểm tra theo mẫu, không thay thế quản lý bí mật.
- Template DB_PASSWORD/JWT_SECRET/JWT_REFRESH_SECRET được kiểm tra là giá trị mẫu, không xuất giá trị thật.
- Không chạy migration, seed, concurrency test có ghi dữ liệu hoặc E2E. Không đánh dấu giai đoạn 6 hoàn thành.
- Việc push chỉ được xác nhận với người dùng sau khi SHA trên remote khớp SHA commit cục bộ; nhật ký này không tự chứng minh push đã thành công.

## Quy tắc ghi tiếp

## 23/10/2026 - Giai đoạn 2: migration và seed

- Chỉ dùng cụm PostgreSQL 17 mới trong .cache/petcare-test-db, loopback cổng 55439; không kết nối/chỉnh database của dịch vụ PostgreSQL hiện có. Database test giữ lại, không DROP/DELETE.
- Hoàn thiện db:init/migrate/seed/setup; reset từ chối. Đích local dev/test phải được chỉ định rõ, không đọc .env. Migration có checksum, lịch sử, transaction và advisory lock; seed không ghi đè dữ liệu demo cũ.
- `node --test test/db-tooling.integration.test.js test/db-tooling.test.js` từ server với TEST_DATABASE_URL trỏ petcare_test_tooling_20261023c: **18/18 đạt**. Kiểm tra 15 bảng nghiệp vụ + bảng lịch sử, ràng buộc, migration lặp/checksum/lỗi rollback, seed idempotent, CLI và hai runner đồng thời.
- Không suy ra database đang vận hành đã được nâng cấp. DB cũ thiếu lịch sử cần rà soát/baseline riêng; không tự áp SQL gốc. Không ghi mật khẩu demo vào source hoặc nhật ký.

Mỗi giai đoạn thêm ngày, phạm vi, lệnh kiểm tra, kết quả, phần chưa đạt và rủi ro cần xử lý. Mã commit/link remote được báo sau push; không sửa commit vừa tạo chỉ để nhúng SHA của chính commit đó.

## 23/10/2026 - Lõi đặt lịch, quyền và giờ nghiệp vụ (giai đoạn 3/4/5/6/8A)

- Bỏ công suất 2 cố định, dùng người chăm sóc/tài khoản hoạt động và một ca đủ cả thời lượng. Thuật toán kiểm tra khả năng phân bổ các khoảng chồng nhau, giữ nguyên nhân viên đã gán; không tự phân công lịch mới. Tìm kiếm có giới hạn, quá tải trả 503.
- Ngày/giờ theo Asia/Ho_Chi_Minh. Kiểm tra và ghi lịch cùng transaction/khóa theo ngày; khách mới/thú cưng/chi tiết tại quầy cùng rollback. Siết quyền theo chức vụ và sở hữu; chăm sóc chỉ đọc lịch/thú cưng được giao. Hủy kiểm tra số dòng cập nhật; ngừng theo dõi khóa dòng thú cưng trước kiểm tra lịch mở.
- `npm test` tại server: **63 đạt, 2 nhóm tích hợp bỏ qua** khi không đặt TEST_DATABASE_URL. Không gọi kết quả này là đã chạy tích hợp.
- `node --test test/booking.integration.test.js` với DB mới petcare_test_booking_20261023root2 trên cụm cô lập cổng 55439: **14/14 đạt**. Có login bcrypt thật, tranh chỗ cuối đúng 201/409, quyền/sở hữu, dữ liệu sai/quá khứ/không ca, rollback toàn bộ khi thiếu chỗ hoặc lỗi chi tiết, giấu lỗi SQL, trạng thái chờ không gán người và tranh chấp ngừng theo dõi/đặt lịch.
- Frontend `node --test test/business-time.test.js`: **7/7 đạt**; `npm run build`: **đạt**, 55 modules. Chưa kiểm thử thao tác UI trình duyệt hoặc E2E đầy đủ.
- DB tích hợp trước đó: **18/18** gồm 10 unit + 8 tích hợp; không cộng trùng 10 unit vào tổng 63. Test DB giữ lại, không xóa dữ liệu; không đọc/in bí mật .env.
- Giai đoạn 6 chưa nghiệm thu toàn bộ: tài khoản mới tại quầy dùng hash ngẫu nhiên nhưng chưa có bàn giao/bắt đổi mật khẩu; thông báo ứng dụng chưa nối; UI thực tế chưa kiểm tra. API sửa ca/khóa nhân viên sau này cần bảo vệ ảnh hưởng lịch đã có.
