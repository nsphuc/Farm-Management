# BÁO CÁO HOÀN THÀNH THỰC THI (TASK 1 / 3 - ROLE_TECHNICAL_STAFF)
## MỞ KHÓA MENU ĐIỀU HƯỚNG, CÀI ĐẶT DANH MỤC KỸ THUẬT (`/app/settings`), TRA CỨU KHO (WS-C) & VÁ LỖI HTTP 403 DANH SÁCH CÔNG NHÂN (WS-G)

- **Người thực hiện:** Principal Software Architect & Senior Fullstack Engineer
- **Hệ thống:** Agri-ERP Multi-Tenant SaaS
- **Đối tượng:** Tài khoản Cấp 4 Tầng Thực thi — `ROLE_TECHNICAL_STAFF` (`tech`) / Operational Role: `TECHNICAL_LEAD`
- **Mã kiểm toán xử lý:** `GAP-TECH-01`, `GAP-TECH-02`, `GAP-TECH-03`, `GAP-TECH-04`, `GAP-TECH-05`
- **Trạng thái:** **100% HOÀN THÀNH - ZERO COMPILATION ERROR - 100% INTEGRATION TESTS PASS**

---

## 1. TỔNG QUAN CÁC HẠNG MỤC ĐÃ HOÀN THÀNH

| Mã Lỗ Hổng | Hạng Mục & Vị Trí Xử Lý | Trạng Thái Trước Fix | Trạng Thái Sau Fix |
| :--- | :--- | :--- | :--- |
| **`GAP-TECH-05`** | `backend/.../EmployeeController.java` (`GET /api/v1/hr/employees`) | Trả về `403 Forbidden` do chỉ cho phép `PERM_HR_EMPLOYEE_MANAGE` và Roles Cấp 1-3. Khiến `CreateTaskModal` và `TeamRollCallPanel` (WS-G) bị rỗng danh sách công nhân. | **ĐÃ VÁ:** Mở quyền cho `PERM_TASK_ASSIGN`, `PERM_HR_ATTENDANCE` và `ROLE_TECHNICAL_STAFF`. Kỹ sư load mượt mà 100% danh sách công nhân để giao việc & điểm danh. |
| **`GAP-TECH-01`** | `frontend/.../TenantAppShell/menuConfig.js` (`case 'TECHNICAL_LEAD'`) | Sidebar bị thiếu WS-C và thiếu link Cài đặt Danh mục Kỹ thuật (`/app/settings`). Kỹ sư bị "mù" tồn kho và không có lối vào cấu hình giống. | **ĐÃ HOÀN THÀNH:** Bổ sung `ALL_WORKSPACES.C_InventoryHub` ("WS-C: Tra Cứu Tồn Kho Vật Tư") và `independentModules` ("Danh Mục Giống & Định Mức BOM"). Cập nhật `routes.jsx` và `anyPermissions`. |
| **`GAP-TECH-02`** | `frontend/.../pages/settings/index.jsx` | Kỹ sư vào `/app/settings` bị thấy cả 9 tab doanh nghiệp/kế toán/kho; tab mặc định rơi vào `'enterprise'` (Hồ sơ Napas) không thuộc thẩm quyền. | **ĐÃ HOÀN THÀNH:** Tự động lọc chỉ hiển thị đúng 3 tab kỹ thuật (`crop-types`, `livestock-breeds`, `quotas`), ẩn hoàn toàn 6 tab quản trị. Mặc định tự chuyển sang tab đầu tiên hợp lệ. |
| **`GAP-TECH-03`** | `CropTypesTab.jsx`, `LivestockBreedsTab.jsx`, `ConsumptionQuotasTab.jsx` | Toàn bộ nút `[+ Thêm]`, `[Sửa]`, `[Xóa]` bị khóa cứng bởi `PERM_FARM_UPDATE` khiến Kỹ sư chỉ có thể xem mà không thể khai báo giống mới hay sửa BOM. | **ĐÃ HOÀN THÀNH:** Mở khóa toàn diện bằng `anyPermissions` (`PERM_CROP_PLAN` / `PERM_LIVESTOCK_MANAGE`). Kích hoạt `notifyDataChanged('all')` để đồng bộ dữ liệu tức thì sang WS-E. |
| **`GAP-TECH-04`** | `frontend/.../workspaces/C_InventoryHub/index.jsx` | Tab mặc định là `'RECEIPTS'` (nhập kho - dành cho thủ kho) thay vì tồn kho; chưa có chỉ dẫn nghiệp vụ rõ ràng cho vai trò tra cứu kỹ thuật. | **ĐÃ HOÀN THÀNH:** Tự động khởi tạo tab mặc định là `'STOCK'` (Tồn kho tức thời & Số lô / Hạn dùng). Hiển thị Banner hướng dẫn chuyên môn và Badge *"🔬 Chế Độ Tra Cứu Kỹ Thuật"*. |

