# KẾ HOẠCH TỔNG THỂ PHÁT TRIỂN HỆ THỐNG PETCARE

> Phiên bản 3.0 · nghiệm thu mã nguồn và môi trường test ngày 23–24/10/2026.
> Kế hoạch triển khai chuẩn: file này. Giữ kiến trúc React/Express/pg/PostgreSQL hiện hữu.
> Ngày trên máy kiểm thử là 23/10, ngày nghiệp vụ Việt Nam đã sang 24/10. Không quy đổi số giai đoạn thành phần trăm.

## 0. Tiến độ hiện tại

> **25/10/2026 — giao diện sáng/tối:** thêm nút mặt trăng/mặt trời cho nhân sự, khách hàng, đăng nhập và bảng giá; theo chế độ máy khi chưa chọn, lưu lựa chọn riêng theo origin, đồng bộ tab và khởi tạo trước paint. Palette tối cho nền/chữ/biểu mẫu/dialog/footer/biểu đồ, giữ nguyên ảnh và QR; quy tắc tối chỉ áp dụng màn hình để giữ màu in sáng. Frontend 29 PASS, lint/build 108 modules PASS. Trình duyệt: ca làm, footer, báo cáo, reload sáng và đổi trang tối, đăng xuất/đăng nhập, tổng quan khách và ngăn kéo thú cưng đạt; không sửa hồ sơ/DB. Chưa QA mọi màn hình hay bản in. Chi tiết: [Giao diện sáng/tối](../docs/GIAO_DIEN_SANG_TOI.md).

> **25/10/2026 — nâng cấp footer nhân sự:** footer compact có nền xanh ngọc nhẹ, dải nhấn, logo/dấu chân, thông điệp thương hiệu, thẻ giờ 08–19h và lối tắt theo vai trò từ danh sách điều hướng sẵn có. StaffLayout truyền role; trang đăng nhập dùng liên kết công khai, không hiện lối tắt nhân sự. Responsive 3/2/1 cột, có trạng thái hover/focus và ẩn khi in. Frontend 26 PASS, lint/build 103 modules PASS. Đã xem footer màn hình hẹp vai trò quản lý và bấm lối tắt Ca làm việc đúng route; ảnh `.cache/payment-sandbox/workspace-footer-preview.png`. Không đổi API/DB hoặc file người dùng đang sửa.

> **25/10/2026 — báo cáo ngày/tháng/quý/năm bằng biểu đồ:** thêm lựa chọn kỳ và thời gian; tháng có từng ngày, quý/năm tổng hợp 3/12 tháng, các mốc không giao dịch là 0. Cột thu/hoàn và đường thực thu (hỗ trợ âm), có trục VND, chú giải, chọn bằng chuột/chạm/bàn phím và vùng chi tiết; tự vừa chiều rộng hoặc cuộn ngang. Dùng API và cách tính tiền/cọc/hoàn hiện có, không đổi schema, không ghi/seed DB. Frontend 26 PASS, lint/build 103 modules PASS. Trình duyệt đã kiểm tra ngày/tháng/quý/năm và ngày trống, đối chiếu tổng API sandbox 1.145.000 − 200.000 = 945.000đ. Báo cáo ngày chưa chia giờ. Chi tiết: [Biểu đồ doanh thu](../docs/BIEU_DO_DOANH_THU.md).

> **25/10/2026 — đặt cọc 30% và chính sách hủy:** thêm snapshot chính sách/giá, thu cọc QR/MoMo sandbox hoặc lễ tân xác nhận thực nhận, chặn xác nhận/bắt đầu khi thiếu cọc; hủy ≥24h/cửa hàng hủy chờ hoàn đủ, hủy sát giờ hoặc no-show mất cọc, đổi sát giờ giữ cọc một lần, quản lý duyệt ngoại lệ có lý do. Cọc trừ hóa đơn cuối và không tính thu hai lần. Migration 007 mới; DB chính Thu_cung được backup/restore bản sao/thử 006–007 và đối chiếu giữ nguyên giá trị cũ 16 bảng trước khi nâng cấp nguồn. 5173 bật chính sách nhưng không bật mô phỏng tiền; 5181 bật sandbox. Không áp cọc hồi tố, không tạo giao dịch giả trên DB chính. Unit backend 74 PASS + 11 tích hợp SKIP; 9 nhóm tích hợp trên DB mới riêng 86 PASS / 0 FAIL / 0 SKIP; frontend 20 PASS, lint/build 100 modules PASS; UI khách sandbox đóng cọc 45.000/150.000đ đạt. **Chưa kết nối cổng thật, chưa tự hủy giữ chỗ chưa cọc hoặc xử lý cọc dư khi giảm giá thấp hơn cọc.** Chi tiết: [Đặt cọc và hủy lịch](../docs/DAT_COC_VA_HUY_LICH.md).

> **25/10/2026 — sửa chữ bị che ở bước ngày giờ:** bỏ margin âm của thông báo khung giờ trống và bổ sung khoảng cách dọc cho bước 3; cảnh báo không có ca nằm trong khung riêng dưới các trường ngày/giờ. Build 99 modules PASS, lint PASS. Đã thử trình duyệt bản 5181 với ngày 10/11 không có ca: nội dung đầy đủ, không chồng ô nhập, nút xác nhận bị vô hiệu hóa đúng trạng thái; không tạo lịch hoặc sửa DB. Ảnh cục bộ `.cache/payment-sandbox/booking-spacing-fixed.png`.

