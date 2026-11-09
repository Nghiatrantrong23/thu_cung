# MỞ ĐẦU

## 1. Lý do chọn đề tài

Chăm sóc thú cưng bao gồm nhiều công việc có quan hệ với nhau: tiếp nhận thông tin chủ nuôi và chó mèo, xác định nhu cầu dịch vụ, bố trí thời gian, chuẩn bị nhân sự, ghi nhận quá trình thực hiện và bàn giao. Chương trình Pet-Grooming của Đại học Cửu Long đưa nội dung vệ sinh, tạo kiểu và vận hành dịch vụ vào cùng một chương trình đào tạo; tin hội thảo của Học viện Nông nghiệp Việt Nam cũng cho thấy sự quan tâm tới đào tạo và thực tiễn nghề chăm sóc thú cưng [13], [31]. Những nguồn này giúp xác định bối cảnh của đề tài, nhưng không được sử dụng để suy ra quy mô thị trường hoặc một tỷ lệ tăng trưởng chưa kiểm chứng.

Trong bài toán quản lý một cơ sở dịch vụ, lịch hẹn không chỉ là một ngày giờ được ghi lại. Mỗi lịch gắn với thú cưng, tập dịch vụ, thời lượng, giá dự kiến, người tiếp nhận và nhân viên phụ trách. Một thời điểm bắt đầu còn trống chưa bảo đảm toàn bộ dịch vụ có thể thực hiện trong ca. Khi nhiều khách cùng chọn một khoảng giờ, việc kiểm tra ở giao diện cũng chưa đủ để ngăn hai yêu cầu cùng được ghi nhận. Đây là các vấn đề được nhóm phân tích từ yêu cầu, mô hình và mã nguồn PetCare, không phải kết quả khảo sát định lượng tại một doanh nghiệp.

Thông tin trong quá trình phục vụ cũng cần được chuyển giao giữa các nhóm người dùng. Nhân viên chăm sóc cần biết lịch được giao và ghi chú liên quan; lễ tân cần nắm trạng thái để liên hệ khách; quản lý cần xem xét ngoại lệ và khiếu nại. Hướng dẫn dành cho người làm grooming của CFSG nhấn mạnh việc hiểu đặc điểm từng con vật, trao đổi với chủ nuôi và tổ chức quy trình phục vụ [16]. Từ đó, đề tài xác định nhu cầu lưu giữ thông tin phục vụ và trách nhiệm thao tác, thay vì chỉ xây dựng một biểu mẫu đặt hẹn.

Ở phía giao dịch, cần phân biệt số tiền đã được duyệt với số tiền đã thực sự ghi nhận thu hoặc chi. Giá dịch vụ thay đổi về sau không được làm mất ý nghĩa của hóa đơn cũ; thao tác gửi lại không được tự tạo thêm một lần thu hoặc hoàn. PostgreSQL cung cấp cơ chế giao dịch, khóa và ràng buộc dữ liệu để xây dựng các lớp bảo vệ tương ứng [23]. Việc lựa chọn cách áp dụng và kiểm chứng các quy tắc đó là phần công việc của dự án.

Vì vậy, nhóm lựa chọn đề tài “Xây dựng hệ thống quản lý và đặt lịch dịch vụ chăm sóc thú cưng”, hướng tới kết nối hồ sơ, lịch, nhân sự, quá trình chăm sóc và giao dịch trong một hệ thống Web. Giá trị của đề tài được xem xét thông qua mức đáp ứng yêu cầu và bằng chứng kiểm thử trong phạm vi triển khai, không thông qua những tuyên bố tăng doanh thu hoặc giảm thời gian chờ chưa có phép đo.

## 2. Mục tiêu đề tài

### 2.1. Mục tiêu tổng quát

Xây dựng ứng dụng Web PetCare hỗ trợ quản lý và đặt lịch dịch vụ chăm sóc chó mèo, trong đó dữ liệu và trạng thái nghiệp vụ được liên kết, thao tác được kiểm soát theo vai trò và các quy tắc quan trọng được kiểm tra tại server.

### 2.2. Mục tiêu cụ thể

Các mục tiêu cụ thể gồm:

- Quản lý tài khoản, thông tin khách hàng, hồ sơ thú cưng, dịch vụ và bảng giá để tạo đầu vào thống nhất cho quá trình đặt và phục vụ.
- Hỗ trợ đặt lịch trực tuyến và tại quầy; xác định khung giờ khả dụng theo thời lượng, ca làm việc và các lịch đã có; tổ chức xác nhận, giữ chờ, từ chối và phân công.
- Hỗ trợ nhân viên theo dõi lịch được giao, ghi nhận điều kiện phục vụ và cập nhật tiến trình từng dịch vụ, đồng thời bảo đảm trạng thái lịch chuyển theo quy tắc.
- Liên kết lịch với cọc, hóa đơn, các lần thu, khiếu nại và hoàn tiền; phân biệt phê duyệt với thực chi và hỗ trợ thống kê theo dữ liệu giao dịch.
- Kiểm soát quyền theo năm nhóm người dùng, kết hợp quyền sở hữu và trạng thái tài khoản; kiểm tra các tình huống đồng thời, gửi lặp và lỗi giữa transaction.

Các mục tiêu trên là cơ sở đánh giá ở Chương 3. Việc có một màn hình, một bảng SQL hoặc một route không tự chứng minh mục tiêu tương ứng đã hoàn tất.

## 3. Đối tượng nghiên cứu

