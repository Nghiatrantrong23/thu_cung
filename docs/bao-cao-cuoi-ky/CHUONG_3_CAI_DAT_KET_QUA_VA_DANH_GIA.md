# CHƯƠNG 3. CÀI ĐẶT THỬ NGHIỆM, KẾT QUẢ VÀ ĐÁNH GIÁ

Chương này trình bày phần cài đặt đã đối chiếu với mã nguồn và kết quả có trong các biên bản từ tháng 10 đến ngày 08/11/2026. Ngày biên soạn 10/11/2026 không phải một lần chạy kiểm thử ứng dụng mới. Các ảnh được chọn là ảnh demo có sẵn, không được dùng để chứng minh giao diện hiện tại đã được nghiệm thu toàn bộ.

## 3.1. Môi trường phát triển và thử nghiệm

### 3.1.1. Phần mềm và phiên bản

Thế Giới Thú Cưng gồm frontend React/Vite, backend Node.js/Express và PostgreSQL, theo thiết kế đã trình bày ở Chương 2. Phiên bản khai báo trong package là điều kiện lựa chọn dependency, khác phiên bản thực chạy được ghi tại một mốc. Bảng 3.1 tách hai loại thông tin để tránh lấy số khai báo làm kết quả đo môi trường.

**Bảng 3.1. Môi trường và phiên bản theo mốc thử nghiệm**

| Thành phần | Khai báo/nguồn cấu hình | Mốc có bằng chứng | Phạm vi kết luận |
|---|---|---|---|
| Hệ điều hành/thao tác | Workspace Windows, lệnh PowerShell và `npm.cmd` | Hồ sơ dự án và biên bản kiểm tra | Không tự điền phiên bản Windows, CPU hoặc RAM chưa được ghi |
| Node.js/npm | Backend yêu cầu Node `>=20.0.0` | Khảo sát Admin 07/11: Node `v24.20.0`, npm `11.19.0` | Là snapshot lịch sử; không xác nhận runtime đang phục vụ ngày 10/11 |
| React/Router | React `^18.3.1`, React Router DOM `^6.26.0` | `frontend/package.json`; HashRouter trong `main.jsx` | Khoảng khai báo, không thay bảng phiên bản đã cài theo từng lần build |
| Vite | `^5.4.0` | Khảo sát 07/11 ghi Vite `5.4.21`, build 118 modules | Build là kết quả đóng gói tại mốc đó, chưa là nghiệm thu luồng nghiệp vụ |
| Express/driver PostgreSQL | Express `^4.19.2`, `pg ^8.12.0` | `backend/package.json` | Không gọi các khoảng này là phép đo hiệu năng |
| PostgreSQL | Thiết kế nhánh 17, có `btree_gist` cho ràng buộc khoảng | Khảo sát DB chỉ đọc 07/11: PostgreSQL `17.11`, 22 bảng public | Không truy vấn lại DB trong đợt viết này |
| Bảo vệ tài khoản | bcrypt `^5.1.1`, jsonwebtoken `^9.0.2` | Package, middleware/controller và biên bản xác thực | Có thư viện chưa chứng minh đã kiểm thử an toàn toàn diện |
| Gửi thư | Nodemailer `^10.2.1` | Biên bản reset 25/10: SMTP loopback; Mailtrap thật còn BLOCKED | Không lấy thư nhận cục bộ làm thư Mailtrap đã nhận |
| Công cụ kiểm tra | `node:test`, ESLint, Vite build | Script frontend/backend và các biên bản | Frontend có lint; chưa thấy script lint backend riêng |

*Nguồn: package/mã dự án, biên bản kiểm thử 23–24/10 và `TIEN_DO_ADMIN_PETCARE.md` ngày 07/11. Các phiên bản là dữ liệu dự án, không lấy từ số phiên bản mới nhất trên Internet.*

### 3.1.2. Môi trường local, DB test và dữ liệu demo

Các thử nghiệm tích hợp sử dụng PostgreSQL local riêng, mỗi nhóm/lần chạy có database mới theo quy tắc của tooling. Fixture tạo danh tính và dữ liệu cần thiết cho tình huống kiểm tra. Dữ liệu demo trong ảnh mang nhãn Demo và được biên bản xác định là thử nghiệm, không phải giao dịch khách hàng hay doanh thu kinh doanh thực tế.

Biên bản cọc và chuyển khoản phân biệt môi trường ứng dụng local với môi trường sandbox. Sandbox mô phỏng kết quả QR/MoMo, callback và hoàn tiền; chế độ hướng dẫn chuyển khoản có nhân sự xác nhận thực nhận là một luồng khác. Cổng, database và trạng thái bật tính năng trong biên bản chỉ mô tả mốc đã chạy; báo cáo không khẳng định các dịch vụ đó đang mở ở thời điểm biên soạn. Không đưa mật khẩu, token, nội dung `.env` hoặc dump DB vào báo cáo.

### 3.1.3. Phạm vi triển khai và giới hạn

Bằng chứng hiện có chủ yếu thuộc phát triển local, DB kiểm thử cô lập, kiểm tra chỉ đọc và các thao tác trình duyệt có ghi nhận. Dự án có Dockerfile/Compose và cấu hình liên quan, nhưng biên bản chưa xác nhận build/run Docker thành công. Không có căn cứ để công bố đã triển khai production, đáp ứng một mức tải hệ thống hoặc có giám sát uptime vận hành.

Mốc khảo sát Admin 07/11 ghi `/health` và `/ready` tại các cổng đã thử không có phản hồi sử dụng được. Điều đó khác các mốc kiểm thử trước từng ghi nhận API hoạt động, và không được thay bằng kết luận “server luôn đang chạy”. Đánh giá trong chương vì vậy gắn với đúng thời điểm và loại bằng chứng.

## 3.2. Cấu trúc mã nguồn hệ thống

### 3.2.1. Frontend

Frontend tổ chức các trang theo nhóm khách hàng, chăm sóc, lễ tân, quản lý và Admin; các layout và thành phần dùng chung hỗ trợ vùng giao diện tương ứng. `App.jsx` khai báo route và vùng kiểm quyền, còn `main.jsx` gắn HashRouter, các provider xác thực/thú cưng/lịch, giao diện và thông báo tương tác. Trạng thái dùng chung nằm trong `src/data`, không giả định dự án có một thư mục `contexts` khi cấu trúc thực tế khác.

Các thư viện trong `src/lib` hỗ trợ gọi API, trình bày ngày/giờ, trạng thái, lựa chọn kỳ báo cáo và logic thuần phía client. Kiểm tra giao diện giúp phản hồi sớm, còn giá, quyền và trạng thái cuối cùng vẫn được server xác định. Vì vậy, việc một trang mở được không đủ chứng minh dữ liệu và mọi hành động bên trong đã tích hợp đúng.

### 3.2.2. Backend

Backend chia routes, middleware, controllers, services, lib và config. Routes xác định đường dẫn/guard; middleware xử lý xác thực, quyền, lỗi và các điều kiện chung; service chứa quy tắc liên quan lịch, ca, cọc, hóa đơn và khiếu nại. Các hàm thuần về lập lịch và tiền được tách để có thể kiểm tra trực tiếp.

Mã dùng SQL có tham số qua `pg`, không sử dụng ORM hoặc một tập microservice được triển khai riêng. Có route gọi service trực tiếp thay vì qua controller trung gian, nên cấu trúc thực tế không được mô tả như một chuỗi lớp cứng cho mọi request. Các file test và script DB là thành phần kiểm chứng/tooling, không phải trang chức năng người dùng.

### 3.2.3. Schema, tooling và tài liệu