---

## 2. CHI TIẾT THAY ĐỔI THEO TỪNG FILE MÃ NGUỒN

### 2.1. Backend (Spring Boot 3.3.4 / Java 21)

#### 1. `backend/src/main/java/com/farm/saas/modules/hr/controller/EmployeeController.java` (`GAP-TECH-05`)
- **Thay đổi:** Nâng cấp `@PreAuthorize` tại 2 endpoint:
  - `GET /api/v1/hr/employees`
  - `GET /api/v1/hr/employees/{id}`
- **Annotation sau cập nhật:**
  ```java
  @PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_TASK_ASSIGN', 'PERM_HR_ATTENDANCE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_ACCOUNTANT')")
  ```
- **Bảo mật:** Giữ nguyên các thao tác ghi dữ liệu (`POST`, `PUT`, `PATCH` nghỉ việc) dành riêng cho `PERM_HR_EMPLOYEE_MANAGE`.

#### 2. `backend/src/main/java/com/farm/saas/modules/masterdata/controller/WarehouseController.java`
- **Thay đổi:** Nâng cấp `@PreAuthorize` tại 2 endpoint:
  - `GET /api/v1/farms/{farmId}/warehouses`
  - `GET /api/v1/farms/{farmId}/warehouses/{warehouseId}`
- **Annotation sau cập nhật:**
  ```java
  @PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
  ```

#### 3. `backend/src/main/java/com/farm/saas/modules/masterdata/controller/MaterialController.java`
- **Thay đổi:** Bổ sung quyền kỹ thuật và role `ROLE_TECHNICAL_STAFF` cho `GET /api/v1/materials` và `GET /api/v1/materials/{id}`:
  ```java
  @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')")
  ```

#### 4. `backend/src/main/java/com/farm/saas/modules/masterdata/controller/MaterialCategoryController.java`
- **Thay đổi:** Cho phép Kỹ sư kỹ thuật tra cứu nhóm vật tư khi lập định mức BOM tại `GET /api/v1/material-categories`:
  ```java
  @PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF')")
  ```

---

### 2.2. Frontend (React 19 / Vite / Tailwind)

#### 1. `frontend/src/shells/TenantAppShell/menuConfig.js` (`GAP-TECH-01`)
- Mở rộng `ALL_INDEPENDENT_MODULES.settings.anyPermissions` bao gồm `['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']`.
- Trong `case 'TECHNICAL_LEAD':`:
  - Thêm workspace `ALL_WORKSPACES.C_InventoryHub` với label `'WS-C: Tra Cứu Tồn Kho Vật Tư'` và badge `'Tra cứu kho'`.
  - Cấu hình `independentModules`: `[{ ...ALL_INDEPENDENT_MODULES.settings, label: 'Danh Mục Giống & Định Mức BOM', badge: 'Kỹ thuật' }]`.

#### 2. `frontend/src/app/routes.jsx`
- Mở rộng `PermissionGuard` của route `path="settings"` để kỹ sư kỹ thuật truy cập hợp lệ:
  ```jsx
  <PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']}>
    <SettingsPage />
  </PermissionGuard>
  ```

#### 3. `frontend/src/pages/settings/index.jsx` (`GAP-TECH-02`)
- Tích hợp `useAuthStore` để xác định trạng thái `isTechStaff`:
  ```javascript
  const isTechStaff = isTechnicalLead() || (!hasPermission('PERM_FARM_UPDATE') && (hasPermission('PERM_CROP_PLAN') || hasPermission('PERM_LIVESTOCK_MANAGE')));
  ```
- **Lọc tab hiển thị:** Nếu là `isTechStaff`, chỉ giữ lại 3 tab: `'crop-types'`, `'livestock-breeds'`, `'quotas'` (và lọc tiếp theo `supportsCrop` / `supportsLivestock` của trang trại đang chọn).
- **Tab mặc định thông minh:** Tự động fallback sang `defaultTab = visibleTabs[0].id` thay vì ép buộc `'enterprise'`, đồng thời tự động cập nhật URL search param `?tab=...`.
- **Giao diện ngữ cảnh:** Đổi tiêu đề banner thành *"Danh Mục Giống & Định Mức BOM"*, gắn badge *"🔬 Chuyên môn Kỹ thuật"*, và đổi tiêu đề thanh menu thành *"Danh Mục Kỹ Thuật"*.

#### 4. `frontend/src/pages/settings/tabs/CropTypesTab.jsx` (`GAP-TECH-03`)
- Đổi các thẻ `<Can permission="PERM_FARM_UPDATE">` bọc nút `[+ Thêm Giống Cây Trồng]`, `[Sửa]`, `[Xóa]` thành:
  ```jsx
  <Can anyPermissions={['PERM_CROP_PLAN', 'PERM_FARM_UPDATE']}>
  ```
