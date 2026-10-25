# KẾ HOẠCH TỔNG THỂ PHÁT TRIỂN HỆ THỐNG PETCARE

> Phiên bản 3.0 · nghiệm thu mã nguồn và môi trường test ngày 23–24/10/2026.
> Kế hoạch triển khai chuẩn: file này. Giữ kiến trúc React/Express/pg/PostgreSQL hiện hữu.
> Ngày trên máy kiểm thử là 23/10, ngày nghiệp vụ Việt Nam đã sang 24/10. Không quy đổi số giai đoạn thành phần trăm.

## 0. Tiến độ hiện tại

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

Tiến độ đợt 2 ngày 24/10/2026: đã bổ sung trang khách `/hoa-don-cua-toi` dùng API hóa đơn theo quyền sở hữu, xem chi tiết, lịch sử giao dịch và mở bản in. Đây là một phần của đợt 2; dashboard, Pet Cards, wizard và khiếu nại khách còn thiếu nên **chưa đánh dấu hoàn thành đợt 2**. Frontend lint PASS, 20 test PASS, build PASS (80 modules); chưa QA trình duyệt theo nhiều viewport.

Baseline chạy lại đợt1: backend67PASS/9nhóm tích hợp skip, frontend14PASS/build72modules. Lint chưa có script/config; UI mới/responsive chưa có để nghiệm thu, không báo PASS. Không thay runtime code/DB trong phần kiểm kê. Các kết quả cũ giữ rõ là mốc trước, không cộng trùng.

Đã chốt với người dùng: bổ sung luồng khách tự gửi khiếu nại trên lịch sở hữu; không thay quyền endpoint tiếp nhận cũ, không cấp duyệt/chi cho khách. DS không tự phân loại bệnh từ ghi chú TEXT, không tính KPI tổng từ listLIMIT200 hoặc unread50tin. Bỏ fallback dịch vụ mock khi nâng cấp2/4. Ca local vẫn do người dùng tự xếp; không thêm tự động. OTP/email/cổng thanh toán/WebSocket P2 giữ để sau.

Nghiệm thu 1b ngày24/10: frontend lint PASS,20/20test,build77modules; backend67PASS/9SKIP. Browser 5nhóm login/menu và guard trên DB test riêng đạt, modal Tab/ShiftTab/Escape/busy/restore focus đạt sau sửa; shell/home/component 375/768/1440 không tràn ngang. Chưa nghiệm thu mọi màn hình cũ hoặc toàn hành trình mới; các dashboard KPI và Admin light nội dung còn đợt3–5. Chi tiết và danh sách file/API: [Báo cáo đợt1](BAO_CAO_UI_DOT_1.md). Tiếp theo: đợt2 khách hàng, bao gồm endpoint khiếu nại sở hữu đã được người dùng chấp thuận.
