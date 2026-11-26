# Báo Cáo Phân Tích Phân Quyền (RBAC) & Kế Hoạch Kiểm Thử — FarmGo

- **Ngày phân tích:** 26/11/2026
- **Phạm vi:** 4 nhóm tài khoản nhân viên (`accountant`, `tech`, `manager`, `worker`) trên toàn bộ hệ thống Frontend (`React + Vite`), Backend (`Spring Boot + Spring Security`) và Database (`farm_saas_dev`).
- **Nguyên tắc:** Căn cứ 100% vào code, cấu hình và dữ liệu thực tế hiện tại; không tự suy đoán quyền; chưa sửa code, chưa thay đổi database và chưa chạy kiểm thử trình duyệt ở giai đoạn lập kế hoạch.

---

## 1. Kiến Trúc Hệ Thống Phân Quyền Hiện Tại (3 Lớp)

### 1.1. Lớp Cơ sở dữ liệu & Cấu hình (`farm_saas_dev`)
- **Bảng chính:**
  - `roles`: 6 vai trò hệ thống (`ROLE_SUPER_ADMIN`, `ROLE_FARM_OWNER`, `ROLE_BARN_WORKER`, `ROLE_TECHNICAL_STAFF`, `ROLE_ACCOUNTANT`, `ROLE_FARM_MANAGER`) + vai trò tùy chỉnh (`ROLE_CUSTOM_1_*`).
  - `permissions` & `role_permissions`: Ánh xạ mã quyền hiện đại dạng `<module>.view` / `<module>.manage` (VD: `barns.view`, `barns.manage`, `financial.price.view`, `workforce.salary.view`, ...).
  - `user_roles`: Gán `role_id` cho từng `user_id` theo `farm_id`.
  - `user_farm_access`: Xác định danh sách `farm_id` mà nhân viên được phép truy cập (Tenant/Farm Isolation).
  - `farm_members`: Lưu phạm vi dữ liệu cấp chuồng (`all_barns`, `barn_ids` JSON array).
  - `farm_add_on_subscriptions`: Lưu 6 dịch vụ mở rộng (`BRANCHES`, `PAYROLL`, `CUSTOM_ROLES`, `BREEDING`, `POULTRY_HATCHERY`, `FEED_MILL`) — hiện cả 6 đều đang `ACTIVE` tại `farm_id = 1`.

**Quyền thực tế trong `role_permissions` (truy vấn trực tiếp từ MySQL `farm_saas_dev`):**

