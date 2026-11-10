# CHƯƠNG 2. PHƯƠNG PHÁP THỰC HIỆN

## 2.1. Khảo sát và phân tích yêu cầu hệ thống

### 2.1.1. Nguồn khảo sát và phạm vi hệ thống

Phân tích Thế Giới Thú Cưng dựa trên kế hoạch tổng thể, tài liệu thiết kế cơ sở dữ liệu, bộ sơ đồ đã thiết kế, wireframe, mã frontend/backend và các biên bản kiểm tra trong dự án. Việc đối chiếu được thực hiện giữa yêu cầu, mô hình và thành phần xử lý để xác định phần đã có, phần khác thiết kế ban đầu và phần còn thiếu bằng chứng. Đây là khảo sát hồ sơ và hiện trạng phần mềm; chưa có biên bản phỏng vấn hoặc quan sát mới tại một cơ sở kinh doanh để gọi là khảo sát thực địa.

Phạm vi tập trung vào quản lý và đặt lịch chăm sóc chó mèo trong một cơ sở, từ thông tin khách–thú cưng đến điều phối, chăm sóc và giao dịch. Kiến thức nghiệp vụ ở Chương 1 hỗ trợ xác định thông tin cần trao đổi và giới hạn chuyên môn [13], [16]. Những quy tắc như giờ nhận lịch, chính sách cọc và phân nhóm quyền là lựa chọn của dự án; báo cáo không xem chúng là tiêu chuẩn áp dụng cho mọi cơ sở thú cưng.

### 2.1.2. Phân tích quy trình và dữ liệu nghiệp vụ

Luồng nghiệp vụ được tổ chức quanh lịch hẹn. Khách hàng có hồ sơ thú cưng, lựa chọn các dịch vụ đang cung cấp và gửi thời điểm mong muốn. Nhân sự tiếp nhận xem xét, giữ chờ, từ chối hoặc xác nhận kèm phân công. Nhân viên chăm sóc chỉ thực hiện phần việc đã được giao; khi hoàn tất, dữ liệu phục vụ là căn cứ lập hóa đơn và ghi nhận thu. Khi có khiếu nại, quyết định xử lý và thực chi hoàn được theo dõi riêng.

Mỗi bước tạo ra dữ liệu phục vụ bước tiếp theo nhưng không được làm mất lịch sử trước đó. Giá danh mục là giá hiện hành; giá trên chi tiết lịch và hóa đơn có ý nghĩa tại thời điểm phát sinh. Ca làm việc là nguồn lực dự kiến, còn phân công là quan hệ giữa một nhân viên với một lịch cụ thể. Cọc, hóa đơn và thanh toán không được gộp thành một cờ “đã thanh toán” duy nhất vì chúng khác thời điểm và điều kiện xử lý.

### 2.1.3. Ràng buộc, ngoại lệ và tiêu chí chấp nhận

Các ràng buộc quan trọng gồm: hồ sơ đúng chủ; dịch vụ còn hoạt động; thời gian hợp lệ; tổng thời lượng nằm trong giờ phục vụ; ca bao trọn khoảng thực hiện; trạng thái cho phép thao tác; người dùng có quyền; giá và số tiền được xác định lại tại server. Việc khách đã nhìn thấy giờ trống là thông tin tham khảo tại lúc đọc, chưa phải cam kết giữ chỗ khi yêu cầu tạo lịch được ghi.

Tiêu chí chấp nhận được đặt theo hành vi có thể kiểm chứng. Hai yêu cầu cạnh tranh chỗ cuối không được cùng nhận chỗ vượt năng lực; lỗi giữa quá trình ghi không để lại lịch thiếu chi tiết; gửi lại một lần thu không tạo thêm dòng tiền; người không sở hữu dữ liệu không đọc hoặc thay đổi được chỉ bằng cách sửa mã định danh. Với tình huống chưa có cơ chế hoàn chỉnh, như quyết toán dịch vụ đang làm dở hoặc tự giải phóng lịch chưa cọc, báo cáo giữ thành giới hạn thay vì tự bổ sung một luồng chưa được cài đặt.

## 2.2. Tác nhân và yêu cầu chức năng, phi chức năng

### 2.2.1. Tác nhân và ánh xạ vai trò

Thế Giới Thú Cưng có năm nhóm đăng nhập: khách hàng, nhân viên chăm sóc, lễ tân, quản lý và Admin. Khách vãng lai là tác nhân sử dụng chức năng công khai, chưa hình thành một giá trị vai trò riêng trong cơ sở dữ liệu. Mô hình RBAC cung cấp cơ sở liên kết người dùng với quyền thông qua vai trò [34]; cách chia nhóm và điều kiện bổ sung dưới đây là thiết kế của dự án.

**Bảng 2.1. Tác nhân và ánh xạ nhóm quyền**

| Tác nhân/nhóm | `vai_tro` | `chuc_vu` | Phạm vi trách nhiệm |
|---|---|---|---|
| Khách vãng lai | Chưa đăng nhập | Không áp dụng | Xem bảng giá, đăng ký, đăng nhập, khôi phục mật khẩu |
| Khách hàng | `KhachHang` | Không dùng để cấp quyền | Hồ sơ, lịch và giao dịch thuộc mình; phản hồi/khiếu nại theo điều kiện |
| Nhân viên chăm sóc | `NhanVien` | `Nhân viên chăm sóc` | Xem lịch được giao, kiểm tra điều kiện, cập nhật chăm sóc |
| Lễ tân | `NhanVien` | `Lễ tân` | Đặt tại quầy, điều phối, lập hóa đơn, ghi nhận thu và thực chi |
| Quản lý | `NhanVien` | `Quản lý` | Quyền tiếp nhận, quản lý ca/danh mục/báo cáo và quyết định xử lý |
| Admin | `Admin` | Không bắt buộc | Quản trị tài khoản; middleware hiện còn cấp quyền vận hành của tiếp nhận/quản lý |

*Nguồn: nhóm đối chiếu `auth.middleware.js`, routes và `App.jsx`; lý thuyết vai trò tham khảo [34].*

Năm nhóm được hình thành từ ba giá trị `vai_tro` và chức vụ nhân viên. Quyền phải dựa vào dữ liệu hiện hành của tài khoản, không nhận vai trò do client tự gửi. Phân biệt này đặc biệt cần thiết khi tài khoản bị khóa, nhân viên ngừng hoạt động hoặc chức vụ đã thay đổi sau lúc phát hành token.

### 2.2.2. Yêu cầu chức năng theo nhóm nghiệp vụ

Nhóm chia yêu cầu theo đối tượng và kết quả nghiệp vụ để truy vết sang module và kiểm thử. Các mã YC dưới đây được lập cho báo cáo, không phải tên route hoặc mã đã có trong ảnh UML. Bảng mô tả yêu cầu và điều kiện chấp nhận; tình trạng thử nghiệm được đánh giá ở Chương 3.

**Bảng 2.2. Yêu cầu chức năng**

| Mã | Nhóm yêu cầu, tác nhân | Đầu vào và kết quả cần đạt | Thành phần/điều kiện chấp nhận chính |
|---|---|---|---|
| YC-01 | Xác thực, mọi nhóm | Thông tin đăng nhập → phiên và hồ sơ được phép sử dụng | Auth; tài khoản hoạt động, mật khẩu đúng, token đúng mục đích/phiên bản |
| YC-02 | Khách hàng quản lý hồ sơ thú cưng | Hồ sơ chó/mèo → dữ liệu gắn đúng chủ | Pet; khách không truy cập hồ sơ người khác, ngừng theo dõi không xóa lịch sử |
| YC-03 | Tra cứu/quản lý dịch vụ | Danh mục, giá, thời lượng → dịch vụ công khai hoặc cập nhật bởi quản lý/Admin | Catalog; đầu vào hợp lệ, dịch vụ ngừng bán không được đặt mới |
| YC-04 | Khách đặt lịch online | Thú cưng, dịch vụ, ngày/giờ → lịch chờ xác nhận | Booking; kiểm toàn khoảng và ghi lịch–chi tiết–cọc liên quan cùng transaction |
| YC-05 | Nhân sự đặt tại quầy | Khách/thú cưng cũ hoặc mới → lịch và thông tin bàn giao phù hợp | Booking; tránh tạo lặp khách theo số điện thoại, lỗi không để dữ liệu mới dở dang |
| YC-06 | Tiếp nhận điều phối | Một quyết định giữ chờ/từ chối/phân công → trạng thái và thông báo | Dispatch; xử lý lịch còn chờ, người được chọn đủ ca và không làm mất năng lực lịch khác |
| YC-07 | Quản lý ca làm việc | Nhân viên, ngày/giờ → ca hoạt động hoặc hủy mềm | Shifts; không chồng ca hoạt động, không phá khả năng phục vụ lịch mở |
| YC-08 | Nhân viên chăm sóc | Lịch được giao, thao tác tiến độ → cập nhật lịch/chi tiết | Care; chỉ người được giao, bắt đầu đúng ngày, hoàn tất mọi chi tiết trước lịch |
| YC-09 | Hủy/đổi lịch | Yêu cầu và lý do → trạng thái/thời gian mới, xử lý cọc liên quan | Dispatch/Care; quyền sở hữu, trạng thái, chính sách và kiểm lại nguồn lực |
| YC-10 | Cọc dịch vụ | Chấp nhận chính sách, ghi nhận thu/chi → trạng thái cọc và sổ giao dịch | Deposits; snapshot chính sách, chống lặp, phân biệt mô phỏng và thực nhận |
| YC-11 | Hóa đơn và thu | Lịch hoàn tất, giảm giá, lần thu → hóa đơn và công nợ | Invoices; snapshot giá, không thu vượt nợ, tiền đưa khác số tiền ghi nhận |
| YC-12 | Khiếu nại và hoàn | Nội dung, quyết định, chứng từ chi → tiếp nhận/duyệt/thực chi | Complaints; đúng chủ, đúng hạn mức; duyệt chưa ghi thực chi, thất bại giữ chờ |
| YC-13 | Đánh giá và thông báo | Đánh giá sau phục vụ/tin theo người nhận → phản hồi và trạng thái đọc | Lịch hoàn tất thuộc khách, một đánh giá/lịch; tin chỉ đúng người nhận |
| YC-14 | Báo cáo quản lý | Khoảng thời gian → số liệu thu, hoàn và thống kê | Reports; dựa giao dịch thành công, phân biệt thực thu và lợi nhuận |
| YC-15 | Admin quản trị tài khoản | Tạo/reset/khóa/đổi quyền → trạng thái tài khoản được kiểm soát | Admin; bắt đổi mật khẩu tạm, thu hồi phiên, bảo vệ ràng buộc lịch |

*Nguồn: nhóm phân tích yêu cầu từ kế hoạch, mã và hồ sơ khảo sát Thế Giới Thú Cưng. Không dùng sự hiện diện module để tự đánh dấu yêu cầu đã nghiệm thu.*

Nhật ký bảo mật toàn hệ thống, cấu hình vận hành có persistence và sao lưu qua giao diện Admin chưa có phần xử lý đầy đủ tương ứng. Những trang hiện có cho các chức năng này không được thêm vào bảng như một kết quả backend hoàn thành. Tương tự, tài liệu có cấu hình Docker chưa chứng minh ứng dụng đã được triển khai bằng container.

### 2.2.3. Yêu cầu phi chức năng và cách kiểm chứng

Yêu cầu phi chức năng được gắn với phép kiểm tra hoặc giới hạn cụ thể. Tài liệu giao dịch của PostgreSQL, thực hành JWT và phương pháp thiết kế ca thử hỗ trợ lựa chọn cơ chế kiểm chứng [23], [25], [32]. Các mục tiêu chưa có phép đo không được gắn nhãn đã đạt.

**Bảng 2.3. Yêu cầu phi chức năng và cách kiểm chứng**

