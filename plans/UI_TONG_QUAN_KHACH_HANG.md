# C1 — Tổng quan khách hàng

Hoàn thiện theo yêu cầu xây dựng Tổng quan và tài liệu “PetCare — Tổng hợp thiết kế giao diện (bản gộp)”, cùng mẫu C1 HTML khách hàng đã cung cấp.

## Giao diện đã tích hợp

- Route `/#/tong-quan`, mục Tổng quan trong menu và logo; khách đăng nhập sẽ đến Tổng quan. Điều hướng đổi mật khẩu tạm và các vai trò nhân sự giữ nguyên.
- Hero lời chào theo giờ Việt Nam, tên từ phiên đăng nhập, SVG chó/mèo có sẵn, nút đặt lịch và xem lịch.
- Ba chỉ số: thú cưng đang theo dõi, số lịch sắp tới, số lịch hoàn thành. Lỗi tải hiện dấu gạch thay vì báo số 0; số lịch không bị giới hạn theo ba thẻ xem trước.
- Lịch sắp tới có ngày, giờ, tên bé, dịch vụ, trạng thái, nhân viên và giá dự kiến. Loại lịch đã hủy/từ chối/hoàn thành; giờ Việt Nam. Lịch đang thực hiện trong ngày vẫn hiển thị.
- Tái sử dụng nguyên component thông báo, mở sẵn trong cột bên; giữ tải lại và đánh dấu đã đọc, không hiển thị trùng trong layout. Nhãn chưa đọc vẫn ghi rõ phạm vi 50 tin gần nhất.
- Pet Cards lấy đúng `pets` và `active` từ API hiện tại. Dịch vụ đọc tên, mô tả, giá, thời lượng từ bảng giá hiện có.
- Màu Primary/Primary 600/Primary Dark theo tài liệu, Be Vietnam Pro, card 16px, nút 12px, mục tiêu bấm tối thiểu 44px. CSS nằm trong trang; menu thu gọn trên màn hình nhỏ, có focus và reduced motion.
- Các nút dẫn đến trang nghiệp vụ hiện có; nút Đặt lịch trên thẻ dịch vụ không giả lập chọn sẵn dịch vụ.

## Phạm vi

Chỉ hoàn thiện C1 và phần điều hướng/hiển thị cần thiết. Không thay backend, API, schema, dữ liệu, quyền hay nghiệp vụ. Giữ các thay đổi giao diện đang có trong workspace; không đưa Button hoặc tài liệu Design System chưa thuộc lần này vào commit.

## Kiểm tra

- `npm run build` trong `dichvu`: PASS, 85 modules, không cảnh báo; chạy đúng một lần sau chỉnh sửa.
- Đối chiếu tĩnh hợp đồng `pets`, `lichHen`, `dichVu`, trạng thái và các route đích với code hiện tại.
- Không chạy toàn bộ kiểm thử hệ thống. Chưa QA đăng nhập và responsive bằng trình duyệt cho bản C1 này; build không thay thế nghiệm thu hành trình.
- Không đánh dấu toàn bộ đợt 2 hoặc giai đoạn 12 hoàn tất.
