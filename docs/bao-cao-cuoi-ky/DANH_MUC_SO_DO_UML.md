# Kiểm kê sơ đồ PetCare

Ngày 08/11/2026. Giai đoạn 0. Đã mở và quan sát trực tiếp **17/17 PNG gốc**, gồm 1 UC, 6 Activity, 6 Sequence, 1 Class, 2 State Machine và 1 cây màn hình. Đủ sáu loại về sự hiện diện; **không xác nhận toàn bộ sơ đồ đã hoàn thiện/khớp mã nguồn**.

Mã UC-01, SM-01, SM-02 và MH-TQ là mã hồ sơ đặt cho khảo sát; AD-01…AD-06, SD-01…SD-06, CD-01 đọc được trên hình. Các bản cùng hash trong cache/backup không đếm thêm.

| Mã / loại | File gốc | Kích thước pixel | Mục / hình dự kiến | Mục đích và trạng thái |
|---|---|---|---|---|
| UC-01 / Use Case | [Sơ đồ ca sử dụng.png](<../../Sơ đồ trạng thái_sơ đồ class/Sơ đồ ca sử dụng.png>) | 1035 × 692 | 2.3 / Hình 2.1 | Tác nhân và chức năng tổng thể. Đã xem ảnh; Có năm nhóm đăng nhập và khách vãng lai; cần rà ký pháp, quyền Admin và dấu chọn còn trên ảnh. |
| AD-01 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - ĐĂNG KÝ TÀI KHOẢN.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - ĐĂNG KÝ TÀI KHOẢN.png>) | 808 × 831 | 2.4.1 / Hình 2.2 | Đăng ký tài khoản. Đã xem ảnh; Luồng chính phù hợp; hình không mô tả mọi điều kiện validation, transaction hoặc giới hạn mật khẩu. |
| AD-02 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - ĐẶT LỊCH DỊCH VỤ_02.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - ĐẶT LỊCH DỊCH VỤ_02.png>) | 1197 × 1228 | 2.4.2 / Hình 2.3 | Đặt lịch online/tại quầy. Đã xem ảnh; Chưa thể hiện snapshot cọc, khóa ngày và ca bao trọn toàn thời lượng. |
| AD-03 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png>) | 2166 × 924 | 2.4.3 / Hình 2.4 | Điều phối và phân công. Đã xem ảnh; Nhánh từ chối trên hình ghi Đã hủy, khác TuChoi trong code. |
| AD-04 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - THỰC HIỆN DỊCH VỤ.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - THỰC HIỆN DỊCH VỤ.png>) | 1807 × 942 | 2.4.4 / Hình 2.5 | Tiếp nhận và chăm sóc. Đã xem ảnh; Nhánh không đủ điều kiện có hủy/hoãn nhưng đi về cập nhật Đã hủy; code tách đổi giờ/hủy và chặn xử lý làm dở. |
| AD-05 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png>) | 1519 × 1400 | 2.4.5 / Hình 2.6 | Lập hóa đơn và thu. Đã xem ảnh; Chưa có khấu trừ cọc; cụm hóa đơn điện tử không chứng minh tích hợp thuế; QR chưa đồng nghĩa tự đối soát. |
| AD-06 / Activity | [SƠ ĐỒ HOẠT ĐỘNG - XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png](<../../Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png>) | 1352 × 1902 | 2.4.6 / Hình 2.7 | Tiếp nhận, quyết định và chi hoàn. Đã xem ảnh; Hình ghi giao dịch/đã hoàn trước thực chi; trạng thái khiếu nại khác hiện tại. |
| SD-01 / Sequence | [SƠ ĐỒ TUẦN TỰ – ĐĂNG NHẬP.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – ĐĂNG NHẬP.png>) | 1262 × 609 | 2.5.1 / Hình 2.8 | Tương tác đăng nhập. Đã xem ảnh; Phiên được mô tả khái quát; chưa có refresh, version và bắt đổi mật khẩu tạm. |
| SD-02 / Sequence | [SƠ ĐỒ TUẦN TỰ – ĐẶT LỊCH DỊCH VỤ.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – ĐẶT LỊCH DỊCH VỤ.png>) | 1717 × 1269 | 2.5.2 / Hình 2.9 | Tương tác đặt lịch. Đã xem ảnh; Điều kiện số lịch nhỏ hơn số người trực ca không tương đương solver toàn khoảng hiện có. |
| SD-03 / Sequence | [SƠ ĐỒ TUẦN TỰ – QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png>) | 1514 × 1540 | 2.5.3 / Hình 2.10 | Tương tác điều phối. Đã xem ảnh; Hình từ chối dùng DaHuy và opt đứng trước phân công; code chọn một nhánh loại trừ. |
| SD-04 / Sequence | [SƠ ĐỒ TUẦN TỰ – THỰC HIỆN DỊCH VỤ.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – THỰC HIỆN DỊCH VỤ.png>) | 1501 × 1483 | 2.5.4 / Hình 2.11 | Tương tác chăm sóc. Đã xem ảnh; Khối hủy nằm sau alt; cần nói rõ không chạy tiếp sau hoàn thành theo mã hiện tại. |
| SD-05 / Sequence | [SƠ ĐỒ TUẦN TỰ – LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png>) | 1967 × 1575 | 2.5.5 / Hình 2.12 | Tương tác hóa đơn và thu. Đã xem ảnh; Hình suy tiền ghi nhận từ tiền đưa; code phân biệt số ghi nhận/tiền đưa và có cọc, idempotency. |
| SD-06 / Sequence | [SƠ ĐỒ TUẦN TỰ – XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png](<../../Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png>) | 1730 × 1938 | 2.5.6 / Hình 2.13 | Tương tác khiếu nại và hoàn. Đã xem ảnh; Duyệt đã tạo giao dịch/đóng khiếu nại trong hình; code giữ ChoHoanTien đến thực chi thành công. |
| CD-01 / Class | [SƠ ĐỒ LỚP HỆ THỐNG.png](<../../Sơ đồ trạng thái_sơ đồ class/SƠ ĐỒ LỚP HỆ THỐNG.png>) | 1858 × 1705 | 2.6 / Hình 2.14 | Mô hình lớp miền. Đã xem ảnh; Là mô hình khái niệm; chưa thể hiện bảng kỹ thuật, cọc và reset hiện có; không phải class ES6 của backend. |
| SM-01 / State Machine | [Sơ đồ trạng thái_01.png](<../../Sơ đồ trạng thái_sơ đồ class/Sơ đồ trạng thái_01.png>) | 1186 × 612 | 2.7.1 / Hình 2.15 | Trạng thái lịch hẹn. Đã xem ảnh; Thiếu TuChoi; chuyển DangThucHien sang DaHuy trên hình không được API hủy cho phép. |
| SM-02 / State Machine | [Sơ đồ trạng thái.png](<../../Sơ đồ trạng thái_sơ đồ class/Sơ đồ trạng thái.png>) | 785 × 681 | 2.7.2 / Hình 2.16 | Trạng thái hóa đơn. Đã xem ảnh; Thiếu HoanTienMotPhan và điều kiện thực chi; không đủ dùng như máy trạng thái hiện hành hoàn chỉnh. |
| MH-TQ / Màn hình/điều hướng | [Sơ ĐỒ MÀN HÌNH CHÍNH.png](<../../So do man hinh/Sơ ĐỒ MÀN HÌNH CHÍNH.png>) | 1592 × 430 | 2.8 / Hình 2.17 | Cây phân nhóm màn hình. Đã xem ảnh; Chưa có nhiều route mới; gộp lễ tân/quản lý không có nghĩa hai nhóm có quyền giống nhau. |