| Mã | Yêu cầu | Cách kiểm chứng dự kiến trong dự án | Giới hạn kết luận |
|---|---|---|---|
| PC-01 | Đúng quy tắc và trạng thái | Thử luồng hợp lệ, sai thứ tự, thiếu điều kiện và giá trị biên | Không suy từ một ca thành công ra mọi trạng thái |
| PC-02 | Toàn vẹn giao dịch | Gây lỗi giữa bước ghi, kiểm rollback và dữ liệu liên quan | Dùng DB thử cô lập, không gây lỗi trên DB thực tế |
| PC-03 | Kiểm soát đồng thời | Gửi cạnh tranh chỗ, phân công và giao dịch thu/hoàn | Chứng minh tình huống đã thử, chưa là benchmark tải lớn |
| PC-04 | Bảo vệ truy cập | Thử thiếu token, sai vai trò/chủ sở hữu, tài khoản khóa/token cũ | Không đồng nghĩa đã kiểm thử xâm nhập toàn diện |
| PC-05 | Chống ghi lặp | Gửi lại cùng khóa và thử khóa trùng nhưng nội dung khác | Cần kiểm theo từng loại giao dịch, không coi mọi POST đều chống lặp |
| PC-06 | Phản hồi giao diện rõ | Kiểm trạng thái chờ, lỗi validation, rỗng, hết phiên và yêu cầu đến muộn | Cần QA từng màn hình/viewport; không tự nhận tất cả thiết bị đã đạt |
| PC-07 | Truy vết và bảo trì | Đối chiếu yêu cầu–API–module–test, kiểm migration/checksum | Nhật ký lịch không thay audit bảo mật toàn hệ thống |
| PC-08 | Hiệu năng và vận hành | Cần phép đo tải, thời gian đáp ứng và giám sát thực tế | Chưa có số đo để công bố mức tải hoặc uptime |

*Nguồn: nhóm xác định cho Thế Giới Thú Cưng; phương pháp tham khảo [23], [25], [32].*

### 2.2.4. Ma trận quyền năm nhóm

Ma trận dùng quyền ở server làm căn cứ. Ký hiệu **C** là được thao tác nhưng phải thỏa điều kiện nghiệp vụ; **S** là dữ liệu thuộc sở hữu hoặc được phân công; **—** là không được cấp quyền qua nhóm route tương ứng. Các chức năng công khai không được xem là quyền quản trị.

**Bảng 2.4. Ma trận quyền năm nhóm người dùng**

| Nghiệp vụ/tài nguyên | Khách hàng | Chăm sóc | Lễ tân | Quản lý | Admin |
|---|---|---|---|---|---|
| Xem dịch vụ công khai | C | C | C | C | C |
| Hồ sơ thú cưng | S tự phục vụ | Đọc thú cưng có lịch được giao | Đọc/tra cứu; tạo cùng lịch tại quầy | Đọc/tra cứu; tạo cùng lịch tại quầy | Đọc/tra cứu; tạo cùng lịch tại quầy |
| Tạo lịch online của khách | S | — | — | — | — |
| Đặt tại quầy, xem giờ trống phục vụ khách | — | — | C | C | C |
| Xem lịch | S | S được giao | C | C | C |
| Giữ chờ/từ chối/phân công | — | — | C | C | C |
| Bắt đầu/cập nhật/hoàn tất chăm sóc | — | S được giao | — | — | — |
| Hủy lịch còn cho phép | S | — | C | C | C |
| Đổi lịch | S qua luồng cọc/đổi lịch được cấp | — | C | C | C |
| Quản lý ca, danh mục và báo cáo | — | — | — | C | C |
| Xem hóa đơn/khiếu nại | S | — | C | C | C |
| Lập hóa đơn, ghi nhận thu/cọc và thực chi | — | — | C | C | C |
| Gửi khiếu nại/đánh giá của khách | S | — | — | — | — |
| Tiếp nhận khiếu nại tại quầy | — | — | C | C | C |
| Quyết định khiếu nại/ngoại lệ cọc | — | — | — | C | C |
| Tạo/reset/khóa/đổi quyền tài khoản | — | — | — | — | C |

*Nguồn: nhóm đối chiếu middleware, các routes lịch/cọc/hóa đơn/khiếu nại/ca/Admin và kiểm tra sở hữu trong service.*

Ma trận không xác nhận mọi thao tác đều có một nút giao diện tương ứng. Chẳng hạn khách có đường xử lý đổi lịch trong nhóm API cọc, trong khi route đổi lịch của nhóm lịch hẹn dành cho nhân sự tiếp nhận. Admin hiện được middleware cho phép nhiều nghiệp vụ quản lý/lễ tân, nhưng không được cấp quyền thực hiện chăm sóc thay người được giao. Mô hình Admin chỉ quản trị hệ thống là định hướng phân tách, chưa phải mô tả đầy đủ quyền hiện hành.

Các route tạo/sửa/ngừng theo dõi hồ sơ thú cưng tự phục vụ chỉ cấp cho khách hàng; quyền nhân sự đọc hoặc tạo thông tin qua luồng tại quầy không được mở rộng thành quyền CRUD hồ sơ tùy ý.

## 2.3. Thiết kế sơ đồ ca sử dụng

### 2.3.1. Sơ đồ ca sử dụng tổng thể

Use Case được sử dụng để mô tả tác nhân và những hành vi mà hệ thống cung cấp; các mô hình cấu trúc, hoạt động, tương tác và trạng thái bổ sung những góc nhìn khác theo UML [36]. Hình 2.1 là sơ đồ tổng thể đã thiết kế của Thế Giới Thú Cưng, giữ nguyên ảnh gốc để đối chiếu với hiện trạng.

![UC-01 — Tác nhân và chức năng tổng thể](<D:/dich_vu_thu_cung/Sơ đồ trạng thái_sơ đồ class/Sơ đồ ca sử dụng.png>)

**Hình 2.1. Tác nhân và chức năng tổng thể**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã UC-01; giữ nguyên ảnh gốc.*

Ranh giới hình bao quanh các chức năng của hệ thống; bên ngoài là khách vãng lai, khách hàng, nhân viên, lễ tân, quản lý, Admin và tác nhân người dùng chung. Các đường nối thể hiện sự tham gia; hình còn dùng các nhãn `include`, `extend` và quan hệ khái quát hóa. Khi đọc các quan hệ này cần kiểm tra hướng mũi tên và ý nghĩa bắt buộc/tùy điều kiện, không đồng nhất mọi nét nối với một quyền API đã được cấp.

Một số nét chọn màu xanh và đường hướng dẫn vẫn còn trong ảnh. Hình cũng nối các chức năng tổng hợp theo thiết kế ban đầu, trong khi quyền hiện tại được làm rõ ở Bảng 2.4. Vì vậy, sơ đồ là đầu vào mô hình hóa, chưa phải bằng chứng mọi chức năng trên hình đã có backend hoặc mọi quan hệ ký pháp đã được nghiệm thu.

### 2.3.2. Nhóm khách vãng lai và khách hàng

Khách vãng lai gắn với đăng ký, tra cứu dịch vụ/bảng giá và quên mật khẩu. Sau đăng nhập, khách hàng quản lý hồ sơ thú cưng, đặt/xem/hủy lịch, thanh toán theo luồng được hỗ trợ và gửi đánh giá/phản hồi. Các chức năng cá nhân cần được hiểu cùng quyền sở hữu; việc biết mã lịch không cho phép truy cập dữ liệu của khách khác.

Những mở rộng hiện tại như trang hóa đơn và khiếu nại riêng được đối chiếu ở phần route, không tự thêm một hình Use Case con chưa có. Đối với “thanh toán”, hành vi phía khách như xem hướng dẫn chuyển khoản khác với nhân sự ghi nhận đã thực nhận. Hình tổng thể không đủ để kết luận đã tích hợp thanh toán tự động.

### 2.3.3. Nhóm nhân viên chăm sóc

Nhân viên chăm sóc xem lịch làm việc, tiếp nhận thú cưng, thực hiện và cập nhật tình trạng dịch vụ. Các use case này liên hệ YC-08: người thao tác phải là người được phân công, lịch sẵn sàng và chi tiết chuyển trạng thái hợp lệ. Việc bắt đầu lịch kiểm tra ngày theo giờ Việt Nam và khả năng ca vẫn bao phủ phân công.

Khi thú cưng chưa đủ điều kiện trước lúc bắt đầu, nhân viên ghi nhận để tiếp nhận xử lý. Quyền báo vấn đề không đồng nghĩa được tự duyệt hoàn hoặc tự hủy lịch đã làm dở. Ranh giới trách nhiệm này giúp tránh ghép các bước có quyền khác nhau thành một thao tác của nhân viên.

### 2.3.4. Nhóm lễ tân và quản lý

Lễ tân phụ trách tiếp nhận và điều phối, đặt lịch hộ, lập hóa đơn, ghi nhận thu, tiếp nhận khiếu nại và thực chi theo quyết định hợp lệ. Quản lý có thêm quyền danh mục, ca, báo cáo và quyết định khiếu nại. Việc sơ đồ biểu diễn quan hệ giữa hai tác nhân không thay thế kiểm tra cụ thể của `requireReception` và `requireManager`.

Đặc biệt, xử lý khiếu nại được chia thành tiếp nhận, quyết định và chi hoàn. Quản lý duyệt hạn mức không tạo ra bằng chứng khách đã nhận tiền; nhân sự thực chi cần ghi nhận kết quả và chứng từ. Các bước này được phân tích tiếp ở Activity, Sequence và trạng thái.

### 2.3.5. Nhóm Admin

Use case đặc trưng của Admin là quản lý tài khoản và phân quyền, gồm cấp tài khoản nội bộ, mật khẩu tạm, khóa/mở và thay đổi thông tin/quyền trong phạm vi cho phép. Việc cấp hoặc reset mật khẩu liên quan yêu cầu đổi mật khẩu lần đầu và thu hồi phiên. Khi thay đổi tài khoản nhân viên, các ràng buộc lịch đang mở phải được xem xét theo guard hiện có.

Các trang nhật ký, cấu hình và sao lưu chưa có phần xử lý đầy đủ không được trình bày thành các use case đã hoàn thành. Mặt khác, quyền vận hành Admin hiện còn được cấp trong server cần được công bố đúng, thay vì sửa lời thuyết minh theo mô hình tách quyền chưa cài đặt.

### 2.3.6. Khung đặc tả use case tiêu biểu

Use case đặt lịch online được chọn để liên kết yêu cầu, dữ liệu và điều kiện giao dịch. Đặc tả dưới đây do nhóm biên soạn từ sơ đồ và mã hiện trạng; không nhận là một bảng đặc tả gốc đã được cơ sở kinh doanh phê duyệt.

**Bảng 2.5. Đặc tả ca sử dụng đặt lịch tiêu biểu**

| Thành phần | Nội dung |
|---|---|
| Mã/tên | UC-ĐL — Khách hàng đặt lịch dịch vụ; liên hệ YC-02, YC-03, YC-04, YC-10 |
| Tác nhân chính | Khách hàng đang được phép sử dụng tài khoản |
| Kích hoạt | Khách gửi yêu cầu đặt lịch với thú cưng, dịch vụ, ngày/giờ và thông tin cần thiết |
| Điều kiện trước | Đã xác thực và đổi mật khẩu tạm nếu bắt buộc; thú cưng đang theo dõi thuộc khách; có dịch vụ hợp lệ |
| Luồng chính | 1. Xem/chọn hồ sơ và dịch vụ. 2. Tra giờ khả dụng. 3. Gửi yêu cầu. 4. Server xác thực đầu vào, lấy khóa ngày trong transaction. 5. Đọc lại hồ sơ, dịch vụ, thời lượng và nguồn lực. 6. Kiểm tra khả thi. 7. Ghi lịch `ChoXacNhan`, chi tiết và snapshot cọc nếu áp dụng; tạo thông báo. 8. Commit và trả kết quả |
| Điều kiện sau thành công | Có lịch cùng các chi tiết; giá được lấy tại server; chưa tự gán nhân viên; chính sách cọc được ghi theo điều kiện áp dụng |
| Thay thế | Đặt tại quầy dùng tác nhân tiếp nhận và luồng nhận diện/tạo khách, thú cưng; không giả làm khách trên API online |
| Ngoại lệ dữ liệu/quyền | Sai ngày/giờ, trùng dịch vụ, dịch vụ ngừng bán hoặc hồ sơ sai chủ → từ chối với lỗi phù hợp |
| Ngoại lệ nguồn lực | Không còn chỗ → xung đột; hết ngân sách solver → lỗi có thể thử lại; không nhận lịch để vượt qua kiểm tra |
| Ngoại lệ giao dịch | Lỗi sau một bước ghi → rollback toàn bộ phần thay đổi trong transaction |
| API/đối chiếu | `GET /api/lich-hen/khung-gio-trong`, `POST /api/lich-hen`; AD-02, SD-02 và `services/booking.js` |

