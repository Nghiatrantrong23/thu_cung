# Kiểm tra Chương 2 và trích dẫn — Giai đoạn 3

Ngày 09/11/2026. Kiểm tra [bản nháp Chương 2](CHUONG_2_PHUONG_PHAP_THUC_HIEN.md) theo [đề cương](DE_CUONG_CHI_TIET.md), [catalog hình/bảng](BANG_BO_TRI_HINH_BANG_VA_NGUON.md), [kiểm kê ảnh gốc](DANH_MUC_SO_DO_UML.md), [đối chiếu UML–mã](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md) và [kho tham khảo](DANH_MUC_TAI_LIEU_THAM_KHAO.md). Áp dụng hướng dẫn biên soạn và citation của Academic Research Suite; không phải phản biện độc lập hoặc kiểm tra bản Word cuối.

## 1. Phạm vi được người dùng xác nhận

Người dùng yêu cầu tiếp tục giai đoạn sau G2, không cần push GitHub và chỗ chưa có sơ đồ phải để trống để tự chèn sau. Phạm vi được thực hiện là G3 — Chương 2, cập nhật hồ sơ liên quan và dừng. Không viết Chương 3, không xuất Word/PDF, không sửa mã, SQL, dữ liệu hoặc sơ đồ gốc. Nhánh cục bộ riêng: `codex/bao-cao-cuoi-ky-giai-doan-3`; yêu cầu mới không push được ưu tiên so với quy tắc push mặc định trong AGENTS.md cho lần bàn giao này.

## 2. Cấu trúc và hình/bảng

- Chương 2 có 12 mục chính và 52 tiểu mục, giữ tên/thứ tự G1.
- Có 12 bảng, số 2.1–2.12, đặt đúng các tiểu mục G1: tác nhân, yêu cầu, phi chức năng, quyền, đặc tả đặt lịch, trạng thái, route, bảng dữ liệu, ràng buộc, API, cơ chế bảo vệ và sai khác thiết kế.
- Gắn tham chiếu ảnh cho 17 PNG gốc: 1 Use Case, 6 Activity, 6 Sequence, 1 Class, 2 State Machine và 1 cây màn hình. Không tạo bản vẽ thay thế hoặc tự sửa nội dung hình. Bộ 17 ảnh đã được xem G0; G3 mở lại 7 ảnh trọng tâm để đối chiếu.
- Sơ đồ màn hình được phân biệt với năm nhóm biểu diễn UML; không gọi tất cả là sáu loại UML chuẩn.
- Có đủ 19 caption Hình 2.1–2.19 theo kế hoạch. Hai vị trí thiếu hình để trắng, không gắn đường dẫn tới file không tồn tại.

| Vị trí còn trống | Tiểu mục | Nội dung cần người dùng chèn sau | Trạng thái |
|---|---|---|---|
| Hình 2.18 | 2.9.2 | Mô hình quan hệ dữ liệu PetCare theo schema khảo sát, phản ánh đầy đủ phần mở rộng sau 008 | Để trống với khoảng cách và caption; chưa tạo ERD mới |
| Hình 2.19 | 2.10.1 | Kiến trúc giao tiếp frontend, backend và cơ sở dữ liệu | Để trống với khoảng cách và caption; chưa tạo sơ đồ kiến trúc |

Các chỗ trắng là phần người dùng chủ động tự chèn theo yêu cầu mới, không được báo là đã có hình. Ảnh PNG nhiều chữ có thể cần bố trí trang ngang/độ rộng thích hợp khi tạo Word; chưa render nên không kết luận chữ đạt độ đọc trên A4. Không tự thêm một hình cọc, hình API hoặc Use Case con chưa được cung cấp.

## 3. Căn cứ cho các nhóm nội dung

| Nội dung Chương 2 | Nguồn dự án đối chiếu | Điều kiện khi diễn giải |
|---|---|---|
| Vai trò và quyền | `auth.middleware.js`, routes, `App.jsx`, pet controller | Ba vai trò DB + chức vụ tạo năm nhóm; care đọc thú cưng có lịch được giao; Admin vẫn có quyền vận hành |
| UC/Activity/Sequence/Class/State/màn hình | 17 PNG, ba wireframe và hồ sơ G0 | Không tự tạo message/lifeline/nhánh; tên mô hình không phải endpoint hoặc class ES6 |
| Khả thi lịch | `services/booking.js`, `lib/scheduling.js`, dispatch/care | Toàn khoảng, ca bao trọn, thành phần giao thoa, giữ phân công, quay lui và budget; không tự lưu phương án |
| CSDL | `thu_cung.sql`, migrations 001–008, DB tooling | 21 bảng ứng dụng + lịch sử; 000 là version logic, không phải file vật lý riêng; chưa truy vấn DB hiện hành |
| Giao thoa tại DB | EXCLUDE trong `thu_cung.sql`, migration 003 | Predicate lịch đã gán khác solver lịch chờ; ca chỉ loại trừ ca hoạt động |
| Tiền và lịch sử | `money.js`, invoices, depositStore, complaints | NUMERIC, nguyên đơn vị nhỏ, snapshot, nợ sau cọc; duyệt khác thực chi |
| Chuyển khoản và sandbox | Payments/deposits routes, paymentTransfers, paymentSandbox | Hướng dẫn/nhân sự xác nhận khác đối soát webhook; sandbox không phải tiền thật |
| Phiên và khôi phục | Auth middleware/controller, apiClient, reset service/routes | Access/refresh, cookie theo cấu hình, token version, hash reset; SMTP ngoài chưa nghiệm thu |
| Luồng request/lỗi | `server.js`, `config/db.js`, error middleware | Đúng transaction client, readiness khác health; phản hồi công khai không lộ SQL/bí mật |
| Truy vết kiểm thử | Các file test trong `backend/test` và bảng kiểm G0 | Nêu đầu mối ca có thật; không suy PASS từ tên file hoặc chạy mới trên DB thật |

