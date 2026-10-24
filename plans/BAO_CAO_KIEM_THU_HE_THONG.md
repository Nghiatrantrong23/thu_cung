# Báo cáo kiểm thử và triển khai PetCare

> Cập nhật 24/10/2026 — đã khôi phục đăng nhập: DB development local đã baseline/nâng cấp 002–005 sau backup mới và thử bản sao; dữ liệu/mật khẩu giữ nguyên. Ready và proxy frontend trả 200, hồi quy xác thực 10/10 PASS. Các ghi nhận bên dưới về DB gốc chưa nâng cấp là mốc trước lần sửa này. Chi tiết: [biên bản khôi phục](../docs/DB_LOCAL_RECOVERY.md).


Ngày 23–24/10/2026. Phạm vi người dùng xác nhận: triển khai tiếp 8–11 rồi kiểm thử toàn bộ trên mã hiện hữu; ngân hàng cấu hình sau; sao lưu và rà soát bản sao DB cũ trước khi nâng cấp.

## 1. Kết luận theo phạm vi

**API nghiệp vụ 1–11 và hành trình HTTP: PASS trên DB test cô lập.** UI 8–11 đã kiểm tra các thao tác chính. Giai đoạn 12 chưa hoàn tất: Docker chưa có runtime để chạy; chưa QA mọi UI; bản sao DB cũ nâng cấp đạt nhưng DB gốc/cấu hình chạy chưa đổi. Không gắn nhãn toàn hệ thống/production PASS.

| Phân hệ | Kết quả | Bằng chứng / giới hạn |
| --- | --- | --- |
| Môi trường/backend | PASS test | Node 24.20.0, PostgreSQL 17; health/ready, lỗi/rollback |
| Database | PASS | 8 tích hợp + 10 unit; 16 bảng nghiệp vụ + history, migration 000–005 |
| Xác thực/hồ sơ | PASS API | 10 test; validation, sở hữu, mục đích JWT, thu hồi phiên, tạm bắt đổi |
| Đặt lịch | PASS | 14 HTTP; tranh chỗ, quyền, ca bao trọn và rollback; UI có nghiệm thu giai đoạn trước |
| Điều phối | PASS | 14 HTTP; giữ chờ/từ chối/phân công loại trừ, nhật ký/thông báo; UI giai đoạn trước |
| Ca/chăm sóc | PASS API/UI chính | 6 HTTP + journey; bắt đầu/từng dịch vụ/kết thúc, không đủ điều kiện; sửa ca hợp lệ và chặn rút ca mất lịch |
| Hóa đơn/thu | PASS API/UI chính | 8 HTTP; thu 100.000 tiền mặt trên hóa đơn 400.000, tiền đưa 200.000/thừa 100.000; chuyển khoản xác nhận thu thêm 300.000 |
| Khiếu nại/hoàn | PASS API/UI chính | 8 HTTP; duyệt chưa chi vẫn hoàn 0, chi thất bại giữ chờ, thành công hoàn 100.000/400.000; in phiếu |
| Báo cáo | PASS API/UI chính | 7 test cùng danh mục/Admin; thu 400.000, hoàn 100.000, net 300.000, không nhân dòng |
| Danh mục/Admin | PASS API; UI chính | Thêm dịch vụ 55.000/30 phút thành công; danh sách/chi tiết Admin nạp dữ liệu đúng; tạo/reset/khóa/đổi quyền kiểm thử HTTP |
| Hành trình | PASS 8/8 | Đăng ký thật, login thật bốn nhóm, pet, tạo dịch vụ/ca, đặt/phân công/chăm sóc/thu/duyệt/chi/báo cáo/đánh giá/thông báo qua HTTP |
| VietQR | DEFERRED | Người dùng chọn cấu hình sau; QR trả 503 rõ lý do, không dùng ngân hàng thật |
| Docker | BLOCKED runtime | Không có docker CLI; có Compose/Dockerfile/Nginx, parse YAML và kiểm tra tĩnh đạt; chưa build/up |

## 2. Kiểm thử tự động cuối

Backend mặc định `npm test`: **67 PASS, 0 FAIL, 9 skip** (các nhóm cần DB). Chín nhóm được chạy riêng, mỗi file dùng DB test mới trên cụm loopback 55439:

| File test | PASS |
| --- | --- |
| db-tooling.integration.test.js | 8 |
| auth-pets.integration.test.js | 10 |
| booking.integration.test.js | 14 |
| dispatch.integration.test.js | 14 |
| care-shifts.integration.test.js | 6 |
| invoices.integration.test.js | 8 |
| refunds.integration.test.js | 8 |
| reports-admin.integration.test.js | 7 |
| journey.integration.test.js | 8 |
| **Tổng gồm parent Node test** | **83** |

Bộ final chạy prefix `petcare_test_final_*_20261023234933`; journey lần đó phát hiện race ở fixture đồng hồ, đã sửa ghi file nguyên tử và chạy lại DB mới `petcare_test_final_journey_20261023c`: 8/8. Không che lần FAIL bằng chỉ báo tổng PASS. Frontend `node --test test/*.test.js`: **13/13**, build **71 modules**. Các chỉnh nhãn giao diện sau đó được build lại trước commit.

Các test nhóm có fixture SQL khi cần cô lập phân hệ. Riêng journey không SQL ép trạng thái hoàn thành; nghiệp vụ chuyển bằng HTTP. Đồng hồ test chỉ nạp qua `--import test/fixtures/fixed-clock.js` trong process test, không có ở app production. Test không đọc/in `.env`, không DROP/DELETE dữ liệu; DB được giữ để kiểm toán.

## 3. Lỗi đã tái hiện và sửa

| Lỗi trước sửa | Thay đổi và kết quả |
| --- | --- |
| API đăng ký nhận mật khẩu 1 ký tự; sai kiểu login/CRUD trả 500 | Validation kiểu/giới hạn và 400; auth/hồ sơ PASS |
| Refresh-purpose JWT có thể dùng như access; profile nhân viên ngừng vẫn đăng nhập | Kiểm purpose/ID/version và profile active; logout/đổi/reset/khóa thu hồi phiên |
| Nhân viên POST pet tự tạo hồ sơ khách | Chặn CRUD theo vai trò/sở hữu; kiểm thử gọi API trực tiếp |
| Hàm mật khẩu tạm yêu cầu 12 nhưng chỉ sinh 3 ký tự | crypto.randomInt đủ độ dài/nhóm ký tự; unit 100 lần, API bắt đổi |
| Frontend chưa tự refresh và Admin đọc sai response | Refresh dùng chung, retry một lần; sửa cấu trúc data/list/mật khẩu tạm và giữ warning khóa |
| Ghi chú 500 ký tự làm hủy lịch không lưu được lý do | Nhật ký riêng giữ toàn bộ lý do, giữ nguyên ghi chú cũ |
| Hoàn tiền có nguy cơ coi duyệt là đã chi, thiếu hoàn một phần | Duyệt giữ chờ, chỉ chi thành công đổi tiền/trạng thái; reserve/chống lặp/khóa/rollback |
| SQL quyết định hoàn báo 42P08 | Cast tham số trạng thái rõ kiểu; 8 test refunds chạy lại đạt |
| SQL khóa nhân viên báo 42702 do trang_thai mơ hồ | Chỉ rõ `lh.trang_thai`; 7 test reports-admin chạy lại đạt |
| UI chăm sóc mất lựa chọn lịch sau từng thao tác | Giữ lịch đang chọn và cập nhật từ response reload; QA hoàn tất hai dịch vụ đạt |
| Test đồng hồ đọc trúng file vừa truncate | Ghi `.next` rồi rename nguyên tử; hành trình chạy lại đạt |

Lỗi đăng ký bị ẩn ở tab đăng nhập đã sửa trong mốc trước, regression frontend vẫn đạt. Các sửa SD-03/SD-04/AD-SD-06 được thực thi trong code; **không thay/vẽ lại PNG UML gốc** trong đợt này.

## 4. QA trình duyệt

Dùng proxy riêng 5181/backend test 5001, DB `petcare_test_fullui_20261023a`; mọi người, giao dịch và xác nhận tiền là demo, không có chi tiền thật.

