# Tiến độ biên soạn báo cáo cuối kỳ PetCare

Ngày cập nhật: **08/11/2026**, theo ngày người dùng. Nhánh hiện tại: `codex/bao-cao-cuoi-ky-giai-doan-1`. Các mục khảo sát G0 bên dưới là hồ sơ lịch sử, kết quả G1 tại mục 10.

**Trạng thái hiện tại: người dùng đã chấp nhận Giai đoạn 0; đề cương Giai đoạn 1 đã được hoàn thiện để kiểm tra và bàn giao.** Chưa thực hiện Giai đoạn 2–7, chưa viết toàn bộ báo cáo, chưa tạo DOCX/PDF. Không thay trạng thái nghiệm thu phần mềm.

## 1. Phạm vi và yêu cầu điều khiển

Thực hiện file yêu cầu người dùng gửi tại `C:\Users\TRONG NGHIA\.codex\attachments\85513f8e-5960-4de9-8989-18660d596625\Pasted text.txt`, đặc biệt mục 18–19: bắt đầu Giai đoạn 0, lập kiểm kê/đề cương sơ bộ, báo thiếu và dừng. Không tự tiếp tục viết chương hoặc tạo Word.

Đã sử dụng hướng dẫn Academic Research Suite cho việc tái sử dụng hồ sơ `lit-review`/kiểm tra citation và lập cấu trúc; Documents cho việc đọc mẫu/nhận diện yêu cầu xuất Word. Không chuyển thành Systematic Review, không mở nghiên cứu lại 35 nguồn, không tạo pipeline đa tác nhân hoặc bản thảo học thuật ngoài phạm vi. Không thay đổi mã nguồn, sơ đồ, `.env` hoặc dữ liệu DB. Không chạy build/test ứng dụng trong lượt khảo sát.

Các chỉ dẫn trong mẫu trường được đọc như dữ liệu định dạng. Phạm vi người dùng bỏ bìa/cảm ơn/cam đoan/nhận xét/lịch làm việc có ưu tiên, không khôi phục những phần này chỉ vì mẫu có chúng.

## 2. Tài liệu đã nhận diện và đọc

| Đầu vào | Kết quả khảo sát | Ảnh hưởng |
|---|---|---|
| `Huong dan trinh bay Báo cáo ĐACN_2026-2027(1).docx` | Chưa thấy đúng tên có `(1)` trong workspace/vị trí Documents đã kiểm tra | Sử dụng bản người dùng đã gửi trước, không giả có bản mới |
| `C:\Users\TRONG NGHIA\Documents\Huong dan trinh bay Báo cáo ĐACN_2026-2027.docx` | Đọc XML chỉ đọc, chia sẻ với ứng dụng đang mở; 542 đoạn trực tiếp trong body và section properties | Đủ căn cứ đối chiếu quy định chữ; chưa phải kiểm tra render báo cáo mới |
| Báo cáo PetCare DOCX/PDF hiện có | Không tìm thấy trong workspace sau quét loại trừ thư viện phụ thuộc/build/backup DB | Chưa có bản thảo để kế thừa, kiểm Word hoặc kiểm citation fields |
| [Kế hoạch tổng thể](../../plans/ke_hoach_tong_the.md), [thiết kế CSDL](../../plans/02_THIET_KE_CO_SO_DU_LIEU.md) | Đã đọc tiến độ, quyền, luồng, trạng thái và thiết kế lõi | Tách mốc cũ 000–005 với phần mở rộng hiện tại |
| `thu_cung.sql`, migrations 001–008, `backend/scripts/db-tooling.js` | Đã kiểm nguồn DDL và ánh xạ version 000 tới `thu_cung.sql` | Có 9 version logic; không có file vật lý `migrations/000*.sql` |
| 17 PNG và ba Markdown màn hình | Đã xem trực tiếp cả 17 sơ đồ; đọc phần mô tả wireframe | Đủ sáu loại hiện diện, nhưng nhiều điểm chưa khớp mã |
| React routes, package, middleware, controller/service/routes liên quan | Kiểm tra tĩnh trực tiếp | Xác định công nghệ/quyền/API; không thay việc chạy hệ thống |
| Tiến độ Admin, khiếu nại, cọc, chuyển khoản, SMTP và biên bản test | Đã đối chiếu các mốc và giới hạn | Không gọi những phần chưa QA hoặc mô phỏng là đã hoàn thành |
| Năm file nghiên cứu tài liệu | Kiểm tra lại cục bộ 35 hồ sơ, ngôn ngữ, DOI, phạm vi đọc và số tham chiếu | Không tái xác nhận online ngày 08/11; giữ ngày truy cập và giới hạn đợt 07/11 |
| 27 ảnh giao diện ứng viên | Đã kiểm file/kích thước/hash; xem trực tiếp 6 ảnh nghiệp vụ cũ | Cần chọn/chụp lại ảnh hiện tại trước Chương 3 |
| 24 file test backend và 8 file frontend | Kiểm kê case có thật, định vị nguồn | Không suy số PASS từ số file hoặc khai báo test |