> **25/10/2026 — thanh toán sandbox QR ngân hàng/MoMo/COD:** theo lựa chọn làm sandbox trước, thêm bộ mô phỏng cục bộ có chữ ký callback, chống trùng, khóa hóa đơn, số tiền từ công nợ và tự cập nhật UI; COD chờ lễ tân thu tiền mặt khi nhận bé. Migration 006 mới; bản chính 5173/5000 và DB thật không migrate/seed. Bản thử 5181/5001 dùng DB mới `petcare_test_demo_payments_20261025`. Backend mặc định 72 PASS + 10 tích hợp SKIP; bốn nhóm tích hợp chạy DB mới riêng: 32 PASS / 0 FAIL / 0 SKIP; frontend 20 PASS, lint/build 99 modules PASS. Trình duyệt: QR thành công tất toán; MoMo thất bại giữ nợ; COD chưa ghi tiền. **Chưa tích hợp merchant MoMo/SePay hoặc nhận tiền thật**; không gọi QR mô phỏng là VietQR/MoMo thật, không nghiệm thu production. Hướng dẫn và giới hạn: [Thanh toán sandbox](../docs/THANH_TOAN_SANDBOX.md).

> **25/10/2026 — tích hợp giao diện tham khảo MoeGo:** áp dụng vào web React/API hiện có: đặt lịch khách theo 3 bước (thú cưng → dịch vụ → giờ và xác nhận), chọn dịch vụ dạng thẻ và giờ trống dạng nút; bỏ fallback dịch vụ giả tại trang đặt lịch khách. Hồ sơ thú cưng dùng ngăn kéo và lưới 2–3 cột; tại quầy chọn thú cưng dạng thẻ. Điều phối có tìm tên/SĐT/mã lịch/thú cưng, lọc nhân viên, chuyển danh sách/lịch biểu; ca và chăm sóc có lưới thời gian 08–19h. Chăm sóc làm nổi ghi chú sức khỏe/tiến trình; báo cáo biểu đồ thu và hoàn theo dữ liệu kỳ đã tải; header nhân sự sticky. Build 98 modules PASS, lint PASS, 20 test frontend PASS, diff check PASS. Không đưa tài khoản, mật khẩu hay lịch/hóa đơn giả từ mẫu vào hệ thống; không ghi DB. **Chưa nghiệm thu toàn bộ mẫu:** chưa QA thao tác trình duyệt với API/DB đang chạy, chưa áp dụng toàn bộ mẫu Admin, biểu đồ tỷ lệ dịch vụ, KPI tổng quan, tab khiếu nại khách hoặc dọn nhãn demo trên mọi trang. Không đánh dấu giai đoạn 12 hoàn tất.

> **25/10/2026 — thay bộ tài khoản demo theo yêu cầu:** bản 5181 hiện dùng DB `petcare_test_demo_accounts_20261025001704`: 5 chăm sóc, 5 lễ tân, 2 quản lý, 5 khách và Admin cũ giữ nguyên (18 tổng). Các tên cũ không có trong DB đang phục vụ, 6 lần đăng nhập tên cũ trả 401; 18 tài khoản hiện tại đăng nhập đạt qua proxy. Có 35 ca/7 ngày, 5 thú cưng thuộc đúng 5 khách, giữ 3 dịch vụ; lịch/hóa đơn cũ không gán cho người mới. Nguồn cũ giữ riêng và có dump kiểm tra được; không đổi bản chính 5173 hoặc `.env`. Tooling mới chỉ INSERT vào DB mới, nguồn READ ONLY; 3 test guard/count PASS, kiểm tra quyền Admin đạt. Không đổi API/UI nên không chạy lại frontend build. Bộ 7 tài khoản và kết quả trong ghi nhận ngay dưới là lịch sử. Chi tiết: [Dữ liệu demo](../docs/DU_LIEU_DEMO.md).

> **25/10/2026 — dữ liệu demo và kiểm tra hồi quy:** có bản web thử riêng `http://127.0.0.1:5181/`, API 5001, DB `petcare_test_demo_20261024235410` trên cụm test 55439. Tạo 7 tài khoản, 2 thú cưng, 3 dịch vụ, 14 ca, 17 lịch, 8 hóa đơn, 7 khiếu nại, đánh giá/thông báo/nhật ký qua API; không đổi `.env` hoặc dữ liệu web 5173. Backend 67 unit PASS + 1 kiểm tra guard demo PASS; 9 nhóm tích hợp chạy mỗi nhóm DB mới: 83 PASS / 0 FAIL / 0 SKIP. Frontend 20 PASS, lint PASS, build 97 modules PASS. Đã đăng nhập và kiểm tra màn hình chính 5 nhóm vai trò trên trình duyệt, đối chiếu báo cáo thu 950.000 − hoàn thực chi 200.000 = 750.000 đồng. Script tạo demo từ chối DB không rỗng; có lệnh mở lại bằng đồng hồ thật. Chưa nghiệm thu mọi thao tác UI/thiết bị hay Docker; VietQR, email/OTP và luồng khách tự tạo khiếu nại vẫn còn giới hạn, không đánh dấu hoàn tất dự án. Hướng dẫn và mapping tình huống: [Dữ liệu demo](../docs/DU_LIEU_DEMO.md).

