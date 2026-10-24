# PETCARE EMERALD — ĐẶC TẢ DESIGN SYSTEM VÀ KẾ HOẠCH ÁP DỤNG

Ngày24/10/2026 · Đợt1, thiết kế trước khi viết code UI. Hiện trạng theo [ma trận](MA_TRAN_UI_QUYEN_API.md). Tài liệu này là quy tắc triển khai; component/path đề xuất bên dưới chưa tồn tại nếu không ghi “đã có”. Không thay React/Vite/Tailwind/Express/pg, không đổi DB để đổi UI, không cài framework UI mới.

## 1. Trước và sau dự kiến

| Hiện tại | Đích |
| --- | --- |
| Nền kem, riêng Admin navy/sky | Slate50 + white + emerald/teal thống nhất |
| Nhân sự dùng thẻ chào/link | StaffLayout sidebar + header + dashboard theo quyền |
| Form khách một trang | Wizard4bước, summary thật, giữ dữ liệu khi quay lại |
| Bảng hồ sơ và form dài | Pet Cards + drawer, generic health alert |
| Trang hóa đơn/khiếu nại khách chưa nối | Menu Tài khoản, list/detail/in và luồng nộp sở hữu |
| Nhiều class button/input, modal tự làm | Primitive và feedback cùng hợp đồng, accessible keyboard |
| Loading/empty/error chưa nhất quán | Ba state phân biệt; retry và giữ lựa chọn đúng ngữ cảnh |

Chỉ học nguyên tắc lịch màu, cảnh báo chăm sóc, hồ sơ và minh bạch tiền từ các ví dụ người dùng nêu. Không sao chép asset/layout độc quyền; không tuyên bố đã nghiên cứu hoặc chứng nhận bởi các nhà cung cấp đó.

## 2. Tokens và bố cục

| Token | Giá trị/áp dụng |
| --- | --- |
| Primary | Teal600 #0D9488; hover Teal700 #0F766E |
| Tint | Teal50 #F0FDFA; Teal100 #CCFBF1 — phân biệt hai sắc độ |
| Page / surface | Slate50 #F8FAFC / white #FFFFFF |
| Text | Slate800 #1E293B; phụ Slate600 #475569; muted Slate500 #64748B |
| Border | Slate200 #E2E8F0; input Slate300 #CBD5E1 |
| Focus | Ring2px Teal600 + offset2px, luôn thấy bằng bàn phím |
| Success / warning / error | Emerald, Amber, Rose/Red; luôn có chữ và biểu tượng, không chỉ màu |
| Radius | Input/button10–12px, card16px, badge/full-pill |
| Spacing | Thang4/8/12/16/24/32px; vùng nhấn mục tiêu44px |
| Typography | Giữ Nunito/fallbacksans hiện có; body14–16px; title24–32px, line-height thoáng |
| Depth | Border nhẹ + shadow nhỏ; không dùng bóng dày toàn màn hình |

Primary trắng trênTeal600 cần kiểm tra tương phản thực ở cỡ chữ; dùng nềnTeal700 khi cần đảm bảo cho chữ nhỏ, không tự gắn nhãn đạt WCAG từ hex. Tooltip không thay label; button icon có aria-label. Không thêm font/ảnh CDN hoặc tracking ngoài phạm vi.

Customer portal: header logo/menu6đích theo nhóm, body max-width thích hợp, tài khoản gom hồ sơ/hóa đơn/khiếu nại; dashboard là đích sau login, giữ route cũ hoạt động. StaffLayout: sidebar240px, header chứa tiêu đề/breadcrumb/thông báo/tài khoản; menu theorole. Admin dùng cùng shell nhưng không hiện hành động chăm sóc. Bản in dùng layout gọn không sidebar/header chức năng.

## 3. Chuẩn nhãn trạng thái