SHA-256 bản hướng dẫn đã đọc, tính qua FileStream chia sẻ chỉ đọc:

`52E79D35132F2782E58602EDFDC972EF96DB2A83DE64021FC6AA82D497E44F39`

Đơn vị trên tài liệu: Trường Đại học Tài nguyên và Môi trường TP.HCM, Khoa Công nghệ thông tin. Không lấy tên sinh viên/GVHD trong ví dụ mẫu hoặc tên tài khoản Windows làm thông tin tác giả báo cáo.

## 3. Yêu cầu trình bày đã xác định

| Nội dung | Áp dụng khi tạo Word | Căn cứ/giới hạn |
|---|---|---|
| Cấu trúc | Tóm tắt → các danh mục → Mở đầu → đúng ba chương → Kết luận → Phụ lục nếu có → Tham khảo | Theo yêu cầu người dùng và nội dung mẫu |
| Tóm tắt | Tối đa một trang A4, không số trang | Mẫu quy định rõ; chưa kiểm được số trang vì chưa tạo Word |
| Khổ/font | A4, Times New Roman 13, tiêu đề chính 16, chữ đen, giãn dòng 1,5 | Quy định chữ và lựa chọn người dùng |
| Lề | Trên/dưới 2 cm, trái 3 cm, phải 2 cm | Không sao chép nguyên section properties khác quy định |
| Đánh trang | Từ Mở đầu, bắt đầu 1; phần trước không hiện số | Hướng dẫn nói rõ, một số mục lục mẫu chưa nhất quán |
| Hình/bảng | Số theo chương, caption, giải thích và nguồn | Hình lớn cần thử ngang/độ đọc được; chưa render |
| Header/footer | Tên đề tài; SV/GVHD chỉ khi có thông tin thật | Chưa xác định họ tên, MSSV, lớp, GVHD từ đầu vào được kiểm; không tự điền |
| Mục lục/danh mục | Heading Styles và trường tự động | Chưa tạo trường, không đoán số trang |
| Tham khảo | Ít nhất 10, mục tiêu 20–25 nguồn phù hợp; ngoặc vuông, một số nhất quán | Danh mục cuối chỉ giữ nguồn thực sự dẫn |

Sai biệt mẫu đã ghi nhận: section properties trong file hướng dẫn có lề xấp xỉ trên 1,37/dưới 1,50/trái 2,00/phải 1,50 cm, khác phần quy định chữ 2/2/3/2 cm. Áp dụng quy định chữ và yêu cầu người dùng; không cần sao chép lỗi lề của mẫu. Các đoạn về tài liệu tham khảo vừa yêu cầu ABC Việt theo tên/Anh theo họ, vừa liệt kê nhiều cách xếp; giữ quy ước làm việc đã ghi trong báo cáo IEEE, chốt/đổi số đồng bộ ở giai đoạn danh mục cuối. Không coi phụ lục bổ sung nguồn hiện tại là thứ tự nộp đã đạt.

## 4. Kiểm kê và điểm lệch sơ đồ

