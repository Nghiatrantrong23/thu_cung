# Khiếu nại của khách hàng — 05/11/2026

Đã nối mục **Khiếu nại** vào điều hướng khách hàng và route `/khieu-nai-cua-toi` trên checkout đang phục vụ frontend. Trang cho phép khách gửi khiếu nại cho lịch của mình và xem trạng thái, phản hồi, khoản chờ hoàn và phiếu hoàn nếu đã chi. API `POST /api/khieu-nai/cua-toi` giới hạn vai trò khách hàng, kiểm tra quyền sở hữu lịch và chỉ nhận mã lịch cùng nội dung từ request.

Kiểm tra: frontend lint PASS, 20 test PASS, build 118 modules PASS; backend mặc định 83 PASS/13 tích hợp SKIP; riêng nhóm khiếu nại/hoàn tiền 9 PASS trên PostgreSQL test mới `petcare_test_refunds_20261105072054`. Cụm PostgreSQL test đã dừng, fixture giữ để kiểm toán. Chưa QA thao tác trình duyệt ở ba viewport; không đánh dấu hoàn thành toàn bộ giai đoạn giao diện.
