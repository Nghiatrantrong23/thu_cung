# Đề cương sơ bộ báo cáo cuối kỳ PetCare

Ngày khảo sát: 08/11/2026. Giai đoạn 0. Đây là đề cương sơ bộ theo yêu cầu bắt đầu ngay; chưa phải đề cương đã duyệt của Giai đoạn 1 và chưa phải nội dung báo cáo hoàn chỉnh.

Tên đề tài: **XÂY DỰNG HỆ THỐNG QUẢN LÝ VÀ ĐẶT LỊCH DỊCH VỤ CHĂM SÓC THÚ CƯNG**.

## Nguyên tắc biên soạn

- Bắt đầu từ Tóm tắt đồ án. Không tạo bìa, bìa trong, lời cảm ơn, cam đoan, nhận xét hoặc lịch làm việc theo phạm vi người dùng chủ động lược bỏ.
- Giữ đúng ba chương. Phụ lục đặt trước tài liệu tham khảo. Mở đầu bắt đầu số trang 1; phần đứng trước không đánh số trang.
- Phân biệt thiết kế gốc, triển khai hiện tại, kết quả thử nghiệm có biên bản và phần chưa đủ bằng chứng. Không sửa mã hoặc sơ đồ gốc để làm cho báo cáo có vẻ nhất quán.
- Các số nguồn dưới đây kế thừa thư viện 35 hồ sơ, còn là số làm việc. Khi chốt nguồn phải sắp và đổi số đồng bộ theo hướng dẫn trường; không sao chép mọi nguồn vào danh mục nộp.
- Hình 2.1–2.17 là vị trí dự kiến, không phải hình đã được chèn vào Word. Danh sách cụ thể tại [kiểm kê sơ đồ](DANH_MUC_SO_DO_UML.md); sai khác tại [bảng đối chiếu](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md).

## Phần đầu

1. **TÓM TẮT ĐỒ ÁN:** tối đa một trang A4; vấn đề, mục tiêu, phạm vi năm nhóm người dùng, kỹ thuật, kết quả có bằng chứng và hạn chế. Bản tóm tắt đã soạn trong chat là bản tham khảo; cần cập nhật theo bảng hiện trạng, nhất là thanh toán và quản trị còn giới hạn.
2. **MỤC LỤC:** trường tự động từ Heading Styles; chỉ tạo ở giai đoạn Word, không nhập số trang đoán trước.
3. **DANH MỤC SƠ ĐỒ, HÌNH:** trường theo caption; sơ đồ thiết kế và ảnh giao diện là hai loại bằng chứng khác nhau.
4. **DANH MỤC BẢNG:** trường theo caption.
5. **DANH MỤC TỪ VIẾT TẮT:** UML, API, REST, JWT, RBAC, SQL, HTTP, UI; chỉ giữ thuật ngữ thực sự dùng và giải thích khi xuất hiện lần đầu.

## MỞ ĐẦU

- **1. Lý do chọn đề tài:** bài toán thông tin phân tán, lịch, thời lượng dịch vụ, ca và trách nhiệm; ghi đây là phân tích bài toán nếu chưa có khảo sát cơ sở, không giả lời phỏng vấn hoặc số liệu thị trường.
- **2. Mục tiêu:** mục tiêu tổng quát quản lý và đặt lịch; mục tiêu cụ thể hồ sơ, điều phối, chăm sóc, giao dịch, quyền và kiểm tra tính đúng.
- **3. Đối tượng nghiên cứu:** quy trình phục vụ chó mèo, người dùng và dữ liệu nghiệp vụ; không mở rộng thành hệ thống chẩn đoán/điều trị thú y.
- **4. Phạm vi:** ứng dụng Web; năm nhóm quyền; môi trường local/test. Chỉ mô tả thanh toán chuyển khoản xác nhận thủ công và sandbox đúng từng chế độ; không nhận là merchant hoặc đối soát ngân hàng tự động.
- **5. Phương pháp:** Narrative/Integrative Literature Review; đọc mã/tài liệu; mô hình hóa; thiết kế dữ liệu/API; kiểm thử có bằng chứng. Chưa có khảo sát thực địa hay phép đo hiệu năng mới.
- **6. Bố cục:** ba chương theo mẫu, kết luận, phụ lục và tham khảo.