**Đã triển khai đến giai đoạn 11; đang ở giai đoạn 12 — nghiệm thu, đóng gói và chuẩn bị môi trường chạy.** API 8–11 và chuỗi nghiệp vụ đã đạt trên PostgreSQL 17 cô lập; giao diện chăm sóc, ca, thu/hoàn, chứng từ, báo cáo và danh mục đã thao tác trên trình duyệt. Database development local đã được nâng cấp có backup/đối chiếu và xác nhận giữ dữ liệu ngày 24/10/2026; không triển khai production.

| Giai đoạn | Kết quả có bằng chứng | Phần còn lại / giới hạn |
| --- | --- | --- |
| 1. Môi trường | PASS Node 24, frontend build, HTTP health/ready trên test | Docker runtime chưa có trên máy |
| 2. Database/seed | PASS 8 tích hợp + 10 unit; backup/restore DB cũ, so schema và nâng cấp bản sao đạt | DB development đã nâng cấp, ready/proxy 200; dữ liệu và mật khẩu cũ giữ nguyên |
| 3. Backend/lỗi | PASS rollback, lỗi SQL/validation an toàn; phân biệt health và ready | Không tự migrate lúc khởi động |
| 4. Xác thực/RBAC | PASS JWT purpose/version, khóa phiên, refresh, tài khoản tạm; 10 test auth/hồ sơ | UI bắt đổi mật khẩu tạm chưa QA trình duyệt riêng; quên mật khẩu còn trang chờ |
| 5. Thú cưng/tra khách | PASS CRUD, quyền sở hữu/hoạt động/validation qua HTTP | CRUD UI chưa QA toàn bộ thiết bị |
| 6. Đặt lịch | PASS 14 HTTP + hành trình HTTP; bàn giao tài khoản tạm có API/UI | Bước bàn giao tại quầy chưa QA trình duyệt riêng |
| 7. Điều phối | PASS 14 HTTP, ba nhánh loại trừ, nhật ký/thông báo; UI đã kiểm tra | Đã nối vào hành trình giai đoạn 8–11 |
| 8. Ca/chăm sóc | PASS 6 HTTP + hành trình + UI MH-04/MH-09 | Không hỗ trợ hủy sau khi làm một phần khi chưa có quy tắc quyết toán |
| 9. Hóa đơn/thanh toán | PASS 8 HTTP + hành trình + UI thu nhiều lần/in hóa đơn | **VietQR để sau theo lựa chọn người dùng**; chuyển khoản ghi nhận thủ công khi đã nhận |
| 10. Khiếu nại/hoàn/đánh giá | PASS 8 HTTP + hành trình + UI duyệt/chi thất bại/chi thành công/phiếu hoàn | Không có chuyển tiền ngân hàng tự động |
| 11. Báo cáo/quản trị | PASS 7 HTTP + UI báo cáo/danh mục/danh sách Admin | Không tính lợi nhuận vì chưa có dữ liệu chi phí |
| 12. E2E/đóng gói | PASS 8 test hành trình, frontend 13 test/build 71 modules; backup/restore/baseline/migrate bản sao đạt; có tài liệu/API/Docker config | **Chưa hoàn tất:** chưa build/run Docker; chưa QA đủ mọi UI |

Tổng cuối: backend **67 PASS**, 9 nhóm tích hợp được skip khi chạy mặc định không có DB. Chín nhóm đã chạy riêng, mỗi nhóm DB mới: **83 PASS, 0 FAIL** (kể cả parent test của Node). Frontend **13 PASS**. Không gọi các nhóm skip là PASS. Chi tiết và lỗi trước sửa trong [báo cáo](BAO_CAO_KIEM_THU_HE_THONG.md) và [nhật ký](NHAT_KY_KIEM_TRA.md).

## 1. Công nghệ và cấu trúc

- Frontend: React 18, Vite 5, Tailwind CSS 4, JavaScript, HashRouter; Context và fetch có tự refresh phiên một lần khi 401.
- Backend: Node.js/Express 4, ES modules, bcrypt/JWT, pg Pool/SQL trực tiếp, transaction và advisory lock. Không đổi ORM/kiến trúc.
- Database: PostgreSQL 17 + btree_gist; migration 000–005 theo checksum, chạy riêng trên development/test được chỉ định.
- `dichvu/src/pages`: trang chung, khách hàng, nhân viên, lễ tân, quản lý, Admin; `components`, `data`, `lib` dùng chung.
- `server/src`: routes, controllers, services, middleware, config, lib; `server/scripts`: DB CLI; `server/test`: unit và HTTP tích hợp.
- `thu_cung.sql`, `migrations/`: nguồn schema; `plans/`: kế hoạch, DB, báo cáo, nhật ký; `docs/API.md`: hợp đồng API; `deploy/`, Dockerfile và `compose.yaml`: đóng gói local.

## 2. Vai trò và quyền

| Nhóm | vai_tro | chuc_vu | roleKey |
| --- | --- | --- | --- |
| Khách | KhachHang | Không bắt buộc | customer |
| Chăm sóc | NhanVien | Nhân viên chăm sóc | care |
| Lễ tân | NhanVien | Lễ tân | reception |
| Quản lý | NhanVien | Quản lý | manager |
| Admin | Admin | Không bắt buộc | admin |

