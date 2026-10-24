# Nhật ký kiểm tra và lưu Git

## 23/10/2026 - Bản lưu ban đầu

- Dự án chính: `D:/dich_vu_thu_cung`. Ban đầu chưa có quyền ghi; sau khi người dùng đồng ý, Windows đã cấp quyền Modify cho tài khoản hiện tại trên riêng thư mục dự án. Git sẽ được khởi tạo và sử dụng tại đây.
- Thư mục `output/thu_cung_git` của chat chỉ dùng để chuẩn bị bản chụp và kiểm tra trong lúc xử lý quyền ghi; không phải nơi tiếp tục phát triển.
- Nhánh dự kiến: `main`; remote: `https://github.com/Nghiatrantrong23/thu_cung.git`.
- Mã nguồn sao chép khớp bản gốc qua SHA-256. Hai kế hoạch được thay bằng phiên bản 2.0 đã gửi người dùng; thêm `.gitignore`, `AGENTS.md`, `README.md` và nhật ký này.
- Frontend: `npm run build` trong bản sao, Vite 5.4.21, 55 modules; **đạt**. Dependency dùng để build được sao chép từ máy, không đưa vào Git.
- Backend: `node --check` trên 19 file JavaScript trong server; **đạt kiểm tra cú pháp**. Chưa chạy API hoặc kiểm thử tích hợp PostgreSQL.
- `.gitignore`: kiểm tra chặn `.env`, `.env.local`, `node_modules`, `dist`, log và dump; cho phép `.env.example` an toàn.
- Quét 66 file văn bản của bản chụp trước khi thêm nhật ký: chưa phát hiện mẫu token GitHub/OpenAI/AWS, JWT cố định, khóa riêng hoặc URL database có mật khẩu. Đây là kiểm tra theo mẫu, không thay thế quản lý bí mật.
- Template DB_PASSWORD/JWT_SECRET/JWT_REFRESH_SECRET được kiểm tra là giá trị mẫu, không xuất giá trị thật.
- Không chạy migration, seed, concurrency test có ghi dữ liệu hoặc E2E. Không đánh dấu giai đoạn 6 hoàn thành.
- Việc push chỉ được xác nhận với người dùng sau khi SHA trên remote khớp SHA commit cục bộ; nhật ký này không tự chứng minh push đã thành công.

## Quy tắc ghi tiếp

## 23/10/2026 - Giai đoạn 2: migration và seed

- Chỉ dùng cụm PostgreSQL 17 mới trong .cache/petcare-test-db, loopback cổng 55439; không kết nối/chỉnh database của dịch vụ PostgreSQL hiện có. Database test giữ lại, không DROP/DELETE.
- Hoàn thiện db:init/migrate/seed/setup; reset từ chối. Đích local dev/test phải được chỉ định rõ, không đọc .env. Migration có checksum, lịch sử, transaction và advisory lock; seed không ghi đè dữ liệu demo cũ.
- `node --test test/db-tooling.integration.test.js test/db-tooling.test.js` từ server với TEST_DATABASE_URL trỏ petcare_test_tooling_20261023c: **18/18 đạt**. Kiểm tra 15 bảng nghiệp vụ + bảng lịch sử, ràng buộc, migration lặp/checksum/lỗi rollback, seed idempotent, CLI và hai runner đồng thời.
- Không suy ra database đang vận hành đã được nâng cấp. DB cũ thiếu lịch sử cần rà soát/baseline riêng; không tự áp SQL gốc. Không ghi mật khẩu demo vào source hoặc nhật ký.

Mỗi giai đoạn thêm ngày, phạm vi, lệnh kiểm tra, kết quả, phần chưa đạt và rủi ro cần xử lý. Mã commit/link remote được báo sau push; không sửa commit vừa tạo chỉ để nhúng SHA của chính commit đó.

## 23/10/2026 - Lõi đặt lịch, quyền và giờ nghiệp vụ (giai đoạn 3/4/5/6/8A)