Đối tượng nghiên cứu là bài toán quản lý quá trình cung cấp dịch vụ chăm sóc chó mèo: các tác nhân tham gia, dữ liệu cần lưu, trạng thái và điều kiện chuyển trạng thái, quan hệ giữa lịch hẹn với nguồn lực và giao dịch. Về mặt phần mềm, đề tài tập trung vào mô hình hóa yêu cầu, thiết kế dữ liệu và HTTP API, xác thực/phân quyền, kiểm tra tính khả thi của lịch và bảo toàn dữ liệu khi thao tác đồng thời.

Đề tài không nghiên cứu thuật toán chẩn đoán bệnh, kê đơn hoặc lựa chọn phương án điều trị. Thông tin sức khỏe trong PetCare phục vụ ghi nhận, trao đổi và quyết định tiếp nhận của người có trách nhiệm; ứng dụng không thay thế đánh giá chuyên môn thú y.

## 4. Phạm vi thực hiện

PetCare phục vụ năm nhóm đăng nhập: khách hàng, nhân viên chăm sóc, lễ tân, quản lý và Admin. Khách vãng lai là tác nhân truy cập các chức năng công khai trước đăng nhập, không phải một vai trò lưu trong cơ sở dữ liệu. Khi mô tả phân quyền, báo cáo sử dụng quyền thực tế trong middleware và route; việc tách Admin khỏi mọi nghiệp vụ vận hành chưa được coi là kết quả đã cài đặt.

Phạm vi chức năng bao gồm hồ sơ thú cưng, danh mục dịch vụ, lịch và ca, điều phối/chăm sóc, cọc, hóa đơn và ghi nhận thu tiền, đánh giá, khiếu nại/hoàn tiền, thông báo trong ứng dụng, báo cáo và quản trị tài khoản. Các trang nhật ký, cấu hình và sao lưu Admin còn thiếu phần xử lý hoặc dữ liệu thật tương ứng được ghi nhận là hạn chế, không đưa vào danh sách chức năng server đã hoàn thành.

Phạm vi thanh toán được phân biệt theo chế độ: hướng dẫn chuyển khoản với nhân sự xác nhận thực nhận và bộ mô phỏng trong môi trường thử nghiệm. Việc hiển thị VietQR hoặc khách bấm đã chuyển tiền không được xem là bằng chứng ngân hàng đã đối soát. Đề tài chưa công bố hoàn tất tích hợp merchant/webhook hoặc tự động chuyển tiền hoàn.

Môi trường được mô tả là local và các cơ sở dữ liệu thử nghiệm cô lập theo biên bản. Báo cáo chưa có căn cứ kết luận triển khai production, đạt mức tải cụ thể hoặc được đánh giá thực địa trên một tập khách hàng đại diện. Các kết quả khác mốc được giữ riêng, không cộng thành một lần nghiệm thu mới.

## 5. Phương pháp thực hiện

Đề tài sử dụng tổng quan tường thuật và tích hợp (Narrative/Integrative Literature Review) để liên kết kiến thức nghiệp vụ với công trình hệ thống liên quan và tài liệu kỹ thuật. Tài liệu được lựa chọn theo mức liên quan, xuất xứ, metadata và phần nội dung có thể tiếp cận; nguồn học thuật, hướng dẫn chuyên môn và tài liệu nhà cung cấp được phân loại riêng. Các giáo trình mới có catalog chỉ được sử dụng ở phạm vi nhận diện hoặc giới thiệu đã kiểm tra, không được suy thành nội dung chi tiết đã đọc.

Phân tích hệ thống dựa trên kế hoạch, mô hình, tài liệu cơ sở dữ liệu, mã frontend/backend và các biên bản kiểm thử hiện có. Chưa có biên bản phỏng vấn hay khảo sát doanh nghiệp mới nên những yêu cầu do nhóm đề xuất được trình bày đúng là phân tích của nhóm. Các mô hình UML và sơ đồ màn hình giúp mô tả nhiều góc nhìn; khi sơ đồ gốc khác mã hiện tại, báo cáo nêu rõ khác biệt thay vì sửa hình hoặc suy diễn cho khớp.

Quá trình triển khai kết hợp giao diện React/Vite, backend Node.js/Express và PostgreSQL. Kiểm chứng được tổ chức theo kịch bản nghiệp vụ, quyền, trạng thái và dữ liệu; phân hoạch tương đương và giá trị biên là căn cứ lựa chọn ca thử [32]. Kết quả tự động, kiểm thử tích hợp và thao tác giao diện được dẫn từ đúng biên bản, thời điểm và môi trường. Nội dung chưa chạy hoặc chưa đủ chứng cứ được giữ trạng thái tương ứng, không gán PASS từ sự hiện diện của mã nguồn.

## 6. Bố cục báo cáo

Báo cáo gồm ba chương. **Chương 1 — Tổng quan tài liệu** trình bày bối cảnh chăm sóc thú cưng, nghiệp vụ, công trình và sản phẩm liên quan, cơ sở lý thuyết và công nghệ. **Chương 2 — Phương pháp thực hiện** phân tích yêu cầu, trình bày đủ sáu loại sơ đồ đã thiết kế, cơ sở dữ liệu, kiến trúc, API và các giải pháp xử lý nghiệp vụ quan trọng. **Chương 3 — Cài đặt thử nghiệm, kết quả và đánh giá** mô tả phần đã triển khai, môi trường, ca thử, kết quả có bằng chứng và hạn chế. Phần cuối là kết luận và hướng phát triển, phụ lục nếu cần, sau đó đến danh mục tài liệu tham khảo.
