# KẾ HOẠCH TỔNG THỂ PHÁT TRIỂN HỆ THỐNG PETCARE

> Phiên bản 2.0 - rà soát ngày 23/10/2026.
> Phạm vi: bản mã nguồn tại `D:/dich_vu_thu_cung`, SQL và migration trong dự án.
> Nội dung phiên bản 2.0 cập nhật tài liệu, không sửa mã ứng dụng hoặc database. Việc thiết lập Git và lưu repo sau đó theo yêu cầu người dùng được ghi riêng trong NHAT_KY_KIEM_TRA.md.

## 0. Tiến độ hiện tại và cách đọc

**Mốc triển khai chính: giai đoạn 6/12 - Đặt lịch dịch vụ; chưa đạt đủ điều kiện nghiệm thu giai đoạn 6.** Đã làm trước một phần giai đoạn 7 (xem/hủy lịch), 10 (đánh giá) và 11 (API quản trị tài khoản).

Quy ước:

- **Có mã:** đã thấy route, component hoặc hàm xử lý; chưa đồng nghĩa đã kiểm thử thành công.
- **Có SQL:** có khai báo bảng/ràng buộc; chưa xác nhận đã được áp dụng vào DB đang chạy.
- **Chưa tích hợp:** có file nhưng chưa nối vào luồng sử dụng.
- **Kế hoạch:** đầu việc chưa triển khai hoặc cần hoàn thiện.
- **Nghiệm thu:** chỉ đánh dấu hoàn thành sau khi có kết quả kiểm thử. Lần rà soát tài liệu ban đầu chỉ đọc mã nguồn. Trong lần thiết lập Git sau đó, frontend đã build thành công và 19 file JavaScript backend qua kiểm tra cú pháp trên bản sao khớp mã nguồn; chưa chạy server/DB, seed, migration hoặc E2E. Xem NHAT_KY_KIEM_TRA.md.

| Giai đoạn | Trạng thái qua rà soát mã nguồn | Phần còn thiếu chính |
| --- | --- | --- |
| 1. Môi trường | Có cấu hình, lockfile; frontend build thành công khi chuẩn bị bản lưu Git | Xác nhận kết nối PostgreSQL và extension trên DB thực tế |
| 2. Database và seed | Có 15 bảng trong SQL sau migration, có db:init | Hoàn thiện migration chạy có kiểm soát, seed đủ hồ sơ/ca và kiểm thử ràng buộc |
| 3. Khung backend | Có Express, pg Pool, withTransaction và handler lỗi | Chuẩn hóa mã lỗi DB/validation, tách lớp truy cập dữ liệu khi cần |
| 4. Xác thực/RBAC | Có đăng ký, đăng nhập, JWT, refresh API, hồ sơ, đổi mật khẩu | Phân quyền theo chức vụ phía server, tự refresh frontend, tài khoản tạm |
| 5. Thú cưng/tra khách | Có giao diện/API hồ sơ và tra khách theo SĐT | Rà quyền tra cứu, kiểm thử sở hữu và trạng thái |
| 6. Đặt lịch | **Đang thực hiện: có online và tại quầy** | Công suất theo ca, kiểm tra và ghi trong cùng vùng khóa, test đặt đồng thời |
| 7. Điều phối/phân công | Có xem/hủy lịch cho khách | MH-05, xác nhận/phân công, giữ chờ, từ chối, thông báo |
| 8. Ca làm/chăm sóc | Có bảng ca và trạng thái dịch vụ | API/UI MH-09, MH-04 và luồng chăm sóc |
| 9. Hóa đơn/thanh toán | Có bảng hóa đơn, chi tiết, thanh toán | API/UI MH-06, thu nhiều lần, QR và in chứng từ |
| 10. Khiếu nại/hoàn/đánh giá | Đánh giá đã có; bảng khiếu nại đã có | MH-10a/b, phê duyệt, thực chi, hoàn một phần |
| 11. Báo cáo/quản trị | Có API tài khoản và file QuanLyTaiKhoan.jsx | Nối router Admin, báo cáo MH-07, API ghi danh mục dịch vụ |
| 12. Kiểm thử/đóng gói | Có script test-concurrency.js | E2E, kiểm thử tự động có assertion, hướng dẫn triển khai, Docker Compose |

