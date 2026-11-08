# Hồ sơ kiểm thử phục vụ báo cáo cuối kỳ

Ngày khảo sát: 08/11/2026. **Không chạy test ứng dụng/DB trong Giai đoạn 0**; đây là đối chiếu testcase và biên bản đã có. Không gán PASS mới từ việc tìm thấy file. Mã nguồn test đang ở workspace có thay đổi chưa commit.

## Các mốc có biên bản

| Mốc/phạm vi | Kết quả ghi nhận | Nguồn và giới hạn |
|---|---|---|
| API/hành trình 23–24/10/2026 | 9 nhóm tích hợp trên DB cô lập: 83 PASS, 0 FAIL; mặc định 67 PASS và 9 nhóm SKIP | [Biên bản](../../plans/BAO_CAO_KIEM_THU_HE_THONG.md); trạng thái lịch sử, chưa bao gồm mọi phần bổ sung sau đó |
| Cọc 25/10/2026 | 9 nhóm tích hợp: 86 PASS, 0 FAIL, 0 SKIP | [Đặt cọc](../DAT_COC_VA_HUY_LICH.md); không phải số tổng của workspace hiện tại |
| Chuyển khoản thủ công 25/10/2026 | Transfers 9 + invoices 8 + deposits 12 + sandbox 9 = 38 PASS, 0 FAIL, 0 SKIP | [Chuyển khoản](../THANH_TOAN_CHUYEN_KHOAN.md); 4 DB mới riêng, không chuyển tiền thật |
| Quên mật khẩu 25/10/2026 | HTTP reset + SMTP loopback 13 PASS; hồi quy auth 10 PASS | [SMTP](../QUEN_MAT_KHAU_MAILTRAP.md); Mailtrap thực tế BLOCKED thiếu cấu hình đầy đủ |
| Khiếu nại khách 05/11/2026 | Nhóm refunds 9 PASS trên DB test, có gửi lặp tuần tự/đồng thời | [Tiến độ](../../plans/TIEN_DO_KHIEU_NAI_KHACH_HANG.md); UI ba viewport còn thiếu |
| Workspace 07/11/2026 | Backend 83 PASS, 0 FAIL, 13 nhóm tích hợp SKIP; frontend 31 PASS, lint và build 118 modules PASS | [Sắp xếp](../../plans/BAO_CAO_SAP_XEP_THU_MUC.md); không nghiệm thu 13 nhóm SKIP |
| Ghi nhận 08/11/2026 về khiếu nại | Frontend lint, 31 test và build 118 modules PASS theo tiến độ | [Tiến độ](../../plans/TIEN_DO_KHIEU_NAI_KHACH_HANG.md); không do lượt khảo sát này chạy; chưa QA ba viewport |

Không cộng các lần chạy chồng nhau thành tổng 83 + 86 + 38 + 13. Parent test và subtest của node:test cũng phải dùng cùng quy ước đếm trong một lần thực thi. Biên bản là bằng chứng lịch sử; chưa đối chiếu log raw từng case ở Giai đoạn 0.

## Testcase thực tế đã định vị

Tên dưới đây lấy từ mã test, không phải ca thử do người viết báo cáo tự tạo. Cột kết quả chỉ nhận diện biên bản cấp nhóm, không xác nhận case vừa chạy.