*Nguồn: nhóm đặc tả từ UC-01, AD-02, SD-02 và mã Thế Giới Thú Cưng; các bước kiểm soát hiện tại có thể chi tiết hơn hình gốc.*

## 2.4. Thiết kế sơ đồ hoạt động

### 2.4.1. Đăng ký tài khoản

Activity đăng ký trình bày luồng từ nhập thông tin đến kiểm tra, ghi nhận và phản hồi cho người đăng ký. Việc tách hoạt động phía người dùng và phía hệ thống giúp xác định nơi phát sinh dữ liệu, nơi quyết định hợp lệ và nhánh người dùng cần sửa thông tin.

![AD-01 — Đăng ký tài khoản](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - ĐĂNG KÝ TÀI KHOẢN.png>)

**Hình 2.2. Đăng ký tài khoản**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-01; giữ nguyên ảnh gốc.*

Trong cài đặt, kiểm tra tài khoản/liên hệ và băm mật khẩu phải hoàn tất theo quy tắc trước khi tạo hồ sơ. Trường hợp dữ liệu trùng hoặc không hợp lệ được trả về thay vì tiếp tục luồng thành công. Hình không thể hiện hết giới hạn chuỗi, giới hạn byte mật khẩu hoặc khóa chống tạo trùng; các chi tiết đó được đối chiếu từ controller và validation. Không đưa mật khẩu gốc vào hồ sơ hoặc xem thao tác băm là giải mã mật khẩu.

### 2.4.2. Đặt lịch dịch vụ

Activity đặt lịch kết nối việc nhận diện khách/thú cưng, chọn dịch vụ và giờ, kiểm tra điều kiện và lưu yêu cầu. Hai kênh online và tại quầy cùng tạo ra lịch chờ xử lý, nhưng khác tác nhân và khả năng tạo thông tin khách mới. Cả hai đều cần tuân thủ quy tắc nguồn lực, không để kênh tại quầy bỏ qua kiểm tra.

![AD-02 — Đặt lịch online/tại quầy](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - ĐẶT LỊCH DỊCH VỤ_02.png>)

**Hình 2.3. Đặt lịch online/tại quầy**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-02; giữ nguyên ảnh gốc.*

Phần kiểm tra giờ trống trên hình được thuyết minh theo toàn khoảng thời lượng trong mã hiện tại. Ngoài ra, transaction tạo lịch còn ghi các chi tiết, snapshot cọc nếu áp dụng và thông báo liên quan. Lấy khóa ngày trước khi đọc công suất là biện pháp kiểm soát đồng thời chưa thể hiện trong ảnh. Những bổ sung này được mô tả bằng văn bản và mục 2.11, không gán thêm nút hoạt động vào hình gốc.

### 2.4.3. Quản lý lịch hẹn và phân công

Activity điều phối thể hiện việc nhân sự tiếp nhận xem lịch và đưa ra hướng xử lý. Điểm quyết định quan trọng là tiếp tục giữ chờ, từ chối hoặc chọn người phù hợp để xác nhận. Phân công phải gắn với ca và các lịch đang chiếm nguồn lực, đồng thời không làm các lịch chờ khác trở nên không thể bố trí.

![AD-03 — Điều phối và phân công](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png>)

**Hình 2.4. Điều phối và phân công**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-03; giữ nguyên ảnh gốc.*

Mã hiện tại nhận đúng một giá trị `hanhDong`: `phan-cong`, `giu-cho` hoặc `tu-choi`. Giữ chờ tiếp tục `ChoXacNhan`; phân công thành công chuyển `DaXacNhan`; từ chối chuyển `TuChoi`. Nhãn “Đã hủy” ở nhánh từ chối trong hình không phải trạng thái dùng cho thao tác từ chối hiện tại. Sự khác nhau cần giữ rõ vì hủy lịch và từ chối tiếp nhận có ý nghĩa nghiệp vụ, lịch sử và xử lý cọc khác nhau.

### 2.4.4. Thực hiện dịch vụ

Activity chăm sóc bắt đầu từ lịch được giao, việc tiếp nhận và xem xét điều kiện phục vụ, sau đó cập nhật quá trình thực hiện và hoàn tất. Thông tin cần lưu gồm tiến độ từng dịch vụ và ghi chú của người thực hiện; kết quả kiểm tra điều kiện phải được chuyển tới người tiếp nhận khi cần xử lý lịch.

![AD-04 — Tiếp nhận và chăm sóc](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - THỰC HIỆN DỊCH VỤ.png>)

**Hình 2.5. Tiếp nhận và chăm sóc**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-04; giữ nguyên ảnh gốc.*

Hiện trạng phân biệt báo không đủ điều kiện trước bắt đầu với hủy hoặc đổi lịch do nhân sự có quyền xử lý. Báo vấn đề chưa tự chuyển lịch sang `DaHuy`. Khi đang thực hiện, mỗi chi tiết đi từ chờ đến đang làm rồi hoàn thành; chỉ khi tất cả chi tiết hoàn thành mới kết thúc lịch. Nhánh hủy/hoãn trên hình vì vậy không được hiểu là quyền tự hủy dịch vụ đang làm dở; phần quyết toán trường hợp đó còn là giới hạn của dự án.

### 2.4.5. Lập hóa đơn và ghi nhận thanh toán

Activity hóa đơn mô tả việc lấy dữ liệu phục vụ, tính tổng/giảm và ghi nhận tiền. Thiết kế cần giữ riêng quyết định lập hóa đơn với từng lần thu, bởi khách có thể còn nợ sau một lần thanh toán. Các phản hồi cần giúp nhân sự biết số tiền được ghi nhận và phần còn phải trả.

![AD-05 — Lập hóa đơn và thu](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png>)

**Hình 2.6. Lập hóa đơn và thu**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-05; giữ nguyên ảnh gốc.*

Mã hiện tại bổ sung khấu trừ cọc và phân biệt số tiền thu với tiền khách đưa/tiền thừa. Hóa đơn giữ tên, giá và số lượng tại thời điểm lập; thay đổi danh mục không sửa lịch sử đó. Cụm hóa đơn điện tử hoặc chức năng in trong thiết kế không chứng minh đã tích hợp hóa đơn thuế. Tương tự, hiển thị QR/hướng dẫn chuyển khoản hỗ trợ thanh toán nhưng không tự xác nhận tiền ngân hàng đã đến; nhân sự xác nhận thực nhận theo luồng được cài đặt.

### 2.4.6. Xử lý khiếu nại và hoàn tiền

Activity khiếu nại tách các lane khách hàng, lễ tân, hệ thống và quản lý. Luồng đi từ tiếp nhận vấn đề, xem xét, lựa chọn phương án đến thông báo kết quả. Trường hợp hoàn tiền có thêm kiểm tra số tiền và bước thực hiện chi cho khách.

![AD-06 — Tiếp nhận, quyết định và chi hoàn](<D:/dich_vu_thu_cung/Sơ đồ hoạt động/SƠ ĐỒ HOẠT ĐỘNG - XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png>)

**Hình 2.7. Tiếp nhận, quyết định và chi hoàn**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã AD-06; giữ nguyên ảnh gốc.*

Sai khác đáng chú ý là hình tạo giao dịch và đổi hóa đơn sang “Đã hoàn tiền” ngay sau duyệt, trước khi lễ tân thực chi. Trong mã, duyệt chỉ giữ hạn mức và chuyển khiếu nại sang `ChoHoanTien`. Thực chi thành công mới ghi dòng tiền thành công, đổi trạng thái hóa đơn phù hợp hoàn một phần/toàn bộ và kết thúc khiếu nại; chi thất bại tiếp tục chờ. Nhãn “Chờ xử lý”/“Đã từ chối” trong hình cũng cần đối chiếu với trạng thái `DaTiepNhan`, `DaXuLy` và cột quyết định riêng.

## 2.5. Thiết kế sơ đồ tuần tự

### 2.5.1. Đăng nhập

Sequence đăng nhập làm rõ thứ tự gửi thông tin từ giao diện, kiểm tra dữ liệu tài khoản và phản hồi theo nhánh thành công/thất bại. Các lifeline giao diện, điều khiển và thực thể là các thành phần của mô hình thiết kế, không mặc nhiên là tên file, lớp lập trình hoặc đường dẫn API.

![SD-01 — Tương tác đăng nhập](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – ĐĂNG NHẬP.png>)

**Hình 2.8. Tương tác đăng nhập**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-01; giữ nguyên ảnh gốc.*

Hiện trạng bổ sung access token, refresh token, mục đích token, phiên bản phiên và kiểm tra tài khoản còn hoạt động. Khi dùng mật khẩu tạm, người dùng phải đổi trước nghiệp vụ. Những điều kiện này chi tiết hơn khái niệm tạo phiên trên hình; không thể chỉ dựa vào nhánh mật khẩu đúng để kết luận đã được phép sử dụng mọi chức năng.

### 2.5.2. Đặt lịch dịch vụ

Sequence đặt lịch thể hiện tương tác chọn khách/thú cưng, dịch vụ, giờ và ghi lịch cùng các chi tiết. Phần tùy chọn tại quầy và vòng lặp dịch vụ cho thấy một lịch có thể gắn nhiều dữ liệu đầu vào. API triển khai được xác định từ routes, không được đặt tên theo cách viết message trên hình.

![SD-02 — Tương tác đặt lịch](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – ĐẶT LỊCH DỊCH VỤ.png>)

**Hình 2.9. Tương tác đặt lịch**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-02; giữ nguyên ảnh gốc.*

Điều kiện so số lịch với số nhân viên trực ca trong hình không tương đương cơ chế hiện hành. Mã xét ca bao trọn, các khoảng giao nhau, lịch đã phân công và lịch chưa gán; sau đó tìm xem có cách bố trí toàn khoảng hay không. Transaction còn lấy khóa ngày, đọc lại dữ liệu và kiểm thời điểm chưa qua trước khi ghi. Phần giải thích này chỉ ra sự tiến triển của thiết kế, không nhận rằng các message đếm chỗ trong hình đã thể hiện thuật toán quay lui.

### 2.5.3. Quản lý lịch hẹn và phân công

Sequence điều phối mô tả việc lấy thông tin lịch, xem nguồn lực và gửi quyết định xử lý. Người tiếp nhận phải sử dụng dữ liệu còn hiệu lực; trong thời gian giao diện mở, một yêu cầu khác có thể đã thay đổi lịch. Vì vậy, server khóa và kiểm tra lại trạng thái trước khi chấp nhận quyết định.

![SD-03 — Tương tác điều phối](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – QUẢN LÝ LỊCH HẸN VÀ PHÂN CÔNG NHÂN VIÊN.png>)

**Hình 2.10. Tương tác điều phối**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-03; giữ nguyên ảnh gốc.*

Hình có nhánh tùy chọn từ chối và phần phân công tiếp theo; khi vận dụng phải phân biệt ba lựa chọn loại trừ của mã. Sau từ chối không tiếp tục phân công trong cùng lần xử lý. Hai quyết định cạnh tranh trên một lịch không được cùng thành công nếu quyết định trước đã làm thay đổi trạng thái. `TuChoi` là giá trị hiện tại của từ chối, khác `DaHuy` xuất hiện trong hình.

### 2.5.4. Thực hiện dịch vụ

Sequence chăm sóc mô tả trao đổi khi tiếp nhận, bắt đầu, ghi tiến độ và hoàn tất. Mỗi thay đổi cần liên kết đúng lịch và chi tiết dịch vụ; cập nhật chi tiết không thuộc lịch hoặc cập nhật bởi người không được giao phải bị từ chối.

![SD-04 — Tương tác chăm sóc](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – THỰC HIỆN DỊCH VỤ.png>)

**Hình 2.11. Tương tác chăm sóc**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-04; giữ nguyên ảnh gốc.*