Nguồn SQL và migration mô tả lược đồ theo phiên bản; scripts hỗ trợ khởi tạo, kiểm tra, migration và các tác vụ demo có điều kiện. Tài liệu API, kế hoạch và biên bản giúp liên hệ yêu cầu với phần cài đặt. Cấu trúc được tổng hợp theo trách nhiệm trong Bảng 3.2, không liệt kê `node_modules`, build, cấu hình bí mật hoặc bản sao lưu dữ liệu.

**Bảng 3.2. Module triển khai và chức năng phụ trách**

| Vùng/module | Chức năng phụ trách | Liên hệ yêu cầu Chương 2 |
|---|---|---|
| `frontend/src/pages`, `layouts`, `components` | Trang nghiệp vụ, bố cục theo vai trò, biểu mẫu/dialog và vùng dùng chung | Giao diện của YC-01–YC-15, tùy phân hệ |
| `frontend/src/data`, `lib`, `App.jsx`, `main.jsx` | Provider, API client, điều hướng và logic trình bày | Xác thực, dữ liệu theo nhóm và phản hồi tương tác |
| `backend/src/routes`, `middleware`, `controllers` | Hợp đồng HTTP, kiểm quyền/đầu vào, chuyển xử lý và phản hồi | Điểm truy cập, PC-01/PC-04 |
| `services/booking.js`, `dispatch.js`, `care.js`, `shifts.js` | Tạo lịch, điều phối, chăm sóc, quản lý ca | YC-04–YC-09 |
| `services/depositStore.js`, `deposits.js`, `paymentTransfers.js`, `paymentSandbox.js` | Cọc, hướng dẫn chuyển khoản và mô phỏng có phân chế độ | YC-10 và phần thanh toán liên quan |
| `services/invoices.js`, `complaints.js`, `reports.js` | Hóa đơn, thu/hoàn, khiếu nại và tổng hợp | YC-11, YC-12, YC-14 |
| Auth/Admin controller, reset/email service | Phiên, tài khoản, mật khẩu tạm và khôi phục | YC-01, YC-15; giới hạn SMTP riêng |
| `lib/scheduling.js`, `money.js`, `config/db.js` | Khả thi khoảng, phép tính tiền, pool và transaction | PC-01–PC-03/PC-05 |
| `thu_cung.sql`, `migrations`, `backend/scripts` | Schema, lịch sử/checksum và tooling DB | Toàn vẹn và quản lý phiên bản |
| `backend/test`, `frontend/test`, `docs`, `plans` | Ca thử, hướng dẫn, biên bản và truy vết | PC-07; bằng chứng đánh giá theo từng mốc |

*Nguồn: nhóm đối chiếu cấu trúc và file hiện có. Dãy YC/PC là mã yêu cầu do báo cáo lập, không phải tên module trong mã.*

## 3.3. Cài đặt cơ sở dữ liệu

### 3.3.1. Khởi tạo và migration có kiểm soát

Tooling nhận `thu_cung.sql` là version logic 000, sau đó áp các file 001–008 theo thứ tự, ghi tên/checksum và thời điểm vào bảng lịch sử. Việc kiểm tra schema/readiness giúp trả thông báo phù hợp khi DB chưa theo kịp mã. Lịch sử đã áp không được coi là chỗ để sửa lại SQL cũ tùy ý.

Các biên bản 23–24/10 mô tả kiểm tra và nâng cấp trên bản sao trước khi thay DB phát triển; biên bản khôi phục local cập nhật việc áp 002–005 sau backup/thử copy. Các đợt cọc và reset tiếp tục có kiểm tra phần mở rộng 006–008. Trình tự này là lịch sử đã ghi nhận, không phải lệnh migration vừa thực thi ngày 10/11; chương không yêu cầu chạy lại schema gốc hoặc seed lên DB đang sử dụng.

### 3.3.2. Dữ liệu kiểm thử và ràng buộc

Fixture trên DB mới tạo các đối tượng phục vụ điều kiện kiểm tra: tài khoản theo nhóm, hồ sơ, dịch vụ, ca và dữ liệu cần cô lập một phân hệ. Bài hành trình thực hiện các chuyển nghiệp vụ qua HTTP trong phạm vi biên bản, không dùng việc sửa SQL ép trạng thái làm bằng chứng giao diện đã xử lý thành công. Nhãn Demo trên ảnh và ghi chú biên bản giúp phân biệt dữ liệu này với thông tin thực tế.

Khóa, CHECK, UNIQUE và EXCLUDE phối hợp với kiểm tra service như đã phân tích ở Chương 2. Kiểm chứng cần xem cả phản hồi và dữ liệu sau thao tác: lịch/chi tiết có cùng rollback, giao dịch không ghi lặp, thu/hoàn không vượt hạn mức. Khả năng giao dịch và ràng buộc của PostgreSQL cung cấp cơ sở kỹ thuật [19]; tính đúng của cách áp dụng được đánh giá bằng ca thử Thế Giới Thú Cưng, không tự suy từ tên hệ quản trị.

### 3.3.3. Kiểm chứng và giới hạn

Hồ sơ kiểm tra DB cũ ghi nhận restore bản sao, so số dòng, metadata và hash giá trị các cột cũ trước/sau các bước nâng cấp được phép. Mốc Admin 07/11 có kiểm tra read-only PostgreSQL 17.11 với 22 bảng public, gồm 21 bảng ứng dụng và lịch sử; 9 checksum 000–008 khớp nguồn tại mốc đó. Đây là hai loại bằng chứng bổ sung nhau, không phải một lần truy vấn DB mới trong báo cáo.

Giữ nguyên hash dữ liệu chứng minh phạm vi giá trị được so không bị thay đổi, chưa chứng minh mọi bản ghi lịch sử đúng giờ nghiệp vụ hoặc đúng chứng từ. Chưa có phép đo phục hồi sự cố toàn hệ thống hay xác nhận sao lưu tự động qua giao diện Admin. Phần schema đầy đủ được mô tả bằng bảng ở Chương 2; Hình 2.18 vẫn để trống cho tác giả tự chèn theo yêu cầu.

## 3.4. Cài đặt chức năng khách hàng

### 3.4.1. Đăng ký, đăng nhập và hồ sơ thú cưng

Khách có thể đăng ký, đăng nhập và sử dụng vùng hồ sơ theo tài khoản được xác thực. Luồng đăng nhập kết hợp kiểm tra mật khẩu, trạng thái, token và yêu cầu đổi mật khẩu tạm khi có. Hồ sơ thú cưng liên kết chủ nuôi; việc đọc/sửa phải giữ quyền sở hữu và các điều kiện dữ liệu của API.

<!-- CHEN_HINH_3_1: Giao diện đăng ký và đăng nhập; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.1. Giao diện đăng ký và đăng nhập**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

<!-- CHEN_HINH_3_2: Quản lý hồ sơ thú cưng; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.2. Quản lý hồ sơ thú cưng**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Nhóm auth/hồ sơ có bằng chứng tích hợp lịch sử về validation, sở hữu và phiên; điều đó khác nghiệm thu mọi thao tác CRUD trên mọi giao diện. Ảnh đăng ký ứng viên chỉ cho thấy một phần biểu mẫu và lỗi trùng số điện thoại, chưa đủ minh họa trọn đăng ký/đăng nhập nên không chọn để lấp Hình 3.1. Hai vị trí được để trống để bổ sung ảnh phù hợp, không dùng wireframe như ảnh kết quả chạy.

### 3.4.2. Đặt lịch, cọc và theo dõi lịch

Giao diện đặt lịch tổ chức việc chọn thú cưng, dịch vụ rồi ngày/giờ và xác nhận. Giờ khả dụng phụ thuộc tổng thời lượng và nguồn lực; khi không có ca, người dùng nhận phản hồi để chọn ngày khác hoặc liên hệ cơ sở. Hình 3.3 minh họa đúng tình huống không có ca, không phải một lần đặt thành công. Ngày trong ô nhập là dữ liệu biểu mẫu, không chứng minh ngày chụp ảnh.

