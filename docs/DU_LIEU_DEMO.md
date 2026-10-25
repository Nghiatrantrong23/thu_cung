# Dữ liệu demo để thử PetCare

## Bộ tài khoản mới đang chạy — 25/10/2026

Web vẫn là http://127.0.0.1:5181/ ; API 5001. DB đang dùng: `petcare_test_demo_accounts_20261025001704` trên cụm test 55439. Bộ này thay bộ 7 tài khoản trước theo yêu cầu người dùng, gồm **18 tài khoản hoạt động**:

| Nhóm | Tên đăng nhập | Số lượng |
| --- | --- | --- |
| Chăm sóc | `chamsoc01` đến `chamsoc05` | 5 |
| Lễ tân | `letan01` đến `letan05` | 5 |
| Quản lý | `quanly01`, `quanly02` | 2 |
| Khách | `khach01` đến `khach05` | 5 |
| Admin giữ nguyên | `demo_admin` | 1 |

Mật khẩu demo mới được gửi trong tin nhắn bàn giao, không lưu trong source. Mật khẩu và toàn bộ các trường tài khoản Admin được đối chiếu giữ nguyên. Các tên cũ `demo_quanly`, `demo_letan`, `demo_chamsoc1`, `demo_chamsoc2`, `demo_khach`, `demo_khoa` không có trong DB đang dùng và đăng nhập trả 401.

Có sẵn 5 hồ sơ khách, mỗi khách 1 thú cưng; 5 nhân viên chăm sóc, mỗi người 7 ca 08:00–19:00 (35 ca); giữ danh mục 3 dịch vụ. Lịch hẹn/hóa đơn/khiếu nại bắt đầu trống cho các tài khoản mới, không gán lịch sử người cũ sang người mới. Bản chính 5173, `.env`, API/kiến trúc/phân quyền không đổi.

Database cũ được giữ riêng làm bản lưu; thêm file backup `.cache/demo/truoc-thay-tai-khoan-20261025.dump` đã kiểm tra danh sách archive bằng pg_restore. Không công khai backup lên GitHub. Không xóa vật lý bản lưu. Chỉ bộ mới được phục vụ trên 5181.

Kiểm tra bộ mới: 18 đăng nhập thành công qua proxy frontend; 6 tên cũ bị từ chối; 5 khách thấy đúng thú cưng của mình; API lịch/ca/hóa đơn tải được theo quyền; khách và quản lý không truy cập được API Admin. Ba kiểm tra an toàn của tooling PASS. Không chạy lại build frontend vì lần này chỉ thay dữ liệu/tooling.

Mở lại bộ mới:

```powershell
cd D:\dich_vu_thu_cung\server
$env:NODE_ENV='test'
$env:DATABASE_URL='postgres://petcare_test@127.0.0.1:55439/petcare_test_demo_accounts_20261025001704'
$env:PETCARE_ALLOW_DB_WRITE='petcare_test_demo_accounts_20261025001704'
npm run demo:start
```

Lệnh `npm run db:demo-accounts` chỉ chuẩn bị bộ mới trên DB chưa có schema. Ngoài 3 biến target bên trên, cần `DEMO_SOURCE_DATABASE_URL` và `DEMO_SOURCE_DATABASE` trỏ cùng cụm test đến bản demo trước, cùng `PETCARE_DEMO_PASSWORD` (nhập kín như ví dụ bên dưới). Không dùng lại tên DB target đang có dữ liệu. Nguồn được mở trong transaction READ ONLY; script không DELETE/TRUNCATE/DROP. Manifest không chứa mật khẩu nằm trong `.cache/demo/<database>.json`.

## Bản 7 tài khoản trước — đã lưu riêng, không còn chạy trên 5181