Không quy đổi số giai đoạn sang phần trăm hoàn thành: khối lượng mỗi giai đoạn khác nhau và một số phần được làm không theo thứ tự.

## 1. Công nghệ và kiến trúc đang dùng

| Thành phần | Hiện trạng |
| --- | --- |
| Frontend | React 18, Vite 5, Tailwind CSS 4, JavaScript/JSX |
| Điều hướng | React Router DOM 6, HashRouter |
| Trạng thái/gọi API | React Context, hooks, fetch; phiên/token có lưu trình duyệt |
| Backend | Node.js, Express 4, ES Modules |
| Database | PostgreSQL, pg Pool, truy vấn SQL trực tiếp và withTransaction |
| Xác thực | bcrypt, JWT access token, refresh token trong cookie HttpOnly |
| Quyền | Middleware authenticate/requireRole/requireAdmin; cần bổ sung quyền theo chức vụ |
| Extension SQL | btree_gist; schema hiện tại không cần pgcrypto vì chưa dùng UUID |

`zod` và `express-rate-limit` có trong package.json nhưng chưa thấy được dùng trong src. Chưa có Repository Pattern riêng; SQL hiện đặt trực tiếp trong controllers. Tách service/repository là kế hoạch tổ chức code, không phải hiện trạng đã hoàn thành. Tiếp tục dùng pg, không yêu cầu đổi ORM.

Node cần >=20 để phù hợp dependency Tailwind đang cài, dù backend khai báo >=18. Frontend dev thường ở 5173, backend mặc định 5000; Vite proxy `/api` sang backend. Health check hiện là `GET /health`, không phải `/api/health`; Vite chỉ proxy `/api` nên kiểm tra `/health` trực tiếp trên cổng backend. Health handler không truy vấn DB trong mỗi request.

## 2. Vai trò, chức vụ và quyền

| Nhóm | Giá trị DB vai_tro | nhan_vien.chuc_vu | roleKey frontend |
| --- | --- | --- | --- |
| Khách hàng | KhachHang | Không có hồ sơ nhân viên | customer |
| Nhân viên chăm sóc | NhanVien | Nhân viên chăm sóc | care |
| Lễ tân | NhanVien | Lễ tân | reception |
| Quản lý | NhanVien | Quản lý | manager |
| Admin | Admin | Không bắt buộc hồ sơ nhân viên | admin |

Quyền đích: khách chỉ thao tác hồ sơ/lịch của mình; nhân viên chăm sóc chỉ xử lý lịch được giao; lễ tân tiếp nhận, điều phối, thu tiền và tiếp nhận khiếu nại; quản lý quản lý ca/dịch vụ, giải quyết khiếu nại và báo cáo; Admin quản trị tài khoản. Quyền bao hàm thêm cho quản lý/Admin phải được khai báo rõ ở backend.

Hiện route đặt tại quầy cho toàn bộ NhanVien và Admin; route tra cứu khách mới yêu cầu đăng nhập. Hủy lịch cũng chưa phân biệt từng chức vụ nhân sự. Chặn trang frontend không thay thế kiểm tra quyền API. Cần hạn chế quyền trước nghiệm thu.

## 3. Cây màn hình và trạng thái tích hợp

```text
Màn hình chung
  MH-01 Đăng nhập / Đăng ký                 Có route
  Bảng giá                                Có route, đang dùng dữ liệu mẫu
  Thông tin cá nhân / Đổi mật khẩu          Có luồng khách hàng
  Quên mật khẩu                           Trang đang phát triển
Khách hàng
  MH-11 Hồ sơ thú cưng                     Có route/API
  MH-02 Đặt lịch                          Có route/API
  MH-03 Danh sách lịch, hủy, đánh giá       Có route/API
Nhân viên chăm sóc
  MH-04 Lịch làm việc / Thực hiện dịch vụ   Kế hoạch
Lễ tân / Quản lý theo quyền
  MH-02b Đặt lịch tại quầy                 Có route/API
  MH-05 Quản lý lịch / Phân công           Kế hoạch
  MH-06 Hóa đơn / Thanh toán               Kế hoạch
  MH-10a Tiếp nhận khiếu nại               Kế hoạch
  Quản lý khách hàng và thú cưng           Mới có tra cứu tại quầy
Quản lý
  MH-09 Ca làm việc                       Kế hoạch
  MH-10b Giải quyết khiếu nại / Hoàn tiền   Kế hoạch
  MH-07 Báo cáo                           Kế hoạch
  Quản lý dịch vụ và bảng giá              Mới có API đọc
Admin
  MH-08 Tài khoản / Phân quyền             Có API và file UI, chưa nối router
```

