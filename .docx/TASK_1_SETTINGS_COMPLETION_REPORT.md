# BÁO CÁO THỰC THI TASK 1 / 6
## VÁ LỖ HỔNG BẢO MẬT MULTI-TENANT & HOÀN THIỆN TOÀN DIỆN 9 TAB CÀI ĐẶT DANH MỤC (`/app/settings`) CHO `ROLE_FARM_MANAGER`

---

## I. TỔNG QUAN KẾT QUẢ THỰC HIỆN
Căn cứ trên Báo cáo Kiểm toán (`GAP_ANALYSIS_ROLE_FARM_MANAGER.md`), **Task 1** đã được triển khai và nghiệm thu thành công 100%:
1. **Vá lỗ hổng bảo mật Multi-Tenant cấp doanh nghiệp** tại `EnterpriseProfileController.java`: Khóa chặt quyền sửa MST, Tên công ty mẹ và Tài khoản ngân hàng VietQR tổng chỉ cho `ROLE_FARM_OWNER` (và Super Admin). Cho phép `ROLE_FARM_MANAGER` và `ROLE_ACCOUNTANT` quyền xem hồ sơ để đối chiếu chứng từ và truy xuất nguồn gốc.
2. **Bổ sung đủ 9 API `@DeleteMapping` còn thiếu** tại Backend, giải quyết triệt để lỗi `HTTP 405 Method Not Allowed`.
3. **Bảo vệ toàn vẹn khóa ngoại CSDL (`ON DELETE RESTRICT`)**:
   - Tự động chuyển xóa mềm (`DISCONTINUED`, `INACTIVE`, `CLOSED`) đối với các thực thể đã phát sinh giao dịch/chứng từ/vụ mùa (`materials`, `warehouses`, `operational_cycles`).
   - Ném `BusinessException` (HTTP 400) với thông báo tiếng Việt chi tiết nếu ràng buộc không cho phép xóa (VD: kho đang có tồn hàng `quantity_on_hand > 0`, giống cây/con đã đưa vào mùa vụ/định mức, ca làm việc đã chấm công, nhóm chi phí đã gắn với chứng từ).
   - Thực hiện xóa vật lý sạch sẽ nếu bản ghi chưa phát sinh dữ liệu liên kết.
4. **Chuẩn hóa trải nghiệm 9 Tab trên Frontend (`/app/settings`) cho `ROLE_FARM_MANAGER`**:
   - Tab 1: Tự động chuyển các ô input sang `readOnly` / `disabled`, ẩn nút Lưu, hiển thị Banner thông tin lịch sự khi Giám đốc trang trại truy cập.
   - Tab 2, 5, 7: Bổ sung Dropdown chọn Trang trại nội bộ khi bộ lọc TopBar đang ở chế độ `'ALL'`, ngăn ngừa hoàn toàn tình trạng tab bị rỗng.
   - Tab 4, 5: Cập nhật điều kiện phân quyền `<Can anyPermissions={["PERM_FARM_UPDATE", "PERM_INVENTORY_RECEIPT"]}>` giúp `ROLE_FARM_MANAGER` có đầy đủ nút Thêm, Sửa, Xóa/Đổi trạng thái Kho bãi và Vật tư.
   - Tab 7: Khắc phục lỗi thiếu `farmId` khi tạo định mức kỹ thuật (`createQuota`).

---

## II. DANH SÁCH FILE ĐÃ THAY ĐỔI

