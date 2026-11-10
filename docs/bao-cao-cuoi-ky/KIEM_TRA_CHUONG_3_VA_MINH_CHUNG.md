# Kiểm tra Chương 3 và minh chứng — Giai đoạn 4

Ngày biên soạn/kiểm tra tài liệu: 10/11/2026. Đối tượng: [bản nháp Chương 3](CHUONG_3_CAI_DAT_KET_QUA_VA_DANH_GIA.md), đối chiếu [đề cương](DE_CUONG_CHI_TIET.md), [hồ sơ test](BANG_KIEM_THU_PETCARE.md), [hồ sơ ảnh](DANH_SACH_HINH_ANH_CAN_BO_SUNG.md), [catalog](BANG_BO_TRI_HINH_BANG_VA_NGUON.md) và nguồn dự án. Áp dụng hướng dẫn biên soạn/kiểm tra citation của Academic Research Suite; không chuyển thành Systematic Review hoặc một lượt chạy kiểm thử ứng dụng mới.

## 1. Phạm vi và kết luận

G4 viết nội dung Chương 3 theo G1, cập nhật tiến độ/hồ sơ và dừng. Bản nháp có **12 mục chính, 37 tiểu mục, 7 bảng và 17 caption hình**. Trong 17 vị trí, **8 ảnh demo có sẵn được chọn và 9 vị trí để trống** để người dùng bổ sung ảnh thật phù hợp. Không chụp mới hoặc tạo ảnh UI giả, không sửa ảnh gốc hoặc mã, không chạy DB/test ứng dụng và không xuất Word/PDF. Tiếp tục yêu cầu không push GitHub.

Đạt về cấu trúc và dẫn chứng trong phạm vi bản nháp không có nghĩa ứng dụng đã được nghiệm thu lại ngày 10/11. Các kết quả PASS/SKIP/BLOCKED đều dẫn theo biên bản cũ và phạm vi. Phần chưa đủ bằng chứng tiếp tục được giữ ở Bảng 3.6 và đánh giá mục tiêu.

## 2. Chuỗi bằng chứng cho số liệu

| Nội dung | Nguồn đọc lại | Cách dùng trong Chương 3 |
|---|---|---|
| Lõi 23–24/10: mặc định 67 PASS/9 SKIP; 9 nhóm DB riêng 83 PASS/0 FAIL; frontend 13 PASS, build 71 modules | [Báo cáo kiểm thử hệ thống](../../plans/BAO_CAO_KIEM_THU_HE_THONG.md) | Giữ mốc, quy ước gồm parent và lỗi fixture journey trước lần chạy lại; không gán cho mọi mở rộng sau đó |
| Cọc: 9 nhóm 86 PASS/0 FAIL/0 SKIP | [Đặt cọc và hủy lịch](../DAT_COC_VA_HUY_LICH.md) | Phân biệt tập 9 nhóm với tập lõi; không cộng kết quả chồng nhau |
| Transfers/invoices/deposits/sandbox: 9+8+12+9 = 38 PASS | [Chuyển khoản](../THANH_TOAN_CHUYEN_KHOAN.md) | Tổng chỉ trong đợt 4 DB mới riêng; không chuyển tiền thật |
| Reset HTTP/SMTP loopback 13 PASS; hồi quy auth 10 PASS | [Quên mật khẩu Mailtrap](../QUEN_MAT_KHAU_MAILTRAP.md) | Không gộp thành nghiệm thu Mailtrap; giữ BLOCKED gửi/nhận bên ngoài |
| Khiếu nại 05/11: refunds 9 PASS; UI 08/11: 31 test/lint/build 118 modules | [Tiến độ khiếu nại](../../plans/TIEN_DO_KHIEU_NAI_KHACH_HANG.md) | Nêu chống gửi lặp, lỗi tải và phản hồi cũ; chưa QA ba viewport |
| Workspace 07/11: backend 83 PASS/13 SKIP; frontend 31 PASS/build 118 modules | [Sắp xếp thư mục](../../plans/BAO_CAO_SAP_XEP_THU_MUC.md), [tiến độ Admin](../../TIEN_DO_ADMIN_PETCARE.md) | Tách 83 mặc định này với 83 tích hợp tháng 10; không coi SKIP là PASS |
| Node v24.20.0/npm 11.19.0, Vite 5.4.21; PostgreSQL 17.11, 22 bảng, 9 checksum khớp | [Tiến độ Admin](../../TIEN_DO_ADMIN_PETCARE.md), package | Dữ liệu môi trường theo mốc 07/11; không truy vấn/đo lại ngày 10/11 |
| Khôi phục và kiểm dữ liệu cũ | [Khôi phục local](../DB_LOCAL_RECOVERY.md), báo cáo/biên bản migration | Phân biệt backup/thử copy/áp DB local ở những mốc khác nhau; hash không chứng minh mọi giao dịch cũ đúng nghiệp vụ |