Khối lễ tân hủy được đặt sau khối lựa chọn trong ảnh có thể gây hiểu nhầm rằng hủy là bước tiếp theo sau hoàn thành. Mã hiện tại chỉ cho hủy lịch còn chờ hoặc đã xác nhận, không cho `HoanThanh` hay `DangThucHien` đi qua API hủy đó. Do vậy, nhánh xử lý không đủ điều kiện trước lúc bắt đầu là tình huống riêng; thứ tự vẽ không được dùng để hợp thức hóa một chuyển trạng thái mà server chặn.

### 2.5.5. Lập hóa đơn và ghi nhận thanh toán

Sequence hóa đơn diễn tả việc tạo các dòng dịch vụ, tính thành tiền và tiếp nhận lần thanh toán. Các vòng lặp trên hình hỗ trợ hiểu cấu trúc chi tiết, còn ràng buộc tiền phải lấy từ quy tắc tài chính thực tế. Một hóa đơn không được tạo trùng cho cùng lịch chỉ vì người dùng gửi lại yêu cầu.

![SD-05 — Tương tác hóa đơn và thu](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – LẬP HÓA ĐƠN VÀ GHI NHẬN THANH TOÁN.png>)

**Hình 2.12. Tương tác hóa đơn và thu**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-05; giữ nguyên ảnh gốc.*

Mã không mặc định lấy toàn bộ tiền khách đưa làm số tiền thu. Số ghi nhận phải dương và không vượt nợ còn lại sau khoản cọc đã áp dụng; tiền mặt có thể kèm tiền thừa. Mỗi lần thu có khóa chống lặp và được xử lý dưới khóa hóa đơn. Những điều kiện này khác việc chỉ lặp thu đến khi đủ trên giao diện, vì quyết định cuối phải nhất quán ngay khi nhiều yêu cầu đến đồng thời.

### 2.5.6. Xử lý khiếu nại và hoàn tiền

Sequence khiếu nại chia ba phần lớn: tiếp nhận, quản lý quyết định và lễ tân thực chi. Các lifeline khiếu nại, hóa đơn và thanh toán cho thấy giao dịch hoàn liên hệ nhiều đối tượng. Đây là lý do cần giữ ranh giới giữa quyết định và tiền thực chi.

![SD-06 — Tương tác khiếu nại và hoàn](<D:/dich_vu_thu_cung/Sơ đồ tuần tự/SƠ ĐỒ TUẦN TỰ – XỬ LÝ KHIẾU NẠI VÀ HOÀN TIỀN.png>)

**Hình 2.13. Tương tác khiếu nại và hoàn**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SD-06; giữ nguyên ảnh gốc.*

Các message 18–22 trên ảnh tạo giao dịch, cập nhật `DaHoanTien` và `DaXuLy` ngay trong nhánh duyệt. Hiện trạng giữ `ChoHoanTien` sau duyệt và chỉ ghi thành công khi thực chi được xác nhận. Hạn mức còn phải trừ các lần hoàn thành công và khoản đã duyệt đang chờ, không chỉ so với tổng đã thu ban đầu. Bản ghi chi thất bại được lưu theo quy tắc nhưng không giảm tiền; gửi lại cùng nội dung có thể nhận kết quả đã ghi trước đó thay vì tạo lần chi mới.

## 2.6. Thiết kế sơ đồ lớp

### 2.6.1. Nhóm lớp, thuộc tính và phương thức

Sơ đồ lớp tập hợp các khái niệm miền như `NguoiDung`, `KhachHang`, `NhanVien`, `ThuCung`, `LoaiDV`, `DichVu`, `LichHen`, `ChiTietLichHen`, `CaLamViec`, `HoaDon`, `ChiTietHoaDon`, `ThanhToan`, `DanhGia` và `KhieuNai`. Thuộc tính thể hiện thông tin cần quản lý; phương thức thể hiện trách nhiệm dự kiến của đối tượng trong mô hình.

![CD-01 — Mô hình lớp miền](<D:/dich_vu_thu_cung/Sơ đồ trạng thái_sơ đồ class/SƠ ĐỒ LỚP HỆ THỐNG.png>)

**Hình 2.14. Mô hình lớp miền**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã CD-01; giữ nguyên ảnh gốc.*

Ví dụ, lịch giữ thời điểm, trạng thái và các trách nhiệm tạo/cập nhật/phân công; hóa đơn tập hợp số tiền và xử lý liên quan. Những phương thức này không phải danh sách tên hàm đã được cài đặt nguyên dạng. Mã backend tổ chức theo các hàm ES module, controller/service và SQL trực tiếp; báo cáo đọc hình như mô hình miền để tránh đánh đồng ký pháp lớp với kiến trúc lập trình thực tế.

### 2.6.2. Quan hệ và bội số

Hình thể hiện `KhachHang` và `NhanVien` chuyên biệt hóa từ `NguoiDung`; Admin được giải thích bằng vai trò tài khoản, còn ba chức vụ nghiệp vụ thuộc nhân viên. Một khách sở hữu nhiều thú cưng; một thú cưng có thể có nhiều lịch; lịch có thể chưa có nhân viên phụ trách trước phân công. Đây là các quan hệ phù hợp với việc tách hồ sơ và lịch sử phục vụ.

Lịch và hóa đơn có các dòng chi tiết để biểu diễn nhiều dịch vụ; một lịch có thể chưa có hóa đơn và hóa đơn có nhiều giao dịch. Bội số tối thiểu trên hình là ý định nghiệp vụ. Khóa ngoại trong DB không tự bảo đảm một lịch luôn có ít nhất một dòng chi tiết; điều kiện đó còn được bảo vệ bởi luồng tạo trong service và transaction. Quan hệ trên hình cũng không đủ để suy ra mọi chính sách xóa dữ liệu.

### 2.6.3. Ánh xạ sang dữ liệu và module

Các khái niệm lõi được ánh xạ sang những bảng tương ứng: tài khoản/hồ sơ, thú cưng, danh mục, lịch/chi tiết, hóa đơn/chi tiết và thanh toán. Sự kế thừa trong mô hình được triển khai bằng bảng hồ sơ khách/nhân viên dùng khóa vừa là PK vừa tham chiếu tài khoản. Các hành vi được phân bổ sang nhóm auth, booking, dispatch, care, invoices và complaints theo trách nhiệm.

Sơ đồ chưa bao phủ toàn bộ các mở rộng hiện hành như nhật ký lịch, thông báo, cọc, intent thanh toán và token khôi phục mật khẩu. Vì vậy, không dùng số lớp trong ảnh làm số bảng hiện tại. Phần dữ liệu ở mục 2.9 bổ sung danh sách từ DDL 000–008, đồng thời giữ hình lớp gốc để người đọc phân biệt mô hình thiết kế lõi với schema đã mở rộng.

## 2.7. Thiết kế sơ đồ trạng thái

### 2.7.1. Vòng đời lịch hẹn

Sơ đồ trạng thái lịch mô tả các giai đoạn chờ xác nhận, đã xác nhận, đang thực hiện và hoàn thành, cùng các nhánh hủy. Ý nghĩa của trạng thái cần gắn với sự kiện và điều kiện, thay vì chỉ đổi một nhãn hiển thị trên giao diện.

![SM-01 — Trạng thái lịch hẹn](<D:/dich_vu_thu_cung/Sơ đồ trạng thái_sơ đồ class/Sơ đồ trạng thái_01.png>)

**Hình 2.15. Trạng thái lịch hẹn**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SM-01; giữ nguyên ảnh gốc.*

Trong hiện trạng, phân công hợp lệ đưa lịch chờ sang `DaXacNhan`; nhân viên bắt đầu chuyển `DangThucHien`; hoàn tất mọi chi tiết mới chuyển `HoanThanh`. API hủy chỉ nhận `ChoXacNhan` hoặc `DaXacNhan`. Hình còn thiếu `TuChoi` và có đường `DangThucHien` sang `DaHuy` chưa được API hủy hỗ trợ. Nhãn hủy/hoãn trên hình cũng không mô tả chính xác việc đổi giờ hiện tại: đổi giờ hợp lệ đưa lịch về chờ và bỏ phân công để điều phối lại.

### 2.7.2. Vòng đời hóa đơn

Sơ đồ hóa đơn thể hiện chưa thu, thu một phần, thu đủ, đã hoàn và hủy. Đối tượng này theo dõi nghĩa vụ tiền, khác trạng thái hoàn thành chăm sóc. Quy tắc chuyển cần xét các giao dịch thành công và khoản cọc đã áp dụng, không dựa vào tổng tiền khách vừa nhập ở một màn hình.

![SM-02 — Trạng thái hóa đơn](<D:/dich_vu_thu_cung/Sơ đồ trạng thái_sơ đồ class/Sơ đồ trạng thái.png>)

**Hình 2.16. Trạng thái hóa đơn**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã SM-02; giữ nguyên ảnh gốc.*

Hiện trạng bổ sung `HoanTienMotPhan`. Duyệt hoàn chưa đổi hóa đơn thành đã hoàn; thực chi thành công mới cập nhật theo số đã hoàn. Khi giá trị cần trả bằng không hoặc cọc đã đủ điều kiện áp dụng, khởi tạo hóa đơn có thể đã tất toán theo service, không phải mọi hóa đơn đều bắt đầu ở `ChuaThanhToan`. Trạng thái `DaHuy` có trong thiết kế/miền dữ liệu không tự chứng minh đã có một API hủy hóa đơn tương ứng.

### 2.7.3. Ánh xạ trạng thái thiết kế và triển khai

Các đối tượng có vòng đời riêng cần được đọc độc lập. Trạng thái `Unpaid` của cọc không được thêm thành trạng thái lịch; quyết định `TuChoi` của khiếu nại cũng khác trạng thái kết thúc `DaXuLy`. Bảng 2.6 bổ sung điều kiện hiện tại bằng văn bản, không sửa nội dung hai PNG.

**Bảng 2.6. Đối chiếu trạng thái và điều kiện chuyển**

| Đối tượng | Sự kiện và chuyển trạng thái hiện tại | Điều kiện/chuyển bị chặn | Khác biệt hình gốc |
|---|---|---|---|
| Lịch chờ | Giữ chờ: giữ `ChoXacNhan`; phân công: sang `DaXacNhan`; từ chối: sang `TuChoi` | Một quyết định/lần; phân công cần đủ ca, công suất và cọc khi áp dụng | Hình thiếu `TuChoi`, một số nhánh từ chối ghi hủy |
| Lịch phục vụ | `DaXacNhan` → `DangThucHien` → `HoanThanh` | Đúng người/ngày, không có vấn đề đang chờ; mọi chi tiết hoàn tất trước lịch | Không dùng đường đang làm → hủy trên hình như hành vi đã hỗ trợ |
| Lịch hủy/đổi | Chờ hoặc xác nhận → `DaHuy`; đổi giờ hợp lệ → `ChoXacNhan`, bỏ người cũ | Không hủy/đổi lịch đang làm hoặc đã hoàn thành qua các API này | Hoãn không đồng nghĩa đổi sang `DaHuy` |
| Chi tiết chăm sóc | `ChoThucHien` → `DangThucHien` → `HoanThanh`; hủy lịch có thể hủy chi tiết | Không bỏ qua trạng thái hoặc cập nhật dịch vụ ngoài lịch | Chi tiết là vòng đời riêng với lịch |
| Hóa đơn | Chưa thu/thu một phần → thu đủ; sau thực chi → `HoanTienMotPhan`/`DaHoanTien` | Không thu vượt nợ; hoàn không tự mở lại công nợ | Thiếu hoàn một phần và trường hợp tất toán từ cọc/giá trị 0 |
| Khiếu nại | `DaTiepNhan` → `ChoHoanTien` nếu duyệt hoàn; quyết định khác → `DaXuLy`; chi thành công → `DaXuLy` | Chi thất bại giữ chờ; duyệt chưa ghi dòng tiền thành công | Tách cột quyết định khỏi trạng thái; hình ghi hoàn quá sớm |
| Cọc | `Unpaid`, `Paid`, `Applied`, `RefundPending`, `Refunded`, `Forfeited`, `Cancelled` theo sự kiện | Thu, áp dụng, hủy/đổi và chi hoàn theo snapshot chính sách | Không có sơ đồ cọc riêng trong bộ hình gốc |