![UI-3.3 — Đặt lịch và chọn ngày giờ khả dụng](<D:/dich_vu_thu_cung/.cache/payment-sandbox/booking-spacing-fixed.png>)

**Hình 3.3. Đặt lịch và chọn ngày giờ khả dụng**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh có sẵn, minh họa ngày không có ca; ngày trên biểu mẫu không xác định ngày chụp.*

Khi chính sách cọc được bật và đã được chấp nhận, hệ thống lưu thông tin cọc theo lịch. Hình 3.4 cho thấy một trạng thái demo đã nhận cọc nhưng lịch còn chờ xác nhận; hai trạng thái này không được gộp. Ảnh ghi rõ sandbox và khoản 45.000 đồng mô phỏng, không xác nhận có tiền thật chuyển vào tài khoản nhận.

![UI-3.4 — Thông tin đặt cọc và trạng thái sau đặt lịch](<D:/dich_vu_thu_cung/.cache/payment-sandbox/deposit-paid-preview.png>)

**Hình 3.4. Thông tin đặt cọc và trạng thái sau đặt lịch**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh sandbox có sẵn; cọc 45.000 đồng là mô phỏng, lịch còn chờ xác nhận.*

Khách theo dõi lịch, hủy hoặc đổi theo đường xử lý được cấp và điều kiện chính sách. Khi gửi yêu cầu tạo lịch, server vẫn kiểm lại dưới khóa dù giao diện đã hiển thị một giờ có thể chọn. Các ca tranh chỗ và rollback là bằng chứng phù hợp hơn một ảnh ô giờ cho kết luận kiểm soát công suất. Chưa có cơ chế tự giải phóng chỗ của mọi lịch chưa cọc; giới hạn này được giữ khi đánh giá khả năng vận hành.

### 3.4.3. Hóa đơn, đánh giá và khiếu nại

Khách có trang xem hóa đơn và khiếu nại của mình. Đánh giá gắn với lịch hoàn tất và giới hạn một đánh giá cho lịch theo quy tắc; khiếu nại tiếp nhận nội dung và lịch, còn chủ/hóa đơn được xác định tại server. Khách không được tự gửi vai trò hoặc trạng thái để biến một yêu cầu mới thành khiếu nại đã xử lý.

<!-- CHEN_HINH_3_5: Khách hàng gửi và theo dõi khiếu nại; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.5. Khách hàng gửi và theo dõi khiếu nại**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Biên bản ngày 05/11 ghi nhóm refunds 9 PASS trên DB mới, gồm quyền sở hữu và gửi lặp tuần tự/đồng thời. Cải tiến ngày 08/11 bổ sung bỏ qua phản hồi tải cũ và nút thử lại khi lỗi. Các mốc frontend có lint/test/build đạt, nhưng chưa có QA trình duyệt đủ ba viewport cho trang khiếu nại. Vì vậy, chức năng API và mức hoàn thiện giao diện được đánh giá riêng; Hình 3.5 tiếp tục để trống.

## 3.5. Cài đặt chức năng nhân viên chăm sóc

### 3.5.1. Xem lịch và thông tin tiếp nhận

Trang chăm sóc cung cấp lịch được giao, ca và thông tin thú cưng cần cho tiếp nhận. Cả truy vấn lịch và việc đọc hồ sơ liên quan có kiểm tra người được phân công. Nhân viên không được dùng vai trò chăm sóc để xem tự do toàn bộ dữ liệu khách hoặc điều phối lịch thay lễ tân.

Ghi chú sức khỏe được trình bày như thông tin hỗ trợ từ hồ sơ/quá trình phục vụ, không phải kết luận chẩn đoán của phần mềm. Việc biết trạng thái lịch và dịch vụ giúp nhân viên xác định công việc được phép làm tiếp. Các mốc API và QA trong biên bản ca/chăm sóc hỗ trợ kết luận về phạm vi thao tác đã thử, chưa thay kiểm tra mọi giao diện và điều kiện ngoài thực tế.

### 3.5.2. Bắt đầu, cập nhật chi tiết và hoàn tất

Luồng chăm sóc phân biệt bắt đầu lịch, cập nhật từng dịch vụ và kết thúc toàn lịch. Người được giao chỉ bắt đầu khi lịch sẵn sàng, đúng ngày nghiệp vụ và các điều kiện nguồn lực/cọc phù hợp. Hoàn tất từng dòng dịch vụ là điều kiện trước khi lịch được chuyển hoàn thành.

![UI-3.6 — Tiến trình và hoàn tất dịch vụ chăm sóc](<D:/dich_vu_thu_cung/.cache/local-run/stage8-care-completed.png>)

**Hình 3.6. Tiến trình và hoàn tất dịch vụ chăm sóc**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh demo lịch sử; không phải lần nghiệm thu mới ngày 10/11/2026.*

Hình 3.6 là ảnh demo lịch sử, thấy lịch hoàn thành và các dịch vụ đã cập nhật. Bằng chứng kiểm thử còn có ca chặn kết thúc khi chi tiết chưa xong, thao tác sai người và thay đổi ca làm mất bao phủ. Ảnh minh họa một trạng thái sau xử lý, không tự chứng minh mọi bước đã được tự động kiểm thử hoặc cùng giao diện với bản nâng cấp gần nhất.

### 3.5.3. Không đủ điều kiện phục vụ

Khi phát hiện vấn đề trước bắt đầu, nhân viên nhập lý do và gửi thông tin tới tiếp nhận. Mã giữ thông tin chờ xử lý, chặn bắt đầu trong điều kiện đó và để nhân sự có quyền liên hệ khách, hủy hoặc đổi lịch theo luồng riêng. Việc báo vấn đề không tự ghi `DaHuy` và không tạo phê duyệt hoàn tiền.

<!-- CHEN_HINH_3_7: Thông báo thú cưng không đủ điều kiện phục vụ; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.7. Thông báo thú cưng không đủ điều kiện phục vụ**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Nhóm kiểm thử ca/chăm sóc có tình huống ngoại lệ này trong mã và biên bản cấp nhóm. Tuy nhiên chưa có ảnh ngoại lệ được chọn tương ứng, nên Hình 3.7 để trống. Quyết toán dịch vụ đang làm dở chưa được giải quyết đầy đủ; không sử dụng nhánh trước bắt đầu để tuyên bố hỗ trợ mọi trường hợp dừng giữa quá trình.

## 3.6. Cài đặt chức năng lễ tân

### 3.6.1. Đặt tại quầy và điều phối lịch

Đặt tại quầy hỗ trợ tìm khách/thú cưng đã có hoặc ghi nhận thông tin mới trong cùng quy trình tạo lịch. Khi tạo tài khoản tạm, thông tin bàn giao cần được phân biệt với tài khoản thật đã có, và các bản ghi mới phải rollback nếu bước tạo lịch thất bại. Luồng tại quầy không được bỏ qua khả năng phục vụ chỉ vì tác nhân là nhân sự.

![UI-3.8 — Điều phối lịch hẹn và phân công nhân viên](<D:/dich_vu_thu_cung/.cache/local-run/stage7-assigned.png>)

**Hình 3.8. Điều phối lịch hẹn và phân công nhân viên**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh demo lịch sử; không tự ghép cùng fixture với ảnh chăm sóc chỉ từ mã lịch.*

Hình 3.8 minh họa lịch demo đã phân công. Mã và nhóm dispatch còn tách giữ chờ, từ chối và phân công thành ba quyết định loại trừ; từ chối dùng `TuChoi`, khác hủy. Ảnh điều phối và ảnh chăm sóc có thể thuộc các lần dựng fixture khác nhau; mã lịch nhỏ như `#1` không đủ để nối chúng thành một hành trình duy nhất. Nhận xét về hành trình phải dựa vào bài journey và biên bản tương ứng.