Quyền được kiểm tra ở server từ DB, không tin vai trò trong request. Khách chỉ sở hữu hồ sơ/lịch/hóa đơn/khiếu nại của mình. Chăm sóc chỉ đọc/xử lý lịch được giao. Lễ tân/Quản lý/Admin tiếp nhận, điều phối, thu và ghi nhận thực chi. Quản lý/Admin duyệt hoàn, quản lý ca/danh mục/báo cáo. Chỉ Admin quản trị tài khoản. Khóa/đổi chức vụ không được làm mất công suất lịch đang mở; đang chăm sóc thì không khóa.

## 3. Màn hình và route thực tế

Route nằm sau dấu `#`.

| Mã/chức năng | Route | Trạng thái |
| --- | --- | --- |
| MH-01 đăng nhập/đăng ký | `/dang-nhap` | Có API/UI; lỗi đăng ký hiển thị ngay trong tab |
| Đổi mật khẩu tạm | `/doi-mat-khau` | Có API/UI, bắt buộc trước nghiệp vụ |
| Bảng giá | `/bang-gia` | Đã dùng API thật |
| Hồ sơ cá nhân | `/thong-tin-ca-nhan` | API/UI |
| Quên mật khẩu | `/quen-mat-khau` | Trang chờ; không tuyên bố đã tích hợp email/OTP |
| MH-11 hồ sơ thú cưng | `/ho-so-thu-cung` | API/UI |
| MH-02 đặt lịch | `/dat-lich` | API/UI |
| MH-03 lịch, hủy, đánh giá | `/lich-hen` | API/UI |
| MH-02b đặt tại quầy | `/le-tan/dat-lich-tai-quay` | API/UI, bàn giao tài khoản tạm khi mới tạo |
| MH-05 điều phối | `/le-tan/lich-hen` | API/UI, giữ chờ/từ chối/phân công, đổi lịch/nhật ký |
| MH-04 chăm sóc | `/nhan-vien/lich-lam-viec` | API/UI |
| MH-09 quản lý ca | `/quan-ly/ca-lam-viec` | API/UI |
| MH-06 thu tiền | `/le-tan/hoa-don` | API/UI |
| In hóa đơn | `/le-tan/hoa-don/:id/in` | Bản in trình duyệt / lưu PDF |
| MH-10a/b tiếp nhận, duyệt, thực chi | `/le-tan/khieu-nai` | Cùng trang, hiện chức năng theo quyền |
| In phiếu hoàn | `/le-tan/khieu-nai/:id/in` | Chỉ có chứng từ khi đã thực chi thành công |
| MH-07 báo cáo | `/quan-ly/bao-cao` | API/UI, theo ngày/kỳ |
| Danh mục dịch vụ | `/quan-ly/dich-vu` | API/UI thêm/sửa/ngừng bán, tạo nhóm |
| MH-08 tài khoản | `/admin/tai-khoan` | Đã nối router/API hiện có |

Thông báo trong ứng dụng ở khung khách và nhân sự; tải lại thủ công, 50 tin gần nhất, chỉ đánh dấu tin của mình. Không có SMS/email/realtime trong phạm vi đã nghiệm thu.

## 4. Quy trình, trạng thái và tiêu chí nghiệm thu

### Giai đoạn 1–3: môi trường, DB và backend

- `npm ci` riêng hai thư mục; build frontend; `/health` xác nhận tiến trình, `/ready` xác nhận DB/migration 000–005. API trả 503 `MIGRATION_REQUIRED` khi schema cũ, không tự chạy SQL.
- DB CLI không đọc `.env`; chỉ loopback, tên dev/test, `NODE_ENV` rõ và `PETCARE_ALLOW_DB_WRITE` khớp tên. Schema và lịch sử cùng transaction/khóa, checksum không khớp thì dừng. `db:reset` luôn từ chối.
- Seed insert-only: 7 tài khoản/5 nhóm, 2 thú cưng, 3 dịch vụ, 14 ca trong 7 ngày Việt Nam. Không đổi mật khẩu/hồ sơ cũ. Mật khẩu demo nhập riêng qua môi trường.
- SQL UNIQUE/EXCLUDE trả 409; validation 400/422; lỗi nội bộ không lộ SQL/stack. Lỗi ghi chi tiết/thông báo rollback toàn bộ.

### Giai đoạn 4 — AD-01/SD-01: xác thực

- Username 4–30 ký tự chữ/số/chấm/gạch dưới, SĐT 10 số, email tùy chọn, mật khẩu ít nhất 8 ký tự và tối đa 72 byte UTF-8; bcrypt trước lưu.
- JWT access khác refresh, kiểm tra ID/type/version; profile nhân viên và tài khoản phải hoạt động. Logout/đổi mật khẩu/reset/khóa thu hồi phiên theo version.
- Mật khẩu tạm 12 ký tự ngẫu nhiên, bàn giao một lần khi mới tạo, cờ bắt đổi; API nghiệp vụ chặn trước khi đổi. Không thay mật khẩu tài khoản sẵn có tại quầy.
- Frontend nhiều request 401 dùng chung một refresh, retry một lần; hết refresh thì về đăng nhập. Không retry 403.

### Giai đoạn 5: thú cưng/tra khách

CRUD chỉ khách, sở hữu đúng; chăm sóc chỉ đọc hồ sơ trong lịch được giao. Chó/mèo, ngày sinh không ở tương lai, cân nặng dương tối đa 999,99 kg. Ngừng theo dõi mềm, chặn khi còn lịch mở; khóa để không tranh chấp với tạo lịch. Tra khách theo SĐT chỉ bộ phận tiếp nhận.