- Web: http://127.0.0.1:5181/ ; API: http://127.0.0.1:5001/ready .
- PostgreSQL test riêng: `127.0.0.1:55439`, DB `petcare_test_demo_20261024235410`.
- Không đổi `.env`, database hiện tại, proxy hay ứng dụng trên 5173/5000. Dữ liệu demo không xuất hiện ở web 5173.
- 7 tài khoản: `demo_khach`, `demo_chamsoc1`, `demo_chamsoc2`, `demo_letan`, `demo_quanly`, `demo_admin`, `demo_khoa` (bị khóa).
- Mật khẩu demo được cung cấp trong tin nhắn bàn giao; không lưu trong mã nguồn. Chỉ dùng cho bộ dữ liệu giả này.
- 2 thú cưng, 3 dịch vụ, 14 ca làm cho 2 nhân viên trong 7 ngày kể từ ngày tạo (08:00–19:00), 17 lịch, 8 hóa đơn, 7 khiếu nại, 1 đánh giá; có thông báo và nhật ký thật do API sinh ra.

## Các tình huống có sẵn

ID dưới đây chỉ áp dụng cho bản DB trên. Bản mới ghi mapping thật vào `.cache/demo/<database>.json` (không chứa mật khẩu/token).

| Vai trò | Màn hình / dữ liệu để thử |
| --- | --- |
| Khách | Tổng quan, hồ sơ 2 thú cưng, đặt lịch còn ca, timeline nhiều trạng thái, 8 hóa đơn. Lịch #4 có đánh giá 5 sao; các lịch hoàn thành khác có thể đánh giá. |
| Chăm sóc 1 | Ngày 25/10: lịch #10 đang làm dịch vụ, có thể cập nhật hoàn thành từng dịch vụ rồi hoàn tất lịch. Có 9 lịch đã hoàn thành để xem lịch sử. |
| Chăm sóc 2 | Ngày 25/10: lịch #11 đã báo không đủ điều kiện; lễ tân có thể hủy hoặc đổi lịch, sau đó phân công lại. |
| Lễ tân | Ngày 26/10: #12 chờ duyệt, #13 đã phân công, #14 giữ chờ, #15 khách hủy, #16 bị từ chối. Ngày 28/10: #17 đã đổi lịch, chờ phân công lại. |
| Lễ tân — hóa đơn | Lịch #1 hoàn thành nhưng chưa lập hóa đơn. HĐ #1 chưa thu; #2 mới thu 50.000/150.000; #3 đã thu đủ qua hai lần thu; #4 hoàn 50.000/150.000; #5 hoàn đủ. |
| Lễ tân — thực chi | KN #3 chờ chi 50.000; KN #4 có lần chi thất bại, vẫn chờ chi 50.000. Chỉ xác nhận thực chi trong bản demo; không thực hiện chuyển tiền thật. |
| Quản lý | KN #6 mới tiếp nhận để ra quyết định; #5 đã khắc phục không hoàn; #7 đã từ chối. Xem/sửa ca, danh mục, báo cáo. |
| Admin | Danh sách 7 tài khoản đủ 5 nhóm quyền, gồm tài khoản khóa; thử quản trị theo quyền hiện có. Không có quyền thao tác chăm sóc thay nhân viên. |

Kỳ báo cáo ngày 25/10/2026: thu thành công **950.000**, hoàn thực chi **200.000**, thực thu **750.000 đồng**. Hai khoản mới duyệt đang chờ chi không bị trừ. Khi bạn thử ghi thêm giao dịch, các số này sẽ thay đổi theo thao tác.

## Tạo bộ mới khi cần

Cần PostgreSQL test chạy trước, đã cài dependencies ở `server` và `dichvu`. Ví dụ với cụm test hiện có:

```powershell
& 'D:\posgresql\bin\pg_ctl.exe' status -D 'D:\dich_vu_thu_cung\.cache\petcare-test-db\data'
# Chỉ nếu cụm TEST trên chưa chạy:
& 'D:\posgresql\bin\pg_ctl.exe' start -D 'D:\dich_vu_thu_cung\.cache\petcare-test-db\data' -o '-p 55439 -h 127.0.0.1' -l 'D:\dich_vu_thu_cung\.cache\petcare-test-db\server.log' -w

cd D:\dich_vu_thu_cung\server
$taskDemoDb = 'petcare_test_demo_' + (Get-Date -Format 'yyyyMMddHHmmss')
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'postgres://petcare_test@127.0.0.1:55439/' + $taskDemoDb
$env:PETCARE_ALLOW_DB_WRITE = $taskDemoDb
$taskPassword = Read-Host 'Mật khẩu riêng cho tài khoản DEMO (ít nhất 12 ký tự)' -AsSecureString
$env:PETCARE_DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', $taskPassword).Password
npm run db:demo
if ($LASTEXITCODE -ne 0) { throw 'Tạo demo chưa thành công; xem lỗi, không chạy reset hoặc xóa DB.' }
Remove-Item Env:PETCARE_DEMO_PASSWORD
npm run demo:start
```