- Thêm `useActiveFarmStore.getState().notifyDataChanged?.('all')` sau khi lưu và xóa thành công để đồng bộ dữ liệu tức thì sang WS-E.

#### 5. `frontend/src/pages/settings/tabs/LivestockBreedsTab.jsx` (`GAP-TECH-03`)
- Đổi các thẻ `<Can permission="PERM_FARM_UPDATE">` bọc nút `[+ Thêm Giống Vật Nuôi]`, `[Sửa]`, `[Xóa]` thành:
  ```jsx
  <Can anyPermissions={['PERM_LIVESTOCK_MANAGE', 'PERM_FARM_UPDATE']}>
  ```
- Thêm `useActiveFarmStore.getState().notifyDataChanged?.('all')` sau khi lưu và xóa thành công.

#### 6. `frontend/src/pages/settings/tabs/ConsumptionQuotasTab.jsx` (`GAP-TECH-03`)
- Đổi các thẻ `<Can permission="PERM_FARM_UPDATE">` bọc nút `[+ Thêm Định Mức BOM]`, `[Sửa]`, `[Xóa]` thành:
  ```jsx
  <Can anyPermissions={['PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_FARM_UPDATE']}>
  ```
- Thêm `useActiveFarmStore.getState().notifyDataChanged?.('all')` sau khi lưu và xóa thành công.

#### 7. `frontend/src/workspaces/C_InventoryHub/index.jsx` (`GAP-TECH-04`)
- Cập nhật biến `isReadOnly`:
  ```javascript
  const isReadOnly = Boolean(owner || technicalLead || !hasReceiptPerm);
  ```
- Khởi tạo tab mặc định: `const [activeTab, setActiveTab] = useState(isReadOnly ? 'STOCK' : 'RECEIPTS');`
- Hiển thị tiêu đề ngữ cảnh: `WS-C: Tra Cứu Tồn Kho Vật Tư` kèm badge *"🔬 Chế Độ Tra Cứu Kỹ Thuật"*.
- Hiển thị Banner hướng dẫn chuyên môn:
  > **Chế độ Tra cứu Kỹ thuật:** Bạn đang xem tồn kho vật tư, số lô và hạn sử dụng theo thời gian thực để phục vụ lập kế hoạch canh tác và kê đơn thú y.

---

## 3. KẾT QUẢ KIỂM THỬ TÍCH HỢP & BIÊN DỊCH

### 3.1. Backend Build & Test (Maven)
```bash
mvn test '-Dtest=EmployeeDepartmentAndIsolationTest,FarmSaasApplicationTests'
```
- **Kết quả:**
  - `com.farm.saas.EmployeeDepartmentAndIsolationTest`: **5/5 tests PASS** (2.304s)
  - `com.farm.saas.FarmSaasApplicationTests`: **8/8 tests PASS** (10.89s)
  - **Tổng cộng:** `13/13 tests PASS` (Failures: 0, Errors: 0, Skipped: 0)
  - **Build Status:** `BUILD SUCCESS` (Total time: 16.109 s)

### 3.2. Frontend Build & Test (Vite & Vitest)
```bash
npm run build
```
- **Kết quả:** `built in 4.04s` - 1781 modules transformed, 0 lỗi cú pháp hoặc Type checking.

```bash
npx vitest run
```
- **Kết quả:**
  - `Test Files: 2 passed (2)`
  - `Tests: 9 passed (9)`
  - `Duration: 2.85s`

---

## 4. KẾT LUẬN & SẴN SÀNG CHO TASK 2 / 3
Task 1 / 3 đã hoàn thành xuất sắc toàn bộ 5 mã lỗ hổng từ `GAP-TECH-01` đến `GAP-TECH-05`:
1. `ROLE_TECHNICAL_STAFF` (`tech`) có đầy đủ quyền tra cứu nhân sự hiện trường để giao việc và điểm danh tổ tại WS-G không còn bị 403.
2. Được trang bị đầy đủ menu và giao diện tra cứu kho tức thời tại WS-C phục vụ lập kế hoạch vật tư.
3. Được quyền quản trị chuyên môn toàn diện cho 3 danh mục kỹ thuật tại `/app/settings` (Giống cây, Giống vật nuôi, Định mức BOM) và dữ liệu được đồng bộ liên Workspace theo thời gian thực.
4. Hệ thống đã sẵn sàng cho **Task 2 / 3**: Mở khóa toàn diện **WS-E (Canh tác & Chăn nuôi)** và **WS-A (Phân khu địa lý)**.
