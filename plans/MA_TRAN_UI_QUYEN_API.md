# ĐỢT 1 — MA TRẬN MÀN HÌNH, QUYỀN VÀ API PETCARE

Ngày rà soát: 24/10/2026. Nhánh: codex/nang-cap-ui-dot-1. Đây là kiểm kê code hiện có và đề xuất triển khai, không phải chứng nhận UI mới đã hoạt động.

Nguồn chuẩn vẫn là ke_hoach_tong_the.md; roadmap nâng cấp UI gồm 6 đợt riêng, không thay số 12 giai đoạn nghiệp vụ cũ. Prompt ghi đã đến giai đoạn7 là mốc cũ: code hiện đã có nghiệp vụ8–11 và giai đoạn12 còn nghiệm thu. React18/Vite5/Tailwind4, Express4/pg/PostgreSQL giữ nguyên; không có thư mục models/ORM riêng.

## 1. Ký hiệu và hiện trạng chung

K = Khách hàng, C = Chăm sóc, T = Lễ tân, Q = Quản lý, A = Admin. Prefix API là `/api`; route UI nằm sau `#`. Quyền thực đọc từ DB, giao diện không thay thế middleware. “Có” nghĩa có route/component/hợp đồng trong code; kết quả chạy được ghi riêng ở mục7.

- Layout khách đã có header/menu mobile, chưa có tổng quan/menu Tài khoản.
- `/nhan-vien`, `/le-tan`, `/quan-ly`, `/admin` cùng dùng GiuChoVaiTro.jsx: thẻ chào và các nút chức năng, chưa có dashboard nghiệp vụ.
- Các trang nhân sự là màn hình riêng có link quay lại, chưa có StaffLayout/sidebar/breadcrumb dùng chung.
- Admin tài khoản nền tối; phần còn lại chủ yếu nền kem/trắng/teal. Nhiều component tự khai báo class input/button.

## 2. Ma trận khách hàng

| Màn hình / route hiện tại | Quyền hiện tại | API đang nối | UI hiện tại | Khoảng thiếu / đợt |
| --- | --- | --- | --- | --- |
| Đăng nhập/đăng ký `/dang-nhap` | Công khai | POST auth/dang-nhap, auth/dang-ky | Hai tab, validation, lỗi, hiện mật khẩu | Giữ hợp đồng và phiên; đồng bộ DS ở2 |
| Bảng giá `/bang-gia` | Công khai | GET dich-vu | Danh mục thật | Giữ loading/error, không fake data |
| Tổng quan khách | Chưa có | GET thu-cung, lich-hen, thong-bao có thể tái dùng | Chưa có | Dashboard/CTA/lịch gần nhất;2 |
| Hồ sơ `/ho-so-thu-cung` | K sở hữu; CRUD chỉ K | GET/POST thu-cung; GET/PUT :id; PATCH :id/trang-thai | Bảng + form trong trang | Pet Cards + modal/drawer;2 |
| Đặt lịch `/dat-lich` | K; tài khoản tạm phải đổi mật khẩu | GET dich-vu; GET lich-hen/khung-gio-trong; POST lich-hen | Form một trang, nhiều dịch vụ, tổng tiền/giờ | Wizard4 bước, giữ validation/API;2 |
| Lịch `/lich-hen` | K sở hữu | GET lich-hen; PATCH :id/huy; POST :id/danh-gia | Bảng lọc trạng thái, chi tiết, hủy và đánh giá | Giữ trạng thái/chặn hành động không hợp lệ;2 |
| Cá nhân `/thong-tin-ca-nhan` | UI chỉ K; API authenticated mọi vai trò | GET auth/toi; PUT auth/cap-nhat; POST auth/doi-mat-khau | Thông tin/cập nhật/đổi mật khẩu | Đưa vào menu Tài khoản;2 |
| Hóa đơn của tôi | Chưa có trang list riêng | GET hoa-don; GET hoa-don/:id kiểm sở hữu | Có trang in :id nhưng chưa có menu/list khách | List/detail/payment history/read-only/in;2 |
| Khiếu nại của tôi | GET đã cho K sở hữu; POST hiện chỉ T/Q/A | GET khieu-nai, GET :id | Chưa có trang khách; có trang in phiếu theo id | List/trạng thái/form gửi riêng theo quyết định mục5;2 |
| Thông báo | Đã đăng nhập, chỉ người nhận | GET thong-bao; PATCH :id/da-doc | details,50 tin gần nhất,tải lại | Header/badge/accessibility;không realtime |
| Quên mật khẩu `/quen-mat-khau` | Trang công khai | Chưa có email/OTP API | Trang đang phát triển | P2, không tự triển khai |