`/admin`, `/quan-ly`, `/le-tan`, `/nhan-vien` hiện dùng GiuChoVaiTro, không phải giao diện nghiệp vụ hoàn chỉnh. Chỉ trang đặt tại quầy có route nhân sự riêng.

## 4. Mapping route, component và API hiện có

Route dưới đây là phần sau dấu `#` vì frontend dùng HashRouter. Tên tiếng Việt là tên thực tế; không đổi sang tên tiếng Anh chỉ để khớp bản kế hoạch cũ.

| Chức năng | Route giao diện | Component trong dichvu/src/pages | API hiện có |
| --- | --- | --- | --- |
| Đăng nhập/đăng ký | /dang-nhap | DangNhap.jsx | POST /api/auth/dang-nhap, /api/auth/dang-ky |
| Đăng xuất/refresh | Không có trang riêng | data/khoXacThuc.jsx là context ở src | POST /api/auth/dang-xuat, /api/auth/lam-moi-token |
| Hồ sơ/đổi mật khẩu | /thong-tin-ca-nhan | khach-hang/ThongTinCaNhan.jsx | GET /api/auth/toi; PUT /api/auth/cap-nhat; POST /api/auth/doi-mat-khau |
| Bảng giá | /bang-gia | BangGia.jsx | Trang dùng duLieuMau.js; API danh mục thật là GET /api/dich-vu |
| Hồ sơ thú cưng | /ho-so-thu-cung | khach-hang/HoSoThuCung.jsx | GET/POST /api/thu-cung; GET/PUT /:id; PATCH /:id/trang-thai |
| Đặt lịch online | /dat-lich | khach-hang/DatLich.jsx | GET /api/dich-vu; GET /api/lich-hen/khung-gio-trong; POST /api/lich-hen |
| Xem/hủy/đánh giá | /lich-hen | khach-hang/DanhSachLichHen.jsx | GET /api/lich-hen; PATCH /api/lich-hen/:id/huy; POST /api/lich-hen/:id/danh-gia |
| Đặt tại quầy | /le-tan/dat-lich-tai-quay | le-tan/DatLichTaiQuay.jsx | GET /api/khach-hang/tra-cuu?sdt=...; POST /api/lich-hen/tai-quay |
| Quản trị tài khoản | Chưa nối router | admin/QuanLyTaiKhoan.jsx | GET/POST /api/admin/tai-khoan; PATCH /:id; POST /:id/khoa, /:id/mo-khoa, /:id/dat-lai-mat-khau |

Các API /ca-lam-viec, /hoa-don, /khieu-nai, /bao-cao và thao tác xác nhận/phân công/tiến độ dưới đây là **đầu việc cần thiết kế**, không phải endpoint đang chạy.

## 5. Quy trình nghiệp vụ mục tiêu - giữ mã AD/SD của bộ sơ đồ gốc

### AD-01 / SD-01: Đăng ký và đăng nhập

Đăng ký: nhập username, họ tên, SĐT, email tùy chọn, mật khẩu và nhập lại; kiểm tra hợp lệ/trùng; bcrypt; lưu nguoi_dung và khach_hang trong transaction; báo thành công và chuyển tab. SD-01 đăng nhập kiểm tra hoạt động, mật khẩu, tạo token và điều hướng theo quyền. Hai mã mô tả hai góc nhìn/luồng khác nhau, không ép thành cùng một Use Case.

### AD-02 / SD-02: Đặt online và tại quầy

- Online: khách đã đăng nhập chọn thú cưng thuộc mình, nhiều dịch vụ, ngày và giờ.
- Tại quầy: nhân sự tra SĐT; nhập hồ sơ mới khi cần, hệ thống tạo tài khoản khách tạm và thú cưng. Sau đặt mở bước MH-05; chưa tự chuyển lịch sang đã xác nhận.
- Kiểm tra dịch vụ hoạt động, tổng thời lượng >0, toàn khoảng nằm trong 08:00-19:00 và công suất theo nhân viên chăm sóc trong ca.
- Lấy khóa phù hợp; kiểm tra công suất và ghi lịch/chi tiết bằng cùng transaction; lưu ChoXacNhan và giá dự kiến chụp từ danh mục.
- Thông báo là thông báo trong ứng dụng theo phạm vi này; không mặc định đã tích hợp SMS/email.