*Nguồn: nhóm đối chiếu SM-01/SM-02, CHECK trong SQL và guards của dispatch/care/invoices/complaints/depositStore. Danh sách giá trị không có nghĩa được phép chuyển tùy ý giữa mọi cặp trạng thái.*

## 2.8. Thiết kế sơ đồ màn hình và điều hướng giao diện

### 2.8.1. Cây màn hình tổng thể

Cây màn hình phân nhóm giao diện chung, khách hàng, nhân viên, lễ tân/quản lý và Admin. Mục đích là cho thấy cách tổ chức các khu vực sử dụng, giúp liên hệ tác nhân với điểm bắt đầu thao tác. Đây là sơ đồ thiết kế giao diện, không phải một loại UML chuẩn được thêm vào đặc tả.

![MH-TQ — Cây phân nhóm màn hình](<D:/dich_vu_thu_cung/So do man hinh/Sơ ĐỒ MÀN HÌNH CHÍNH.png>)

**Hình 2.17. Cây phân nhóm màn hình**

*Nguồn: bộ sơ đồ thiết kế Thế Giới Thú Cưng được cung cấp, mã MH-TQ; giữ nguyên ảnh gốc.*

Hình có các nhóm bảng giá, hồ sơ, đặt/xem lịch, chăm sóc, điều phối, hóa đơn, báo cáo và quản trị tài khoản. Cây chưa thể hiện mọi trang mới hoặc mọi đường dẫn qua lại. Việc gộp lễ tân/quản lý trong một nhánh không cho phép lễ tân xem báo cáo hoặc duyệt hoàn khi server chỉ cấp cho quản lý/Admin.

### 2.8.2. Wireframe và luồng màn hình tiêu biểu

Bộ thiết kế có ba file Markdown wireframe. File thứ nhất mô tả MH-01 đăng nhập/đăng ký, MH-02 đặt lịch, MH-03 danh sách lịch và MH-11 hồ sơ thú cưng. File thứ hai gồm MH-04 chăm sóc, MH-05 điều phối, MH-02b tại quầy và MH-06 hóa đơn. File thứ ba gồm MH-07 báo cáo, MH-09 ca, MH-10 khiếu nại và MH-08 tài khoản.

Các mẫu giúp phân biệt vùng nhập, danh sách, trạng thái và hành động theo ngữ cảnh. Chẳng hạn đặt lịch cần đi từ hồ sơ/dịch vụ tới giờ, còn hóa đơn phải được lập trước khi thu theo luồng của màn hình. Số tiền, tên và biểu đồ trong wireframe là dữ liệu minh họa thiết kế, không phải số liệu đo hoặc doanh thu thật. Ảnh giao diện cài đặt và tình trạng QA được dành cho Chương 3.

### 2.8.3. Ánh xạ màn hình sang route và quyền

Frontend sử dụng HashRouter; đường dẫn trong Bảng 2.7 là phần sau dấu `#`. `App.jsx` và thành phần kiểm quyền xác định vùng giao diện theo nhóm, còn dữ liệu cuối cùng vẫn được server bảo vệ. Thiết kế component và state tham khảo mô hình của React [24]; cấu trúc màn hình cụ thể là lựa chọn của Thế Giới Thú Cưng.

**Bảng 2.7. Ánh xạ màn hình, route và quyền**

| Màn hình/nhóm | Route | Nhóm truy cập và dữ liệu | Giới hạn cần phân biệt |
|---|---|---|---|
| MH-01 | `/dang-nhap` | Công khai, hai tab đăng nhập/đăng ký | Đăng ký mới là khách; không tự chọn quyền nội bộ |
| Khôi phục/đổi mật khẩu | `/quen-mat-khau`, `/dat-lai-mat-khau`, `/doi-mat-khau` | Khôi phục công khai theo token; đổi tạm theo phiên | Có route không chứng minh SMTP bên ngoài đã nghiệm thu |
| Bảng giá | `/bang-gia` | Công khai | Chỉ quản lý/Admin sửa danh mục qua luồng quản trị |
| Tổng quan/hồ sơ cá nhân | `/tong-quan`, `/thong-tin-ca-nhan` | Khách hàng trong vùng giao diện khách | Trang mới không hiện đầy đủ trên cây gốc |
| MH-11 | `/ho-so-thu-cung` | Khách và hồ sơ thuộc mình | Nhận diện chủ được kiểm ở API |
| MH-02, MH-03 | `/dat-lich`, `/lich-hen` | Khách đặt và theo dõi lịch của mình | Giờ đã tải có thể hết trước lúc ghi |
| MH-02b, MH-05 | `/le-tan/dat-lich-tai-quay`, `/le-tan/lich-hen` | Lễ tân/quản lý/Admin | Một quyết định điều phối hợp lệ tại một thời điểm |
| MH-04 | `/nhan-vien/lich-lam-viec` | Nhân viên chăm sóc, lịch được giao | Admin/quản lý không được dùng route này để làm thay |
| MH-06 | `/le-tan/hoa-don` | Lễ tân/quản lý/Admin | Lập/thu theo trạng thái và số nợ |
| Hóa đơn/khiếu nại cá nhân | `/hoa-don-cua-toi`, `/khieu-nai-cua-toi` | Khách, dữ liệu của mình | Quyết định/chi hoàn thuộc nhân sự có quyền |
| MH-10 | `/le-tan/khieu-nai` | Lễ tân/quản lý/Admin | Nút và API quyết định chỉ quản lý/Admin |
| MH-09, MH-07 | `/quan-ly/ca-lam-viec`, `/quan-ly/bao-cao` | Quản lý/Admin | Quyền gộp trên cây không thay guard riêng |
| Danh mục quản lý | `/quan-ly/dich-vu` | Quản lý/Admin | Thay giá hiện hành không đổi hóa đơn cũ |
| MH-08 | `/admin/tai-khoan` | Admin | KPI/lọc mới có phạm vi kiểm tra riêng |
| Trang Admin bổ trợ | `/admin/nhat-ky`, `/admin/cau-hinh`, `/admin/sao-luu` | Admin | Có fallback/mô phỏng; chưa có backend tương ứng đầy đủ |
| Trang in | `/le-tan/hoa-don/:id/in`, `/le-tan/khieu-nai/:id/in` | Khách đúng dữ liệu hoặc tiếp nhận/quản lý/Admin | Quyền đọc/nguồn dữ liệu vẫn kiểm tại API; chưa là tích hợp hóa đơn thuế |

*Nguồn: nhóm đối chiếu `frontend/src/App.jsx`, HashRouter và các bộ kiểm quyền. Mã màn hình lấy từ wireframe, các trang mở rộng giữ tên chức năng thay vì tự cấp mã gốc.*

Các route gốc `/admin`, `/quan-ly`, `/le-tan`, `/nhan-vien` hiện còn dùng trang giữ chỗ theo vai trò. Không dùng sự tồn tại route để kết luận đã có dashboard hoàn chỉnh cho từng nhóm. Các chức năng nghiệp vụ cụ thể nằm ở các đường dẫn con đã xác định.

### 2.8.4. Trạng thái tương tác và hiển thị lỗi

Giao diện cần biểu diễn đang tải, dữ liệu rỗng, lỗi nhập, thiếu quyền và hết phiên theo bối cảnh thao tác. Khi đổi dịch vụ hoặc thời lượng, danh sách giờ cần được xem lại để không tiếp tục dùng một lựa chọn không còn phù hợp. Khi gửi yêu cầu cập nhật, cần tránh để phản hồi cũ ghi đè lựa chọn hoặc dữ liệu mới hơn.

Đây là yêu cầu thiết kế tương tác, không phải tuyên bố mọi màn hình đã được kiểm trên mọi kích thước. Một số cải tiến gần đây như khiếu nại và Admin vẫn có giới hạn QA được ghi trong tiến độ. Chương 3 sẽ dẫn ảnh và biên bản theo đúng mốc, tách dữ liệu demo khỏi bằng chứng vận hành thực tế.

## 2.9. Thiết kế cơ sở dữ liệu PostgreSQL

### 2.9.1. Nguồn schema và quản lý phiên bản

Nguồn schema là `thu_cung.sql` và các migration vật lý từ 001 đến 008. Công cụ DB ánh xạ file gốc thành version logic `000`; không có một file `migrations/000*.sql` riêng trong bộ nguồn được kiểm tra. Các lần mở rộng thêm phiên, ca/chăm sóc, tài chính, khiếu nại, thanh toán mô phỏng, cọc và khôi phục mật khẩu cần được xem cùng nhau để hiểu mô hình hiện tại.

Bảng kỹ thuật lưu version, tên và checksum migration đã áp dụng. DDL cùng bản ghi lịch sử được xử lý trong transaction của công cụ quản lý phiên bản; không sửa lại migration đã có checksum để làm báo cáo khớp một lược đồ cũ. Phân tích trong chương này dựa trên file nguồn và hồ sơ đã khảo sát, không phải truy vấn mới tới cơ sở dữ liệu đang vận hành. Số 16 bảng nghiệp vụ trong phần lõi kế hoạch cũ không đại diện toàn bộ schema sau 008.

### 2.9.2. Nhóm bảng và mô hình quan hệ

Đối chiếu nguồn DDL nhận diện 21 bảng ứng dụng và một bảng lịch sử migration do công cụ DB tạo. Quan hệ trung tâm đi từ tài khoản sang hồ sơ, từ khách sang thú cưng và lịch; lịch liên kết các dòng dịch vụ, tiến độ, hóa đơn, đánh giá và khiếu nại. Các bảng cọc/intent/reset là phần mở rộng so với hình lớp miền.

<!-- CHEN_HINH_2_18: Mô hình quan hệ dữ liệu Thế Giới Thú Cưng theo schema khảo sát; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 2.18. Mô hình quan hệ dữ liệu Thế Giới Thú Cưng theo schema khảo sát**

*Vị trí để trống — chưa có hình, tác giả tự chèn sau.*

**Bảng 2.8. Các bảng dữ liệu và trách nhiệm lưu trữ**

| Bảng | PK và liên kết chính | Version tạo/mở rộng tiêu biểu | Trách nhiệm |
|---|---|---|---|
| `nguoi_dung` | `ma_nguoi_dung` | 000, 001, 002 | Đăng nhập, liên hệ, vai trò, khóa tài khoản, phiên bản token và bắt đổi mật khẩu |
| `khach_hang` | `ma_khach_hang`, đồng thời FK tài khoản | 000, 001 | Hồ sơ khách, liên kết chủ nuôi |
| `nhan_vien` | `ma_nhan_vien`, đồng thời FK tài khoản | 000, 001 | Hồ sơ nhân sự, chức vụ và hoạt động |
| `thu_cung` | `ma_thu_cung`; FK khách | 000, 001 | Hồ sơ chó/mèo và thông tin hỗ trợ tiếp nhận |
| `loai_dv` | `ma_loai_dv` | 000 | Nhóm danh mục dịch vụ |
| `dich_vu` | `ma_dv`; FK loại dịch vụ | 000, 001 | Tên, giá hiện hành, thời lượng, trạng thái cung cấp |
| `lich_hen` | `ma_lich_hen`; FK thú cưng, nhân viên tùy chọn | 000, 001, 003 | Khoảng phục vụ, phân công, trạng thái và vấn đề chờ xử lý |
| `chi_tiet_lich_hen` | `ma_chi_tiet_lich_hen`; FK lịch, dịch vụ | 000 | Dịch vụ đặt, số lượng, giá dự kiến, tiến độ/ghi chú |
| `danh_gia` | `ma_danh_gia`; FK lịch duy nhất | 000 | Sao, nhận xét và thời điểm đánh giá |
| `hoa_don` | `ma_hoa_don`; FK lịch duy nhất, người lập | 000, 004, 005, 007 | Tổng/giảm/thành tiền, trạng thái và cọc đã áp dụng |
| `chi_tiet_hoa_don` | `ma_chi_tiet_hoa_don`; FK hóa đơn, dịch vụ | 000 | Tên/giá/số lượng/thành tiền được lưu theo hóa đơn |
| `thanh_toan` | `ma_thanh_toan`; FK hóa đơn, người ghi, khiếu nại khi hoàn | 000, 001, 004, 005, 006 | Lần thu/chi hoàn, kết quả, chống lặp, tiền đưa/thừa và chứng từ |
| `ca_lam_viec` | `ma_ca_lam_viec`; FK nhân viên | 001, 003 | Ca ngày/giờ, ghi chú, trạng thái hoạt động/hủy mềm |
| `khieu_nai` | `ma_khieu_nai`; FK lịch/hóa đơn, người tiếp nhận/duyệt/chi; người xử lý có liên kết nhân viên | 001, 005 | Nội dung, quyết định, hạn mức hoàn, trạng thái thực chi và lỗi |
| `thong_bao` | `ma_thong_bao`; FK người nhận, lịch | 001 | Tin trong ứng dụng và trạng thái đã đọc |
| `nhat_ky_lich_hen` | `ma_nhat_ky`; FK lịch, người thực hiện | 003 | Hành động, trạng thái trước/sau, ghi chú và thời điểm |
| `payment_intents` | `id`; FK hóa đơn, người tạo, giao dịch | 006 | Ý định thanh toán và sự kiện của sandbox; có `mode='sandbox'` |
| `booking_deposits` | `booking_id`, đồng thời FK lịch; FK hóa đơn/người quyết định | 007 | Chính sách/giá dự kiến/cọc được chốt, vòng đời và ngoại lệ |
| `deposit_transactions` | `id`; FK cọc và người thao tác | 007 | Thu/hoàn cọc, phương thức, chống lặp và dấu sandbox |
| `deposit_intents` | `id`; FK cọc và giao dịch cọc | 007 | Ý định thanh toán cọc, sự kiện và thời hạn |
| `password_reset_tokens` | `user_id`, đồng thời FK tài khoản | 008 | Hash token, snapshot phiên/email, thời hạn và tình trạng sử dụng |
| `petcare_schema_migrations` — kỹ thuật | `version` | DB tooling | Tên, checksum và thời điểm áp dụng migration |