## 3. Ma trận nhân sự

| Vai trò / màn hình / route | Quyền và tác vụ hiện tại | API đang nối | Thiếu UI / đợt |
| --- | --- | --- | --- |
| C — trang đầu `/nhan-vien` | Thẻ chào, link chăm sóc, tin của mình | GET thong-bao | Dashboard4 chỉ số từ lịch của mình hôm nay;3 |
| C — chăm sóc `/nhan-vien/lich-lam-viec` | Chỉ lịch được gán; bắt đầu, từng dịch vụ, kết thúc, báo vấn đề | GET lich-hen?ngay; GET ca-lam-viec?ngay; PATCH lich-hen/:id/cham-soc; GET :id/nhat-ky | Timeline/Kanban, progress, health note;3 |
| C — hồ sơ riêng | UI chưa có; auth API hỗ trợ | GET auth/toi; POST auth/doi-mat-khau | Profile nhân sự/read-only định danh + đổi mật khẩu;3 |
| T — trang đầu `/le-tan` | Link tiếp nhận/điều phối/tài chính/khiếu nại | API phân hệ tương ứng | Dashboard vận hành;4 |
| T/Q/A — quầy `/le-tan/dat-lich-tai-quay` | Tra SĐT; tạo hồ sơ nếu mới; nhiều dịch vụ; tài khoản tạm | GET khach-hang/tra-cuu; GET dich-vu; GET lich-hen/khung-gio-trong; POST lich-hen/tai-quay | Giữ walk-in, đồng bộ DS, loại fallback mock;4 |
| T/Q/A — lịch `/le-tan/lich-hen` | Xem/lọc ngày/trạng thái; ba nhánh phân công/giữ chờ/từ chối; hủy/đổi giờ | GET lich-hen; GET :id/nhan-vien-kha-dung; PATCH :id/xu-ly, :id/huy, :id/doi-lich; GET :id/nhat-ky | Search khách/pet/SĐT, filter nhân viên, ngày/tuần Calendar, drawer;4 |
| T/Q/A — thu `/le-tan/hoa-don` | Lập từ lịch hoàn thành, giảm giá, nhiều lần, cash/change/transfer/failed | GET/POST hoa-don; GET :id; POST :id/thanh-toan; GET :id/qr | Giữ số tiền thật; chuẩn hóa bố cục bốn chỉ số;4 |
| K sở hữu/T/Q/A — in hóa đơn `/le-tan/hoa-don/:id/in` | Chỉ đọc/in theo quyền | GET hoa-don/:id | Kết nối menu khách, giữ CSS print;2/4 |
| T/Q/A — tiếp nhận/chi `/le-tan/khieu-nai` | Tạo khiếu nại, xem bill, ghi thực chi đã duyệt; T không duyệt | GET/POST khieu-nai; GET hoa-don/:id; POST khieu-nai/:id/chi-hoan | Tách biểu đạt duyệt/chi/failed, filter/search đồng bộ;4 |
| Q/A — duyệt ở trang khiếu nại trên | Bác bỏ/khắc phục/duyệt hoàn; giữ transaction/giới hạn/chống lặp | PATCH khieu-nai/:id/quyet-dinh | Giữ cùng quy trình, không thêm nút cho T/C/K;5 |
| K sở hữu/T/Q/A — in hoàn `/le-tan/khieu-nai/:id/in` | Chỉ khi đã thực chi thành công | GET khieu-nai/:id | Giữ bản in, liên kết menu khách;2/4 |
| Q — trang đầu `/quan-ly` | Link các phân hệ quản lý/tiếp nhận | lich-hen/ca/khieu-nai/bao-cao | KPI/charts/alerts thực tế;5 |
| Q/A — ca `/quan-ly/ca-lam-viec` | Tạo/sửa/hủy mềm, bảo vệ ca/lịch mở | GET ca-lam-viec; GET /nhan-vien; POST /; PATCH :id; POST :id/huy | DS, xác nhận hủy, empty gợi ý xếp ca;5 |
| Q/A — dịch vụ `/quan-ly/dich-vu` | Tạo nhóm/thêm/sửa/ngừng bán, giữ snapshot | GET dich-vu/quan-ly; POST /loai; POST /; PATCH :id | Search/filter/form/card-table thống nhất;5 |
| Q/A — báo cáo `/quan-ly/bao-cao` | Thu/hoàn/net theo kỳ, dịch vụ, trạng thái, in | GET bao-cao/doanh-thu?tuNgay&denNgay | Line/bar/chart có bảng dữ liệu tương đương;5 |
| A — trang đầu `/admin` | Link nghiệp vụ T/Q và tài khoản; không làm chăm sóc | API tương ứng theo quyền | Dashboard tài khoản theo role/position/active;5 |
| A — tài khoản `/admin/tai-khoan` | List/search/role filter, tạo nhân viên, sửa quyền, khóa/mở/reset tạm | GET/POST admin/tai-khoan; PATCH :id; POST :id/khoa, /mo-khoa, /dat-lai-mat-khau | Light theme; filter active/locked; KPI, dialog đồng bộ;5 |

