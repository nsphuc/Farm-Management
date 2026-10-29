# BÁO CÁO NGHIỆM THU HOÀN TẤT TASK 2 / 2 — TỔNG KẾT KHÉP KÍN TOÀN DIỆN `ROLE_ACCOUNTANT` (KẾ TOÁN TRANG TRẠI)

**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Thời gian thực hiện:** 26/10/2026  
**Mã lỗ hổng giải quyết (Task 2 / 2):** `GAP-ACC-05`, `GAP-ACC-06`, `GAP-ACC-07`, `GAP-ACC-08`  
**Tổng kết toàn bộ vai trò:** **ĐÃ HOÀN TẤT TRỌN VẸN 8/8 MÃ LỖ HỔNG (`GAP-ACC-01` -> `GAP-ACC-08`)**  
**Trạng thái kiểm thử:** **48/48 Backend Integration Tests PASS (100%)** | **Frontend Build 0 Lỗi** | **Vitest 9/9 Tests PASS (100%)**  

---

## I. TỔNG QUAN KẾT QUẢ THỰC THI TASK 2 / 2

Task 2 / 2 đã giải quyết triệt để 4 mã lỗ hổng cuối cùng thuộc phân hệ Tài chính — Bán hàng — Đối tác — Thông báo tự động của vai trò Kế toán trang trại (`ROLE_ACCOUNTANT` / tài khoản mẫu `accountant`):

| Mã Lỗ Hổng | Tên Lỗ Hổng & Phân Hệ | Biện Pháp Khắc Phục Kiến Trúc | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **`GAP-ACC-05`** | **Đồng bộ Dữ liệu Công nợ tức thì giữa WS-H2 và WS-D** | Kích hoạt broadcast đa kênh (`'all'`, `'finance'`, `'partners'`) tại tất cả modal thu/chi, cấn trừ công nợ, đơn hàng và giao vận của WS-H2; đồng thời gắn reactive listeners tại `WS-D/index.jsx` và `PartnerDetailDrawer.jsx` để tự động làm mới thẻ Dư nợ và Sổ cái công nợ (`debt_records`) ngay lập tức mà không cần F5. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-06`** | **Thông báo tự động 2 chiều: Chi phí Vận hành (`FarmExpense`)** | Tích hợp gửi thông báo Maker-Checker: Khi Kế toán lập phiếu chi `DRAFT`, hệ thống gửi thông báo `SYSTEM` tới Giám đốc trang trại (`farm.getManagerUserId()`); Khi Giám đốc duyệt (`CONFIRMED`) hoặc từ chối (`CANCELLED`), thông báo phản hồi tự động về cho Kế toán. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-07`** | **Thông báo tự động 2 chiều: Đơn Bán Sỉ B2B (`SalesOrder`)** | Khi Kế toán lập đơn `PENDING`, báo cho Giám đốc duyệt; Khi Giám đốc duyệt (`CONFIRMED`), thông báo đa nhánh đồng thời tới: (1) Kế toán để ghi nhận công nợ phải thu, và (2) Thủ kho (`warehouse`) để chuẩn bị lô hàng xuất kho giao xe; Khi Giám đốc hủy đơn, gửi thông báo cảnh báo `WARNING` cho Kế toán. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-08`** | **Thông báo tự động 2 chiều: Ngân sách & Giao dịch Thanh toán** | Dự toán ngân sách: Tạo `DRAFT` báo Giám đốc; Duyệt/Từ chối báo Kế toán. Giao dịch thanh toán: Kế toán lập phiếu thu/chi hoặc cấn trừ nợ 2 chiều báo Giám đốc; Giám đốc hủy phiếu thanh toán gửi thông báo `WARNING` cho Kế toán. | **ĐÃ HOÀN TẤT (100%)** |

---

## II. CHI TIẾT THỰC THI KIẾN TRÚC

### 1. Đồng bộ Dữ liệu Công nợ Tức thì Đa Kênh (WS-H2 <-> WS-D — `GAP-ACC-05`)
Đã hoàn tất khâu phát tín hiệu và đón nhận dữ liệu phản ứng tức thì (Reactive Event Bus) qua `useActiveFarmStore`:

#### Phía phát tín hiệu (Emitter) tại `WS-H2 (Sales & Cashflow)`:
1. [`CreatePaymentModal.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/CreatePaymentModal.jsx):
   - Sau khi tạo phiếu thu/chi VietQR thành công, phát broadcast trên cả 3 kênh:
     ```javascript
     const store = useActiveFarmStore.getState();
     store.notifyDataChanged?.('all');
     store.notifyDataChanged?.('finance');
     store.notifyDataChanged?.('partners');
     ```