### 3.6.2. Lập hóa đơn và thu tiền

Lễ tân lập hóa đơn từ lịch và các chi tiết hoàn tất, áp giảm giá hợp lệ, giữ giá/tên theo snapshot và khấu trừ cọc khi có. Mỗi lần thu kiểm nợ hiện hành, phương thức và khóa chống lặp. Tiền khách đưa được tách khỏi số ghi nhận, giúp thể hiện tiền thừa mà không làm tăng khoản thu vượt nghĩa vụ.

![UI-3.9 — Hóa đơn và các khoản đã thu, đã hoàn](<D:/dich_vu_thu_cung/.cache/local-run/stage9-invoice-after-refund.png>)

**Hình 3.9. Hóa đơn và các khoản đã thu, đã hoàn**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh hóa đơn demo: thu 400.000, hoàn 100.000, nợ 0; không phải giao dịch thật.*

Hình 3.9 cho thấy hóa đơn demo đã thu 400.000 đồng, hoàn 100.000 đồng và còn nợ 0; trạng thái hoàn một phần không mở lại công nợ. Đây là tình huống kiểm thử được lưu trong ảnh/biên bản, không phải hóa đơn của cơ sở kinh doanh thật. Chuyển khoản có cấu hình VietQR là hướng dẫn nhận tiền và nhân sự xác nhận thực nhận; việc tải QR hoặc khách báo đã chuyển chưa ghi nhận ngân hàng đã đối soát tự động.

### 3.6.3. Tiếp nhận khiếu nại và thực chi hoàn

Lễ tân tiếp nhận vấn đề, theo dõi quyết định và thực chi trong phạm vi được cấp. Sau khi quản lý duyệt, khoản hoàn vẫn ở trạng thái chờ. Nhân sự thực chi phải ghi phương thức, kết quả, xác nhận và chứng từ phù hợp; chi thất bại chưa làm giảm tiền còn phải hoàn hoặc kết thúc khiếu nại.

![UI-3.10 — Phiếu thực chi hoàn tiền](<D:/dich_vu_thu_cung/.cache/local-run/stage10-refund-receipt.png>)

**Hình 3.10. Phiếu thực chi hoàn tiền**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Phiếu demo có chứng từ UI-DEMO-REFUND-ONLY; không chứng minh đã chuyển tiền thật.*

Phiếu trong Hình 3.10 có dấu chứng từ `UI-DEMO-REFUND-ONLY`, minh họa thực chi demo 100.000 đồng. Phiếu không chứng minh đã có chuyển khoản thật hoặc chữ ký nhận tiền thực tế. Nhóm kiểm thử tài chính còn kiểm tra hai yêu cầu chi cạnh tranh, replay và lỗi thông báo làm rollback; các cơ chế đó cần xem cùng điều kiện trong service, không chỉ dựa vào việc in được một phiếu.

## 3.7. Cài đặt chức năng quản lý

### 3.7.1. Ca làm việc và danh mục dịch vụ

Quản lý và Admin có quyền tạo/sửa/hủy mềm ca theo ngày và giờ. Quy tắc không chỉ chặn ca chồng nhau mà còn kiểm việc thu hẹp/hủy có làm mất khả năng phục vụ lịch đang mở hay không. Biên bản ca/chăm sóc ghi nhận tình huống rút ca gây mất lịch bị chặn, còn sửa hợp lệ được chấp nhận.

<!-- CHEN_HINH_3_11: Quản lý ca làm việc và cảnh báo ràng buộc; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.11. Quản lý ca làm việc và cảnh báo ràng buộc**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Danh mục quản lý tên, mô tả, giá hiện hành, thời lượng và tình trạng cung cấp theo chức năng đã cài đặt. Dịch vụ ngừng bán không được đặt mới nhưng lịch và hóa đơn lịch sử tiếp tục có ý nghĩa. Thử nghiệm API danh mục có trong nhóm reports-admin; chưa có bộ ảnh CRUD và ca phù hợp để chèn vào hai vị trí tương ứng.

<!-- CHEN_HINH_3_12: Danh mục dịch vụ và bảng giá; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.12. Danh mục dịch vụ và bảng giá**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

### 3.7.2. Quyết định xử lý khiếu nại và duyệt hoàn

Quyết định của quản lý gồm từ chối, khắc phục hoặc duyệt hoàn. Khi hoàn, hạn mức được tính sau các khoản đã hoàn thành công và khoản duyệt đang chờ chi. Điều này tránh duyệt nhiều yêu cầu độc lập cùng sử dụng một phần tiền còn lại của hóa đơn.

<!-- CHEN_HINH_3_13: Duyệt hoàn và trạng thái chờ thực chi; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.13. Duyệt hoàn và trạng thái chờ thực chi**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Bằng chứng nhóm refunds phân biệt rõ duyệt chưa chi, chi thất bại giữ chờ và chi thành công cập nhật tiền/trạng thái. Các quyết định không hoàn kết thúc theo phương án mà không tạo dòng tiền hoàn. Hình 3.13 được giữ trống vì cần ảnh đúng thời điểm đã duyệt nhưng chưa chi; phiếu thực chi ở Hình 3.10 không được dùng thay cho bằng chứng trạng thái này.

### 3.7.3. Thống kê và báo cáo theo kỳ

Báo cáo phân biệt giá trị dịch vụ/hóa đơn với tiền thu, hoàn và thực thu theo ngày giao dịch. Cọc được xét theo sự kiện nhận/chi và việc áp vào hóa đơn không tạo thêm khoản thu lần nữa. Khi chưa có dữ liệu chi phí, chỉ tiêu thực thu không được đổi tên thành lợi nhuận.

![UI-3.14 — Báo cáo thu, hoàn và thực thu](<D:/dich_vu_thu_cung/.cache/local-run/stage11-net-report.png>)

**Hình 3.14. Báo cáo thu, hoàn và thực thu**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Ảnh báo cáo demo lịch sử: thu 400.000, hoàn 100.000, thực thu 300.000; không là lợi nhuận.*

Ảnh bảng lịch sử minh họa 400.000 đồng thu trừ 100.000 đồng thực chi hoàn bằng 300.000 đồng thực thu. Biên bản bổ sung biểu đồ ngày/tháng/quý/năm mô tả tổng hợp kỳ và các mốc không giao dịch có giá trị 0. Hình 3.15 là preview demo của một tập dữ liệu khác, với 1.145.000 đồng thu, 200.000 đồng hoàn và 945.000 đồng thực thu; không cộng hoặc đối chiếu trực tiếp các số đó với fixture 400.000 đồng ở ảnh trước.

![UI-3.15 — Biểu đồ báo cáo theo kỳ](<D:/dich_vu_thu_cung/.cache/payment-sandbox/revenue-quarter-preview.png>)

**Hình 3.15. Biểu đồ báo cáo theo kỳ**

*Nguồn: ảnh chạy thử Thế Giới Thú Cưng có sẵn trong hồ sơ cục bộ. Preview biểu đồ demo của tập dữ liệu khác: thu 1.145.000, hoàn 200.000, thực thu 945.000 đồng.*

Preview minh họa biểu đồ và vùng chi tiết đã có, chưa thay bộ ảnh đầy đủ của từng kỳ hoặc kiểm tra mọi thiết bị. Báo cáo ngày chưa có bằng chứng chia dữ liệu theo giờ. Các số demo và nhận xét giao diện chỉ hỗ trợ đánh giá trong kịch bản, không đo tăng doanh thu hoặc mức sử dụng dịch vụ thực tế của thị trường.

## 3.8. Cài đặt chức năng Admin