| Mã hồ sơ | Case trong mã | Vị trí | Kết quả được phép nêu |
|---|---|---|---|
| KT-01 | two requests for the final slot yield exactly one 201 and one 409 | `backend/test/booking.integration.test.js:125` | Nhóm booking có PASS lịch sử 23–24/10; chưa chạy lại |
| KT-02 | a day without care shifts has no slots and rejects booking | `backend/test/booking.integration.test.js:133` | Nhóm booking có PASS lịch sử; chưa chạy lại |
| KT-03 | strict validation and customer ownership are enforced through HTTP | `backend/test/booking.integration.test.js:144` | Nhóm booking có PASS lịch sử; chưa chạy lại |
| KT-04 | forced detail INSERT failure rolls back ALL records and exposes no diagnostics | `backend/test/booking.integration.test.js:169` | Nhóm booking có PASS lịch sử; chưa chạy lại |
| KT-05 | single booking concurrent rejection and assignment cannot both succeed | `backend/test/dispatch.integration.test.js:227` | Nhóm dispatch có PASS lịch sử; chưa chạy lại |
| KT-06 | candidate selection preserves feasibility for all pending bookings | `backend/test/dispatch.integration.test.js:241` | Nhóm dispatch có PASS lịch sử; chưa chạy lại |
| KT-07 | notification failure rolls assignment and all notifications back | `backend/test/dispatch.integration.test.js:180` | Nhóm dispatch có PASS lịch sử; chưa chạy lại |
| KT-08 | customer submits only for an owned booking; invoice and actor come from server | `backend/test/refunds.integration.test.js:149` | Nhóm refunds 9 PASS theo biên bản 05/11; chưa chạy lại |
| KT-09 | approval is not payment; failed payout stays pending; 100000/400000 is a partial refund | `backend/test/refunds.integration.test.js:200` | Nhóm refunds 9 PASS theo biên bản; chưa chạy lại |
| KT-10 | pending approvals reserve refundable balance and concurrent payouts cannot exceed receipts | `backend/test/refunds.integration.test.js:222` | Nhóm refunds 9 PASS theo biên bản; chưa chạy lại |
| KT-11 | two payout requests for one approval produce one successful ledger entry | `backend/test/refunds.integration.test.js:231` | Nhóm refunds 9 PASS theo biên bản; chưa chạy lại |
| KT-12 | failed notification rolls successful payout, complaint and invoice state back together | `backend/test/refunds.integration.test.js:246` | Nhóm refunds 9 PASS theo biên bản; chưa chạy lại |

## Các đánh giá chưa có bằng chứng hoàn tất

| Hạng mục | Trạng thái | Điều kiện để kết luận |
|---|---|---|
| Hiệu năng/tải/số người đồng thời ở mức hệ thống | CHƯA CÓ BẰNG CHỨNG | Kịch bản tải, cấu hình, dữ liệu, ngưỡng và log thực thi |
| Tỷ lệ hài lòng hoặc mức giảm thời gian chờ PetCare | CHƯA THỰC HIỆN | Thiết kế khảo sát/so sánh và dữ liệu thật; không lấy số VOAS hoặc hệ thống khác |
| UI đầy đủ năm vai trò/thiết bị | CHƯA CÓ BẰNG CHỨNG ĐẦY ĐỦ | Checklist thao tác/viewport và ảnh hiện tại |
| Admin KPI/lọc mới, HTTP DB test riêng và UI | CHƯA CÓ BẰNG CHỨNG ĐẦY ĐỦ | Theo TIEN_DO_ADMIN_PETCARE.md, kiểm tra riêng vẫn thiếu |
| Audit logs/config/backup server qua trang Admin | CHƯA TRIỂN KHAI ĐẦY ĐỦ | Bỏ fallback; có persistence/API và kiểm chứng thực; không coi demo là PASS |
| Mailtrap thực tế | BLOCKED trong biên bản | Cấu hình hợp lệ và nghiệm thu gửi/nhận thực tế; loopback không thay thế |
| Webhook merchant và đối soát ngân hàng tự động | CHƯA TRIỂN KHAI | Tích hợp thật có xác thực và test phù hợp; QR hướng dẫn không thay thế |
| Docker runtime | CHƯA CÓ BẰNG CHỨNG | Build/up/health và khởi động lại; kiểm tra tĩnh Dockerfile không đủ |

## Kiểm kê file test

Có **24 file backend (13 file tích hợp) và 8 file frontend**. Số file hoặc số khai báo dưới đây không phải số PASS.

