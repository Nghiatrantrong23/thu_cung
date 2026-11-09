# TÓM TẮT ĐỒ ÁN

Đề tài “Xây dựng hệ thống quản lý và đặt lịch dịch vụ chăm sóc thú cưng” giải quyết bài toán liên kết hồ sơ chó mèo, dịch vụ, lịch hẹn và giao dịch. Mục tiêu là hỗ trợ đặt lịch trực tuyến, tổ chức ca, điều phối nhân viên và theo dõi quá trình chăm sóc.

PetCare phục vụ năm nhóm: khách hàng, nhân viên chăm sóc, lễ tân, quản lý và Admin. Phương pháp gồm tổng hợp tài liệu, phân tích yêu cầu, mô hình hóa UML, thiết kế dữ liệu quan hệ, cài đặt và kiểm thử. Giao diện sử dụng React/Vite; backend sử dụng Node.js, Express và PostgreSQL, trao đổi qua HTTP API. JWT hỗ trợ xác thực, bcrypt băm mật khẩu, kết hợp kiểm tra vai trò và quyền sở hữu tại server.

Đối với đặt lịch, hệ thống kiểm tra toàn khoảng thời gian và khả năng bố trí nhân viên trong ca bằng tìm kiếm quay lui, giữ nguyên phân công đã có. Cơ chế kiểm tra tính khả thi không tự lưu phương án phân công. Transaction và khóa dữ liệu hỗ trợ kiểm soát đồng thời, bảo toàn lịch, cọc, hóa đơn và thu/hoàn.

Các biên bản thử nghiệm ghi nhận luồng đặt lịch, điều phối, chăm sóc, hóa đơn, ghi nhận thanh toán, khiếu nại và thống kê. Kiểm thử đơn vị và tích hợp HTTP trên cơ sở dữ liệu cô lập kiểm tra cả tranh chỗ, sai quyền, gửi lặp và lỗi giữa giao dịch; thao tác giao diện được kiểm tra theo phạm vi từng đợt.

Đồ án đáp ứng mục tiêu chức năng cốt lõi trong phạm vi đã thử nghiệm. Công cụ Admin còn thiếu, kiểm tra đa thiết bị, đánh giá hiệu năng, đối soát thanh toán tự động, nghiệm thu SMTP bên ngoài và triển khai vận hành là các công việc cần tiếp tục.