### Giai đoạn 6 — AD/SD-02: đặt lịch

- 08:00 <= bắt đầu < kết thúc <=19:00, lưới bắt đầu 30 phút, không quá khứ, giờ Việt Nam. Cộng thời lượng dịch vụ thật, snapshot giá dự kiến.
- Một ca hoạt động bao trọn lịch; không gộp hai ca kề nhau. Nhân viên chăm sóc hoạt động; solver kiểm tra toàn khoảng và lịch chờ, không dùng hằng số công suất.
- Lịch/chi tiết/khách-thú cưng mới/thông báo trong một transaction có khóa ngày. Hai request tranh chỗ cuối phải có một 201, một 409. Tạo `ChoXacNhan`, chưa tự gán người.

### Giai đoạn 7 — AD/SD-03: điều phối

Ba nhánh loại trừ: giữ `ChoXacNhan` và lý do; từ chối `TuChoi`; hoặc gán người khả dụng và `DaXacNhan`. Không phân công sau từ chối. Hủy dùng `DaHuy`, có lý do cho nhân sự, quyền sở hữu cho khách; giữ lịch sử. Khóa chung với đặt/sửa ca, kiểm tra lại công suất cả lịch chờ khác. Ghi chú gốc đủ 500 ký tự không làm hủy thất bại: lý do đầy đủ nằm ở nhật ký.

### Giai đoạn 8 — AD/SD-04: ca và chăm sóc

- Quản lý tạo/sửa/hủy mềm ca; chặn chồng và mọi thay đổi làm thiếu chỗ/mất bao phủ lịch mở. Có nhật ký và đổi giờ an toàn về chờ phân công lại.
- Người được giao bắt đầu lịch trong ngày Việt Nam. `DaXacNhan → DangThucHien → HoanThanh`; từng chi tiết `ChoThucHien → DangThucHien → HoanThanh`. Chỉ kết thúc khi tất cả xong.
- Không đủ điều kiện: ghi vấn đề, báo lễ tân, giữ lịch chờ xử lý; không chạy hủy sau nhánh hoàn thành. Lễ tân quyết định hủy/đổi giờ; đổi giờ kiểm tra lại ca và bỏ gán cũ. Không tự hỗ trợ quyết toán dịch vụ làm dở.

### Giai đoạn 9 — AD/SD-05: hóa đơn/thu

- Lịch và mọi chi tiết phải hoàn thành, một hóa đơn/lịch. Chụp tên/đơn giá/số lượng, không đổi khi cập nhật bảng giá sau đó.
- Tổng = tổng dòng; thành tiền = tổng - giảm, 0 <= giảm <= tổng. Hóa đơn 0 đồng tất toán không sinh giao dịch 0.
- Thu từng lần dương <= còn nợ, lưu `ThanhToanMotPhan` để thu sau. Tiền khách đưa khác số ghi nhận; tiền thừa = tiền đưa - số ghi nhận. Thu thành công đủ thì `DaThanhToan`, giao dịch thất bại không giảm nợ.
- Khóa hóa đơn và khóa chống lặp unique; retry đúng nội dung trả giao dịch cũ, đổi nội dung cùng khóa trả 409. Chuyển khoản phải xác nhận đã nhận tiền.
- **Ngân hàng để cấu hình sau theo người dùng.** Tạo QR trả 503 `QR_NOT_CONFIGURED`; không giả lập mã nhận tiền thật. In chứng từ bằng trình duyệt, chưa phải tích hợp hóa đơn điện tử thuế.

### Giai đoạn 10 — AD/SD-06: khiếu nại/hoàn/đánh giá

- Lễ tân ghi `DaTiepNhan`; đúng lịch/hóa đơn. Quản lý bác bỏ/khắc phục thì `DaXuLy`, hoặc duyệt hoàn thì `ChoHoanTien`.
- Chỉ duyệt cho hóa đơn thu đủ và còn tiền hoàn. Số duyệt >0, <= tổng thu - tổng hoàn thành công - khoản duyệt khác đang chờ chi. Duyệt không ghi giao dịch thành công và không đánh dấu đã trả.
- Lễ tân ghi nhận thực chi có xác nhận và chứng từ; thành công mới có giao dịch `HoanTien/ThanhCong`, ngày/người chi, `DaXuLy`, hóa đơn `HoanTienMotPhan` hoặc `DaHoanTien`.
- Chi thất bại lưu riêng, vẫn chờ chi, không trừ tiền; khóa hóa đơn/khiếu nại, chống lặp và transaction toàn bộ. Hoàn 100.000/400.000 được thể hiện rõ và không hoàn vượt qua nhiều lần.
- Khách chỉ đánh giá lịch hoàn thành thuộc mình, sao nguyên 1–5, một đánh giá/lịch.

### Giai đoạn 11: báo cáo/danh mục/Admin

Thu/hoàn theo ngày giao dịch thành công ở Việt Nam; thực thu = thu thành công - thực chi hoàn. Không nối nhiều dòng hóa đơn với nhiều thanh toán làm nhân số tiền. Giá trị dịch vụ trước giảm theo ngày lập hóa đơn tách riêng; trạng thái lịch theo ngày hẹn. Gắn cờ giao dịch hoàn kiểu cũ để đối soát, không tự chuyển đổi lịch sử.

