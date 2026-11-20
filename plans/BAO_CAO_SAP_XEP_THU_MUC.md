# Rà soát và sắp xếp thư mục PetCare

## Dọn gọn ngày 20/11/2026

- Nhánh riêng: `codex/don-gon-thu-muc-20261120`, tách từ `75ee4c9`; không làm việc trên main.
- Gom 23 file sơ đồ/mẫu từ bốn thư mục gốc vào `docs/so-do/man-hinh/`, `hoat-dong/`, `trang-thai-va-lop/`, `tuan-tu/`. Nội dung 23 file này giữ nguyên từng byte; cập nhật liên kết hình trong báo cáo để dùng đường dẫn tương đối.
- Chuyển `TIEN_DO_GIAO_DIEN.md` và `TIEN_DO_ADMIN_PETCARE.md` vào `plans/`. File Admin vốn chưa theo dõi và có quy tắc lưu riêng nên chỉ chuyển cục bộ, giữ nguyên nội dung, không tự đưa vào commit này.
- Xóa `thu.sql` chưa theo dõi sau khi xác nhận trùng SHA-256 với `thu_cung.sql`; schema chuẩn và migrations không đổi.
- Xóa build `frontend/dist/`, cache `frontend/node_modules/.vite/`, Python bytecode và bản xuất kiểm tra Git cũ `.cache/restructure-frontend-backend/staged-check/`: tổng 272 file trùng/sinh tự động, khoảng 6,97 MiB. Hai junction dependencies trong bản xuất cũ được tháo riêng trước khi xóa; hai thư mục dependencies thật vẫn còn. Bản build tạo lại khi xác minh cũng được dọn sau kiểm tra.
- Thêm `.petcare-worktree/` vào Git/Docker ignore. Giữ worktree, dữ liệu PostgreSQL trong cache, backups, `.env`, dependencies, nguồn nghiên cứu, ảnh minh chứng và các thay đổi tính năng đang làm. Các bản lưu trước sửa cùng log kiểm tra của đợt này ở `.cache/cleanup-20261120/`, không đưa vào Git.

| Kiểm tra workspace sau sắp xếp | Kết quả |
| --- | --- |
| Đối chiếu file chuyển chỗ | 24 file giữ nguyên byte (23 sơ đồ/mẫu và tiến độ Admin); tiến độ giao diện chỉ đổi đường dẫn mẫu |
| Liên kết Markdown nội bộ | 328 liên kết hợp lệ, không phát sinh liên kết hỏng |
| Hash schema `thu_cung.sql` | Giữ nguyên SHA-256 `a12e398a02db473328204e9a3f05a9bfc818327be43925ae97bdb345fddd76ae` |
| Frontend lint / test / build | PASS / 31 PASS / PASS, 118 modules |
| Backend test mặc định, không có `TEST_DATABASE_URL` | 83 PASS, 1 FAIL, 13 SKIP; lỗi import thiếu package `xlsx` trong phần Excel đang làm, không liên quan file được dọn |

Không sửa package, mã nghiệp vụ hoặc file test để xử lý lỗi Excel ngoài phạm vi. Không gọi backend hoặc toàn dự án đã nghiệm thu. Không chạy migrate/seed, SMTP thật hoặc test ghi database. Kết quả frontend là kết quả workspace hiện có; snapshot Git vẫn có giới hạn các file tính năng chưa theo dõi đã nêu ở biên bản 07/11 bên dưới. Commit chỉ chứa việc sắp xếp và tài liệu liên quan, không kèm thay đổi tính năng có trước; không thay trạng thái giai đoạn 12.

## Đợt chuyển frontend/backend — 07/11/2026

## Phạm vi

- Nhánh làm việc: `codex/sap-xep-frontend-backend`, tách từ commit `6eeb118`.
- Đổi `dichvu/` thành `frontend/`, `server/` thành `backend/` trong workspace chính `D:/dich_vu_thu_cung`.
- Cập nhật Dockerfile, `compose.yaml`, đường dẫn nạp Vite trong `backend/scripts/start-demo.js` và các đường dẫn trong tài liệu. Tên entry point `backend/src/server.js`, các route dịch vụ và lệnh npm được giữ nguyên.
- Schema gốc và `migrations/` giữ ở thư mục gốc; DB CLI tiếp tục tìm nguồn qua đường dẫn tương đối hai cấp. Không sửa nội dung SQL, không chạy migrate/seed.
- Không tổ chức lại các module nghiệp vụ hoặc chuyển các tài liệu/sơ đồ trong đợt này.

## File đã dọn

Các đường dẫn cũ được ghi để đối chiếu Git. Đã rà import tĩnh/động, tham chiếu trong mã nguồn, cấu hình, test và tài liệu trước khi xóa.