**Khoảng trống hiện tại:** CAPACITY=2; chưa dùng ca, kiểm tra giờ trống trước transaction; lịch mới chưa gán nhân viên nên EXCLUDE theo nhân viên không tự chặn vượt công suất. Tạo khách/thú cưng/lịch tại quầy hiện có thể commit riêng. Tài khoản tạm chưa có quy trình bàn giao/bắt đổi mật khẩu hoàn chỉnh.

### AD-03 / SD-03: Điều phối và phân công

Ba nhánh loại trừ nhau: giữ ChoXacNhan và ghi chú; từ chối chuyển TuChoi kèm lý do; hoặc chọn nhân viên và kiểm tra lại ca/chồng giờ để gán nhân viên + DaXacNhan nguyên tử. Không để phân công chạy sau nhánh từ chối. TuChoi đã có trong SQL migration, nhưng API từ chối và ánh xạ nhãn tương ứng vẫn cần triển khai.

Hủy bởi khách/lễ tân theo quyền dùng DaHuy, khác với từ chối lịch mới. Nếu muốn gộp trạng thái sau này phải có quyết định và sửa đồng bộ schema, API, sơ đồ, báo cáo.

### AD-04 / SD-04: Chăm sóc thú cưng

Nhân viên mở lịch của mình, kiểm tra điều kiện trước khi bắt đầu. Nếu đủ: DangThucHien -> thực hiện/ghi chú từng chi tiết -> HoanThanh khi tất cả chi tiết xong. Nếu không đủ: ghi lý do, báo lễ tân/quản lý; lễ tân liên hệ khách và quyết định hủy hoặc đổi lịch. Mọi bước hủy phải ở trong nhánh không đủ điều kiện, không đặt sau end của alt chính.

Đổi lịch phải kiểm tra lại giờ/ca; không dùng nhãn DaHuy để đồng thời mang nghĩa hoãn. Dừng dịch vụ sau khi đã thực hiện một phần cần quy tắc quyết toán riêng; chưa tự cho phép hủy khi DangThucHien trong phạm vi tối thiểu.

### AD-05 / SD-05: Hóa đơn và thu tiền

Chỉ lập từ lịch HoanThanh, tối đa một hóa đơn/lịch; chụp tên và đơn giá vào chi tiết hóa đơn. Kiểm tra giảm giá, lưu ChuaThanhToan. Thu tiền mặt hoặc QR thành nhiều lần; số ghi nhận khác tiền khách đưa. Cho phép lưu ThanhToanMotPhan và quay lại thu sau. QR phải có xác nhận nhận tiền, việc hiển thị mã không tự chứng minh đã thu. Hóa đơn thành tiền 0 cần tất toán không tạo giao dịch 0 đồng.

### AD-06 / SD-06: Khiếu nại và hoàn tiền

Lễ tân ghi DaTiepNhan. Quản lý lưu kết luận bác bỏ/khắc phục/duyệt hoàn; bác bỏ là kết luận trong ket_qua_xu_ly khi dùng hai trạng thái SQL hiện tại. Chỉ sau thực chi thành công mới ghi giao dịch HoanTien/ThanhCong, cập nhật hóa đơn và chuyển khiếu nại DaXuLy. Chi thất bại/chưa xác nhận không được báo đã hoàn.

Giữ yêu cầu hoàn một phần của MH-10: 100.000 trên 400.000 là hợp lệ nếu còn được hoàn. Đề xuất thêm HoanTienMotPhan và liên kết duyệt/thực chi/chống lặp trong migration tương lai. **Các trường/trạng thái này chưa tồn tại đầy đủ ở SQL hiện tại.**

## 6. Lộ trình 12 giai đoạn và tiêu chí nghiệm thu

Giữ nguyên số giai đoạn của bản cũ. Phần ca làm phục vụ tính công suất (8A) phải làm sớm để hoàn tất giai đoạn 6, dù toàn bộ giai đoạn 8 chưa bắt đầu.

### Giai đoạn 1: Môi trường và khảo sát

