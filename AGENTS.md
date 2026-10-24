# Quy tắc làm việc với dự án PetCare

## Phạm vi và tài liệu chuẩn

- Repository: https://github.com/Nghiatrantrong23/thu_cung; main là nhánh ổn định, không làm việc hoặc push trực tiếp lên main.
- Đọc plans/ke_hoach_tong_the.md và plans/02_THIET_KE_CO_SO_DU_LIEU.md trước khi thực hiện một giai đoạn.
- Tiến độ chỉ dựa trên kiểm tra thật. Có file hoặc bảng SQL không đồng nghĩa tính năng đã hoàn thành.
- Tôn trọng thay đổi hiện có của người dùng. Không đưa file không liên quan vào commit của giai đoạn.

## Quy tắc lưu sau mỗi giai đoạn (người dùng đã yêu cầu)

1. Kiểm tra tính năng theo tiêu chí nghiệm thu của giai đoạn và chạy build/test phù hợp.
2. Nếu đạt, cập nhật tiến độ và kết quả kiểm tra trong kế hoạch. Nếu chưa đạt, ghi rõ phần thiếu; không gắn nhãn hoàn thành.
3. Trước khi chỉnh sửa, tạo hoặc chuyển sang nhánh công việc riêng (ví dụ codex/giai-doan-12). Kiểm tra diff, danh sách file staged và thông tin bí mật; commit code cùng tài liệu liên quan.
4. Thông điệp commit bằng tiếng Việt, ví dụ: "Hoàn thành giai đoạn 6: Đặt lịch dịch vụ".
5. Tự đẩy commit lên đúng nhánh công việc trên origin khi giai đoạn hoàn tất. Luôn chỉ định tên nhánh khi push; không push trực tiếp lên main.
6. Kiểm tra SHA local bằng SHA refs/heads/<nhánh công việc> trên remote trước khi báo đã lưu trên GitHub; gửi người dùng tên nhánh, mã commit và link.
7. Nếu mạng, quyền hoặc xác thực bị lỗi, giữ commit cục bộ, báo rõ chưa push được và điều kiện cần xử lý.
8. Chỉ merge hoặc đưa thay đổi vào main khi người dùng yêu cầu rõ. Kiểm thử đạt không thay thế yêu cầu này. Quy tắc nhánh riêng do người dùng cập nhật ngày 24/10/2026 thay thế quy tắc main mặc định trước đó.

## An toàn dữ liệu và lịch sử

- Không force-push, reset phá hủy, xóa nhánh hoặc viết lại lịch sử nếu chưa có yêu cầu rõ của người dùng.
- Nếu remote có commit mới: fetch, kiểm tra và tích hợp có kiểm soát; không ghi đè. Xử lý xung đột trước khi push.
- Không commit .env, token, khóa riêng, mật khẩu thật, dump database, node_modules, build hoặc log.
- .env.example/.env.template chỉ chứa giá trị mẫu an toàn; không sao chép bí mật từ .env sang các file khác.
- Dữ liệu seed demo phải được phân biệt với thông tin đăng nhập thật. Không chạy seed/test ghi dữ liệu trên DB thực tế.
- Git lưu code và tài liệu, không tự sao lưu dữ liệu PostgreSQL. Sao lưu DB là công việc riêng, không công khai dump lên repo.
- Chỉ xác nhận một giai đoạn xong khi kiểm tra đạt; commit sao lưu ban đầu không được gọi là hoàn thành giai đoạn 6.

## Ghi nhận thiết lập ban đầu

- Ngày 23/10/2026: người dùng đồng ý cấp quyền Modify cho chính tài khoản Windows của mình trên D:/dich_vu_thu_cung; quyền đã được áp dụng qua xác nhận quản trị Windows.
- Thư mục dự án chính và nơi làm việc cho các giai đoạn sau: D:/dich_vu_thu_cung. Bản sao chuẩn bị ở output/thu_cung_git không phải nơi tiếp tục phát triển sau thiết lập.
- Bản lưu ban đầu gồm mã nguồn hiện có, hai kế hoạch phiên bản 2.0, quy tắc Git và nhật ký kiểm tra; không coi là đã nghiệm thu giai đoạn 6.