| Loại | Số hình gốc | Trạng thái |
|---|---:|---|
| Use Case | 1 | Đã xem; cần rà ký pháp/quyền/dấu chọn trên ảnh |
| Activity | 6 | Đã xem; điều phối và hoàn tiền có nhãn/luồng lệch mã |
| Sequence | 6 | Đã xem; đếm công suất, rẽ nhánh và thời điểm ghi hoàn lệch mã |
| Class | 1 | Đã xem; mô hình miền lõi, không phải toàn schema hiện tại |
| State Machine | 2 | Đã xem; thiếu TuChoi/HoanTienMotPhan, có chuyển hủy không còn hợp lệ |
| Màn hình và điều hướng | 1 | Đã xem cây tổng quan; ba file Markdown wireframe; thiếu các route mới |
| **Tổng** | **17** | **Đủ sáu loại về sự hiện diện; chưa chứng nhận toàn bộ UML hoàn chỉnh** |

Không tìm thấy nguồn chỉnh sửa `.puml/.plantuml/.drawio/.vsdx/.mmd`; có Mermaid ERD nội tuyến trong kế hoạch CSDL. Các bản trùng hash trong cache không phải sơ đồ mới. Danh sách từng hình, kích thước và vị trí dự kiến nằm trong [kiểm kê](DANH_MUC_SO_DO_UML.md), phân tích sai biệt và API thực nằm trong [đối chiếu](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md).

Các sai biệt trọng yếu cần thuyết minh trước khi hoàn thiện báo cáo:

1. SD-02 dùng đếm lịch so số người trong ca; mã dùng kiểm tra khả thi toàn khoảng, ca bao trọn và quay lui, không lưu người do solver tìm được.
2. AD-03/SD-03 gộp từ chối vào DaHuy; mã phân biệt TuChoi, giữ chờ và phân công bằng ba hành động loại trừ.
3. SD-04 có khối hủy sau alt; mã không cho hủy sau hoàn tất hoặc đang thực hiện theo API hủy hiện tại.
4. AD-06/SD-06 ghi giao dịch và trạng thái đã hoàn ngay khi duyệt; mã giữ ChoHoanTien, chỉ thực chi thành công mới ghi tiền; thất bại giữ chờ và có hoàn một phần.
5. SM lịch thiếu TuChoi, có DangThucHien → DaHuy; SM hóa đơn thiếu HoanTienMotPhan. Cọc là đối tượng trạng thái khác.
6. Cây màn hình và CD chưa bao phủ các mở rộng hiện hành. Class conceptual không có nghĩa backend đã triển khai class cùng tên.

## 5. Hiện trạng chức năng được phép mô tả

“Có mã” là kết quả kiểm tra tĩnh. “Có biên bản kiểm thử” là kết quả lịch sử được dẫn đúng mốc; không phải nghiệm thu mới ngày 08/11. Phạm vi nguồn là workspace hiện tại có thay đổi chưa commit, không phải toàn bộ tính năng đều nằm trong commit khảo sát.