Admin không tự khóa/hạ vai trò. Đổi vai trò tạo đúng profile và giữ profile cũ phục vụ FK; thu hồi phiên khi đổi quyền. Khóa người đang làm bị chặn; đã phân công phải xác nhận, đưa về chờ phân công lại chỉ khi vẫn đủ công suất, nếu không rollback. Danh mục ngừng bán mềm và giữ giá lịch sử.

### Giai đoạn 12: kiểm thử/đóng gói — CHƯA HOÀN TẤT

- [x] Unit/RBAC/validation/timezone và frontend build.
- [x] Chín nhóm tích hợp trên DB cô lập khác nhau; hành trình thật qua HTTP, đăng nhập thật theo quyền.
- [x] QA trình duyệt MH-04/MH-09/MH-06/MH-10/MH-07/danh mục và đọc trang Admin; ảnh demo lưu riêng `.cache/local-run/`.
- [x] API, hướng dẫn chạy/test và quy trình sao lưu riêng; cấu hình Docker local không mount dữ liệu đang dùng.
- [ ] Docker build/up/health/seed/khởi động lại: BLOCKED vì chưa cài Docker; config mới chưa được nghiệm thu runtime.
- [x] Theo lựa chọn người dùng, backup DB cũ, restore riêng, đối chiếu schema 000/001 và thử baseline/migrate 002–005 trên bản sao; hash mọi giá trị cột cũ giữ nguyên. DB gốc và `.env` không đổi.
- [x] Khôi phục đăng nhập trên DB development ngày 24/10/2026: backup mới, schema khớp 000/001, baseline và migration 002–005; dữ liệu/mật khẩu giữ nguyên, ready/proxy 200, không đổi production.
- [ ] QA trình duyệt tài khoản tạm/bắt đổi, CRUD hồ sơ đầy đủ và responsive mọi vai trò.
- [ ] VietQR ngân hàng thật: DEFERRED theo người dùng, không phải kiểm thử đã đạt.

## 5. Công việc tiếp theo theo ưu tiên

1. Theo dõi sau khôi phục đăng nhập DB development; không reapply schema gốc hoặc seed/test vào dữ liệu đang dùng. Chi tiết tại docs/DB_LOCAL_RECOVERY.md.
2. Chạy Docker khi có Docker Desktop/Engine: `config --quiet`, build/up, ready, seed riêng và thử lưu volume; không `down -v` hoặc xóa dữ liệu.
3. QA UI còn thiếu, hoàn tất tiêu chí giai đoạn 12. Chỉ sau các bước này mới đánh dấu 12 hoàn thành.
4. Cấu hình nhận tiền/VietQR sau khi người dùng cung cấp lựa chọn ngân hàng, không yêu cầu mật khẩu ngân hàng.

## 6. Quy tắc lưu và nguồn bằng chứng

Sau công việc: cập nhật kế hoạch và [nhật ký](NHAT_KY_KIEM_TRA.md). Sau giai đoạn đạt nghiệm thu: commit/push lên nhánh công việc riêng theo [AGENTS.md](../AGENTS.md), so SHA của đúng nhánh remote trước khi báo đã lưu. Theo yêu cầu ngày 24/10/2026, không push trực tiếp lên main; chỉ merge vào main khi người dùng yêu cầu rõ. Không force-push, không commit `.env`, token, dump, build hoặc log. Git không sao lưu dữ liệu PostgreSQL.

Hướng dẫn [README](../README.md), [DB CLI](../server/scripts/README.md), [kiểm thử](../server/test/README.md), [API](../docs/API.md), [thiết kế DB](02_THIET_KE_CO_SO_DU_LIEU.md), [báo cáo](BAO_CAO_KIEM_THU_HE_THONG.md). Lịch sử mốc 2.0–2.2 và lỗi trước sửa được giữ trong nhật ký/Git. Bộ ảnh UML gốc chưa được vẽ lại trong đợt lập trình này; code đã áp dụng các sửa SD-03, SD-04 và AD/SD-06, không tuyên bố các PNG đã thay đổi.

### Sửa khung giờ đặt lịch ngày 24/10/2026

Đã phân biệt ngày chưa có ca chăm sóc với không còn chỗ/lỗi API; có nút kiểm tra lại. Database local chưa có ca, người dùng chọn tự xếp ca trong MH-09; không tự tạo ca hoặc nới công suất. HTTP booking14/14, frontend14/14 và build72 modules đạt. Xem nhật ký chi tiết.

## 7. Nâng cấp Emerald UI — roadmap 6 đợt theo yêu cầu ngày 24/10/2026

Đây là đợt nâng cấp giao diện và nối các luồng thiếu trên code giai đoạn1–11, không đổi số giai đoạn nghiệp vụ hoặc làm lại từ đầu. Nguồn chi tiết: [ma trận màn hình/quyền/API](MA_TRAN_UI_QUYEN_API.md), [đặc tả Design System](DESIGN_SYSTEM_EMERALD.md).