*Nguồn: nhóm đối chiếu `thu_cung.sql`, migrations 001–008 và `backend/scripts/db-tooling.js`. Version trong bảng là nguồn DDL, không phải xác nhận schema của một DB đang chạy mới được truy vấn.*

Vị trí Hình 2.18 được dành cho ERD đầy đủ để tác giả tự chèn sau. Mermaid lõi trong kế hoạch là đầu mối tham khảo, chưa được thay thế bằng một hình mới trong giai đoạn này. Bảng dữ liệu tiếp tục cung cấp nội dung cần đọc khi vị trí hình còn trống.

### 2.9.3. Khóa, ràng buộc và chỉ mục

Khóa chính nhận diện bản ghi; khóa ngoại liên kết các đối tượng; các ràng buộc miền và duy nhất bảo vệ dữ liệu ngay tại DB theo chức năng PostgreSQL [23]. Trong Thế Giới Thú Cưng, cần phối hợp chúng với kiểm tra quyền và logic liên bảng ở service. Ví dụ, FK lịch–chi tiết không buộc lịch luôn có chi tiết, còn FK nhân viên không tự chứng minh ca của người đó bao trọn lịch.

**Bảng 2.9. Ràng buộc và chỉ mục bảo toàn dữ liệu**

| Ràng buộc/chỉ mục | Nơi áp dụng và nguồn | Dữ liệu được bảo vệ | Kiểm soát bổ sung |
|---|---|---|---|
| PK/FK hồ sơ, thú cưng, lịch và giao dịch | 000–008 | Nhận diện và tham chiếu đối tượng | Service kiểm vai trò, sở hữu và trạng thái hiện hành |
| CHECK vai trò/chức vụ/trạng thái | 000, 001, 005, 007 | Chỉ nhận các giá trị trong miền | Guard quyết định cặp chuyển trạng thái nào hợp lệ |
| EXCLUDE lịch theo nhân viên và `tsrange` | `lich_hen`, 000 | Chặn giao thoa khi có nhân viên, có kết thúc và trạng thái khác `DaHuy` theo predicate nguồn | Solver xét cả lịch chưa gán người; khóa ngày bảo vệ quyết định công suất |
| `ex_ca_lam_viec_active` | `ca_lam_viec`, 003 | Không chồng ca đang hoạt động của cùng nhân viên | Hủy/thu hẹp ca vẫn phải giữ khả năng phục vụ lịch mở |
| UNIQUE lịch trên hóa đơn/đánh giá | 000 | Không tạo nhiều hóa đơn hoặc nhiều đánh giá cho cùng lịch | Kiểm điều kiện hoàn tất và chủ sở hữu |
| CHECK tiền và công thức hóa đơn | 000, 004, 007 | Tiền hợp lệ, giảm không vượt tổng, tiền thừa/cọc có quan hệ phù hợp | Tính theo đơn vị nguyên nhỏ, kiểm nợ trong transaction |
| UNIQUE khóa chống lặp | Thanh toán 004; giao dịch cọc 007 | Không ghi thêm cùng khóa | Replay phải khớp cả đối tượng, số tiền và nội dung liên quan |
| `ux_chi_hoan_thanh_cong` | `thanh_toan`, 005 | Tối đa một dòng hoàn thành công cho một khiếu nại | Khóa hóa đơn/khiếu nại và kiểm tiền đã duyệt/đã chi |
| `payment_intents_one_open`, `deposit_intents_one_open` | 006, 007 | Giới hạn intent còn mở theo predicate từng bảng | Kiểm thời hạn, sự kiện và chế độ sandbox |
| UNIQUE cọc theo lịch/loại giao dịch | 007 | Một hồ sơ cọc/lịch; giới hạn thu hoặc hoàn theo loại | Máy trạng thái và quyền thu/chi |
| UNIQUE/hash/thời hạn token reset | 008 | Token được lưu bằng hash, liên kết một tài khoản | Kiểm token còn hạn/chưa dùng và snapshot tài khoản; không lưu token gốc |
| Chỉ mục lịch, người nhận, thời gian/giao dịch | 000–004 | Hỗ trợ tra cứu theo điều kiện thường dùng | Có index chưa chứng minh đạt một thời gian đáp ứng cụ thể |

*Nguồn: nhóm đọc DDL và service Thế Giới Thú Cưng; nguyên lý ràng buộc tham khảo [23]. Tên EXCLUDE lịch không được tự đặt thành tên constraint giả định.*

Schema đã có `EXCLUDE USING gist` với khoảng `tsrange`; vì vậy không mô tả cơ chế tránh trùng chỉ nằm ở JavaScript. Tuy nhiên, lịch chưa phân công không được ràng buộc theo một nhân viên cụ thể bằng EXCLUDE đó. Kiểm tra tính khả thi ở service và ràng buộc DB bảo vệ những phạm vi khác nhau, cần giữ cả hai trong phân tích.

### 2.9.4. Kiểu thời gian, tiền và snapshot

Lịch sử dụng timestamp không kèm múi giờ để biểu diễn giờ nghiệp vụ tại Việt Nam; logic ngày/giờ dùng `Asia/Ho_Chi_Minh` và phép kiểm thời điểm phù hợp `+07:00`. Các cột có ý nghĩa thời điểm tuyệt đối, như thời hạn intent/reset và một số dấu thời gian cọc, sử dụng `TIMESTAMPTZ`. Báo cáo phân biệt hai loại, không mặc định chuyển mọi giờ lịch qua UTC rồi giữ nguyên ngày hiển thị.

Tiền được lưu bằng `NUMERIC`, còn các phép tính trọng yếu trong thư viện tiền chuyển sang số nguyên theo đơn vị 1/100 trước khi cộng, so sánh và trả chuỗi thập phân. Cấu hình driver có chuyển NUMERIC về Number, nên không suy rằng mọi biến nhận từ DB đều còn là chuỗi; phép kiểm và chuyển đổi tại biên nghiệp vụ vẫn cần thiết. Snapshot giá trên lịch, tên/giá trên hóa đơn và chính sách cọc giúp bảo toàn ý nghĩa lịch sử khi danh mục thay đổi.

### 2.9.5. Giao dịch và lưu vết dữ liệu

Hàm `withTransaction` lấy một client, bắt đầu transaction, chạy các bước, commit nếu thành công, rollback khi có lỗi và trả client về pool. Các truy vấn thuộc một quyết định ghi phải đi qua cùng client đó. Nếu vừa dùng transaction vừa đọc/ghi qua một kết nối độc lập ngoài phạm vi bảo vệ, ý nghĩa nhất quán của luồng có thể bị phá vỡ.

Nhật ký lịch lưu người thao tác, hành động, trạng thái và nội dung gắn với một lịch. Ca hủy và hồ sơ còn liên kết được giữ theo chính sách mềm để không làm đứt lịch sử. Profile khách/nhân viên có thể còn tồn tại sau đổi vai trò nhằm giữ FK; quyền dựa trên tài khoản hiện tại. Các cơ chế này không đồng nghĩa đã có audit bảo mật toàn hệ thống hoặc sao lưu DB tự động qua Admin.

### 2.9.6. Nhận xét thiết kế và chuẩn hóa

Lý thuyết chuẩn hóa được dùng để xem ý nghĩa thuộc tính, phụ thuộc hàm và khả năng phát sinh bất thường cập nhật [40]. Ví dụ, mã thú cưng nhận diện hồ sơ với chủ và thông tin riêng; mã dịch vụ nhận diện giá hiện hành trong danh mục. Giá dự kiến của một lần đặt có ngữ cảnh giao dịch khác với giá hiện hành của dịch vụ, nên cần phân biệt khi xem xét dữ liệu lặp.

Các bảng chi tiết tách quan hệ một–nhiều, còn bảng thu/hoàn biểu diễn nhiều sự kiện tài chính của một hóa đơn. Tổng tiền, tên/giá snapshot và cọc áp dụng là các giá trị được lưu có chủ đích; sự nhất quán của chúng cần được kiểm bằng công thức và transaction. Chương này chưa lập toàn bộ tập phụ thuộc và khóa ứng viên để chứng minh mọi bảng đạt 3NF. Do đó, báo cáo nhận xét lựa chọn thiết kế theo từng nhóm dữ liệu thay vì tuyên bố chuẩn hóa toàn bộ chỉ từ số bảng hoặc sơ đồ.

## 2.10. Thiết kế kiến trúc hệ thống

### 2.10.1. Các thành phần và quan hệ giao tiếp

Kiến trúc được tổ chức thành frontend React/Vite, backend HTTP API bằng Node.js/Express và PostgreSQL. Trình duyệt gửi yêu cầu để đọc hoặc thay đổi dữ liệu; backend xác thực, áp quy tắc nghiệp vụ và truy vấn DB thông qua `pg`. Tài liệu React, Express, PostgreSQL và nguyên tắc client–server của REST hỗ trợ nền tảng cho lựa chọn này [24], [17], [23], [18]; cách phân chia module cụ thể do nhóm thực hiện.

<!-- CHEN_HINH_2_19: Kiến trúc giao tiếp frontend, backend và cơ sở dữ liệu; người dùng tự chèn sau. -->

<br>
<br>
<br>
<br>

**Hình 2.19. Kiến trúc giao tiếp frontend, backend và cơ sở dữ liệu**

*Vị trí để trống — chưa có hình, tác giả tự chèn sau.*

Hình 2.19 được để trống để tác giả tự chèn sơ đồ kiến trúc sau. Theo mã được đối chiếu, không có ORM hoặc tập microservice cần đưa thêm vào hình. Vite phục vụ quy trình frontend; nó không đóng vai trò server xử lý đặt lịch. Cấu hình đóng gói/triển khai phải được phân biệt với bằng chứng ứng dụng đã chạy trên một môi trường production.

### 2.10.2. Luồng request, xác thực và dữ liệu

Yêu cầu đi qua middleware chung của Express, kiểm tra readiness cho nhóm API, rồi tới route tương ứng. Với route được bảo vệ, middleware xác thực kiểm token và dữ liệu tài khoản, sau đó middleware quyền và controller/service kiểm các điều kiện chuyên biệt. Truy vấn dùng tham số; khi cần nhiều bước ghi, service sử dụng transaction và khóa. Kết quả hoặc lỗi được trả về cho frontend để cập nhật trạng thái giao diện.