### 3.8.1. Tài khoản, tìm kiếm và bộ lọc

Trang tài khoản được bổ sung bốn KPI: tổng tài khoản, đang hoạt động, đang dùng mật khẩu tạm và bị khóa. Tìm kiếm hỗ trợ thông tin liên hệ cùng `@username`; bộ lọc theo năm nhóm và trạng thái dùng vai trò/chức vụ hiện hành. KPI tổng được truy vấn tách với danh sách đang lọc để không nhầm tổng hệ thống với số dòng kết quả.

<!-- CHEN_HINH_3_16: KPI, tìm kiếm và bộ lọc tài khoản Admin; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.16. KPI, tìm kiếm và bộ lọc tài khoản Admin**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Theo tiến độ 07/11, phần nâng cấp có mã và kết quả lint/test/build nền, nhưng chưa kiểm HTTP trên PostgreSQL test riêng và chưa QA trình duyệt cho đúng phần mới. Ảnh `stage11-admin.png` là bản cũ nên không dùng làm bằng chứng đã có bốn KPI hoặc bộ lọc mới. Hình 3.16 để trống; kết luận đúng mức là đã cài đặt trong mã, còn thiếu nghiệm thu riêng.

### 3.8.2. Mật khẩu tạm, khóa và thay đổi vai trò

Các thao tác tài khoản lõi gồm tạo tài khoản nội bộ, đặt lại mật khẩu tạm, khóa/mở và cập nhật quyền trong phạm vi cho phép. Token version hỗ trợ thu hồi phiên; mật khẩu tạm yêu cầu đổi trước nghiệp vụ. Mã có các chốt chặn liên quan trạng thái nhân viên và lịch, nhằm tránh thay đổi nguồn lực mà không kiểm tra hậu quả.

<!-- CHEN_HINH_3_17: Cảnh báo ràng buộc khi quản trị tài khoản; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 3.17. Cảnh báo ràng buộc khi quản trị tài khoản**

*Vị trí để trống — tác giả tự chèn ảnh giao diện thật phù hợp sau.*

Biên bản reports-admin hỗ trợ phạm vi API lõi đã thử trước đó. Tuy nhiên drawer chi tiết, cảnh báo đầy đủ và ma trận quyền trực quan trong yêu cầu nâng cấp không được xem là hoàn tất chỉ vì có guard server hoặc ảnh trang tài khoản cũ. Hình 3.17 để trống cho ảnh cảnh báo phù hợp; không tạo popup giả để thay bằng chứng giao diện.

### 3.8.3. Giới hạn quản trị hiện tại

Các trang nhật ký, cấu hình và sao lưu còn dữ liệu mẫu/fallback hoặc thiếu API/persistence đầy đủ tương ứng. Nhật ký lịch hẹn có thật chỉ lưu hoạt động của lịch, khác audit bảo mật tổng thể. Console request log, `/health` và `/ready` cũng không thay dashboard giám sát thực tế hoặc cơ chế sao lưu qua Admin.

Middleware hiện cho Admin quyền vận hành tiếp nhận/quản lý, còn thực hiện chăm sóc thuộc người có chức vụ và phân công phù hợp. Do đó, mô hình Admin tách hoàn toàn khỏi nghiệp vụ vẫn là định hướng cần triển khai, chưa phải kết quả đã đạt. Những khác biệt này được đưa vào đánh giá và hướng hoàn thiện, không gộp thành một tuyên bố “Admin đầy đủ”.

## 3.9. Kịch bản và phương pháp kiểm thử

### 3.9.1. Thiết kế testcase từ yêu cầu

Ca kiểm tra được liên hệ với các mã YC/PC ở Chương 2. Phân hoạch tương đương và phân tích giá trị biên cung cấp căn cứ chọn đầu vào [2]; trong Thế Giới Thú Cưng, nhóm còn xét người dùng, sở hữu, trạng thái và sự kiện đồng thời. Ví dụ, giờ trước/trong/sau ca, hai khoảng vừa chạm/trùng, số tiền bằng/vượt nợ và đúng/sai chủ là những miền cần được phân biệt.

Bảng 3.3 diễn giải các case đã định vị trong mã. Cột kỳ vọng nêu điều kiện cần kiểm, chưa phải một lần chạy PASS riêng ngày biên soạn. Các mã KT kế thừa hồ sơ kiểm thử G0 để liên hệ được với file và biên bản cấp nhóm.

**Bảng 3.3. Các testcase tiêu biểu và điều kiện kỳ vọng**

| Mã/yêu cầu | Tiền điều kiện và thao tác | Kỳ vọng kiểm tra | Case/file nguồn |
|---|---|---|---|
| KT-01 — YC-04, PC-03 | DB test chỉ còn khả năng nhận một lịch; gửi hai yêu cầu cạnh tranh | Một 201, một 409; không tăng số lịch vượt nguồn lực | `booking.integration.test.js`: two requests for the final slot |
| KT-02 — YC-04 | Ngày không có ca chăm sóc; tra và gửi yêu cầu | Không có giờ khả dụng; tạo lịch bị từ chối | Booking: a day without care shifts |
| KT-03 — YC-02/04, PC-04 | Đầu vào sai hoặc thú cưng không thuộc khách | Lỗi dữ liệu/quyền phù hợp; không tạo lịch ngoài sở hữu | Booking: strict validation and customer ownership |
| KT-04 — PC-02 | Ép lỗi khi INSERT chi tiết sau bước ghi trước đó | Toàn bộ bản ghi trong transaction rollback, phản hồi không lộ chẩn đoán nội bộ | Booking: forced detail INSERT failure |
| KT-05 — YC-06, PC-03 | Cùng lịch chờ, gửi từ chối và phân công cạnh tranh | Hai quyết định không cùng thành công; trạng thái sau nhất quán | `dispatch.integration.test.js`: concurrent rejection and assignment |
| KT-06 — YC-06/07 | Có các lịch chờ cùng cạnh tranh nhân sự; xem/chọn ứng viên | Lựa chọn không làm mất khả năng bố trí các lịch còn lại | Dispatch: candidate selection preserves feasibility |
| KT-07 — PC-02 | Ép lỗi thông báo trong phân công | Phân công và các thông báo liên quan cùng rollback | Dispatch: notification failure rolls assignment back |
| KT-08 — YC-12, PC-04/05 | Khách gửi khiếu nại, thử giả chủ/hóa đơn/trạng thái và gửi lặp | Đúng chủ; dữ liệu liên quan do server xác định; gửi lặp theo quy tắc giữ cùng yêu cầu | `refunds.integration.test.js`: customer submits only for an owned booking |
| KT-09 — YC-12 | Hóa đơn demo đã thu 400.000; duyệt 100.000, thử chi thất bại rồi thành công | Duyệt chưa giảm tiền; thất bại giữ chờ; thành công là hoàn một phần | Refunds: approval is not payment; failed payout stays pending |
| KT-10 — YC-12, PC-03 | Nhiều khoản duyệt chờ và yêu cầu chi cạnh tranh | Reserve trừ khỏi hạn mức; tổng hoàn thành công không vượt phần được hoàn | Refunds: pending approvals reserve refundable balance |
| KT-11 — PC-05 | Hai yêu cầu chi cho cùng quyết định hoàn | Chỉ có một dòng hoàn thành công theo ràng buộc/logic | Refunds: two payout requests for one approval |
| KT-12 — PC-02 | Ép lỗi thông báo khi ghi hoàn thành công | Tiền, hóa đơn và khiếu nại cùng rollback | Refunds: failed notification rolls payout back |

*Nguồn: nhóm đối chiếu mã trong `backend/test`, hồ sơ `BANG_KIEM_THU_PETCARE.md`; kỹ thuật chọn ca tham khảo [2]. Tên case trong bảng được rút gọn, mã gốc và biên bản là đầu mối kiểm chứng.*