| Phân hệ | Mã/thiết kế thực tế đã kiểm tra | Bằng chứng và giới hạn | Cách viết Chương 3 |
|---|---|---|---|
| Xác thực và năm nhóm quyền | bcrypt, JWT access/refresh, purpose/version, khóa và bắt đổi mật khẩu tạm; vai trò DB ba giá trị + chức vụ nhân viên | Biên bản auth/hồ sơ; chưa QA mọi UI tạm đổi | Có chức năng, giới hạn môi trường/QA; bcrypt là băm, không phải giải mã |
| Hồ sơ chó mèo và dịch vụ | routes/controller sở hữu; danh mục hiện hành, ngừng bán mềm | Có API/test lịch sử; ảnh CRUD hiện tại chưa đủ | Không gọi mọi thao tác mọi thiết bị đã nghiệm thu |
| Đặt lịch online/tại quầy | tổng thời lượng, khoảng 08–19h, lưới bắt đầu 30 phút, solver và transaction/khóa ngày, lịch chờ chưa gán người | Booking/dispatch có test tranh chỗ/rollback lịch sử | Giải thích khả thi, không nhận là thuật toán tối ưu hay tự động phân công |
| Điều phối và ca | phan-cong/giu-cho/tu-choi; ca bao trọn và không làm mất công suất lịch mở | Test điều phối/ca lịch sử; hình cũ có sai khác | Dùng API/trạng thái thực, ghi khác sơ đồ |
| Chăm sóc | người được giao, trong ngày, bắt đầu/từng dịch vụ/kết thúc; báo không đủ điều kiện trước bắt đầu | Có API/UI chính trong biên bản; chưa xử lý quyết toán làm dở | Không tự bổ sung quy trình hủy dịch vụ đã làm một phần |
| Cọc và hủy/đổi | snapshot chính sách/giá, 30%, phân trạng thái cọc, đủ cọc mới xác nhận khi bật; cọc trừ hóa đơn | Test cọc lịch sử; chưa tự giải phóng chỗ chưa cọc, cọc dư do giảm giá còn giới hạn | Nêu rõ chính sách được bật theo cấu hình; không áp hồi tố |
| Hóa đơn và thanh toán | lập từ dịch vụ hoàn thành, snapshot, số thu/tiền đưa tách riêng, nợ, idempotency | Test hóa đơn và ảnh demo lịch sử | Có ghi nhận thu; ảnh/in trình duyệt không là hóa đơn điện tử thuế |
| VietQR/MoMo | Đã có hướng dẫn chuyển khoản và VietQR khi cấu hình; thu do nhân sự xác nhận; sandbox tách riêng | Biên bản transfers 38 PASS và UI DB thử; chưa quét điện thoại/chuyển tiền thật; chưa webhook/merchant | Không viết “chưa có VietQR” chung cho mọi phiên bản; cũng không viết tự đối soát hoặc nhận tiền online tự động |
| Khiếu nại và hoàn | khách gửi theo sở hữu, chống lặp; quản lý duyệt, lễ tân thực chi, khóa/hạn mức và thất bại | Refunds 9 PASS theo tiến độ 05/11; cải tiến UI 08/11 chưa QA ba viewport | Phân biệt có API/test với UI hoàn tất; số tiền ảnh là demo |
| Đánh giá và thông báo | đánh giá một lịch hoàn tất thuộc khách; tin ứng dụng theo người nhận | Có routes/test lịch sử; tin hiện tải lại, không phải push realtime/SMS | Không nhận là nhắc hẹn tự động đa kênh đã có |
| Báo cáo | thu thành công trừ thực chi hoàn; biểu đồ các kỳ, trước giảm/dịch vụ là chỉ tiêu khác | Biên bản biểu đồ/API; ảnh bảng cũ không đại diện UI mới | Không gọi là lợi nhuận hoặc số doanh thu cơ sở thực |
| Admin tài khoản | API tạo/reset/đổi quyền/khóa và guard; UI KPI/lọc/tìm nâng cấp 07/11 | Core có test lịch sử; KPI/lọc mới chưa HTTP DB riêng/UI theo tiến độ | Chỉ kết luận đúng mức từng phần |
| Admin vận hành và vai trò | Middleware hiện cho Admin quyền manager/reception; care riêng | Không phải mô hình Admin tách hoàn toàn như định hướng trước | Nêu sự khác nhau giữa định hướng và triển khai, không tự sửa RBAC |
| Audit/config/backup Admin | Có trang, fallback và thao tác mô phỏng; server Admin hiện chỉ tài khoản | Chưa có API/persistence tương ứng. Nhật ký lịch hẹn không là audit toàn hệ thống | Liệt kê hạn chế/đang phát triển; không dùng ảnh demo làm kết quả thật |
| SMTP và Docker | Reset có HTTP/SMTP loopback; Docker có cấu hình | Mailtrap thật BLOCKED theo biên bản; Docker runtime chưa có bằng chứng chạy | Không nhận đã gửi thư Mailtrap hay đã triển khai container/production |