- Có: cấu hình Vite, backend, dependencies và lockfile.
- Cần làm: xác nhận Node >=20, PostgreSQL, cấu hình server/.env riêng, extension btree_gist và frontend proxy.
- Nghiệm thu: build frontend thành công; server kết nối DB; GET :5000/health trả JSON; không đưa .env hoặc secrets vào Git.

### Giai đoạn 2: Đồng bộ 15 bảng và dữ liệu mẫu

- Có: thu_cung.sql + migrations/001_schema_improvements.sql; server/scripts/init-db.js tự đọc cả hai SQL.
- Cần làm: version hóa migration đáng tin cậy; không bỏ qua lỗi rồi báo thành công; seed đủ 5 nhóm người dùng, thú cưng và ca có thể demo.
- init-db hiện khai báo 6 tài khoản và 3 dịch vụ, không phải 7 tài khoản; không seed đủ thú cưng/ca. Seed lịch riêng đang dùng ID và ngày cố định, cần tránh phụ thuộc dữ liệu không tồn tại.
- db:migrate, db:seed, db:reset và db:setup đang trỏ tới script chưa tồn tại. Không dùng làm hướng dẫn chuẩn cho đến khi sửa.
- Nghiệm thu: tạo DB mới đủ 15 bảng, test PK/FK/CHECK/UNIQUE/EXCLUDE; không chạy schema gốc lặp trên dữ liệu thật; lưu log kết quả.

### Giai đoạn 3: Khung backend và lỗi tập trung

- Có: Express, pg Pool, withTransaction, logger, 404 và error handler.
- Cần làm: ánh xạ 23505/23P01 thành 409 theo ngữ cảnh, validation thành 400/422 có quy ước, 23514 thành lỗi dữ liệu; không lộ stack ở production.
- Nghiệm thu: JSON lỗi nhất quán; rollback đầy đủ khi một thao tác trong transaction thất bại. Repository/service nếu tách phải có mục đích rõ, không coi đã tồn tại.

### Giai đoạn 4: Xác thực và RBAC

- Có: API đăng ký/đăng nhập/refresh/đăng xuất; hồ sơ và đổi mật khẩu; bảo vệ route theo vai trò.
- Cần làm: phân quyền theo chức vụ trên server; refresh tự động phía frontend; luồng tài khoản tạm và bắt đổi mật khẩu; đồng bộ nhãn vai trò.
- Nghiệm thu: đủ 5 nhóm quyền; tài khoản khóa bị chặn; không vượt quyền bằng gọi API trực tiếp; token hết hạn xử lý rõ.

### Giai đoạn 5: Hồ sơ thú cưng và tra cứu khách

- Có: HoSoThuCung.jsx; API list/detail/create/update/status và tra SĐT.
- Cần làm: chỉ nhân sự tiếp nhận được tra khách; thống nhất SĐT theo đặc tả (màn hình 10 số, API tra hiện nhận 9-11); kiểm thử sở hữu.
- Nghiệm thu: khách không xem/sửa thú cưng người khác; chó/mèo và cân nặng hợp lệ; không xóa lịch sử. Code hiện chặn ngừng theo dõi khi còn lịch đang mở; giữ quy tắc này hoặc cập nhật yêu cầu nhất quán.

### Giai đoạn 6: Đặt lịch và chống vượt công suất - ĐANG LÀM

- Có: MH-02, MH-02b, danh mục API, tổng thời lượng và giá dự kiến, lưu lịch/chi tiết.
- Làm tiếp theo thứ tự: dữ liệu ca tối thiểu 8A -> công suất theo ca -> khóa và kiểm tra lại bằng cùng client -> transaction nghiệp vụ tại quầy -> xử lý quyền và tài khoản tạm -> test đồng thời.
- Công suất phải đúng trên mọi khoảng con của dịch vụ, không chỉ tại giờ bắt đầu. Kiểm tra nhân viên đang hoạt động, chức vụ chăm sóc và ca bao trọn thời lượng; xử lý ca kề nhau theo chính sách đã thống nhất.
- Nghiệm thu: hai request tranh chỗ cuối có đúng một 201, một 409; lỗi ghi chi tiết không để lịch rỗng; không đặt vào quá khứ; kết thúc <=19:00. Tính ngày/giờ theo múi giờ nghiệp vụ Asia/Ho_Chi_Minh thống nhất, không trộn ngày UTC và giờ local.
- test-concurrency.js hiện dùng tài khoản/ID/ngày cố định; cần fixture riêng, assertions và dọn dữ liệu, không chạy trên DB có dữ liệu thật.