## Tài liệu màn hình đi kèm

- [Màn hình trang 1_ MH-01, MH-02, MH-03, MH-11.md](<../../So do man hinh/Màn hình trang 1_ MH-01, MH-02, MH-03, MH-11.md>) — wireframe bằng văn bản, không phải ảnh giao diện đã chạy.
- [Màn hình trang 2_ MH-04, MH-05, MH-02b, MH-06.md](<../../So do man hinh/Màn hình trang 2_ MH-04, MH-05, MH-02b, MH-06.md>) — wireframe bằng văn bản, không phải ảnh giao diện đã chạy.
- [Màn hình trang 3_ MH-07, MH-09, MH-10, MH-08.md](<../../So do man hinh/Màn hình trang 3_ MH-07, MH-09, MH-10, MH-08.md>) — wireframe bằng văn bản, không phải ảnh giao diện đã chạy.

## Định dạng và phần thiếu

- Không tìm thấy file `.puml`, `.plantuml`, `.drawio`, `.vsdx`, `.mmd` trong phạm vi quét workspace kể cả cache, loại trừ thư viện phụ thuộc/build/backup DB. Có ERD Mermaid nội tuyến trong kế hoạch CSDL; đây không phải file nguồn của 17 PNG.
- Không tìm thấy báo cáo DOCX/PDF PetCare trong workspace. Không có bảng đặc tả UC độc lập được nhận diện; không nhận wireframe thành đặc tả UC đầy đủ.
- UC-01 còn dấu chọn màu xanh; một số hình trạng thái/UC còn đường hướng dẫn nét đứt. Các hình Sequence/Class nhiều chữ cần thử trang ngang hoặc bố trí phù hợp khi tạo Word. Không chỉnh sửa/crop hình gốc ở Giai đoạn 0.
- Kích thước pixel cho biết khả năng hiển thị, không tự chứng minh chữ đọc được khi in A4. Kiểm tra này chỉ hoàn tất sau render Word/PDF tại giai đoạn xuất bản.
- Chưa có nguồn chỉnh sửa sơ đồ; nếu người dùng muốn cập nhật phải có yêu cầu riêng. Hiện tại giữ hình và thuyết minh rõ khác biệt.

Bảng đối chiếu chi tiết: [UML và mã nguồn](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md).