2. [`AllocateOrOffsetDebtModal.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/AllocateOrOffsetDebtModal.jsx):
   - Kích hoạt broadcast 3 kênh sau khi phân bổ thanh toán vào công nợ hoặc thực thi cấn trừ công nợ 2 chiều (`DEBT_OFFSET`).
3. [`CreateSalesOrderModal.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/CreateSalesOrderModal.jsx):
   - Phát tín hiệu 3 kênh ngay khi tạo đơn bán sỉ thành công.
4. [`SalesOrderMonitorTab.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/SalesOrderMonitorTab.jsx):
   - Lắng nghe `syncTrigger?.partners` và `syncTrigger?.all` để làm mới danh sách đơn bán sỉ.
   - Phát tín hiệu đa kênh khi Giám đốc phê duyệt (`confirmOrder`) hoặc hủy đơn (`cancelOrder`).
5. [`DebtMonitorTab.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/DebtMonitorTab.jsx):
   - Bổ sung `syncTrigger?.partners` và `syncTrigger?.all` vào `loadDebts` `useEffect`.
6. [`CreateDeliveryModal.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/CreateDeliveryModal.jsx) & [`SalesDeliveryMonitorTab.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/SalesDeliveryMonitorTab.jsx):
   - Bổ sung phát tín hiệu `notifyDataChanged?.('partners')` khi xuất xe giao hàng và khi cập nhật biên bản bàn giao POD.

#### Phía đón nhận & phản ứng (Listener) tại `WS-D (Partners & CRM)`:
1. [`frontend/src/workspaces/D_Partners/index.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/index.jsx):
   - Đưa cả `syncTrigger?.partners`, `syncTrigger?.finance`, và `syncTrigger?.all` vào dependency array của `useEffect` kích hoạt `fetchPartners()`.
   - **Tự động làm mới Drawer mở:** Khi danh sách đối tác được tải lại ngầm, nếu Drawer chi tiết đối tác đang mở (`selectedPartner`), hệ thống tự động tìm và cập nhật lại state `selectedPartner` từ dữ liệu mới:
     ```javascript
     const updated = content.find((p) => p.id === selectedPartner.id);
     if (updated) setSelectedPartner(updated);
     ```
     Điều này giúp thẻ Dư nợ hiện tại (`currentDebt`), Hạn mức nợ còn lại trên Drawer cập nhật tức thì mà người dùng không cần đóng/mở lại Drawer.
2. [`PartnerDetailDrawer.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/components/PartnerDetailDrawer.jsx):
   - Lấy `syncTrigger` từ `useActiveFarmStore((s) => s.syncTrigger)`.
   - Đưa `syncTrigger?.partners`, `syncTrigger?.finance`, `syncTrigger?.all` vào dependency array của `useEffect` gọi `loadDebts()`, giúp Bảng Sổ Chi Tiết Công Nợ (`debt_records`) tự động làm mới ngay khi có phát sinh thanh toán hoặc đơn hàng từ WS-H2.

---

### 2. Tích hợp Hệ thống Thông báo Tự động 2 Chiều Backend (`GAP-ACC-06`, `07`, `08`)

Tất cả các service đều được inject an toàn, bọc trong phương thức bảo vệ `sendNotificationQuietly` (không gây gián đoạn transaction chính nếu việc gửi thông báo gặp sự cố mạng hoặc dữ liệu ngoài biên):