Admin có thể đọc/điều phối/tài chính theo quyền hiện tại, nhưng không gọi PATCH chăm sóc thay C. Quản lý không gọi API tài khoản Admin. Nhân viên chăm sóc không có thao tác phân công/thu/duyệt.

## 4. Rủi ro tích hợp phát hiện

| Phát hiện qua đọc mã | Hệ quả | Cách xử lý theo lộ trình |
| --- | --- | --- |
| DatLich.jsx và DatLichTaiQuay.jsx fallback sang defaultMockServices khi API lỗi/rỗng | Người dùng thấy giá/ID không thuộc DB; không được dùng để nghiệm thu | Bỏ fallback trong2/4, loading/error/empty thật + retry |
| khoThuCung ghi lỗi console và trả pets=[] | Lỗi kết nối có thể bị hiểu thành chưa có thú cưng | Expose error cho empty/error riêng trong2 |
| GET hóa đơn và khiếu nại LIMIT200 | Đếm list có thể thiếu KPI | API tổng hợp chỉ đọc theo quyền hoặc hiển thị đúng “200 gần nhất”; không gọi tổng nếu chưa đủ |
| Thông báo chỉ50 tin | Badge không phải tổng unread toàn hệ thống | Nhãn50 tin hoặc thêm count riêng theo người nhận |
| Lọc ngày GET lich-hen trong nhánh K chưa áp giống staff | Dashboard khách không được giả định server đã lọc ngày | Lọc đúng dữ liệu của mình theo VN hoặc bổ sung query giữ ownership |
| constants/status.js thiếu HoanTienMotPhan/ChoHoanTien, nhiều map cục bộ | Nhãn/màu lệch và khó bảo trì | Một presentation map đủ domain, không đổi enum DB |
| Ghi chú sức khỏe chỉ TEXT, chưa phân loại allergy/behavior/medical | Không đủ dữ liệu để khẳng định “dị ứng/hung dữ” | Badge generic và giữ nguyên nội dung; không NLP tự chẩn đoán |
| Chưa có ảnh thú cưng hoặc upload/storage | Pet Card không thể giả đã có ảnh | Avatar chữ/tên/biểu tượng; không lấy ảnh người khác hoặc thêm upload ngoài phạm vi |
| Chưa có backend dashboard chuyên biệt | KPI lớn cần query đúng và role guards | Tái dùng đủ dữ liệu trước, bổ sung aggregate read-only khi list bị cắt |
| Nhân sự không có StaffLayout; modal/dialog trùng | UI/keyboard không đồng bộ | Đặc tả và chuẩn hóa components trước khi chuyển từng trang |

## 5. Điểm quyền đã chốt với người dùng

Ngày24/10/2026 người dùng chọn “Thêm luồng khách gửi khiếu nại của mình” khi được nêu xung đột giữa yêu cầu này và guard giữ quyền.

