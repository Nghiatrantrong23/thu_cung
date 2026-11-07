# Tổng hợp công trình và hệ thống liên quan PetCare

Ngày 07/11/2026. Tổng hợp phục vụ Chương 1–3; nguồn đánh số theo [danh mục chung](DANH_MUC_25_TAI_LIEU_THAM_KHAO.md). Những đề xuất dưới đây là phân tích của đợt nghiên cứu; không phải kết quả đo hiệu năng hoặc nghiệm thu mới.

## Công trình học thuật và hệ thống đặt dịch vụ

Bài về ViecNhaNhanh [6] mô tả cách tổ chức vai trò và vòng đời yêu cầu dịch vụ. Đây là công trình gần về quản lý dịch vụ, dù khác miền thú cưng. Có thể đối chiếu yêu cầu khách–nhà cung cấp và luồng giao dịch; chưa có căn cứ từ các phần đọc để chuyển nhận định hiệu quả thành mức cải thiện của PetCare.

Khóa luận website đặt lịch khám bệnh [4] tồn tại trong thư viện Duy Tân. Chỉ mục và tóm tắt ngắn chưa đủ để viết bảng so sánh chức năng, mô hình dữ liệu hoặc kết quả kiểm thử của công trình. Vai trò hiện tại là nhận diện tài liệu gần chủ đề, chờ tiếp cận toàn văn. Không biến tên khóa luận thành bằng chứng có thuật toán tối ưu lịch.

## Khảo sát sản phẩm tương tự

Ba nguồn dưới đây do nhà cung cấp phát hành. Chúng có giá trị như tài liệu chức năng, **không phải ba nghiên cứu khoa học**. Chưa đăng nhập dùng thử hoặc thực hiện benchmark các sản phẩm.

| Hệ thống | Chức năng quan sát trong tài liệu | Giá trị đối chiếu PetCare | Giới hạn |
|---|---|---|---|
| MoeGo [21] | Hàng đợi yêu cầu, hồ sơ thú cưng, xếp/từ chối/chờ | Tách yêu cầu đặt khỏi thao tác xác nhận, làm rõ thông tin điều phối | Chưa kiểm tra thuật toán hoặc thời gian xử lý |
| DaySmart Pet [20] | Cấu hình duyệt, chọn dịch vụ/nhân viên/giờ, chính sách đặt lịch | Đối chiếu luồng khách và cấu hình nghiệp vụ | Không biết cơ chế khóa dữ liệu bên trong |
| Gingr [19] | Lịch nhân viên, lịch lặp, hồ sơ và cập nhật khách | Mở rộng tiêu chí so sánh quản lý lịch và truyền thông | Trang quảng bá có xung đột lợi ích; không dùng số tăng trưởng/đánh giá sao làm bằng chứng |

Khi viết Chương 1 nên dùng “tài liệu nhà cung cấp mô tả…” và ghi ngày truy cập. Không kết luận PetCare ưu việt hơn các sản phẩm khi chưa có cùng tiêu chí, cùng dữ liệu và phép đo.

## Phân tích thiết kế, dữ liệu và kiến trúc

Giáo trình phân tích hệ thống [1] và hướng đối tượng [2] là nền phương pháp đã xác minh thư mục. Tài liệu CSDL [11] và kỹ nghệ phần mềm [14] bổ sung cơ sở học thuật. Do chưa đọc toàn văn các sách, phần hiện tại chỉ xác nhận phạm vi qua mô tả thư viện; khi trích nguyên tắc cụ thể phải mở phần tương ứng. Không dùng số bảng để chứng minh chuẩn hóa dữ liệu.

Nguồn gốc REST [18] đặt khung giải thích client–server và các ràng buộc kiến trúc. Với PetCare nên mô tả chính xác React gọi HTTP API Express. Nếu chưa đối chiếu đầy đủ, dùng “API theo định hướng REST”; không mặc định JSON và endpoint là bằng chứng tuân thủ toàn bộ REST.

Thông tin từ repository được đọc trong đợt này: `frontend/package.json` khai báo React ^18.3.1, `backend/package.json` khai báo Express ^4.19.2, pg ^8.12.0 và jsonwebtoken ^9.0.2; kế hoạch CSDL ghi PostgreSQL 17/SQL trực tiếp. Đây là thông tin dự án tại thời điểm đọc, không phải số liệu từ tài liệu tham khảo và không phải xác nhận phiên bản runtime đang chạy. Không đề xuất thay kiến trúc hiện hữu bằng microservices chỉ vì công trình liên quan sử dụng nó.

## Công nghệ và phương pháp đánh giá

