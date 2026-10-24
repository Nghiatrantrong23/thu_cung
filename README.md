# PetCare — quản lý và đặt lịch chăm sóc thú cưng

React 18/Vite/Tailwind; Node.js/Express/pg; PostgreSQL 17 + btree_gist. Giữ kiến trúc dự án hiện có.

## Tiến độ và giới hạn hiện tại

Đã triển khai đến giai đoạn 11; đang nghiệm thu/đóng gói giai đoạn 12. API và chuỗi nghiệp vụ đạt trên DB test cô lập; không triển khai production. [Kế hoạch chuẩn](plans/ke_hoach_tong_the.md), [báo cáo kiểm thử](plans/BAO_CAO_KIEM_THU_HE_THONG.md), [API](docs/API.md).

**DB local cũ chưa nâng cấp; bản sao đã được backup/restore, so schema và thử migration 002–005 thành công.** Dữ liệu cột cũ giữ nguyên qua kiểm tra hash; xem báo cáo kiểm thử. Không chạy lại `thu_cung.sql`, không chạy seed/test vào DB đang dùng. Backend mới trả 503 `MIGRATION_REQUIRED` khi schema chưa sẵn sàng. `/health` chỉ kiểm tra tiến trình; `/ready` kiểm tra DB và migration 000–005. DB gốc và `server/.env` chưa thay đổi; chưa tự áp baseline hoặc chuyển môi trường chạy sang bản sao.

VietQR chưa cấu hình theo lựa chọn người dùng; thu tiền mặt và ghi nhận chuyển khoản đã nhận hoạt động. Không có chuyển tiền tự động, email/SMS hay hóa đơn điện tử thuế. Quên mật khẩu còn là trang chờ.

## Cài đặt và chạy trên Windows

Cần Node >=20 (đã test Node 24), npm và PostgreSQL local. Hai terminal dùng cùng cấu hình database phát triển; tuyệt đối không dùng database production.

```powershell
Set-Location D:\dich_vu_thu_cung\server
npm.cmd ci

Set-Location D:\dich_vu_thu_cung\dichvu
npm.cmd ci
```

Nếu tạo môi trường mới: tại `server`, thiết lập database **riêng** và nhập mật khẩu kín. DB CLI không tự đọc `.env`. Nếu môi trường shell đã có `DATABASE_URL`, cần thay nó bằng URL của DB riêng hoặc bỏ biến đó trong terminal này để dùng `DB_*` dưới đây.

```powershell
Set-Location D:\dich_vu_thu_cung\server
$env:NODE_ENV = 'development'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '5432'
$env:DB_USER = 'postgres'
$env:DB_NAME = 'petcare_dev'
$env:PETCARE_ALLOW_DB_WRITE = $env:DB_NAME
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu PostgreSQL' -AsSecureString)).Password
$env:PETCARE_DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu demo riêng, ít nhất 12 ký tự' -AsSecureString)).Password
npm.cmd run db:setup
```

`db:setup` chỉ thêm seed demo có dấu hiệu nhận biết, không ghi đè mật khẩu cũ; `db:reset` luôn từ chối. Nếu database có bảng nhưng không có lịch sử, dừng và đối chiếu trước. Xem [DB CLI](server/scripts/README.md).

Tạo `server/.env` từ [mẫu](server/.env.example) **chỉ nếu chưa có**, nhập cấu hình DB dev tương ứng và JWT secrets riêng trong editor. Không ghi đè `.env` hiện tại bằng lệnh Copy-Item. Các biến shell được ưu tiên hơn `.env`; không in mật khẩu/JWT hoặc commit file này.

Terminal backend (tại `server`):

```powershell
npm.cmd run dev
```

