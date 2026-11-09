# Đề cương chi tiết báo cáo cuối kỳ PetCare

Phiên bản Giai đoạn 1 — ngày 08/11/2026. Người dùng đã chấp nhận khảo sát Giai đoạn 0 và cho phép hoàn thiện đề cương. Đây là kế hoạch viết có mục/tiểu mục, vị trí hình/bảng và nguồn; **chưa phải nội dung báo cáo đã viết, chưa xuất Word/PDF**. Giai đoạn 1 được kiểm tra trước khi dừng chờ người dùng duyệt bước tiếp theo.

Tên đề tài: **XÂY DỰNG HỆ THỐNG QUẢN LÝ VÀ ĐẶT LỊCH DỊCH VỤ CHĂM SÓC THÚ CƯNG**.

## Quy ước và phạm vi đề cương

- Báo cáo bắt đầu từ TÓM TẮT ĐỒ ÁN; không có bìa/bìa trong, cảm ơn, cam đoan, nhận xét hoặc lịch làm việc. Giữ đúng ba chương; phụ lục nếu có đứng trước tài liệu tham khảo.
- Mở đầu bắt đầu số trang 1; phần trước không hiện số. A4, Times New Roman 13, tiêu đề chính 16, giãn 1,5, lề trên/dưới 2 cm, trái 3 cm, phải 2 cm theo quy định chữ và yêu cầu đã chốt. Chưa đo số trang hoặc áp định dạng Word trong giai đoạn này.
- Các tên mục/tiểu mục dưới đây là cấu trúc báo cáo; dòng mục đích, căn cứ và điều kiện là hướng dẫn biên soạn, không chép nguyên thành văn bản báo cáo.
- Số nguồn [1]–[35] là mã tham chiếu làm việc từ thư viện đã xác minh, chưa phải số cuối theo ABC mẫu trường. Chỉ giữ nguồn thực sự sử dụng; khi chốt đổi số đồng bộ. Nguồn catalog phải đọc phần cần dẫn trước khi viết luận điểm chi tiết.
- Hình 2.1–2.17 giữ cho 17 PNG gốc, không vẽ/sửa. Hình 2.18–2.19 và Hình 3.1–3.17 chỉ là vị trí dự kiến, có trạng thái bằng chứng riêng. Số hình/bảng là số thứ tự theo chương, không phải số trang.
- Mỗi mục đi từ mục đích đến phân tích, căn cứ và liên hệ; mỗi sơ đồ: giới thiệu → chèn hình thực → thành phần/luồng/ngoại lệ có trên hình → yêu cầu liên quan → sai khác mã nếu có. Không sáng tạo message, endpoint hoặc kết quả kiểm thử.
- [Bảng bố trí hình, bảng và nguồn](BANG_BO_TRI_HINH_BANG_VA_NGUON.md) là danh sách vị trí thống nhất; [kiểm kê sơ đồ](DANH_MUC_SO_DO_UML.md), [đối chiếu mã](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md), [ảnh cần bổ sung](DANH_SACH_HINH_ANH_CAN_BO_SUNG.md) và [test](BANG_KIEM_THU_PETCARE.md) là hồ sơ bằng chứng.

## Phân bổ dung lượng và mạch trình bày

Tỷ trọng biên soạn đề xuất cho phần văn bản chính: Mở đầu 8%, Chương 1 22%, Chương 2 40%, Chương 3 25%, Kết luận 5%; không tính danh mục, hình/bảng, tham khảo và phụ lục. Đây là định hướng, không ép số trang hoặc kéo dài cho đủ tỷ lệ. Tóm tắt tối đa một trang A4. Mạch lập luận: bối cảnh và căn cứ → yêu cầu và thiết kế → cài đặt/bằng chứng → mức đáp ứng và giới hạn. Chương 1 không kể chi tiết thao tác UI; Chương 2 không lặp toàn kết quả chạy; Chương 3 không giải thích lại toàn lý thuyết.

## TÓM TẮT ĐỒ ÁN

Không đánh số trang; tối đa một trang A4. Cấu phần dự kiến: (1) bối cảnh và bài toán; (2) mục tiêu/phạm vi năm nhóm; (3) phương pháp, kiến trúc và công nghệ; (4) thuật toán kiểm khả thi lịch, giao dịch và quyền; (5) kết quả cốt lõi có bằng chứng; (6) hạn chế/hướng phát triển. Không có hình/bảng; không đưa số hiệu năng/hài lòng chưa đo. Bản đã soạn trong chat là đầu vào để biên tập ở Giai đoạn 2, chưa tự coi là bản nộp.

## MỤC LỤC

Dùng Heading Styles và trường tự động khi xuất Word; bao gồm các mục/tiểu mục được chốt, không nhập trang giả ở Giai đoạn 1.

## DANH MỤC SƠ ĐỒ HÌNH

Tạo theo caption khi xuất Word; nhóm sơ đồ thiết kế và ảnh giao diện dưới số Hình theo chương, giữ nguồn và trạng thái. Có 36 vị trí dự kiến trong catalog, trong đó chỉ 17 sơ đồ gốc đã có kiểm tra G0; không nhận đã có đủ 36 hình.

## DANH MỤC BẢNG

Có 24 bảng dự kiến theo catalog; chưa điền dữ liệu/kết quả mới. Tạo trường caption khi xuất Word.

## DANH MỤC TỪ VIẾT TẮT nếu sử dụng

UML, UC, AD, SD, CD, API, REST, JWT, RBAC, SQL, HTTP, UI; thêm từ chỉ khi xuất hiện thật. Viết đầy đủ/giải thích lần đầu, thống nhất tên chức vụ, trạng thái và thuật ngữ băm mật khẩu.

## MỞ ĐẦU

### 1. Lý do chọn đề tài

Phân tích khó khăn về thông tin, lịch/ca/thời lượng và giao dịch; có thể dùng [31], [13], [16] cho bối cảnh phù hợp. Chưa có phỏng vấn/khảo sát cơ sở mới nên không trình bày nhận định nhóm như số liệu khảo sát.

### 2. Mục tiêu đề tài

2.1. Mục tiêu tổng quát: quản lý tập trung và đặt lịch dịch vụ. 2.2. Mục tiêu cụ thể: hồ sơ/danh mục, khả dụng/điều phối, chăm sóc/ca, giao dịch/phản hồi và quyền. Mỗi mục tiêu sẽ có tiêu chí đối chiếu Bảng 3.7; chưa kết luận mọi mục tiêu hoàn tất.

### 3. Đối tượng nghiên cứu

Quy trình cung cấp dịch vụ chó mèo, nhóm người dùng, dữ liệu, mô hình và các cơ chế phần mềm; không xây hệ thống chẩn đoán hoặc tư vấn điều trị.

### 4. Phạm vi thực hiện

Ứng dụng Web và năm nhóm đăng nhập trong môi trường local/test; phân biệt thiết kế gốc, code workspace, phiên bản kiểm thử và định hướng. Giới hạn merchant/webhook, SMTP thực tế, Admin mô phỏng và QA còn thiếu được công bố.

### 5. Phương pháp thực hiện

Narrative/Integrative Literature Review, phân tích tài liệu/mã, mô hình hóa, thiết kế dữ liệu/API, triển khai và kiểm thử có biên bản. Trình bày phương pháp trong bối cảnh dự án, không gọi là Systematic Review hoặc nghiên cứu hiệu quả thực địa.

### 6. Bố cục báo cáo

Giới thiệu đúng ba chương và mối liên hệ, sau đó kết luận/hướng phát triển, phụ lục nếu cần và tài liệu tham khảo. Không bố trí hình/bảng riêng trong Mở đầu.


## CHƯƠNG 1 TỔNG QUAN TÀI LIỆU


### 1.1. Tổng quan lĩnh vực chăm sóc thú cưng

**Mục đích:** Xác định bối cảnh, đối tượng và ranh giới chuyên môn của đề tài.


#### 1.1.1. Khái niệm và phạm vi dịch vụ chăm sóc chó mèo

Phạm vi viết: Phân biệt chăm sóc thường ngày, grooming/spa và khám chữa bệnh; giới hạn PetCare ở quản lý dịch vụ.