| Đợt nâng cấp | Phạm vi | Trạng thái |
| --- | --- | --- |
| 1 | Kiểm kê5vai trò và DS dùng chung | Hoàn thành nền tảng 1a/1b: StaffLayout, primitives, lint/test/build, keyboard và 3viewport; xem BAO_CAO_UI_DOT_1.md |
| 2 | Khách: dashboard, Pet Cards, wizard, hóa đơn/KN, menu | Chưa triển khai nâng cấp |
| 3 | Chăm sóc: hôm nay, timeline/progress/notes, profile | Chưa triển khai nâng cấp |
| 4 | Lễ tân: dashboard/calendar/filter/POS | Chưa triển khai nâng cấp |
| 5 | Quản lý/Admin: KPIs/charts/alerts/lighttheme | Chưa triển khai nâng cấp |
| 6 | Hồi quy/responsive/nghiệm thu mới | Chưa chạy nghiệm thu UI mới |

Tiến độ đợt 2 ngày 24/10/2026:

**Quyết định thiết kế đã chốt (từ tài liệu canvas):**
- Token màu mới: Primary `#00877D`, nút `#00796F` (5.3:1), Accent kem `#FFF0D9`, Background `#F8FAF9`; thay bộ Teal Emerald cũ.
- Font: Be Vietnam Pro (Google Fonts) thay Nunito; `@import` đặt đúng thứ tự trước `@import tailwindcss`.
- Trang Home công khai (hero, dịch vụ, đánh giá): nằm trong phạm vi, chưa implement.