- Bỏ công suất 2 cố định, dùng người chăm sóc/tài khoản hoạt động và một ca đủ cả thời lượng. Thuật toán kiểm tra khả năng phân bổ các khoảng chồng nhau, giữ nguyên nhân viên đã gán; không tự phân công lịch mới. Tìm kiếm có giới hạn, quá tải trả 503.
- Ngày/giờ theo Asia/Ho_Chi_Minh. Kiểm tra và ghi lịch cùng transaction/khóa theo ngày; khách mới/thú cưng/chi tiết tại quầy cùng rollback. Siết quyền theo chức vụ và sở hữu; chăm sóc chỉ đọc lịch/thú cưng được giao. Hủy kiểm tra số dòng cập nhật; ngừng theo dõi khóa dòng thú cưng trước kiểm tra lịch mở.
- `npm test` tại server: **63 đạt, 2 nhóm tích hợp bỏ qua** khi không đặt TEST_DATABASE_URL. Không gọi kết quả này là đã chạy tích hợp.
- `node --test test/booking.integration.test.js` với DB mới petcare_test_booking_20261023root2 trên cụm cô lập cổng 55439: **14/14 đạt**. Có login bcrypt thật, tranh chỗ cuối đúng 201/409, quyền/sở hữu, dữ liệu sai/quá khứ/không ca, rollback toàn bộ khi thiếu chỗ hoặc lỗi chi tiết, giấu lỗi SQL, trạng thái chờ không gán người và tranh chấp ngừng theo dõi/đặt lịch.
- Frontend `node --test test/business-time.test.js`: **7/7 đạt**; `npm run build`: **đạt**, 55 modules. Chưa kiểm thử thao tác UI trình duyệt hoặc E2E đầy đủ.
- DB tích hợp trước đó: **18/18** gồm 10 unit + 8 tích hợp; không cộng trùng 10 unit vào tổng 63. Test DB giữ lại, không xóa dữ liệu; không đọc/in bí mật .env.
- Giai đoạn 6 chưa nghiệm thu toàn bộ: tài khoản mới tại quầy dùng hash ngẫu nhiên nhưng chưa có bàn giao/bắt đổi mật khẩu; thông báo ứng dụng chưa nối; UI thực tế chưa kiểm tra. API sửa ca/khóa nhân viên sau này cần bảo vệ ảnh hưởng lịch đã có.

## 23/10/2026 - MH-01: lỗi đăng ký bị ẩn

- Log local xác nhận API đăng ký trả 400 vì trùng số điện thoại; frontend lưu message vào loginError nhưng chỉ render tại tab đăng nhập. Sửa để errors.form hiển thị ngay dưới nút đăng ký; sửa lỗi hook loading nằm sau return có điều kiện.
- Tách registerAccount để kiểm thử, chặn mọi trường không hợp lệ trước gọi API, loại kiểm tra trùng dựa tài khoản mẫu. Backend/database không thay đổi.
- `node --test test/*.test.js` tại dichvu: 11/11 đạt (4 test mới: lỗi trùng, validation mọi trường, hợp đồng request/success, lỗi mạng/JSON). Build frontend đạt, 56 modules.
- Trình duyệt tại proxy local 5180: API mô phỏng 400 hiển thị lỗi dưới nút trong tab Đăng ký; API mô phỏng 201 chuyển Đăng nhập và hiển thị thành công. Không gửi thông tin người dùng, không ghi DB. Screenshot .cache/local-run/register-error-fixed.png là dữ liệu giả, không commit.

## 23/10/2026 - Giai đoạn 7: quản lý lịch và phân công