#### 1.1.2. Bối cảnh Việt Nam và yêu cầu về nhân lực

Phạm vi viết: Dùng tin hội thảo để mô tả bối cảnh nghề; không suy thành số liệu doanh thu, CAGR hoặc khảo sát thị trường.


#### 1.1.3. Yêu cầu an toàn và giới hạn thông tin sức khỏe

Phạm vi viết: Nêu vai trò thông tin do chủ nuôi cung cấp và người chuyên môn; không mô tả hệ thống tự chẩn đoán.


**Nguồn và vị trí dẫn:** [31], [13], [16]; [5], [12] chỉ sau khi đọc phần sách phù hợp.

**Bằng chứng/điều kiện viết:** Hồ sơ tham khảo và phạm vi nghiệp vụ; chưa có khảo sát thị trường/thực địa của nhóm. Không dùng catalog làm chứng cứ kỹ thuật.


### 1.2. Đặc điểm và quy trình cung cấp dịch vụ chăm sóc thú cưng

**Mục đích:** Liên kết nghiệp vụ chăm sóc với dữ liệu và trách nhiệm quản lý.


#### 1.2.1. Nhóm dịch vụ và đặc điểm phục vụ

Phạm vi viết: Tắm sấy, vệ sinh, cắt tỉa và các dịch vụ thực sự có trong danh mục; thời lượng/giá theo dữ liệu dự án.


#### 1.2.2. Tiếp nhận thú cưng và chuẩn bị phục vụ

Phạm vi viết: Thông tin chủ nuôi, hồ sơ, ghi chú sức khỏe/tính khí, kiểm tra điều kiện; không tự đặt ngưỡng y khoa.


#### 1.2.3. Quy trình từ yêu cầu đến bàn giao và phản hồi

Phạm vi viết: Mô tả khung tiếp nhận–đặt/duyệt–phân công–thực hiện–thanh toán–phản hồi do nhóm phân tích.


- **Bảng 1.1. Đặc điểm nghiệp vụ và nhu cầu thông tin** — dữ liệu cần trình bày: Bước, đối tượng, dữ liệu cần quản lý, trách nhiệm, giới hạn.


**Nguồn và vị trí dẫn:** [13], [16]; đối chiếu [29], [30].

**Bằng chứng/điều kiện viết:** Chương trình nghề/hướng dẫn chuyên môn và luồng dự án; chưa nhận là SOP được cơ sở thực địa phê duyệt.


### 1.3. Các vấn đề trong quản lý và đặt lịch dịch vụ

**Mục đích:** Làm rõ bài toán phần mềm cần giải quyết trước khi so sánh giải pháp.


#### 1.3.1. Thời lượng dịch vụ và giao thoa khung giờ

Phạm vi viết: Phân biệt thời điểm bắt đầu với khoảng chiếm dụng; nhiều dịch vụ trong một lịch.


#### 1.3.2. Ca làm việc, lịch chờ và năng lực phục vụ

Phạm vi viết: Ca bao trọn, người đã gán, lịch chưa phân người và tranh chỗ; khả thi khác tối ưu.


#### 1.3.3. Nhất quán hồ sơ, giá và giao dịch

Phạm vi viết: Giá lịch sử, cọc, hủy/đổi, thu và hoàn; trình bày nhu cầu kiểm soát trạng thái/quyền.


**Nguồn và vị trí dẫn:** [23], [29], [30], [33]; lý do nghiệp vụ do nhóm phân tích.

**Bằng chứng/điều kiện viết:** Tài liệu tổng hợp, yêu cầu và mã đã khảo sát; không khẳng định đã đo mức giảm thời gian chờ.


### 1.4. Các công trình nghiên cứu và hệ thống liên quan

**Mục đích:** Tổng hợp có phân loại nguồn và phạm vi bằng chứng.


#### 1.4.1. Phương pháp tổng quan và tiêu chí lựa chọn

Phạm vi viết: Narrative/Integrative; từ khóa Việt/Anh, miền nguồn, điều kiện xác minh và phạm vi đọc; không PRISMA/Systematic Review.


#### 1.4.2. Công trình tiếng Việt liên quan

Phạm vi viết: [26] trực tiếp đặt lịch thú cưng; nhận diện [4], [27], [28] khi cần, nhưng chưa suy chức năng/kết quả từ metadata.


#### 1.4.3. Công trình hệ thống đã tiếp cận nội dung

Phạm vi viết: [6], [29], [30], [33]: bài toán, chức năng được mô tả, cách đánh giá và giới hạn; phân biệt hai bản VOAS.


- **Bảng 1.2. Tổng hợp công trình nghiên cứu liên quan** — dữ liệu cần trình bày: Tác giả/năm, miền bài toán, chức năng có bằng chứng, cách đánh giá, hạn chế.


#### 1.4.4. Nền tảng thương mại tương tự

Phạm vi viết: MoeGo [21], DaySmart Pet [20], Gingr [19]; tài liệu hãng chỉ chứng minh mô tả tính năng, chưa phải benchmark.


- **Bảng 1.3. Khảo sát nền tảng thương mại** — dữ liệu cần trình bày: Sản phẩm, tính năng được hãng mô tả, ngày/phạm vi tiếp cận, giới hạn.


**Nguồn và vị trí dẫn:** [6], [26], [29], [30], [33], [19], [20], [21]; [4], [27], [28] có điều kiện.

**Bằng chứng/điều kiện viết:** Năm file nghiên cứu và thư viện 35 hồ sơ. D&C/Paws Pet House chưa đủ xuất xứ, không làm nguồn chính thức.


### 1.5. Phân tích và so sánh các giải pháp

**Mục đích:** Rút ra yêu cầu áp dụng cho PetCare từ đối chiếu có giới hạn.


#### 1.5.1. Tiêu chí so sánh

Phạm vi viết: Hồ sơ, đặt/duyệt, phân công, tiến độ, giao dịch, vai trò và mức bằng chứng.


#### 1.5.2. Đối chiếu công trình và sản phẩm

Phạm vi viết: Ô chưa có căn cứ ghi chưa xác định; không suy không hỗ trợ từ việc tài liệu không nhắc.


- **Bảng 1.4. So sánh giải pháp theo tiêu chí PetCare** — dữ liệu cần trình bày: Tiêu chí, bằng chứng nguồn, tương đồng/khác biệt, điều chưa xác định.


#### 1.5.3. Định hướng giải pháp PetCare

Phạm vi viết: Giải thích lựa chọn theo phạm vi/nguồn lực dự án; không tuyên bố tính mới toàn cầu hoặc ưu việt khi chưa đo.


**Nguồn và vị trí dẫn:** [6], [19], [20], [21], [29], [30], [33].

**Bằng chứng/điều kiện viết:** Bảng tổng hợp nguồn và yêu cầu; kết luận so sánh là phân tích của nhóm.


### 1.6. Cơ sở lý thuyết và phương pháp thiết kế

**Mục đích:** Đặt nền tảng cho mô hình hóa và kiểm chứng ở chương sau.


#### 1.6.1. Hệ thống thông tin và phân tích yêu cầu

Phạm vi viết: Khái niệm, vai trò yêu cầu chức năng/phi chức năng, truy vết yêu cầu.


#### 1.6.2. Phân tích hướng đối tượng và UML

Phạm vi viết: Mục đích sáu loại biểu diễn; phân biệt mô hình miền, hành vi, tương tác và màn hình.


#### 1.6.3. Mô hình dữ liệu quan hệ và toàn vẹn

Phạm vi viết: PK/FK, phụ thuộc/ràng buộc; chỉ nêu chuẩn hóa khi có nội dung sách được đọc và lập luận phù hợp.


#### 1.6.4. Kiến trúc Web, REST và kiểm soát truy cập

Phạm vi viết: Client–server, ràng buộc REST, người dùng–vai trò–quyền và quyền sở hữu.


#### 1.6.5. Nguyên tắc thiết kế kiểm thử

Phạm vi viết: Phân hoạch tương đương, giá trị biên và kiểm thử trạng thái; tách lý thuyết khỏi kết quả chạy.


**Nguồn và vị trí dẫn:** [1], [2], [11], [14] cần đọc nội dung; [18], [23], [32], [34] đã đọc phần liên quan.