## CHƯƠNG 1 TỔNG QUAN TÀI LIỆU

### 1.1. Tổng quan lĩnh vực chăm sóc thú cưng

Bối cảnh Việt Nam dựa nguồn [31]; phân biệt tin hội thảo với báo cáo thị trường. Nguồn [5], [12] chỉ dùng kỹ thuật chăm sóc sau khi đọc đúng chương; không suy từ catalog.

### 1.2. Đặc điểm và quy trình cung cấp dịch vụ

Tiếp nhận, lựa chọn dịch vụ, lịch, chuẩn bị, chăm sóc, bàn giao và phản hồi. Nguồn nghề [13], hướng dẫn [16] hỗ trợ câu hỏi nghiệp vụ. Quy trình áp dụng tại PetCare là phân tích của nhóm, chưa được chứng nhận là SOP của cơ sở thực địa.

### 1.3. Những vấn đề trong quản lý và đặt lịch

Thời lượng khác nhau, ca bao phủ toàn dịch vụ, nhiều yêu cầu tranh chỗ, lịch chờ chưa có người, xác nhận cọc, giá lịch sử và thu/hoàn. Phân biệt bài toán khả thi với tối ưu lịch; không tự thêm mục tiêu tối ưu doanh thu hoặc thời gian chờ chưa đo.

### 1.4. Các công trình và hệ thống liên quan

- [29], [30], [33]: công trình hệ thống đã tiếp cận phần nội dung; nêu phạm vi và hạn chế đánh giá.
- [26]: khóa luận Việt trực tiếp, hiện chỉ metadata/tóm tắt; chưa dùng để khẳng định chức năng hoặc kết quả.
- [6]: hệ thống quản lý dịch vụ khác miền để đối chiếu trách nhiệm và vòng đời.
- [19]–[21]: Gingr, DaySmart Pet, MoeGo là tài liệu nhà cung cấp, không gọi là ba nghiên cứu khoa học.
- D&C, Paws Pet House: chỉ nêu trong hồ sơ nghiên cứu ngoài báo cáo chính cho đến khi xác minh xuất xứ; không sử dụng làm nguồn chính thức hiện tại.

### 1.5. Phân tích và so sánh giải pháp

Dự kiến Bảng 1.1: loại nguồn, hồ sơ thú cưng, đặt/duyệt lịch, phân công, giao dịch và giới hạn chứng cứ. Ô không có bằng chứng ghi “chưa xác định”, không tự suy thành “không hỗ trợ”. Khoảng thiếu trong thư viện không phải tính mới toàn cầu của PetCare.

### 1.6. Cơ sở lý thuyết

Phân tích hệ thống/hướng đối tượng [1], [2], kỹ nghệ [14], quan hệ [11] sau khi đọc nội dung thích hợp; REST [18], RBAC [34], giao dịch và khoảng thời gian [23]. Nêu rõ mô hình lớp khái niệm khác bảng SQL.

### 1.7. Công nghệ và kỹ thuật

React [24], Node.js và công cụ test [22], Express 4 [17], PostgreSQL 17 [23], JWT [25] và RFC 7519 đã xác minh ở UV09. Vite và bcrypt có mặt trong mã/package nhưng thư viện hiện chưa có hồ sơ chính thức tương ứng được chọn; cần bổ sung nguồn trước khi viết lý thuyết sâu. Dùng thuật ngữ **băm mật khẩu**, không gọi bcrypt là mã hóa có thể giải mã.

### 1.8. Tổng kết chương

Liên kết căn cứ với lựa chọn thiết kế; không lặp lại toàn bộ chức năng/kết quả của Chương 3.

## CHƯƠNG 2 PHƯƠNG PHÁP THỰC HIỆN

### 2.1. Khảo sát và phân tích yêu cầu

