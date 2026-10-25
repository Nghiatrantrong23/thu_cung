# Chỉnh UI theo báo cáo đánh giá

Nguồn: báo cáo người dùng gửi ngày 24/10/2026, phân tích 9 màn hình quản trị và các lỗi chung với giao diện khách hàng. Chỉ áp dụng chỉnh sửa UI trên chức năng và API hiện có; không nghiên cứu sản phẩm ngoài, không coi nhận định trong báo cáo là bằng chứng đã kiểm thử hệ thống.

| Nhóm | Thay đổi trong mã nguồn |
| --- | --- |
| Quy tắc nội dung | Bỏ MH-02b/MH-05 khỏi giao diện, bỏ uppercase nút, dùng `₫` cho trang và chứng từ. Ngày hiển thị `dd/mm/yyyy`, timestamp giữ thêm giờ 24h; không đổi giá trị ISO gửi API. |
| Ô nhập ngày/giờ | DateInput giữ input date gốc, handler, min/max, required và lịch native, thêm lớp hiển thị ngày Việt Nam độc lập locale OS. TimeInput hiển thị/nhập `HH:mm`, pattern 24h; kiểm tra nghiệp vụ vẫn ở API cũ. |
| Khung chung | Một container cho breadcrumb và nội dung nhân sự, bỏ link quay lại trùng/lệch vai trò; tăng chữ phụ ở sidebar, thống nhất tiêu đề/nút tạo, checkbox teal, disabled rõ hơn. |
| Thông báo | Dùng component cũ dưới dạng chuông và drawer ở header; giữ tải lại/đánh dấu đọc. Số chưa đọc ghi rõ 50 tin gần nhất. Tổng quan khách giữ khối thông báo riêng theo C1, không tải trùng ở header. |
| Lịch hẹn | Danh sách toàn chiều ngang, ngày/giờ và nút xem không bị bẻ dòng; nút Đặt lịch hộ khách là nút chính; chi tiết/phân công/đổi giờ/nhật ký nằm trong drawer hiện có. |
| Đặt tại quầy | Tiêu đề Đặt lịch tại quầy, giải thích bước phân công bằng ngôn ngữ người dùng; bỏ một nút quay lại lặp và bỏ chữ hoa nút. |
| Hóa đơn/khiếu nại | Danh sách là nội dung chính; form tạo/tiếp nhận và chi tiết/thu/hoàn mở trong drawer; lỗi cũng hiện trong drawer, giữ payload/hàm nghiệp vụ. Thêm tiêu đề Danh sách khiếu nại và trạng thái lọc trống. |
| Ca làm | Danh sách theo ngày, tạo/sửa mở drawer; giờ 24h, badge trạng thái, placeholder vị trí/ghi chú; không tự tạo ca. |
| Dịch vụ | Danh sách dùng toàn bề ngang; thêm/sửa dịch vụ, tạo nhóm mở drawer; badge Đang bán/Ngừng bán, checkbox màu teal. |
| Báo cáo | Nút in ở tiêu đề, nhấn mạnh Thực thu, ngày Việt Nam, cột tiền căn phải, nhóm chỉ số hóa đơn, badge/progress trạng thái theo vòng đời. Phép tính và nguồn báo cáo giữ nguyên. |
| Tài khoản | Bỏ giới hạn cuộn dọc 560px; hàng gọn hơn, header sticky trên desktop, cuộn ngang khi hẹp. Bỏ banner cố định; cảnh báo trong xác nhận khóa/đổi quyền. API kiểm tra lịch bị ảnh hưởng và hộp cảnh báo hiện có vẫn được giữ. |
| Tổng quan nhân sự | Chỉ số lịch hôm nay theo đúng dữ liệu API và quyền; bảng xem trước 5 lịch có nhãn giới hạn; Quản lý/Admin xem thực thu từ API báo cáo. Lối tắt thu gọn, thay monogram bằng SVG. Không gọi KPI hóa đơn tổng từ list giới hạn 200. |

## Kiểm tra và giới hạn

- Build frontend: `npm run build`, chạy đúng một lần sau chỉnh sửa; PASS 90 modules, không cảnh báo.
- Kiểm tra diff: chỉ frontend và tài liệu. Không đổi server, API, migration, DB, ma trận quyền hoặc dependency.
- Các thay đổi Button, Design System và TIEN_DO_GIAO_DIEN.md có từ đầu phiên được giữ nguyên, không gộp vào commit này.
- Chưa QA trình duyệt với dữ liệu thật, bàn phím, mobile/tablet hoặc ảnh zoom 100%. Không dùng build để kết luận các luồng thu/hoàn/phân công đã được nghiệm thu lại.
- Không chạy test ghi lên DB thật, không tạo tài khoản/ca/giao dịch thử.
- P2 còn lại: lịch tuần, tùy chọn mật độ, animation/toast bổ sung, ảnh nghiệm thu. Không coi toàn bộ báo cáo hoặc giai đoạn hệ thống đã hoàn tất.