| Domain / giá trịDB | Nhãn | Màu |
| --- | --- | --- |
| Lịch ChoXacNhan | Chờ xác nhận | Amber |
| Lịch DaXacNhan | Đã xác nhận | Sky |
| Lịch DangThucHien | Đang thực hiện | Indigo |
| Lịch HoanThanh | Hoàn thành | Emerald |
| Lịch DaHuy / TuChoi | Đã hủy / Từ chối | Slate / Rose |
| Chi tiết ChoThucHien | Chờ thực hiện | Amber |
| Hóa đơn ChuaThanhToan / ThanhToanMotPhan | Chưa thanh toán / Thanh toán một phần | Amber |
| Hóa đơn DaThanhToan | Đã thanh toán | Emerald |
| Hóa đơn HoanTienMotPhan / DaHoanTien | Hoàn tiền một phần / Đã hoàn tiền | Indigo / Slate |
| Khiếu nại DaTiepNhan | Đã tiếp nhận | Amber |
| Khiếu nại ChoHoanTien | Đã duyệt, chờ thực chi | Sky |
| Khiếu nại DaXuLy | Đã xử lý | Emerald |
| Giao dịch ThanhCong / ThatBai | Thành công / Thất bại | Emerald / Rose |

Map theo domain, không dùng chữ HoanThanh của lịch để suy ra đã thanh toán. Trạng thái không biết hiển thị nguyên mã với style neutral; không giả thành thành công. Giữ giá trị DB, payload và transition hiện có. Badge không thay server kiểm quyền/trạng thái.

## 4. Hợp đồng components và tái dùng

Các đường dẫn mới là **dự kiến**. Không chuyển hàng loạt mọi trang cùng một commit.

| Component | Trách nhiệm/hợp đồng dự kiến | Kế thừa |
| --- | --- | --- |
| layouts/StaffLayout.jsx | Outlet, navrole, header, breadcrumb; desktop/mobile | GiuChoVaiTro sẽ chuyển sang các dashboard ở3–5 |
| layouts/KhungKhachHang.jsx | Header, Tài khoản dropdown, mobile nav, Outlet | Sửa layout sẵn có ở2 |
| ui/Button.jsx | variants primary/secondary/danger/ghost, pending/disabled; mặc định type=button | Không submit nhầm form |
| ui/FormField.jsx | id/label/hint/error, required, aria-describedby/invalid | Giảm Field khai báo rải rác |
| ui/Modal.jsx và Drawer.jsx | role dialog, aria-modal/title, focus trap, Escape, restore focus, body scroll lock | HopThoaiXacNhan hiện có bổ sung focus/busy |
| ConfirmDialog | pending không đóng hoặc submit kép; nội dung rõ đối tượng/hậu quả | Giữ warning khóa nhân viên và xác nhận hiện có |
| ui/Feedback.jsx | Skeleton, EmptyState CTA, ErrorState retry, aria-busy | Không biến lỗi mạng thành danh sách rỗng |
| ToastProvider | role=status thành công, alert lỗi quan trọng; sống đủ lâu, có đóng | Không thay inline validation hoặc che lỗi tài chính |
| StatusBadge | domain+code mapping thống nhất | HuyHieuTrangThai hiện có; giữ adapter nhãn cũ khi chuyển |
| PetCard / HealthAlert | Tên/loài/giống/cân nặng/tuổi nếu có, notes nguyên văn | Không ảnh giả; note rỗng không tạo cảnh báo |
| MetricCard | label/value/period/loading/error/unit, nguồn count chính xác | Số0 khác loading/không biết |
| FilterBar / DataTable | search/filter/reset/loading/error/empty, controlled state | Table semantic, header; card view mobile khi hợp lý |
| BillingSummary | Tổng/thành tiền, đã thu, còn phải thu, đã hoàn tách biệt | Receipt từ HoaDon.jsx tách read-only dùng chung, không đưa nút thu cho K |
| Calendar/Timeline | Ngày/tuần, staff/statusfilter, card xem chi tiết | Bấm mở drawer; chưa drag-drop đổi lịch tự động |