| Vai trò (DB `roles.code`) | Scope Level | Danh sách mã quyền (`permissions.code`) thực tế trong DB |
| :--- | :---: | :--- |
| **`ROLE_ACCOUNTANT`** (`accountant`) | `FARM` | `cashbook.manage`, `cashbook.view`, `financial.price.view`, `inventory.manage`, `inventory.view`, `purchase_invoices.manage`, `purchase_invoices.view`, `sales.manage`, `sales.view`, `workforce.view` *(10 quyền)* |
| **`ROLE_TECHNICAL_STAFF`** (`tech`) | `FARM` | `barns.manage`, `barns.view`, `daily_logs.manage`, `daily_logs.view`, `inventory.view`, `livestock_settings.manage`, `livestock_settings.view` *(7 quyền)* |
| **`ROLE_FARM_MANAGER`** (`manager`) | `FARM` | `barns.manage`, `barns.view`, `branches.manage`, `branches.view`, `cashbook.manage`, `cashbook.view`, `daily_logs.manage`, `daily_logs.view`, `financial.price.view`, `general_settings.manage`, `general_settings.view`, `inventory.manage`, `inventory.view`, `livestock_settings.manage`, `livestock_settings.view`, `payroll.manage`, `payroll.view`, `purchase_invoices.manage`, `purchase_invoices.view`, `roles.view`, `sales.manage`, `sales.view`, `workforce.manage`, `workforce.view` *(24 quyền — xem Gap #3)* |
| **`ROLE_BARN_WORKER`** (`worker`) | `BARN` | `barns.view`, `daily_logs.manage`, `daily_logs.view`, `inventory.view` *(4 quyền)* |

### 1.2. Luồng tải Vai trò & Quyền sau khi Đăng nhập
1. `POST /api/v1/auth/login` (`AuthServiceImpl.java`):
   - Đọc `user_roles` → `roles` → `role_permissions` → `permissions`, `user_farm_access` (`accessibleFarmIds`), `farm_add_on_subscriptions`.
   - Đưa `roles` (`ROLE_*`) và `permissions` (`*.view`/`*.manage`) vào **JWT Access Token** (`JwtTokenProvider`) và trả về `userInfo` cho Frontend (`useAuthStore` lưu Access Token trong bộ nhớ RAM).
   - **Lưu ý quan trọng:** Trong `userInfo`, `userInfo.roles` là **mảng Object** `[{ id, code: 'ROLE_...', name: '...' }]` (không phải mảng String), còn `userInfo.permissions` là mảng String.
2. Mỗi request API được `JwtAuthenticationFilter` giải mã thành `CustomUserDetails` chứa danh sách `GrantedAuthority` gồm cả `ROLE_*` và `permissions`.

### 1.3. Lớp Frontend (Menu, Route Guard & Page Guard)
- **Sidebar (`menuConfig.js` + `DynamicSidebar.jsx`):**
  - Luôn hiển thị `Tổng quan` (`/app/dashboard`).
  - 10 mục Core lọc theo `item.permission` (hoặc `item.anyPermissions`). Riêng `DynamicSidebar.jsx` có thêm bộ lọc `isWorkerOnly` ẩn `inventory` và `internal-transfers` với `ROLE_BARN_WORKER`/`ROLE_FIELD_STAFF`.
  - 6 mục Add-on lọc theo **điều kiện kép**: `addonCode ∈ enabledAddons` **AND** `item.permission ∈ userInfo.permissions` (hoặc `isOwner`).
- **Route Guard (`routes.jsx`):**
  - `/platform/*` và `/admin/*`: Chặn hoàn toàn 4 nhân viên trang trại (`RoleScopeGuard(PLATFORM)` / `PlatformDispatcher` đẩy về `/app/dashboard`).
  - `/app/*`: Chỉ bọc `AuthGuard` + `MustChangePasswordGuard` + `RoleScopeGuard(TENANT)`. **`PermissionGuard.jsx` đã viết nhưng CHƯA được gắn vào bất kỳ route nào trong `routes.jsx`!**
  - Chỉ có 2 trang tự chặn hiển thị nội bộ (`if (!canAccess...)`): `CashbookPage.jsx` và `WorkforcePage.jsx`. 14 trang còn lại mở trực tiếp được nếu gõ URL!

### 1.4. Lớp Backend (`SecurityConfiguration.java`, `@PreAuthorize`, `FarmSecurityEvaluator`)
- Bật `@EnableMethodSecurity(prePostEnabled = true)`.
- `@farmSecurity.canAccessFarm(#farmId)` kiểm tra cô lập Tenant + `user_farm_access` (`accessibleFarmIds`).
- `@farmSecurity.canAccessBarn(#farmId, #barnId)` kiểm tra `farm_members.all_barns` và `farm_members.barn_ids` (trừ Owner hoặc người có `barns.manage`).

---

## 2. Phân Tích Chi Tiết Từng Vai Trò (Menu, Route, Chức Năng & Phạm Vi Dữ Liệu)

### 2.1. Vai trò 1: `accountant` (`accountant_hoabinh` / `0955444555` — `ROLE_ACCOUNTANT`)
- **Phạm vi dữ liệu:** `farm_id = 1`, `all_barns = 1` (toàn bộ chuồng thuộc trại 1).
- **Menu ĐƯỢC nhìn thấy trên Sidebar (7 mục):**
  1. `Tổng quan` (`/app/dashboard`)
  2. `Kho hàng hóa` (`/app/inventory` — có `inventory.view`)
  3. `Xuất nhập nội bộ` (`/app/internal-transfers` — khớp `anyPermissions: ['inventory.view']`)
  4. `Hóa đơn nhập hàng` (`/app/purchase-invoices` — có `purchase_invoices.view`)
  5. `Quản lý bán hàng` (`/app/sales` — có `sales.view`)
  6. `Sổ quỹ` (`/app/cashbook` — có `cashbook.view`)
  7. `Nhân công` (`/app/workforce` — có `workforce.view`)
- **Menu KHÔNG được nhìn thấy (10 mục):**
  - Core: `Khu nuôi`, `Ghi nhật ký`, `Thiết lập chăn nuôi`, `Thiết lập chung` (cùng 5 menu con).
  - Add-ons: `Đa chi nhánh`, `Lương & Chấm công KPI`, `Mở rộng vai trò`, `Gia súc sinh sản`, `Ấp nở & Trứng giống`, `Sản xuất cám`.
- **Route được phép truy cập (nghiệp vụ):** `/app/dashboard`, `/app/inventory`, `/app/internal-transfers`, `/app/purchase-invoices`, `/app/sales`, `/app/cashbook`, `/app/workforce`.
- **Route KHÔNG được phép truy cập:** `/app/barns*`, `/app/daily-logs`, `/app/livestock-settings`, `/app/general-settings`, `/app/branches`, `/app/payroll-kpi`, `/app/custom-roles`, `/app/breeding-livestock`, `/app/hatchery`, `/app/feed-production`, `/platform/*`, `/admin/*`.
- **Quyền thao tác thực tế & lỗi lệch phát hiện:**
  - **Xem giá vốn / Tài chính:** Có `financial.price.view` → thấy giá trên `SalesPage`, nhưng `InventoryPage` / `PurchaseInvoicesPage` / `InternalTransfersPage` / `WorkforcePage` check `financial.view_cost` + `userRoles.includes('ROLE_ACCOUNTANT')` (lỗi mảng Object!) → **bị ẩn nhầm giá vốn/lương hoặc nút tạo!**
  - **API bị chặn oan (403):** `GET /api/v1/materials`, `GET /api/v1/material-categories`, `GET /api/v1/farms/1/warehouses`, `GET /api/v1/partners`, `GET /api/v1/farms/1/inventory/issues`, `GET /api/v1/farms/1/inventory/stocktakes` **thiếu `ROLE_ACCOUNTANT` và `inventory.view`** → Kế toán kho mở Kho / Nhập hàng / Xuất nhập nội bộ sẽ bị **403**!

---

### 2.2. Vai trò 2: `tech` (`tech_hoabinh` / `0966333444` — `ROLE_TECHNICAL_STAFF`)
- **Phạm vi dữ liệu:** `farm_id = 1`, `all_barns = 1` (toàn bộ chuồng thuộc trại 1).
- **Menu ĐƯỢC nhìn thấy trên Sidebar (6 mục):**
  1. `Tổng quan` (`/app/dashboard`)
  2. `Khu nuôi` (`/app/barns` — có `barns.view`)
  3. `Ghi nhật ký` (`/app/daily-logs` — có `daily_logs.view`)
  4. `Kho hàng hóa` (`/app/inventory` — có `inventory.view`, **ẩn cột giá vốn**)
  5. `Xuất nhập nội bộ` (`/app/internal-transfers` — khớp `anyPermissions: ['inventory.view']`)
  6. `Thiết lập chăn nuôi` (`/app/livestock-settings` — có `livestock_settings.view`)
- **Menu KHÔNG được nhìn thấy (11 mục):**
  - Core: `Hóa đơn nhập hàng`, `Quản lý bán hàng`, `Sổ quỹ`, `Nhân công`, `Thiết lập chung`.
  - Add-ons: Cả 6 mục Add-on (`Đa chi nhánh`, `Lương KPI`, `Mở rộng vai trò`, `Gia súc sinh sản`, `Ấp nở`, `Sản xuất cám`).
- **Route được phép truy cập (nghiệp vụ):** `/app/dashboard`, `/app/barns*`, `/app/daily-logs`, `/app/inventory`, `/app/internal-transfers`, `/app/livestock-settings`.
- **Route KHÔNG được phép truy cập:** `/app/purchase-invoices`, `/app/sales`, `/app/cashbook`, `/app/workforce`, `/app/general-settings`, 6 route Add-ons, `/platform/*`, `/admin/*`.
- **Quyền thao tác thực tế & lỗi lệch phát hiện:**
  - Có `barns.manage` & `livestock_settings.manage` → tạo/sửa/xóa chuồng, lứa nuôi, định mức cám, lịch vắc-xin.
  - Có `daily_logs.manage` → ghi/sửa/xóa nhật ký (nhưng trên UI `DailyLogsPage.jsx` line 223 chỉ check `daily_logs.update` nên nút Sửa/Xóa có thể ẩn).
  - Trong `InternalTransfersPage.jsx`, `userRoles.includes('ROLE_TECHNICAL_STAFF')` bị lỗi mảng Object → nút `+ Tạo phiếu` bị ẩn dù Backend `POST /issues` và `POST /transfers` cho phép `ROLE_TECHNICAL_STAFF`!
  - **Lỗ hổng BE:** `POST /api/v1/purchase-invoices` (line 51) cho phép `ROLE_TECHNICAL_STAFF` tạo hóa đơn nhập hàng dù không có quyền mua hàng!

---

### 2.3. Vai trò 3: `manager` (`manager_hoabinh` / `0977111222` — `ROLE_FARM_MANAGER`)
- **Phạm vi dữ liệu:** `farm_id = 1`, `all_barns = 1` (toàn bộ chuồng thuộc trại 1).
- **Menu ĐƯỢC nhìn thấy trên Sidebar HIỆN TẠI (14 mục — quá rộng do DB cấp 24 quyền!):**
  1. `Tổng quan` (`/app/dashboard`)
  2. `Khu nuôi` (`/app/barns`)
  3. `Ghi nhật ký` (`/app/daily-logs`)
  4. `Kho hàng hóa` (`/app/inventory` — ẩn giá vốn trên UI)
  5. `Xuất nhập nội bộ` (`/app/internal-transfers`)
  6. `Hóa đơn nhập hàng` (`/app/purchase-invoices` — *có trong DB*)
  7. `Quản lý bán hàng` (`/app/sales` — *có trong DB*)
  8. `Sổ quỹ` (`/app/cashbook` — *có `cashbook.view` trong DB!*)
  9. `Nhân công` (`/app/workforce`)
  10. `Thiết lập chăn nuôi` (`/app/livestock-settings`)
  11. `Thiết lập chung` (`/app/general-settings` + 5 menu con — *có `general_settings.view` trong DB!*)
  12. `Đa chi nhánh` (`/app/branches` — *Add-on ACTIVE + có `branches.view`*)
  13. `Lương & Chấm công KPI` (`/app/payroll-kpi` — *Add-on ACTIVE + có `payroll.view`*)
  14. `Mở rộng vai trò` (`/app/custom-roles` — *Add-on ACTIVE + có `roles.view`*)
- **Menu KHÔNG được nhìn thấy (3 mục):** `Gia súc sinh sản`, `Ấp nở & Trứng giống`, `Sản xuất cám` (chưa cấp `breeding.view`, `poultry_hatchery.view`, `feed_mill.view` trong DB).
- **Route KHÔNG được phép truy cập:** `/platform/*`, `/admin/*` (và về mặt nghiệp vụ nhạy cảm: không nên vào Sổ quỹ, Lương KPI, Thiết lập gói cước/Chủ trại, giá vốn).
- **Lệch nghiêm trọng phát hiện:**
  - DB `role_permissions` đang cấp cho `ROLE_FARM_MANAGER` cả `cashbook.manage`, `financial.price.view`, `general_settings.manage`, `payroll.manage`, `branches.manage`, khiến Trại trưởng nhìn thấy **Sổ quỹ**, **Thiết lập chung**, **Lương KPI** và **được gọi API sửa/xóa** (chỉ bị ẩn PnL ở `BarnsPage` & cột giá ở `InventoryPage`/`WorkforcePage` nhờ chặn cứng trên FE!).

---

### 2.4. Vai trò 4: `worker` (`worker_hoabinh` / `0944555666` — `ROLE_BARN_WORKER`)
- **Phạm vi dữ liệu (Data Scope):** `farm_id = 1`, **`all_barns = 0`**, **`barn_ids = [1, 2, 7]`** (chỉ thấy các chuồng được giao trong bảng `farm_members`).
- **Menu ĐƯỢC nhìn thấy trên Sidebar (3 mục):**
  1. `Tổng quan` (`/app/dashboard`)
  2. `Khu nuôi` (`/app/barns` — chỉ thấy chuồng trong `barn_ids`)
  3. `Ghi nhật ký` (`/app/daily-logs` — chỉ chọn được chuồng trong `barn_ids`)
- **Menu KHÔNG được nhìn thấy (14 mục):**
  - Core: `Kho hàng hóa`, `Xuất nhập nội bộ` *(đã ẩn bởi `isWorkerOnly` trong `DynamicSidebar.jsx` dù DB vẫn còn `inventory.view`)*, `Hóa đơn nhập hàng`, `Quản lý bán hàng`, `Sổ quỹ`, `Nhân công`, `Thiết lập chăn nuôi`, `Thiết lập chung`.
  - Add-ons: Toàn bộ 6 mục Add-on.
- **Route được phép truy cập:** `/app/dashboard`, `/app/barns` (chỉ chuồng thuộc `barn_ids`), `/app/daily-logs` (chỉ thêm nhật ký, khóa Sửa/Xóa).
- **Route KHÔNG được phép truy cập:** Toàn bộ 14 route còn lại dưới `/app/*`, `/platform/*`, `/admin/*`.
- **Lỗ hổng nghiêm trọng phát hiện:**
  - **Menu bị ẩn nhưng gõ URL vẫn vào được:** `/app/inventory`, `/app/internal-transfers`, `/app/purchase-invoices`, `/app/sales`, `/app/livestock-settings`, `/app/general-settings`, `/app/branches`, `/app/payroll-kpi`, `/app/custom-roles`, `/app/breeding-livestock`, `/app/hatchery`, `/app/feed-production` đều KHÔNG có `PermissionGuard` ở `routes.jsx`!
  - **Backend chưa chặn:** `worker` có `daily_logs.manage` nên BE cho phép `PUT/DELETE /api/v1/daily-logs/{id}`; `worker` có `inventory.view` nên BE cho phép `GET /api/v1/farms/1/inventory`, `GET /api/v1/purchase-invoices`, `GET /api/v1/farms/1/inventory/receipts`, `GET /api/v1/farms/1/inventory/transfers`; `AddonsOperationsController` chỉ check `isAuthenticated()` nên `worker` gọi được toàn bộ 25 API Add-ons; `WarehouseIssueController` cho `worker` duyệt/hủy phiếu xuất kho (`@farmSecurity.canAccessFarm`)!
  - **API bị chặn oan:** `GET /api/v1/dashboard/summary` chưa có `ROLE_BARN_WORKER` → vào `/app/dashboard` bị **403 Forbidden**!

---

## 3. Đối Chiếu 3 Lớp Phân Quyền — Các Vấn Đề Phát Hiện Qua Rà Soát Code

| Mã vấn đề | Mức độ | Phân loại lỗi 3 lớp | Vị trí code / DB | Mô tả chi tiết |
| :--- | :---: | :--- | :--- | :--- |
| **RBAC-01** | **Critical** | Nhập trực tiếp URL vượt qua menu | `frontend/src/app/routes.jsx` | `PermissionGuard` không được gắn cho bất kỳ route nào trong 16 route `/app/*`. Nhân viên gõ trực tiếp URL vào các trang không có quyền vẫn render được giao diện (trừ `CashbookPage`, `WorkforcePage`). |
| **RBAC-02** | **Critical** | Backend chưa chặn thao tác trái phép | `AddonsOperationsController.java` (25 endpoints) | Toàn bộ API Payroll KPI, Custom Roles, Breeding, Hatchery, Feed Production chỉ dùng `@PreAuthorize("isAuthenticated()")`. Bất kỳ nhân viên nào (kể cả `worker`) đều gọi được POST/PUT/DELETE. |
| **RBAC-03** | **Critical** | Backend chưa chặn thao tác trái phép | `WarehouseIssueController.java` (L57, L65), `GeneralSettingsController.java` (L147, L158), `BranchOperationsController.java` (L58, L173) | Duyệt/hủy phiếu xuất kho chỉ check `canAccessFarm`; Checkout/Webhook VNPAY và Summary đa chi nhánh chỉ check `isAuthenticated()`. |
| **RBAC-04** | **High** | Lệch DB vs Nghiệp vụ (`ROLE_FARM_MANAGER`) | `farm_saas_dev.role_permissions` (`role_id = 6`) | `ROLE_FARM_MANAGER` đang được cấp 24 quyền gồm `cashbook.manage`, `financial.price.view`, `general_settings.manage`, `payroll.manage`, `branches.manage` — vượt xa vai trò Trại trưởng. |
| **RBAC-05** | **High** | Nút thao tác hiển thị sai quyền (Object vs String) | `CashbookPage.jsx`, `WorkforcePage.jsx`, `InternalTransfersPage.jsx`, `PurchaseInvoicesPage.jsx`, `BranchesPage.jsx`, `InventoryPage.jsx` | Dùng `userRoles.includes('ROLE_...')` trên `userInfo.roles` (vốn là mảng Object `[{ code }]`) nên luôn trả `false`; cộng thêm lệch tên quyền (`sales.create` vs `sales.manage`, `financial.view_cost` vs `financial.price.view`, `inventory.create` vs `inventory.manage`, `workforce.view_salary` vs `workforce.salary.view`). |
| **RBAC-06** | **High** | Menu hiển thị nhưng API trả 403 (`accountant`) | `MaterialController`, `MaterialCategoryController`, `WarehouseController`, `PartnerController`, `StocktakeController` (GET), `WarehouseIssueController` (GET) | Thiếu `ROLE_ACCOUNTANT` và `inventory.view`/`inventory.manage` khiến Kế toán kho bị **403** khi tải danh mục vật tư, kho, đối tác, phiếu xuất và phiếu kiểm kê. |
| **RBAC-07** | **High** | Menu bị ẩn nhưng DB/API vẫn mở (`worker`) | `role_permissions` (`ROLE_BARN_WORKER` có `inventory.view`, `daily_logs.manage`), `DailyLogController.java` (L57, L66) | `worker` bị ẩn Kho ở Sidebar nhưng vẫn có `inventory.view` (gọi được GET kho, hóa đơn nhập, phiếu nhập/chuyển kho) và có `daily_logs.manage` (gọi được PUT/DELETE nhật ký trên BE dù UI khóa). |
| **RBAC-08** | **Medium** | Menu hiển thị nhưng API trả 403 (`worker`) | `DashboardController.java` (L124) | `GET /api/v1/dashboard/summary` không có `ROLE_BARN_WORKER` → Công nhân vào trang chủ `/app/dashboard` bị 403. |
| **RBAC-09** | **Medium** | Lỗi Data Scope substring match | `FarmSecurityEvaluator.java` (L85) | `barnIdsJson.contains(String.valueOf(barnId))` kiểm tra chuỗi con thô: nếu `barn_ids = "[12]"`, `contains("1")` và `contains("2")` sẽ trả về `true` sai phạm vi chuồng! |
| **RBAC-10** | **Medium** | Thiếu quyền 3 Add-on sản xuất trong DB | `role_permissions` | Chưa cấp `breeding.view`, `poultry_hatchery.view`, `feed_mill.view` cho `manager`/`tech` trong DB nên Sidebar ẩn, nhưng API lại mở toang (`isAuthenticated()`). |
| **RBAC-11** | **High** | Thiếu phân quyền Phạm vi Chi nhánh (Branch Scope) trên TopBar, DB & API | `farm_members` (chưa có cột `branch_id`), `BranchContextSwitcher.jsx`, `useActiveBranchStore.js`, `BranchController.java`, `BranchOperationsController.java` | Yêu cầu nghiệp vụ: **chỉ `ROLE_FARM_OWNER` được thấy cả 2 chi nhánh và `Toàn chuỗi (ALL)` trên TopBar; toàn bộ nhân công khác chỉ được xem đúng 1 chi nhánh cố định do Chủ trại phân công.** Hiện tại `BranchContextSwitcher.jsx` không kiểm tra `isOwner`, `farm_members` chưa có cột `branch_id`, và API `/branches` trả toàn bộ 2 chi nhánh cho mọi vai trò, khiến `accountant`, `tech`, `manager`, `worker` đều thấy và chuyển đổi được cả `Toàn chuỗi (ALL)` lẫn 2 chi nhánh (`Chi nhánh 1 — Trại Heo` & `Chi nhánh 2 — Trại Gà`). |

---

## 4. Ma Trận Phân Quyền Thực Tế Hiện Tại (Theo Code & DB)

> **Quy ước:**
> - **Có** / **Không** / **Chưa xác định** phản ánh **trạng thái thực tế của code & DB hiện tại** (ghi rõ điều kiện/lệch giữa FE và BE nếu có).
> - Cột **Xuất** bao gồm xuất file Excel/In phiếu/Xuất báo cáo.

| Nhóm chức năng | Chức năng | Vai trò | Xem | Thêm | Sửa | Xóa | Duyệt | Xuất |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tổng quan** | Dashboard (`/app/dashboard`) | `accountant` | Có | Không | Không | Không | Không | Không |
| **Tổng quan** | Dashboard (`/app/dashboard`) | `tech` | Có | Không | Không | Không | Không | Không |
| **Tổng quan** | Dashboard (`/app/dashboard`) | `manager` | Có | Không | Không | Không | Không | Không |
| **Tổng quan** | Dashboard (`/app/dashboard`) | `worker` | Có (UI) / Không (API 403) | Không | Không | Không | Không | Không |
| **Khu nuôi** | Chuồng & Lứa nuôi (`/app/barns`) | `accountant` | Không (ẩn menu; BE cho GET `/barns`) | Không | Không | Không | Không | Không |
| **Khu nuôi** | Chuồng & Lứa nuôi (`/app/barns`) | `tech` | Có (ẩn giá/PnL) | Có | Có | Có (BE) | Không | Có (Excel lứa) |
| **Khu nuôi** | Chuồng & Lứa nuôi (`/app/barns`) | `manager` | Có (ẩn PnL FE) | Có | Có | Có (BE) | Không | Có (Excel lứa) |
| **Khu nuôi** | Chuồng & Lứa nuôi (`/app/barns`) | `worker` | Có (chỉ `barn_ids`) | Không | Không | Không | Không | Không |
| **Nhật ký** | Ghi nhật ký (`/app/daily-logs`) | `accountant` | Không | Không | Không | Không | Không | Không |
| **Nhật ký** | Ghi nhật ký (`/app/daily-logs`) | `tech` | Có | Có | Có (BE) / Không (UI lệch mã quyền) | Có (BE) / Không (UI) | Không | Không |
| **Nhật ký** | Ghi nhật ký (`/app/daily-logs`) | `manager` | Có | Có | Có | Có | Không | Không |
| **Nhật ký** | Ghi nhật ký (`/app/daily-logs`) | `worker` | Có (chỉ `barn_ids`) | Có (chỉ `barn_ids`) | Không (UI) / Có (BE lệch `daily_logs.manage`) | Không (UI) / Có (BE) | Không | Không |
| **Kho hàng** | Kho hàng hóa (`/app/inventory`) | `accountant` | Có (UI; một số API master 403) | Có (lệch FE `inventory.create` + Object roles) | Không (BE thiếu `ROLE_ACCOUNTANT`) | Không | Không | Có (Excel) |
| **Kho hàng** | Kho hàng hóa (`/app/inventory`) | `tech` | Có (ẩn giá vốn) | Không | Không | Không | Không | Có (Excel) |
| **Kho hàng** | Kho hàng hóa (`/app/inventory`) | `manager` | Có (ẩn giá vốn) | Có (BE) / Không (UI) | Có (BE) | Có (BE) | Không | Có (Excel) |
| **Kho hàng** | Kho hàng hóa (`/app/inventory`) | `worker` | Không (ẩn Sidebar; gõ URL + API GET vẫn mở) | Không | Không | Không | Không | Không |
| **Kho hàng** | Xuất nhập nội bộ & Kiểm kê (`/app/internal-transfers`) | `accountant` | Có (GET issues/stocktakes bị 403) | Có (BE; UI bị lỗi Object roles) | Không | Không | Có (BE; UI lỗi Object roles) | Không |
| **Kho hàng** | Xuất nhập nội bộ & Kiểm kê (`/app/internal-transfers`) | `tech` | Có (ẩn giá vốn) | Có (BE issues/transfers; UI lỗi Object roles) | Không | Không | Không | Không |
| **Kho hàng** | Xuất nhập nội bộ & Kiểm kê (`/app/internal-transfers`) | `manager` | Có (ẩn giá vốn) | Có | Không | Không | Có | Không |
| **Kho hàng** | Xuất nhập nội bộ & Kiểm kê (`/app/internal-transfers`) | `worker` | Không (ẩn Sidebar; gõ URL mở) | Không | Không | Không | Có (BE lỗ hổng `WarehouseIssueController`) | Không |
| **Mua hàng** | Hóa đơn nhập hàng (`/app/purchase-invoices`) | `accountant` | Có (UI lỗi Object roles ẩn giá/nút tạo) | Có (BE) | Không | Không | Không | Không |
| **Mua hàng** | Hóa đơn nhập hàng (`/app/purchase-invoices`) | `tech` | Không (ẩn menu) | Có (BE lỗ hổng cho `ROLE_TECHNICAL_STAFF`) | Không | Không | Không | Không |
| **Mua hàng** | Hóa đơn nhập hàng (`/app/purchase-invoices`) | `manager` | Có (do DB cấp `purchase_invoices.view`) | Có (BE) | Không | Không | Không | Không |
| **Mua hàng** | Hóa đơn nhập hàng (`/app/purchase-invoices`) | `worker` | Không (ẩn menu; BE GET mở do `inventory.view`) | Không | Không | Không | Không | Không |
| **Bán hàng** | Quản lý bán hàng (`/app/sales`) | `accountant` | Có (có giá) | Có (BE) / Không (UI lệch `sales.create`) | Không | Không | Có (BE) | Không |
| **Bán hàng** | Quản lý bán hàng (`/app/sales`) | `tech` | Không | Không | Không | Không | Không | Không |
| **Bán hàng** | Quản lý bán hàng (`/app/sales`) | `manager` | Có (có giá do DB cấp `financial.price.view`) | Có (BE) / Không (UI lệch `sales.create`) | Không | Không | Có (BE) | Không |
| **Bán hàng** | Quản lý bán hàng (`/app/sales`) | `worker` | Không | Không | Không | Không | Không | Không |
| **Tài chính** | Sổ quỹ (`/app/cashbook`) | `accountant` | Có | Có | Không | Có (BE) / Không (UI chỉ Owner) | Không | Có (In phiếu/Excel) |
| **Tài chính** | Sổ quỹ (`/app/cashbook`) | `tech` | Không (bị chặn cả UI & BE) | Không | Không | Không | Không | Không |
| **Tài chính** | Sổ quỹ (`/app/cashbook`) | `manager` | Có (do DB cấp `cashbook.view`) | Không (BE chặn POST) | Không | Không | Không | Có (In phiếu) |
| **Tài chính** | Sổ quỹ (`/app/cashbook`) | `worker` | Không (bị chặn cả UI & BE) | Không | Không | Không | Không | Không |
| **Nhân sự** | Nhân công (`/app/workforce`) | `accountant` | Có (cột lương lỗi Object roles trên UI) | Có (tạm ứng/trả lương/khoán) | Không | Không | Không | Không |
| **Nhân sự** | Nhân công (`/app/workforce`) | `tech` | Không (bị chặn UI) | Không | Không | Không | Không | Không |
| **Nhân sự** | Nhân công (`/app/workforce`) | `manager` | Có (ẩn cột lương trên UI) | Có (nhân viên/tạm ứng/trả lương trên BE) | Có | Không | Không | Không |
| **Nhân sự** | Nhân công (`/app/workforce`) | `worker` | Không (bị chặn cả UI & BE) | Không | Không | Không | Không | Không |
| **Thiết lập** | Thiết lập chăn nuôi (`/app/livestock-settings`) | `accountant` | Không | Không | Không | Không | Không | Không |
| **Thiết lập** | Thiết lập chăn nuôi (`/app/livestock-settings`) | `tech` | Có | Có | Có | Có | Không | Không |
| **Thiết lập** | Thiết lập chăn nuôi (`/app/livestock-settings`) | `manager` | Có | Có | Có | Có | Không | Không |
| **Thiết lập** | Thiết lập chăn nuôi (`/app/livestock-settings`) | `worker` | Không (BE chặn 403) | Không | Không | Không | Không | Không |
| **Thiết lập** | Thiết lập chung (`/app/general-settings`) | `accountant` | Không (ẩn menu; gõ URL vào được; API members/roles 403) | Không (trừ checkout/webhook BE lỗ hổng) | Không (riêng VietQR BE cho phép) | Không | Không | Không |
| **Thiết lập** | Thiết lập chung (`/app/general-settings`) | `tech` | Không (ẩn menu; gõ URL vào được) | Không (trừ checkout/webhook BE lỗ hổng) | Không | Không | Không | Không |
| **Thiết lập** | Thiết lập chung (`/app/general-settings`) | `manager` | Có (do DB cấp `general_settings.view`) | Có (do DB cấp `general_settings.manage`) | Có | Có | Không | Không |
| **Thiết lập** | Thiết lập chung (`/app/general-settings`) | `worker` | Không (ẩn menu; gõ URL vào được) | Không (trừ checkout/webhook BE lỗ hổng) | Không | Không | Không | Không |
| **Add-ons** | Đa chi nhánh (`/app/branches`) | `accountant`, `tech`, `worker` | Không (ẩn menu; BE GET `/branches` mở `isAuthenticated()`) | Không | Không | Không | Không | Không |
| **Add-ons** | Đa chi nhánh (`/app/branches`) | `manager` | Có (do DB cấp `branches.view`) | Có (BE do `branches.manage`) / Không (UI `branches.create`) | Có (BE) | Có (BE) | Không | Không |
| **Add-ons** | Lương KPI (`/app/payroll-kpi`), Mở rộng vai trò (`/app/custom-roles`) | `accountant`, `tech`, `worker` | Không (ẩn menu; **gõ URL & API BE mở do `isAuthenticated()`**) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Không |
| **Add-ons** | Lương KPI (`/app/payroll-kpi`), Mở rộng vai trò (`/app/custom-roles`) | `manager` | Có (do DB cấp `payroll.view`, `roles.view`) | Có (BE `isAuthenticated()`) | Có | Có | Có (Chốt lương) | Không |
| **Add-ons** | Gia súc sinh sản (`/app/breeding-livestock`), Ấp nở (`/app/hatchery`), Sản xuất cám (`/app/feed-production`) | `accountant`, `tech`, `manager`, `worker` | Không (ẩn menu do thiếu quyền DB; **gõ URL & API BE mở do `isAuthenticated()`**) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Có (lỗ hổng BE) | Không |
| **Nền tảng** | Super Admin (`/platform/*`, `/admin/*`) | `accountant`, `tech`, `manager`, `worker` | Không (bị chặn cả FE & BE 403) | Không | Không | Không | Không | Không |

---

## 5. Chuẩn Bị Tài Khoản & Dữ Liệu Kiểm Thử

### 5.1. Danh sách 4 tài khoản kiểm thử (ĐÃ CÓ SẴN trong `farm_saas_dev`)

| Nhóm cần test | Username | SĐT đăng nhập | Mật khẩu | Role trong DB | Phạm vi (`farm_members`) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **1. accountant** | `accountant_hoabinh` | `0955444555` | `123456` | `ROLE_ACCOUNTANT` | `farm_id=1`, `all_barns=1` | Sẵn sàng |
| **2. tech** | `tech_hoabinh` | `0966333444` | `123456` | `ROLE_TECHNICAL_STAFF` | `farm_id=1`, `all_barns=1` | Sẵn sàng |
| **3. manager** | `manager_hoabinh` | `0977111222` | `123456` | `ROLE_FARM_MANAGER` | `farm_id=1`, `all_barns=1` | Sẵn sàng |
| **4. worker** | `worker_hoabinh` | `0944555666` | `123456` | `ROLE_BARN_WORKER` | `farm_id=1`, `all_barns=0`, `barn_ids=[1,2,7]` | Sẵn sàng |

### 5.2. Dữ liệu còn thiếu / cần lưu ý
- **Tài khoản:** Đủ cả 4 tài khoản, không thiếu tài khoản nào.
- **Dữ liệu trang trại thứ 2 (`farm_id = 2`) để test cô lập chéo trang trại (Cross-Farm Isolation):** Hiện `farm_saas_dev` chỉ có 1 `farms` (`id = 1`). Việc kiểm thử cô lập dữ liệu cấp chuồng (`barn_ids = [1, 2, 7]` vs các chuồng khác như `id = 3, 6`) thực hiện được ngay trên `farm_id = 1`; còn test Cross-Farm (`farm_id = 2`) có thể thử bằng gọi API với `farmId = 999` (kỳ vọng `403 Forbidden`).

---

## 6. Danh Sách Test Case Kiểm Thử Phân Quyền Trên Browser

| Mã TC | Vai trò | Nhóm kiểm tra | Các bước kiểm thử trực tiếp trên Browser | Kết quả mong đợi (Chuẩn RBAC) |
| :--- | :---: | :--- | :--- | :--- |
| **RBAC-TC01** | `accountant` | Menu & Trang được phép | Đăng nhập `0955444555`; kiểm tra Sidebar; mở lần lượt `/app/dashboard`, `/app/inventory`, `/app/internal-transfers`, `/app/purchase-invoices`, `/app/sales`, `/app/cashbook`, `/app/workforce`. | Chỉ thấy 7 menu tài chính/kho; tải dữ liệu thành công (không 403), thấy đầy đủ giá vốn/đơn giá/cột lương và nút tạo phiếu. |
| **RBAC-TC02** | `accountant` | Chặn URL trái phép & Chéo cổng | Gõ trực tiếp `/app/barns`, `/app/daily-logs`, `/app/livestock-settings`, `/app/general-settings`, `/app/payroll-kpi`, `/app/custom-roles`, `/platform/tenants`. | Bị chặn (`/403` hoặc redirect `/app/dashboard`), không hiển thị dữ liệu hay nút thao tác. |
| **RBAC-TC03** | `accountant` | Thao tác CRUD thực tế | Thử tạo phiếu thu/chi ở `/app/cashbook`, kiểm tra nút xóa phiếu (chỉ Owner), nút lập phiếu bán ở `/app/sales`, nút lập hóa đơn nhập ở `/app/purchase-invoices`. | Tạo phiếu thành công; nút xóa phiếu Sổ quỹ bị ẩn/chặn; không bị 403 ở danh mục kho/đối tác. |
| **RBAC-TC04** | `tech` | Menu & Trang được phép | Đăng nhập `0966333444`; kiểm tra Sidebar; mở `/app/barns`, `/app/daily-logs`, `/app/inventory`, `/app/internal-transfers`, `/app/livestock-settings`. | Chỉ thấy 6 menu kỹ thuật/kho; ẩn hoàn toàn cột giá vốn ở Kho & Xuất nhập nội bộ và ẩn PnL ở Chi tiết chuồng. |
| **RBAC-TC05** | `tech` | Chặn tài chính & URL trái phép | Gõ trực tiếp `/app/cashbook`, `/app/workforce`, `/app/purchase-invoices`, `/app/sales`, `/app/general-settings`, `/app/payroll-kpi`, `/app/custom-roles`, `/platform/tenants`. | Bị chặn hoàn toàn trên giao diện và API (403). |
| **RBAC-TC06** | `tech` | Thao tác kỹ thuật | Thử sửa mục tiêu/lứa nuôi ở `/app/barns`, ghi nhật ký ở `/app/daily-logs`, chỉnh sửa định mức/vắc-xin ở `/app/livestock-settings`. | Thực hiện thành công và lưu bền vững sau F5; không thể duyệt phiếu kho hay tạo hóa đơn mua. |
| **RBAC-TC07** | `manager` | Menu & Phân tách tài chính | Đăng nhập `0977111222`; đối chiếu danh sách Sidebar thực tế; kiểm tra `/app/barns/:id/batch/:batchId`, `/app/inventory`, `/app/workforce`, `/app/internal-transfers`. | Xác minh ẩn giá vốn/lãi lỗ/cột lương; ghi nhận các menu nhạy cảm đang bị lộ do DB (`Sổ quỹ`, `Thiết lập chung`, `Lương KPI`, `Mở rộng vai trò`). |
| **RBAC-TC08** | `manager` | Chặn URL ngoài quyền & Chéo cổng | Gõ trực tiếp `/app/cashbook`, `/app/general-settings`, `/app/custom-roles`, `/platform/tenants`, `/admin/dashboard`. | Bị chặn truy cập `/platform/*`, `/admin/*`; ghi nhận thực tế truy cập các trang tài chính/cài đặt. |
| **RBAC-TC09** | `manager` | Thao tác quản lý & Duyệt | Thử tạo/sửa chuồng, duyệt phiếu xuất nhập nội bộ, sửa/xóa nhật ký, kiểm tra không thể xóa phiếu Sổ quỹ / không thể tạo phiếu chi Sổ quỹ. | Duyệt phiếu kho thành công; bị chặn khi ghi/xóa Sổ quỹ. |
| **RBAC-TC10** | `worker` | Menu & Data Scope chuồng | Đăng nhập `0944555666`; kiểm tra Sidebar; mở `/app/dashboard`, `/app/barns`, `/app/daily-logs`. | Sidebar chỉ hiện 3 mục (`Tổng quan`, `Khu nuôi`, `Ghi nhật ký`); chỉ thấy các chuồng trong `barn_ids = [1, 2, 7]`; ghi nhận lỗi 403 nếu có ở Dashboard. |
| **RBAC-TC11** | `worker` | Khóa Sửa/Xóa & Chặn URL ngoài phạm vi | Ở `/app/daily-logs`, xác minh không có nút Sửa/Xóa; gõ trực tiếp `/app/barns/6/batch/4` (chuồng ngoài `barn_ids`), `/app/inventory`, `/app/cashbook`, `/app/workforce`, `/app/general-settings`, `/app/payroll-kpi`, `/app/custom-roles`, `/platform/tenants`. | Không xem/sửa được chuồng ngoài `barn_ids`; bị chặn toàn bộ các route ngoài quyền. |
| **RBAC-TC12** | 4 vai trò | Kiểm tra bảo mật API trực tiếp | Dùng `fetch` trong DevTools Console (với token đang đăng nhập) thử gọi các endpoint nhạy cảm ngoài quyền (`POST /addons/payroll/close-and-pay`, `POST /addons/custom-roles`, `PUT /daily-logs/{id}` bằng `worker`, `POST /purchase-invoices` bằng `tech`). | Ghi nhận chính xác endpoint nào trả `403 Forbidden` và endpoint nào đang bị lọt `200/201` (xác nhận thực tế các lỗ hổng `RBAC-02`, `RBAC-03`, `RBAC-07`). |
| **RBAC-TC13** | 4 vai trò (`accountant`, `tech`, `manager`, `worker`) | Phạm vi Chi nhánh trên TopBar (`BranchContextSwitcher`) & URL `?branchId=` | Đăng nhập lần lượt 4 tài khoản nhân viên; kiểm tra thành phần chọn Chi nhánh trên thanh TopBar; thử chuyển sang chi nhánh khác hoặc sửa URL `?branchId=2` / `?branchId=ALL`. | Chỉ `owner` thấy `Toàn chuỗi (ALL)` và cả 2 chi nhánh; 4 tài khoản nhân viên chỉ thấy cố định **1 chi nhánh** do Chủ trại phân công, không thể chuyển chi nhánh khác trên TopBar hoặc qua URL `?branchId=`. *(Hiện trạng dự kiến FAIL do `RBAC-11`.)* |


---

## 7. Phương Án Xử Lý Phân Quyền Hiện Tại Của Nhân Viên (Đề Xuất Chuẩn Hóa)

### 7.1. Ma trận Phân Quyền Mục Tiêu (Sau Khi Chuẩn Hóa)

| Vai trò | Phạm vi Chi nhánh (TopBar) | Phạm vi Chuồng (`Data Scope`) | Menu được hiển thị | Quyền tài chính / Giá vốn | Hành động bị chặn tuyệt đối |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`accountant`**<br>(`ROLE_ACCOUNTANT`) | **Khóa 1 chi nhánh** do Chủ trại gán (ẩn `ALL` & chi nhánh khác) | Toàn bộ chuồng thuộc chi nhánh được gán | `Tổng quan`, `Kho hàng hóa`, `Xuất nhập nội bộ`, `Hóa đơn nhập hàng`, `Quản lý bán hàng`, `Sổ quỹ`, `Nhân công` *(+ `Lương KPI` nếu Owner cấp)* | **Có** (`financial.price.view`, `workforce.salary.view`) | Chặn `Khu nuôi`, `Ghi nhật ký`, `Thiết lập chăn nuôi`, `Thiết lập chung`, `Đa chi nhánh`, `Mở rộng vai trò`, Xóa phiếu Sổ quỹ, `/platform/*` |
| **`tech`**<br>(`ROLE_TECHNICAL_STAFF`) | **Khóa 1 chi nhánh** do Chủ trại gán | Toàn bộ chuồng thuộc chi nhánh được gán | `Tổng quan`, `Khu nuôi`, `Ghi nhật ký`, `Kho hàng hóa` *(chỉ xem SL)*, `Xuất nhập nội bộ` *(tạo phiếu, không duyệt)*, `Thiết lập chăn nuôi` | **Không** (ẩn toàn bộ giá vốn, PnL, doanh thu, lương) | Chặn `Hóa đơn nhập hàng`, `Bán hàng`, `Sổ quỹ`, `Nhân công`, `Thiết lập chung`, `Đa chi nhánh`, `Lương KPI`, `Mở rộng vai trò`, Duyệt phiếu kho, `/platform/*` |
| **`manager`**<br>(`ROLE_FARM_MANAGER`) | **Khóa Chi nhánh 1** (`branch_id = 1`) | Toàn bộ chuồng thuộc Chi nhánh 1 | **Thu hẹp từ 14 → 9 mục:** `Tổng quan`, `Khu nuôi`, `Ghi nhật ký`, `Kho hàng hóa`, `Xuất nhập nội bộ` *(tạo + duyệt)*, `Hóa đơn nhập hàng` *(chỉ kiểm đếm SL, ẩn giá & tiền)*, `Quản lý bán hàng` *(chỉ cân xe/số lượng, ẩn đơn giá & tiền)*, `Nhân công` *(ẩn cột lương)*, `Thiết lập chăn nuôi` | **Không** (gỡ `financial.price.view`, `cashbook.*`, `payroll.*` khỏi DB) | Chặn `Sổ quỹ`, `Thiết lập chung`, `Đa chi nhánh`, `Lương KPI`, `Mở rộng vai trò`, `/platform/*` |
| **`worker`**<br>(`ROLE_BARN_WORKER`) | **Khóa 1 chi nhánh** do Chủ trại gán | **Chỉ chuồng trong `barn_ids`** (`all_barns = 0`) | **3 mục:** `Tổng quan`, `Khu nuôi` *(chỉ xem)*, `Ghi nhật ký` *(chỉ thêm mới)* | **Không** | Chặn Sửa/Xóa nhật ký (cả FE & BE), chặn toàn bộ Kho/Mua/Bán/Sổ quỹ/Nhân công/Thiết lập/Add-ons/chuồng ngoài `barn_ids`, `/platform/*` |

### 7.2. Lộ Trình Xử Lý Kỹ Thuật 4 Giai Đoạn (Sau Khi Hoàn Tất Kiểm Thử Phương Án A)

1. **Nhóm P1 — Chuẩn hóa Database (`Flyway Migration` mới):**
   - Thêm cột `branch_id BIGINT NULL` vào bảng `farm_members` (khóa ngoại tới `farm_branches.id`): `NULL` cho `ROLE_FARM_OWNER` (xem toàn chuỗi 2 chi nhánh), gán cố định **`branch_id = 1` (Chi nhánh 1)** cho cả 4 tài khoản nhân viên (`accountant`, `tech`, `manager`, `worker`).
   - Chuẩn hóa lại `role_permissions`:
     - **`ROLE_FARM_MANAGER`:** Gỡ 10 quyền vượt cấp (`cashbook.view/manage`, `financial.price.view`, `general_settings.view/manage`, `branches.view/manage`, `payroll.view/manage`, `roles.view`); **giữ lại** `purchase_invoices.view/manage` và `sales.view/manage` ở chế độ chỉ kiểm đếm số lượng/cân xe (ẩn toàn bộ đơn giá & tiền bạc).
     - **`ROLE_BARN_WORKER`:** Gỡ `inventory.view` (để đồng bộ với Sidebar đã ẩn Kho và chặn truy cập API kho/hóa đơn nhập).
     - **`ROLE_ACCOUNTANT`:** Bổ sung `workforce.salary.view` để xem đầy đủ cột lương/tạm ứng trên `/app/workforce`.

2. **Nhóm P2 — Vá Bảo mật Backend (`@PreAuthorize`, Branch Scope & Data Scope):**
   - **`AddonsOperationsController.java` (`RBAC-02`):** Thay `@PreAuthorize("isAuthenticated()")` bằng quyền cụ thể theo từng phân hệ (`payroll.view/manage`, `roles.view/manage`, `breeding.view/manage`, `poultry_hatchery.view/manage`, `feed_mill.view/manage` hoặc `ROLE_FARM_OWNER`).
   - **Siết lỗ hổng khác (`RBAC-03`, `RBAC-07`):**
     - `WarehouseIssueController`: siết `complete/approve/cancel` chỉ cho Owner/Manager/Accountant.
     - `GeneralSettingsController`: siết `checkout` và `simulate-webhook` chỉ cho `ROLE_FARM_OWNER` / `ROLE_SUPER_ADMIN`.
     - `BranchOperationsController`: siết `GET /summary` chỉ cho `branches.view` hoặc `ROLE_FARM_OWNER`.
     - `PurchaseInvoiceController`: gỡ `ROLE_TECHNICAL_STAFF` khỏi `POST /purchase-invoices`.
     - `DailyLogController`: chặn `PUT/DELETE /{id}` khi `!hasRole('ROLE_BARN_WORKER')`.
   - **Mở quyền bị chặn oan (`RBAC-06`, `RBAC-08`):**
     - Bổ sung `ROLE_ACCOUNTANT` & `inventory.view`/`inventory.manage` vào `MaterialController`, `MaterialCategoryController`, `WarehouseController`, `PartnerController`, `StocktakeController` (`GET`), `WarehouseIssueController` (`GET`).
     - Bổ sung `ROLE_BARN_WORKER` vào `DashboardController` (`GET /summary`).
   - **Sửa Data Scope & Branch Scope (`RBAC-09`, `RBAC-11`):**
     - Sửa `FarmSecurityEvaluator.canAccessBarn()` parse mảng JSON `List<Long>` chuẩn thay vì `barnIdsJson.contains(...)`.
     - Trả `assignedBranchId` trong `/auth/login` & `/auth/me`; lọc `GET /api/v1/farms/{farmId}/branches` & `GET /api/v1/branches` chỉ trả đúng 1 chi nhánh được gán cho tài khoản không phải `ROLE_FARM_OWNER`.

3. **Nhóm P3 — Vá Route Guard & Đồng bộ Mã quyền Frontend (`RBAC-01`, `RBAC-05`):**
   - Bọc `<PermissionGuard>` cho toàn bộ 16 route `/app/*` trong `routes.jsx` (chặn triệt để gõ URL trực tiếp).
   - Bổ sung helper `getRoleCodes()` trong `useAuthStore.js` và thay toàn bộ `userRoles.includes('ROLE_...')` trên `CashbookPage`, `WorkforcePage`, `InternalTransfersPage`, `PurchaseInvoicesPage`, `BranchesPage`, `InventoryPage`, `DashboardPage`.
   - Đồng bộ mã quyền FE khớp 100% DB (`sales.manage`, `purchase_invoices.manage`, `inventory.manage`, `financial.price.view`, `workforce.salary.view`, `daily_logs.manage`).

4. **Nhóm P4 — Khóa TopBar Chi nhánh & UI Gán Chi nhánh (`RBAC-11`):**
   - Cập nhật `BranchContextSwitcher.jsx` & `useActiveBranchStore.js`: chỉ `isOwner()` thấy dropdown `Toàn chuỗi (ALL)` + 2 chi nhánh; 4 vai trò nhân viên hiển thị badge cố định đúng **1 chi nhánh** được Chủ trại phân công và tự khóa lại nếu user sửa URL `?branchId=`.
   - Bổ sung dropdown chọn **Chi nhánh phân công** trong modal `Cấu Hình Quyền Hạn` tại `GeneralSettingsPage.jsx` (`?tab=users`) để Chủ trại gán chi nhánh trực tiếp cho từng nhân viên.
