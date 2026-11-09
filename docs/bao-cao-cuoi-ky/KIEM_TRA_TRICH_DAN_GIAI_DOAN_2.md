# Kiểm tra trích dẫn và nội dung — Giai đoạn 2

Ngày: 09/11/2026. Đối tượng kiểm tra: [Tóm tắt](TOM_TAT_DO_AN.md), [Mở đầu](MO_DAU.md), [Chương 1](CHUONG_1_TONG_QUAN_TAI_LIEU.md), đối chiếu [kho tham khảo](DANH_MUC_TAI_LIEU_THAM_KHAO.md), [hồ sơ bổ sung](BO_SUNG_NGUON_GIAI_DOAN_2.md) và đề cương G1. Áp dụng kiểm tra citation của Academic Research Suite; không gọi đây là kiểm tra bản Word cuối.

## 1. Kết quả và phạm vi kết luận

Bản nháp dùng **24 nguồn phân biệt**: [6], [13], [16], [17], [18], [19], [20], [21], [23], [24], [25], [26], [29], [30], [31], [32], [33], [34], [36], [37], [38], [39], [40], [41]. Mọi số này có bản ghi thư mục trong kho 41 hồ sơ; cùng nguồn giữ cùng số ở Mở đầu và Chương 1. Không có trích dẫn số trong Tóm tắt.

Trong tập được dẫn, **6 nguồn Việt/18 nguồn Anh (25% Việt)**. Sáu nguồn Việt là [6], [13], [26], [31], [32], [40]. Toàn kho có 21 Việt/20 Anh (51,2%). Cả hai tỷ lệ đều chưa đạt mong muốn 60–70%; tỷ lệ toàn kho không được dùng để đại diện cho bản nháp. Tài liệu công nghệ chính thức chiếm tỷ trọng lớn; không thêm sách chưa đọc để tăng tỷ lệ. Có 24 nguồn được dẫn không đồng nghĩa 24 nghiên cứu khoa học: tập này gồm bài báo, bài giảng, hướng dẫn, tiêu chuẩn, hồ sơ thư viện và tài liệu nhà cung cấp.

**Đạt trong phạm vi bản nháp G2:** số tham chiếu có đối ứng, cách sử dụng phù hợp phần đã đọc, nguồn và phân tích của dự án được phân biệt. **Chưa chốt chuẩn bản nộp:** thứ tự tham khảo theo mẫu trường, thay số toàn báo cáo, citation trong Chương 2–3 và Word/PDF còn thuộc các giai đoạn sau. Không kết luận đã kiểm toàn bộ cơ sở dữ liệu rút bài, errata hoặc mọi URL bằng HTTP trong lượt QA cục bộ.

## 2. Đối chiếu luận điểm với bằng chứng

| Nhóm luận điểm | Nguồn/vị trí nội dung | Quyết định khi viết |
|---|---|---|
| Bối cảnh đào tạo Việt Nam | [13] chương trình Pet-Grooming; [31] tin hội thảo | Chỉ nói về đào tạo/nghề, không nêu CAGR, doanh thu hoặc quy mô thị trường |
| An toàn và tiếp nhận | [16] hướng dẫn CFSG, các mục hành vi/sức khỏe, chủ nuôi và quy trình | Dùng nguyên tắc tham khảo; không áp luật Anh/Wales tại Việt Nam, không tự đặt chỉ định y khoa |
| Khung quy trình PetCare | Phân tích yêu cầu/mã và sơ đồ đã khảo sát; [13], [16] hỗ trợ phạm vi | Bảng 1.1 ghi rõ do nhóm phân tích; chưa nhận SOP thực địa đã phê duyệt |
| Công trình Việt cùng hướng | [26] hồ sơ thư viện; [6] bài đã đọc | [26] chỉ nhận diện tác giả/tên/năm/chủ đề; không suy thuật toán hoặc kết quả chưa đọc |
| Công trình hệ thống quốc tế | [29], [30], [33], phần phương pháp/chức năng/đánh giá đã đọc | Nêu mức áp dụng và khác biệt; không lấy điểm UAT/SUS hoặc kết quả nguồn làm kết quả PetCare |
| VOAS | [33] PDF và số báo 2023 | Không dùng ngày nhập landing 2025 làm năm bài; không đếm bản kỷ yếu liên quan thành nghiên cứu độc lập |
| Hệ thống thương mại | [19]–[21], trang/hướng dẫn hãng | Bảng 1.3 ghi rõ nguồn nhà cung cấp, chưa dùng thử; ô thiếu căn cứ là chưa xác định |
| UML | [36] các phần chọn lọc về Class, StateMachines, Activities, Interactions, Use Cases | Không gọi sơ đồ màn hình là loại UML chuẩn; không suy backend có class lập trình cùng tên |
| Dữ liệu quan hệ/chuẩn hóa | [40] các slide quan hệ, thiết kế, chuẩn hóa đã đọc | Nêu lý thuyết, chưa chứng nhận cả CSDL đạt 3NF; không gán năm cập nhật mục lục cho mọi PDF |
| Toàn vẹn/đồng thời | [23] Constraints, Concurrency Control, Range Types | Phân biệt khả năng PostgreSQL với cơ chế dự án thực dùng; không nhận đã cài exclusion constraint |
| REST và RBAC | [18] Chương 5; [34] mô hình RBAC | HTTP/JSON chưa chứng minh đủ REST; năm nhóm quyền do dự án chọn, có thêm điều kiện sở hữu/trạng thái |
| React/Vite/Node/Express | [24], [37], [38], [17] | Khớp nhánh phiên bản; mô tả công cụ không biến thành số đo hiệu năng hoặc chứng nhận production |
| JWT/bcrypt | [41], [25], [39] | Ký khác mã hóa; băm khác mã hóa giải ngược; giới hạn bcrypt là 72 byte, không phải ký tự |
| Phương pháp kiểm thử | [32], phần phân hoạch tương đương/giá trị biên | Ca áp dụng do nhóm thiết kế; không tạo PASS mới hoặc cộng các đợt test chồng nhau |

