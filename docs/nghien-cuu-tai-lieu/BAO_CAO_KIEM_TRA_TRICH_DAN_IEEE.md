# Báo cáo kiểm tra trích dẫn IEEE và phương pháp nghiên cứu

**Ngày:** 07/11/2026. **Phạm vi:** năm file Markdown của đợt nghiên cứu PetCare; không sửa hoặc kiểm tra trích dẫn trong báo cáo Word chính. Hình thức Narrative / Integrative đã được người dùng chọn rõ trong chat. Không có PRISMA, protocol Systematic Review, sàng lọc đôi hoặc tuyên bố tìm kiếm bao quát toàn bộ lĩnh vực.

## 1. Cách thực hiện ARS và quyết định đã chốt

Áp dụng academic-research-suite 3.23.1, chế độ academic-paper `lit-review`, sau đó `citation-check`; đọc hợp đồng `literature_strategist_agent.md`, `citation_compliance_agent.md` và hướng dẫn xác minh nguồn. Hai tác vụ tìm kiếm độc lập được giao cho agent nguồn thú y và agent nguồn hệ thống Việt; người điều phối tổng hợp, kiểm tra lại các nguồn then chốt và kiểm tra số tham chiếu. Đây là hỗ trợ trong cùng hệ thống Codex, không phải hai nhà nghiên cứu sàng lọc độc lập, không phải xác minh chéo bằng mô hình ngoài. Không xác nhận nguồn là người dùng đã đọc. Không chạy API thư mục hay tải bản thảo lên dịch vụ mô hình ngoài.

Quyết định hình thức được giữ theo lời người dùng: “Tôi chọn **Narrative / Integrative Literature Review**, sử dụng chế độ `lit-review` của Academic Research Skills.” Các đầu ra hiện tại là thư viện nguồn, tổng hợp và kiểm tra; không phải bản thảo bài báo mới hoặc chứng nhận liêm chính học thuật.

## 2. Phương pháp tìm và lựa chọn nguồn

**Ngày tìm và kiểm tra:** 07/11/2026. **Phạm vi thời gian:** không khóa cứng; ưu tiên nguồn chuyên ngành cập nhật 2022–2026, giữ tài liệu nền tảng cũ khi phù hợp. Với công nghệ, ưu tiên tài liệu khớp React 18/Express 4/PostgreSQL 17 và dòng Node 24 ghi trong dự án. Không dùng năm upload làm năm xuất bản sách hoặc bản dịch.

**Kênh thực tế:** tìm kiếm web có truy vấn giới hạn miền và mở trang nguồn trực tiếp; OPAC/thư mục quốc gia, thư viện số đại học, NXB, tạp chí, cơ quan chuyên môn, tài liệu hãng và cơ quan chuẩn hóa. Google Scholar/IEEE Xplore/ACM/Springer là kênh mong muốn trong yêu cầu, nhưng không có phiên tìm kiếm trực tiếp có log xuất kết quả tại từng cơ sở dữ liệu trong lần này; không báo đã tra đầy đủ các kho đó. Nguồn công nghệ chủ yếu được kiểm tra tại trang chính thức.

| Nhóm truy vấn thực tế | Ví dụ từ khóa/chuỗi tìm | Mục đích |
|---|---|---|
| Chó mèo | `giáo trình bệnh chó mèo thư viện`, `"978-604-67-3104-7"`, `site.vnua.edu.vn chó mèo bệnh ngoài da` | Tìm sách có xuất xứ, kiểm tra tên/năm/ấn bản |
| Da lông và vệ sinh | `site.ctujsvn.ctu.edu.vn chó Demodex`, `site.jad.hcmuaf.edu.vn nấm lông chó`, `"nấm da" "Bảo Minh Châu"` | Bài báo thú y tiếng Việt, xác minh tạp chí/DOI |
| Grooming/spa | `site.edu.vn chăm sóc spa thú cưng giáo trình`, `site.wsava.org Vietnamese guidelines`, `site.rspca.org.uk dog grooming bathing welfare` | Tìm nghiệp vụ, đối chiếu hướng dẫn chuyên môn |
| Hệ thống | `"đặt lịch" "luận văn"`, `"hệ thống đặt lịch" "tạp chí"`, `"thú cưng" "repository"` | Tìm công trình lưu trữ chính thức, tránh trang bán đồ án |
| Phương pháp | `"Phân tích thiết kế" UML`, `"Giáo trình kiểm thử phần mềm"`, `"Giáo trình cơ sở dữ liệu"` | Giáo trình Việt có catalog và metadata |
| Hệ thống tương tự | `site.moego.pet online booking pet grooming software features`, `site.daysmart.com pet online booking grooming client management`, `site.gingrapp.com grooming software booking pet` | Chỉ kiểm tra chức năng sản phẩm |
| Công nghệ | `site.react.dev learn React official documentation`, `site.expressjs.com advanced best practice security`, `site.postgresql.org docs 17 explicit locking transaction isolation` | Trang gốc và tài liệu theo phiên bản |

