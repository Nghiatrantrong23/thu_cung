# Emerald UI — nghiệm thu nền tảng đợt 1

Ngày 24/10/2026. Phạm vi: phần 1b nối tiếp kiểm kê/đặc tả 1a. Đợt 2–6 chưa nghiệm thu trong báo cáo này.

## 1. Trước và sau

- Trước: trang đầu nhân sự là thẻ chào với các link; mỗi trang tự điều hướng, thông báo bị lặp khi thêm shell. Sau: sidebar theo quyền trên desktop, header theo trang/vai trò, menu drawer trên tablet/mobile, trang đầu dạng thẻ công việc. Đây chưa phải dashboard KPI của đợt 3–5.
- Thêm nền Slate/Teal, focus-visible, reduced-motion; Button mặc định type=button, pending khóa thao tác; FormField liên kết label/hint/error; modal/drawer, toast và loading/empty/error riêng. Nút primary dùng Teal700 cho chữ nhỏ theo ngoại lệ tương phản trong đặc tả.
- Modal dùng native dialog và bổ sung vòng Tab/Shift+Tab, chặn Escape/đóng khi busy, khóa cuộn và trả focus. QA phát hiện native dialog có thể đưa focus ra ngoài ở biên; đã sửa và kiểm tra lại đạt.
- Badge mới map theo domain, phân biệt duyệt hoàn với thực chi và hoàn một phần. Badge tương thích cũ sửa màu hủy/xử lý từ chối; chuyển các màn hình tài chính sang component mới theo từng đợt sau.

## 2. File thay đổi

Mới trong `dichvu/src/`: `layouts/StaffLayout.jsx`, `components/ui/{Button,FormField,Modal,Feedback,Toast,StatusBadge}.jsx`, `lib/{staffNavigation,statusPresentation}.js`, `pages/ComponentLab.jsx`.

Sửa trong `dichvu/src/`: `App.jsx`, `main.jsx`, `index.css`, `pages/GiuChoVaiTro.jsx`, `components/HopThoaiXacNhan.jsx`, `components/HuyHieuTrangThai.jsx`. Bỏ bản thông báo trùng tại `pages/nhan-vien/ChamSoc.jsx` và `pages/le-tan/QuanLyLichHen.jsx` vì đã có ở shell.

Tooling: `dichvu/eslint.config.js`, `dichvu/package.json`, lockfile, `dichvu/test/ui-foundations.test.js`. Tài liệu: báo cáo này, kế hoạch chuẩn, nhật ký, ma trận và đặc tả DS.

## 3. UI và API

Không thêm/sửa API, schema, middleware, payload hoặc thuật toán. Shell dùng `useAuth`/logout và `ThongBao` hiện có (`GET /api/thong-bao`, `PATCH /api/thong-bao/:id/da-doc`). Các trang nghiệp vụ giữ API cũ. Bản in hóa đơn/hoàn tiền đứng ngoài shell; guards giữ nguyên.

Menu care chỉ có chăm sóc, lễ tân có tiếp nhận/tài chính; quản lý thêm ca/dịch vụ/báo cáo; Admin thêm tài khoản, không có chăm sóc. Ẩn menu không thay middleware kiểm quyền.

Component Lab ở `/#/__ui` chỉ trong Vite development; không gọi API nghiệp vụ và ghi rõ là mẫu component. Production build không có route/lazy chunk/nội dung lab (kiểm tra output build). Không dùng dữ liệu mẫu này làm bằng chứng hoàn thành dashboard.

## 4. Kiểm thử và phân quyền

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| `cd dichvu; npm run lint` | PASS | ESLint recommended correctness; chưa có React hooks/a11y plugin; no-unused-vars tắt vì chưa có JSX reference plugin |
| `cd dichvu; npm test` | PASS 20/20 | 14 hồi quy cũ + 6 nhóm menu/trạng thái mới, không coi là React E2E tự động |
| `cd dichvu; npm run build` | PASS, 77 modules | Không có lab trong JS production |
| `cd server; npm test` | PASS 67, SKIP 9 | Không chạy lại 9 nhóm HTTP tự động; không gộp thành PASS |
| Browser: đăng nhập đủ 5 nhóm | PASS | API thật trên DB test riêng, không dùng mật khẩu/dữ liệu thật |
| Care → Admin, lễ tân → Admin, khách → nhân sự | PASS | Guard chuyển về trang đúng quyền; backend RBAC unit giữ PASS |
| Care tải lịch/ca; lễ tân xem hóa đơn rỗng; Admin mở quản lý tài khoản | PASS | Chỉ đọc; chưa chạy lại thu tiền/hoàn/khóa tài khoản trong đợt này |
| Modal/drawer: Tab, Shift+Tab, Escape, busy, restore focus/scroll | PASS sau sửa | Chromium trong trình duyệt ứng dụng; chưa kiểm trên Safari/Firefox |
| Field label/aria-invalid/describedby, disabled/pending, toast lỗi/đóng | PASS browser | Lỗi giữ hiện đến khi đóng; thông báo thành công mẫu không có ghi dữ liệu |
| Diff | PASS | Không đổi `.env`, DB thật, production hoặc main |

QA dùng DB mới `petcare_test_emerald_20261024b`, cluster riêng cổng55439, API5001/frontend5181. Có tạo demo/ca/lịch trong DB test này; không thêm ca vào DB người dùng. Lỗi proxy khởi động ban đầu đã được xử lý bằng Vite test riêng trước khi kiểm thử đăng nhập đạt. Không gọi lỗi thiết lập QA này là lỗi đăng nhập của dữ liệu thật.

## 5. Responsive

| Viewport | Kết quả đã quan sát |
| --- | --- |
| 375×812 | PASS shell/home care, menu drawer và điều hướng tự đóng; lab/form/modal/toast không tràn ngang; scrollWidth = clientWidth |
| 768×1024 | PASS shell/home quản lý và menu lễ tân thu gọn; lab 2 cột, modal vừa viewport; không tràn ngang |
| 1440×900 | PASS sidebar cố định, home quản lý 3 cột; care desktop; lab 2 cột, không tràn ngang |

Ảnh QA local trong `.cache/local-run/emerald-*.png`, không commit artifact thử nghiệm. Đây là nghiệm thu shell/home/component mới; **không** suy ra toàn bộ bảng/form cũ đã đạt responsive. Admin nội dung tài khoản còn nền tối, dashboard thật, PetCard, Wizard, Calendar, BillingSummary và DataTable/filter sẽ làm đúng đợt 2–5. Hồi quy toàn hành trình và responsive mọi màn hình là đợt 6. Docker runtime và ngân hàng thật vẫn theo trạng thái cũ.