| Đường dẫn cũ | Lý do |
| --- | --- |
| `dichvu/src/pages/DangPhatTrien.jsx` | Trang ComingSoon không có route hoặc import gọi đến. Trang tổng quan `GiuChoVaiTro.jsx` vẫn được dùng và giữ lại. |
| `dichvu/src/constants/roles.js` | Không có import; nhãn vai trò hiện dùng `lib/tienIchXacThuc.js` và điều hướng dùng `lib/staffNavigation.js`. |
| `dichvu/src/constants/status.js` | Không có import; trình bày trạng thái hiện dùng `lib/statusPresentation.js` và các helper nghiệp vụ. Tài liệu ma trận cũ còn nhắc file này như ghi nhận lịch sử. |
| `server/seed-dich-vu.js` | Script seed cũ không có lệnh npm/tham chiếu; bộ `backend/scripts/seed.js` hiện tại cung cấp seed có kiểm tra DB và được kiểm thử. |
| `server/seed-lich-hen.js` | Script ghi lịch mẫu với ID/ngày cố định không được gọi; dữ liệu demo hiện có bộ script riêng và cơ chế từ chối DB không phù hợp. |
| `dichvu/src/assets/hero.png` | Ảnh hero cũ không còn tham chiếu; trang Tổng quan đang import hai banner riêng. |
| `dichvu/src/assets/vite.svg` | Ảnh mẫu Vite không còn được import. |
| `dichvu/public/icons.svg` | Sprite mẫu không còn tham chiếu từ JSX, CSS hoặc HTML. |
| `dichvu/public/favicon.svg` | Favicon mẫu không còn được khai báo hoặc tham chiếu. |
| `Banner_1.png`, `Banner_2.jpg` ở gốc | Bản sao trùng hoàn toàn SHA-256 với `frontend/src/assets/banner1.png` và `banner2.jpg`; hai assets được trang Tổng quan import vẫn giữ nguyên. Hai bản ở gốc vốn untracked. |

Thư mục `codex/` và thư mục `frontend/src/constants/` được bỏ sau khi xác nhận rỗng. Không xóa `backups/`, `.cache/`, file `.env`, template thanh toán cục bộ, các sơ đồ, test, script chạy thủ công hoặc tài nguyên còn được dùng.

## Bảo toàn thay đổi hiện có

- Trước sửa đã lưu danh sách file, nội dung tracked/untracked, diff và hash trong `.cache/restructure-frontend-backend/` (bị Git bỏ qua).
- Nội dung các file hiện có sau chuyển được đối chiếu với bản trước sửa, chỉ chấp nhận thay đường dẫn, bổ sung ghi nhận trong kế hoạch/README và danh sách xóa đã rà.
- Hash `backend/.env` giữ nguyên. Template thanh toán chỉ đổi đường dẫn trong comment, giữ nguyên các giá trị mẫu trống. Không in giá trị cấu hình thật hoặc đưa file bí mật/dependencies/build/backup vào Git.
- Index của commit sắp xếp được dựng từ nội dung commit nền cùng các phép đổi đường dẫn và tài liệu của đợt này. Các thay đổi UI, API, package, mật khẩu/email, migration 008 đã có trước phiên vẫn ở workspace và chưa được đưa vào commit sắp xếp.

## Kiểm tra trên workspace sau sắp xếp

| Kiểm tra | Kết quả |
| --- | --- |
| `frontend`: `npm.cmd run lint` | PASS |
| `frontend`: `npm.cmd test` | 31 PASS, 0 FAIL |
| `frontend`: `npm.cmd run build` | PASS, 118 modules |
| `backend`: `npm.cmd test`, bỏ TEST_DATABASE_URL khỏi môi trường kiểm tra | 83 PASS, 0 FAIL, 13 nhóm tích hợp SKIP |
| Đối chiếu nội dung và hash cấu hình cục bộ | PASS |
| Rà đường dẫn cũ trong nguồn/cấu hình/tài liệu đang dùng | PASS; tên cũ chỉ giữ trong ghi nhận chuyển đổi/lịch sử xóa |

Không tính các nhóm SKIP là đã nghiệm thu tích hợp. Không khởi động backend với DB thật, không gửi SMTP thật, không kiểm thử giao dịch trên dữ liệu đang dùng. Docker không có trên máy nên chỉ kiểm tra tĩnh đường dẫn Compose/COPY/WORKDIR; chưa build/run container.

## Giới hạn snapshot Git có sẵn

Commit nền `6eeb118` đã import `pages/KhoiPhucMatKhau.jsx` trong `src/App.jsx`, nhưng trang này và các file hỗ trợ khôi phục mật khẩu còn untracked. Workspace hiện có các file đó nên build đạt. Commit chỉ sắp xếp thư mục không tự đưa tính năng quên mật khẩu đang làm dở vào Git.

Vì vậy kết quả build workspace ở trên không chứng minh clone riêng snapshot Git đã đủ file để build. Phần thiếu từ commit nền cần được nghiệm thu và lưu trong đợt tính năng tương ứng. Không thay trạng thái hoàn thành giai đoạn 12 từ kết quả sắp xếp này.

Đã xuất riêng nội dung index sang `.cache/restructure-frontend-backend/staged-check/`, chỉ liên kết dependencies hiện có và không chép `.env`:

- Backend snapshot: **80 PASS, 0 FAIL, 12 tích hợp SKIP**. Ba test email và nhóm tích hợp reset của workspace thuộc phần tính năng cũ chưa stage nên không nằm trong số này.
- Frontend snapshot: **build chưa đạt**, lỗi `Could not resolve "./pages/KhoiPhucMatKhau.jsx" from "src/App.jsx"`. Kiểm tra `git cat-file -e HEAD:dichvu/src/pages/KhoiPhucMatKhau.jsx` xác nhận file cũng thiếu ở commit nền; không phải file bị dọn trong đợt này. File đang dùng trên máy vẫn còn tại `frontend/src/pages/KhoiPhucMatKhau.jsx`.
- Kiểm tra tĩnh các đường dẫn Dockerfile của Compose và nguồn COPY trong hai Dockerfile: **PASS**. `git diff --cached --check`: **PASS**.

Chỉ xác nhận việc đổi cấu trúc và dọn file trong workspace; chưa xác nhận snapshot Git độc lập sẵn sàng đóng gói. Các sửa tính năng có sẵn vẫn được giữ nguyên để tiếp tục hoàn thiện và lưu riêng.
