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

Mỗi giai đoạn thêm ngày, phạm vi, lệnh kiểm tra, kết quả, phần chưa đạt và rủi ro cần xử lý. Mã commit/link remote được báo sau push; không sửa commit vừa tạo chỉ để nhúng SHA của chính commit đó.