Nêu nguồn khảo sát là tài liệu và mã hiện có; chưa có biên bản khảo sát doanh nghiệp. Phân rã luồng trước/trong/sau phục vụ, ràng buộc và ngoại lệ. Bảng 2.1 dự kiến: yêu cầu–nguồn hình thành–tiêu chí chấp nhận.

### 2.2. Tác nhân và yêu cầu

Năm nhóm đăng nhập và khách vãng lai trên sơ đồ UC; ánh xạ `vai_tro`/`chuc_vu` sang năm nhóm. Trình bày quyền server hiện tại: Admin còn kế thừa quyền vận hành của middleware quản lý/lễ tân, chỉ chăm sóc mới thực hiện dịch vụ. Không mô tả mô hình Admin tách hoàn toàn như đã cài. Yêu cầu phi chức năng phải có tiêu chí kiểm chứng, không tự công bố uptime hoặc tốc độ.

### 2.3. Sơ đồ ca sử dụng

Chèn **Hình 2.1 — UC-01**. Phân tích tác nhân, association, include/extend và generalization nhìn thấy trên hình; rà lại ký pháp và phần ảnh còn dấu chọn trước khi xuất bản. Không bịa bảng đặc tả UC đã có nếu chưa tìm được.

### 2.4. Sơ đồ hoạt động

- 2.4.1. Đăng ký — **Hình 2.2, AD-01**: nhập, kiểm tra trùng, băm mật khẩu, lưu, trở về đăng nhập.
- 2.4.2. Đặt lịch — **Hình 2.3, AD-02**: online/tại quầy, chủ nuôi, thú cưng, dịch vụ, giờ, lịch chờ; ghi phần mở rộng cọc và transaction chưa có trên hình.
- 2.4.3. Điều phối — **Hình 2.4, AD-03**: phân công/giữ chờ/từ chối; chỉ rõ nhãn từ chối trên hình khác trạng thái `TuChoi` trong mã.
- 2.4.4. Thực hiện — **Hình 2.5, AD-04**: đủ/không đủ điều kiện, bắt đầu, chi tiết dịch vụ và kết thúc; không diễn giải hoãn thành hủy trong hệ thống hiện tại.
- 2.4.5. Hóa đơn — **Hình 2.6, AD-05**: snapshot, giảm giá, từng lần thu, công nợ; phân biệt bản in trình duyệt với hóa đơn điện tử thuế.
- 2.4.6. Khiếu nại — **Hình 2.7, AD-06**: tiếp nhận, quyết định, duyệt và chi; nêu rõ phần sơ đồ chưa tách thực chi như mã hiện tại.

Mỗi hình: mục đích → thành phần/swimlane → nhánh và điều kiện → ngoại lệ thể hiện → liên hệ yêu cầu → sai khác đã ghi nhận. Không tự sửa hình.

### 2.5. Sơ đồ tuần tự

- 2.5.1. Đăng nhập — **Hình 2.8, SD-01**: tài khoản, hash, trạng thái, phiên; bổ sung thuyết minh JWT/refresh/version theo mã, không giả có các message này trên hình.
- 2.5.2. Đặt lịch — **Hình 2.9, SD-02**: opt tại quầy, loop, lưu lịch/chi tiết; công thức đếm trên hình khác kiểm tra khả thi toàn khoảng hiện tại.
- 2.5.3. Điều phối — **Hình 2.10, SD-03**: ba nhánh loại trừ thực tế; chỉ ra opt từ chối có thể bị hiểu nối tiếp phần phân công trên bản thiết kế.
- 2.5.4. Chăm sóc — **Hình 2.11, SD-04**: các đối tượng, tiến độ và nhánh không đủ điều kiện; phần hủy phía sau alt cần phân tích giới hạn.
- 2.5.5. Hóa đơn — **Hình 2.12, SD-05**: tổng, giảm, ghi nhận và trả dư; hiện tại tiền đưa/số ghi nhận tách biệt, cọc được khấu trừ.
- 2.5.6. Khiếu nại — **Hình 2.13, SD-06**: nêu sai khác về thời điểm tạo giao dịch và trạng thái; giải thích API thực tế từ routes.