- MH-05 `/le-tan/lich-hen`: bộ lọc ngày/trạng thái, chi tiết khách/thú cưng/dịch vụ, nhân viên khả dụng, ba nhánh phân công/giữ chờ/từ chối; hủy có lý do cho lịch xác nhận. Nối từ trang nhân sự và sau đặt quầy, thêm nhãn Từ chối cho khách.
- Khóa ngày cùng namespace đặt lịch, khóa dòng lịch, kiểm tra lại ca/công suất và quyền. Gán người + DaXacNhan + thông báo trong một transaction. Từ chối/hủy không giữ chỗ, không xóa lịch sử; chi tiết chuyển DaHuy. Giữ ghi chú gốc, tổng tối đa 500 ký tự; vượt giới hạn trả lỗi, không cắt nội dung.
- Thông báo trong ứng dụng: lịch mới tới bộ phận tiếp nhận, xác nhận/từ chối/hủy tới khách và nhân viên liên quan; GET list và PATCH đã đọc chỉ thao tác người nhận hiện tại. UI tải lại, hiển thị 50 tin gần nhất; chưa triển khai realtime/SMS/email.
- `npm test` backend: **65 đạt, 3 nhóm tích hợp bỏ qua** khi không đặt TEST_DATABASE_URL. Hai route mới được kiểm tra ma trận quyền.
- `node --test test/dispatch.integration.test.js` với DB mới petcare_test_dispatch_20261023b: **14/14 đạt** gồm tranh phân công cùng nhân viên, phân công/từ chối cùng lịch, ngoài/thiếu ca, chức vụ/tài khoản khóa, bảo toàn khả năng phục vụ lịch chờ khác, giữ chờ, từ chối giải phóng chỗ, hủy lý do/tranh chấp, quyền thông báo và rollback khi ép lỗi thông báo.
- Hồi quy `node --test test/booking.integration.test.js` với DB mới petcare_test_booking_stage7regression_20261023a: **14/14 đạt**. Frontend `node --test test/*.test.js`: **11/11 đạt**, `npm run build`: **đạt**, 58 modules.
- Trình duyệt qua proxy 5181 nối backend thật 5001 và DB petcare_test_stage7ui_20261023a trong cụm cô lập cổng 55439: login demo lễ tân -> MH-05 -> giữ chờ có ghi chú -> phân công -> lọc/xem đã xác nhận đúng người -> hủy có lý do; từ chối thiếu lý do bị chặn, có lý do thành công; login khách nhận 3 tin và đánh dấu đọc giảm còn 2. Screenshot `.cache/local-run/stage7-assigned.png` chỉ có dữ liệu demo, không commit.
- Không đổi SQL/migration, không seed hoặc sửa DB đang dùng; chỉ SELECT metadata local xác nhận ca/thông báo/ngay_cap_nhat tồn tại. Khởi động lại đúng backend local đã bật ở cổng 5000 để nạp code mới. Bản test PostgreSQL giữ dữ liệu kiểm toán; các máy chủ test sẽ dừng sau nghiệm thu.
- Giai đoạn 7 đạt trên môi trường test. Giai đoạn 8B chưa thực hiện; bàn giao/bắt đổi mật khẩu tài khoản tạm giai đoạn 6 vẫn chưa làm. Việc quản lý ca sau này cần dùng cùng khóa và bảo vệ lịch đã phân công.

## Rà soát mở rộng 1–7 và checkpoint giai đoạn 8