## 4. Kiểm tra trích dẫn số

Chương 2 dùng **13 nguồn phân biệt**: [13], [16], [17], [18], [23], [24], [25], [32], [34], [36], [39], [40], [41]. Tất cả nằm trong kho đã xác minh 1–41; số giữ nguyên so với G2, không thêm tài liệu chưa xác minh.

Nguồn [36] cung cấp nền ký pháp UML, [40] nền CSDL/chuẩn hóa, [34] mô hình vai trò, [18] định hướng kiến trúc, [23] cơ chế dữ liệu, [17]/[24] công nghệ, [25]/[41]/[39] xác thực và [32] phương pháp kiểm thử. [13]/[16] chỉ hỗ trợ phạm vi nghiệp vụ đã trình bày ở Chương 1. Các quy tắc cụ thể, bảng YC/PC, route và thuật toán của PetCare được ghi rõ là phân tích từ dự án, không gán cho các tài liệu ngoài.

Gộp phần đã viết đến hết G3 vẫn có 24 nguồn được dẫn, 6 Việt/18 Anh (25% Việt), vì 13 nguồn Chương 2 đều thuộc tập đã dùng. Kho xét chọn vẫn 41 hồ sơ, 21 Việt/20 Anh; không nhận tỷ lệ kho là tỷ lệ của báo cáo. Mục tiêu 60–70% tiếng Việt chưa đạt; không thêm catalog chưa đọc vào bản thảo chỉ để tăng tỷ lệ.

Số hiện tại là số tham chiếu làm việc nhất quán, chưa phải thứ tự nộp cuối đã xếp theo mẫu trường. G5 chọn tập thực sự dùng ở cả ba chương và thay số đồng bộ; G6–G7 kiểm lại citation/danh mục trên Word/PDF. Không xác nhận đã kiểm resolver/rút bài/errata toàn diện trong lượt viết chương này.

## 5. Hiệu chỉnh nhận định trong G2

Khi đọc lại DDL ở G3, nhận định về phạm vi kiểm tra giao thoa trong G2 cần được làm rõ: schema **đã có** EXCLUDE/tsrange cho lịch theo nhân viên và ca theo predicate. G2 không nên để người đọc hiểu toàn bộ kiểm soát chỉ nằm ở JavaScript hoặc chưa dùng ràng buộc loại trừ. Đã sửa một đoạn tại 1.3.1 Chương 1 và dòng liên quan trong báo cáo kiểm tra G2; không thay số trích dẫn, cấu trúc hoặc mã nguồn.

Chương 2 nêu chính xác hai lớp: EXCLUDE bảo vệ các bản ghi phù hợp điều kiện DB; solver và khóa ngày bảo vệ khả năng bố trí, bao gồm lịch chưa phân công. Chưa tuyên bố mọi bảng đạt 3NF, chưa gọi số lớp là số bảng và chưa gọi chữ ký JWT là mã hóa bí mật claims.

## 6. Điều kiện kiểm tra cục bộ và giới hạn

Kiểm tra tự động tập trung vào mục/tiểu mục, số/vị trí/caption hình-bảng, 17 đường dẫn ảnh gốc, hai chỗ trống, 21 tên bảng từ DDL, số trích dẫn và liên kết nội bộ. Hash của 40 file modified/untracked có trước và 218 file được bảo vệ được ghi trước biên soạn; phần ghi nhận kế hoạch mới được tách riêng khỏi thay đổi có trước. Không tạo DOCX/PDF hoặc file sơ đồ mới.

Kết quả chi tiết được lưu cục bộ tại `.cache/bao-cao-cuoi-ky-g3/validation.json` sau đợt QA. Rà nội dung do tác nhân biên soạn thực hiện, không nhận là phản biện độc lập hoặc phép kiểm tra tương đồng chuyên dụng. Không chạy lại build/test ứng dụng vì chỉ thay Markdown, không kết nối DB để tạo số PASS mới và không thay trạng thái nghiệm thu Admin/giai đoạn 12.