### Giai đoạn 7: Quản lý và phân công lịch hẹn

- Có trước: danh sách và hủy phía khách hàng (MH-03).
- Cần làm: MH-05; API xác nhận/phân công, giữ chờ, từ chối; hủy có lý do theo quyền; thông báo trong ứng dụng.
- Nghiệm thu: ba nhánh loại trừ; phân công ngoài ca/chồng giờ bị chặn cả khi request đồng thời; từ chối bắt buộc lý do; TuChoi/DaHuy không giữ công suất; lịch đã đổi trạng thái báo xung đột.

### Giai đoạn 8: Ca làm và chăm sóc

- **8A làm trước để hỗ trợ giai đoạn 6:** seed ca mẫu, API đọc/tính nhân viên khả dụng và kiểm tra ca.
- **8B:** UI quản lý ca MH-09, tạo/sửa/hủy ca; MH-04 nhận lịch, kiểm tra điều kiện, bắt đầu/hoàn tất từng dịch vụ và nhật ký.
- Nghiệm thu: không chồng ca; không xóa/thu hẹp ca làm mất phân công; nhân viên chỉ thao tác lịch của mình; không hoàn tất lịch khi chi tiết còn chưa xong; nhánh không đủ điều kiện không ảnh hưởng nhánh hoàn thành.

### Giai đoạn 9: Hóa đơn và thanh toán

- Có: SQL hoa_don, chi_tiet_hoa_don, thanh_toan.
- Cần làm: API/UI MH-06, bảng giá thật thống nhất, snapshot giá, tính giảm, thu nhiều đợt, nhận QR và in chứng từ. Bổ sung cách lưu tiền khách đưa/thừa nếu cần tái in/đối soát; schema chưa có hai cột này.
- Nghiệm thu: UNIQUE hóa đơn/lịch; giá cũ không đổi; 0 < số ghi nhận <= còn nợ; tiền thừa chính xác; cho lưu nợ/thoát; chống ghi nhận trùng, khóa khi thu đồng thời, có nhánh thanh toán thất bại.

### Giai đoạn 10: Khiếu nại, hoàn tiền và đánh giá

- Có trước: API/UI đánh giá, UNIQUE theo lịch; chỉ lịch HoanThanh của khách được đánh giá.
- Cần làm: MH-10a/b, quyền tiếp nhận/quyết định/thực chi; migration hoàn một phần và chống hoàn lặp; thống nhất kết luận bác bỏ với DaXuLy.
- Nghiệm thu: duyệt không tự ghi đã chi; số hoàn dương và <= tổng thu - tổng hoàn thành công; đúng hóa đơn của lịch; chi thất bại giữ chờ xử lý; cập nhật tiền và trạng thái nguyên tử, có mã chống lặp/bằng chứng.

### Giai đoạn 11: Báo cáo và quản trị

- Có trước: API admin list/create/update/lock/unlock/reset; QuanLyTaiKhoan.jsx chưa được App.jsx import/mount.
- Cần làm: nối giao diện Admin; API/UI ghi danh mục; MH-07 theo quyền Quản lý; báo cáo theo ngày thu/hoàn, dịch vụ và trạng thái.
- Nghiệm thu: Admin không tự khóa; dashboard đúng dữ liệu; thực thu = thu thành công - hoàn thành công; không cộng trùng hóa đơn với thanh toán. Doanh thu dịch vụ trước giảm giá ghi rõ khác thực thu; không gọi thực thu là lợi nhuận khi chưa có dữ liệu chi phí.

### Giai đoạn 12: Kiểm thử E2E và đóng gói

- Có: một script thử concurrency, chưa đủ bộ nghiệm thu.
- Cần làm: E2E từ đăng ký -> thú cưng -> đặt -> phân công -> chăm sóc -> thu -> hoàn -> báo cáo; test quyền và lỗi; bỏ dữ liệu mock khỏi luồng vận hành; hướng dẫn setup, backup/restore và Docker Compose nếu giữ mục tiêu này.
- Nghiệm thu: kiểm thử chạy lặp ổn định trên DB test; đủ tài khoản demo cho 5 nhóm; build và triển khai được từ hướng dẫn; không kèm .env, token hoặc mật khẩu thật.

