# BÁO CÁO NGHIỆM THU TASK 1 / 2 — KHỞI TẠO TÀI KHOẢN MẪU ZONE_MANAGER, THĂNG CẤP QUYỀN ĐỘNG & BÀN TÁC NGHIỆP 3 WORKSPACES

**Dự án:** Agri-ERP Multi-Tenant SaaS Platform  
**Vai trò thẩm định:** Principal Software Architect & Senior Fullstack Engineer  
**Thời gian thực hiện:** 27/10/2026  
**Mã lỗ hổng giải quyết:** `GAP-ZM-01`, `GAP-ZM-02`, `GAP-ZM-04`, `GAP-ZM-05`  
**Trạng thái kiểm thử:** **48/48 Backend Integration Tests PASS (100%)** | **Frontend Build & 12/12 Vitest Tests PASS (100%)**  

---

## I. TỔNG HỢP KẾT QUẢ THỰC THI (TASK 1 / 2)

| Mã Lỗ Hổng | Tên Lỗ Hổng & Phân Khu | Biện Pháp Khắc Phục Kiến Trúc | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **`GAP-ZM-01`** | **Khởi tạo Idempotent Tài khoản Mẫu `zone_manager`** | Thêm phương thức `seedZoneManagerSampleAccount()` vào `HrDataCleanupRunner.java`: Tự động khởi tạo user `zone_manager` (`Trần Văn Tổ Trưởng (Khu A1)`), gán base role `ROLE_FIELD_STAFF`, cấp `user_farm_access` tại Farm 1, gán `farm_assignments` với `role_in_farm = 'ZONE_MANAGER'` tại Zone 1 (Nhà màng công nghệ cao A1), và tự sinh hồ sơ nhân sự `Employee`. Hoàn toàn không sửa Flyway SQL migrations. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ZM-04`** | **Thăng cấp quyền động (Dynamic Field Leadership Promotion)** | Giải quyết triệt để "Nghịch lý Base Role": Trong `CustomUserDetailsService.java` và `AuthServiceImpl.java`, hệ thống kiểm tra nếu user có `farm_assignments` active với `role_in_farm = 'ZONE_MANAGER'`, tự động cấp bổ sung quyền `PERM_TASK_ASSIGN` vào danh sách quyền hệ thống; cập nhật `HarvestController.java` cho phép `@farmSecurity.isZoneManager(#farmId)` lập biên bản thu hoạch thực tế. | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ZM-05`** | **Định danh `ZONE_MANAGER` & Bàn Tác Nghiệp 3 Workspaces** | Trong `AuthServiceImpl.java`: Phân giải chính xác `operationalRole = "ZONE_MANAGER"`. Trong `useAuthStore.js`: Bổ sung `hasFarmRole()`, `isZoneManager()`, tách `ZONE_MANAGER` khỏi `isTechnicalLead()` và `isFieldWorker()`. Trong `menuConfig.js`: Xây dựng bàn tác nghiệp độc lập `case 'ZONE_MANAGER'` gồm đúng 3 Workspace cốt lõi: WS-G, WS-A, WS-E (không chứa WS-C, WS-F, Settings). | **ĐÃ HOÀN TẤT (100%)** |
| **`GAP-ZM-02`** | **Mở khóa Route Guard WS-A (`/app/geography`)** | Bổ sung `PERM_TASK_ASSIGN` vào `anyPermissions` của route `geography` trong `routes.jsx`. Nhờ cơ chế Dynamic Promotion, Trưởng phân khu (có `PERM_TASK_ASSIGN`) truy cập mượt mà WS-A để xem sơ đồ phân khu và nhân sự tổ mà Công nhân thường (`FIELD_WORKER`) vẫn bị chặn 403 đúng chuẩn SoD; cập nhật `StaffAssignmentPane.jsx` hiển thị tiêu đề *"Danh Sách Tổ Viên Phân Khu Phụ Trách"*. | **ĐÃ HOÀN TẤT (100%)** |

---

## II. CHI TIẾT CÁC FILE ĐÃ ĐIỀU CHỈNH & BỔ SUNG

### 1. Phân hệ Backend (`backend/src/main/java/com/farm/saas/`)
1. [`HrDataCleanupRunner.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/config/HrDataCleanupRunner.java):
   - Bổ sung phương thức `seedZoneManagerSampleAccount()` chạy idempotent trước `seedStandardEmployeeProfiles()`.
   - Khởi tạo user `zone_manager` (password băm chuẩn BCrypt), gán `ROLE_FIELD_STAFF`, cấp `user_farm_access` tại Farm 1, gán `farm_assignments` với `role_in_farm = 'ZONE_MANAGER'` tại Zone 1 (`Nhà màng công nghệ cao A1`).
   - Tự động liên kết hồ sơ `employees` thông qua `seedStandardEmployeeProfiles()`.
2. [`CustomUserDetailsService.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/common/security/CustomUserDetailsService.java):
   - Triển khai **Dynamic Field Leadership Promotion**: Truy vấn bảng `farm_assignments`, nếu user có bản ghi `role_in_farm = 'ZONE_MANAGER'` và `is_active = TRUE`, tự động nạp thêm quyền `PERM_TASK_ASSIGN` vào tập `permissions` của `CustomUserDetails`.
3. [`AuthServiceImpl.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/auth/service/AuthServiceImpl.java):
   - Trong `buildUserInfoDto`: Kiểm tra nếu `activeAssignments` chứa `ZONE_MANAGER`, tự động bổ sung `PERM_TASK_ASSIGN` vào danh sách permissions trả về cho Frontend.
   - Trong phân giải `operationalRole`: Tách nhánh riêng `if (activeAssignments.stream().anyMatch(a -> "ZONE_MANAGER".equalsIgnoreCase(a.getRoleInFarm()))) operationalRole = "ZONE_MANAGER"`.
   - Loại bỏ `ZONE_MANAGER` khỏi nhóm `TECHNICAL_LEAD`.
4. [`FarmSecurityEvaluator.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/common/security/FarmSecurityEvaluator.java):
   - Bổ sung phương thức an ninh: `public boolean isZoneManager(Long farmId)` kiểm tra xem user hiện tại có bản ghi phân công `ZONE_MANAGER` active tại `farmId` hay không.
5. [`HarvestController.java`](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/controller/HarvestController.java):
   - Nâng cấp `@PreAuthorize` tại `createHarvestRecord`: Cho phép `(hasAnyRole('ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_SUPER_ADMIN') or @farmSecurity.isZoneManager(#farmId))` để Trưởng phân khu luôn có thẩm quyền lập biên bản thu hoạch thực tế.

---

### 2. Phân hệ Frontend (`frontend/src/`)
1. [`useAuthStore.js`](file:///d:/Projects/Farm_Management/frontend/src/store/useAuthStore.js):
   - Bổ sung helper `hasFarmRole(roleName, farmId = null)`.
   - Bổ sung hàm định danh `isZoneManager(farmId = null)`: Kiểm tra `operationalRole === 'ZONE_MANAGER'` hoặc `hasFarmRole('ZONE_MANAGER', farmId)`.
   - Tách `ZONE_MANAGER` khỏi `techRoles` trong `isTechnicalLead()` và chặn nếu `isZoneManager()` là true.
   - Thêm điều kiện chặn trong `isFieldWorker()`: Nếu `isZoneManager()` là true thì không bao giờ rơi vào `FIELD_WORKER`.
   - Cập nhật `getOperationalRole()` trả về mã `'ZONE_MANAGER'`.
   - Cập nhật `getOperationalRoleInfo()` cấu hình metadata cho `'ZONE_MANAGER'`:
     - Tiêu đề: *"Trưởng Phân Khu / Tổ Trưởng Hiện Trường"*
     - Tên ngắn: *"Trưởng Phân Khu"*
     - Badge: `bg-sky-100 text-sky-900 border-sky-300 font-bold`
     - Cờ: `canProxyAttendance = true`, `isFarmLocked = true`, `canSkipAttendance = false`.
2. [`menuConfig.js`](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/menuConfig.js):
   - Bổ sung nhánh độc lập `case 'ZONE_MANAGER':` với tiêu đề *"Bàn Chỉ Huy Phân Khu & Tổ Trưởng"*.
   - Hiển thị đúng 3 Workspace cốt lõi:
     - `WS-G`: Chấm Công, Điểm Danh Tổ & Điều Phối Việc (`label: 'WS-G: Điểm Danh Tổ & Điều Phối Việc'`, `badge: 'Tổ trưởng'`)
     - `WS-A`: Sơ Đồ Phân Khu & Nhân Sự Tổ (`label: 'WS-A: Sơ Đồ Phân Khu & Nhân Sự Tổ'`, `badge: 'Phân khu'`)
     - `WS-E`: Nhật Ký Canh Tác & Thu Hoạch Khu (`label: 'WS-E: Nhật Ký Canh Tác & Thu Hoạch Khu'`, `badge: 'Sản xuất'`)
   - `independentModules: []` (Ẩn hoàn toàn WS-C, WS-F và Settings của Kỹ sư kỹ thuật/KCS).
3. [`TenantAppShell/index.jsx`](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/index.jsx):
   - Bổ sung banner chỉ huy phân khu: Khi `isZoneManager()`, hiển thị thanh thông báo xanh da trời (sky) hướng dẫn điểm danh tổ và giám sát sản xuất tại WS-G & WS-A.
4. [`routes.jsx`](file:///d:/Projects/Farm_Management/frontend/src/app/routes.jsx):
   - Cập nhật `TenantIndexRedirect()`: Điều hướng `isZoneManager()` vào thẳng bàn tác nghiệp `/app/my-dashboard` (WS-G).
   - Nâng cấp Route Guard `/app/geography`: Thêm `'PERM_TASK_ASSIGN'` vào `anyPermissions` (`['PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_TASK_ASSIGN']`).
5. [`StaffAssignmentPane.jsx`](file:///d:/Projects/Farm_Management/frontend/src/workspaces/A_Geography/components/StaffAssignmentPane.jsx):
   - Nhận diện `isZoneManager()` và hiển thị tiêu đề bảng: *"Danh Sách Tổ Viên Phân Khu Phụ Trách"*.
6. [`ZoneManagerRoleUiFlow.test.jsx`](file:///d:/Projects/Farm_Management/frontend/src/ZoneManagerRoleUiFlow.test.jsx):
   - Tạo bộ unit test toàn diện kiểm chứng:
     - Nhận diện chính xác `isZoneManager = true`, không rơi vào `FIELD_WORKER` hay `TECHNICAL_LEAD`.
     - Cấu hình menu 3 Workspaces đúng chuẩn.
     - Tài khoản công nhân thường không có gán `ZONE_MANAGER` vẫn giữ nguyên là `FIELD_WORKER`.

---

## III. KẾT QUẢ KIỂM THỬ HỆ THỐNG

### 1. Backend Verification
- **Biên dịch test:** `mvn test-compile` -> **`BUILD SUCCESS`**
- **Kiểm thử tích hợp:** `mvn test` -> **`Tests run: 48, Failures: 0, Errors: 0, Skipped: 0` (100% PASS)**
- Xác nhận Flyway checksum: Không có bất kỳ thay đổi nào trên các file migration từ `V1_0` đến `V1_6`.

### 2. Frontend Verification
- **Build Production:** `npm run build` -> **`built in 12.09s` (0 errors, 0 warnings)**
- **Kiểm thử Vitest:** `npx vitest run` -> **`3 Test Files, 12 Tests passed (100% PASS)`**
  - `src/ZoneManagerRoleUiFlow.test.jsx`: 3/3 tests PASS
  - `src/GeographyWorkspaceUxStandard.test.jsx`: 4/4 tests PASS
  - `src/OwnerRoleUiFlow.test.jsx`: 5/5 tests PASS

---

## IV. KẾT LUẬN & SẴN SÀNG CHO TASK 2 / 2
Toàn bộ các yêu cầu của **TASK 1 / 2** đã được hoàn tất 100%:
1. Dữ liệu mẫu `zone_manager` được khởi tạo an toàn và idempotent (`GAP-ZM-01`).
2. Mở khóa Route Guard WS-A hoàn toàn trơn tru, không còn lỗi 403 Forbidden (`GAP-ZM-02`).
3. Cơ chế Dynamic Field Leadership Promotion tự động cấp `PERM_TASK_ASSIGN` cho bất kỳ ai được gán `ZONE_MANAGER` (`GAP-ZM-04`).
4. Định danh `isZoneManager()` trong `useAuthStore` và menu 3 Workspaces độc lập trong `menuConfig.js` hoạt động chính xác (`GAP-ZM-05`).

Hệ thống đã sẵn sàng 100% để bước vào **TASK 2 / 2: Tác nghiệp Giao việc - Nghiệm thu hiện trường WS-G & Đồng bộ Notification liên cấp**!