**Bằng chứng/điều kiện viết:** Không dùng catalog thay trang/chương được dẫn; chưa có hồ sơ chuẩn UML chính thức được chọn.


### 1.7. Công nghệ và kỹ thuật ứng dụng

**Mục đích:** Giải thích đúng công nghệ dự án sử dụng và lý do lựa chọn.


#### 1.7.1. React

Phạm vi viết: Component, state và sự kiện; dùng tài liệu React 18 [24].


#### 1.7.2. Vite

Phạm vi viết: Vai trò môi trường phát triển/đóng gói theo package; cần hồ sơ tài liệu chính thức trước lý thuyết sâu.


#### 1.7.3. Node.js

Phạm vi viết: Vai trò runtime backend; [22] chỉ hỗ trợ node:test, không dùng thay nguồn toàn bộ kiến trúc runtime.


#### 1.7.4. Express

Phạm vi viết: Route, middleware, validation/lỗi và phân tách xử lý theo bản 4.x [17].


#### 1.7.5. PostgreSQL

Phạm vi viết: Mô hình quan hệ, NUMERIC, giao dịch, khóa và ràng buộc khoảng giờ [23].


#### 1.7.6. HTTP API theo định hướng REST

Phạm vi viết: Luồng trao đổi và tài nguyên; không coi JSON là bằng chứng tuân thủ đầy đủ REST [18].


#### 1.7.7. JWT và quản lý phiên

Phạm vi viết: Purpose, hạn dùng, refresh/version và kiểm tra quyền hiện hành; [25], RFC 7519 UV09 khi được chọn.


#### 1.7.8. Băm mật khẩu bằng bcrypt

Phạm vi viết: Phân biệt băm với mã hóa có thể giải mã; có thư viện trong mã, cần hồ sơ nguồn chính thức phù hợp.


- **Bảng 1.5. Công nghệ lựa chọn và căn cứ sử dụng** — dữ liệu cần trình bày: Thành phần, vai trò, lý do, phiên bản khai báo, nguồn/giới hạn.


**Nguồn và vị trí dẫn:** [17], [18], [22], [23], [24], [25]; UV09 đã xác minh ngoài dãy. Vite/bcrypt/runtime Node tổng quát còn cần bổ sung.

**Bằng chứng/điều kiện viết:** package.json, middleware và controller đã khảo sát; không đồng nhất version khai báo với runtime đo được.


### 1.8. Tổng kết chương

**Mục đích:** Kết nối bối cảnh, giải pháp liên quan và căn cứ với phương pháp thực hiện.


**Nguồn và vị trí dẫn:** Tổng hợp các nguồn đã dùng trong Chương 1, không bổ sung nguồn chỉ để đủ số.

**Bằng chứng/điều kiện viết:** Nêu yêu cầu được chọn và khoảng thiếu bằng chứng; không lặp kết quả Chương 3.


Chốt nội dung chương và chuyển sang chương kế tiếp; không tạo thêm kết quả hoặc luận điểm mới.


## CHƯƠNG 2 PHƯƠNG PHÁP THỰC HIỆN


### 2.1. Khảo sát và phân tích yêu cầu hệ thống

**Mục đích:** Xác định đầu vào, quy trình và phạm vi được nhóm sử dụng.


#### 2.1.1. Nguồn khảo sát và phạm vi hệ thống

Phạm vi viết: Tài liệu/mã/sơ đồ hiện có; ghi chưa có biên bản doanh nghiệp hoặc phỏng vấn mới.


#### 2.1.2. Phân tích quy trình và dữ liệu nghiệp vụ

Phạm vi viết: Chủ nuôi, thú cưng, dịch vụ, lịch, ca, tiến độ, cọc và giao dịch.


#### 2.1.3. Ràng buộc, ngoại lệ và tiêu chí chấp nhận

Phạm vi viết: Toàn thời lượng, quyền, trạng thái, rollback và trường hợp chưa hỗ trợ.


**Nguồn và vị trí dẫn:** [13], [16] làm căn cứ nghiệp vụ; [1], [14] chỉ sau đọc phần cần dẫn.

**Bằng chứng/điều kiện viết:** Kế hoạch, hồ sơ G0 và mã; yêu cầu dự án không phải kết quả thực nghiệm từ nguồn ngoài.


### 2.2. Tác nhân và yêu cầu chức năng, phi chức năng

**Mục đích:** Làm rõ năm nhóm đăng nhập và quyền thực tế.


#### 2.2.1. Tác nhân và ánh xạ vai trò

Phạm vi viết: Khách vãng lai trên UC là tác nhân công khai; ba giá trị vai_tro và chức vụ nhân viên hình thành năm nhóm đăng nhập.


- **Bảng 2.1. Tác nhân và ánh xạ nhóm quyền** — dữ liệu cần trình bày: Tác nhân, vai_tro, chuc_vu, phạm vi; khách vãng lai tách nhóm đăng nhập.


#### 2.2.2. Yêu cầu chức năng theo nhóm nghiệp vụ

Phạm vi viết: Hồ sơ, danh mục, đặt/điều phối, ca/chăm sóc, cọc/thu/hoàn, đánh giá, thông báo và tài khoản.


- **Bảng 2.2. Yêu cầu chức năng** — dữ liệu cần trình bày: Mã yêu cầu, tác nhân, đầu vào/đầu ra, module dự kiến, điều kiện chấp nhận.


#### 2.2.3. Yêu cầu phi chức năng và cách kiểm chứng

Phạm vi viết: Tính đúng, toàn vẹn, truy cập, khả dụng giao diện; mục tiêu tải/uptime chưa đo không được ghi đạt.


- **Bảng 2.3. Yêu cầu phi chức năng và cách kiểm chứng** — dữ liệu cần trình bày: Yêu cầu, tiêu chí, phương pháp/bằng chứng cần có, trạng thái chưa đo.


#### 2.2.4. Ma trận quyền năm nhóm

Phạm vi viết: Theo middleware hiện tại Admin còn quyền vận hành manager/reception, chỉ care thực hiện dịch vụ; tách định hướng với triển khai.


- **Bảng 2.4. Ma trận quyền năm nhóm người dùng** — dữ liệu cần trình bày: Nghiệp vụ/tài nguyên × năm nhóm, sở hữu, guard, giới hạn.


**Nguồn và vị trí dẫn:** [34] cho RBAC; [16] khi hình thành yêu cầu an toàn.

**Bằng chứng/điều kiện viết:** auth.middleware.js, App.jsx, routes; bảng quyền là mô tả mã hiện có, không sửa RBAC.


### 2.3. Thiết kế sơ đồ ca sử dụng

**Mục đích:** Phân tích UC-01 hiện có theo tác nhân và quan hệ nhìn thấy.


#### 2.3.1. Sơ đồ ca sử dụng tổng thể

Phạm vi viết: Chèn UC-01; giải thích boundary, association, include/extend/generalization; ghi vấn đề ký pháp/ảnh cần rà.


- **Hình 2.1. Tác nhân và chức năng tổng thể** — Có PNG gốc, đã xem ở G0; giữ nguyên. Có năm nhóm đăng nhập và khách vãng lai; cần rà ký pháp, quyền Admin và dấu chọn còn trên ảnh.


#### 2.3.2. Nhóm khách vãng lai và khách hàng

Phạm vi viết: Đăng ký/đăng nhập, tra dịch vụ, hồ sơ, lịch và phản hồi trong phạm vi hình.


#### 2.3.3. Nhóm nhân viên chăm sóc

Phạm vi viết: Lịch được giao, tiếp nhận và cập nhật chăm sóc.


#### 2.3.4. Nhóm lễ tân và quản lý

Phạm vi viết: Tiếp nhận, điều phối, giao dịch, xử lý và báo cáo; chỉ ra khác biệt quyền.


#### 2.3.5. Nhóm Admin

Phạm vi viết: Quản trị tài khoản và quyền; không tự xem trang mô phỏng là use case đã triển khai đầy đủ.


#### 2.3.6. Khung đặc tả use case tiêu biểu