Tên `frm...`, `ctrl...`, message trên sơ đồ là mô hình thiết kế. Đối chiếu sang component/controller/service/SQL bằng bảng; không nhận chúng là tên phương thức JavaScript hoặc endpoint có thật.

### 2.6. Sơ đồ lớp

**Hình 2.14 — CD-01**: lớp người dùng, khách/nhân viên, thú cưng, dịch vụ, lịch, chi tiết, hóa đơn, thanh toán, ca, khiếu nại, đánh giá; thuộc tính/phương thức, kế thừa và multiplicity. Là mô hình miền, không phải khẳng định backend ES module hiện tạo các class đó. Nêu phần mở rộng cọc, phiên/reset và nhật ký chưa có trong hình.

### 2.7. Sơ đồ trạng thái

- **Hình 2.15 — SM-01, lịch hẹn:** đối chiếu thiếu `TuChoi` và chuyển `DangThucHien → DaHuy` không được API hủy hiện chấp nhận.
- **Hình 2.16 — SM-02, hóa đơn:** đối chiếu thiếu `HoanTienMotPhan`, điều kiện thực chi và các trạng thái phát sinh bởi cọc/giá trị 0.

Dự kiến Bảng 2.2: trạng thái gốc–trạng thái SQL–sự kiện–guard–chuyển không hợp lệ. Phân biệt trạng thái cọc độc lập với trạng thái lịch, không tự thêm vào hình cũ.

### 2.8. Sơ đồ màn hình và điều hướng

**Hình 2.17 — MH-TQ** và ba tài liệu wireframe MH-01…MH-11/MH-02b. Sơ đồ tổng quan hiện là cây phân nhóm, chưa thể hiện mọi hướng điều hướng. Đối chiếu `App.jsx`, HashRouter và kiểm tra quyền với bảng route; các số liệu trong wireframe là mẫu thiết kế. Nêu các route mới chưa có trên cây, giới hạn giao diện giữ chỗ và Admin mô phỏng.

### 2.9. Cơ sở dữ liệu PostgreSQL

Dựa SQL gốc và migrations 000–008, đối chiếu tài liệu cũ 000–005. Trình bày 21 bảng ứng dụng và bảng lịch sử migration theo nguồn DDL/snapshot đã kiểm tra trước; không gọi đây là truy vấn DB mới ngày 08/11. Bảng dự kiến: PK/FK, CHECK/UNIQUE/EXCLUDE, kiểu NUMERIC và thời gian, index, xóa mềm/snapshot. Giải thích transaction thu/hoàn/cọc và chống lặp; không tuyên bố 3NF khi chưa chứng minh phụ thuộc hàm.

### 2.10. Kiến trúc

React/Vite/HashRouter → HTTP API Express → service/pg → PostgreSQL. Phân biệt thư viện khai báo trong package và phiên bản runtime đã đo ở từng lần thử. Không thêm ORM hoặc microservices không có trong dự án.

### 2.11. API và giải pháp nghiệp vụ

Endpoint lấy từ `server.js` và routes. Trình bày kiểm tra toàn khoảng, tìm kiếm quay lui ưu tiên công việc ít lựa chọn, giới hạn số bước và lỗi 503; khóa giao dịch theo ngày, quyền sở hữu, trạng thái và rollback. Solver chỉ chứng minh khả thi, không lưu phân công tự động. Trình bày cọc 30% theo chính sách, snapshot, thu/hoàn, xác thực và phiên. Không công bố chứng nhận an toàn hoặc đối soát thanh toán tự động.

### 2.12. Tổng kết chương

Tóm các lựa chọn và khó khăn; dẫn tới kịch bản kiểm thử ở Chương 3. Các khác biệt thiết kế/triển khai được trình bày công khai, chưa sửa sơ đồ để che sai khác.

## CHƯƠNG 3 CÀI ĐẶT THỬ NGHIỆM KẾT QUẢ VÀ ĐÁNH GIÁ