Nguồn đọc chính: `frontend/src/App.jsx`, `backend/src/server.js`, `backend/src/middleware/auth.middleware.js`, routes, `services/booking.js`, `dispatch.js`, `care.js`, `invoices.js`, `complaints.js`, cọc/thanh toán, package, DDL và các tiến độ. Đợt này không kết nối lại PostgreSQL để xác nhận schema đang chạy. 21 bảng ứng dụng + bảng migration là mô hình từ SQL và snapshot metadata 07/11 đã có trong khảo sát Admin; cần ghi đúng nguồn khi viết, không nhận là truy vấn hiện tại.

## 6. Nguồn tham khảo và bằng chứng còn thiếu

- Đã có 35 hồ sơ đánh số, 20 Việt/15 Anh, 9 DOI có căn cứ. Tỷ lệ Việt 57,1% chưa đạt mục tiêu 60–70%; không giữ nhiều bệnh da để làm đẹp tỷ lệ.
- Metadata không thay nội dung: một số sách UML/CSDL/phân tích và khóa luận Việt cần đọc sâu trước khi viết luận điểm cụ thể. Vite/bcrypt/chuẩn UML còn cần hồ sơ chính thức phù hợp nếu được dẫn về lý thuyết.
- Chưa có báo cáo thị trường Việt định lượng có phương pháp đã kiểm chứng; tin hội thảo chỉ hỗ trợ bối cảnh. Chưa có khảo sát thực địa/SOP cơ sở thực được xác nhận.
- Chưa có bản gốc đủ xuất xứ D&C/Paws Pet House; giữ ngoài nguồn chính thức. Không tái tìm các nguồn đã xác minh đủ trong Giai đoạn 0.
- Chưa có dữ liệu đo hiệu năng, khảo sát hài lòng hoặc so sánh trước/sau của chính PetCare. Không mượn kết quả [29], [30], [33] làm kết quả dự án.
- Chưa có bộ ảnh hiện hành đầy đủ mọi chức năng/thiết bị; sáu ảnh đã xem là demo lịch sử. Không tự chế ảnh để lấp chỗ trống.
- Chưa xác định thông tin tác giả/GVHD từ đầu vào được kiểm tra; không ảnh hưởng khảo sát, nhưng cần có trước khi điền header/footer ở giai đoạn Word.

## 7. File được tạo trong Giai đoạn 0

1. [DE_CUONG_CHI_TIET.md](DE_CUONG_CHI_TIET.md) — cấu trúc sơ bộ và vị trí 17 sơ đồ, chưa viết chương.
2. [DANH_MUC_SO_DO_UML.md](DANH_MUC_SO_DO_UML.md) — tên, loại, kích thước và trạng thái từng hình.
3. [BANG_DOI_CHIEU_UML_VA_MA_NGUON.md](BANG_DOI_CHIEU_UML_VA_MA_NGUON.md) — sai biệt, định vị mã và API thật.
4. [DANH_MUC_TAI_LIEU_THAM_KHAO.md](DANH_MUC_TAI_LIEU_THAM_KHAO.md) — 35 thư mục và điều kiện chọn/đọc; chưa chốt danh mục nộp.
5. [DANH_SACH_HINH_ANH_CAN_BO_SUNG.md](DANH_SACH_HINH_ANH_CAN_BO_SUNG.md) — sáu ảnh đã xem, 21 ứng viên và danh sách thiếu.
6. [BANG_KIEM_THU_PETCARE.md](BANG_KIEM_THU_PETCARE.md) — case có thật, biên bản theo mốc và mục chưa có bằng chứng.
7. File tiến độ này — tổng hợp đầu vào, quy tắc mẫu, hiện trạng, khoảng thiếu và điểm dừng.

Không tạo `BaoCao_CuoiKy_PetCare.docx` hoặc `.pdf` vì chúng thuộc Giai đoạn 6–7. Giữ nguyên mọi báo cáo/sơ đồ nguồn; không có DOCX được giao nên chưa có render/visual QA bản báo cáo mới để tuyên bố đạt.

## 8. Kiểm soát thay đổi và kiểm tra tài liệu

Đã ghi hash 40 file modified/untracked có trước khi bắt đầu và hash tài sản trong cache riêng. Giữ nguyên thay đổi ứng dụng và thư viện nghiên cứu; không đưa chúng vào commit khảo sát. Các file `.cache` chỉ phục vụ kiểm chứng cục bộ, không công khai. Ghi nhận tiến độ mới vào cuối kế hoạch bằng phần bổ sung riêng, không stage các thay đổi kế hoạch có trước.