## 7. Quy tắc dữ liệu và công thức thống nhất

- Giờ nghiệp vụ: 08:00 <= bắt đầu < kết thúc <=19:00, cùng ngày, múi giờ thống nhất. Thời lượng từ danh sách dịch vụ đã chọn.
- Chủ lịch hiện suy ra qua lich_hen -> thu_cung -> khach_hang; chưa có ma_khach_hang riêng trên lịch. Nếu cho chuyển chủ thú cưng phải có chính sách lưu chủ đặt lịch lịch sử.
- Lịch đang giữ chỗ: ChoXacNhan, DaXacNhan, DangThucHien. Nhân viên phân công phải trong ca và không chồng khoảng phục vụ.
- Tổng dự kiến = SUM(chi_tiet_lich_hen.so_luong * gia_du_kien).
- Tổng hóa đơn = SUM(chi_tiet_hoa_don.thanh_tien); thanh_tien hóa đơn = tong_tien - giam_gia; 0 <= giảm <= tổng.
- Tiền ghi nhận mỗi lần >0 và <= còn nợ; tiền mặt: tiền khách đưa >= số ghi nhận; tiền thừa = tiền khách đưa - số ghi nhận.
- Tổng thu = SUM(so_tien) với trang_thai=ThanhCong, phuong_thuc thuộc TienMat/ChuyenKhoanQR.
- Tổng hoàn = SUM(so_tien) với trang_thai=ThanhCong, phuong_thuc=HoanTien theo quy ước đích. SQL hiện còn cho trang_thai=HoanTien; phải chuẩn hóa/mapping dữ liệu trước khi dùng báo cáo, không cộng hoàn hai lần.
- Số còn được hoàn = tổng thu - tổng hoàn; chỉ thực chi thành công mới cộng tổng hoàn. Chính sách hiện chỉ duyệt hoàn cho hóa đơn đã thu đủ; sau lần hoàn một phần tiếp tục xét trên số còn được hoàn.
- Công thức chưa có trong API thì là quy tắc cần triển khai; không coi các CHECK hiện tại đã bảo vệ mọi phép tính liên bảng.

## 8. Danh sách ưu tiên ngay sau lần rà soát

- [ ] Sửa các lệnh DB trỏ tới script thiếu; chuẩn hóa quy trình migration/seed và log lỗi.
- [ ] Hoàn thiện dữ liệu/kiểm tra ca 8A; thay CAPACITY cố định.
- [ ] Gộp kiểm tra công suất và ghi lịch vào transaction có khóa theo tài nguyên/ngày phù hợp.
- [ ] Siết quyền tra khách, đặt tại quầy, xem/hủy lịch theo chức vụ.
- [ ] Nghiệm thu giai đoạn 6 bằng test đồng thời đáng tin cậy.
- [ ] Triển khai MH-05 và API giai đoạn 7, đồng bộ trạng thái/nhãn/thông báo.
- [ ] Sau đó hoàn thiện 8B -> 9 -> 10 -> 11 -> 12, không đánh dấu hoàn thành chỉ vì có bảng SQL.

## 9. Tài liệu nguồn và lịch sử cập nhật

Tài liệu dữ liệu đồng hành: [02_THIET_KE_CO_SO_DU_LIEU.md](02_THIET_KE_CO_SO_DU_LIEU.md). Kết quả kiểm tra và thiết lập Git: [NHAT_KY_KIEM_TRA.md](NHAT_KY_KIEM_TRA.md).

Nguồn kiểm tra: dichvu/package.json, vite.config.js, src/App.jsx, src/pages, src/data; server/package.json, src/server.js, config/db.js, middleware, routes/controllers, scripts/init-db.js, scripts/test-concurrency.js; thu_cung.sql; migrations/001_schema_improvements.sql; bộ đặc tả MH-01..MH-11 và rà soát sơ đồ ở cuộc trao đổi này.

Phiên bản 2.0 thay mô tả khẳng định đồng bộ 100% bằng hiện trạng có bằng chứng; chuẩn hóa 15 bảng, tên route/component thật, 12 giai đoạn và điều kiện nghiệm thu; giữ các sửa logic SD-03, SD-04, AD/SD-06; không đổi code hoặc chạy SQL. Ngày rà soát chỉ ghi nhận trạng thái tại thời điểm đọc, không đại diện cho kết quả kiểm thử runtime.
