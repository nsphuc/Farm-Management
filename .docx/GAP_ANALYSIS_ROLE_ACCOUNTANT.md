# BÁO CÁO KIỂM TOÁN HỆ THỐNG & GAP ANALYSIS TOÀN DIỆN
## ĐÁNH GIÁ CHỨC NĂNG TÀI KHOẢN `ROLE_ACCOUNTANT` (CẤP 4 - KẾ TOÁN TRANG TRẠI, GIÁ THÀNH & THƯƠNG MẠI B2B)
**Dự án:** Farm Management SaaS Multi-Tenant Platform  
**Vai trò thẩm định:** Principal Software Architect  
**Tài khoản mẫu kiểm thử:** `accountant` (`ROLE_ACCOUNTANT` / Operational Role: `FARM_ACCOUNTANT`)  
**Mục tiêu:** Rà soát 100% chức năng Frontend (`frontend/src/`) & Backend (`backend/src/main/java/com/farm/saas/`) liên quan đến `ROLE_ACCOUNTANT`, phát hiện toàn bộ lỗ hổng phân quyền (RBAC), điểm nghẽn UX/UI, lỗi HTTP 403 Forbidden / HTTP 400 Bad Request, vi phạm nguyên tắc tách biệt trách nhiệm Maker-Checker (Separation of Duties - SoD), và sai lệch luồng đồng bộ dữ liệu tự động giữa các Workspace trong chuỗi giá trị kế toán nông nghiệp.

---

