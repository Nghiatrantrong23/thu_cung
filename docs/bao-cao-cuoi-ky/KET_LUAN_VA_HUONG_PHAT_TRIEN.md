# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 1. Kết quả đạt được và mức đáp ứng mục tiêu

Đề tài đã phân tích, thiết kế và cài đặt thử nghiệm ứng dụng Web **Thế Giới Thú Cưng** phục vụ một cơ sở chăm sóc chó, mèo. Hệ thống liên kết hồ sơ khách hàng và thú cưng với danh mục dịch vụ, lịch hẹn, ca làm việc và dữ liệu thanh toán. Năm nhóm người dùng gồm khách hàng, nhân viên chăm sóc, lễ tân, quản lý và quản trị viên sử dụng các màn hình theo trách nhiệm của mình. Luồng nghiệp vụ chính đi từ đặt lịch trực tuyến hoặc tại quầy đến phân công, cập nhật tiến độ chăm sóc, lập hóa đơn và ghi nhận thu tiền. Hệ thống còn hỗ trợ các bước tiếp nhận, phê duyệt và thực chi hoàn tiền, cùng chức năng báo cáo thu, hoàn và thực thu trong kỳ.

Kết quả đối chiếu ở Bảng 3.7 cho thấy đồ án đáp ứng các mục tiêu cốt lõi trong phạm vi thử nghiệm đã ghi nhận. Các biên bản cung cấp bằng chứng cho những tình huống như từ chối khung giờ không đủ ca, xử lý yêu cầu đặt lịch cạnh tranh, kiểm tra quyền sở hữu dữ liệu và chống ghi nhận trùng giao dịch. Phạm vi đánh giá giới hạn ở các tình huống, cấu hình và mốc thực thi được trình bày trong Chương 3.

## 2. Kiến thức, kỹ năng vận dụng và khó khăn đã xử lý

Đồ án vận dụng UML để mô hình hóa yêu cầu, tương tác và vòng đời nghiệp vụ, cùng kiến thức về cơ sở dữ liệu quan hệ để tổ chức dữ liệu và đặt ràng buộc toàn vẹn. Kiến trúc Web phân tầng phân chia trách nhiệm giữa giao diện React, API Node.js/Express và PostgreSQL. Phân tích giá trị biên, phân hoạch tương đương và các ca thử tích hợp được dùng để xây dựng tình huống kiểm tra thời gian, quyền truy cập và giao dịch.

Một khó khăn kỹ thuật là xác định khung giờ còn nhận được lịch khi mỗi lịch chiếm một khoảng thời gian và có tập nhân viên đủ ca khác nhau. Giải pháp kiểm tra toàn bộ khoảng hẹn, xét lịch đã phân công và khả năng phục vụ các lịch đang chờ, rồi kiểm tra lại trong giao dịch trước khi ghi. Khó khăn thứ hai là giữ dữ liệu tài chính nhất quán khi có cọc, thu nhiều lần và hoàn tiền. Hệ thống lưu giá tại thời điểm giao dịch, áp dụng khóa chống lặp và phân biệt thời điểm duyệt hoàn với thời điểm ghi nhận thực chi.

## 3. Hạn chế còn tồn tại

Đề tài được thử nghiệm với cơ sở dữ liệu cô lập và dữ liệu mẫu. Đánh giá hiện có gồm kiểm thử logic, tích hợp và kiểm tra giao diện theo từng đợt. Việc hồi quy toàn bộ bản hiện tại, đo tải và khảo sát sử dụng tại cơ sở thực tế vẫn cần thực hiện. Vì vậy, báo cáo đánh giá mức đáp ứng chức năng theo bằng chứng đã ghi nhận, còn tác động đối với thời gian chờ và hiệu quả vận hành chưa được định lượng.

Chuyển khoản trong phạm vi triển khai sử dụng thông tin hoặc mã QR thanh toán kết hợp xác nhận thực nhận của nhân sự. Đối soát tự động với ngân hàng và triển khai trong môi trường vận hành thực tế chưa được kiểm chứng. Các công cụ quản trị như nhật ký bảo mật, cấu hình có lưu trữ và sao lưu, khôi phục cần tiếp tục hoàn thiện. Một số tình huống như giải phóng lịch chưa cọc và xử lý cọc dư sau giảm giá cũng cần được bổ sung.

## 4. Hướng phát triển

1. Hoàn thiện quy tắc hết hạn giữ chỗ, xử lý cọc dư và đối soát giao dịch. Khi tích hợp cổng thanh toán, bổ sung xác thực thông báo giao dịch, kiểm tra số tiền và mã tham chiếu, chống xử lý lặp và đối chiếu các giao dịch lệch trạng thái.
2. Hoàn thiện nhật ký thao tác nhạy cảm, cấu hình vận hành và sao lưu, khôi phục. Kiểm thử ảnh hưởng của việc đổi cấu hình, khóa tài khoản hoặc thay đổi quyền đối với các lịch đang mở.
3. Chạy hồi quy trên một bản phát hành xác định, bổ sung kiểm thử giao diện theo vai trò và đánh giá tải theo số yêu cầu đặt lịch đồng thời. Thử nghiệm tại một cơ sở để đo thời gian xử lý, ghi nhận phản hồi của người dùng và đánh giá mức phù hợp của quy trình.
4. Sau khi quy trình tại một cơ sở được kiểm chứng, nghiên cứu mở rộng lịch chăm sóc định kỳ và phân tách lịch, nguồn lực, dữ liệu giao dịch theo chi nhánh.