### 1. Backend (Spring Boot 3.3.4, Java 21)
| STT | File Path | Loại thay đổi | Chi tiết |
|:---:|:---|:---:|:---|
| 1 | `backend/.../modules/platform/controller/EnterpriseProfileController.java` | Security Patch | GET: `@PreAuthorize("hasAnyRole('FARM_OWNER', 'FARM_MANAGER', 'ACCOUNTANT')")`. PUT: `@PreAuthorize("hasRole('FARM_OWNER')")`. |
| 2 | `backend/.../modules/masterdata/controller/CropTypeController.java` | API Endpoint | Bổ sung `@DeleteMapping("/{id}")` với `@PreAuthorize("hasAnyAuthority('PERM_CROP_PLAN', 'PERM_FARM_UPDATE')")`. |
| 3 | `backend/.../modules/masterdata/controller/LivestockBreedController.java` | API Endpoint | Bổ sung `@DeleteMapping("/{id}")` với `@PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_FARM_UPDATE')")`. |
| 4 | `backend/.../modules/masterdata/controller/MaterialCategoryController.java` | API Endpoint | Bổ sung `@DeleteMapping("/{id}")` với `@PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE')")`. |
| 5 | `backend/.../modules/masterdata/controller/MaterialController.java` | API Endpoint | Bổ sung `@DeleteMapping("/api/v1/materials/{id}")` với `@PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE')")`. |
| 6 | `backend/.../modules/masterdata/controller/WarehouseController.java` | API Endpoint & RBAC | Cập nhật POST, PUT, DELETE: `@PreAuthorize("hasAnyAuthority('PERM_FARM_UPDATE', 'PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)")`. Bổ sung `@DeleteMapping("/{warehouseId}")`. |
| 7 | `backend/.../modules/masterdata/controller/ConsumptionQuotaController.java` | API Endpoint | Bổ sung `@DeleteMapping("/{id}")` với `@PreAuthorize("hasAnyAuthority('PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_FARM_UPDATE')")`. |
| 8 | `backend/.../modules/masterdata/controller/WorkShiftController.java` | API Endpoint & RBAC | Cập nhật POST, PUT, DELETE: `@PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_FARM_UPDATE')")`. Bổ sung `@DeleteMapping("/{id}")`. |
| 9 | `backend/.../modules/masterdata/controller/CostCategoryController.java` | API Endpoint & RBAC | Cập nhật POST, PUT, DELETE: `@PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE')")`. Bổ sung `@DeleteMapping("/{id}")`. |
| 10 | `backend/.../modules/geography/controller/FarmOperationsController.java` | API Endpoint | Bổ sung `@DeleteMapping({"/cycles/{cycleId}", "/operations/cycles/{cycleId}"})` với `@PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")`. |
| 11 | `backend/.../modules/masterdata/service/MasterCatalogService.java` | Service Interface | Bổ sung 5 phương thức: `deleteCropType`, `deleteLivestockBreed`, `deleteConsumptionQuota`, `deleteWorkShift`, `deleteCostCategory`. |
| 12 | `backend/.../modules/masterdata/service/impl/MasterCatalogServiceImpl.java` | Service Impl | Hiện thực nghiệp vụ kiểm tra ràng buộc khóa ngoại và xóa / ném exception cho 5 danh mục trên. |
| 13 | `backend/.../modules/masterdata/service/MaterialService.java` | Service Interface | Bổ sung 2 phương thức: `deleteMaterialCategory`, `deleteMaterial`. |
| 14 | `backend/.../modules/masterdata/service/impl/MaterialServiceImpl.java` | Service Impl | Hiện thực xóa nhóm vật tư (kiểm tra rỗng) và xóa mặt hàng vật tư (xóa mềm `DISCONTINUED` nếu đã có phát sinh kho / BOM). |
| 15 | `backend/.../modules/masterdata/service/WarehouseService.java` | Service Interface | Bổ sung phương thức `deleteWarehouse(Long farmId, Long warehouseId)`. |
| 16 | `backend/.../modules/masterdata/service/impl/WarehouseServiceImpl.java` | Service Impl | Kiểm tra tồn kho > 0 (chặn xóa), lịch sử phiếu kho (chuyển `INACTIVE`), và xóa vật lý nếu kho mới tạo. |
| 17 | `backend/.../modules/geography/service/FarmOperationsService.java` | Service Interface | Bổ sung phương thức `deleteCycle(Long farmId, Long cycleId)`. |
| 18 | `backend/.../modules/geography/service/impl/FarmOperationsServiceImpl.java` | Service Impl | Kiểm tra liên kết mùa vụ, đàn nuôi, ngân sách. Đóng `CLOSED` nếu đang hoạt động hoặc xóa vật lý nếu sạch. |
| 19-31 | `backend/.../repository/*.java` (13 Repositories) | Data Access | Thêm các hàm `existsBy*`, `findByTenantIdAndId`, `sumQuantityOnHandByWarehouseId` phục vụ ràng buộc khóa ngoại an toàn. |
| 32 | `backend/src/test/.../EmployeeDepartmentAndIsolationTest.java` | Unit Test Fix | Bổ sung 3 mock repositories mới vào constructor `FarmOperationsServiceImpl`. |

