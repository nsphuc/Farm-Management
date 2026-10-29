# BÁO CÁO NGHIỆM THU TASK 1 / 2 — TỐI ƯU HÓA & KHÉP KÍN RBAC CHO `ROLE_ACCOUNTANT` (KẾ TOÁN TRANG TRẠI)

**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Thời gian thực hiện:** 26/10/2026  
**Mã lỗ hổng giải quyết:** `GAP-ACC-01`, `GAP-ACC-02`, `GAP-ACC-03`, `GAP-ACC-04`  
**Trạng thái kiểm thử:** **47/47 Backend Integration Tests PASS (100%)** | **Frontend Build & Vitest PASS (100%)**  

---

## I. TỔNG HỢP KẾT QUẢ THỰC THI (TASK 1 / 2)

| Mã Lỗ Hổng | Tên Lỗ Hổng & Phân Khu | Biện Pháp Khắc Phục Kiến Trúc | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **`GAP-ACC-01`** | **Mở khóa Quản trị Nhóm Chi Phí tại `/app/settings`** | Bổ sung `PERM_FINANCE_EXPENSE` vào `menuConfig.js` và `routes.jsx`; thiết lập cơ chế lọc Tab nghiêm ngặt trong `settings/index.jsx` chỉ cho phép Kế toán thấy duy nhất Tab `cost-categories` kèm Header chuyên môn riêng; cập nhật `<Can anyPermissions>` và notification trong `CostCategoriesTab.jsx`. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-02`** | **Mở khóa `WS-B` Chế độ Đối soát Bảng công & Lương Read-Only** | Cấp quyền truy cập WS-B qua `PERM_FINANCE_EXPENSE` (không rò rỉ cho Công nhân/Thủ kho); hiển thị Banner đối soát tính lương Read-Only; khóa toàn bộ các nút CRUD nhân sự, phân ca, sửa giờ công, duyệt phép/OT; chuẩn hóa `@PreAuthorize` các API tra cứu chấm công và nghỉ phép tại Backend. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-03`** | **Chuẩn hóa RBAC Tra cứu Mùa vụ, Đàn nuôi & Lô thành phẩm** | Bổ sung `PERM_FINANCE_EXPENSE`, `PERM_FINANCE_REPORT`, `PERM_FINANCE_SALES_ORDER`, và `ROLE_ACCOUNTANT` vào `@PreAuthorize` của `CropSeasonController`, `LivestockController`, và `ProductBatchController`. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ACC-04`** | **Khôi phục chuẩn Maker-Checker (`DRAFT` -> `ACTIVE`) Ngân sách** | Triệt để phân tách Maker-Checker: Kế toán (`ROLE_ACCOUNTANT`) lập ngân sách lưu trạng thái `DRAFT`; Giám đốc trại hoặc Chủ đầu tư (Checker) thẩm định và bấm duyệt chuyển sang `ACTIVE`. UI hiển thị Badge `"⏳ Chờ Phê Duyệt"` và nút bấm ngữ cảnh chuẩn hóa. | **ĐÃ HOÀN TẤT (100%)** |

---

## II. CHI TIẾT CÁC FILE ĐÃ ĐIỀU CHỈNH & BỔ SUNG

### 1. Phân hệ Frontend (`frontend/src/`)
1. [`menuConfig.js`](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/menuConfig.js):
   - Chuyển `ALL_WORKSPACES.B_Personnel360` từ `permission: 'PERM_HR_EMPLOYEE_MANAGE'` sang `anyPermissions: ['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE']`.
   - Bổ sung `'PERM_FINANCE_EXPENSE'` vào `ALL_INDEPENDENT_MODULES.settings.anyPermissions`.
   - Trong `case 'FARM_ACCOUNTANT'`: Bổ sung module `settings` với nhãn *"Danh Mục Nhóm Chi Phí"* và badge *"Kế toán"*.
2. [`routes.jsx`](file:///d:/Projects/Farm_Management/frontend/src/app/routes.jsx):
   - Route `path="hr"`: Đổi guard sang `anyPermissions={['PERM_HR_EMPLOYEE_MANAGE', 'PERM_FINANCE_EXPENSE']}`.
   - Route `path="settings"`: Bổ sung `'PERM_FINANCE_EXPENSE'` vào danh sách `anyPermissions`.
3. [`settings/index.jsx`](file:///d:/Projects/Farm_Management/frontend/src/pages/settings/index.jsx):
   - Xác định `isAccountantStaff = isFarmAccountant() || (!hasPermission('PERM_FARM_UPDATE') && hasPermission('PERM_FINANCE_EXPENSE'))`.
   - Lọc `visibleTabs`: Đối với Kế toán, chỉ hiển thị duy nhất tab `'cost-categories'` (ẩn 8 tab còn lại).
   - Tự động đặt `defaultTab = 'cost-categories'`.
   - Hiển thị Header chuyên môn: Tiêu đề *"Danh Mục Nhóm Chi Phí & Khoản Mục Hạch Toán"*, icon `Coins`, badge vàng *"💰 Chuyên môn Kế toán Giá thành"*.
4. [`CostCategoriesTab.jsx`](file:///d:/Projects/Farm_Management/frontend/src/pages/settings/tabs/CostCategoriesTab.jsx):
   - Đổi các thẻ bọc nút Thêm/Sửa/Xóa sang `<Can anyPermissions={['PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE']}>`.
   - Bổ sung kích hoạt `notifyDataChanged?.('all')` và `notifyDataChanged?.('finance')` sau khi lưu hoặc xóa nhóm chi phí thành công.
5. [`B_Personnel360/index.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/B_Personnel360/index.jsx):
   - Thiết lập cờ `isAccountant = farmAccountant || (!hasPermission('PERM_HR_EMPLOYEE_MANAGE') && hasPermission('PERM_FINANCE_EXPENSE'))`.
   - Hiển thị Banner chế độ: *"📊 Chế độ Kế Toán Tiền Lương (Read-Only): Bạn đang tra cứu hồ sơ lương cơ bản, bảng chấm công thực tế và dữ liệu tăng ca (OT) đã duyệt để tổng hợp quỹ lương."*
   - Cột thao tác bảng nhân viên chỉ hiển thị nút `[Hồ sơ 360°]` cho Kế toán (khóa 100% nút sửa, khóa, thôi việc, cấp tài khoản).
   - Mở khóa tab *"2. Bảng Tổng Hợp Công (Tính Lương)"* (`AttendanceAdjustTab`) cho Kế toán đối soát, trong khi các nút điều chỉnh giờ công vẫn được bảo vệ bởi role Quản lý.
