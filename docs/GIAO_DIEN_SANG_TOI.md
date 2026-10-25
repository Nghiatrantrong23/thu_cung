# Chế độ giao diện sáng / tối

Ngày cập nhật: 25/10/2026. Nút mặt trăng / mặt trời xuất hiện ở thanh trên của trang nhân sự, khách hàng, bảng giá và góc trên trang đăng nhập. Nút có nhãn cho trình đọc màn hình, trạng thái nhấn và vòng focus bàn phím.

- Lần đầu dùng theo thiết lập sáng/tối của máy. Sau khi bấm nút, lựa chọn tường minh được lưu bằng khóa `petcare-theme` trong localStorage.
- Lưu theo từng địa chỉ web; bản 5173 và sandbox 5181 có lựa chọn riêng. Đổi trang, tải lại và đăng xuất/đăng nhập vẫn giữ lựa chọn. Các tab cùng địa chỉ đồng bộ qua storage event.
- Nếu trình duyệt chặn lưu trữ, nút vẫn chuyển được trong phiên hiện tại. Theo thay đổi chế độ của máy khi chưa chọn tường minh; không ghi đè lựa chọn của người dùng.
- Script `public/theme-init.js` áp dụng trước khi React/CSS vẽ trang để hạn chế lóe sáng khi tải lại chế độ tối. Provider và script khởi tạo dùng cùng khóa và hai giá trị hợp lệ `light` / `dark`.

## Màu sắc và phạm vi

`theme.css` định nghĩa bảng màu tối, xử lý utility, trường nhập/native calendar/autofill, dialog, footer và biểu đồ. `theme-components.css` chứa các màu tối tương ứng cho CSS component hiện có; giữ các màu hành động/trạng thái phân biệt được. Giao diện sáng dùng các màu gốc. Không dùng filter đảo màu; ảnh, minh họa và mã QR giữ nguyên màu dữ liệu.

Quy tắc tối chỉ áp dụng với `@media screen`; in chứng từ/PDF tiếp tục dùng bảng màu sáng và ẩn nút giao diện. Không sửa file Button hay tài liệu thiết kế đang staged của người dùng. Không đổi API, database, tài khoản hoặc cách tính tiền.

## Kiểm tra

- Frontend **29 PASS** (26 test trước + 3 nhóm lưu lựa chọn/giới hạn storage/khởi tạo trước paint); lint PASS, build 108 modules PASS.
- Trình duyệt sandbox: nhân sự/ca làm việc, footer, báo cáo quý và biểu đồ tối; chuyển sang sáng rồi reload giữ sáng, chuyển lại tối rồi đổi trang giữ tối.
- Đăng xuất ở chế độ tối, kiểm tra trang đăng nhập rồi đăng nhập khách; tổng quan khách, minh họa và ngăn kéo sửa thú cưng hiển thị rõ. Không lưu thay đổi hồ sơ khi kiểm tra.
- Ảnh `.cache/payment-sandbox/dark-theme-preview.png`. Chưa tuyên bố QA mọi màn hình/thiết bị hoặc bản in thực tế.