Các ca giao diện nhiều viewport, tải lớn hoặc gửi thư Mailtrap thật chưa được ghi PASS từ bảng kỳ vọng này. Nếu bổ sung các ca đó, cần có dữ liệu, môi trường, thao tác và kết quả riêng. Cách phân biệt kỳ vọng với thực thi giúp tránh biến một kế hoạch kiểm thử thành số liệu kết quả.

### 3.9.2. Unit, HTTP tích hợp và DB cô lập

Cả frontend và backend có script dùng `node --test`; tài liệu Node test runner là căn cứ sử dụng công cụ [17]. Kiểm tra đơn vị tập trung vào logic có thể cô lập như giờ nghiệp vụ, khả thi lịch, tiền/chính sách và xử lý trạng thái phía client. Kiểm thử tích hợp gửi HTTP tới backend thử và kiểm dữ liệu trong PostgreSQL mới riêng.

**Bảng 3.4. Môi trường và cách thực thi kiểm thử**

| Nhóm | Môi trường/cách thực thi được ghi | Cách đọc bằng chứng | Điều kiện cần giữ |
|---|---|---|---|
| Frontend unit | Tại `frontend`, `npm.cmd test`; script `node --test test/*.test.js` | Xem số test/fail/skip của đúng mốc | Không suy QA giao diện từ unit PASS |
| Frontend lint/build | `npm.cmd run lint`, `npm.cmd run build` | Exit và biên bản lint/build; số modules thuộc bản build | Build không là số testcase hoặc phần trăm chất lượng |
| Backend mặc định | Tại `backend`, `npm.cmd test`, không chỉ định DB test | Nhóm cần DB có thể SKIP; đọc riêng PASS/FAIL/SKIP | Không coi SKIP là tích hợp đạt |
| Backend tích hợp | Từng file, thí dụ `node --test test/booking.integration.test.js` | Biên bản nhóm với database/snapshot/lần chạy tương ứng | Mỗi nhóm/lần dùng DB mới theo guard; không dùng chung một URL cho toàn bộ lượt |
| Setup DB | Tooling kiểm đích test, tạo schema/migration và fixture theo bài | Xem điều kiện thiết lập, lỗi và trạng thái dữ liệu | Không seed hoặc chạy bài ghi trên DB đang sử dụng |
| HTTP journey | Bài `journey.integration.test.js`, danh tính fixture, các bước nghiệp vụ qua HTTP | Kết quả hành trình API trong đúng biên bản | QA trình duyệt là bằng chứng riêng |
| SMTP loopback | Fixture thu thư cục bộ và DB reset riêng | Kiểm nội dung/quy tắc token và phản hồi HTTP | Không suy thư đã tới Mailtrap hoặc hộp thư bên ngoài |
| Trình duyệt thủ công | Ứng dụng và DB demo được biên bản chỉ rõ | Mô tả thao tác, ảnh và điều kiện đạt tại mốc đó | Không mở rộng thành mọi màn hình/thiết bị đã QA |

*Nguồn: scripts package, mã test, `backend/test/README.md` và các biên bản dự án; công cụ tham khảo [17]. Các lệnh trên mô tả cách thực hiện, không được chạy lại trong đợt viết này.*

Hướng dẫn test lõi còn liệt kê bộ 9 nhóm và số frontend cũ; các phần bổ sung về cọc, chuyển khoản, reset và khiếu nại phải đọc thêm biên bản riêng. Kiểm kê G0 có 24 file test backend, trong đó 13 file tích hợp, cùng 8 file frontend; số file hoặc số khai báo tĩnh không phải số PASS. Báo cáo chưa có bằng chứng collection Postman đã thực thi, nên không gắn nhãn Postman cho kết quả HTTP của Node.

### 3.9.3. Kiểm thử tranh chỗ, rollback và giao dịch

Các case đồng thời đánh giá việc nhiều yêu cầu cùng sử dụng một trạng thái ban đầu: chỗ cuối, phân công/từ chối, nợ còn lại hoặc hạn mức hoàn. Ngoài phản hồi HTTP, cần kiểm số bản ghi và trạng thái sau cùng. Hai phản hồi thành công trong một tình huống chỉ cho phép một kết quả là dấu hiệu phải xem lại, dù giao diện đơn lẻ vẫn hoạt động.

Rollback được kiểm bằng lỗi có chủ đích trong DB thử, như lỗi ghi chi tiết hoặc thông báo. Mục đích là xác định các phần đã ghi trong cùng quyết định có trở về trạng thái trước đó hay không. Với tiền, cần thêm gửi lại cùng khóa và khóa giống nhưng nội dung khác, thu/chi thất bại và reserve từ các quyết định đang chờ. Các kiểm tra này hỗ trợ nhận xét tính nhất quán trong tình huống được thử; chưa phải phép chứng minh cho mọi lịch hoặc mọi mức tải.

### 3.9.4. Quy ước ghi nhận kết quả

Mỗi kết quả cần gắn thời điểm, phạm vi mã, môi trường, lệnh/nhóm và quy ước đếm. PASS là kết quả của lượt thực thi đã được ghi; FAIL cần nêu nguyên nhân và việc chạy lại; SKIP thể hiện chưa thực hiện điều kiện tích hợp trong lượt đó. Khi Node có parent test và subtest, số tổng dùng đúng quy ước biên bản, không cộng thêm parent lần nữa hoặc xem chúng là cùng số chức năng độc lập.

Chương này tái sử dụng biên bản, chưa kiểm toán raw log mọi case và không chạy ứng dụng ngày 10/11. Các lần chạy chồng cùng nhóm được giữ riêng. Đặc biệt, 83 PASS tích hợp lõi tháng 10 và 83 PASS backend mặc định ngày 07/11 là hai con số thuộc hai phạm vi khác nhau; số bằng nhau không cho phép thay thế bằng chứng. Kết quả giao diện, test logic và build cũng được trình bày tách theo loại kiểm chứng.

## 3.10. Kết quả kiểm thử

### 3.10.1. Tổng hợp các mốc thực thi

Bảng 3.5 ghi các kết quả cuối trong biên bản theo đợt. Các đợt không được cộng thành một tổng chung vì có nhóm chạy lại, mã đã thay đổi và phạm vi khác nhau. Cột giới hạn là một phần của kết quả, giúp tránh gán một lần PASS lịch sử cho toàn bộ workspace hiện tại.

**Bảng 3.5. Kết quả kiểm thử theo từng đợt**