- Trước sửa `auth-pets.integration.test.js` trên petcare_test_audit_before_20261023a: 6 nhóm FAIL (cộng parent: 7 FAIL). API thực đã nhận mật khẩu 1 ký tự, login kiểu sai trả 500, refresh-purpose token có thể dùng như access khi secret khớp, hồ sơ nhân viên ngừng vẫn đăng nhập, nhân viên tự tạo khách qua POST thú cưng, trường thú cưng sai kiểu trả 500.
- Sửa validation backend, quyền, kiểm tra type/version JWT, profile active; logout/đổi mật khẩu thu hồi phiên. Thêm tự refresh frontend dùng chung một request khi nhiều API hết hạn. Sửa hàm mật khẩu tạm: cũ yêu cầu 12 nhưng sinh 3; mới đủ 12 và mạnh qua 100 lần tạo. Tài khoản mới tại quầy trả mật khẩu tạm một lần, bắt đổi; không thay mật khẩu tài khoản cũ.
- `auth-pets.integration.test.js` mở rộng trên petcare_test_auth_extended_20261023b, rồi petcare_test_auth_care_20261023a: **10/10 PASS**; password unit: **1/1 PASS**. Không ghi mật khẩu/JWT fixture trong log.
- Migration 002/003 chỉ áp trên test: thêm trạng thái phiên, cờ mật khẩu tạm, ca soft-cancel và nhật ký. Hiện schema test 16 bảng nghiệp vụ (thêm nhật ký) + 1 bảng lịch sử migration.
- `care-shifts.integration.test.js` trên petcare_test_care_20261023a: **6/6 PASS**, bảo vệ ca cho lịch pending/assigned, chuyển tiến độ đúng thứ tự, không hoàn tất sớm, nhánh không đủ điều kiện, đổi lịch, bảo toàn ghi chú 500 ký tự và lưu lý do hủy trong audit.
- Hồi quy: booking trên petcare_test_booking_stage8_20261023a **14/14 PASS**; dispatch trên petcare_test_dispatch_stage8_20261023a **14/14 PASS**. `npm test`: **66 PASS, 5 skip** (đã chạy các nhóm tích hợp riêng).
- DB tooling lần đầu có 1 subtest FAIL vì CURRENT_DATE PostgreSQL khác ngày seed Asia/Ho_Chi_Minh; sửa để dùng ngày ca trong fixture. Chạy lại petcare_test_db_stage8_20261023b: **8/8 PASS**. Không coi test timezone hỏng là ràng buộc DB đã mất.
- Frontend **13/13 PASS**, build **63 modules**. MH-04/MH-09 và đổi mật khẩu tạm có code, chờ QA trình duyệt trọn chuỗi; chưa đánh dấu UI PASS hoặc hoàn tất giai đoạn 8.
- Theo trả lời người dùng, tiếp tục 9–11; cấu hình ngân hàng VietQR để sau. Các DB test giữ lại, không DROP/DELETE. Chưa migrate DB người dùng, chưa triển khai production.

## 23–24/10/2026 — giai đoạn 9–11 và nghiệm thu mở rộng