#### A. Chi phí Vận hành ([`FarmExpenseServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/service/impl/FarmExpenseServiceImpl.java) — `GAP-ACC-06`)
- Inject: `NotificationService`, `FarmRepository`, `UserRepository`.
- Khi Kế toán tạo chi phí ở trạng thái `DRAFT`:
  - Gửi thông báo tới Giám đốc trại (`farm.getManagerUserId()`):
    - `type = "SYSTEM"`, `referenceType = "FARM_EXPENSE"`, `referenceId = saved.getId()`
    - Tiêu đề: *"Chứng từ chi phí mới chờ phê duyệt: EXP-..."*
    - Nội dung: *"Kế toán vừa lập chứng từ chi phí [EXP-...] với số tiền ... VNĐ đang chờ phê duyệt."*
- Khi Giám đốc duyệt (`confirmExpense` -> `CONFIRMED`):
  - Gửi thông báo `SYSTEM` về cho người tạo phiếu (`expense.getCreatedBy()` / Kế toán):
    - Tiêu đề: *"Chứng từ chi phí [EXP-...] đã được phê duyệt"*
    - Nội dung: *"Chứng từ chi phí [EXP-...] đã được Giám đốc trang trại phê duyệt."*
- Khi Giám đốc hủy/từ chối (`cancelExpense` -> `CANCELLED`):
  - Gửi thông báo `SYSTEM` về cho Kế toán kèm lý do hủy nếu có.

#### B. Đơn Bán Sỉ B2B ([`SalesOrderServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/service/impl/SalesOrderServiceImpl.java) — `GAP-ACC-07`)
- Inject: `NotificationService`, `FarmRepository`, `UserRepository`.
- Khi Kế toán tạo Đơn bán sỉ ở trạng thái `PENDING`:
  - Gửi thông báo `SYSTEM` tới Giám đốc trại (`farm.getManagerUserId()`):
    - Tiêu đề: *"Đơn bán sỉ B2B mới chờ duyệt: SO-..."*
    - Nội dung: *"Kế toán vừa lập Đơn bán sỉ [SO-...] với tổng thanh toán ... VNĐ đang chờ phê duyệt."*
- Khi Giám đốc phê duyệt Đơn bán sỉ (`confirmOrder` -> `CONFIRMED`):
  - Gửi thông báo `SYSTEM` tới **Kế toán**: *"Đơn bán sỉ [SO-...] đã được phê duyệt và ghi nhận công nợ phải thu."*
  - Gửi thông báo `SYSTEM` tới **Thủ kho (`warehouse`)**:
    - Tiêu đề: *"Lệnh chuẩn bị giao hàng cho đơn bán sỉ: SO-..."*
    - Nội dung: *"Đơn bán sỉ [SO-...] đã được Giám đốc phê duyệt. Vui lòng chuẩn bị lô thành phẩm và lập phiếu xuất xe giao hàng."*
- Khi Giám đốc hủy Đơn bán sỉ (`cancelOrder` -> `CANCELLED`):
  - Gửi thông báo `WARNING` tới Kế toán thông báo đơn hàng đã bị hủy và đã giải phóng toàn bộ số lượng giữ chỗ kho.

#### C. Dự toán Ngân sách & Giao dịch Thanh toán ([`BudgetServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/service/impl/BudgetServiceImpl.java) & [`DebtAndPaymentServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/service/impl/DebtAndPaymentServiceImpl.java) — `GAP-ACC-08`)
- **Dự toán Ngân sách (`BudgetServiceImpl.java`)**:
  - Khi tạo dự toán ở trạng thái `DRAFT`: Gửi thông báo `SYSTEM` tới Giám đốc trại về dự toán chu kỳ mới chờ phê duyệt.
  - Khi Giám đốc / Chủ đầu tư duyệt (`ACTIVE`) hoặc từ chối: Gửi thông báo `SYSTEM` phản hồi kết quả về cho Kế toán.