## 3. Hồ sơ có trong kho nhưng chưa được dẫn

17 số chưa dùng ở G2: [1], [2], [3], [4], [5], [7], [8], [9], [10], [11], [12], [14], [15], [22], [27], [28], [35]. Đây là nguồn dự phòng hoặc dành cho bước sau, không phải tài liệu “bị thiếu trích dẫn” trong một danh mục nộp đã chốt. Khi lập danh mục cuối chỉ giữ tài liệu thực sự được dùng ở toàn báo cáo; không chuyển nguyên kho 41 hồ sơ sang Word.

Nguồn [22] về Node test runner và [35] về Postman có thể phù hợp Chương 3, nhưng chưa được đưa vào Chương 1 chỉ để đủ số lượng. Không có bằng chứng chạy collection Postman trong đợt này. Các sách Việt mới có catalog không được dùng để gán định nghĩa hoặc trình tự chi tiết chưa đọc.

## 4. Quy ước IEEE và điều kiện chốt

- Trích dẫn dùng số trong ngoặc vuông; khoảng [19]–[21] biểu thị ba hồ sơ 19, 20, 21. Dãy 1–41 trong kho liên tục, mỗi hồ sơ một số; không tạo số riêng cho chương của cùng bộ tài liệu.
- Số làm việc được giữ từ thư viện để các giai đoạn không trỏ nhầm tài liệu. Mẫu trường có các đoạn chưa thống nhất về thứ tự ABC/tên–họ và cách xếp; quy ước dự kiến đã ghi ở hồ sơ G0. Dãy hiện tại chưa phải IEEE thuần theo thứ tự xuất hiện, cũng chưa xếp ABC chung cho bản nộp.
- Khi chốt G5, chọn tập được dẫn toàn báo cáo, sắp theo quy tắc trường đã xác định và thay số đồng bộ trong mọi chương, bảng/caption và danh mục. Sau đó mới kiểm lại citation ↔ reference trên Word ở G6–G7.
- Tài liệu trực tuyến có URL và ngày truy cập; tài liệu không có năm riêng ghi “không ghi năm”. Không lấy copyright hoặc ngày cập nhật danh mục làm năm xuất bản khi chưa có căn cứ.
- DOI chỉ ghi từ nguồn có DOI; không tự tạo cho sách, slide hoặc tài liệu công nghệ. Nguồn chưa đủ xuất xứ như D&C/Paws Pet House tiếp tục ngoài tập dẫn.

## 5. Kiểm tra cấu trúc và mức khẳng định

Chương 1 có đủ 8 mục chính và 29 tiểu mục của G1; Bảng 1.1–1.5 nằm đúng tiểu mục 1.2.3, 1.4.3, 1.4.4, 1.5.2 và 1.7.8, giữ tên đã lập kế hoạch. G2 chưa viết Chương 2–3, chưa sửa 17 sơ đồ gốc. Tóm tắt được rút gọn để hướng tới giới hạn một trang; số trang thực phải kiểm khi dàn Word, chưa chứng nhận bằng render.

Rà nội dung tập trung vào các điểm dễ khẳng định quá mức: thuật toán kiểm tra khả thi khác tối ưu/tự phân công; Admin hiện chưa tách hoàn toàn khỏi nghiệp vụ vận hành; chuyển khoản có nhân sự xác nhận khác đối soát tự động; phê duyệt hoàn khác thực chi; trang Admin mô phỏng khác công cụ đã có backend; thông báo trong ứng dụng khác nhắc hẹn tự động đa kênh. Các giới hạn đó được giữ trong Mở đầu và định hướng Chương 1.

Các số thử nghiệm lịch sử không được cộng hoặc chuyển thành kết quả mới ngày 09/11/2026. Không tuyên bố có phỏng vấn doanh nghiệp, khảo sát khách hàng, đo hiệu năng, gửi SMTP thật hoặc triển khai production chưa có bằng chứng. Không sao chép đoạn nguyên văn từ nguồn; diễn giải ngắn rồi tách phần vận dụng do nhóm thực hiện. Đây là rà diễn giải và dẫn nguồn, chưa phải phép kiểm tra tương đồng bằng phần mềm chuyên dụng.

Kết quả kiểm tra tự động về cấu trúc, số tham chiếu, liên kết và hash bảo toàn được lưu ở `.cache/bao-cao-cuoi-ky-g2/validation.json` sau khi hoàn tất đợt QA; không công khai cache hoặc coi đây là kiểm thử ứng dụng.
