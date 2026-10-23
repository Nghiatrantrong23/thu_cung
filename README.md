# PetCare - Dịch vụ chăm sóc thú cưng

Website React/Vite/Tailwind, backend Node.js/Express và PostgreSQL.

## Tiến độ

Đang thực hiện giai đoạn 6/12. Xem [kế hoạch tổng thể](plans/ke_hoach_tong_the.md) và [thiết kế dữ liệu](plans/02_THIET_KE_CO_SO_DU_LIEU.md). Có mã chưa đồng nghĩa đã nghiệm thu toàn bộ chức năng.

## Chuẩn bị và chạy

Node.js >=20, npm và PostgreSQL có btree_gist. Cài dependencies riêng trong dichvu/ và server/ bằng npm ci. Tạo cấu hình server/.env từ server/.env.example với thông tin riêng của bạn; không commit file .env.

Trên database mới dành cho phát triển, đọc lưu ý trong kế hoạch trước khi chạy npm run db:init từ server/. Script này có thể tạo database và ghi dữ liệu mẫu; chưa dùng làm quy trình migration an toàn cho dữ liệu thật.

Chạy npm run dev trong server/ và dichvu/ ở hai terminal. Backend mặc định cổng 5000; frontend cổng 5173 và proxy /api. Đăng nhập tại http://localhost:5173/#/dang-nhap. Frontend build bằng npm run build trong dichvu/.

## Lưu code

Sau mỗi giai đoạn đạt nghiệm thu: cập nhật kế hoạch, commit, push và xác nhận SHA trên GitHub theo [AGENTS.md](AGENTS.md). PostgreSQL cần sao lưu riêng; Git không chứa dữ liệu database hoặc thông tin bí mật.