- Bổ sung endpoint riêng **đề xuất** POST `/api/khieu-nai/cua-toi`, chỉ K, lấy userId từ JWT, kiểm sở hữu lịch và hóa đơn trong server. Không nhận owner/status/decision/amount/actor từ client để cấp quyền.
- Giữ POST `/api/khieu-nai` cho T/Q/A; giữ nguyên PATCH quyết định Q/A và POST chi hoàn T/Q/A. Không cho K tự duyệt/chi.
- Cột hiện tại nguoi_tiep_nhan NOT NULL và FK người dùng sau005; không gán ngẫu nhiên lễ tân. Ở luồng mới lưu người nộp có xác thực là actor và hiển thị “Khách tự gửi”, tránh coi đó là nhân viên đã tiếp nhận. Cần mapping phản hồi/query theo actor role, không dựng nhận định sai từ tên cột. Không đổi schema nếu actor hiện tại đủ biểu đạt; nếu cần lưu nguồn riêng thì lập đề xuất migration trước.
- Dùng cùng quy trình sau tiếp nhận, DaTiepNhan/ChoHoanTien/DaXuLy, thông báo quản lý và ownership. Test K khác403/404, giả ID, bill sai lịch, payload dư không thay quyền, C bị chặn.
- **Đây là thiết kế đã thống nhất phạm vi, chưa phải endpoint đã tồn tại.** Triển khai ở2 sau nền DS.

## 6. Nguồn code và phạm vi DB

Đã đọc App/main/layout, các trang theo5vai trò, Context auth/pets/bookings, CSS/theme, components guards/status/confirm/notifications/audit; routes auth/pet/booking/shifts/billing/complaints/report/admin; controllers và services nghiệp vụ liên quan; SQL gốc và migrations001–005; kế hoạch và thiết kế DB. Không có model ORM để chuyển đổi.

16 bảng nghiệp vụ +1history; giữ vai trò/ownership/transaction/day-lock/intervalsolver/invoice snapshots/payment+refund idempotency. Không cần thay schema để chuẩn hóa UI. Không đọc .env, không chạy seed/migration/ghi DB ở đợt kiểm kê này. Ca local do người dùng tự xếp, không tự thêm7ngày.

## 7. Baseline kiểm tra mới của đợt1

| Hạng mục | Kết quả | Bằng chứng/giới hạn |
| --- | --- | --- |
| Frontend unit | PASS14/14 | node --test test/*.test.js |
| Frontend build | PASS | npm run build,72modules |
| Backend unit/RBAC | PASS67 | npm test |
| Backend tích hợp | SKIP9 nhóm | Không có TEST_DATABASE_URL; không gọi là PASS mới, không chạy ghi trên DB người dùng |
| Lint | BLOCKED cấu hình | Cả2package chưa có lint script/config; không giả npm run lint đã đạt |
| UI mới/responsive3viewport | BLOCKED nghiệm thu | Đợt này mới kiểm kê/đặc tả theo yêu cầu xuất trước code; chưa có UI mới để kiểm chứng |
| Diff và phạm vi | Chỉ tài liệu | Không đổi API/quyền/schema/thuật toán/UI runtime |

Các kết quả tích hợp83PASS và QA trước đây được giữ trong nhật ký, không tính là chạy lại trong đợt1. Baseline này phục vụ so sánh khi implement DS và mỗi đợt tiếp theo.

## 8. Đầu ra và cổng nghiệm thu

Đầu ra: ma trận này, [đặc tả Design System](DESIGN_SYSTEM_EMERALD.md), cập nhật roadmap trong kế hoạch chuẩn. Đã hoàn tất **kiểm kê và thiết kế trước code** của đợt1. Phần triển khai components DS của đợt1 chưa làm và chưa đánh dấu hoàn thành; phải build/QA sandbox/keyboard/responsive trước khi chuyển2.

Sau mỗi đợt báo cáo trước/sau, file, API thực, PASS/FAIL/BLOCKED và responsive riêng. Commit/push nhánh riêng có SHA xác nhận; chỉ merge main khi người dùng yêu cầu.

## 9. Cập nhật sau triển khai 1b — 24/10/2026

Các mô tả “chưa có StaffLayout/components/lint” phía trên là mốc audit1a. Hiện đã triển khai shell nhân sự, primitives/feedback, component lab development-only, lint và6nhóm test mới. Kết quả frontend20PASS/build77modules/lintPASS, backend67PASS/9SKIP; keyboard/modal và shell/component3viewport đạt. [Báo cáo nghiệm thu1b](BAO_CAO_UI_DOT_1.md) nêu phạm vi cụ thể. API/quyền/schema không đổi; dashboard KPI, nội dung Admin sáng, phân hệ khách mới và endpoint khách nộp khiếu nại chưa triển khai.