React [24] hỗ trợ giải thích component/state. Express [17] dùng cho route, middleware và hướng dẫn bảo mật. Tài liệu PostgreSQL 17 [23] là căn cứ kỹ thuật cho giao dịch đồng thời; kết quả chống trùng lịch hoặc chống thu lặp phải chứng minh bằng test PetCare, không suy từ khả năng của DBMS.

BCP JWT [25] cung cấp tiêu chí kiểm tra cấu hình xác thực; nó không chứng nhận dự án đã an toàn. Việc xử lý quyền sở hữu, hết hạn và thu hồi phiên cần bằng chứng tại mã nguồn và test. Không đưa token/mật khẩu thật vào báo cáo.

Giáo trình kiểm thử [3] được chọn cho nền phương pháp, tài liệu `node:test` [22] cho công cụ thực thi. Kỹ nghệ phần mềm [14] là nguồn bổ trợ về quy trình xác minh. Cần tách thiết kế test, thực thi và kết luận; số PASS/FAIL/SKIP phải ghi môi trường, dữ liệu cô lập và thời điểm chạy. Đợt này chỉ thay tài liệu, không chạy lại test ứng dụng hoặc tạo kết quả đánh giá mới.

## Đề xuất cách phân tích giải pháp trong báo cáo

| Tiêu chí | Nguồn tham khảo | Bằng chứng PetCare phải cung cấp |
|---|---|---|
| Vai trò và trạng thái lịch | [6], [21], [20] | Use case, ma trận quyền, API và kịch bản trạng thái |
| Hồ sơ và thông tin tiếp nhận | [21], [19]; tổng hợp thú cưng | Trường dữ liệu thực tế và quyền đọc/sửa |
| Khả dụng và tranh chỗ | [23] | Kiểm thử đồng thời với kỳ vọng rõ ràng |
| Tính đúng thu/cọc/hoàn | [23], phân tích nghiệp vụ riêng | Transaction, chống lặp, đối soát và test dữ liệu |
| Bảo mật | [17], [25] | Cấu hình thật và kết quả kiểm tra từng tiêu chí |
| Chất lượng triển khai | [3], [22], [14] | Bộ test, số liệu thực thi và các giới hạn chưa nghiệm thu |

Khoảng thiếu hiện tại gồm toàn văn khóa luận đặt lịch, nghiên cứu định lượng trực tiếp trên spa thú cưng Việt Nam và đánh giá thực địa so sánh sản phẩm. Không biến khoảng thiếu trong lần tìm này thành tuyên bố tính mới toàn cầu.

## Đợt tìm tiếp sau điều chỉnh trọng tâm

| Nguồn mới | Nội dung có thể sử dụng hiện tại | Giới hạn |
|---|---|---|
| [26] Nguyễn Kim Khánh, 2026 | Nhận diện công trình Việt trực tiếp về đặt lịch spa thú cưng | Catalog/tóm tắt qua chỉ mục chính thức; chưa chứng minh tối ưu công suất |
| [27] Đỗ Cao Thắng và cộng sự, 2025 | Nhận diện khóa luận quản lý chuỗi spa/đặt lịch | Chỉ metadata; không gán chức năng phân ca hay cơ chế AI |
| [28] Nguyễn Quang Ninh, 2020 | Nhận diện công trình UX cho đặt lịch salon | Không abstract/toàn văn; chưa so sánh khả dụng |
| [29] Yeow và Kamaludin, 2023 | Trường hợp quản lý hồ sơ/dịch vụ/đặt giờ; mẫu bảng test chức năng | UAT một cơ sở; không thay test tranh chỗ và phân quyền PetCare |
| [30] Che Hassan và cộng sự, 2025 | Trường hợp grooming có hủy/hoàn và đánh giá | Bảng SUS có điểm chưa nhất quán; không lấy làm benchmark |

Đợt này gồm 3 nguồn Việt và 2 nguồn Anh, đều có nguồn gốc trường đại học. Ba nguồn Việt còn cần tiếp cận nội dung, nên không gọi chúng là ba hệ thống đã đánh giá chức năng. Hai bài công bố mở được PDF giúp cải thiện độ sát miền; kết quả của tác giả không được ghi thành kết quả PetCare.

Thay đổi định hướng đề xuất: giảm các nguồn bệnh da trùng nhau, giữ nền chăm sóc ở mức vừa đủ, ưu tiên công trình đặt dịch vụ thú cưng. Các đề tài có AI được nhận diện đúng nhan đề nhưng không tạo yêu cầu thêm AI cho dự án hiện tại. Đợt tìm tiếp dừng ở năm nguồn để người dùng đánh giá trước đợt sau.
