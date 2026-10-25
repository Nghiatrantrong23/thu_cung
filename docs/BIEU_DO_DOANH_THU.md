# Biểu đồ doanh thu theo ngày, tháng, quý và năm

Cập nhật 25/10/2026, trang `/quan-ly/bao-cao`, dùng được trên cả bản 5173 và sandbox 5181 với quyền quản lý/Admin.

## Cách dùng

Chọn Ngày / Tháng / Quý / Năm / Tùy chọn. Chọn ngày, tháng hoặc quý và năm mong muốn rồi bấm **Xem biểu đồ**. Chuyển loại kỳ sẽ tải ngay kỳ tương ứng; sau khi sửa thời gian, bấm nút để áp dụng.

- Ngày: tổng thu/hoàn của đúng ngày đó.
- Tháng: từng ngày trong tháng, có cả ngày không giao dịch.
- Quý: ba tháng trong quý.
- Năm: đủ 12 tháng.
- Tùy chọn: tối đa 366 ngày theo giới hạn API; khoảng dài hơn 63 ngày tổng hợp theo tháng, khoảng ngắn hơn theo ngày.

Biểu đồ cột màu xanh là đã thu, cam là đã hoàn; đường tím là thực thu (đã thu − đã hoàn), có thể âm. Trục tung hiển thị đơn vị VND theo nghìn/triệu; vùng chi tiết hiển thị đầy đủ số tiền. Chạm/bấm một mốc hoặc dùng Tab và Enter để chọn. Trên màn hình hẹp, biểu đồ nhiều mốc cuộn ngang; biểu đồ ít mốc tự vừa chiều rộng.

Thẻ KPI tiếp tục hiển thị tổng tiền cả kỳ. Bảng giao dịch theo ngày bên dưới giữ những ngày có giao dịch thực tế; các ngày/tháng 0 chỉ bổ sung trong biểu đồ, không ghi vào database.

## Nguồn dữ liệu

Giữ nguyên API `/api/bao-cao/doanh-thu?tuNgay=...&denNgay=...`, quyền server và cách tính tiền/cọc/hoàn đã có. Client tổng hợp dữ liệu daily bằng số nguyên đơn vị 1/100 đồng, không cộng lại cọc hoặc hóa đơn. Lọc biên ngày bao gồm cả ngày đầu và cuối. Ngày lịch được tính bằng UTC trên chuỗi ngày nghiệp vụ Việt Nam để tránh đổi ngày do timezone/DST của máy.

Chỉ hiển thị dữ liệu lịch sử/thực nhận của API; không giả số liệu, không dự báo và không tính lợi nhuận. Báo cáo ngày hiện là tổng cả ngày, chưa phân theo giờ. Không đổi API/schema, không migrate, seed hay ghi giao dịch để tạo hình biểu đồ.

## Kiểm tra

- Frontend 26 PASS (20 hiện có + 6 nhóm mới): biên ngày/tháng/quý/năm, năm nhuận, quý 4, giới hạn kỳ, ngày không giao dịch, tổng hợp 3/12 tháng, tiền thập phân, thực thu âm, đổi năm và độc lập timezone.
- Lint PASS, build 103 modules PASS.
- Trình duyệt sandbox: tháng 10 có đủ 31 ngày; quý 4 đủ 3 tháng; năm 2026 đủ 12 tháng; báo cáo ngày 09/11 không giao dịch hiển thị 0. Chọn tháng 11 trên quý hiển thị chi tiết 0; tổng quý/năm vẫn thu 1.145.000 − hoàn 200.000 = thực thu 945.000 đồng, khớp API sandbox. Không coi số demo là dữ liệu bản chính.
- Ảnh cục bộ `.cache/payment-sandbox/revenue-quarter-preview.png`. Không thay đổi dữ liệu hoặc các file đang sửa của người dùng.