| Mốc/phạm vi | Kết quả được biên bản ghi | Bằng chứng | Giới hạn |
|---|---|---|---|
| 23–24/10 — backend lõi mặc định | 67 PASS, 0 FAIL, 9 nhóm tích hợp SKIP | Báo cáo kiểm thử hệ thống | Chưa chạy các nhóm cần DB trong lượt mặc định |
| 23–24/10 — 9 nhóm tích hợp DB mới riêng | 83 PASS, 0 FAIL, gồm parent theo biên bản | Cùng báo cáo, bảng nhóm DB/auth/booking/dispatch/care/invoices/refunds/reports-admin/journey | Kết quả cuối sau xử lý lỗi fixture; chưa bao gồm mọi mở rộng sau đó |
| 23–24/10 — frontend | 13 PASS; build 71 modules | Cùng báo cáo | Bộ frontend tại mốc cũ, không cộng với 31 test mốc mới |
| 25/10 — cọc và các nhóm hồi quy liên quan | 9 nhóm, 86 PASS, 0 FAIL, 0 SKIP, gồm parent | Biên bản đặt cọc và hủy lịch | Khác bộ 9 nhóm lõi; có nhóm chồng nhau với đợt trước |
| 25/10 — chuyển khoản thủ công | Transfers 9, invoices 8, deposits 12, sandbox 9: tổng trong đợt 38 PASS, 0 FAIL, 0 SKIP | Biên bản chuyển khoản, 4 DB mới riêng | Không chuyển tiền thật, không cộng tiếp 38 vào các đợt khác |
| 25/10 — reset và SMTP cục bộ | HTTP/SMTP loopback 13 PASS; hồi quy auth 10 PASS ở lượt riêng | Biên bản quên mật khẩu | Mailtrap thật BLOCKED; hai phạm vi không gộp thành nghiệm thu gửi thư ngoài |
| 05/11 — khiếu nại khách hàng | Nhóm refunds 9 PASS, gồm gửi lặp tuần tự/đồng thời | Tiến độ khiếu nại, các lần DB test mới | Gửi lặp được bổ sung; khác nhóm refunds 8 test ở mốc lõi |
| 07/11 — backend workspace | 83 PASS, 0 FAIL, 13 nhóm tích hợp SKIP | Báo cáo sắp xếp thư mục và khảo sát Admin | Không kiểm tích hợp DB trong lượt mặc định này |
| 07/11 — frontend workspace | 31 PASS, lint PASS, build 118 modules | Cùng báo cáo/tiến độ | Không chứng minh QA mọi UI hoặc phần Admin mới |
| 08/11 — cải tiến tải khiếu nại | Frontend lint, 31 test và build 118 modules PASS theo tiến độ | Tiến độ khiếu nại | Chưa QA trình duyệt ba viewport |

*Nguồn: các biên bản và tiến độ dự án đã đối chiếu; không có lần chạy test ứng dụng mới trong giai đoạn biên soạn.*

Biên bản lõi ghi nhận bài journey từng phát hiện race trong fixture đồng hồ; sau khi sửa cách ghi nguyên tử, nhóm đã chạy lại trên DB mới và ghi 8/8 ở lượt cuối. Vì vậy, số cuối không được dùng để xóa dấu vết lỗi trước sửa. Các kết quả sau mở rộng cũng không chứng minh toàn bộ test cũ đã chạy lại trên cùng một snapshot cuối duy nhất.

### 3.10.2. Kết quả theo nhóm chức năng

Đặt lịch và điều phối có bằng chứng cấp nhóm cho tranh chỗ, ca bao trọn, sở hữu, giữ chờ/từ chối/phân công và rollback. Chăm sóc/ca có thử người được giao, tiến trình chi tiết, ngoại lệ trước bắt đầu và thay đổi ca gây mất bao phủ. Những bằng chứng này trực tiếp liên hệ các điều kiện chấp nhận YC-04–YC-09, thay vì chỉ xác nhận route có thể truy cập.

Hóa đơn và hoàn có kiểm tra giá lịch sử, thu từng phần, tiền thừa, replay, không vượt tiền và duyệt khác chi. Bộ cọc và chuyển khoản bổ sung quy tắc snapshot, khấu trừ, chế độ nhận tiền và các kiểm tra liên quan theo biên bản riêng. Đánh giá phải giữ giới hạn cọc dư/chỗ chưa cọc và tích hợp thật chưa hoàn thiện.

Xác thực/hồ sơ và quản trị tài khoản lõi có bằng chứng API lịch sử; reset được kiểm trên HTTP và SMTP loopback. Khiếu nại khách được bổ sung kiểm chủ và gửi lặp. Với KPI/lọc Admin và một số UI mới, bằng chứng hiện chỉ tới mức mã cùng kiểm tra nền hoặc biên bản cải tiến; không tự chuyển thành nghiệm thu tính năng đầy đủ. Bảng testcase kỳ vọng không được dùng để tạo số PASS lẻ khi nguồn chỉ ghi tổng nhóm.

### 3.10.3. Hạng mục chưa thực hiện hoặc thiếu bằng chứng

**Bảng 3.6. Hạng mục chưa đủ bằng chứng**

| Hạng mục | Trạng thái được phép nêu | Phần thiếu/ảnh hưởng | Bước kiểm chứng phù hợp |
|---|---|---|---|
| 13 nhóm tích hợp ở lượt mặc định 07/11 | SKIP | Lượt đó chưa có DB test riêng cho từng nhóm | Chạy có kiểm soát trên DB mới, ghi snapshot và log |
| Admin KPI/lọc/Drawer/cảnh báo mới | Có mã một phần; chưa QA riêng đầy đủ | Chưa có HTTP DB riêng/trình duyệt và ảnh mới phù hợp | Checklist API/UI theo từng tính năng |
| Khiếu nại và toàn bộ UI đa thiết bị | Chưa có bằng chứng đầy đủ | Ba viewport và các luồng thao tác còn thiếu | Thao tác thật, ảnh đúng phiên bản và kết quả |
| Audit/config/backup/giám sát Admin | Chưa triển khai đầy đủ | Trang mẫu hoặc thiếu API/persistence/giám sát thật | Hoàn thiện backend, dữ liệu và kiểm tra tương ứng |
| Cọc dư, tự giải phóng chỗ, quyết toán làm dở | Chưa giải quyết đầy đủ | Có tình huống bị chặn hoặc cần xử lý riêng | Chốt nghiệp vụ, cài đặt và test ngoại lệ |
| Mailtrap bên ngoài | BLOCKED theo biên bản | Chưa cấu hình/nhận thư thực tế đầy đủ | Nghiệm thu đúng hộp thư sandbox và hành trình reset được phép |
| Merchant/webhook ngân hàng, hoàn tiền tự động | Chưa tích hợp hoàn chỉnh | Nhận tiền hiện cần nhân sự xác nhận hoặc sandbox | Tích hợp và kiểm chứng đầu cuối trong phạm vi được phép |
| Docker/production | Chưa có bằng chứng runtime/vận hành hoàn tất | Có cấu hình chưa thay build/up/khởi động lại | Kiểm trên môi trường triển khai thực tế |
| Tải, hiệu năng và khảo sát thực địa | Chưa thực hiện/đủ bằng chứng | Không có số thời gian đáp ứng, mức tải hay hài lòng đại diện | Thiết kế phép đo và thu dữ liệu riêng |
| Ảnh bản mới và bố cục in | Chưa đủ | Nhiều vị trí để trống, ảnh demo có giới hạn | Bổ sung ảnh; kiểm độ đọc khi render Word/PDF |

*Nguồn: tiến độ Admin, khiếu nại, cọc, SMTP, báo cáo kiểm thử và hồ sơ ảnh. Các bước tiếp theo là đề xuất kiểm chứng, chưa được đánh dấu đã thực hiện.*

## 3.11. Đánh giá mức độ đáp ứng mục tiêu

### 3.11.1. Đối chiếu mục tiêu và yêu cầu

Đánh giá tập trung vào kết quả có thể truy vết. “Có bằng chứng trong phạm vi thử nghiệm” nghĩa có case/biên bản phù hợp cho một phần yêu cầu; “chưa đầy đủ” giữ lại phần chưa kiểm hoặc chưa cài đặt. Đây là nhận xét định tính theo yêu cầu, không phải thang điểm hay tỷ lệ nghiệm thu được tự tính từ số màn hình.

**Bảng 3.7. Mức đáp ứng mục tiêu và yêu cầu**

