# Đặc tả đề xuất: hồ sơ khách và thú cưng tại quầy

Ngày lập: 01/11/2026. Trạng thái: **đề xuất để chốt quy tắc, chưa triển khai hoặc nghiệm thu**. Phạm vi ưu tiên cao là tạo hồ sơ khách, tạo thú cưng và tra cứu; gộp hồ sơ là mở rộng ưu tiên thấp.

## 1. Hiện trạng đã kiểm tra

| Nhu cầu | Hiện có | Khoảng thiếu |
| --- | --- | --- |
| Tạo khách tại quầy | `POST /api/lich-hen/tai-quay` tạo khách mới cùng lịch, dùng SĐT làm tên đăng nhập và cấp mật khẩu tạm; có khóa theo SĐT để tránh tạo trùng khi đặt lịch đồng thời. | Không tạo hồ sơ độc lập; chưa lưu người tạo; không nhập email. |
| Tạo thú cưng cho khách | Trong luồng đặt lịch chỉ nhập tên và loài. Khách tự tạo/sửa thú cưng qua API của chính mình. | Lễ tân chưa có API tạo/sửa thú cưng cho khách; chưa nhập các thuộc tính đầy đủ. |
| Tra cứu khách | `GET /api/khach-hang/tra-cuu?sdt=` tìm đúng SĐT 10 chữ số, trả hồ sơ khách và thú cưng đang theo dõi. | Chưa tìm theo tên/email/thú cưng/mã lịch; chưa có màn hình lịch sử tổng hợp. |
| Gộp hồ sơ | Chưa có. | Cần quy trình đối chiếu, chuyển liên kết và nhật ký trước khi làm. |

## 2. Quy tắc đề xuất cần duyệt

1. **Khách tại quầy:** họ tên và SĐT 10 chữ số là bắt buộc; email tùy chọn và phải hợp lệ nếu nhập. Một SĐT chỉ thuộc một hồ sơ đang dùng. Không tự tạo hồ sơ mới khi SĐT đã tồn tại; mở hồ sơ hiện có cho lễ tân kiểm tra. Nếu SĐT thuộc vai trò khác hoặc hồ sơ bị khóa, trả lỗi rõ và chuyển quản lý xử lý, không đổi vai trò tự động.
2. **Trạng thái đăng nhập:** tạo hồ sơ tại quầy không đòi khách đặt mật khẩu. Đề xuất phân biệt hồ sơ khách với quyền đăng nhập: hồ sơ mới chưa kích hoạt đăng nhập, không có mật khẩu; chỉ kích hoạt qua luồng mời có token dùng một lần. Email mời là tùy chọn và chỉ gửi khi khách đồng ý, email đã xác minh định dạng và cấu hình gửi thư hoạt động. Chưa cấu hình email thì lưu hồ sơ, hiển thị rõ chưa gửi lời mời. Tài khoản tạm đang được cấp trong luồng đặt lịch hiện hữu cần quy tắc chuyển tiếp riêng trước khi thay đổi.
3. **Truy vết:** lưu ID nhân viên tạo và thời điểm tạo/sửa; hệ thống lấy ID từ phiên đăng nhập, không tin giá trị do trình duyệt gửi. Nhật ký ghi hành động, đối tượng và trường thay đổi phù hợp, không ghi mật khẩu/token hoặc toàn bộ ghi chú sức khỏe. Nhân viên bị khóa sau này vẫn giữ được liên kết lịch sử.
4. **Thú cưng:** mỗi khách có nhiều thú cưng. Bắt buộc tên và loài (`Chó`/`Mèo` theo danh mục hiện tại). Giống, ngày sinh, cân nặng, giới tính, đã tiêm phòng, dị ứng, tính cách, ghi chú sức khỏe tùy chọn. Hiển thị tuổi ước tính từ ngày sinh, không lưu đồng thời tuổi và ngày sinh. Cân nặng > 0; ngày sinh không ở tương lai. Trạng thái tiêm phòng nên có `Chưa rõ`, `Đã tiêm`, `Chưa tiêm`, tránh mặc định sai. Dị ứng và ghi chú là thông tin khách cung cấp, không phải chẩn đoán.
5. **Chống trùng thú cưng:** cảnh báo khi cùng chủ, tên không phân biệt hoa thường và loài trùng; cho lễ tân mở hồ sơ cũ. Không gộp tự động vì hai bé có thể trùng tên.
6. **Tra cứu:** lễ tân/quản lý/Admin tìm theo một hoặc nhiều tiêu chí: tên, SĐT, email, tên thú cưng, mã lịch. Tìm SĐT/email chính xác; tên tìm gần đúng có giới hạn. Kết quả phân trang và hiển thị tối thiểu để chọn đúng khách. Chi tiết mới tải khi mở hồ sơ. Không trả hash mật khẩu, token, thông tin xác thực hoặc ghi chú sức khỏe trong danh sách kết quả. Chi tiết được quyền mới hiện ghi chú sức khỏe phục vụ chăm sóc.
7. **Lịch sử:** trang chi tiết chia thú cưng, lịch hẹn, hóa đơn và khiếu nại; mỗi mục phân trang theo khách đã chọn, có trạng thái và ngày. Lễ tân xem thông tin cần phục vụ khách; quyền duyệt hoàn tiền và quản trị tài khoản không mở thêm. Không đếm từ danh sách bị giới hạn để báo tổng sai.
8. **Gộp hồ sơ:** chỉ quản lý, làm sau. Yêu cầu kiểm tra quyền sở hữu hai hồ sơ, bảng xem trước các lịch/thú cưng/hóa đơn/khiếu nại sẽ chuyển, xác nhận có lý do, transaction và nhật ký. Giữ hồ sơ nguồn ở trạng thái đã gộp để truy vết, không xóa dữ liệu hoặc gộp mật khẩu tự động.