Đã định vị lại đầu mối các testcase Bảng 3.3 trong booking, dispatch và refunds. Bảng nêu tiền điều kiện/kỳ vọng và nguồn, không gán một kết quả chạy mới cho từng case. Raw log mọi ca chưa được kiểm toán lại; đây là tổng hợp có đối chiếu biên bản và mã, không phải thực thi tái lập toàn bộ kết quả.

## 3. Quyết định chọn ảnh

G4 mở trực tiếp **9 ảnh ứng viên**: 5 ảnh đã xem ở G0 và 4 ảnh mới được xem nội dung trong lượt này. Chọn 8; ảnh form lỗi đăng ký không đủ phạm vi caption nên giữ Hình 3.1 trống. Ảnh Admin cũ đã được G0 ghi nhận không phù hợp KPI mới, không đưa vào Chương 3.

| Hình | Quyết định | File/phạm vi minh họa và giới hạn |
|---|---|---|
| 3.1 | Trống | `register-error-fixed.png` chỉ có phần form đăng ký/lỗi, thiếu trọn đăng ký và đăng nhập |
| 3.2 | Trống | Chưa có ảnh hồ sơ thú cưng được chọn |
| 3.3 | Dùng ảnh có sẵn | `.cache/payment-sandbox/booking-spacing-fixed.png`; minh họa không có ca, không phải đặt thành công; ngày form không là ngày chụp |
| 3.4 | Dùng ảnh demo | `.cache/payment-sandbox/deposit-paid-preview.png`; cọc 45.000 đồng sandbox, lịch còn chờ xác nhận |
| 3.5 | Trống | Chưa có ảnh khiếu nại khách/QA phù hợp |
| 3.6 | Dùng ảnh demo lịch sử | `.cache/local-run/stage8-care-completed.png`; trạng thái hoàn tất và chi tiết |
| 3.7 | Trống | Chưa có ảnh ngoại lệ trước bắt đầu được chọn |
| 3.8 | Dùng ảnh demo lịch sử | `.cache/local-run/stage7-assigned.png`; không tự ghép cùng fixture với 3.6 qua mã lịch |
| 3.9 | Dùng ảnh demo lịch sử | `.cache/local-run/stage9-invoice-after-refund.png`; thu 400.000, hoàn 100.000, nợ 0 |
| 3.10 | Dùng ảnh demo lịch sử | `.cache/local-run/stage10-refund-receipt.png`; chứng từ UI-DEMO, không chứng minh chuyển tiền thật |
| 3.11–3.13 | Trống | Chưa có ảnh ca, danh mục và đúng trạng thái duyệt chưa chi được chọn |
| 3.14 | Dùng ảnh demo lịch sử | `.cache/local-run/stage11-net-report.png`; 400.000 − 100.000 = 300.000, không là lợi nhuận |
| 3.15 | Dùng preview demo | `.cache/payment-sandbox/revenue-quarter-preview.png`; 1.145.000 − 200.000 = 945.000, tập khác ảnh 3.14 |
| 3.16–3.17 | Trống | Không lấy Admin cũ chứng minh KPI/lọc/cảnh báo mới, không tạo popup giả |

Tám ảnh chọn đã được xem nội dung: dữ liệu/nhãn demo phù hợp, không có mật khẩu gốc, token hoặc thông tin nhận tiền ngân hàng thật cần đưa vào báo cáo. Không suy ngày chụp từ ngày đang được nhập/lọc trong UI hoặc mtime của file. Cả 27 PNG ứng viên được ghi hash trước biên soạn để bảo toàn, không chỉnh sửa ảnh gốc.

