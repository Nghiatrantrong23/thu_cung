# Bổ sung và sử dụng nguồn — Giai đoạn 2

Ngày kiểm tra: 09/11/2026. Phục vụ Tóm tắt, Mở đầu và Chương 1; áp dụng Academic Research Suite, tổng quan Narrative/Integrative và kiểm tra trích dẫn. Đây là hồ sơ nghiên cứu hỗ trợ, không chèn nguyên các ghi chú kiểm tra vào bản báo cáo nộp.

## 1. Phạm vi tìm bổ sung

Giai đoạn 0–1 đã có 35 hồ sơ. Đợt này chỉ xử lý các khoảng thiếu khi viết: chuẩn UML, nội dung CSDL tiếng Việt có thể đọc, tài liệu đúng nhánh Vite 5, khái niệm runtime Node.js, bcrypt và chuẩn JWT gốc. Tìm theo tên tài liệu/công nghệ trên trang chủ cơ quan phát hành, thư viện và trang giảng viên; không thực hiện một lượt tìm bao phủ mọi cơ sở dữ liệu, không gọi là Systematic Review.

Các cụm tìm/định vị gồm: `OMG UML 2.5.1 specification`, `Vite 5 getting started`, `Node.js introduction`, `node.bcrypt.js v5.1.1`, `Nguyễn Hải Châu cơ sở dữ liệu chuẩn hóa`, `RFC 7519`. Tiêu chí chọn là khớp phần cần viết, nguồn gốc chính thức, đủ metadata và đọc được phần liên quan. Nguồn tiếng Việt được ưu tiên cho lý thuyết CSDL; tài liệu gốc được dùng cho chuẩn và công nghệ.

Kết quả: **5 tài liệu mới [36]–[40]**, cộng **[41] được chuyển từ ứng viên UV09 đã xác minh**; không nhận [41] là phát hiện mới. Kho nguồn làm việc tăng thành **41 hồ sơ: 21 Việt/20 Anh (51,2% Việt)**; **10 hồ sơ có DOI có căn cứ**, gồm 9 cũ và RFC 7519. Bản lưu nghiên cứu trước đó có 35 hồ sơ được giữ nguyên như lịch sử. Kho nguồn không phải danh mục 41 tài liệu bắt buộc đưa vào bản nộp.

## 2. Hồ sơ nguồn được bổ sung

### [36] OMG — Unified Modeling Language 2.5.1