Sau truy vấn khái niệm, tìm tên chính xác/tác giả/ISBN và mở biểu ghi/landing/PDF để đối chiếu. Không quy đổi số kết quả do máy tìm kiếm ước tính thành số tài liệu sàng lọc. Danh mục chính có 25; bảng ứng viên có 14 mục (UV14 là nhóm kết quả loại, không phải một ấn phẩm). Không có tổng số bản ghi đầu vào đủ log để công bố sơ đồ chọn mẫu.

**Đưa vào:** liên quan trực tiếp ít nhất một phần báo cáo; có xuất xứ xác định; metadata chính kiểm chứng được; nội dung được dùng trong phạm vi đã đọc. Tài liệu chính thức/nguồn nghiệp vụ được nhận đúng loại, không bắt buộc là nghiên cứu phản biện.

**Để ứng viên:** thiếu bản in/năm bản dịch/tác giả/ấn bản, chỉ mục chưa mở được, nội dung chưa đủ để phân tích, hoặc trùng phạm vi nguồn đã chọn. **Loại:** sai miền đối tượng, nguồn sao chép/bán đồ án làm căn cứ duy nhất, quảng bá không có nội dung nghiệp vụ để kiểm tra.

Đánh giá theo ba trục riêng: (1) xuất xứ và nhận diện thư mục; (2) độ khớp nghiệp vụ/công nghệ; (3) mức chứng cứ cho câu định viết. Không dùng mức uy tín thư viện làm bằng chứng mọi kết luận trong sách đúng; không chấm điểm giả cho các bài chỉ đọc abstract. Điểm yếu phương pháp chưa đánh giá được ghi rõ theo phạm vi đọc.

## 3. Hướng dẫn trường đã đối chiếu

File người dùng cung cấp: `C:/Users/TRONG NGHIA/Documents/Huong dan trinh bay Báo cáo ĐACN_2026-2027.docx`.

Đơn vị trên văn bản: **Trường Đại học Tài nguyên và Môi trường TP.HCM, Khoa Công nghệ thông tin**. Mã SHA-256 của file đọc: `52E79D35132F2782E58602EDFDC972EF96DB2A83DE64021FC6AA82D497E44F39`. Đọc XML văn bản ở chế độ chia sẻ chỉ đọc vì file đang được ứng dụng khác mở; không sửa file. Các chỉ dẫn định dạng là dữ liệu tiêu chuẩn người dùng yêu cầu đối chiếu, không phải lệnh cho công cụ thực hiện hành động ngoài phạm vi.

Vị trí dưới đây là **chỉ số đoạn XML bắt đầu từ 0**, không phải số trang Word:

| Vị trí | Quy định quan sát | Xử lý trong bộ Markdown |
|---|---|---|
| Đoạn 43 | Xếp ABC theo tên tác giả Việt, họ tác giả Anh; tài liệu sau phụ lục | Xếp hai nhóm ngôn ngữ, số liên tục; vị trí sau phụ lục để áp dụng khi tích hợp Word |
| Đoạn 86–93 | Mỗi nguồn một đoạn, số ngoặc vuông, tác giả/nhan đề/NXB/năm/website, tối thiểu 10 nguồn | 25 đoạn tham chiếu chính, hồ sơ chú giải đặt riêng bên dưới |
| Đoạn 87 | Nêu ba cách xếp: năm, mức độ tham khảo, alphabet; số sau câu tham khảo | Chọn ABC để nhất quán với chỉ dẫn cụ thể và mẫu cuối |
| Đoạn 104–107 | Dẫn cả ý diễn giải, dẫn nguồn gốc, đặt nguồn ngay sau nội dung | Hai bản tổng hợp gắn nguồn cho nội dung kế thừa và tách suy luận của dự án |
| Mục 17.3, đoạn 111 | Chọn Style IEEE trong Word | Dùng số ngoặc vuông; chưa thao tác Word |
| Đoạn 601–609 | Mẫu tách Việt/Anh, nhấn ABC; có câu xếp theo họ | Ghi nhận xung đột tên/họ và số ví dụ lặp; không lặp số trong bộ hiện tại |