Không đưa API/SQL hay ma trận quyền vào primitive. Route guard/middleware hiện tại vẫn quyết định quyền; action visible/disabled kiểm lại state phía UI. Dùng apiCall hiện có cho API cần auth/refresh. Không giữ/đưa mật khẩu tạm vào toast hoặc log; hộp bàn giao tạm hiện có vẫn một lần, có đóng/copy có chủ đích.

## 5. Kế hoạch dữ liệu dashboard thật

| Nhóm | Chỉ số/khối | Nguồn và cách tránh sai |
| --- | --- | --- |
| K | Pet đang theo dõi, lịch gần nhất tương lai, thông báo | pets/lịch sở hữu; ngày VN; unread ghi rõ50tin hoặc count API mới |
| C | Được giao, đang làm, hoàn thành, cần xử lý hôm nay | GET lịch ngày, server giới hạn được giao; cần xử lý là careIssue khác rỗng và lịch chưa kết thúc, không suy diễn ghi chú thường |
| T | Lịch hôm nay/pending/inprogress/completed; bill chưa thu; KNmới | Lịch ngày thật; hóa đơn/KNaggregate server vì listLIMIT200; ghi phạm vi từng metric |
| Q | Thực thu theo kỳ, statusratio, topservice, cảnh báo ca/pending/KN | API report hiện có; quantity phải sort theo số lượng; label “dịch vụ đã lập hóa đơn” đúng nguồn; warning không có ca dựa dữ liệu ca thật |
| A | Tài khoản theo vai trò/chức vụ/active | Adminlist hiện chưalimit; tách ba nhánh NhanVien theo chức vụ thành5nhóm để không nhầm3vai_tro với5nhóm người dùng |

Nếu cần API mới: chỉ đọc, authenticated+role đúng, query aggregate trả0thật, không MAX hoặc countlistcắt để giả tổng. Endpoint tên/body là đề xuất đến lúc triển khai sẽ ghi docs/API.md. Không lấy dữ liệu quyềnQ/A đưa vào dashboardT/K.

Care report: ưu tiên tái dùng ghi_chu_cham_soc chi tiết và nhat_ky_lịch được quyền đọc; không chẩn đoán y khoa, không khẳng định dịch vụ xong nếu chỉ đã bắt đầu. Booking wizard gọi giờ trống lại khi đổi ngày/dịch vụ; invalidates giờ cũ; bước xác nhận dùng giá/thời lượng danh mục thật và server recheck khi submit.

## 6. Responsive và khả năng tiếp cận — tiêu chí nghiệm thu

Các viewport dưới là mục tiêu cần kiểm thực tế sau code, chưa là PASS:

| Viewport | Bố cục | Thao tác phải kiểm |
| --- | --- | --- |
| Mobile375×812 | Sidebar drawer, cards1cột, dialogfullwidth phù hợp, summary gọn | Menu/Tài khoản, wizard, filter, form keyboard, không nút ngoài viewport |
| Tablet768×1024 | Menu thu gọn, cards2cột, drawer tối đa hợp lý | Xoay chiều, bảng có scroll riêng, sticky CTA không che nội dung |
| Desktop1440×900 | Sidebar cố định, KPI3–4cột, bảng/calendar đủ nhãn | Filter dài, modal focus, printlayout |

- Không tràn ngang toàn trang; bảng/calendar có vùng scroll riêng có tên và dấu hiệu kéo.
- Tab/ShiftTab/Escape/Enter hoạt động; focus không thoát modal và quay đúng nút mở. Dropdown đóng khi điều hướng/Escape, không chỉ hover.
- aria-live cho kết quả tải/submit, label liên kết input, lỗi từng trường gần trường; skeleton aria-hidden, container aria-busy. prefers-reduced-motion giảm transition; không animation bắt buộc.
- Form tài chính/submit có busy; retry giữ khóa chống lặp; doubleclick không tạo giao dịch kép. Dialog in không thay đổi dữ liệu.
- Biểu đồ có bảng số liệu, legend có chữ, cùng kỳ VN và công thức; màu status không là tín hiệu duy nhất.

## 7. Lộ trình tuần tự và cổng kiểm tra