Giữ cửa sổ cuối chạy khi dùng web. `Ctrl+C` dừng runtime demo, không xóa database. Nếu cổng bận, dùng `DEMO_API_PORT` / `DEMO_WEB_PORT` là hai cổng khác, hoặc dừng đúng runtime demo cũ; không tắt mọi tiến trình Node/PostgreSQL.

Để mở lại **bộ hiện tại**, đặt lại 3 biến `NODE_ENV=test`, `DATABASE_URL` trỏ đúng DB demo, `PETCARE_ALLOW_DB_WRITE` bằng đúng tên DB và chạy `npm run demo:start`. Không cần tạo/seed lại hay đặt mật khẩu. Phiên đăng nhập cũ cần đăng nhập lại khi API khởi động lại.

Script `db:demo` chỉ nhận tên `petcare_test_demo_<hậu tố>`, môi trường test và loopback, bắt buộc opt-in đúng tên DB, **từ chối schema đã có dữ liệu**. Không reset/xóa/ghi đè. Nếu bước tạo lỗi giữa chừng, giữ DB đó để rà soát và dùng tên mới. Bootstrap migration/tài khoản/danh mục/ca qua tooling đã có; tất cả trạng thái lịch, chăm sóc, hóa đơn, thu/hoàn, đánh giá qua HTTP thật. Đồng hồ cố định chỉ dùng trong tiến trình tạo fixture, kết thúc ngay sau đó. `demo:start` dùng đồng hồ thật.

Ngày thử nghiệm là ngày Việt Nam lúc tạo. Khi chuyển sang ngày khác, chọn lại bộ lọc lịch/ca để xem dữ liệu cũ; muốn chăm sóc lịch hôm nay, tạo bộ demo mới hoặc đặt/phân công lịch mới trong ca còn hiệu lực.

## Kiểm tra đã thực hiện

- Backend mặc định: 67 PASS; 9 nhóm tích hợp skip khi không truyền DB. Chín nhóm đã chạy riêng trên 9 DB mới: **83 PASS, 0 FAIL, 0 SKIP**.
- Kiểm tra bổ sung guard demo: **1 PASS**. Chạy lại `db:demo` trên DB đã có bị từ chối; đối chiếu sau đó vẫn 17 lịch / 8 hóa đơn / 7 khiếu nại.
- Frontend: **20 PASS**, lint PASS, build PASS (97 modules).
- Bộ demo: đăng nhập API 6 tài khoản hoạt động, tạo toàn bộ tình huống qua HTTP thành công, assert số liệu thu/hoàn/thực thu.
- Trình duyệt: đăng nhập khách, nhân viên chăm sóc, lễ tân, quản lý và Admin; khách thấy timeline/hóa đơn/giờ trống; chăm sóc thấy lịch được giao; lễ tân xem chi tiết lần hoàn thất bại còn chờ chi; quản lý xem báo cáo đúng 950.000 / 200.000 / 750.000. Đây là kiểm tra các màn hình chính, chưa phải thao tác mọi nút trên mọi kích thước màn hình.

## Giới hạn hiện có

VietQR nhận tiền chưa cấu hình; không có chuyển tiền ngân hàng tự động. Quên mật khẩu vẫn chưa có email/OTP. API tạo khiếu nại hiện chỉ cho lễ tân/nhóm có quyền tiếp nhận; khách xem được trạng thái, chưa có luồng tự gửi. Bộ dữ liệu không tự bổ sung các chức năng này. Chưa nghiệm thu Docker hay toàn bộ UI trên mọi thiết bị; không đánh dấu toàn bộ dự án đã hoàn tất.
