# Báo cáo kiểm thử hệ thống PetCare — đang thực hiện

Phạm vi mở rộng được người dùng xác nhận: hoàn thiện giai đoạn 8–11, kiểm thử trọn chuỗi. Chưa đánh dấu toàn hệ thống PASS. Bản này sẽ cập nhật sau mỗi checkpoint; kết quả cụ thể nằm trong NHAT_KY_KIEM_TRA.md.

| Giai đoạn | Kết quả hiện hành | Phần còn cần nghiệm thu |
| --- | --- | --- |
| 1 Môi trường | PASS build, Node 24, PostgreSQL 17 test | Đóng gói/Docker, hướng dẫn môi trường mới |
| 2 Database/seed | PASS 8 test tích hợp + 10 unit | Áp migration mới lên DB phát triển hiện có cần baseline/backup có kiểm soát; production không thay đổi |
| 3 Backend/lỗi | PASS unit và rollback HTTP | Tiếp tục kiểm tra các API tài chính khi có code |
| 4 JWT/RBAC | Đã sửa lỗi và PASS 10 test auth/hồ sơ | UI refresh/đổi mật khẩu tạm cần QA trình duyệt |
| 5 Hồ sơ/tra khách | PASS CRUD/sở hữu/validation trong bộ auth; quyền tra khách trong bộ đặt lịch | QA trình duyệt CRUD đầy đủ |
| 6 Đặt lịch | PASS 14 HTTP, concurrency/rollback | QA trọn luồng bàn giao tài khoản tạm mới |
| 7 Điều phối | PASS 14 HTTP, nhật ký được tích hợp | Kiểm thử E2E nối các bước 8–11 sau khi triển khai |
| 8 Ca và chăm sóc | API PASS 6 HTTP; UI có code/build | QA trình duyệt MH-04/MH-09 |
| 9 Hóa đơn/thanh toán | Chưa triển khai API/UI | BLOCKED kiểm thử bởi thiếu implementation; sẽ triển khai tiếp |
| 10 Khiếu nại/hoàn tiền | Mới có SQL và đánh giá | BLOCKED kiểm thử hoàn tiền bởi thiếu implementation |
| 11 Báo cáo/quản trị | Có API tài khoản, UI chưa nối; chưa báo cáo | Tiếp tục triển khai và kiểm thử |

Các nhóm 9–11 chưa chạy được không được ghi PASS hoặc suy ra hoàn thành từ schema. Người dùng chọn cấu hình ngân hàng sau; không có kiểm thử VietQR với tài khoản ngân hàng thật trong phạm vi hiện tại.

Các lỗi đã tái hiện và sửa: validation API đăng ký/đăng nhập/CRUD, quyền nhân viên tự tạo hồ sơ khách, profile nhân viên inactive, phân biệt JWT access/refresh và phiên thu hồi, mật khẩu tạm chỉ có 3 ký tự; chống bế tắc hủy lịch khi ghi chú gốc đủ 500 ký tự bằng nhật ký riêng. Những test ban đầu FAIL và lần chạy lại PASS được giữ rõ trong nhật ký.

Không có thay đổi production hoặc xóa dữ liệu. Migration 002/003 chỉ áp trên PostgreSQL test cô lập. Việc triển khai các giai đoạn sau tiếp tục trên code hiện hữu, không xây lại dự án.