Frontend gửi access token bằng Bearer khi có; luồng đăng nhập đặt refresh token trong cookie `httpOnly`, `sameSite='strict'`, với cờ `secure` theo môi trường production của cấu hình. API client dùng cơ chế làm mới phiên dùng chung khi gặp 401 rồi thử lại một lần. Đây là mô tả mã đã khảo sát, chưa phải chứng nhận mọi điều kiện triển khai cookie/CORS hoặc an toàn ứng dụng đã được nghiệm thu.

### 2.10.3. Phân tách trách nhiệm và lựa chọn triển khai

Routes khai báo đường dẫn và guard; controller tiếp nhận yêu cầu/đáp ứng; các service tập trung quy tắc liên bảng và trạng thái; thư viện thuần xử lý thời gian, tiền và bài toán khả thi. Một số route gọi trực tiếp service, nên không mô tả mọi yêu cầu đều bắt buộc qua đúng một chuỗi lớp giống nhau. Frontend chia trang, layout và thành phần dùng chung để tổ chức tương tác theo nhóm người dùng.

Dự án dùng SQL trực tiếp qua `pg`, giúp thể hiện rõ các phép khóa và truy vấn cần cho nghiệp vụ. Lựa chọn này đi kèm trách nhiệm giữ query có tham số, dùng đúng transaction client và duy trì hợp đồng API. Các tệp cấu hình Docker, script DB hoặc trạng thái `/health` không tự chứng minh readiness của schema hay khả năng vận hành đầy đủ; `/ready` và kiểm tra API/DB có trách nhiệm riêng.

## 2.11. Thiết kế API và giải pháp xử lý nghiệp vụ quan trọng

### 2.11.1. Thiết kế API tiêu biểu

Đường dẫn được ghép từ prefix trong `server.js` và route con. API được mô tả theo tài nguyên, thao tác, điều kiện truy cập và dữ liệu cần thiết; cách dùng HTTP theo định hướng REST đã xác định ở Chương 1 [18]. Bảng 2.10 chọn các đường dẫn đại diện, không thay thế toàn bộ hợp đồng API hoặc tự sinh endpoint từ tên message UML.

**Bảng 2.10. API tiêu biểu của hệ thống**