Terminal frontend (tại `dichvu`):

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở [đăng nhập](http://localhost:5173/#/dang-nhap). Vite proxy `/api` sang backend 5000. Kiểm tra trực tiếp:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/ready
```

Tài khoản seed: `demo_admin`, `demo_quanly`, `demo_letan`, `demo_chamsoc1`, `demo_chamsoc2`, `demo_khach`; `demo_khoa` bị khóa. Mật khẩu là giá trị bạn đã nhập ở bước seed. Seed không tạo lịch hẹn cố định. Trang nhân sự có liên kết đúng vai trò đến ca, chăm sóc, điều phối, tài chính và báo cáo.

## Kiểm thử

```powershell
Set-Location D:\dich_vu_thu_cung\server
npm.cmd test
Set-Location D:\dich_vu_thu_cung\dichvu
node --test test/*.test.js
npm.cmd run build
```

Backend mặc định: 67 PASS và 9 nhóm tích hợp skip khi không có `TEST_DATABASE_URL`. Các nhóm tích hợp phải chạy **mỗi file trên DB test mới riêng**, không chạy toàn bộ npm test với một URL chung. [Lệnh và điều kiện](server/test/README.md). Bản nghiệm thu: 83 test tích hợp PASS, frontend 13 PASS, build 71 modules. Không dùng dữ liệu thật hoặc tài khoản thật để kiểm thử thu/hoàn.

## Docker local

Có [compose.yaml](compose.yaml), hai Dockerfile và Nginx. **Chưa nghiệm thu build/run container vì máy hiện tại không có Docker.** Đây là cấu hình local, không phải triển khai production. Volume mới `petcare-local_petcare_data`, không mount dữ liệu PostgreSQL đang dùng. Chỉ web bind loopback 8080; DB/API không publish ra host.

Khi đã có Docker Desktop/Engine, nhập biến riêng trong PowerShell; không in kết quả `docker compose config` chứa secrets, dùng `--quiet`:

```powershell
$env:PETCARE_DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu DB Docker' -AsSecureString)).Password
$env:PETCARE_JWT_SECRET = [System.Net.NetworkCredential]::new('', (Read-Host 'JWT secret riêng, chuỗi ngẫu nhiên dài' -AsSecureString)).Password
$env:PETCARE_JWT_REFRESH_SECRET = [System.Net.NetworkCredential]::new('', (Read-Host 'Refresh secret khác access secret' -AsSecureString)).Password
Set-Location D:\dich_vu_thu_cung
docker compose config --quiet
docker compose up --build -d
Invoke-RestMethod http://localhost:8080/ready
```

Migrate là service một lần, dùng chung networking với DB để giữ nguyên kiểm tra loopback của DB CLI. Muốn seed demo riêng sau migrate, không truyền mật khẩu demo trên command line:

```powershell
$env:PETCARE_DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mật khẩu demo riêng, ít nhất 12 ký tự' -AsSecureString)).Password
docker compose run --rm -e PETCARE_DEMO_PASSWORD migrate npm run db:seed
```

Mở `http://localhost:8080/#/dang-nhap`. `docker compose stop` chỉ dừng; không dùng `down -v`, `volume rm` hoặc reset. Các lệnh Docker trên là hướng dẫn chưa chạy kiểm chứng trong phiên này.

## Sao lưu và lưu code

Git chỉ lưu source/tài liệu, không chứa dữ liệu PostgreSQL. Backup riêng vào `backups/` bị gitignore; nhập thông tin kết nối qua môi trường riêng, không viết mật khẩu vào lệnh:

```powershell
# Chỉ sau khi đã xác định rõ DB cần sao lưu và đã đặt PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD kín.
New-Item -ItemType Directory -Force -Path D:\dich_vu_thu_cung\backups | Out-Null
$taskBackup = 'D:\dich_vu_thu_cung\backups\petcare_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.dump'
pg_dump --format=custom --file=$taskBackup
pg_restore --list $taskBackup
```

Kiểm tra exit code và thử restore vào **DB mới khác tên**, không `--clean`/ghi đè DB đang dùng. Đợt này đã nghiệm thu backup/restore, so schema và baseline/migration trên **bản sao** DB local cũ; DB gốc chưa đổi. Không tự chuyển đổi timestamp/hoàn tiền lịch sử nếu chưa đối soát nguồn dữ liệu.

Sau giai đoạn đạt: cập nhật kế hoạch, commit/push lên nhánh công việc riêng và đối chiếu SHA của đúng nhánh remote theo [AGENTS.md](AGENTS.md). Không push trực tiếp lên main; chỉ đưa thay đổi vào main khi người dùng yêu cầu rõ. Không force-push, không công khai `.env`, dump, token, log hoặc build.