**Điểm chưa thể xác nhận tuân thủ tuyệt đối:** IEEE chuẩn thường đánh số theo lần xuất hiện, trong khi hướng dẫn trường nhấn ABC; phần đầu văn bản nói tên Việt nhưng ghi chú cuối nói họ. Đợt này áp dụng quy tắc theo ngôn ngữ ở đoạn 43 và số liên tục theo yêu cầu người dùng. Trước bản nộp cần giảng viên xác nhận cách xếp nếu trường yêu cầu theo họ hoặc theo lần xuất hiện. Việc này không cản trở tìm nguồn hoặc hoàn thiện bộ nghiên cứu.

Tài liệu đối chiếu IEEE: [IEEE Reference Guide, điểm truy cập từ IEEE Author Center](https://journals.ieeeauthorcenter.ieee.org/wp-content/uploads/sites/7/IEEE_Reference_Guide.pdf). Link hiện chuyển sang Google Docs; phần nội dung không trích xuất được đầy đủ, không tuyên bố đã kiểm hết bản hướng dẫn trực tuyến mới nhất. Quy tắc số/DOI còn được đối chiếu với tài liệu IEEE trong ARS. Không tự động áp quy tắc APA hoặc thứ tự alphabet của APA vào kết quả.

## 4. Xác minh nguồn và DOI

Mỗi hồ sơ trong danh mục ghi tác giả/tổ chức, nhan đề, năm/tình trạng không năm, đơn vị phát hành, URL, ngôn ngữ, mức tin cậy, độ liên quan, phạm vi đọc và vị trí dự kiến dùng. Các sách/thư mục được kiểm ở MARC/OPAC/NXB; bài báo ở landing/số báo/PDF; công nghệ ở tài liệu gốc. Không điền nhà xuất bản, năm, DOI hoặc trang phỏng đoán.

| DOI trong bộ chính | Nguồn xác nhận chuỗi định danh và nhận diện | Resolver độc lập |
|---|---|---|
| 10.46826/huaf-jasat.v8n1y2024.1119 | [7], tạp chí/PDF chính thức | Chưa xác nhận; công cụ không truy cập được doi.org |
| 10.31817/tckhnnvn.2025.23.12.01 | [8], landing/số báo chính thức | Chưa xác nhận; công cụ không truy cập được doi.org |
| 10.70408/nias.i152-y2025-675 | [10], landing/PDF số gốc | Chưa xác nhận; công cụ không truy cập được doi.org |
| 10.52997/jad.5.02.2025 | [15], tạp chí/PDF chính thức | Chưa xác nhận; công cụ không truy cập được doi.org |
| 10.17487/RFC8725 | [25], mục About this RFC của RFC Editor | Chưa xác nhận; công cụ không truy cập được doi.org |

Năm DOI trên là metadata có căn cứ; hạn chế resolver không biến thành kết luận DOI giả hoặc sai. DOI thiếu ở các nguồn còn lại ghi “không thấy trong nguồn đã kiểm tra”, không chứng nhận không tồn tại. Không thực hiện kiểm tra Retraction Watch toàn diện; không cấp nhãn “không bị rút bài” hoặc chứng nhận chống đạo văn. Không dùng chỉ mục nhà xuất bản làm bằng chứng bài chưa từng bị đính chính.

## 5. Những lỗi và sai biệt đã xử lý

| Vấn đề | Xử lý | Giới hạn còn lại |
|---|---|---|
| Phạm Nguyên/Nguyễn Cương khác nhau ở biểu ghi | Dùng Phạm Nguyễn Cương theo Thư mục Quốc gia 02/2017 và nguồn đối chiếu | Chưa đọc trang bản quyền sách |
| Sách chó mèo 2012 có 141/142 trang | Bỏ tổng số trang sách khỏi tham chiếu | Không ảnh hưởng nhận diện tác giả/nhan đề/năm |
| Sách 2024 có mốc lưu chiểu 2025 | Giữ năm xuất bản 2024, ghi riêng lưu chiểu | Metadata NXB lỗi template đã công khai trong hồ sơ |
| Tạp chí Chăn nuôi đổi tên landing | Giữ tên in trên số 152/2025 | Chưa thẩm định phương pháp toàn bài |
| Bản CSDL có nhiều năm và kiểm thử 2014 lệch NXB | Bản CSDL mơ hồ giữ ứng viên; bộ chính dùng bản khác có đối chiếu. Không nhập giáo trình kiểm thử 2014 | Cần bản quyền nếu muốn dùng các bản đó |
| Tài liệu Web không ghi năm | Ghi không năm + ngày truy cập, khóa phiên bản khi có | Không giả năm từ copyright hoặc thư mục upload |
| React/Express tài liệu mới khác bản dự án | Dùng kho React 18 và API Express 4 | Chưa xác nhận mọi patch runtime của dự án |
| Ba nguồn thương mại dễ bị gọi là nghiên cứu | Gắn nhãn tài liệu chức năng/sản phẩm | Chưa dùng thử/benchmark |
| Ví dụ danh mục trường đặt lại số nhóm Anh | Dùng một dãy số chung cho cả hai nhóm | Cần giảng viên chốt cách xếp cuối cùng |

## 6. Kiểm tra kỹ thuật trên năm file

| Hạng mục | Kết quả thực tế |
|---|---|
| Định nghĩa tham chiếu chính | 25; đúng dãy số 1–25; không trùng số |
| Tỷ lệ ngôn ngữ | 15 Việt / 25 = 60%; 10 Anh / 25 = 40% |
| Trường bắt buộc trong hồ sơ | 25/25 có tác giả, nhan đề, năm hoặc không năm, nơi phát hành, URL, phạm vi đọc, liên quan và vị trí dùng |
| DOI có căn cứ nguồn gốc | 5/25; không DOI trùng; trạng thái resolver nêu riêng |
| Trích dẫn trong hai bản tổng hợp | 44 lượt tham chiếu đơn; 25 số nguồn khác nhau |
| Số trong hai bản tổng hợp không có mục danh mục | 0 |
| Mục danh mục chưa xuất hiện trong hai bản tổng hợp | 0; có nhắc để nhận diện/giới hạn nguồn, không có nghĩa mọi nguồn đã được dùng để chứng minh kết luận |
| URL chính bị đếm trùng | 0; các chương của một bộ tài liệu không tách để tăng số lượng |
| Trường placeholder chưa điền | 0 sau sinh file và kiểm tra |
| Kiểm tra toàn bộ báo cáo Word chính | Chưa thực hiện; ngoài phạm vi |

Kiểm tra này là phép đối chiếu số tham chiếu/metadata cục bộ, **không phải** gọi API xác minh thư mục tự động. Không dùng việc số khớp để chứng minh câu văn được nguồn hỗ trợ. Đọc hỗ trợ nguồn và các giới hạn được ghi trong từng hồ sơ.

Chưa kiểm tra citation fields, số trang, kiểu chữ, mục lục, danh mục hoặc nguồn mồ côi **trong Word chính**. Khi tích hợp phải kiểm lại citation ↔ reference ở bản Word thực sự, loại nguồn không dùng và cập nhật đồng thời số. Không báo toàn bộ báo cáo Word đạt IEEE từ việc năm file Markdown đạt kiểm tra.

## 7. Kết luận có giới hạn và việc tiếp theo

Bộ nguồn đủ mục tiêu 20–25 với 60% tiếng Việt, có 14 mục ứng viên/phân loại bên ngoài. Nguồn không năm trong bộ chính là trang Web có tình trạng không ngày được nhận diện rõ, không phải sách/bài báo tự bỏ năm. Có 13 nguồn ghi năm 2022–2026 (52% tổng bộ); 5 nguồn trước 2016 cần giữ lý do nền tảng hoặc đối chiếu tài liệu mới, nhất là kiến thức lâm sàng cũ. Không lấy tỷ lệ nguồn mới làm thước đo chất lượng duy nhất.

Đã hoàn thiện thư viện nguồn và các bản tổng hợp trong phạm vi công khai đã đọc; chưa hoàn tất việc đọc toàn văn mọi nguồn hoặc đánh giá thực địa. Phần còn thiếu là giáo trình/SOP grooming Việt có nội dung đủ sâu, toàn văn khóa luận đặt lịch, các chương sách cần dẫn cụ thể và xác nhận cách xếp của giảng viên. Danh mục ứng viên ghi rõ điều kiện nâng vào bộ chính.

Không chạy build/test ứng dụng vì không đổi mã thực thi, không ghi/seed DB, không chỉnh báo cáo Word chính. Kiểm tra phù hợp đợt này là metadata, liên kết nội bộ, nhất quán trích dẫn, phân loại nguồn và diff Git. Không thay trạng thái nghiệm thu giai đoạn 12 của dự án.

## 8. Cập nhật theo yêu cầu tìm tiếp và file định hướng mới

Nguồn yêu cầu: file người dùng gửi `Pasted text.txt`, đọc trực tiếp ngày 07/11/2026. Người dùng yêu cầu giảm bệnh lý, chấm độ liên quan 1–5, tìm từng đợt 5–7 và trình bày năm phần để đánh giá trước đợt tiếp. Đợt bổ sung thực hiện 5 nguồn mới, không mở đợt tiếp theo. Thang điểm là mức khớp chủ đề theo người dùng, không phải generic self-scoring hay điểm chất lượng nghiên cứu.

Bảng V01–V09 được đánh giá lại trong tổng hợp thú cưng; V04/V06/V07 và V01 chuyển dự phòng, V05 chỉ bổ trợ. Chưa chốt lại danh mục 25 nguồn cuối sau điều chỉnh. Dữ liệu bộ 25 ban đầu ở các mục trên là kết quả của bản trước; thông số mới bên dưới thay thế khi nói về toàn thư viện hiện tại.

Tìm thêm bằng các chuỗi `"thú cưng" "đặt lịch" site:edu.vn luận văn`, `"spa" "đặt lịch" site:edu.vn "khóa luận"`, `"pet care management system"`, `"pet grooming" "booking" thesis university`. Có truy vấn giới hạn miền Scholar/IEEE/ACM/Springer qua máy tìm kiếm web; không có phiên tra cứu trực tiếp/xuất kết quả từ các cơ sở dữ liệu đó, không tuyên bố đã rà hết kho.

Metadata [26]–[28] đối chiếu trên chỉ mục của thư viện nguồn gốc; trang mở trực tiếp timeout/cache miss, đã khai báo. [28] có catalog bản giấy và nguồn khoa đối chiếu, không chỉ danh sách giao đề tài. PDF [29], [30] mở thành công ở máy chủ trường; chỉ đọc phần liên quan. Không khai báo đọc toàn văn vì mở được PDF không đồng nghĩa đọc mọi phần.

Hai DOI mới được kiểm tra trên trang đầu PDF: 10.30880/aitcs.2023.04.02.113 và 10.24191/jmcs.v11i1.8087. Không khẳng định resolver độc lập đã đạt. Bài [30] có ngày online khác nhau giữa landing/PDF nên chỉ ghi năm 2025. Bảng SUS có ô thiếu/tỷ lệ chưa nhất quán, không dùng số đánh giá này làm benchmark hoặc chứng cứ tăng hiệu quả của PetCare.

Năm nguồn mới sử dụng số 26–30 trong phần bổ sung của danh mục; số không trùng nghĩa với bộ cũ. **ABC chung chưa áp dụng cho phần bổ sung**, vì đây là đợt ứng viên chờ đánh giá; khi chọn danh mục cuối phải sắp lại và cập nhật mọi số. Không báo danh mục mở rộng hiện tại đã đạt toàn bộ quy tắc thứ tự nộp trường.

Kiểm tra cuối do người điều phối thực hiện. Lượt agent kiểm tra bổ sung không hoàn tất do giới hạn sử dụng; không ghi nhận đó là một đánh giá độc lập đã đạt. Hai tác vụ tìm nguồn ban đầu đã có kết quả, khác lượt kiểm tra chưa hoàn tất này.

Kiểm tra lại sau bổ sung: **30 số tham chiếu liên tục, 18 Việt/12 Anh, 7 DOI có căn cứ nguồn, 49 lượt nhắc trong hai bản tổng hợp, 0 số mồ côi, 0 mục chưa xuất hiện trong tổng hợp**. Nhắc nguồn để đánh giá/dự phòng không đồng nghĩa đã dùng nó làm chứng cứ cho luận điểm. Các nguồn bệnh lý dự phòng không được tính là lựa chọn cuối chỉ vì còn hồ sơ.