Phạm vi viết: Dự kiến bảng điều kiện trước/sau, luồng chính/thay thế cho đặt lịch; là bảng cần biên soạn từ chứng cứ, chưa nhận đã có bản gốc.


- **Bảng 2.5. Đặc tả ca sử dụng đặt lịch tiêu biểu** — dữ liệu cần trình bày: Điều kiện trước/sau, luồng chính, thay thế, ngoại lệ, liên hệ API.


**Nguồn và vị trí dẫn:** [2] sau khi đọc nội dung; khái niệm quyền [34].

**Bằng chứng/điều kiện viết:** UC-01 và đối chiếu mã G0; một hình tổng thể, không giả có năm hình UC con.


### 2.4. Thiết kế sơ đồ hoạt động

**Mục đích:** Giải thích logic nghiệp vụ của đủ AD-01–AD-06.


#### 2.4.1. Đăng ký tài khoản

Phạm vi viết: Validation, trùng dữ liệu, băm và trở về đăng nhập; phân tích điểm bắt đầu/kết thúc, lane và nhánh lỗi.


- **Hình 2.2. Đăng ký tài khoản** — Có PNG gốc, đã xem ở G0; giữ nguyên. Luồng chính phù hợp; hình không mô tả mọi điều kiện validation, transaction hoặc giới hạn mật khẩu.


#### 2.4.2. Đặt lịch dịch vụ

Phạm vi viết: Online/tại quầy, hồ sơ, dịch vụ, giờ và lịch chờ; thuyết minh phần cọc/khóa/toàn khoảng hiện chưa có trên hình.


- **Hình 2.3. Đặt lịch online/tại quầy** — Có PNG gốc, đã xem ở G0; giữ nguyên. Chưa thể hiện snapshot cọc, khóa ngày và ca bao trọn toàn thời lượng.


#### 2.4.3. Quản lý lịch hẹn và phân công

Phạm vi viết: Phân công/giữ chờ/từ chối; nhãn Đã hủy trong hình khác TuChoi trong mã.


- **Hình 2.4. Điều phối và phân công** — Có PNG gốc, đã xem ở G0; giữ nguyên. Nhánh từ chối trên hình ghi Đã hủy, khác TuChoi trong code.


#### 2.4.4. Thực hiện dịch vụ

Phạm vi viết: Đủ/không đủ điều kiện, tiến độ và hoàn tất; đổi giờ và hủy là xử lý riêng, không tự biến hoãn thành hủy.


- **Hình 2.5. Tiếp nhận và chăm sóc** — Có PNG gốc, đã xem ở G0; giữ nguyên. Nhánh không đủ điều kiện có hủy/hoãn nhưng đi về cập nhật Đã hủy; code tách đổi giờ/hủy và chặn xử lý làm dở.


#### 2.4.5. Lập hóa đơn và ghi nhận thanh toán

Phạm vi viết: Snapshot, giảm giá, từng lần thu và nợ; chỉ rõ phần cọc, QR thủ công và bản in khác hóa đơn thuế.


- **Hình 2.6. Lập hóa đơn và thu** — Có PNG gốc, đã xem ở G0; giữ nguyên. Chưa có khấu trừ cọc; cụm hóa đơn điện tử không chứng minh tích hợp thuế; QR chưa đồng nghĩa tự đối soát.


#### 2.4.6. Xử lý khiếu nại và hoàn tiền

Phạm vi viết: Tiếp nhận, quyết định, duyệt và chi; chỉ ra hình ghi giao dịch sớm hơn mã hiện tại.


- **Hình 2.7. Tiếp nhận, quyết định và chi hoàn** — Có PNG gốc, đã xem ở G0; giữ nguyên. Hình ghi giao dịch/đã hoàn trước thực chi; trạng thái khiếu nại khác hiện tại.


**Nguồn và vị trí dẫn:** [2] nếu đọc đúng phần UML; nghiệp vụ tham chiếu [13], [16].

**Bằng chứng/điều kiện viết:** Sáu PNG gốc; lane, guard, ngoại lệ chỉ phân tích khi có trên hình; khác biệt triển khai dẫn bảng đối chiếu.


### 2.5. Thiết kế sơ đồ tuần tự

**Mục đích:** Phân tích SD-01–SD-06 và ánh xạ thiết kế sang triển khai.


#### 2.5.1. Đăng nhập

Phạm vi viết: Đối tượng và alt đúng/sai; phiên trên hình là khái quát, JWT refresh/version bổ sung theo mã.


- **Hình 2.8. Tương tác đăng nhập** — Có PNG gốc, đã xem ở G0; giữ nguyên. Phiên được mô tả khái quát; chưa có refresh, version và bắt đổi mật khẩu tạm.


#### 2.5.2. Đặt lịch dịch vụ

Phạm vi viết: opt tại quầy, loop và lưu chi tiết; guard đếm chỗ trên hình không tương đương solver toàn khoảng.


- **Hình 2.9. Tương tác đặt lịch** — Có PNG gốc, đã xem ở G0; giữ nguyên. Điều kiện số lịch nhỏ hơn số người trực ca không tương đương solver toàn khoảng hiện có.


#### 2.5.3. Quản lý lịch hẹn và phân công

Phạm vi viết: Message từ chối/hủy và opt; mã chọn ba nhánh loại trừ, không chạy phân công sau từ chối.


- **Hình 2.10. Tương tác điều phối** — Có PNG gốc, đã xem ở G0; giữ nguyên. Hình từ chối dùng DaHuy và opt đứng trước phân công; code chọn một nhánh loại trừ.


#### 2.5.4. Thực hiện dịch vụ

Phạm vi viết: Thứ tự tiến độ/chi tiết; khối hủy sau alt không phải bước nối tiếp sau hoàn tất trong code.


- **Hình 2.11. Tương tác chăm sóc** — Có PNG gốc, đã xem ở G0; giữ nguyên. Khối hủy nằm sau alt; cần nói rõ không chạy tiếp sau hoàn thành theo mã hiện tại.


#### 2.5.5. Lập hóa đơn và ghi nhận thanh toán

Phạm vi viết: Tổng/giảm, thu từng phần và trả dư; mã tách số ghi nhận/tiền đưa, cọc và chống lặp.


- **Hình 2.12. Tương tác hóa đơn và thu** — Có PNG gốc, đã xem ở G0; giữ nguyên. Hình suy tiền ghi nhận từ tiền đưa; code phân biệt số ghi nhận/tiền đưa và có cọc, idempotency.


#### 2.5.6. Xử lý khiếu nại và hoàn tiền

Phạm vi viết: Thời điểm reserve, thực chi và trạng thái; hình cũ không chứng minh duyệt đã trả tiền.


- **Hình 2.13. Tương tác khiếu nại và hoàn** — Có PNG gốc, đã xem ở G0; giữ nguyên. Duyệt đã tạo giao dịch/đóng khiếu nại trong hình; code giữ ChoHoanTien đến thực chi thành công.


**Nguồn và vị trí dẫn:** [2] khi đọc phần tương ứng; [23] hỗ trợ giải thích giao dịch, không gán thêm message vào hình.

**Bằng chứng/điều kiện viết:** frm/ctrl/entity là tên mô hình, không mặc nhiên là tên hàm/endpoint; API lấy từ routes.


### 2.6. Thiết kế sơ đồ lớp

**Mục đích:** Làm rõ mô hình miền và quan hệ, khác mô hình SQL.


#### 2.6.1. Nhóm lớp, thuộc tính và phương thức

Phạm vi viết: Chèn CD-01, giới thiệu các lớp nhìn thấy; các phương thức là trách nhiệm thiết kế.


- **Hình 2.14. Mô hình lớp miền** — Có PNG gốc, đã xem ở G0; giữ nguyên. Là mô hình khái niệm; chưa thể hiện bảng kỹ thuật, cọc và reset hiện có; không phải class ES6 của backend.


#### 2.6.2. Quan hệ và bội số

Phạm vi viết: Kế thừa người dùng–khách/nhân viên; chủ–thú cưng–lịch; chi tiết, hóa đơn và giao dịch theo hình.


#### 2.6.3. Ánh xạ sang dữ liệu và module

Phạm vi viết: SQL và hàm ES module không phải lớp ES6 cùng tên; cọc, reset và nhật ký là phần mở rộng chưa có trong hình.