- Theo người dùng, triển khai tiếp 8–11 trước kiểm thử toàn bộ; ngân hàng để cấu hình sau. Thêm hóa đơn snapshot/giảm giá/thu nhiều lần/tiền thừa/chống lặp/giao dịch thất bại; khiếu nại duyệt khác thực chi, hoàn một phần/toàn bộ, giới hạn sau khoản đã hoàn và đang chờ; báo cáo theo ngày thu/chi, danh mục và nối trang Admin sẵn có. Không xây lại frontend/backend hoặc đổi ORM.
- Migration 004/005 chỉ áp test và bản sao đã rà soát: trường tài chính/actor/idempotency, trạng thái HoanTienMotPhan/ChoHoanTien, chứng từ/lần chi thất bại, unique thành công theo khiếu nại. pg Pool đặt timezone Asia/Ho_Chi_Minh; không tự chuyển timestamp dữ liệu cũ.
- `invoices.integration.test.js`: 8/8 PASS. `refunds` lần đầu lỗi 42P08 tham số trạng thái không suy kiểu được; sửa cast $5::text, petcare_test_refunds_20261023b chạy lại 8/8 PASS. `reports-admin` có lỗi 42702 trang_thai mơ hồ; chỉ rõ lh.trang_thai, petcare_test_reports_20261023b đạt 7/7.
- Rà soát Admin: UI đọc nhầm data/list/mật khẩu tạm; sửa response adapter và refresh; khóa/đổi chức vụ lấy khóa ca/ngày, giữ lịch sử profile và chặn mất công suất; self-lock/hạ quyền hoặc đang chăm sóc bị chặn. Mật khẩu/reset trả tạm đủ 12 ký tự, bắt đổi và thu hồi phiên.
- QA browser riêng 5181/5001, DB petcare_test_fullui_20261023a: chăm sóc hai dịch vụ đến hoàn thành; nhánh khác không đủ điều kiện chờ lễ tân; thu hẹp ca gây thiếu bao phủ bị chặn, sửa ghi chú ca hợp lệ thành công; hóa đơn 400.000 thu tiền mặt 100.000 (khách đưa 200.000/thừa 100.000), chuyển khoản xác nhận 300.000; duyệt hoàn 100.000 chưa ghi đã trả, chi demo thất bại giữ chờ, xác nhận chi demo thành công mới hoàn một phần. Phiếu hoàn và hóa đơn sau hoàn hiển thị đúng; báo cáo thu 400.000, hoàn 100.000, net 300.000. Không thực hiện chuyển tiền thật.
- QA thêm danh mục dịch vụ 55.000/30 phút và danh sách/chi tiết Admin nối API thật. UI mất selected sau mỗi thao tác chăm sóc đã sửa; nhãn tiến độ/giao dịch đổi sang tiếng Việt. Ảnh demo trong .cache/local-run/, không commit.
- Thêm readiness: /health sống tiến trình; /ready kiểm DB/history 000–005. API trả 503 rõ MIGRATION_REQUIRED/DATABASE_UNAVAILABLE thay vì để schema cũ gây lỗi SQL. Readiness chỉ SELECT, không tự tạo/migrate/baseline. Unit có kiểm tra legacy/incomplete từ chối và không ghi.
- Final hồi quy 9 nhóm, DB riêng prefix petcare_test_final_*_20261023234933: tooling8, auth10, booking14, dispatch14, ca6, invoice8, refund8, reports7. Journey lần đó FAIL do đọc file đồng hồ đúng lúc truncate (ECONNRESET process test), không phải lỗi nghiệp vụ. Sửa fixture ghi .next rồi rename nguyên tử; DB mới petcare_test_final_journey_20261023c chạy lại 8/8 PASS. Tổng tích hợp cuối 83 PASS, gồm parent Node test. Unit mặc định 67 PASS, 9 nhóm skip; frontend13 PASS/build71 modules. Các lần chạy lại cuối xem báo cáo.
- Journey dùng login/password thật của fixture và HTTP cho toàn bộ nghiệp vụ từ đăng ký đến đánh giá/hoàn/báo cáo; không SQL ép trạng thái hoàn thành. Test-only fixed-clock chỉ nạp bằng --import trong process test, không nhập ở app entry point; không đổi đồng hồ máy.
- Docker CLI không có. Đã thêm Compose local, hai Dockerfile, Nginx và .dockerignore; parser YAML + assert bind loopback/chỉ web publish/network migration đạt. Chưa build/up container, không gọi Docker runtime PASS. Không mount thư mục PostgreSQL cũ; không xóa volume.

### Sao lưu và rà soát bản sao DB cũ theo lựa chọn người dùng

- Người dùng chọn “Sao lưu và rà soát bản sao DB cũ trước”. pg_dump custom thành công vào backups/petcare_before_upgrade_20261024070746.dump, SHA-256 lưu private; restore sang petcare_dev_review_20261024070746 trên cụm test riêng 55439. So số dòng 15 bảng khớp nguồn.
- So metadata ban đầu chỉ lệch cách serializer biểu diễn cast mảng VARCHAR trong 10 CHECK. Không bỏ qua tùy tiện: schema nguồn 000/001 được dump/restore cùng phương pháp sang DB reference khác, sau đó columns/constraints/indexes/triggers/functions khớp chính xác bản sao dữ liệu cũ.
- Chỉ sau khi khớp mới baseline 000/001 trên bản sao, dùng migrateDatabase chạy 002–005: thành công; hash toàn bộ dữ liệu ở mọi cột nghiệp vụ cũ vẫn khớp gốc. Không seed/test ghi nghiệp vụ vào bản sao dữ liệu thật. Báo cáo private .cache/local-run/database-audit.json; dump bị gitignore.
- DB gốc vẫn 15 bảng/chưa có lịch sử, không thay .env, không tự chuyển ứng dụng sang cluster test. Chưa áp baseline/migrate lên DB gốc hoặc production. Website đang dùng DB gốc cần bước nâng cấp có kiểm soát sau kết quả bản sao; hiện readiness/API báo MIGRATION_REQUIRED.
- Cập nhật kế hoạch v3, thiết kế DB, báo cáo kiểm thử, README/API/DB/test guide. Giai đoạn12 còn Docker runtime, áp nâng cấp môi trường chạy và QA các UI còn thiếu. Không tuyên bố mọi tính năng/thiết bị/production đã đạt.