**Đã triển khai:**
- `index.css`: token màu đầy đủ, font Be Vietnam Pro, focus ring `#00796F`, chuẩn bị cho trạng thái và biểu đồ.
- `Button.jsx`: primary dùng `brand-600` (#00796F), hover `brand-700`, active `brand-800`.
- `KhungKhachHang.jsx`: thêm mục Tổng quan đầu nav, logo link → `/tong-quan`, màu đồng bộ token mới.
- `TongQuan.jsx` + `TongQuan.css` (C1): bố cục theo tài liệu thiết kế gộp: lời chào theo giờ VN, minh họa SVG chó/mèo, 3 thẻ thống kê, lịch hẹn sắp tới (hiển thị tối đa 3 nhưng đếm toàn bộ), thông báo hiện có, thú cưng đang theo dõi (tối đa 4), dịch vụ hiện bán từ API. Có skeleton, trạng thái trống/lỗi và nút thử lại; không dùng số liệu minh họa.
- `App.jsx`: route `/tong-quan` trong nhóm Khách hàng.

**Kết quả kiểm tra bản nháp trước:** frontend 20/20 PASS, build 84 modules theo ghi nhận của mốc trước. **Kiểm tra riêng lần hoàn thiện C1:** chạy `npm run build` đúng một lần, PASS 85 modules, không có cảnh báo. Không chạy lại bộ kiểm thử hệ thống hoặc QA trình duyệt trong lần này; không dùng build để kết luận toàn bộ hành trình đã nghiệm thu.

**Còn thiếu đợt 2:** wizard đặt lịch 5 bước (C3), Pet Cards + modal (C2), khiếu nại của tôi + gửi sở hữu, trang Home công khai. Chưa QA trình duyệt 3 viewport. **Chưa đánh dấu hoàn thành đợt 2.**

Baseline chạy lại đợt1: backend67PASS/9nhóm tích hợp skip, frontend14PASS/build72modules. Lint chưa có script/config; UI mới/responsive chưa có để nghiệm thu, không báo PASS. Không thay runtime code/DB trong phần kiểm kê. Các kết quả cũ giữ rõ là mốc trước, không cộng trùng.

Đã chốt với người dùng: bổ sung luồng khách tự gửi khiếu nại trên lịch sở hữu; không thay quyền endpoint tiếp nhận cũ, không cấp duyệt/chi cho khách. DS không tự phân loại bệnh từ ghi chú TEXT, không tính KPI tổng từ listLIMIT200 hoặc unread50tin. Bỏ fallback dịch vụ mock khi nâng cấp2/4. Ca local vẫn do người dùng tự xếp; không thêm tự động. OTP/email/cổng thanh toán/WebSocket P2 giữ để sau.

### Chỉnh giao diện theo báo cáo đánh giá — 24/10/2026

- Đã sửa các mục P0 trong code: bỏ mã màn hình nội bộ và chữ hoa nút; chuẩn phần hiển thị ngày `dd/mm/yyyy`, giờ `HH:mm`, tiền `₫`; căn chung khung nội dung; lịch hẹn dùng toàn chiều ngang và mở drawer khi chọn; không còn panel hóa đơn/khiếu nại trống hoặc hai cột ca lệch nhau.
- Đã áp dụng các mục P1 về cách trình bày: chuông thông báo ở header, icon SVG theo nghiệp vụ, nút tạo ở tiêu đề, form phụ và chi tiết trong drawer; badge dịch vụ/ca; báo cáo làm nổi thực thu, đưa nút in lên đầu, căn phải tiền, nhóm trạng thái và progress; tài khoản cuộn theo trang và cảnh báo khi xác nhận khóa/đổi quyền.
- Tổng quan nhân sự đọc lịch hôm nay từ API hiện có; chỉ Quản lý/Admin đọc thêm báo cáo thực thu hôm nay. Không tính tổng hóa đơn từ danh sách giới hạn; số chưa đọc ghi rõ phạm vi 50 tin.
- Kiểm tra lần này: `npm run build` frontend đúng một lần, **PASS 90 modules**, không có cảnh báo. Đối chiếu diff và payload hiện có; không chạy bộ kiểm thử hệ thống, không ghi database. **Chưa QA trình duyệt từng luồng/viewport**, không coi build là nghiệm thu nghiệp vụ.
- Các mục P2 như lịch tuần, tùy chọn mật độ và QA ảnh 100% còn để sau. Không đánh dấu hoàn tất đợt 2–6 hoặc giai đoạn 12. Xem [bảng đối chiếu sửa UI](UI_SUA_THEO_DANH_GIA.md).

### Góp ý bổ sung phần khách hàng — 24/10/2026

- Dùng chung khung 1280px cho header/nội dung; tiêu đề và mô tả các trang khách thống nhất. Chữ phụ, nhãn/footer tăng độ rõ, thẻ có viền nhẹ thống nhất; giữ DateInput và chuông đã có.
- Dịch vụ ở Tổng quan có icon theo loại nội dung và CTA teal đậm; bỏ tím trang trí ở thẻ thống kê/dịch vụ, trả badge lịch hẹn về màu dùng chung; cân chiều cao cột thông báo.
- Lịch hẹn/hóa đơn/đặt lịch thiếu hồ sơ có empty state với minh họa và hướng dẫn; thêm nút Chi tiết gọi đúng thao tác xem lịch hiện có. Hóa đơn không giữ cột chi tiết trống khi chưa chọn.
- Thú cưng không hiển thị ba thống kê 0 khi chưa có dữ liệu, tránh nút Thêm bị lặp khi form tạo mở. Tài khoản chia hai cột form trên desktop, nút đổi mật khẩu dùng teal; dữ liệu tên khách và các hàm xử lý được giữ.
- Frontend build đúng một lần: **PASS 93 modules**, không cảnh báo. Tính tĩnh tương phản màu chữ phụ `#5B6B7F`: 5,20:1 trên `#F8FAF9`, 5,45:1 trên trắng; chữ trắng trên nút `#00796F`: 5,30:1. Chưa QA trình duyệt/WCAG toàn trang hoặc kiểm thử lại nghiệp vụ; không đánh dấu hoàn tất đợt nâng cấp.
- Biểu mẫu đặt lịch vẫn dùng luồng hiện có, chỉ thêm chỉ dẫn trình bày 3 nhóm thông tin, không tuyên bố đã làm wizard 5 bước. Chi tiết: [góp ý giao diện khách hàng](UI_KHACH_HANG_THEO_GOP_Y.md).

### Bổ sung footer — 24/10/2026

- Thêm `SiteFooter.jsx`/CSS dùng chung: footer đầy đủ cho khu khách hàng và bảng giá, bản gọn cho khu nhân sự và trang đăng nhập. Có thương hiệu, mô tả, giờ 08:00–19:00, liên kết tới các route sẵn có; không bịa địa chỉ/hotline. Bố cục linh hoạt theo màn hình, nằm sau nội dung, ẩn khi in.
- Chỉ chỉnh component/layout và tài liệu; không thay API, dữ liệu hay nghiệp vụ. Giữ các thay đổi có sẵn ngoài phạm vi.
- Build frontend đúng một lần: **PASS 95 modules**, không cảnh báo; chưa QA trình duyệt. Không chạy kiểm thử hệ thống hoặc đánh dấu hoàn tất giai đoạn.

### Lịch hẹn khách hàng dạng timeline theo ảnh — 24/10/2026

- Chỉ đổi `DanhSachLichHen.jsx` và thêm CSS cùng trang: ngày/thứ/tháng bên trái, đường timeline, thẻ thú cưng và trạng thái, dòng dịch vụ/đơn giá đã đặt, tổng tiền dự kiến, nút hủy/đánh giá và điểm đã đánh giá. Giữ layout chung/footer.
- Bốn tab Tất cả/Sắp tới/Hoàn thành/Đã hủy có số lượng thật; vẫn giữ lọc chi tiết đủ trạng thái hiện có. Lịch đang thực hiện trước, lịch sắp tới theo thời gian tăng dần, lịch cũ giảm dần. Dữ liệu sắp tới dùng mốc giờ Việt Nam.
- Chi tiết và đánh giá mở modal hiện có; xác nhận hủy dùng Modal chung. Đối chiếu tĩnh xác nhận thân hàm `doCancel` và `submitReview` giữ nguyên; không sửa `canCancel`, `canReview`, API hoặc dữ liệu.
- Tổng thời lượng lấy từ khoảng giờ của lịch; API hiện chưa trả thời lượng từng dòng nên không gán số minh họa. Không áp dụng quy định hủy trước `[X] giờ` từ ảnh vì nghiệp vụ hiện tại kiểm tra trạng thái; giữ nguyên điều kiện thật.
- Build frontend đúng một lần: **PASS 97 modules**, không cảnh báo; chưa QA hành trình trên trình duyệt. Không chạy toàn bộ kiểm thử hoặc ghi DB.

Nghiệm thu 1b ngày24/10: frontend lint PASS,20/20test,build77modules; backend67PASS/9SKIP. Browser 5nhóm login/menu và guard trên DB test riêng đạt, modal Tab/ShiftTab/Escape/busy/restore focus đạt sau sửa; shell/home/component 375/768/1440 không tràn ngang. Chưa nghiệm thu mọi màn hình cũ hoặc toàn hành trình mới; các dashboard KPI và Admin light nội dung còn đợt3–5. Chi tiết và danh sách file/API: [Báo cáo đợt1](BAO_CAO_UI_DOT_1.md). Tiếp theo: đợt2 khách hàng, bao gồm endpoint khiếu nại sở hữu đã được người dùng chấp thuận.