## 3. Luồng giao diện đề xuất

- Menu lễ tân có mục **Khách hàng**. Trang đầu là tìm kiếm và nút **Tạo khách tại quầy**.
- Khi nhập SĐT trong form tạo, kiểm tra trùng trên server lúc lưu; kết quả trùng mở liên kết hồ sơ cũ. Form không yêu cầu lịch hẹn hoặc thú cưng.
- Hồ sơ khách có thao tác **Thêm thú cưng**. Form hiển thị trường bắt buộc, lỗi từng trường, trạng thái đang lưu và kết quả lưu. Chỉ lưu một lần khi nhấn lại hoặc mạng chậm.
- Từ trang đặt lịch tại quầy có thể chọn khách và thú cưng vừa tạo. Duy trì luồng đặt lịch nhanh đang có đến khi chuyển tiếp được kiểm thử.
- Trang chi tiết khách có các phần Thông tin, Thú cưng, Lịch hẹn, Hóa đơn, Khiếu nại; trên màn hẹp các phần xếp dọc, không tràn ngang.

## 4. API và dữ liệu dự kiến

Đây là hợp đồng **dự kiến**, chưa có route mới:

| API | Quyền | Kết quả chính |
| --- | --- | --- |
| `POST /api/khach-hang/tai-quay` | T/Q/A | Tạo hồ sơ chưa kích hoạt; `409` nếu trùng SĐT/email, trả mã hồ sơ để mở bản có sẵn theo quyền. |
| `GET /api/khach-hang?tim=...&loai=...&page=...` | T/Q/A | Danh sách tối thiểu, phân trang; `loai` gồm tên/SĐT/email/thú cưng/mã lịch. |
| `GET /api/khach-hang/:id` | T/Q/A | Hồ sơ cơ bản và liên kết các phần lịch sử; không trả bí mật xác thực. |
| `POST /api/khach-hang/:id/thu-cung` | T/Q/A | Tạo thú cưng thuộc đúng khách, trả hồ sơ mới. |
| `GET /api/khach-hang/:id/{thu-cung,lich-hen,hoa-don,khieu-nai}` | T/Q/A | Từng danh sách phân trang và lọc theo khách trên server. |
| `POST /api/khach-hang/:id/loi-moi` | T/Q/A | Chỉ gửi khi khách đồng ý và dịch vụ email sẵn sàng; không tiết lộ token qua API. |

Migration mới cần bổ sung trạng thái kích hoạt đăng nhập, người tạo và nhật ký tạo/sửa; trường tiêm phòng/dị ứng/tính cách cho thú cưng. Giữ dữ liệu cũ bằng giá trị mặc định an toàn và khóa ngoại nullable khi không có người tạo. Không sửa migration đã áp dụng. Thiết kế token mời phải tái dùng hoặc tương thích với cơ chế token đặt lại mật khẩu, nhưng không được biến đường mời thành cách chiếm tài khoản hiện có.

## 5. Tiêu chí nghiệm thu trước khi gọi hoàn thành

- Tạo khách độc lập với lịch; trùng SĐT, email và gửi đồng thời không tạo hai hồ sơ. Không có tài khoản đăng nhập dùng được khi chưa kích hoạt.
- Tạo hai thú cưng cho cùng chủ, lưu/đọc đầy đủ trường tùy chọn; dữ liệu chủ khác không được gắn nhầm. Không sửa được hồ sơ thuộc vai trò khác.
- Tra cứu cả năm tiêu chí với phân trang; mở đúng hồ sơ và đối chiếu lịch hẹn, hóa đơn, khiếu nại qua API. Vai trò chăm sóc/khách không gọi được API lễ tân.
- Nhật ký đúng nhân viên thực hiện; response và log không lộ hash, token hoặc mật khẩu tạm.
- Kiểm thử tích hợp trên DB test mới; thử migration trên bản sao có backup/đối chiếu; frontend lint/test/build và QA trình duyệt ở 375/768/1440 px. Không seed hoặc thử ghi trên DB đang dùng.

## 6. Các quyết định còn chờ chốt

1. Chọn **hồ sơ chưa kích hoạt, không mật khẩu** như mục 2, hay tiếp tục cấp mật khẩu tạm ngay khi tạo hồ sơ? Khuyến nghị phương án chưa kích hoạt; luồng đặt lịch cũ chỉ đổi sau khi đã có chuyển tiếp và kiểm thử.
2. Chỉ `Chó`/`Mèo` theo schema hiện tại, hay mở thêm loài khác? Khuyến nghị giữ hai loài trong đợt này để không làm sai ràng buộc và danh mục dịch vụ.
3. Lời mời kích hoạt qua email có thuộc đợt ưu tiên cao này không? Khuyến nghị tách sang đợt sau vì gửi email thật chưa nghiệm thu; vẫn thiết kế trạng thái để bổ sung mà không di chuyển hồ sơ.