- **Giao dịch Thanh toán & Cấn trừ nợ (`DebtAndPaymentServiceImpl.java`)**:
  - Khi Kế toán lập phiếu thanh toán mới (`createPaymentTransaction`) hoặc cấn trừ công nợ 2 chiều (`offsetDebts`): Gửi thông báo `SYSTEM` tới Giám đốc trại để nắm bắt biến động dòng tiền và công nợ đối tác.
  - Khi Giám đốc trại hủy phiếu thanh toán (`cancelPayment`): Gửi thông báo cảnh báo `WARNING` về cho Kế toán kèm lý do hủy.

---

## III. TUÂN THỦ CÁC QUY TẮC KIẾN TRÚC BẮT BUỘC

1. **Bảo toàn Tuyệt Đối Flyway Checksum**:
   - Hoàn toàn **KHÔNG** chỉnh sửa bất kỳ file migration nào từ `V1_0` đến `V1_6`.
   - Kết quả xác thực Flyway khi khởi chạy kiểm thử:
     ```
     o.f.core.internal.command.DbValidate : Successfully validated 7 migrations (execution time 00:00.023s)
     o.f.core.internal.command.DbMigrate  : Current version of schema `farm_saas_dev`: 1.6 - Up to date.
     ```
2. **Tuân thủ Check Constraint Của Bảng `notifications`**:
   - Cột `type` trong bảng `notifications` có ràng buộc:
     `chk_notifications_type CHECK (type IN ('INFO', 'WARNING', 'ALERT', 'TASK', 'QC', 'SYSTEM'))`
   - Toàn bộ thông báo mới sinh trong module Finance đều tuân thủ 100%: chỉ sử dụng `type = "SYSTEM"` cho các luồng trình ký/phê duyệt thông thường và `type = "WARNING"` cho các luồng hủy/từ chối giao dịch. Tuyệt đối không truyền các giá trị không hợp lệ như `"FINANCE"` hay `"EXPENSE"`.
3. **An toàn Transaction & Maker-Checker Isolation**:
   - Toàn bộ lời gọi gửi thông báo đều được bọc trong `sendNotificationQuietly()`.
   - Đảm bảo tính tách biệt vai trò (SoD): Kế toán (Maker) chỉ có thể lập phiếu ở trạng thái chờ duyệt (`DRAFT` / `PENDING`), quyền phê duyệt chuyển đổi trạng thái thuộc thẩm quyền độc quyền của Giám đốc trại / Chủ đầu tư (Checker).

---

## IV. KẾT QUẢ KIỂM THỬ TOÀN DIỆN (TEST SUITE)