6. [`BudgetManagementTab.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H1_CostAccounting/components/BudgetManagementTab.jsx):
   - Hiển thị Badge vàng `"⏳ Chờ Phê Duyệt"` khi ngân sách ở trạng thái `DRAFT` hoặc `PENDING`.
   - Cung cấp 2 nút thao tác nổi bật `[✔️ Phê Duyệt]` và `[🚫 Từ Chối]` dành riêng cho Checker (`ROLE_FARM_MANAGER`, `ROLE_FARM_OWNER`).
7. [`BudgetApprovalModal.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H1_CostAccounting/components/BudgetApprovalModal.jsx):
   - Tích hợp kiểm tra `isFarmAccountant()`.
   - Nếu là Kế toán (Maker): Tiêu đề chuyển thành *"Lập Dự Toán Ngân Sách Chu Kỳ (Trình Duyệt)"*, hiển thị thông báo Maker-Checker rõ ràng, nút Submit ghi rõ `[Gửi Trình Duyệt Dự Toán (DRAFT)]`.
   - Nếu là Quản lý / Chủ trại (Checker): Nút Submit ghi `[Lưu & Kích Hoạt Ngân Sách]`.

---

### 2. Phân hệ Backend (`backend/src/main/java/com/farm/saas/`)
1. [`TimeAttendanceController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/TimeAttendanceController.java):
   - `GET /api/v1/hr/attendance` & `GET /api/v1/hr/attendance/{id}`: Bổ sung `PERM_FINANCE_EXPENSE` và `ROLE_ACCOUNTANT`.
2. [`LeaveOvertimeController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/LeaveOvertimeController.java):
   - `GET /api/v1/hr/leaves`, `GET /leaves/{id}`, `GET /overtime`, `GET /overtime/{id}`: Chuẩn hóa `@PreAuthorize` cấp quyền cho `PERM_FINANCE_EXPENSE` và `ROLE_ACCOUNTANT`.
   - Các API phê duyệt (`approve`) giữ nguyên khóa cứng cho `PERM_HR_EMPLOYEE_MANAGE`.
3. [`ShiftAssignmentController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/ShiftAssignmentController.java):
   - `GET /api/v1/hr/shifts/assignments`: Bổ sung `PERM_FINANCE_EXPENSE` và `ROLE_ACCOUNTANT`.
4. [`EmployeeController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/EmployeeController.java):
   - `GET /api/v1/hr/employees` & `GET .../{id}`: Bổ sung `PERM_FINANCE_EXPENSE` vào danh sách `hasAnyAuthority`.