### 2. Frontend (React 18, Vite, Zustand)
| STT | File Path | Chi tiết cập nhật |
|:---:|:---|:---|
| 1 | `frontend/src/services/modules/geographyService.js` | Bổ sung hàm `deleteCycle(farmId, cycleId)` gọi endpoint REST DELETE. |
| 2 | `frontend/src/pages/settings/tabs/EnterpriseProfileTab.jsx` | Thêm kiểm tra `canEdit` qua `isFarmOwner()`. Giám đốc trang trại xem ở chế độ read-only kèm Banner thông báo trang nhã; ẩn nút Lưu. |
| 3 | `frontend/src/pages/settings/tabs/CyclesAndFarmSettingsTab.jsx` | Thêm Dropdown chọn trang trại khi `activeFarmId === 'ALL'`, nút Xóa chu kỳ (icon Trash2) kèm confirm & reload. |
| 4 | `frontend/src/pages/settings/tabs/WarehousesTab.jsx` | Thêm Dropdown chọn trang trại khi `activeFarmId === 'ALL'`, đổi `<Can>` bọc Add/Edit/Delete sang `anyPermissions={["PERM_FARM_UPDATE", "PERM_INVENTORY_RECEIPT"]}`. |
| 5 | `frontend/src/pages/settings/tabs/ConsumptionQuotasTab.jsx` | Thêm Dropdown chọn trang trại khi `activeFarmId === 'ALL'`, truyền tự động `farmId: effectiveFarmId` trong payload tạo BOM quota. |
| 6 | `frontend/src/pages/settings/tabs/MaterialsTab.jsx` | Đổi điều kiện `<Can>` bọc nút Thêm/Sửa/Xóa Nhóm và Mặt hàng sang `anyPermissions={["PERM_FARM_UPDATE", "PERM_INVENTORY_RECEIPT"]}`. |

---

## III. MA TRẬN TRẠNG THÁI 9 TAB TẠI `/app/settings` CHO `ROLE_FARM_MANAGER`

