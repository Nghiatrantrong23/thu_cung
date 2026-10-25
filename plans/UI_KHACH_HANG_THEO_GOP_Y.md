# Sửa giao diện khách hàng theo góp ý bổ sung

Ngày 24/10/2026. Nguồn là báo cáo khách hàng do người dùng gửi; các nhận định trong ảnh về tương phản hoặc widget trình duyệt chưa được coi là kết quả kiểm tra thực tế.

## Đã chỉnh

- `KhungKhachHang.jsx` / CSS mới: header và nội dung cùng container 1280px, chữ phụ tối thiểu 13px trên các lớp chữ nhỏ phổ biến, nhãn rõ hơn, footer xám đậm hơn; chuẩn cỡ tiêu đề và viền card. Giữ chuông thông báo đã có.
- `TongQuan.jsx` / CSS: icon giọt nước/cắt tỉa/spa/chăm sóc tùy tên dịch vụ; nút đặt lịch là CTA teal đặc. Thẻ thống kê hoàn thành dùng xanh lá; bỏ tím trang trí, bỏ các override màu badge khác hệ thống. Cột thông báo giãn cùng hàng với lịch hẹn; card trống gọn hơn.
- `DanhSachLichHen.jsx`: tiêu đề/mô tả và CTA thống nhất; empty state minh họa ngoài bảng để không bị ép chiều rộng trên mobile; cột Chi tiết gọi hàm chọn lịch cũ, bố trí cột rõ hơn. Các thao tác hủy/đánh giá giữ nguyên.
- `HoaDonCuaToi.jsx`: empty state có minh họa, giải thích khi nào xuất hiện hóa đơn và link lịch hẹn/đặt lịch; không giữ cột phải trống khi chưa chọn hóa đơn; tải lại là nút phụ.
- `HoSoThuCung.jsx`: không hiện ba thẻ 0 khi chưa có thú cưng; không lặp CTA thêm ở header khi form tạo đã mở; nút lưu/thêm cuối form rõ hơn. Chỉ hiển thị form sửa khi có hồ sơ được chọn, hoặc form thêm khi đang ở chế độ tạo. Không đổi hàm thêm/sửa/ngừng theo dõi.
- `DatLich.jsx`: empty state cùng mẫu; thêm chỉ dẫn cho 3 nhóm trong biểu mẫu hiện có, giữ API, thứ tự trường và sự kiện. Đây chưa phải wizard 5 bước.
- `ThongTinCaNhan.jsx`: hai form song song trên desktop, một cột trên mobile; nút đổi mật khẩu teal; nút Hiện/Ẩn có thể Tab tới. Không tự sửa tên không dấu hoặc dữ liệu tài khoản.
- `ThongBao.jsx`: nhãn chưa đọc ngắn hơn, giải thích riêng danh sách tối đa 50 tin; giữ nguyên tải lại/đánh dấu đọc và giới hạn dữ liệu.

Component UI mới: `CustomerEmptyState`, `ServiceIcon`; không thêm dependency hoặc ảnh tải ngoài.

## Kiểm tra

- Build frontend đúng một lần: PASS 93 modules, không cảnh báo.
- Tương phản tính từ mã màu CSS: chữ `#5B6B7F` trên nền `#F8FAF9` = 5,20:1, trên trắng = 5,45:1; chữ trắng trên `#00796F` = 5,30:1. Chỉ là các cặp màu này, không phải chứng nhận WCAG toàn trang.
- Đối chiếu diff: giữ handler/payload nghiệp vụ; không sửa backend/API/database/quyền hoặc ghi dữ liệu thử. Giữ các thay đổi có sẵn của Button, Design System và file tiến độ riêng ngoài commit.
- Chưa QA trình duyệt, layout thực tế các viewport hoặc hành trình đăng nhập/lưu/đặt/hủy/thu tiền trong lần này; không chạy toàn bộ bộ kiểm thử hệ thống.
- Chưa xác định được nguồn widget tròn tím chỉ từ mô tả văn bản. Không tác động đến tiện ích trình duyệt hoặc thành phần ngoài website.