| Mục tiêu/nhóm yêu cầu | Thành phần và bằng chứng | Mức đáp ứng trong phạm vi | Phần còn lại |
|---|---|---|---|
| Tài khoản, hồ sơ, danh mục — YC-01–03 | Auth/pet/catalog; biên bản API và hồi quy | Có chức năng lõi và kiểm tra dữ liệu/quyền | UI CRUD, mật khẩu tạm và mọi thiết bị chưa QA đầy đủ |
| Đặt lịch, điều phối, ca — YC-04–07 | Booking/scheduling/dispatch/shifts; case tranh chỗ, phân công và ca | Có bằng chứng các ràng buộc trọng tâm được thử | Chưa có phép đo tải, chưa tối ưu tự động phân công |
| Chăm sóc, hủy/đổi — YC-08–09 | Care/dispatch; tiến độ chi tiết và ngoại lệ | Có API/QA chính theo biên bản | Chưa quyết toán đầy đủ khi đang làm dở |
| Cọc, hóa đơn, thu/hoàn — YC-10–12 | Deposits/invoices/complaints; các đợt cọc, transfers và refunds | Có kiểm tra snapshot, chống lặp, hạn mức và duyệt/chi | Cọc dư/chỗ chưa cọc, merchant và đối soát tự động còn thiếu |
| Đánh giá, thông báo — YC-13 | Routes, journey và biên bản | Có chức năng gắn lịch/người nhận trong phạm vi | Tin hiện tải theo ứng dụng; chưa nhắc hẹn tự động đa kênh |
| Báo cáo — YC-14 | Reports, QA bảng và biểu đồ demo | Có đối chiếu thu/hoàn/thực thu theo mốc | Chưa là lợi nhuận hoặc dữ liệu kinh doanh thật |
| Admin — YC-15 | API tài khoản lõi; mã KPI/lọc và tiến độ nâng cấp | Lõi có bằng chứng; phần mới chưa đủ kiểm chứng | Drawer/cảnh báo/RBAC UI và audit/config/backup còn thiếu |
| Toàn vẹn/quyền — PC-01–05 | Case rollback, concurrent, owner/role/version và replay | Có bằng chứng theo các tình huống đã chạy | Chưa kiểm thử xâm nhập hoặc mọi cấu hình vận hành |
| Giao diện/truy vết/vận hành — PC-06–08 | Cấu trúc module, tài liệu, unit/lint/build và QA chọn lọc | Có nền tảng và hồ sơ; nghiệm thu chưa toàn diện | UI đủ thiết bị, tải, SMTP ngoài, Docker/production |

*Nguồn: nhóm đánh giá từ mục tiêu Mở đầu, YC/PC Chương 2 và các bằng chứng Chương 3. Không dùng kết quả nghiên cứu hệ thống khác để chấm Thế Giới Thú Cưng.*

Trong phạm vi thử nghiệm, các mục tiêu chức năng cốt lõi đã có phần cài đặt và bằng chứng phù hợp. Các công cụ Admin mở rộng, tích hợp bên ngoài và đánh giá vận hành vẫn chưa hoàn tất. Kết luận này cho phép xác định phần đã làm và công việc cần tiếp tục mà không chuyển số test PASS thành lời khẳng định hệ thống đã sẵn sàng cho mọi cơ sở sử dụng.

### 3.11.2. Tính đúng nghiệp vụ và toàn vẹn dữ liệu

Giá trị kỹ thuật thể hiện ở việc liên kết điều kiện nghiệp vụ với trạng thái và dữ liệu: lịch chưa đủ ca bị chặn, phân công không làm mất khả năng của lịch chờ, hóa đơn giữ snapshot và giao dịch hoàn chỉ ảnh hưởng tiền sau thực chi thành công. Các case cạnh tranh và rollback cung cấp bằng chứng cụ thể hơn việc một chuỗi thao tác đơn lẻ đi hết luồng.

Giao dịch và ràng buộc PostgreSQL là thành phần bảo vệ [19], nhưng phạm vi khóa, điều kiện sở hữu và cách tính tiền do ứng dụng quyết định. Các thử nghiệm đã ghi nhận hỗ trợ tính đúng trong đầu vào và lịch đã thử; chưa chứng minh mọi cấu hình dữ liệu, lịch bất thường hay tải dài hạn. Cần giữ khả năng truy vết từ nhận xét tới case/biên bản khi mở rộng hoặc sửa phần mềm.

### 3.11.3. Giá trị sử dụng và giới hạn suy luận

Thế Giới Thú Cưng tập hợp hồ sơ, dịch vụ, lịch, nguồn lực và giao dịch trong cùng luồng, hỗ trợ chuyển thông tin giữa khách, chăm sóc, tiếp nhận và quản lý. Việc tách duyệt/chi, trạng thái cọc và hóa đơn giúp thể hiện rõ trách nhiệm thao tác. Đây là giá trị sử dụng được phân tích từ chức năng đã cài đặt và tình huống demo.

Chưa có khảo sát đại diện hoặc phép so sánh trước/sau tại doanh nghiệp để định lượng giảm chờ, tiết kiệm nhân lực, tăng doanh thu hay mức hài lòng. Kết quả UAT/SUS hoặc nhận xét trong tài liệu liên quan thuộc hệ thống của các tác giả đó; không chuyển thành kết quả Thế Giới Thú Cưng. Phạm vi đánh giá hiện phù hợp một đồ án đã kiểm chứng các luồng chính và còn giới hạn cần công bố.

## 3.12. Hạn chế của hệ thống

### 3.12.1. Hạn chế triển khai chức năng

Nhật ký bảo mật, cấu hình có persistence, sao lưu/giám sát và thông báo quản trị chưa triển khai đầy đủ. Mô hình Admin còn quyền vận hành; drawer/cảnh báo/ma trận quyền trực quan và phần KPI/lọc mới còn các mức hoàn thiện, kiểm chứng khác nhau. Những trang có dữ liệu mẫu phải được tách khỏi danh sách tính năng hoạt động bằng dữ liệu thật.

Các ngoại lệ cọc dư sau giảm giá, tự giải phóng lịch chưa cọc và quyết toán dịch vụ đang làm dở cần tiếp tục xử lý. Thuật toán hiện kiểm tra khả thi và có budget, chưa tối ưu tải nhân viên hoặc tự phân công. Thông báo trong ứng dụng chưa thay nhắc hẹn tự động qua SMS/email hoặc cơ chế realtime đầy đủ.

### 3.12.2. Hạn chế kiểm thử và bằng chứng

Các biên bản có nhiều mốc và bộ ca phát triển theo thời gian, chưa tạo thành một lần hồi quy cuối duy nhất phủ toàn bộ workspace hiện tại. Raw log mọi case chưa được rà lại trong đợt biên soạn; QA giao diện nhiều thiết bị, ảnh bản mới và chuỗi thao tác đầy đủ còn thiếu. Một số hình lịch sử chỉ minh họa trạng thái, không bao phủ toàn quy trình.

Chưa có thử tải, đo thời gian đáp ứng theo kịch bản hay đánh giá thực địa để đưa ra các chỉ số định lượng. Những thiếu hụt về hình được giữ trống để tác giả bổ sung, thay vì tạo ảnh minh họa rồi xem như bằng chứng chạy thật.

### 3.12.3. Hạn chế triển khai vận hành

Mailtrap bên ngoài chưa có bằng chứng nghiệm thu thành công, trong khi SMTP loopback đã được kiểm theo phạm vi riêng. Hệ thống chưa hoàn tất merchant/webhook đối soát ngân hàng hoặc tự động chuyển tiền hoàn. Bộ sandbox chỉ mô phỏng các sự kiện được chỉ rõ; bằng chứng không có tiền thật cần được giữ trong mọi diễn giải kết quả.

Docker mới có cấu hình và kiểm tra tĩnh theo hồ sơ, chưa đủ bằng chứng runtime/production. Hàng đợi thư và hạn mức hiện có giới hạn của mô hình MVP; sao lưu DB, giám sát và phục hồi vận hành cần kiểm tra riêng. Các giới hạn này là đầu vào cho kết luận và hướng phát triển ở giai đoạn tiếp theo, chưa phải công việc đã hoàn thành trong Chương 3.