Kiểm tra cục bộ ngày 08/11/2026 **ĐẠT**: đủ bảy file, sáu loại/17 mã và vị trí Hình 2.1–2.17; 121 liên kết nội bộ hợp lệ, 28 định vị dòng mã/test tồn tại; dãy thư mục 1–35 liên tục và 20 Việt/15 Anh; không tham chiếu số ngoài thư viện. Đối chiếu DDL nhận diện đúng 21 bảng ứng dụng. Không tạo DOCX/PDF hoặc mã ứng dụng mới; hash 17 sơ đồ và 40 file có trước giữ nguyên trước khi nối phần ghi nhận mới vào kế hoạch. Kết quả máy kiểm được lưu cục bộ tại `.cache/bao-cao-cuoi-ky-g0/validation.json`; không coi đây là kết quả test nghiệp vụ hoặc render báo cáo.

## 9. Trạng thái các giai đoạn và điểm dừng

| Giai đoạn | Trạng thái |
|---|---|
| 0 — Khảo sát | Đã được người dùng xem và chấp nhận trong chat |
| 1 — Đề cương | Đã hoàn thiện mục/tiểu mục và bố trí hình/bảng/nguồn; dừng chờ người dùng kiểm tra |
| 2 — Tóm tắt/Mở đầu/Chương 1 | Chưa bắt đầu trong nhiệm vụ báo cáo cuối kỳ |
| 3 — Chương 2 | Chưa bắt đầu |
| 4 — Chương 3 | Chưa bắt đầu |
| 5 — Hoàn thiện nội dung | Chưa bắt đầu |
| 6 — Xuất Word | Chưa bắt đầu |
| 7 — Kiểm tra cuối/PDF | Chưa bắt đầu |

**Dừng sau Giai đoạn 1 theo yêu cầu mới đã chấp thuận.** Không tự chuyển sang Giai đoạn 2, viết toàn báo cáo, sửa sơ đồ hoặc tạo Word. Các khoảng thiếu được giữ rõ để xử lý ở bước phù hợp, không thay bằng nội dung giả.


## 10. Giai đoạn 1 hoàn thiện đề cương chi tiết

Người dùng xác nhận đã xem/chấp nhận khảo sát G0 và yêu cầu tiếp tục G1 trong chat ngày 08/11/2026. Phạm vi: hoàn thiện đề cương, xác định vị trí hình/bảng/nguồn, cập nhật tiến độ và dừng; chưa cho phép viết toàn nội dung hoặc xuất Word.

### 10.1. Công việc đã thực hiện

- Hoàn thiện `DE_CUONG_CHI_TIET.md`: giữ cấu trúc Tóm tắt, danh mục, Mở đầu, ba chương, Kết luận, Phụ lục nếu cần và Tham khảo; có 32 mục chính (8/12/12) và 118 tiểu mục trong ba chương.
- Chương 2 giữ đầy đủ UC, Activity, Sequence, Class, State Machine và sơ đồ màn hình; dành Hình 2.1–2.17 cho đúng 17 PNG gốc. Mỗi nhóm có mục đích, phạm vi phân tích, căn cứ và giới hạn; sai khác mã không bị xóa khỏi kế hoạch.
- Tạo `BANG_BO_TRI_HINH_BANG_VA_NGUON.md`: 36 vị trí hình, 24 bảng, vị trí tiểu mục/caption/nguồn và trạng thái. Trong 36 vị trí chỉ có 17 sơ đồ gốc đã xem; 2 hình ERD/kiến trúc chưa tạo, 17 ảnh UI còn phải chọn/kiểm/bổ sung theo từng dòng. Không nhận là đã có đủ hình xuất bản.
- Bố trí nguồn theo 32 mục: nguồn học thuật cho kiến thức kế thừa, mã/biên bản cho kết quả tự làm; giữ số nguồn làm việc 1–35 và các giới hạn metadata. Không tự thêm tài liệu hoặc đổi số IEEE cuối.
- Bổ sung quy ước nguồn hình/bảng, cách gắn biên bản và tách kết quả lịch sử/đề xuất/chưa có bằng chứng. Phân bổ dung lượng theo tỷ trọng chỉ để định hướng, không hứa số trang chưa render.
- Đồng bộ vị trí chi tiết trong `DANH_MUC_SO_DO_UML.md`, thêm liên kết bố trí vào `DANH_SACH_HINH_ANH_CAN_BO_SUNG.md`, cập nhật file tiến độ này và ghi nhận riêng vào kế hoạch tổng thể.