**Nguồn và vị trí dẫn:** [2], [11] sau đọc nội dung.

**Bằng chứng/điều kiện viết:** CD-01, thu_cung.sql, migrations và service đã đối chiếu; không sửa hình hoặc chứng nhận toàn schema từ CD.


### 2.7. Thiết kế sơ đồ trạng thái

**Mục đích:** Giải thích trạng thái, sự kiện, guard và chuyển không hợp lệ.


#### 2.7.1. Vòng đời lịch hẹn

Phạm vi viết: Chèn SM-01; nêu thiếu TuChoi và chuyển DangThucHien sang DaHuy không được API hủy chấp nhận.


- **Hình 2.15. Trạng thái lịch hẹn** — Có PNG gốc, đã xem ở G0; giữ nguyên. Thiếu TuChoi; chuyển DangThucHien sang DaHuy trên hình không được API hủy cho phép.


#### 2.7.2. Vòng đời hóa đơn

Phạm vi viết: Chèn SM-02; thiếu HoanTienMotPhan, điều kiện thực chi và trường hợp giá trị 0/cọc.


- **Hình 2.16. Trạng thái hóa đơn** — Có PNG gốc, đã xem ở G0; giữ nguyên. Thiếu HoanTienMotPhan và điều kiện thực chi; không đủ dùng như máy trạng thái hiện hành hoàn chỉnh.


#### 2.7.3. Ánh xạ trạng thái thiết kế và triển khai

Phạm vi viết: Lịch, hóa đơn, khiếu nại và cọc là các đối tượng riêng; không tự thêm trạng thái vào PNG.


- **Bảng 2.6. Đối chiếu trạng thái và điều kiện chuyển** — dữ liệu cần trình bày: Đối tượng, trạng thái hình/SQL, sự kiện, guard, chuyển bị chặn.


**Nguồn và vị trí dẫn:** [2] nếu đọc ký pháp; [23] chỉ hỗ trợ nguyên tắc giao dịch.

**Bằng chứng/điều kiện viết:** Hai PNG, CHECK trong SQL và guards ở dispatch/care/complaints/invoices.


### 2.8. Thiết kế sơ đồ màn hình và điều hướng giao diện

**Mục đích:** Liên kết cây màn hình, wireframe và route theo vai trò.


#### 2.8.1. Cây màn hình tổng thể

Phạm vi viết: Chèn MH-TQ; phân tích nhóm màn hình và phạm vi cây, không nhận cây là mọi liên kết điều hướng.


- **Hình 2.17. Cây phân nhóm màn hình** — Có PNG gốc, đã xem ở G0; giữ nguyên. Chưa có nhiều route mới; gộp lễ tân/quản lý không có nghĩa hai nhóm có quyền giống nhau.


#### 2.8.2. Wireframe và luồng màn hình tiêu biểu

Phạm vi viết: Ba Markdown MH-01…MH-11/MH-02b; dữ liệu trong wireframe là mẫu thiết kế.


#### 2.8.3. Ánh xạ màn hình sang route và quyền

Phạm vi viết: HashRouter/App.jsx; nêu route mới, trang giữ chỗ và giới hạn Admin.


- **Bảng 2.7. Ánh xạ màn hình, route và quyền** — dữ liệu cần trình bày: Mã màn hình, route/component, nhóm quyền, dữ liệu, giới hạn.


#### 2.8.4. Trạng thái tương tác và hiển thị lỗi

Phạm vi viết: Loading, validation, thiếu dữ liệu/quyền và màn hình hẹp; mô tả dự kiến và bằng chứng đã có riêng.


**Nguồn và vị trí dẫn:** [24] cho component/state; [19]–[21] chỉ khi giải thích tham khảo luồng sản phẩm.

**Bằng chứng/điều kiện viết:** MH-TQ, ba wireframe, App.jsx và bảng G0; ảnh cài đặt dành Chương 3.


### 2.9. Thiết kế cơ sở dữ liệu PostgreSQL

**Mục đích:** Trình bày schema hiện hành từ nguồn DDL và các quyết định bảo toàn dữ liệu.


#### 2.9.1. Nguồn schema và quản lý phiên bản

Phạm vi viết: thu_cung.sql là version 000, migrations 001–008; không tự tạo tên file 000 không tồn tại.


#### 2.9.2. Nhóm bảng và mô hình quan hệ

Phạm vi viết: 21 bảng ứng dụng + bảng lịch sử theo DDL/snapshot đã có; vị trí ERD là dự kiến, chưa có hình phản ánh đầy đủ 008.


- **Hình 2.18. Mô hình quan hệ dữ liệu PetCare theo schema khảo sát** — Dự kiến; chưa có hình đủ schema sau 008. Mermaid cũ chỉ là đầu mối; phải kiểm DDL 000–008 trước tạo hình mới ở giai đoạn phù hợp. Không sửa sơ đồ gốc.


- **Bảng 2.8. Các bảng dữ liệu và trách nhiệm lưu trữ** — dữ liệu cần trình bày: Bảng, nhóm nghiệp vụ, PK/FK chính, version nguồn, mục đích.


#### 2.9.3. Khóa, ràng buộc và chỉ mục

Phạm vi viết: PK/FK, UNIQUE/CHECK/EXCLUDE, index; giải thích quy tắc service không được FK tự bảo đảm.


- **Bảng 2.9. Ràng buộc và chỉ mục bảo toàn dữ liệu** — dữ liệu cần trình bày: Tên/loại, bảng/cột, quy tắc, lớp service bổ sung, bằng chứng.


#### 2.9.4. Kiểu thời gian, tiền và snapshot

Phạm vi viết: NUMERIC, quy tắc thời gian Việt Nam, giá/tên lịch sử và cọc; không dùng số thực nhị phân để cộng tiền.


#### 2.9.5. Giao dịch và lưu vết dữ liệu

Phạm vi viết: Khóa/rollback, chống lặp, xóa mềm, giữ hồ sơ FK và migration checksum.


#### 2.9.6. Nhận xét thiết kế và chuẩn hóa

Phạm vi viết: Chỉ lập luận chuẩn hóa khi có phụ thuộc hàm/căn cứ; tổng tiền/snapshot có chủ đích, không tự tuyên bố 3NF.


**Nguồn và vị trí dẫn:** [23]; [11] chỉ sau đọc chương CSDL.

**Bằng chứng/điều kiện viết:** DDL/migrations/db-tooling và snapshot đã ghi; không gọi là truy vấn DB mới ở Giai đoạn 1.


### 2.10. Thiết kế kiến trúc hệ thống

**Mục đích:** Làm rõ trách nhiệm và luồng dữ liệu của kiến trúc thực tế.


#### 2.10.1. Các thành phần và quan hệ giao tiếp

Phạm vi viết: React/Vite → Express HTTP API → service/pg → PostgreSQL; vị trí hình kiến trúc chỉ là kế hoạch.


- **Hình 2.19. Kiến trúc giao tiếp frontend, backend và cơ sở dữ liệu** — Dự kiến; chưa tạo hình. Chỉ dành vị trí; mô tả từ module/route đã khảo sát, không thêm ORM hoặc microservices.


#### 2.10.2. Luồng request, xác thực và dữ liệu

Phạm vi viết: Header/cookie theo code, middleware, controller/service, transaction, response và lỗi.


#### 2.10.3. Phân tách trách nhiệm và lựa chọn triển khai

Phạm vi viết: Giải thích SQL trực tiếp và cấu trúc module; không thêm ORM/microservices vào mô tả.


**Nguồn và vị trí dẫn:** [17], [18], [23], [24].

**Bằng chứng/điều kiện viết:** frontend/backend, server.js, middleware và package; phân biệt khai báo dependency với runtime đã đo.


### 2.11. Thiết kế API và giải pháp xử lý nghiệp vụ quan trọng

**Mục đích:** Giải thích thuật toán/cơ chế đang có và lý do lựa chọn.


#### 2.11.1. Thiết kế API tiêu biểu

Phạm vi viết: Đường dẫn/HTTP method, quyền, đầu vào và lỗi lấy từ server.js/routes; không bịa theo tên message UML.