- Chăm sóc: bắt đầu, hoàn tất từng dịch vụ, kết thúc; lịch hoàn thành giữ nguyên, không đi hủy. Lịch khác báo không đủ điều kiện thì nút bắt đầu bị chặn, chờ lễ tân.
- Ca: thu hẹp đến 12:00 gây mất lịch bị chặn; giữ 08:00–19:00 và sửa ghi chú thành công.
- Thu: hóa đơn 400.000; thu từng phần/cash change/chuyển khoản xác nhận; QR báo chưa cấu hình; debt về 0.
- Hoàn: tiếp nhận → quản lý duyệt 100.000 → vẫn hoàn 0 → lưu chi thất bại → vẫn chờ → ghi nhận chi demo thành công → phiếu hoàn/hoá đơn hoàn một phần.
- Báo cáo: 400.000 - 100.000 = 300.000; dòng dịch vụ 150.000 + 250.000, đúng một hóa đơn.
- Admin: login đúng vai trò, đọc danh sách/chi tiết API thực; tạo/reset/đổi quyền/khóa đã kiểm API, không thay mật khẩu người dùng thật qua browser.

Ảnh local (không commit): `.cache/local-run/stage8-care-completed.png`, `stage9-payment.png`, `stage9-invoice-after-refund.png`, `stage10-refund-receipt.png`, `stage11-net-report.png`, `stage11-admin.png`. UI phản hồi/in bằng trình duyệt được quan sát; chưa kiểm máy in thật hay tích hợp thuế. UI temp-password, CRUD toàn bộ, responsive đủ thiết bị còn QA riêng.

## 5. Backup và kiểm tra database cũ theo người dùng

- Đã `pg_dump` custom vào `backups/petcare_before_upgrade_20261024070746.dump`, lưu SHA-256 trong báo cáo private. Dump bị gitignore, không gửi lên GitHub.
- Restore thành công vào `petcare_dev_review_20261024070746` trên cụm cô lập 55439; so số dòng 15 bảng khớp nguồn.
- So columns/types/defaults/identity/nullability, constraints, indexes, triggers/functions với SQL nguồn 000/001. Khác biệt ban đầu chỉ do cách pg_dump serialize cast VARCHAR-array; khi roundtrip cùng cách cho schema nguồn thì metadata khớp chính xác. Không bỏ qua constraint tùy ý.
- Chỉ baseline bản sao khi khớp, rồi áp 002–005 cùng migration runner: đạt, history 000–005. Hash toàn bộ giá trị các cột cũ ở mọi bảng khớp nguồn sau nâng cấp. Không seed hay test ghi nghiệp vụ trên bản sao dữ liệu thật.
- **DB gốc và `.env` giữ nguyên.** Bản sao dùng rà soát, không tự chuyển ứng dụng sang cluster test. App đang trỏ DB gốc sẽ báo `MIGRATION_REQUIRED`; cần quyết định áp nâng cấp có kiểm soát trước khi dùng chức năng mới.
- Thông tin audit chi tiết private: `.cache/local-run/database-audit.json`. Backup/restore thành công không thay việc đối soát giao dịch/timestamp cũ nếu từng ghi khác timezone. Không có truy cập production.

## 6. File thay đổi chính

- Backend: auth/middleware/pet và refresh/temp-password từ checkpoint trước; `services/shifts.js`, `care.js`, `audit.js`, `invoices.js`, `complaints.js`, `reports.js`, `catalog.js`; các route tương ứng; `controllers/admin.controller.js`, `config/db.js`, `lib/money.js`, `lib/readiness.js`, `server.js`.
- Schema: migrations 002–005, không sửa SQL đã phát hành 000/001.
- Frontend: App/routes, API client/context, MH-04/MH-09, hóa đơn/in, khiếu nại/in hoàn, báo cáo/danh mục, trang Admin sẵn có; bảng giá từ API thật.
- Test: auth-pets, care-shifts, invoices, refunds, reports-admin, journey, password/readiness và frontend refresh.
- Tài liệu/đóng gói: kế hoạch, DB, nhật ký, báo cáo này, README/API/test guide, hai Dockerfile/Compose/Nginx/.dockerignore. Danh sách chính xác nằm trong commit, không gồm dump/.env/cache/build.

## 7. Việc cần làm tiếp

1. Xem kết quả bản sao và quyết định nâng cấp DB phát triển đang chạy. Không tự áp baseline lên DB gốc hoặc production, không chạy lại schema gốc.
2. Cài/sẵn Docker theo lựa chọn người dùng rồi build/up/ready/seed/kiểm tra volume; hiện chưa có runtime để nghiệm thu.
3. QA UI còn thiếu, hoàn tất giai đoạn 12; VietQR tiếp tục để sau theo người dùng.

Không triển khai production, không xóa dữ liệu, không force-push. Lưu code lên GitHub chỉ xác nhận sau push và đối chiếu SHA.