### 1. Backend Integration Tests (Spring Boot Test Container + MySQL 3308)
- File kiểm thử: [`RoleAccountantWorkflowIntegrationTest.java`](file:///d:/Projects/Farm_Management/backend/src/test/java/com/farm/saas/RoleAccountantWorkflowIntegrationTest.java)
  - `testAccountantRoleWorkflow`: Kiểm thử toàn diện 4 mã lỗ hổng `GAP-ACC-01` -> `GAP-ACC-04` -> **PASS**.
  - `testFinanceTwoWayNotificationWorkflow`: Kiểm thử quy trình thông báo tự động 2 chiều cho `GAP-ACC-06`, `GAP-ACC-07`, `GAP-ACC-08` -> **PASS**.
- Toàn bộ Integration Test Suite dự án (`mvn test`):
  ```
  [INFO] Running com.farm.saas.CropFarmingLogAutoBackflushingIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.EmployeeDepartmentAndIsolationTest
  [INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.FarmSaasApplicationTests
  [INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.FinanceCommercialAndReportsIntegrationTest
  [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.LivestockAdgAndVetBackflushingIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.OwnerRoleWorkflowIntegrationTest
  [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.RoleAccountantWorkflowIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.RoleFieldStaffWorkflowIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.RoleTechnicalStaffWorkflowIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.RoleWarehouseStaffWorkflowIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SecurityAndTenantIsolationIntegrationTest
  [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SystemSubscriptionAndLimitsIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  ...
  [INFO] Results:
  [INFO] Tests run: 48, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS (Total time: 31.627 s)
  ```
- **100% (48/48) Integration Tests PASS hoàn hảo!**

### 2. Frontend Build & Vitest Suite
- **Build Production (`npm run build`)**:
  ```
  vite v5.4.21 building for production...
  transforming...
  ✓ 1782 modules transformed.
  rendering chunks...
  dist/index.html                     1.01 kB
  dist/assets/index-0kD5dXSM.css     75.99 kB
  dist/assets/index-CTOYuhxb.js   1,484.41 kB
  ✓ built in 3.61s
  ```
  **0 lỗi biên dịch, 0 warning cú pháp.**
- **Vitest Unit & UI Flow Test (`npx vitest run`)**:
  ```
  Test Files  2 passed (2)
       Tests  9 passed (9)
    Duration  2.63s
  ```
  **100% (9/9) Tests PASS!**

---

## V. BẢNG TỔNG KẾT TOÀN DIỆN 8/8 MÃ LỖ HỔNG CỦA `ROLE_ACCOUNTANT`

| STT | Mã Lỗ Hổng | Tên Hạng Mục | Giai Đoạn | Trạng Thái Hoàn Tất |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **`GAP-ACC-01`** | Mở khóa Quản trị Nhóm Chi Phí tại `/app/settings` | Task 1 / 2 | **HOÀN TẤT 100%** |
| 2 | **`GAP-ACC-02`** | `WS-B` Chế độ Đối soát Bảng công & Lương Read-Only | Task 1 / 2 | **HOÀN TẤT 100%** |
| 3 | **`GAP-ACC-03`** | Chuẩn hóa RBAC Tra cứu Mùa vụ, Đàn nuôi & Lô thành phẩm | Task 1 / 2 | **HOÀN TẤT 100%** |
| 4 | **`GAP-ACC-04`** | Chuẩn Maker-Checker (`DRAFT` -> `ACTIVE`) Ngân sách Chu kỳ | Task 1 / 2 | **HOÀN TẤT 100%** |
| 5 | **`GAP-ACC-05`** | Đồng bộ Dữ liệu Công nợ Tức thì giữa WS-H2 và WS-D | Task 2 / 2 | **HOÀN TẤT 100%** |
| 6 | **`GAP-ACC-06`** | Thông báo Tự động 2 Chiều: Chi phí Vận hành | Task 2 / 2 | **HOÀN TẤT 100%** |
| 7 | **`GAP-ACC-07`** | Thông báo Tự động 2 Chiều: Đơn Bán Sỉ B2B & Giao Vận | Task 2 / 2 | **HOÀN TẤT 100%** |
| 8 | **`GAP-ACC-08`** | Thông báo Tự động 2 Chiều: Ngân Sách & Giao Dịch Thanh Toán | Task 2 / 2 | **HOÀN TẤT 100%** |

---

## VI. KẾT LUẬN

Với việc hoàn thành Task 2 / 2, vai trò Cấp 4 cuối cùng của hệ thống — **Kế toán Trang trại (`ROLE_ACCOUNTANT` / `accountant`)** — đã chính thức đạt chuẩn hoàn thiện 100%, bảo mật SoD tuyệt đối, đồng bộ dữ liệu công nợ tức thì không độ trễ và vận hành cơ chế thông báo liên phòng ban hai chiều liền mạch. 

Toàn bộ 4 tài khoản nhân sự Cấp 4 của hệ thống Agri-ERP Multi-Tenant SaaS gồm:
1. **Kỹ sư Nông nghiệp / Thú y** (`ROLE_TECHNICAL_STAFF` — `tech`)
2. **Công nhân Trang trại** (`ROLE_FIELD_STAFF` — `field`)
3. **Thủ kho Trang trại** (`ROLE_WAREHOUSE_STAFF` — `warehouse`)
4. **Kế toán Trang trại & Giá thành** (`ROLE_ACCOUNTANT` — `accountant`)

đã được **KHÉP KÍN 100%**, sẵn sàng bàn giao vận hành thực tế ở cấp độ Enterprise Production.