5. [`CropSeasonController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java):
   - `GET /api/v1/farms/{farmId}/crop-seasons` & `GET .../{id}`: Thêm `PERM_FINANCE_EXPENSE`, `PERM_FINANCE_REPORT`, `ROLE_ACCOUNTANT`.
6. [`LivestockController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/controller/LivestockController.java):
   - `GET /api/v1/farms/{farmId}/livestock-groups` & `GET .../{id}`: Thêm `PERM_FINANCE_EXPENSE`, `PERM_FINANCE_REPORT`, `ROLE_ACCOUNTANT`.
7. [`ProductBatchController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/controller/ProductBatchController.java):
   - `GET /api/v1/farms/{farmId}/product-batches` & `GET .../{id}`: Thêm `PERM_FINANCE_SALES_ORDER`, `PERM_FINANCE_REPORT`, `ROLE_ACCOUNTANT`.
8. [`BudgetServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/service/impl/BudgetServiceImpl.java):
   - Inject `FarmSecurityEvaluator`.
   - Trong `createBudget`: Kiểm tra vai trò của người tạo. Nếu là `ROLE_ACCOUNTANT`, ngân sách bắt buộc tạo ở trạng thái `"DRAFT"`. Nếu là Checker (`isFarmManagerOrOwner`), lưu ở trạng thái `"ACTIVE"`.
   - Trong `updateBudgetStatus`: Ép kiểm tra thẩm quyền `farmSecurityEvaluator.isFarmManagerOrOwner(budget.getFarmId())`, đảm bảo Kế toán không thể tự duyệt ngân sách của chính mình.
9. [`RoleAccountantWorkflowIntegrationTest.java`](file:///d:/Projects/Farm_Management/backend/src/test/java/com/farm/saas/RoleAccountantWorkflowIntegrationTest.java):
   - Tạo bộ test tích hợp toàn diện kiểm tra đầy đủ 4 mã lỗi `GAP-ACC-01` -> `GAP-ACC-04`.

---

## III. MINH CHỨNG KIỂM THỬ TÍCH HỢP (AUTOMATED TEST PROOFS)

### 1. Backend Integration Tests (Maven Surefire)
```bash
mvn test
```
**Kết quả thực thi:**
```
[INFO] Running com.farm.saas.RoleAccountantWorkflowIntegrationTest
2026-10-26T22:56:54.006+07:00  WARN 11428 --- [farm-saas-backend] [           main] c.f.s.c.e.GlobalExceptionHandler         : Access denied: Access Denied | URI: /api/v1/hr/attendance/999999/adjust
2026-10-26T22:56:54.024+07:00  WARN 11428 --- [farm-saas-backend] [           main] c.f.s.c.e.GlobalExceptionHandler         : Access denied: Access Denied | URI: /api/v1/hr/leaves/999999/approve
2026-10-26T22:56:54.031+07:00  WARN 11428 --- [farm-saas-backend] [           main] c.f.s.c.e.GlobalExceptionHandler         : Access denied: Access Denied | URI: /api/v1/hr/overtime/999999/approve
2026-10-26T22:56:54.513+07:00  WARN 11428 --- [farm-saas-backend] [           main] c.f.s.c.e.GlobalExceptionHandler         : Access denied: Access Denied | URI: /api/v1/farms/1/budgets/42/approve
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 15.20 s -- in com.farm.saas.RoleAccountantWorkflowIntegrationTest
...
[INFO] -------------------------------------------------------
[INFO] Results:
[INFO] Tests run: 47, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time:  35.809 s
[INFO] ------------------------------------------------------------------------
```

### 2. Frontend Production Build & Vitest
```bash
npm run build
```
**Kết quả thực thi:**
```
✓ 1782 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.01 kB │ gzip:   0.60 kB
dist/assets/index-0kD5dXSM.css     75.99 kB │ gzip:  12.26 kB
dist/assets/index-yeixVaaQ.js   1,482.73 kB │ gzip: 369.86 kB
✓ built in 4.08s
```
```bash
npx vitest run
```
**Kết quả thực thi:**
```
 Test Files  2 passed (2)
      Tests  9 passed (9)
   Duration  2.79s
```

---

## IV. KẾT LUẬN & SẴN SÀNG CHO TASK 2 / 2
Toàn bộ các yêu cầu của **Task 1 / 2** cho vai trò `ROLE_ACCOUNTANT` đã hoàn thành 100%, bảo toàn nguyên vẹn Checksum của toàn bộ các file migration cũ, tuân thủ chặt chẽ nguyên lý Segregation of Duties (SoD) và chuẩn Maker-Checker của chuẩn mực kế toán kiểm toán doanh nghiệp SaaS. Hệ thống đã sẵn sàng bước vào **TASK 2 / 2 (Task cuối cùng)** để khép kín toàn bộ hệ thống Agri-ERP.