1. **3.1. Môi trường:** cấu hình phát triển, DB cô lập, ngày và trạng thái mã; không công khai `.env`, mật khẩu hoặc DB dump.
2. **3.2. Cấu trúc mã nguồn:** `frontend/`, `backend/`, `migrations/`, tài liệu; giải thích trách nhiệm, không in toàn cây node_modules.
3. **3.3. Cài đặt CSDL:** migration/checksum, ràng buộc và dữ liệu demo; phân biệt việc đã chạy trong lịch sử với lượt khảo sát chỉ đọc.
4. **3.4. Khách hàng:** hồ sơ, đặt, xem/hủy, hóa đơn và phản hồi; khiếu nại khách có API/test, QA trình duyệt còn thiếu.
5. **3.5. Nhân viên chăm sóc:** lịch được giao, đủ điều kiện, từng dịch vụ và hoàn tất; ảnh thực tế có sẵn nhưng là phiên bản lịch sử.
6. **3.6. Lễ tân:** tại quầy, điều phối, thu và thực chi; nêu VietQR hướng dẫn chuyển tiền khác xác nhận thực nhận.
7. **3.7. Quản lý:** ca, danh mục, quyết định khiếu nại, báo cáo; thực thu khác lợi nhuận.
8. **3.8. Admin:** tài khoản, tạm đổi mật khẩu, khóa/đổi vai trò và guard; KPI/lọc mới chưa QA HTTP/UI riêng; nhật ký/config/backup chưa là chức năng server hoàn thành.
9. **3.9. Phương pháp test:** phân hoạch và biên [32], test HTTP/DB cô lập, đồng thời và rollback, quyền; Postman [35] chỉ khi có thực thi, hiện công cụ chính là node:test [22].
10. **3.10. Kết quả:** dùng [bảng kiểm thử](BANG_KIEM_THU_PETCARE.md), gắn biên bản/ngày/môi trường. Không cộng các lần chạy khác nhau thành một tổng test mới; SKIP không phải PASS.
11. **3.11. Đánh giá:** đối chiếu mục tiêu với bằng chứng; chưa có đánh giá thực địa định lượng, tải hoặc mức hài lòng của PetCare.
12. **3.12. Hạn chế:** quản trị mô phỏng, một số QA/ảnh mới thiếu, SMTP Mailtrap, webhook/merchant, xử lý cọc dư, tự giải phóng chỗ chưa cọc và Docker runtime.

Ảnh dự kiến Hình 3.x chưa chốt số. Xem [danh sách hình](DANH_SACH_HINH_ANH_CAN_BO_SUNG.md); không dùng sơ đồ màn hình, banner hoặc ảnh sinh làm chứng cứ cài đặt.

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

Đạt các chức năng cốt lõi trong phạm vi đã thử; nêu năng lực phân tích, thiết kế, giao dịch, quyền và test; không khẳng định triển khai sản xuất. Khó khăn thực tế: công suất toàn khoảng, race condition, duyệt khác chi, trạng thái thiết kế lệch mã, nhiều mốc thử. Hướng phát triển lấy từ hạn chế đã xác định.

## PHỤ LỤC nếu cần

Bảng yêu cầu/route, schema chi tiết, testcase, hướng dẫn chạy cô lập và bảng sai khác UML. Không đưa bí mật hoặc dump. Không để phụ lục thay cho phân tích đủ sáu loại sơ đồ trong Chương 2.

## DANH MỤC TÀI LIỆU THAM KHẢO

Chỉ giữ nguồn có trích dẫn thực tế, đủ xuất xứ; ưu tiên tiếng Việt phù hợp. Danh mục xét chọn và giới hạn đọc tại [hồ sơ tham khảo](DANH_MUC_TAI_LIEU_THAM_KHAO.md). Thứ tự cuối theo mẫu trường, một dãy số chung không đặt lại ở nhóm Anh. Chưa tích hợp Word hoặc kiểm tra citation fields ở Giai đoạn 0.