| Tab | Tên Tab | Quyền truy cập | Thêm mới | Sửa | Xóa | Cơ chế bảo vệ khóa ngoại / Trạng thái hoạt động |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| **Tab 1** | Hồ Sơ Pháp Nhân & VietQR | Xem (Read-only) | N/A | Khóa (Chỉ Owner) | Khóa | Toàn bộ trường `disabled`, hiển thị Banner: *"Thông tin pháp nhân doanh nghiệp và tài khoản VietQR tổng do Chủ đầu tư (Farm Owner) quản lý. Giám đốc trang trại có quyền xem để đối chiếu chứng từ & truy xuất nguồn gốc."* Ẩn nút Lưu. |
| **Tab 2** | Chu Kỳ & Ngưỡng Trang Trại | Toàn quyền (CRUD) | Có | Có | Có | Có Dropdown chọn trang trại khi ở mode `'ALL'`. Xóa chu kỳ: chuyển `status = 'CLOSED'` nếu đã gắn mùa vụ/đàn/ngân sách; xóa vật lý nếu chưa phát sinh dữ liệu. |
| **Tab 3** | Giống Cây Trồng | Toàn quyền (CRUD) | Có | Có | Có | Chặn xóa (`BusinessException`) nếu giống đã phát sinh trong `crop_seasons` hoặc `consumption_quotas`. Xóa vật lý nếu chưa dùng. |
| **Tab 4** | Giống Vật Nuôi | Toàn quyền (CRUD) | Có | Có | Có | Chặn xóa (`BusinessException`) nếu giống đã phát sinh trong `livestock_groups` hoặc `consumption_quotas`. Xóa vật lý nếu chưa dùng. |
| **Tab 5** | Nhóm & Mặt Hàng Vật Tư | Toàn quyền (CRUD) | Có | Có | Có | Nhóm: chặn xóa nếu có mặt hàng. Mặt hàng: **Xóa mềm** sang `DISCONTINUED` nếu đã có phiếu kho/tồn kho/định mức BOM; xóa vật lý nếu chưa có liên kết. |
| **Tab 6** | Hệ Thống Kho Bãi | Toàn quyền (CRUD) | Có | Có | Có | Có Dropdown chọn trang trại khi ở mode `'ALL'`. Kho có hàng tồn (`quantity > 0`): chặn xóa. Kho đã phát sinh lịch sử nhưng tồn = 0: **Vô hiệu hóa** sang `INACTIVE`. Kho mới: xóa vật lý. |
| **Tab 7** | Định Mức Kỹ Thuật (BOM) | Toàn quyền (CRUD) | Có | Có | Có | Có Dropdown chọn trang trại khi ở mode `'ALL'`. Đã gửi `farmId` hợp lệ trong request tạo định mức. Xóa an toàn theo Tenant và Farm context. |
| **Tab 8** | Ca Làm Việc Chuẩn | Toàn quyền (CRUD) | Có | Có | Có | Chặn xóa (`BusinessException`) nếu ca đã được phân công (`shift_assignments`) hoặc có bảng chấm công (`time_attendances`). Xóa vật lý nếu chưa dùng. |
| **Tab 9** | Nhóm Chi Phí Kế Toán | Toàn quyền (CRUD) | Có | Có | Có | Chặn xóa (`BusinessException`) nếu nhóm chi phí đã gắn chứng từ (`farm_expenses`) hoặc dòng dự toán (`budget_line_items`). Xóa vật lý nếu chưa dùng. |

---

## IV. BẰNG CHỨNG KIỂM THỬ (TEST & COMPILATION RESULTS)

### 1. Backend Verification
- **`mvn test-compile`**:
  ```text
  [INFO] BUILD SUCCESS
  [INFO] Total time: 1.619 s
  ```
- **`mvn test` (Toàn bộ 43 test integration & isolation)**:
  ```text
  [INFO] Running com.farm.saas.QualityAndHrIntegrationTest
  [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SecurityAndTenantIsolationIntegrationTest
  [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SystemSubscriptionAndLimitsIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  ...
  [INFO] Results:
  [INFO] Tests run: 43, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS
  ```

### 2. Frontend Verification
- **`npm run build`**:
  ```text
  vite v5.4.21 building for production...
  ✓ 1769 modules transformed.
  dist/index.html                     1.01 kB │ gzip:   0.60 kB
  dist/assets/index-DE-IUD-U.css     72.84 kB │ gzip:  11.82 kB
  dist/assets/index-CxNgK30f.js   1,212.36 kB │ gzip: 306.93 kB
  ✓ built in 3.54s
  ```
- **`npx vitest run`**:
  ```text
  Test Files  2 passed (2)
       Tests  9 passed (9)
    Duration  2.76s
  ```

---
**KẾT LUẬN:** Task 1 đã hoàn tất 100% đúng tiến độ và tiêu chuẩn kiến trúc phần mềm doanh nghiệp, sẵn sàng để người dùng tiếp tục triển khai Task 2!