| Method/path | Quyền và phạm vi | Đầu vào chính/kết quả | Module nguồn |
|---|---|---|---|
| `POST /api/auth/dang-nhap` | Công khai, kiểm tài khoản | `tenDangNhap`, `matKhau` → access token/hồ sơ và cookie refresh; sai thông tin bị từ chối | Auth routes/controller |
| `POST /api/auth/lam-moi-token` | Refresh token hợp lệ | Cookie → access token mới; kiểm mục đích/phiên bản và hoạt động | Auth |
| `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Công khai, hạn mức theo luồng | Yêu cầu khôi phục/đặt lại → phản hồi theo điều kiện token | Password reset routes/service |
| `GET /api/lich-hen/khung-gio-trong` | Khách hoặc tiếp nhận/quản lý/Admin | `ngay`, `thoiLuong` → `slots`, lý do không có giờ; đầu vào sai bị chặn | Lịch controller, booking |
| `POST /api/lich-hen` | Chỉ khách, đúng chủ | `thuCungId`, `dichVuIds`, `ngay`, `gioStart`, ghi chú/chấp nhận chính sách khi áp dụng → lịch chờ | Booking |
| `POST /api/lich-hen/tai-quay` | Tiếp nhận/quản lý/Admin | Khách/thú cưng cũ hoặc dữ liệu mới, dịch vụ và giờ → lịch, thông tin bàn giao nếu tạo tài khoản tạm | Booking |
| `GET /api/lich-hen/:id/nhan-vien-kha-dung` | Tiếp nhận/quản lý/Admin | Lịch còn chờ → nhân viên phù hợp toàn khoảng | Dispatch |
| `PATCH /api/lich-hen/:id/xu-ly` | Tiếp nhận/quản lý/Admin | `hanhDong`, `nhanVienId` khi phân công, `lyDo` theo nhánh → quyết định điều phối | Dispatch |
| `PATCH /api/lich-hen/:id/cham-soc` | Chăm sóc, đúng người được giao | `hanhDong`, dịch vụ/trạng thái/ghi chú theo bước → tiến trình | Care |
| `PATCH /api/lich-hen/:id/doi-lich`, `PATCH /api/lich-hen/:id/huy` | Đổi qua tiếp nhận; hủy qua khách đúng chủ hoặc tiếp nhận | Ngày/giờ/lý do hoặc lý do hủy → lịch và xử lý liên quan; trạng thái sai bị chặn | Care/Dispatch |
| `POST /api/deposits/:id/reschedule` | Khách đúng chủ hoặc tiếp nhận, theo guard | Ngày/giờ và lý do → đổi lịch, áp quy tắc cọc | Deposits routes/Care |
| `POST /api/deposits/:id/collect`, `POST /api/deposits/:id/refund` | Tiếp nhận/quản lý/Admin | Dữ liệu thu hoặc hoàn theo trạng thái → giao dịch cọc và kết quả | Deposits |
| `POST /api/hoa-don` | Tiếp nhận/quản lý/Admin | `maLichHen`, `giamGia` → hóa đơn cho lịch hoàn tất; trùng hoặc chi tiết chưa xong bị chặn | Invoices |
| `POST /api/hoa-don/:id/thanh-toan` | Tiếp nhận/quản lý/Admin | `soTien`, `phuongThuc`, `khoaChongLap`; tiền đưa/xác nhận thực nhận theo phương thức → lần thu | Invoices |
| `GET /api/payments/transfers/invoices/:id`, `GET /api/payments/transfers/deposits/:id` | Khách đúng chủ hoặc tiếp nhận | Phương thức theo query → hướng dẫn chuyển tiền; chưa ghi nhận đã thu | Payment transfers |
| `POST /api/khieu-nai/cua-toi` | Khách đúng chủ | Lịch và nội dung → khiếu nại; server xác định chủ/hóa đơn, chống gửi lặp theo cửa sổ quy định | Complaints |
| `PATCH /api/khieu-nai/:id/quyet-dinh` | Quản lý/Admin | `quyetDinh`, `phuongAn`, số tiền nếu hoàn → quyết định hoặc chờ hoàn | Complaints |
| `POST /api/khieu-nai/:id/chi-hoan` | Tiếp nhận/quản lý/Admin | Khóa chống lặp, phương thức, kết quả, xác nhận/chứng từ → thực chi hoặc ghi thất bại | Complaints |
| `GET /api/bao-cao/doanh-thu` | Quản lý/Admin | `tuNgay`, `denNgay` → báo cáo theo quy tắc thu/hoàn | Reports |
| `GET/POST /api/admin/tai-khoan`, `PATCH /api/admin/tai-khoan/:id` | Chỉ Admin | Lọc/tạo/cập nhật tài khoản; khóa/mở/reset có các route POST riêng | Admin routes/controller |

*Nguồn: nhóm đọc `server.js`, routes và controller/service. Các tham số là đầu vào tiêu biểu, không phải schema đầy đủ của mọi nhánh.*

Các nhóm lỗi cần phân biệt gồm đầu vào không hợp lệ, chưa xác thực, không đủ quyền, dữ liệu không tồn tại, xung đột và tạm chưa xử lý được. Middleware ánh xạ lỗi DB như trùng duy nhất, trùng khoảng hoặc vi phạm ràng buộc sang phản hồi công khai; lỗi nội bộ không trả nguyên SQL, thông tin kết nối hay stack. Mã trạng thái cụ thể phải đối chiếu từng endpoint, không gán một mã chung cho mọi trường hợp bị từ chối.

### 2.11.2. Kiểm tra khả dụng toàn khoảng và tìm kiếm quay lui

Thuật toán nhận tập ca, các lịch còn chiếm nguồn lực và khoảng ứng viên. Thời gian được biểu diễn theo phút trong ngày nghiệp vụ. Hai khoảng giao nhau khi `a.start < b.end && b.start < a.end`; hai đầu mút vừa chạm cho phép phục vụ nối tiếp. Một nhân viên chỉ là ứng viên cho một lịch khi có một ca bao trọn toàn bộ khoảng, không gộp hai ca kề nhau để thỏa điều kiện.

Các lịch được sắp theo thời điểm và gom theo thành phần giao nhau có tính bắc cầu chứa lịch mới. Cách chọn này xét cả các lịch liên quan gián tiếp qua chuỗi giao thoa, đồng thời tránh một bất nhất lịch sử ở khoảng tách biệt làm từ chối không cần thiết. Lịch đã có nhân viên giữ nguyên người đó; nếu phân công cố định không hợp lệ trong thành phần xét thì không coi là còn chỗ.

Với các lịch chưa phân công, thuật toán tìm kiếm quay lui: tại mỗi bước chọn việc có ít lựa chọn nhân viên khả dụng nhất, thử từng người không trùng việc đã đặt tạm, rồi quay lại nếu nhánh không hoàn tất. Tập chiếm dụng tạm chỉ phục vụ chứng minh tồn tại cách bố trí. Hàm trả kết quả khả thi, không trả hoặc lưu phương án để tự phân công; lễ tân vẫn quyết định người phụ trách qua luồng điều phối.

Ngân sách mặc định là 100.000 bước công việc của hàm, bao gồm nhiều phép duyệt/kiểm tra, không phải chỉ 100.000 mức đệ quy hay số lịch. Khi hết ngân sách, hàm phát sinh lỗi `SCHEDULING_BUDGET` và phản hồi 503 theo middleware, không nhận lịch với giả định còn chỗ. Phương pháp không tối ưu cân bằng tải hoặc sở thích khách; thời gian tìm có thể tăng mạnh với cấu hình khó. Kiểm thử đơn vị có các trường hợp lịch phân mảnh, giao thoa bắc cầu, giữ phân công và đối chiếu vét cạn trên các lịch nhỏ; kết quả chạy thuộc Chương 3.

### 2.11.3. Kiểm soát đồng thời và chống giao thoa

Tra giờ khả dụng là phép đọc; một người khác có thể nhận chỗ trước lúc yêu cầu mới được ghi. Khi tạo lịch, mã bắt đầu transaction, lấy advisory lock chung theo ngày trước khi đọc năng lực, đọc lại tài khoản/ca/dịch vụ và kiểm tính khả thi. Các đường thay đổi cùng nguồn lực phải phối hợp theo quy ước khóa tương ứng. Khi đổi giữa hai ngày, mã lấy khóa các ngày theo thứ tự để giảm nguy cơ hai yêu cầu giữ khóa ngược chiều.

Khóa bản ghi bảo vệ lịch hoặc hóa đơn khi cập nhật trạng thái và tiền. EXCLUDE ở DB tiếp tục bảo vệ giao thoa lịch đã gán và ca hoạt động theo predicate DDL. Các cơ chế khóa PostgreSQL là nền tảng [23], còn namespace/ngày khóa và phạm vi giao dịch là lựa chọn triển khai của dự án. Không chỉ dựa vào EXCLUDE để xét các lịch còn chưa có nhân viên, cũng không chỉ dựa vào một lần gọi solver trước transaction.

Trước khi chốt lịch, thời điểm hẹn được kiểm lại để tránh khoảng bắt đầu đã qua trong lúc chờ xử lý. Khi dữ liệu đổi hoặc ràng buộc bị vi phạm, hệ thống trả xung đột/lỗi phù hợp và rollback thay vì âm thầm đổi người hoặc chuyển giờ. Cơ chế này cần được thử bằng những yêu cầu cạnh tranh trên DB cô lập; chương thiết kế không tự sinh thêm một kết quả PASS.

### 2.11.4. Xác thực, phân quyền và quyền sở hữu

Thiết kế dùng JWT cho claims phiên và bcrypt cho đối chiếu mật khẩu; định nghĩa và khuyến nghị sử dụng được tham khảo từ RFC 7519, RFC 8725 và README bcrypt đã xác minh [41], [25], [39]. Các quy tắc bắt đổi mật khẩu tạm, kiểm mục đích access/refresh và phiên bản token là phần áp dụng trong Thế Giới Thú Cưng. Chữ ký token không được xem như đã mã hóa bí mật toàn bộ nội dung.

Middleware đọc lại tài khoản, chức vụ và trạng thái hoạt động từ DB. Token cũ có version khác hoặc tài khoản không còn được phép sử dụng sẽ bị từ chối theo logic hiện tại. Sau đó, kiểm tra vai trò chưa đủ: khách phải sở hữu dữ liệu, nhân viên phải được phân công, và thao tác phải hợp trạng thái. Frontend kiểm quyền để tổ chức trải nghiệm nhưng không thay thế những điều kiện server này.

Khôi phục mật khẩu lưu hash token cùng thời hạn và snapshot tài khoản; khi sử dụng cần kiểm token chưa dùng và thông tin vẫn phù hợp. Hạn mức ở route giảm việc gửi lặp theo luồng đã thiết kế. Kiểm thử SMTP loopback không chứng minh gửi thư tới dịch vụ ngoài đã thành công; quản trị bí mật, HTTPS và kiểm thử an toàn triển khai vẫn cần bằng chứng riêng, không suy từ việc có thư viện xác thực.

### 2.11.5. Cọc, thu tiền và xử lý khiếu nại/hoàn

Chính sách cọc phiên bản hiện tại áp dụng khi tính năng được bật: 30% giá dự kiến, làm tròn lên đơn vị đồng, lưu snapshot giá/chính sách và sự chấp nhận. Quy tắc hủy trước ít nhất 24 giờ, đổi sát giờ một lần và ngoại lệ được xử lý theo mã chính sách; lịch cũ không tự bị áp một chính sách mới. Khi có hồ sơ cọc, xác nhận và bắt đầu chăm sóc yêu cầu trạng thái đã nộp phù hợp.

Khi lập hóa đơn, khoản cọc đã thu được áp dụng vào `deposit_credit`; không ghi thêm một lần thu hóa đơn để làm tăng tiền lần thứ hai. Tổng được coi đã thanh toán phục vụ công nợ gồm lần thu hóa đơn thành công cộng cọc đã áp dụng. Nợ còn lại bằng phần thành tiền chưa được thanh toán; hoàn tiền không tự khôi phục nợ đã tất toán. Nếu giảm giá làm thành tiền thấp hơn cọc đã thu, luồng hiện tại chặn để yêu cầu xử lý chênh lệch, chưa có quyết toán cọc dư tự động.

Thu tiền mặt tách số ghi nhận với tiền đưa và tiền thừa. Chuyển khoản/MoMo do nhân sự ghi nhận cần xác nhận thực nhận theo điều kiện của phương thức. Hướng dẫn VietQR hoặc việc khách báo đã chuyển chưa phải webhook đối soát. Các intent và callback sandbox dùng môi trường mô phỏng theo cơ chế riêng, không được trình bày như cổng thanh toán thật hoặc chuyển tiền hoàn tự động.

Khiếu nại hoàn tiền được duyệt theo hạn mức: tiền đã thu trừ hoàn thành công và khoản duyệt còn chờ. Duyệt giữ hạn mức ở `ChoHoanTien`; thực chi yêu cầu xác nhận và chứng từ phù hợp. Giao dịch thành công mới ảnh hưởng tiền và trạng thái hóa đơn; thất bại giữ chờ. Khóa hóa đơn/khiếu nại, kiểm replay và chỉ mục duy nhất phối hợp để tránh chi hai lần cho cùng quyết định. Cọc và hoàn hóa đơn có sổ/trạng thái riêng, cần tránh tính lặp khi báo cáo dòng tiền.

### 2.11.6. Bảo toàn dữ liệu và ngoại lệ

Kiểm tra đầu vào thực hiện ở server với định dạng, độ dài, miền giá trị và điều kiện liên quan. SQL sử dụng tham số thay vì ghép trực tiếp giá trị người dùng. Khi trạng thái hoặc nguồn lực thay đổi giữa các lần đọc, yêu cầu cần kiểm lại và phản hồi rõ để người dùng tải lại/chọn lại; không tự bỏ qua guard để tiếp tục một thao tác đã mất điều kiện.

**Bảng 2.11. Quy tắc nghiệp vụ và cơ chế bảo vệ**

| Quy tắc | Cơ chế ở mã/schema | Ngoại lệ hoặc giới hạn | Đầu mối testcase truy vết |
|---|---|---|---|
| Giờ đúng và ca bao trọn | Validation, `businessNow`, solver toàn khoảng | Không ghép ca kề nhau; dữ liệu cũ thiếu kết thúc được xử lý bảo thủ | `scheduling.test.js`, `booking.integration.test.js` |
| Không nhận quá nguồn lực | Khóa ngày trước đọc, kiểm lại khả thi và transaction | Hết budget trả 503; chưa tối ưu phân công | `scheduling.test.js`, `booking.integration.test.js` |
| Một quyết định điều phối hợp lệ | Khóa lịch, kiểm `ChoXacNhan`, hành động loại trừ | Từ chối khác hủy; quyết định sau có thể xung đột | `dispatch.integration.test.js` |
| Chỉ người được giao chăm sóc | Guard care và kiểm nhân viên, ngày, ca/trạng thái | Chưa quyết toán dịch vụ đang làm dở | `care-shifts.integration.test.js` |
| Lịch/chi tiết/tiền nhất quán | Cùng transaction client, rollback khi lỗi | Thông báo lỗi trong transaction có thể làm hủy toàn quyết định | Booking/dispatch/invoices/refunds integration |
| Giá và hóa đơn lịch sử | Snapshot, UNIQUE lịch trên hóa đơn, kiểm chi tiết hoàn tất | Không xem giá danh mục mới là giá hóa đơn cũ | `invoices.integration.test.js` |
| Không thu vượt hoặc thu lặp | Khóa hóa đơn, kiểm nợ, khóa chống lặp và so nội dung | Khóa giống nhưng nội dung khác bị từ chối | `invoices.integration.test.js` |
| Duyệt hoàn khác thực chi | Reserve, khóa, kiểm hạn mức và một dòng thành công/khiếu nại | Thất bại giữ chờ, hoàn một phần có trạng thái riêng | `refunds.integration.test.js` |
| Cọc không áp hồi tố, không tính thu lặp | Snapshot chính sách, sổ cọc và `deposit_credit` | Chưa tự giải phóng lịch chưa cọc, chưa tự quyết toán cọc dư | `deposit-policy.test.js`, `deposits.integration.test.js` |
| Đúng quyền/sở hữu và phiên hiện hành | DB role/chức vụ, owner/assignee, token version | Ẩn nút chưa đủ; trang mô phỏng chưa có backend | `auth-pets.integration.test.js`, dispatch/refunds tests |
| Khôi phục mật khẩu có điều kiện | Hash token, thời hạn/snapshot, thu hồi phiên và hạn mức | SMTP bên ngoài chưa có bằng chứng nghiệm thu | `password-reset.integration.test.js`, `email.test.js` |

*Nguồn: nhóm đối chiếu service/DDL và các file test có thật trong `backend/test`. Tên file rút gọn trong ô là đầu mối truy vết, không phải kết quả đã chạy mới trong giai đoạn viết này.*

Bảo toàn còn đòi hỏi phân biệt xóa mềm, lịch sử nghiệp vụ và sao lưu. Git lưu mã/tài liệu không thay việc sao lưu PostgreSQL. Nhật ký lịch chỉ theo dõi những hành động của lịch đã được ghi, chưa cung cấp audit bảo mật tổng thể. Các giới hạn cần được chuyển thành hướng hoàn thiện và tiêu chí đánh giá, không được che bằng dữ liệu mẫu ở giao diện.

## 2.12. Tổng kết chương

### 2.12.1. Tổng hợp lựa chọn thiết kế và sai khác

Chương 2 cụ thể hóa bài toán bằng tác nhân, yêu cầu, ma trận quyền, sáu loại biểu diễn đã có, mô hình dữ liệu, kiến trúc và các cơ chế xử lý. Mối liên hệ xuyên suốt là quyết định nghiệp vụ phải có dữ liệu, người có quyền và điều kiện trạng thái tương ứng. Các hình gốc được giữ nguyên; khác biệt với hiện trạng được giải thích để tránh xem mô hình ban đầu là toàn bộ phần mềm đã triển khai.

**Bảng 2.12. Sai khác giữa thiết kế gốc và triển khai**

| Hình/nhóm | Thiết kế gốc | Hiện trạng được đối chiếu | Cách sử dụng trong báo cáo |
|---|---|---|---|
| UC-01 | Phân nhóm và các quan hệ chức năng tổng thể | Quyền Admin còn vận hành; care có guard riêng; một số trang chưa có backend đầy đủ | Dùng Bảng 2.4 để xác định quyền; không suy mọi use case đều nghiệm thu |
| AD-02, SD-02 | Kiểm giờ/chỗ ở mức mô hình, SD so số lịch và người | Ca bao trọn, thành phần giao thoa, quay lui, khóa ngày và cọc | Thuyết minh thuật toán hiện tại, không gán thuật toán mới cho message cũ |
| AD-03, SD-03 | Nhánh từ chối dùng hủy; thứ tự có thể gây hiểu xử lý tiếp | `TuChoi`, giữ chờ/phân công/từ chối loại trừ | Phân biệt quyết định và chuyển trạng thái |
| AD-04, SD-04 | Hủy/hoãn và khối hủy có thể đọc như sau thực hiện | Báo vấn đề trước bắt đầu; không hủy lịch đang làm/đã hoàn tất bằng API đó | Không mô tả một luồng quyết toán làm dở chưa có |
| AD-05, SD-05 | Hóa đơn/thu theo mô hình ban đầu | Snapshot, cọc, số ghi nhận khác tiền đưa và chống lặp | Giải thích cơ chế tiền; bản in chưa là tích hợp thuế |
| AD-06, SD-06 | Duyệt đã tạo giao dịch/đổi đã hoàn | Duyệt giữ chờ, thực chi thành công mới đổi tiền; có thất bại/hoàn một phần | Tách phê duyệt với thực chi trong mọi mô tả |
| CD-01 | Các lớp miền lõi và trách nhiệm | Hàm ES module/SQL; schema có các phần mở rộng | Không gọi hình lớp là toàn schema hoặc hệ lớp ES6 đã cài |
| SM-01, SM-02 | Thiếu từ chối/hoàn một phần, có đường hủy khác mã | Miền trạng thái và guard chi tiết hơn | Bổ sung bằng Bảng 2.6, không sửa PNG |
| MH-TQ | Cây phân nhóm màn hình ban đầu | Có route mới, trang giữ chỗ và Admin mô phỏng | Đối chiếu route/quyền, không dùng cây làm bằng chứng QA |
| Hình 2.18, 2.19 | Chưa có hình đầy đủ được chọn | Có mô tả/bảng dữ liệu và kiến trúc từ mã | Để trống để tác giả tự chèn theo yêu cầu |

*Nguồn: nhóm tổng hợp từ bộ sơ đồ gốc, bảng đối chiếu UML–mã và nội dung khảo sát trong chương.*

### 2.12.2. Truy vết sang cài đặt và kiểm thử

Các mã YC/PC được dùng làm đầu mối khi trình bày kết quả: yêu cầu gắn với màn hình/API, cơ chế xử lý và ca kiểm tra tương ứng. Nhóm xác thực/hồ sơ liên hệ auth/pet; lịch và điều phối liên hệ booking/dispatch/scheduling; chăm sóc/ca liên hệ care/shifts; giao dịch liên hệ invoices/deposits/complaints; báo cáo/Admin liên hệ các module và bằng chứng riêng. Một yêu cầu có thể cần nhiều loại kiểm chứng, không chỉ một ảnh chụp.

Chương 3 sẽ phân biệt kết quả kiểm tra tự động, tích hợp trên DB cô lập và thao tác giao diện theo từng mốc. Phân hoạch tương đương, giá trị biên và điều kiện trạng thái giúp chọn ca kiểm tra [32], còn số PASS/FAIL/SKIP phải lấy từ biên bản đã chạy. Những mục thiếu hình, chưa QA hoặc chưa tích hợp bên ngoài tiếp tục được ghi là phần cần bổ sung; chương thiết kế này không thay nghiệm thu phần mềm.