- Xác nhận cuối: journey DB mới petcare_test_final_journey_20261024d 8/8 PASS; frontend sau chỉnh nhãn 13/13/build71 PASS. HTTP chỉ đọc bản sao nâng cấp: /ready200, danh mục200, hóa đơn chưa xác thực401; DB gốc /ready503 như dự kiến, không ghi nghiệp vụ.


## 24/10/2026 — khắc phục không đăng nhập được trên web local

- Tái hiện frontend200, backend health200 nhưng ready503/API503 MIGRATION_REQUIRED. Thiếu bước nâng cấp DB development khi bàn giao phiên trước, không phải lỗi frontend hay kết luận mật khẩu sai.
- Backup mới backups/petcare_before_upgrade_20261024130112.dump, restore/test migration trên bản sao đạt; đối chiếu schema gốc với reference 000/001 khớp tuyệt đối. Bước so với roundtrip reference từ chối vì cách biểu diễn CHECK; kiểm tra lại reference chưa dump đúng phương pháp thì khớp, không bỏ guard.
- Baseline 000/001 và migrate 002–005 trên đúng DB development loopback, không seed/test vào DB ứng dụng. Hash mọi giá trị cột cũ khớp trước/sau, password hash giữ nguyên; .env và production không thay đổi.
- Sau sửa ready200, danh mục qua localhost5173 proxy200; login cố ý sai401 đúng hợp đồng, không còn503. Auth/hồ sơ trên DB test mới petcare_test_auth_loginfix_20261024a: 10/10 PASS, có login bcrypt thật, refresh/thu hồi phiên/đổi mật khẩu/tài khoản tạm. Không đọc hoặc đổi mật khẩu người dùng thật để kiểm chứng.
- Tài liệu chi tiết docs/DB_LOCAL_RECOVERY.md. Chỉ lưu/push nhánh codex/sua-dang-nhap-db-local; không merge hoặc push main.


## 24/10/2026 — khung giờ đặt lịch và ca chưa cấu hình

- Tái hiện ngày khách chọn 28/10/2026: DB development không có ca nào (toàn bảng ca = 0), có 1 nhân viên chăm sóc hoạt động. Đây là thiếu cấu hình ca, không phải so sánh ngày tương lai sai hoặc thời gian mở cửa 08:00–19:00 bị lỗi.
- Người dùng chọn tự xếp ca trong trang Quản lý; không seed, không tạo ca tự động, không nới kiểm tra công suất hoặc giả giờ trống.
- API khung giờ giữ slots và thêm reason NO_SHIFTS/NO_CAPACITY/PAST_DATE/null. Frontend hiển thị chưa có ca rõ ràng, tách lỗi tải API khỏi thiếu chỗ, xóa giờ cũ trong khi tải và thêm nút kiểm tra lại sau khi quản lý xếp ca.
- HTTP booking DB test riêng petcare_test_slots_reason_20261024a: 14/14 PASS, gồm ngày không ca trả NO_SHIFTS, ngày có ca cho dịch vụ90 phút có08:00/17:30 và không18:00; tranh chỗ cuối201/409 vẫn đạt. Frontend14/14 PASS, build72 modules đạt. Không ghi dữ liệu kiểm thử vào DB ứng dụng.
- Tab kiểm tra mới không chia sẻ phiên đăng nhập của tab người dùng, nên không xác nhận QA UI đã đăng nhập bằng mật khẩu thật; không thay đổi tab hồ sơ hiện tại. Bằng chứng chính là HTTP tích hợp và kiểm thử frontend/build.
- Nhánh codex/sua-thong-bao-khung-gio, không push main. Hướng dẫn: Quản lý → Ca làm việc → chọn28/10/2026 → nhân viên chăm sóc →08:00–19:00 → Lưu ca; trang đặt lịch chọn lại ngày hoặc Kiểm tra lại giờ hẹn. Với90 phút, giờ bắt đầu muộn nhất17:30.