| Đợt | Phạm vi | Điều kiện ra đợt |
| --- | --- | --- |
| 1a — hiện tại | Kiểm kê và đặc tả DS trước code | Ma trận đủ5vai trò/API; baseline; nguồn dữ liệu/giới hạn rõ |
| 1b | Tokens, primitives, StaffLayout, sandbox components; không đổi thuật toán | Build, kiểm keyboard/modal,3viewport, không đổi API; báo cáo trước/sau |
| 2 | DashboardK, cards/drawer, wizard, hóa đơn, KNtựgửi sở hữu, menu tài khoản | Ownership/IDOR, regressionbooking, error/empty/API thật, mobile; không nới quyền endpointcũ |
| 3 | DashboardC, timeline/progress/healthnotes, profile | Chỉ assigned; không tự phân công/thu/duyệt; workflowcare vẫn đúng |
| 4 | DashboardT, calendar ngày/tuần, filter/search, POSsummary | Lọc đúng VN/duration,3nhánh dispatch, partpay/refund, concurrency |
| 5 | DashboardQ/A, charts, alerts, lightAdmin/filterstatus | Reportkhôngnhântổng, netkhôngprofit, role guards, lockwarning, nodatamock |
| 6 | Hồi quy toàn bộ, responsive, báo cáo nghiệm thu | Unit+HTTP DB riêng+browser đủ5vai trò; mỗi FAIL/BLOCKED rõ; no secrets |

P0/P1 theo prompt. P2 không triển khai: OTP/email thật, cổng thanh toán thật, WebSocket. Docker còn mục nghiệm thu kế hoạch cũ, không biến thành điều kiện cần để bắt đầu UI local.

Sau mỗi đợt dùng template: (1)trước/sau; (2)file; (3)UI→API; (4)PASS/FAIL/BLOCKED; (5)responsive3viewport. Chỉ push nhánh riêng, không merge main. Không tự đánh dấu đợt1 hoàn thành chỉ vì đã có đặc tả; 1b cần code và QA riêng.

## 8. Chiến lược kiểm thử

Giữ test ngàyVN, solver/overlap200cases, booking/dispatch14, care6, billing8, refund8, report-admin7, auth10, tooling8 vàjourney8 hiện có. Mỗi HTTPfile DB test mới, không seed/ghi DB người dùng. Frontend hiện14test, chưa có lintscript trong2package và chưa có harness testReactcomponent/browser tự động; ghi thiếu thật, không tạo snapshot mô phỏng rồi báo E2E.

Trong1b thống nhất lint/harness phù hợp repo; không bật rule đại trà gây chỉnh mọi file ngoài phạm vi. Nếu thêm dependency phải giữ stack/lockfile và chứng minh nhu cầu. Test mới tập trung hành vi: transitions wizard/error/retry, ownership và read-only billing, statefilters, modal focus, role navigation. Build không chứng minh responsive hoặc chống vượt quyền.

## 9. Triển khai nền tảng 1b đã kiểm — 24/10/2026

Đã có StaffLayout (children, giữ guards), Button/FormField/Modal+Drawer/Confirm adapter/Feedback/Toast/StatusBadge, tokens/focus/reduced-motion, menu role, home thẻ công việc và lab chỉ development. Modal bổ sung vòng focus tường minh sau khi browser QA phát hiện Tab có thể thoát biên. Button primary nềnTeal700 cho chữ nhỏ. Lint correctness và frontend20test/build77modules đạt; shell/home/component375/768/1440 đạt, đủ5nhóm đăng nhập trênDBtest. Xem [báo cáo](BAO_CAO_UI_DOT_1.md).

PetCard, HealthAlert, MetricCard, DataTable/filter, BillingSummary và Calendar là phần áp dụng theo đợt2–5; chưa có dashboard KPI hoặc kết nối API mới chỉ từ đợt1. Nội dung Admin tối giữ nguyên đếnđợt5. Mọi dòng “dự kiến” trong hợp đồng phải đối chiếu báo cáo, không coi tất cảcomponent của6đợt đã hoàn thành.