- **Bảng 2.10. API tiêu biểu của hệ thống** — dữ liệu cần trình bày: Method/path, quyền/sở hữu, tham số chính, kết quả/lỗi, module.


#### 2.11.2. Kiểm tra khả dụng toàn khoảng và tìm kiếm quay lui

Phạm vi viết: Giữ người đã gán, ca bao trọn, chọn việc ít lựa chọn; budget và lỗi 503; chỉ chứng minh khả thi, không lưu phân công tự động.


#### 2.11.3. Kiểm soát đồng thời và chống giao thoa

Phạm vi viết: Khóa ngày, thứ tự khóa, kiểm tra lại, EXCLUDE và rollback; tải ô giờ trống trước không thay khóa khi ghi.


#### 2.11.4. Xác thực, phân quyền và quyền sở hữu

Phạm vi viết: JWT purpose/version, bcrypt, tài khoản khóa/tạm, quyền server và kiểm sở hữu; không chứng nhận an toàn toàn diện.


#### 2.11.5. Cọc, thu tiền và xử lý khiếu nại/hoàn

Phạm vi viết: Snapshot chính sách, khấu trừ cọc, xác nhận thực nhận, duyệt khác chi, hoàn một phần/thất bại/chống lặp.


#### 2.11.6. Bảo toàn dữ liệu và ngoại lệ

Phạm vi viết: Validation, SQL tham số, lỗi, lịch sử và giới hạn chưa hỗ trợ; đối chiếu tiêu chí chấp nhận.


- **Bảng 2.11. Quy tắc nghiệp vụ và cơ chế bảo vệ** — dữ liệu cần trình bày: Quy tắc, guard/khóa/ràng buộc, ngoại lệ, testcase truy vết.


**Nguồn và vị trí dẫn:** [17], [23], [25], [34]; lý do áp dụng là phân tích dự án.

**Bằng chứng/điều kiện viết:** booking/scheduling/dispatch/care/invoices/complaints/deposit services và routes; không viết API mới.


### 2.12. Tổng kết chương

**Mục đích:** Liên kết yêu cầu, thiết kế và kịch bản đánh giá.


#### 2.12.1. Tổng hợp lựa chọn thiết kế và sai khác

Phạm vi viết: Tập hợp khác biệt UML–mã đã khảo sát, không sửa PNG để che lệch.


- **Bảng 2.12. Sai khác giữa thiết kế gốc và triển khai** — dữ liệu cần trình bày: Mã hình, phần gốc, mã thực tế, ảnh hưởng và cách thuyết minh.


#### 2.12.2. Truy vết sang cài đặt và kiểm thử

Phạm vi viết: Mỗi nhóm yêu cầu gắn module/case hoặc trạng thái chưa có bằng chứng ở Chương 3.


**Nguồn và vị trí dẫn:** Không thêm nguồn mới; dẫn lại khi thực sự cần.

**Bằng chứng/điều kiện viết:** Bảng đối chiếu UML và bảng test G0.


## CHƯƠNG 3 CÀI ĐẶT THỬ NGHIỆM KẾT QUẢ VÀ ĐÁNH GIÁ


### 3.1. Môi trường phát triển và thử nghiệm

**Mục đích:** Ghi điều kiện của từng lần chạy có bằng chứng.


#### 3.1.1. Phần mềm và phiên bản

Phạm vi viết: Package khai báo khác runtime đã ghi; ngày, hệ điều hành và công cụ theo biên bản.


- **Bảng 3.1. Môi trường và phiên bản theo mốc thử nghiệm** — dữ liệu cần trình bày: Thời điểm, mã/nhánh, OS/runtime/DB, dependency khai báo, giới hạn.


#### 3.1.2. Môi trường local, DB test và dữ liệu demo

Phạm vi viết: Tách sandbox/chuyển khoản thủ công; không lộ .env, mật khẩu hoặc dump.


#### 3.1.3. Phạm vi triển khai và giới hạn

Phạm vi viết: Chưa có bằng chứng production/Docker runtime hoặc tải thực tế.


**Nguồn và vị trí dẫn:** [17], [22]–[24] khi giải thích công cụ; số phiên bản thực tế lấy từ dự án.

**Bằng chứng/điều kiện viết:** Biên bản môi trường và package; không tự chạy mới trong Giai đoạn 1.


### 3.2. Cấu trúc mã nguồn hệ thống

**Mục đích:** Mô tả cách tổ chức triển khai, khác sơ đồ kiến trúc khái niệm.


#### 3.2.1. Frontend

Phạm vi viết: pages, layouts, components, data/lib; route và kiểm tra quyền.


#### 3.2.2. Backend

Phạm vi viết: routes, middleware, controller, service, lib/config và test.


#### 3.2.3. Schema, tooling và tài liệu

Phạm vi viết: SQL/migrations, scripts và docs; không in cây node_modules hoặc bí mật.


- **Bảng 3.2. Module triển khai và chức năng phụ trách** — dữ liệu cần trình bày: Thư mục/module, trách nhiệm, API/UI, liên hệ yêu cầu.


**Nguồn và vị trí dẫn:** [17], [24] chỉ nếu diễn giải nguyên tắc framework.

**Bằng chứng/điều kiện viết:** Cây thư mục/README; không sửa code.


### 3.3. Cài đặt cơ sở dữ liệu

**Mục đích:** Trình bày phần đã triển khai theo biên bản.


#### 3.3.1. Khởi tạo và migration có kiểm soát

Phạm vi viết: Version/checksum, transaction, readiness và các bước đã chạy trong lịch sử.


#### 3.3.2. Dữ liệu kiểm thử và ràng buộc

Phạm vi viết: Nguồn demo/cô lập, PK/FK/EXCLUDE và lưu dữ liệu; không tạo seed mới để làm số liệu.


#### 3.3.3. Kiểm chứng và giới hạn

Phạm vi viết: Dẫn biên bản backup/restore/metadata, phân biệt schema nguồn với DB đang chạy.


**Nguồn và vị trí dẫn:** [23] cho cơ chế; các kết quả dùng biên bản dự án.

**Bằng chứng/điều kiện viết:** Thiết kế CSDL, DB recovery và test tooling.


### 3.4. Cài đặt chức năng khách hàng

**Mục đích:** Trình bày các luồng thực sự có và mức bằng chứng.


#### 3.4.1. Đăng ký, đăng nhập và hồ sơ thú cưng

Phạm vi viết: Minh họa xác thực/hồ sơ; đổi mật khẩu tạm và CRUD chưa QA đầy đủ được ghi riêng.


- **Hình 3.1. Giao diện đăng ký và đăng nhập** — Ứng viên cũ chưa kiểm nội dung để chọn. HA-01; cần ảnh hiện tại, không lộ thông tin đăng nhập.


- **Hình 3.2. Quản lý hồ sơ thú cưng** — Chưa có ảnh đã duyệt. HA-02; chụp từ UI thật trong dữ liệu demo khi được triển khai phần kết quả.


#### 3.4.2. Đặt lịch, cọc và theo dõi lịch

Phạm vi viết: Ba bước, giờ khả dụng, trạng thái, hủy/đổi theo quyền; ảnh phải đúng chế độ triển khai.


- **Hình 3.3. Đặt lịch và chọn ngày giờ khả dụng** — Ứng viên chưa đánh giá đủ. HA-03; ảnh không có ca khác ảnh đặt thành công, cần lựa chọn đúng nội dung.


- **Hình 3.4. Thông tin đặt cọc và trạng thái sau đặt lịch** — Ứng viên sandbox chưa duyệt. HA-03; ghi rõ mô phỏng, không nhận tiền thật.


#### 3.4.3. Hóa đơn, đánh giá và khiếu nại

Phạm vi viết: Quyền sở hữu, đánh giá lịch hoàn tất và gửi/theo dõi khiếu nại; QA UI còn thiếu không được đánh dấu hoàn tất.


- **Hình 3.5. Khách hàng gửi và theo dõi khiếu nại** — Chưa có ảnh đã duyệt. HA-07; cần kiểm UI/viewport theo tiến độ.


**Nguồn và vị trí dẫn:** Không cần dẫn nguồn ngoài cho tính năng tự làm; dùng [24] chỉ cho kỹ thuật giao diện.