Ảnh chỉ được tham chiếu tới file cục bộ đã có, không chép cache/dump/build vào commit. Khi dàn Word cần bảo đảm còn đủ file nguồn, kiểm độ đọc ảnh ở kích thước in và gói tài nguyên phù hợp. Preview nhỏ chưa thay bộ ảnh đầy đủ của từng kỳ/thiết bị; các chỗ trống có caption/khoảng cách để tự chèn theo yêu cầu người dùng.

## 4. Trích dẫn và phân biệt kết quả tự làm

Chương 3 dùng [22] cho tài liệu công cụ Node test runner, [23] cho cơ sở cơ chế DB và [32] cho phương pháp thiết kế ca. Số không đổi so với kho 1–41. Kết quả ứng dụng, phiên bản môi trường, ảnh và bảng đánh giá lấy từ mã/biên bản dự án, không dùng bài nghiên cứu bên ngoài chứng nhận kết quả Thế Giới Thú Cưng.

Tập được dẫn đến hết ba chương hiện có **25 nguồn: 6 Việt/19 Anh (24% Việt)**. [22] là nguồn đã có được đưa vào sử dụng, không phải nguồn mới phát hiện. Kho xét chọn vẫn 41 hồ sơ; tỷ lệ tiếng Việt chưa đạt 60–70%, không dùng nguồn chưa đọc hoặc ít liên quan để tăng tỷ lệ. Chưa cần đưa [35] Postman vào tập dẫn vì không có bằng chứng collection đã thực thi.

Đã kiểm số dẫn có đối ứng; thứ tự danh mục theo trường, chọn tập cuối và thay số đồng bộ thuộc G5. Kiểm trích dẫn/field, caption và bố cục Word/PDF thuộc G6–G7. Không gọi dãy làm việc hiện tại là bản IEEE nộp cuối đã hoàn tất, không tuyên bố đã rà resolver/rút bài toàn diện.

## 5. Các mức kết luận cần giữ

- Test logic, tích hợp HTTP, QA trình duyệt và build là các loại bằng chứng khác nhau; 118 modules không phải 118 testcase.
- 83 PASS tích hợp lõi tháng 10 khác 83 PASS mặc định tháng 11; không cộng các lần chạy chồng nhau hoặc thay kết quả SKIP bằng PASS.
- Duyệt hoàn chưa chi không làm giảm tiền; chi thất bại giữ chờ; hoàn không mở lại công nợ. Các số demo không là doanh thu thật.
- Hướng dẫn/VietQR và nhân sự xác nhận khác merchant/webhook đối soát; sandbox và phiếu demo không chứng minh dòng tiền thật.
- Có mã KPI/lọc và kiểm tra nền chưa thay HTTP/UI QA riêng; ảnh Admin cũ không chứng minh giao diện nâng cấp.
- Mailtrap thật, Docker runtime, production, tải và khảo sát hài lòng chưa có bằng chứng hoàn tất; không nhận đã chạy lại chúng ngày biên soạn.
- Cả ba chương có nội dung không đồng nghĩa đã xong toàn báo cáo: kết luận, chốt danh mục, tài nguyên thiếu, Word và QA xuất bản còn thuộc bước sau.

## 6. Kiểm tra tài liệu và bảo toàn

Đối chiếu tự động gồm 12 mục/37 tiểu mục, 7 bảng đúng vị trí/caption G1, 17 caption hình, 8 đường dẫn ảnh và 9 chỗ trắng; nguồn/case/liên kết có thật; không có ký tự hỏng hoặc file hình/Word/PDF được tạo mới. Hash 40 file modified/untracked có trước, 218 file được bảo vệ và 27 PNG ứng viên được so lại; phần ghi nhận kế hoạch mới được tách khỏi các thay đổi có trước.

Kết quả lưu cục bộ tại `.cache/bao-cao-cuoi-ky-g4/validation.json`. Đây là kiểm tra tài liệu do tác nhân biên soạn thực hiện, chưa phải phản biện độc lập, kiểm tra tương đồng chuyên dụng hoặc một lượt nghiệm thu phần mềm. Không chạy build/test ứng dụng vì không sửa mã và không tạo kết quả PASS nghiệp vụ mới.