## TỔNG QUAN VỊ TRÍ & QUYỀN HẠN CỦA `ROLE_ACCOUNTANT` (THEO RBAC MATRIX V1_4)
Theo thiết kế chuẩn phân quyền 4 cấp (`V1_4__standardize_4_tier_rbac_matrix.sql`, dòng 165-177), `ROLE_ACCOUNTANT` là vai trò **Cấp 4 (Tầng Thực thi - Maker Tài chính, Kế toán Giá thành & Thương mại B2B)** với đúng **8 quyền hạn nghiệp vụ cốt lõi**:
1. `PERM_FARM_VIEW` (#3): Tra cứu thông tin nông trại, phân khu sản xuất, chu kỳ vận hành và kho bãi.
2. `PERM_INVENTORY_VIEW` (#12): Tra cứu thẻ kho, số lượng tồn kho khả dụng và phiếu nhập/xuất để phục vụ đối soát chi phí vật tư và tính giá vốn.
3. `PERM_HR_ATTENDANCE` (#24): Chấm công cá nhân GPS + Selfie và tra cứu dữ liệu chấm công đã chốt để tổng hợp bảng lương nhân viên.
4. `PERM_FINANCE_EXPENSE` (#26): **Maker Chi phí**: Lập phiếu chi phí vận hành (`DRAFT`), phân bổ chi phí đa đối tượng (`Allocate Cost`) và lập dự toán ngân sách chu kỳ (`DRAFT`).
5. `PERM_FINANCE_SALES_ORDER` (#27): **Maker Đơn bán sỉ**: Lên đơn đặt hàng bán sỉ B2B (`PENDING`), chọn khách hàng, chọn lô thành phẩm và quản lý danh bạ đối tác thương mại.
6. `PERM_FINANCE_PAYMENT` (#28): **Maker Thu/Chi**: Lập phiếu giao dịch thanh toán VietQR / Tiền mặt / Chuyển khoản (`PENDING`).
7. `PERM_PAYMENT_ALLOCATE` (#29): **Phân bổ & Cấn trừ nợ**: Khóa bi quan khoản nợ, phân bổ trừ nợ đơn hàng và thực hiện cấn trừ công nợ hai chiều (`DEBT_OFFSET`).
8. `PERM_FINANCE_REPORT` (#30): **Báo cáo Tài chính**: Khai thác 5 trung tâm báo cáo điều hành chuyên sâu (Executive Dashboard, P&L mùa vụ, FCR chăn nuôi, Tuổi nợ và Tuổi thọ kho FEFO).

### Các ranh giới cấm tuyệt đối theo nguyên tắc Tách biệt nhiệm vụ (Separation of Duties - SoD & Maker-Checker):
- **CẤM DUYỆT CHI PHÍ VẬN HÀNH (`confirmExpense / cancelExpense`)**: Kế toán là **Maker** lập chi phí ở trạng thái `DRAFT`. Quyền duyệt chi (`CONFIRMED`) và giải ngân ngân sách thuộc độc quyền của **Giám đốc trang trại (`ROLE_FARM_MANAGER`)**.
- **CẤM DUYỆT ĐƠN HÀNG BÁN SỈ (`confirmOrder`) & CẤM ĐIỀU XE XUẤT BẾN (`dispatchDelivery`)**: Kế toán lên đơn bán sỉ `PENDING` và theo dõi công nợ. Quyền duyệt đơn giữ chỗ lô thuộc về **Giám đốc trại**; quyền bốc xếp và xuất bến thuộc về **Thủ kho (`ROLE_WAREHOUSE_STAFF`)**.
- **CẤM DUYỆT HẠN MỨC TÍN DỤNG & CẤM BLACKLIST ĐỐI TÁC**: Kế toán thêm mới/sửa thông tin đối tác, nhưng quyền cấp hạn mức tín dụng công nợ và chặn giao dịch (Blacklist) thuộc về **Chủ đầu tư (`ROLE_FARM_OWNER`)** hoặc **Giám đốc trại**.
- **CẤM DUYỆT PHIẾU KHO VẬT TƯ & CẤM DUYỆT KCS LÔ THÀNH PHẨM**: Toàn bộ thao tác tại WS-C của Kế toán là **Read-only** nhằm mục đích kiểm tra hóa đơn/chứng từ đầu vào.

---

# BẢNG TỔNG HỢP TOÀN BỘ LỖ HỔNG & ĐIỂM NGHẼN (EXECUTIVE GAP MATRIX)

| Mã Lỗ Hổng | Phân Vùng | Vị Trí File & Dòng Code | Hiện Trạng Thực Tế | Rủi Ro & Hành Vi Lỗi | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-ACC-01** | **Điều Hướng & Route Cài Đặt Danh Mục Chi Phí** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 359-362)*<br>`frontend/src/app/routes.jsx`<br>*(Dòng 252-258)*<br>`frontend/src/pages/settings/index.jsx`<br>*(Dòng 88-107)*<br>`frontend/src/pages/settings/tabs/CostCategoriesTab.jsx`<br>*(Dòng 178, 223)* | `menuConfig.js` thiếu module `settings` trong `independentModules`. `routes.jsx` bọc cứng quyền `PERM_TENANT_MANAGE`, `PERM_FARM_UPDATE`... (thiếu `PERM_FINANCE_EXPENSE`). `SettingsPage` chưa lọc tab cho Kế toán. Các nút CRUD trong `CostCategoriesTab` bọc cứng `<Can permission="PERM_FARM_UPDATE">`. | **HTTP 403 FORBIDDEN & ẨN UI:** Kế toán bị chặn 100% không thể vào `/app/settings`. Nếu vượt rào cũng không thấy danh mục Nhóm chi phí và các nút Thêm/Sửa/Xóa bị ẩn, dù Backend `CostCategoryController` đã mở quyền đầy đủ cho `ROLE_ACCOUNTANT`. | **CRITICAL** |
| **GAP-ACC-02** | **Xung Đột Menu WS-B Nhân Sự & Tính Lương** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 334-337, 31-38)*<br>`frontend/src/app/routes.jsx`<br>*(Dòng 141-147)* | Menu gán `WS-B: Tổng Hợp Công Tính Lương` cho Kế toán, nhưng `ALL_WORKSPACES.B_Personnel360` và `routes.jsx` yêu cầu `PERM_HR_EMPLOYEE_MANAGE`. Kế toán chỉ có `PERM_HR_ATTENDANCE`. | **MENU BỊ ẨN / LỖI 403 FORBIDDEN:** Thanh Sidebar tự động ẩn WS-B vì `<Can>` kiểm tra quyền `PERM_HR_EMPLOYEE_MANAGE` thất bại. Nếu Kế toán truy cập trực tiếp URL `/app/hr`, Route Guard chặn và redirect sang `/403`. | **CRITICAL** |
| **GAP-ACC-03** | **Nguy Cơ 403 Tra Cứu Mùa Vụ, Đàn Nuôi & Lô Hàng** | `backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java`<br>*(Dòng 29, 40)*<br>`backend/src/main/java/com/farm/saas/modules/livestock/controller/LivestockController.java`<br>*(Dòng 32, 42)*<br>`backend/src/main/java/com/farm/saas/modules/quality/controller/ProductBatchController.java`<br>*(Dòng 33, 43)* | API lấy Mùa vụ và Đàn nuôi trong `@PreAuthorize` thiếu tường minh `ROLE_ACCOUNTANT` và `PERM_FINANCE_EXPENSE`. API lấy Lô thành phẩm (`ProductBatchController`) hoàn toàn thiếu `PERM_FINANCE_SALES_ORDER` trong `@PreAuthorize`. | **LỖI 403 / RỖNG DANH SÁCH DROPDOWN:** Kế toán mở Modal Lập chi phí hoặc Modal Lên đơn bán sỉ có nguy cơ bị từ chối 403, khiến dropdown Mùa vụ, Đàn nuôi hoặc Lô thành phẩm bị rỗng (`[]`), làm đứt gãy khâu hạch toán chi phí và bán sỉ. | **HIGH** |
| **GAP-ACC-04** | **Vi Phạm Maker-Checker Khi Tạo Dự Toán Ngân Sách** | `backend/src/main/java/com/farm/saas/modules/finance/service/impl/BudgetServiceImpl.java`<br>*(Dòng 87)*<br>`frontend/src/workspaces/H1_CostAccounting/components/BudgetManagementTab.jsx` | `BudgetServiceImpl.createBudget` gán cứng trạng thái ngân sách mới tạo là `ACTIVE`. Kế toán (Maker) tạo ngân sách được tự động kích hoạt ngay lập tức mà không qua khâu phê duyệt `DRAFT` của Giám đốc trại (Checker). | **VI PHẠM NGUYÊN TẮC SOD:** Phá vỡ chốt chặn kiểm soát ngân sách chu kỳ; nhân viên kế toán có thể tự ý ấn định trần chi phí triệu đô mà không cần chữ ký số hoặc phê duyệt của Giám đốc trang trại. | **HIGH** |
| **GAP-ACC-05** | **Đứt Gãy Đồng Bộ Dữ Liệu Thanh Toán H2 Sang WS-D** | `frontend/src/workspaces/H2_SalesCashflow/components/CreatePaymentModal.jsx`<br>*(Dòng 171)*<br>`frontend/src/workspaces/H2_SalesCashflow/components/AllocateOrOffsetDebtModal.jsx`<br>`frontend/src/workspaces/D_Partners/index.jsx`<br>*(Dòng 113)*<br>`frontend/src/workspaces/D_Partners/components/PartnerDetailDrawer.jsx`<br>*(Dòng 90)* | Khi Kế toán lập phiếu thu/chi VietQR hoặc cấn trừ nợ tại WS-H2, hệ thống chỉ bắn `notifyDataChanged('finance')`. Trong khi đó, `D_Partners` chỉ lắng nghe `syncTrigger?.partners`, và `PartnerDetailDrawer` hoàn toàn không lắng nghe `syncTrigger`. | **LỆCH SỔ SÁCH THỜI GIAN THỰC:** Sau khi ghi nhận thu tiền đơn hàng tại WS-H2, chuyển sang WS-D mở hồ sơ đối tác thì dư nợ cũ vẫn còn nguyên. Kế toán buộc phải bấm F5 tải lại toàn bộ trang web để thấy số liệu mới. | **MEDIUM** |
| **GAP-ACC-06** | **Thiếu Thông Báo Tự Động Quy Trình Chi Phí Vận Hành** | `backend/src/main/java/com/farm/saas/modules/finance/service/impl/FarmExpenseServiceImpl.java`<br>*(Dòng 325-359, 365-394, 398-428)* | Khi Kế toán tạo chi phí nháp (`DRAFT`), service không gửi `Notification` cho Giám đốc trại. Khi Giám đốc duyệt (`CONFIRMED`) hoặc từ chối (`CANCELLED`), service không gửi thông báo kết quả cho Kế toán. | Giám đốc trại không biết có phiếu chi mới cần ký duyệt; Kế toán không nắm được lý do từ chối để chỉnh sửa chứng từ hóa đơn, gây ách tắc dòng tiền thanh toán cho nhà cung cấp. | **MEDIUM** |
| **GAP-ACC-07** | **Thiếu Thông Báo Tự Động Quy Trình Đơn Bán Sỉ B2B** | `backend/src/main/java/com/farm/saas/modules/finance/service/impl/SalesOrderServiceImpl.java`<br>*(Dòng 44-54)* | `SalesOrderServiceImpl` hoàn toàn chưa được inject `NotificationService`. Khi Kế toán lên đơn hàng `PENDING`, không báo cho Giám đốc duyệt; khi Giám đốc duyệt `CONFIRMED`, không báo cho Kế toán và Thủ kho xuất xe. | Kế toán và Thủ kho không biết đơn hàng đã được duyệt để xuất hóa đơn và lập phiếu giao hàng lên xe, làm chậm trễ tiến độ giao nông sản tươi sống cho khách hàng B2B. | **MEDIUM** |
| **GAP-ACC-08** | **Thiếu Thông Báo Tự Động Quy Trình Dự Toán & Thu/Chi** | `backend/src/main/java/com/farm/saas/modules/finance/service/impl/BudgetServiceImpl.java`<br>`backend/src/main/java/com/farm/saas/modules/finance/service/impl/DebtAndPaymentServiceImpl.java` | Cả 2 service đều chưa tích hợp `NotificationService`. Không có thông báo khi Kế toán trình dự toán ngân sách mới hoặc ghi nhận phiếu thu/chi tiền mặt/VietQR cần xác nhận. | Mất dấu vết liên lạc nghiệp vụ tức thì giữa Kế toán và Ban quản lý trang trại trong các giao dịch tài chính trọng yếu. | **LOW** |

---

# PHẦN 1: ĐIỀU HƯỚNG MENU, ROUTE GUARDS & CÀI ĐẶT NHÓM CHI PHÍ

### 1.1. Khảo sát Thanh Sidebar Navigation (`menuConfig.js` & `useAuthStore.js`)
Khi đăng nhập bằng tài khoản `accountant` (`ROLE_ACCOUNTANT`):
1. **Mã vai trò vận hành:** Hàm `useAuthStore.getOperationalRole()` (dòng 507) kiểm tra `isFarmAccountant()` và trả về chính xác chuỗi:
   ```javascript
   'FARM_ACCOUNTANT'
   ```
2. **Cấu hình Menu hiển thị:** Tại `frontend/src/shells/TenantAppShell/menuConfig.js` (dòng 324-362):
   ```javascript
   case 'FARM_ACCOUNTANT':
     return {
       sectionTitle: 'Bàn Kế Toán & Dòng Tiền Nông Trại',
       workspaces: [
         { ...ALL_WORKSPACES.G_EmployeeDailyOps, label: 'WS-G: Chấm Công Cá Nhân', badge: 'Cá nhân' },
         { ...ALL_WORKSPACES.B_Personnel360, label: 'WS-B: Tổng Hợp Công Tính Lương', badge: 'Bảng công' },
         { ...ALL_WORKSPACES.C_InventoryHub, label: 'WS-C: Đối Soát Phiếu Nhập / Xuất Kho', badge: 'Đối soát' },
         { ...ALL_WORKSPACES.D_Partners, label: 'WS-D: Quản Lý Đối Tác & Khách Hàng', badge: 'Đối tác' },
         { ...ALL_WORKSPACES.H1_CostAccounting, label: 'WS-H1: Hạch Toán Chi Phí & Giá Thành / Kg', badge: 'Giá thành' },
         { ...ALL_WORKSPACES.H2_SalesCashflow, label: 'WS-H2: Bán Sỉ, VietQR & Kết Toán Lãi', badge: 'Chuyển lãi' },
       ],
       independentModules: [
         ALL_INDEPENDENT_MODULES.reports,
       ],
     };
   ```
3. **Phân tích lỗ hổng phát hiện:**
   - **Lỗ hổng 1 (Thiếu module Settings):** Danh sách `independentModules` chỉ chứa duy nhất `reports`. Hoàn toàn thiếu `ALL_INDEPENDENT_MODULES.settings`! Kế toán không thể truy cập trang Cài đặt từ thanh Sidebar.
   - **Lỗ hổng 2 (Lỗi hiển thị WS-B):** Workspace `B_Personnel360` được định nghĩa cơ sở tại dòng 31-38 với `permission: 'PERM_HR_EMPLOYEE_MANAGE'`. Tại `DynamicSidebar.jsx` (dòng 101-105), thẻ `<Can permission={item.permission}>` chặn hiển thị nếu người dùng thiếu quyền này. Do `ROLE_ACCOUNTANT` chỉ sở hữu `PERM_HR_ATTENDANCE` (không có `PERM_HR_EMPLOYEE_MANAGE`), mục menu WS-B bị ẩn hoàn toàn!

### 1.2. Khảo sát Quyền Truy Cập `/app/settings` & Quản Lý Nhóm Chi Phí (`CostCategoriesTab.jsx`)
1. **Lỗi tại `frontend/src/app/routes.jsx` (dòng 252-258):**
   ```jsx
   <Route
     path="settings"
     element={
       <PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_INVENTORY_RECEIPT']}>
         <SettingsPage />
       </PermissionGuard>
     }
   />
   ```
   *Hiện trạng:* `ROLE_ACCOUNTANT` sở hữu `PERM_FINANCE_EXPENSE` nhưng quyền này **không có mặt** trong `anyPermissions` của route `settings`. Khi Kế toán truy cập `/app/settings`, `PermissionGuard` lập tức đẩy người dùng về trang `/403` (Forbidden)!
2. **Lỗi tại `frontend/src/pages/settings/index.jsx` (dòng 88-107):**
   - Hook lọc tab `visibleTabs` chỉ phân tách quyền cho `isWarehouseStaff` (chỉ thấy `materials`, `warehouses`) và `isTechStaff` (chỉ thấy `crop-types`, `livestock-breeds`, `quotas`).
   - Hoàn toàn chưa có nhánh xử lý cho `isFarmAccountant`. Kế toán cần được cấu hình chỉ hiển thị đúng Tab số 9: **`cost-categories` (Nhóm Chi Phí Kế Toán)**.
3. **Lỗi ẩn nút tại `frontend/src/pages/settings/tabs/CostCategoriesTab.jsx`:**
   - Dòng 178: Nút Sửa (`Edit2`) và Xóa (`Trash2`) bị bọc trong `<Can permission="PERM_FARM_UPDATE">`.
   - Dòng 223: Nút `+ Thêm Nhóm Chi Phí` bị bọc trong `<Can permission="PERM_FARM_UPDATE">`.
   - Kế toán không có `PERM_FARM_UPDATE` nên toàn bộ các nút thao tác đều biến mất, mặc dù Backend [CostCategoryController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/masterdata/controller/CostCategoryController.java#L24-L46) đã cho phép rõ ràng:
     ```java
     @PreAuthorize("hasAnyAuthority('PERM_FINANCE_EXPENSE', 'PERM_FARM_UPDATE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
     ```

### 1.3. Khảo sát Route Guard của `/app/reports` (`ReportsPage`)
- Tại `routes.jsx` (dòng 260-266):
  ```jsx
  <Route
    path="reports"
    element={
      <PermissionGuard permission="PERM_FINANCE_REPORT">
        <ReportsPage />
      </PermissionGuard>
    }
  />
  ```
- `ROLE_ACCOUNTANT` sở hữu `PERM_FINANCE_REPORT` (#30).
- Khảo sát Backend [ReportController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/reports/controller/ReportController.java#L19-L64): Cả 5 endpoint báo cáo quản trị đều yêu cầu `PERM_FINANCE_REPORT` hoặc `PERM_INVENTORY_VIEW`.
- Khảo sát [CostingController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/controller/CostingController.java#L20-L29): API tính giá thành đơn vị `/unit-cost` cho phép `PERM_FINANCE_REPORT`.
- **Kết luận:** Phân hệ Báo cáo Tài chính `/app/reports` hoạt động thông suốt 100% đối với `ROLE_ACCOUNTANT`.

---

# PHẦN 2: KẾ TOÁN CHI PHÍ, GIÁ THÀNH & NGÂN SÁCH (WS-H1)

### 2.1. Kiểm tra Lỗi 403 Tiềm Ẩn khi Mở Các Modal tại WS-H1
1. **Modal Tạo Chi Phí (`CreateExpenseModal.jsx`) & Phân Bổ Chi Phí (`AllocateCostModal.jsx`):**
   - Khi mở modal, frontend gọi đồng thời 4 API:
     - `financeService.getCostCategories()` -> Gọi [CostCategoryController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/masterdata/controller/CostCategoryController.java): Hợp lệ (cho phép `PERM_FINANCE_EXPENSE`).
     - `geographyService.getZones(farmId)` -> Gọi [ProductionZoneController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/geography/controller/ProductionZoneController.java#L27): Hợp lệ (yêu cầu `PERM_FARM_VIEW`).
     - `farmingService.getCropSeasons(farmId)` -> Gọi [CropSeasonController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java#L29):
       ```java
       @PreAuthorize("(hasAnyAuthority('PERM_CROP_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
       ```
     - `farmingService.getLivestockGroups(farmId)` -> Gọi [LivestockController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/controller/LivestockController.java#L32):
       ```java
       @PreAuthorize("(hasAnyAuthority('PERM_LIVESTOCK_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF')) and @farmSecurity.canAccessFarm(#farmId)")
       ```
   - *Phân tích rủi ro:* Kế toán hiện vượt qua được 2 API này là nhờ quyền `PERM_INVENTORY_VIEW`. Tuy nhiên, trong danh sách `hasAnyRole` và `hasAnyAuthority` **hoàn toàn vắng bóng** `ROLE_ACCOUNTANT` và `PERM_FINANCE_EXPENSE`. Việc một kế toán chi phí phải dựa dẫm vào quyền "thủ kho tra cứu tồn kho" để nạp danh sách mùa vụ là một khiếm khuyết thiết kế ngữ nghĩa bảo mật cần được chuẩn hóa.
2. **Modal Lập Dự Toán Ngân Sách (`BudgetManagementTab.jsx`):**
   - Frontend gọi `geographyService.getCycles` -> [FarmOperationsController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/geography/controller/FarmOperationsController.java#L55): Cho phép `PERM_FARM_VIEW` (Hợp lệ).
   - Frontend gọi `POST /api/v1/farms/{farmId}/budgets` -> [BudgetController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/controller/BudgetController.java#L50): Cho phép `PERM_FINANCE_EXPENSE` và `ROLE_ACCOUNTANT`.

### 2.2. Kiểm tra Vi phạm Maker-Checker (SoD) tại Ngân Sách & Chi Phí
1. **Lỗ hổng nghiêm trọng tại `BudgetServiceImpl.java` (dòng 87):**
   ```java
   Budget budget = Budget.builder()
           ...
           .totalBudgetAmount(request.getTotalBudgetAmount())
           .status("ACTIVE") // <-- LỖI: GÁN CỨNG ACTIVE NGAY KHI TẠO
           ...
           .build();
   ```
   *Rủi ro:* Kế toán (Maker) khi bấm tạo ngân sách mới, bản ghi được kích hoạt thành `ACTIVE` ngay lập tức mà không chuyển sang trạng thái chờ duyệt `DRAFT`. Giám đốc trại không có cơ hội kiểm tra hay phê duyệt trần định mức chi phí.
2. **Bảo toàn SoD tại Chi Phí Vận Hành:**
   - Trong [MultiFarmExpenseSummary.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H1_CostAccounting/components/MultiFarmExpenseSummary.jsx#L548), các nút `[Duyệt]` và `[Từ Chối]` được bọc chặt:
     ```jsx
     <Can permission="PERM_FINANCE_EXPENSE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>
     ```
   - Trong [FarmExpenseController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/controller/FarmExpenseController.java#L86,L95), các API duyệt và hủy chi phí yêu cầu `@farmSecurity.isFarmManager(#farmId)`.
   - Trong [BudgetManagementTab.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H1_CostAccounting/components/BudgetManagementTab.jsx#L252), nút duyệt ngân sách cũng được khóa chặt cho `ROLE_FARM_MANAGER` và `ROLE_FARM_OWNER`.

---

# PHẦN 3: ĐƠN BÁN SỈ B2B, THU/CHI VIETQR & KẾT TOÁN (WS-H2)

### 3.1. Khảo sát Modal Lên Đơn Bán Sỉ B2B (`CreateSalesOrderModal.jsx`)
Khi Kế toán bấm `+ Lập Đơn Bán Sỉ B2B Mới`:
1. Modal gọi `partnerService.getPartners`: [PartnerController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/platform/controller/PartnerController.java#L26) cho phép `PERM_FINANCE_SALES_ORDER` -> Hợp lệ.
2. Modal gọi `qaService.getProductBatches({ farmId, size: 200 })`:
   - Backend [ProductBatchController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/controller/ProductBatchController.java#L33):
     ```java
     @PreAuthorize("hasAnyAuthority('PERM_HARVEST_MANAGE', 'PERM_QC_VIEW', 'PERM_QC_APPROVE', 'PERM_FARM_VIEW') and @farmSecurity.canAccessFarm(#farmId)")
     ```
   - *Phân tích rủi ro:* Kế toán có `PERM_FINANCE_SALES_ORDER` nhưng thẩm quyền này **không có** trong `@PreAuthorize` của `ProductBatchController`. Kế toán đọc được danh sách lô hiện nay chỉ nhờ quyền `PERM_FARM_VIEW`. Cần bổ sung `PERM_FINANCE_SALES_ORDER` để khép kín chuỗi bảo mật ngữ nghĩa bán hàng.

### 3.2. Khảo sát Thu/Chi VietQR, Phân Bổ Nợ & Cấn Trừ Công Nợ Hai Chiều
Tại [DebtAndPaymentController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/controller/DebtAndPaymentController.java):
- `GET /api/v1/farms/{farmId}/debts`: Cho phép `PERM_FINANCE_PAYMENT`, `PERM_FINANCE_REPORT`, `ROLE_ACCOUNTANT`.
- `POST /api/v1/farms/{farmId}/payments`: Cho phép `PERM_FINANCE_PAYMENT`.
- `POST /api/v1/farms/{farmId}/payments/{id}/allocate`: Cho phép `PERM_PAYMENT_ALLOCATE`.
- `POST /api/v1/farms/{farmId}/debts/offset`: Cho phép `PERM_PAYMENT_ALLOCATE`.
- Kế toán sở hữu cả `PERM_FINANCE_PAYMENT` (#28) và `PERM_PAYMENT_ALLOCATE` (#29), toàn bộ nghiệp vụ thu chi, tạo VietQR thanh toán, phân bổ nợ và cấn trừ nợ hai chiều hoạt động trơn tru.

### 3.3. Bảo toàn Maker-Checker (SoD) tại WS-H2
1. **Phê duyệt đơn bán sỉ:**
   - Trong [SalesOrderMonitorTab.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/SalesOrderMonitorTab.jsx#L181,L196): Các nút `[Duyệt Đơn]` và `[Hủy Đơn]` được bọc bằng `<Can permission="PERM_FINANCE_SALES_ORDER" role="ROLE_FARM_MANAGER">` -> Ẩn đối với Kế toán.
   - Trong [SalesOrderController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/finance/controller/SalesOrderController.java#L58): API `confirmOrder` yêu cầu `@farmSecurity.isFarmManager(#farmId)`.
2. **Điều phối giao vận & POD:**
   - Trong [SalesDeliveryMonitorTab.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/SalesDeliveryMonitorTab.jsx#L335): Nút `[🚚 Điều Xe Xuất Bến]` và `[📸 Cập Nhật POD]` được bọc trong `<Can role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>` -> Ẩn hoàn toàn với Kế toán. Kế toán chỉ xem trạng thái chuyến hàng, giá trị xuất giao và ảnh POD ở chế độ **Read-only**.
3. **Kết toán chu kỳ & Chuyển lợi nhuận:**
   - Trong [CycleSettlementConsole.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/CycleSettlementConsole.jsx#L247-L270) và [SettlementDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/SettlementDetailDrawer.jsx#L414-L438): Nút `[✍️ Ký Duyệt Bảng Kết Toán]` chỉ hiển thị cho `isFarmManager()`, nút `[Xác Nhận & Chốt Sổ]` chỉ hiển thị cho `isOwner()`. Kế toán chỉ có quyền xem chi tiết và đối soát số liệu.

---

# PHẦN 4: QUẢN TRỊ ĐỐI TÁC & SỔ CÁI CÔNG NỢ (WS-D)

Khảo sát [D_Partners/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/index.jsx), [PartnerDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/components/PartnerDetailDrawer.jsx) và [PartnerController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/platform/controller/PartnerController.java):
1. **Quyền Tạo & Sửa Đối Tác:**
   - Nút `+ Thêm Đối Tác Cho Trang Trại` (dòng 435) và nút Sửa (dòng 369) trong `D_Partners` được bọc:
     ```jsx
     <Can permission="PERM_FINANCE_SALES_ORDER" role={['ROLE_ACCOUNTANT', 'ROLE_FARM_MANAGER']}>
     ```
   - Backend `PartnerController.createPartner` và `updatePartner` cho phép `PERM_FINANCE_SALES_ORDER`. Kế toán tạo và sửa thông tin đối tác thành công 100%.
2. **Quyền Duyệt Nợ & Chặn Đối Tác (SoD):**
   - Nút `Duyệt nợ` và nút `Khóa/Mở Blacklist` (dòng 344) được bọc `<Can role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>`.
   - Backend `updatePartnerStatus` yêu cầu `hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')`. Kế toán không thể can thiệp vào hạn mức tín dụng hay danh sách đen.
3. **Xem Sổ Cái Công Nợ Chi Tiết:**
   - `PartnerDetailDrawer.jsx` nạp đầy đủ sổ chi tiết công nợ (`debt_records`), phân loại nợ phải thu / phải trả, xem tuổi nợ và sinh mã VietQR Napas247 thanh toán cho đối tác.

---

# PHẦN 5: TRA CỨU KHO (WS-C) & BÀN LÀM VIỆC HÀNG NGÀY (WS-G)

### 5.1. Tra Cứu Kho Bãi (WS-C) ở Chế Độ Read-Only
1. Tại [C_InventoryHub/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/index.jsx#L724-L774):
   - Cả 4 nút tạo phiếu: `+ Lập Phiếu Kho` (Receipt), `+ Lập Phiếu Xuất Kho` (Issue), `+ Lập Lệnh Điều Chuyển` (Transfer), `+ Mở Đợt Kiểm Kê` (Stocktake) đều được bọc trong `<Can role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>`.
   - Kế toán đăng nhập vào WS-C **hoàn toàn không thấy các nút tạo phiếu**.
2. Trên các dòng bảng dữ liệu:
   - Chỉ hiển thị nút `[Chi Tiết]` mở `ReceiptDetailDrawer` hoặc `IssueDetailDrawer` và nút `[Thẻ Kho]`. Kế toán đối chiếu đơn giá nhập, thành tiền, số lượng thực tế với hóa đơn tài chính của nhà cung cấp.
3. Phía Backend:
   - Các endpoint `GET /receipts`, `GET /issues`, `GET /inventory`, `GET /inventory/summary`, `GET /inventory/transactions` đều cho phép `PERM_INVENTORY_VIEW`. Kế toán đọc dữ liệu kho thông suốt 100%.

### 5.2. Bàn Làm Việc Hàng Ngày (WS-G) của Kế Toán
1. **Chấm công GPS 1 chạm (`OneTapTimekeepingCard`):** Gọi `POST /api/v1/hr/attendance/check-in` & `/check-out` -> Yêu cầu `PERM_HR_ATTENDANCE and !hasRole('ROLE_FARM_OWNER')`. Kế toán tự chấm công cá nhân thành công.
2. **Lịch làm việc cá nhân (`PersonalShiftScheduleCard`):** Gọi `GET /api/v1/hr/shifts/assignments` -> Cho phép `PERM_HR_ATTENDANCE` hoặc `isAuthenticated()`.
3. **Đơn xin nghỉ phép & Làm thêm giờ:** Gọi `POST /api/v1/hr/leaves` & `POST /api/v1/hr/overtime` -> Cho phép `isAuthenticated()`.
4. **Quản lý công việc kế toán trên Kanban:** Kế toán xem các đầu việc được Giám đốc trại giao (kiểm kê sổ sách, đối soát công nợ, xuất hóa đơn) và cập nhật trạng thái `IN_PROGRESS` / `COMPLETED` qua `PUT /api/v1/tasks/{id}/status` mà không gặp lỗi 403. Các tính năng điểm danh tổ và giao việc phát sinh tự động ẩn vì `canSuperviseTasks` là `false`.

---

# PHẦN 6: ĐỒNG BỘ DỮ LIỆU & THÔNG BÁO TỰ ĐỘNG LIÊN PHÒNG BAN

### 6.1. Khiếm Khuyết Đồng Bộ Dữ Liệu Tức Thì (Cross-Workspace Sync)
1. **Điểm nghẽn giữa WS-H2 và WS-D:**
   - Trong [CreatePaymentModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/CreatePaymentModal.jsx#L171) và [AllocateOrOffsetDebtModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/components/AllocateOrOffsetDebtModal.jsx): Khi hoàn tất thanh toán hoặc cấn trừ nợ, modal chỉ kích hoạt `notifyDataChanged?.('finance')`.
   - Trong khi đó, [D_Partners/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/index.jsx#L113) chỉ theo dõi:
     ```javascript
     useEffect(() => {
       fetchPartners();
     }, [partnerTypeTab, statusFilter, searchTerm, page, activeFarmId, syncTrigger?.partners]);
     ```
   - Trong [PartnerDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/D_Partners/components/PartnerDetailDrawer.jsx#L90), hàm `loadDebts()` hoàn toàn không đăng ký bất kỳ `syncTrigger` nào!
   - *Hậu quả:* Sau khi thu tiền khách sỉ hoặc trả tiền NCC tại WS-H2, dữ liệu dư nợ của đối tác bên WS-D bị đóng băng.

### 6.2. Thiếu Thông Báo Tự Động Hai Chiều (Realtime Notifications)
1. **Quy trình Chi phí (`FarmExpenseServiceImpl.java`):**
   - Kế toán tạo chi phí nháp (`DRAFT`): **Không có notification** gửi tới Giám đốc trại (`farm.getManagerUserId()`).
   - Giám đốc trại bấm Duyệt (`CONFIRMED`) hoặc Từ chối (`CANCELLED`): **Không có notification** gửi phản hồi cho Kế toán (`expense.getCreatedBy()`).
2. **Quy trình Đơn bán sỉ (`SalesOrderServiceImpl.java`):**
   - Service hoàn toàn chưa inject `NotificationService`.
   - Kế toán lên đơn bán sỉ mới (`PENDING`): Không thông báo cho Giám đốc trại.
   - Giám đốc trại duyệt đơn (`CONFIRMED`): Không thông báo cho Kế toán và Thủ kho.
3. **Quy trình Ngân sách & Thu chi (`BudgetServiceImpl.java` & `DebtAndPaymentServiceImpl.java`):**
   - Cả 2 service đều chưa tích hợp `NotificationService`. Thiếu thông báo khi có dự toán mới cần ký duyệt hoặc khi có giao dịch thanh toán VietQR cần đối soát.

---

# LỘ TRÌNH THỰC THI KHẮC PHỤC TRIỆT ĐỂ (ACTIONABLE ROADMAP)

Để xử lý trọn vẹn 8 mã lỗ hổng (`GAP-ACC-01` -> `GAP-ACC-08`), kiến trúc sư đề xuất lộ trình thực thi chia làm **2 Task chuyên biệt**:

### TASK 1: KHƠI THÔNG ĐIỀU HƯỚNG, ROUTE GUARDS, DANH MỤC NHÓM CHI PHÍ & VÁ LỖI 403 TRA CỨU NGHIỆP VỤ (`GAP-ACC-01`, `GAP-ACC-02`, `GAP-ACC-03`, `GAP-ACC-04`)
1. **Frontend Navigation & Route Guards (`GAP-ACC-01`, `GAP-ACC-02`):**
   - Bổ sung `ALL_INDEPENDENT_MODULES.settings` vào `independentModules` của `FARM_ACCOUNTANT` trong `menuConfig.js`.
   - Cập nhật `routes.jsx`: Bổ sung `PERM_FINANCE_EXPENSE` vào route `settings`. Chuẩn hóa route `hr` cho phép `PERM_HR_ATTENDANCE` để Kế toán truy cập bảng công tính lương WS-B.
   - Nâng cấp `pages/settings/index.jsx`: Thêm nhánh `isFarmAccountant`, tự động lọc và hiển thị duy nhất Tab `cost-categories`.
   - Nâng cấp `CostCategoriesTab.jsx`: Mở quyền các nút `+ Thêm Nhóm Chi Phí`, `Sửa`, `Xóa` cho `PERM_FINANCE_EXPENSE`.
2. **Backend RBAC Hardening & SoD Ngân Sách (`GAP-ACC-03`, `GAP-ACC-04`):**
   - Cập nhật `@PreAuthorize` của `CropSeasonController` và `LivestockController`: Bổ sung tường minh `PERM_FINANCE_EXPENSE` và `ROLE_ACCOUNTANT`.
   - Cập nhật `@PreAuthorize` của `ProductBatchController`: Bổ sung `PERM_FINANCE_SALES_ORDER` cho các API lấy danh sách lô thành phẩm.
   - Sửa đổi `BudgetServiceImpl.createBudget`: Nếu người tạo là `ROLE_ACCOUNTANT`, lưu ngân sách ở trạng thái `DRAFT` và yêu cầu Giám đốc trại phê duyệt sang `ACTIVE`.

### TASK 2: ĐỒNG BỘ DỮ LIỆU TỨC THÌ & HỆ THỐNG THÔNG BÁO TỰ ĐỘNG LIÊN PHÒNG BAN (`GAP-ACC-05`, `GAP-ACC-06`, `GAP-ACC-07`, `GAP-ACC-08`)
1. **Đồng Bộ Dữ Liệu Tức Thì (Cross-Workspace Bus - `GAP-ACC-05`):**
   - Trong `CreatePaymentModal.jsx` và `AllocateOrOffsetDebtModal.jsx`: Kích hoạt `notifyDataChanged?.('all')` hoặc đồng thời cả `'finance'` và `'partners'`.
   - Trong `D_Partners/index.jsx` và `PartnerDetailDrawer.jsx`: Lắng nghe thêm `syncTrigger?.finance` và `syncTrigger?.all` để tự động làm mới số dư nợ tức thì.
2. **Hệ Thống Thông Báo Tự Động Hai Chiều (`GAP-ACC-06`, `GAP-ACC-07`, `GAP-ACC-08`):**
   - Trong `FarmExpenseServiceImpl.java`: Bắn `Notification` (`type = "SYSTEM"`, `referenceType = "FARM_EXPENSE"`) cho Giám đốc trại khi có chi phí `DRAFT` mới; bắn thông báo kết quả cho Kế toán khi chi phí được Duyệt hoặc Từ chối.
   - Trong `SalesOrderServiceImpl.java`: Inject `NotificationService`, tự động gửi thông báo cho Giám đốc khi có đơn bán sỉ `PENDING`, và thông báo cho Kế toán + Thủ kho khi đơn hàng được duyệt `CONFIRMED`.
   - Trong `BudgetServiceImpl.java` & `DebtAndPaymentServiceImpl.java`: Inject `NotificationService`, tự động gửi thông báo liên phòng ban khi lập dự toán ngân sách hoặc duyệt phiếu thu/chi.