**Bằng chứng/điều kiện viết:** App.jsx, trang khách, API/test và biên bản; ảnh cần chọn/kiểm tra theo catalog.


### 3.5. Cài đặt chức năng nhân viên chăm sóc

**Mục đích:** Minh họa người được giao và tiến trình dịch vụ.


#### 3.5.1. Xem lịch và thông tin tiếp nhận

Phạm vi viết: Lịch/ca được phép đọc và ghi chú thú cưng.


#### 3.5.2. Bắt đầu, cập nhật chi tiết và hoàn tất

Phạm vi viết: Chỉ kết thúc khi các dịch vụ xong; ảnh hoàn tất lịch sử có thể dùng đúng chú thích.


- **Hình 3.6. Tiến trình và hoàn tất dịch vụ chăm sóc** — Đã xem G0; ảnh demo lịch sử. HA-05; chú thích đúng phiên bản, không coi là ảnh mới.


#### 3.5.3. Không đủ điều kiện phục vụ

Phạm vi viết: Báo trước bắt đầu, ghi lý do và chuyển bộ phận tiếp nhận; không tự thêm quyết toán làm dở.


- **Hình 3.7. Thông báo thú cưng không đủ điều kiện phục vụ** — Chưa có ảnh đã duyệt. HA-05; chỉ tình huống được UI/API hỗ trợ trước bắt đầu.


**Nguồn và vị trí dẫn:** [16] chỉ khi liên hệ yêu cầu an toàn; kết quả lấy từ dự án.

**Bằng chứng/điều kiện viết:** care.js, ChamSoc và biên bản care/shifts; ảnh ngoại lệ còn thiếu.


### 3.6. Cài đặt chức năng lễ tân

**Mục đích:** Mô tả tiếp nhận, điều phối và ghi nhận giao dịch.


#### 3.6.1. Đặt tại quầy và điều phối lịch

Phạm vi viết: Chủ/thú cưng mới, lịch chờ, phân công/giữ/từ chối; quyền theo mã.


- **Hình 3.8. Điều phối lịch hẹn và phân công nhân viên** — Đã xem G0; ảnh demo lịch sử. HA-04; cần ảnh mới nếu diễn giải giao diện nâng cấp.


#### 3.6.2. Lập hóa đơn và thu tiền

Phạm vi viết: Tiền đưa khác số ghi nhận, thu từng phần/cọc; VietQR là hướng dẫn, nhân sự xác nhận nhận tiền.


- **Hình 3.9. Hóa đơn và các khoản đã thu, đã hoàn** — Đã xem G0; ảnh demo lịch sử. Số liệu trên ảnh là tình huống kiểm thử, không là doanh thu thực.


#### 3.6.3. Tiếp nhận khiếu nại và thực chi hoàn

Phạm vi viết: Duyệt không phải trả tiền; minh họa phiếu hoàn demo, thất bại giữ chờ.


- **Hình 3.10. Phiếu thực chi hoàn tiền** — Đã xem G0; ảnh demo lịch sử. HA-08; phiếu demo không chứng minh có chuyển tiền thật.


**Nguồn và vị trí dẫn:** [23] nếu giải thích cơ chế bảo toàn; không dùng nguồn ngoài xác nhận kết quả tự làm.

**Bằng chứng/điều kiện viết:** Biên bản booking/dispatch/invoices/refunds, transfers và ảnh demo đã xem.


### 3.7. Cài đặt chức năng quản lý

**Mục đích:** Trình bày dữ liệu vận hành và quyền quyết định.


#### 3.7.1. Ca làm việc và danh mục dịch vụ

Phạm vi viết: Cảnh báo thiếu bao phủ, ngừng bán và giá lịch sử.


- **Hình 3.11. Quản lý ca làm việc và cảnh báo ràng buộc** — Chưa có ảnh đã duyệt. HA-04; cần ảnh thao tác thật và tình huống được kiểm chứng.


- **Hình 3.12. Danh mục dịch vụ và bảng giá** — Chưa có ảnh đã duyệt. Chọn/chụp giao diện thật, không dùng wireframe thay kết quả.


#### 3.7.2. Quyết định xử lý khiếu nại và duyệt hoàn

Phạm vi viết: Hạn mức giữ chỗ tiền và trạng thái chờ chi; không gộp với thực chi.


- **Hình 3.13. Duyệt hoàn và trạng thái chờ thực chi** — Chưa có ảnh đã duyệt. HA-08; phải thể hiện duyệt khác chi.


#### 3.7.3. Thống kê và báo cáo theo kỳ

Phạm vi viết: Thu/hoàn/thực thu và biểu đồ kỳ; giá trị dịch vụ khác tiền thu, không gọi là lợi nhuận.


- **Hình 3.14. Báo cáo thu, hoàn và thực thu** — Đã xem G0; ảnh demo lịch sử. Không coi chỉ tiêu thực thu là lợi nhuận hoặc số liệu kinh doanh thật.


- **Hình 3.15. Biểu đồ báo cáo theo kỳ** — Ứng viên chưa duyệt. HA-09; preview nhỏ phải kiểm độ rõ/phiên bản trước chèn.


**Nguồn và vị trí dẫn:** [23], [34] chỉ cho căn cứ kỹ thuật/quyền.

**Bằng chứng/điều kiện viết:** Ca/danh mục/reports/complaints và biên bản biểu đồ; không tạo số kinh doanh thật.


### 3.8. Cài đặt chức năng Admin

**Mục đích:** Đánh giá đúng từng phần quản trị, không dùng fallback làm chứng cứ.


#### 3.8.1. Tài khoản, tìm kiếm và bộ lọc

Phạm vi viết: KPI/lọc nâng cấp có mã nhưng chưa HTTP/UI QA riêng; ảnh Admin cũ không chứng minh bản mới.


- **Hình 3.16. KPI, tìm kiếm và bộ lọc tài khoản Admin** — Chưa có ảnh bản mới đã duyệt. HA-10; stage11-admin.png là bản cũ, không dùng chứng minh KPI mới.


#### 3.8.2. Mật khẩu tạm, khóa và thay đổi vai trò

Phạm vi viết: Guard lịch, thu hồi phiên, xác nhận và rollback theo mã/test lịch sử.


- **Hình 3.17. Cảnh báo ràng buộc khi quản trị tài khoản** — Chưa có ảnh đã duyệt. HA-10; không tạo dialog giả hoặc nhận guard chưa thử là đã đạt.


#### 3.8.3. Giới hạn quản trị hiện tại

Phạm vi viết: Audit/config/backup còn mô phỏng hoặc thiếu API; Admin đang có quyền vận hành, không tự gọi là đã tách hoàn toàn.


**Nguồn và vị trí dẫn:** [25], [34] khi liên hệ tiêu chí xác thực/phân quyền.

**Bằng chứng/điều kiện viết:** TIEN_DO_ADMIN_PETCARE.md, controller/routes và ảnh/biên bản phù hợp; chưa nghiệm thu toàn Admin.


### 3.9. Kịch bản và phương pháp kiểm thử

**Mục đích:** Giải thích chọn dữ liệu, môi trường và cách ghi nhận kết quả.


#### 3.9.1. Thiết kế testcase từ yêu cầu

Phạm vi viết: Phân hoạch/biên [32], trạng thái, vai trò, sở hữu và ngoại lệ; phân biệt case đã có với case đề xuất.


- **Bảng 3.3. Các testcase tiêu biểu và điều kiện kỳ vọng** — dữ liệu cần trình bày: Mã, yêu cầu, tiền điều kiện, dữ liệu, bước, kỳ vọng, vị trí test.


#### 3.9.2. Unit, HTTP tích hợp và DB cô lập

Phạm vi viết: node:test [22], setup/cleanup và log; không ghi PASS từ việc có file.


- **Bảng 3.4. Môi trường và cách thực thi kiểm thử** — dữ liệu cần trình bày: Nhóm test, snapshot, DB cô lập, lệnh, log/mốc, quy ước đếm.


#### 3.9.3. Kiểm thử tranh chỗ, rollback và giao dịch

Phạm vi viết: Case đồng thời, thực chi/chống lặp, giữ công suất, thất bại thông báo.