- **Phân loại:** Đã xác minh.
- **Tác giả/tổ chức:** Object Management Group (OMG).
- **Tên:** *OMG Unified Modeling Language (OMG UML), Version 2.5.1*.
- **Năm/đơn vị:** tháng 12/2017, OMG; mã tài liệu `formal/2017-12-05`.
- **DOI:** không xác định được DOI trong nguồn; không tự gán.
- **Truy cập:** [trang phiên bản](https://www.omg.org/spec/UML/2.5.1), [PDF đặc tả](https://www.omg.org/spec/UML/2.5.1/PDF).
- **Ngôn ngữ/độ tin cậy:** Anh; đặc tả do tổ chức ban hành, tin cậy cao để giải thích ký pháp.
- **Phần đã đọc:** trang bìa và các phần chọn lọc 11.4 Classes, 14.1–14.2 StateMachines, 15.1–15.2 Activities, 17.1 Interactions, 18.1 Use Cases. Tương ứng trang PDF 236, 347, 415, 607, 681; số trang in lần lượt 194, 305, 373, 565, 639. Không nhận đã đọc toàn bộ 796 trang.
- **Nội dung/lý do phù hợp:** phân biệt mô hình cấu trúc, hành vi và tương tác, làm nền cho bộ sơ đồ của PetCare.
- **Vị trí:** 1.6.2; Chương 2 khi thuyết minh sơ đồ.
- **Giới hạn:** không chứng nhận sơ đồ gốc của PetCare đúng chuẩn; sơ đồ màn hình không được tính là một loại UML chuẩn.

### [37] Vite — Getting Started, nhánh Vite 5

- **Phân loại:** Đã xác minh.
- **Tác giả/tổ chức:** Vite contributors; tài liệu chính thức dự án Vite.
- **Tên/năm:** “Getting Started,” *Vite 5 Documentation*, không ghi năm riêng trên bài. Không lấy năm copyright làm năm xuất bản.
- **DOI:** không thấy trong tài liệu.
- **URL:** [tài liệu nhánh 5](https://v5.vite.dev/guide/).
- **Ngôn ngữ/độ tin cậy:** Anh; tài liệu chính thức, cao đối với chức năng công cụ.
- **Phần đã đọc:** Overview và nội dung giới thiệu dev server/build; phù hợp Vite `^5.4.0` của dự án.
- **Nội dung/lý do phù hợp:** phân biệt công cụ chạy phát triển, cập nhật nóng và đóng gói frontend với logic nghiệp vụ.
- **Vị trí:** 1.7.2, Bảng 1.5; Chương 3 về môi trường/build.
- **Giới hạn:** không dùng mô tả tốc độ của công cụ làm phép đo tốc độ PetCare; không suy tính năng nhánh mới hơn cho Vite 5.

### [38] Node.js — Introduction to Node.js

- **Phân loại:** Đã xác minh.
- **Tác giả/tổ chức:** Node.js contributors; Node.js Learn.
- **Tên/năm:** “Introduction to Node.js,” không ghi năm riêng trên trang.
- **DOI:** không thấy trong tài liệu.
- **URL:** [bài giới thiệu chính thức](https://nodejs.org/learn/getting-started/introduction-to-nodejs).
- **Ngôn ngữ/độ tin cậy:** Anh; tài liệu chính thức, cao đối với đặc điểm runtime.
- **Phần đã đọc:** giới thiệu runtime JavaScript/V8 và I/O bất đồng bộ.
- **Nội dung/lý do phù hợp:** bổ sung cơ sở cho lựa chọn backend; nguồn [22] trước đó chỉ là tài liệu test runner, không thay thế nội dung này.
- **Vị trí:** 1.7.3, Bảng 1.5; Chương 2 về kiến trúc và Chương 3 về môi trường.
- **Giới hạn:** không chứng minh mức tải, phiên bản runtime thực chạy hoặc tính đúng đồng thời của PetCare.

### [39] Kelektiv — node.bcrypt.js README, v5.1.1

- **Phân loại:** Đã xác minh.
- **Tác giả/tổ chức:** Kelektiv, dự án `node.bcrypt.js`.
- **Tên/năm:** “node.bcrypt.js — README,” tag `v5.1.1`, không ghi năm cho nội dung README; chưa dùng ngày tag làm năm xuất bản.
- **DOI:** không thấy trong tài liệu.
- **URL:** [repository chính thức tại tag v5.1.1](https://github.com/kelektiv/node.bcrypt.js/tree/v5.1.1).
- **Ngôn ngữ/độ tin cậy:** Anh; tài liệu do dự án thư viện duy trì, cao để mô tả API/giới hạn phiên bản.
- **Phần đã đọc:** Security Issues and Concerns, Usage, API và khuyến nghị API bất đồng bộ.
- **Nội dung/lý do phù hợp:** hash/compare và giới hạn 72 **byte** đầu vào; đúng nhánh thư viện dự án khai báo.
- **Vị trí:** 1.7.8, Bảng 1.5; các phần xác thực/bảo mật ở Chương 2–3.
- **Giới hạn:** không coi dùng bcrypt là chứng nhận bảo mật tổng thể hoặc phép đo chi phí băm của PetCare.

### [40] Nguyễn Hải Châu — Slide môn học Cơ sở dữ liệu

- **Phân loại:** Đã xác minh.
- **Tác giả:** Nguyễn Hải Châu; tên được xác nhận ở trang giảng viên và đầu các slide.
- **Tên:** *Slide môn học Cơ sở dữ liệu (Introduction to database systems)*.
- **Năm/đơn vị:** không xác định năm xuất bản chung cho bộ slide; Khoa Công nghệ thông tin, Trường Đại học Công nghệ, Đại học Quốc gia Hà Nội. Mục lục ghi cập nhật 05/08/2025; không gán ngày này cho năm xuất bản tất cả PDF.
- **DOI:** không thấy DOI của bộ bài giảng. DOI bài của Chen trong tài liệu tham khảo không phải DOI của bài giảng.
- **URL:** [trang tác giả](https://uet.vnu.edu.vn/~chaunh/), [mục lục môn học](https://uet.vnu.edu.vn/~chaunh/slide/index.htm).
- **Phần đã đọc:** [02-database.pdf](https://uet.vnu.edu.vn/~chaunh/slide/02-database.pdf), 5 trang; [07-relation1.pdf](https://uet.vnu.edu.vn/~chaunh/slide/07-relation1.pdf), phần đầu về quan hệ; [08-designguide.pdf](https://uet.vnu.edu.vn/~chaunh/slide/08-designguide.pdf), phần ý nghĩa/dư thừa/bất thường; [08-normalize.pdf](https://uet.vnu.edu.vn/~chaunh/slide/08-normalize.pdf), phần giới thiệu, 1NF và định nghĩa tổng quát 2NF/3NF cuối bài. Không nhận đã đọc hết mọi bài trong khóa học.
- **Ngôn ngữ/độ tin cậy:** Việt; tài liệu giảng dạy trên website giảng viên của trường đại học, tin cậy cao cho lý thuyết nhập môn; không gọi là bài tạp chí bình duyệt hoặc sách có NXB.
- **Nội dung/lý do phù hợp:** mô hình quan hệ, dư thừa, phụ thuộc hàm và chuẩn hóa; cung cấp nội dung tiếng Việt thực sự đọc được cho thiết kế CSDL.
- **Vị trí:** 1.6.3, các mục CSDL Chương 2.
- **Giới hạn:** chỉ tính cả bộ như một tài liệu; cần chứng minh phụ thuộc cụ thể nếu kết luận lược đồ PetCare đạt chuẩn.

### [41] Jones, Bradley và Sakimura — RFC 7519

- **Phân loại:** Đã xác minh; chuyển từ ứng viên UV09, không phải nguồn mới phát hiện.
- **Tác giả:** M. Jones, J. Bradley và N. Sakimura.
- **Tên/năm/đơn vị:** *JSON Web Token (JWT)*, RFC 7519, tháng 5/2015, IETF/RFC Editor.
- **DOI:** **10.17487/RFC7519**.
- **URL:** [hồ sơ RFC](https://www.rfc-editor.org/info/rfc7519/), [nội dung RFC](https://www.rfc-editor.org/rfc/rfc7519.html).
- **Ngôn ngữ/độ tin cậy:** Anh; tài liệu tiêu chuẩn gốc, cao cho định nghĩa JWT.
- **Phần đã đọc/đối chiếu:** tác giả, tháng/năm, DOI, abstract và mô tả biểu diễn claims; dùng cùng khuyến nghị an toàn [25].
- **Nội dung/lý do phù hợp:** làm rõ JWT, JWS/JWE và phân biệt ký với mã hóa khi giải thích xác thực.
- **Vị trí:** 1.7.7, Bảng 1.5; Chương 2–3 về xác thực.
- **Giới hạn:** không suy các lựa chọn quản lý phiên của PetCare là mặc định của RFC.

## 3. Nguồn cũ được mở rộng phạm vi đọc

Nguồn [23] là cả bộ *PostgreSQL 17 Documentation*. Bổ sung đọc [mục 5.5 — Constraints](https://www.postgresql.org/docs/17/ddl-constraints.html), phần khóa chính/khóa ngoại; giữ cùng số [23], không tính một nguồn mới. Các phần concurrency/range đã đọc trước tiếp tục được dùng trong giới hạn đã ghi.

Nguồn [13], [16] và [41] được mở lại để kiểm tra luận điểm cụ thể. Không tự đổi ngày truy cập của toàn bộ 35 bản ghi cũ sang ngày đợt này.

## 4. Kết quả không đủ điều kiện nâng mức sử dụng

- Bản scan sách Nguyễn Văn Ba tại thư viện KGC nhận diện được nguồn nhưng chưa đọc được nội dung qua phiên truy cập này; không nâng [1] từ catalog/mô tả thành đã đọc sách.
- Các liên kết bài giảng hướng đối tượng/nguồn PTIT chưa truy cập đủ nội dung không được bổ sung để làm tăng tỷ lệ Việt.
- D&C và Paws Pet House tiếp tục ngoài nguồn chính thức do chưa có bản gốc đủ xuất xứ.
- Không có khảo sát thị trường định lượng mới; không thêm CAGR hoặc doanh thu Việt Nam từ nguồn quảng bá thiếu phương pháp.

## 5. Điều kiện sử dụng và lưu dấu kiểm tra

Nguồn được đánh giá trên ba mặt: xuất xứ, mức liên quan và phạm vi đọc. “Đã xác minh” ở đây nghĩa metadata và phần sử dụng có căn cứ; không tương đương rà toàn diện mọi phiên bản, errata hoặc cơ sở dữ liệu rút bài. Không tạo DOI cho các tài liệu không có DOI.

Bản nháp G2 sử dụng một tập con của kho 41 hồ sơ. Tập này được thống kê theo trích dẫn thật trong [báo cáo kiểm tra G2](KIEM_TRA_TRICH_DAN_GIAI_DOAN_2.md). Tỷ lệ tiếng Việt chưa đạt mục tiêu 60–70%; không bổ sung nguồn chưa đọc chỉ để thay đổi tỷ lệ. Số tham chiếu hiện tại là số làm việc nhất quán; việc sắp xếp theo hướng dẫn trường và thay số đồng bộ thực hiện khi chốt danh mục toàn báo cáo.
