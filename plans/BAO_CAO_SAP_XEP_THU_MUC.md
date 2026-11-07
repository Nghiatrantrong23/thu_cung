# Rà soát cấu trúc frontend/backend — 07/11/2026

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