#### 3.9.4. Quy ước ghi nhận kết quả

Phạm vi viết: Mốc, snapshot, lệnh, môi trường và PASS/FAIL/SKIP; Postman [35] chỉ nếu có collection/thực thi thật.


**Nguồn và vị trí dẫn:** [32], [22], [23]; [35] có điều kiện.

**Bằng chứng/điều kiện viết:** BANG_KIEM_THU_PETCARE.md và testcase thực tế; không tạo kết quả mới trong đề cương.


### 3.10. Kết quả kiểm thử

**Mục đích:** Trình bày kết quả đã có theo từng đợt và giới hạn.


#### 3.10.1. Tổng hợp các mốc thực thi

Phạm vi viết: Giữ riêng các lần chạy 23–24/10, cọc, transfers, SMTP, khiếu nại và 07–08/11; không cộng số chồng nhau.


- **Bảng 3.5. Kết quả kiểm thử theo từng đợt** — dữ liệu cần trình bày: Ngày/phạm vi, PASS/FAIL/SKIP, quy ước parent/subtest, nguồn, giới hạn.


#### 3.10.2. Kết quả theo nhóm chức năng

Phạm vi viết: Đối chiếu điều kiện chấp nhận với case/biên bản; không gán PASS lẻ khi chỉ có tổng nhóm.


#### 3.10.3. Hạng mục chưa thực hiện hoặc thiếu bằng chứng

Phạm vi viết: SKIP, UI mới, thiết bị, tải, Mailtrap, Docker và merchant được giữ trạng thái đúng.


- **Bảng 3.6. Hạng mục chưa đủ bằng chứng** — dữ liệu cần trình bày: Hạng mục, trạng thái, phần thiếu, ảnh hưởng và bước kiểm chứng.


**Nguồn và vị trí dẫn:** [22] chỉ cho cách đọc báo cáo công cụ.

**Bằng chứng/điều kiện viết:** Biên bản và hồ sơ test G0; chưa rà raw log từng case, chưa chạy lại.


### 3.11. Đánh giá mức độ đáp ứng mục tiêu

**Mục đích:** Đánh giá kết quả dựa trên bằng chứng, không quảng bá.


#### 3.11.1. Đối chiếu mục tiêu và yêu cầu

Phạm vi viết: Mục tiêu–module–bằng chứng–mức đáp ứng–phần còn lại.


- **Bảng 3.7. Mức đáp ứng mục tiêu và yêu cầu** — dữ liệu cần trình bày: Mục tiêu/yêu cầu, module, bằng chứng, mức đáp ứng, hạn chế.


#### 3.11.2. Tính đúng nghiệp vụ và toàn vẹn dữ liệu

Phạm vi viết: Phân tích concurrency, quyền, snapshot và thu/hoàn từ case có thật.


#### 3.11.3. Giá trị sử dụng và giới hạn suy luận

Phạm vi viết: Đánh giá định tính trong phạm vi; chưa có tỷ lệ hài lòng, giảm chờ hoặc benchmark của PetCare.


**Nguồn và vị trí dẫn:** [23], [25], [32], [34] nếu liên hệ tiêu chí; [29], [30], [33] không thay kết quả dự án.

**Bằng chứng/điều kiện viết:** Yêu cầu, biên bản, bảng test; không suy hiệu quả thực địa từ chạy demo.


### 3.12. Hạn chế của hệ thống

**Mục đích:** Nêu phần thiếu và ảnh hưởng để dẫn sang hướng phát triển.


#### 3.12.1. Hạn chế triển khai chức năng

Phạm vi viết: Admin mô phỏng, cọc dư/tự giải phóng chỗ, quyết toán làm dở và thông báo.


#### 3.12.2. Hạn chế kiểm thử và bằng chứng

Phạm vi viết: UI/thiết bị, ảnh mới, tải, raw log, khảo sát thực địa và nguồn chưa đọc sâu.


#### 3.12.3. Hạn chế triển khai vận hành

Phạm vi viết: Mailtrap thật, Docker runtime, webhook/merchant và production chưa có bằng chứng hoàn tất.


**Nguồn và vị trí dẫn:** Không thêm nguồn để hợp thức hóa hạn chế; nguồn chính là tiến độ dự án.

**Bằng chứng/điều kiện viết:** G0 và biên bản; không nâng tính năng dự kiến thành kết quả.


## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 1. Kết quả đạt được và mức đáp ứng mục tiêu

Tổng hợp từ Bảng 3.7; tách chức năng đã có/bằng chứng lịch sử/phần chưa QA. Không gọi toàn hệ thống production hoặc giai đoạn 12 đã đạt.

### 2. Kiến thức kỹ năng và khó khăn đã giải quyết

Liên hệ phân tích, UML, dữ liệu, quyền, công suất toàn khoảng và giao dịch; nêu khó khăn theo bằng chứng, không tự thêm trải nghiệm nhóm.

### 3. Hạn chế còn tồn tại

Chốt giới hạn triển khai, nguồn/ảnh và đánh giá ở 3.12; không sao chép lại toàn danh sách chức năng.

### 4. Hướng phát triển

Ưu tiên hoàn thiện quản trị có dữ liệu thật, kiểm thử UI/thiết bị, hiệu năng, tích hợp thanh toán/SMTP phù hợp và vận hành; các nội dung này là dự kiến, không nằm trong kết quả hoàn thành.

## PHỤ LỤC nếu cần

- Phụ lục 1: yêu cầu/đặc tả chi tiết và route, phần dài bổ trợ Bảng 2.2/2.5/2.10.
- Phụ lục 2: cấu trúc bảng, ràng buộc và migration, bổ trợ Bảng 2.8/2.9; không đưa dump hoặc cấu hình bí mật.
- Phụ lục 3: testcase, mốc/log được chọn và quy ước đếm; chỉ dữ liệu đã kiểm tra, không tự tạo log.
- Phụ lục 4: sai khác UML–mã và hướng dẫn thao tác trong phạm vi đã triển khai, khi cần. Phụ lục không thay việc phân tích đủ sáu loại sơ đồ trong Chương 2.

## DANH MỤC TÀI LIỆU THAM KHẢO

Nguồn xét chọn: [DANH_MUC_TAI_LIEU_THAM_KHAO.md](DANH_MUC_TAI_LIEU_THAM_KHAO.md), kế thừa 35 hồ sơ đã xác minh (20 Việt/15 Anh). Chưa khóa danh sách nguồn được trích thực tế. Mục tiêu khoảng 20–25 nguồn chất lượng, tối thiểu 10 theo mẫu; không giữ nguồn bệnh lý hoặc catalog không dùng chỉ để đủ số/tỷ lệ.

Khi viết, đặt số tại đúng luận điểm; nguồn ngoài cho khái niệm/kết quả kế thừa, bằng chứng dự án cho kết quả tự làm. Không trích nguồn chưa xác minh. Không dùng dữ liệu hiệu quả của VOAS/bài khác làm kết quả PetCare. Nguồn sản phẩm được gắn loại tài liệu hãng.

Thứ tự dự kiến theo quy định trường: nhóm Việt theo tên tác giả đầu, nhóm Anh theo họ/tổ chức, một dãy số liên tục; ghi rõ điểm không thống nhất trong mẫu đã khảo sát. Chỉ sắp/đổi số đồng bộ khi chốt danh sách, sau đó kiểm citation ↔ reference trên bản thảo thật. Không nhận dãy 1–35 đang làm việc là thứ tự nộp đã hoàn tất.

## Điều kiện bàn giao Giai đoạn 1

Đề cương có đủ mục/tiểu mục của ba chương, sáu loại sơ đồ/17 PNG gốc, vị trí 36 hình và 24 bảng dự kiến, nguồn và giới hạn bằng chứng theo từng mục. Nguồn/ảnh còn thiếu là công việc đầu vào cho giai đoạn viết, không được lấp bằng giả định. Chưa có nội dung chương hoàn chỉnh, ảnh mới, testcase mới, Word/PDF hoặc chỉnh sửa mã/sơ đồ. Dừng sau cập nhật tiến độ để người dùng kiểm tra trước Giai đoạn 2.