| File | Loại | Số khai báo test nhận diện tĩnh |
|---|---|---|
| [backend/test/auth-pets.integration.test.js](<../../backend/test/auth-pets.integration.test.js>) | Tích hợp | 10 |
| [backend/test/booking.integration.test.js](<../../backend/test/booking.integration.test.js>) | Tích hợp | 14 |
| [backend/test/care-shifts.integration.test.js](<../../backend/test/care-shifts.integration.test.js>) | Tích hợp | 6 |
| [backend/test/db-tooling.integration.test.js](<../../backend/test/db-tooling.integration.test.js>) | Tích hợp | 8 |
| [backend/test/db-tooling.test.js](<../../backend/test/db-tooling.test.js>) | Unit/logic/tooling | 10 |
| [backend/test/demo-safety.test.js](<../../backend/test/demo-safety.test.js>) | Unit/logic/tooling | 3 |
| [backend/test/deposit-policy.test.js](<../../backend/test/deposit-policy.test.js>) | Unit/logic/tooling | 2 |
| [backend/test/deposits.integration.test.js](<../../backend/test/deposits.integration.test.js>) | Tích hợp | 12 |
| [backend/test/dispatch.integration.test.js](<../../backend/test/dispatch.integration.test.js>) | Tích hợp | 14 |
| [backend/test/email.test.js](<../../backend/test/email.test.js>) | Unit/logic/tooling | 3 |
| [backend/test/error.test.js](<../../backend/test/error.test.js>) | Unit/logic/tooling | 2 |
| [backend/test/invoices.integration.test.js](<../../backend/test/invoices.integration.test.js>) | Tích hợp | 8 |
| [backend/test/journey.integration.test.js](<../../backend/test/journey.integration.test.js>) | Tích hợp | 8 |
| [backend/test/password-reset.integration.test.js](<../../backend/test/password-reset.integration.test.js>) | Tích hợp | 13 |
| [backend/test/password.test.js](<../../backend/test/password.test.js>) | Unit/logic/tooling | 1 |
| [backend/test/payment-sandbox.integration.test.js](<../../backend/test/payment-sandbox.integration.test.js>) | Tích hợp | 9 |
| [backend/test/payment-sandbox.test.js](<../../backend/test/payment-sandbox.test.js>) | Unit/logic/tooling | 2 |
| [backend/test/payment-transfers.integration.test.js](<../../backend/test/payment-transfers.integration.test.js>) | Tích hợp | 9 |
| [backend/test/payment-transfers.test.js](<../../backend/test/payment-transfers.test.js>) | Unit/logic/tooling | 6 |
| [backend/test/rbac.test.js](<../../backend/test/rbac.test.js>) | Unit/logic/tooling | 1 |
| [backend/test/readiness.test.js](<../../backend/test/readiness.test.js>) | Unit/logic/tooling | 1 |
| [backend/test/refunds.integration.test.js](<../../backend/test/refunds.integration.test.js>) | Tích hợp | 9 |
| [backend/test/reports-admin.integration.test.js](<../../backend/test/reports-admin.integration.test.js>) | Tích hợp | 7 |
| [backend/test/scheduling.test.js](<../../backend/test/scheduling.test.js>) | Unit/logic/tooling | 14 |
| [frontend/test/api-client.test.js](<../../frontend/test/api-client.test.js>) | Unit/logic/tooling | 2 |
| [frontend/test/booking-availability.test.js](<../../frontend/test/booking-availability.test.js>) | Unit/logic/tooling | 1 |
| [frontend/test/business-time.test.js](<../../frontend/test/business-time.test.js>) | Unit/logic/tooling | 7 |
| [frontend/test/password-recovery.test.js](<../../frontend/test/password-recovery.test.js>) | Unit/logic/tooling | 2 |
| [frontend/test/register.test.js](<../../frontend/test/register.test.js>) | Unit/logic/tooling | 4 |
| [frontend/test/report-periods.test.js](<../../frontend/test/report-periods.test.js>) | Unit/logic/tooling | 6 |
| [frontend/test/theme.test.js](<../../frontend/test/theme.test.js>) | Unit/logic/tooling | 3 |
| [frontend/test/ui-foundations.test.js](<../../frontend/test/ui-foundations.test.js>) | Unit/logic/tooling | 6 |

## Khi viết Chương 3

Ghi riêng thiết kế test (tham khảo [32]), công cụ node:test [22], cách chuẩn bị DB cô lập và kết quả theo từng mốc. Hiện chưa có collection Postman được chạy; [35] chỉ là phương án. Nếu chạy lại ở giai đoạn sau phải bảo vệ DB thật, ghi rõ snapshot, lệnh, thời điểm, PASS/FAIL/SKIP và log; không dùng bản tổng hợp này làm log thực thi mới.