### 10.2. File được tạo hoặc sửa

| File | Thay đổi G1 |
|---|---|
| DE_CUONG_CHI_TIET.md | Thay đề cương sơ bộ bằng đề cương chi tiết, chưa phải nội dung báo cáo |
| BANG_BO_TRI_HINH_BANG_VA_NGUON.md | Tạo catalog vị trí, caption, nguồn và điều kiện sử dụng |
| DANH_MUC_SO_DO_UML.md | Đồng bộ UC/CD/cây màn hình vào tiểu mục chi tiết, giữ hình và số |
| DANH_SACH_HINH_ANH_CAN_BO_SUNG.md | Gắn kế hoạch Hình 3.1–3.17, không thay trạng thái ảnh đã kiểm |
| TIEN_DO_VIET_BAO_CAO.md | Ghi người dùng chấp nhận G0, kết quả G1 và điểm dừng |
| plans/ke_hoach_tong_the.md | Chỉ nối ghi nhận G1; không stage các thay đổi có trước |

### 10.3. Điều kiện và phần chưa giải quyết

- G1 hoàn thiện cấu trúc và ánh xạ, không hoàn tất các nguồn chỉ catalog, nguồn Vite/bcrypt/runtime Node tổng quát hoặc chuẩn UML chưa đọc/chọn.
- Chưa duyệt bộ ảnh mới, chưa tạo ERD/kiến trúc bổ trợ, chưa sửa 17 sơ đồ gốc và chưa khắc phục sai khác code/thiết kế. Đây là điều kiện đầu vào khi viết/định dạng, không làm giả bằng chứng để lấp vị trí.
- Chưa chốt nguồn thực sự dẫn, thứ tự tham khảo cuối và số trang. Danh mục/field tự động, font/lề trong Word và render thuộc G6–G7.
- Không chạy test ứng dụng/DB, không tạo kết quả PASS mới. Không thay nhận xét nghiệm thu Admin, giai đoạn 12 hoặc triển khai production.
- Snapshot đầu G1: 40 file modified/untracked có trước và 224 file mã/sơ đồ/nghiên cứu được ghi hash để bảo toàn. Kiểm tra G1 là số mục, sáu loại, số/vị trí hình-bảng, nguồn và liên kết, diff cùng hash; kết quả máy kiểm được lưu cache riêng.

Kiểm tra cục bộ G1 **ĐẠT** ngày 08/11/2026: đủ 32 mục chính (8/12/12) và 118 tiểu mục, số mục con liên tục và không trùng; 36 vị trí hình/24 bảng khớp giữa đề cương và catalog, mọi vị trí chỉ tới tiểu mục có thật. 17 sơ đồ gốc khớp bảng kiểm kê; 152 liên kết nội bộ hợp lệ, không có số nguồn ngoài dãy làm việc 1–35. Hash của 40 file có trước và 224 file được bảo vệ giữ nguyên trước khi nối ghi nhận vào kế hoạch. Không tạo Word/PDF, không chạy test ứng dụng/DB. Kết quả tại `.cache/bao-cao-cuoi-ky-g1/validation.json`; đây là kiểm tra tài liệu, không phải nghiệm thu chức năng.

### 10.4. Điểm dừng

Bàn giao đề cương G1 cho người dùng kiểm tra. Chưa bắt đầu viết Tóm tắt/Mở đầu/Chương 1 ở G2 hoặc các chương tiếp theo. Việc chấp nhận G0 chỉ cho phép G1, không mặc nhiên cho phép tự chạy hết quy trình.
