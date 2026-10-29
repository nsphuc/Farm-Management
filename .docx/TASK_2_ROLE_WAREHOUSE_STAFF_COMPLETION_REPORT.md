# BÁO CÁO THỰC THI & HOÀN TẤT TASK 2 / 3 - ROLE_WAREHOUSE_STAFF
**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Đối tượng kiểm toán & thực thi:** Tài khoản Cấp 4 — `ROLE_WAREHOUSE_STAFF` (Thủ kho Vật tư, Đóng gói Lô & Giao vận — user mẫu `warehouse` / Operational Role: `WAREHOUSE_KEEPER`)  
**Chức năng nâng cấp:** Khôi phục Menu WS-F, Vá lỗi 403 Lập phiếu xuất kho (Mùa vụ & Đàn nuôi tại WS-C), Mở khóa Điểm danh tổ kho (WS-G), Giao việc kho vận nội bộ & Hệ thống Thông báo tự động duyệt phiếu kho  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Ngày thực hiện:** 26/10/2026  
**Mã lỗ hổng giải quyết:** `GAP-WH-03`, `GAP-WH-04`, `GAP-WH-08`, `GAP-WH-09`, `GAP-WH-10` (Căn cứ Báo cáo Kiểm toán `GAP_ANALYSIS_ROLE_WAREHOUSE_STAFF.md`)

---

## I. TỔNG QUAN KẾT QUẢ THỰC THI

| Mã Lỗ Hổng / Hạng Mục | Tên Lỗ Hổng / Vấn Đề | Trạng Thái Trước | Trạng Thái Sau | Cơ Chế Giải Quyết |
| :--- | :--- | :--- | :--- | :--- |
| **Menu WS-F Sidebar** | Workspace `WS-F: Đóng Gói Lô & In Tem Nhãn Nhiệt QR` bị lược mất khỏi menu của Thủ kho | ❌ Trong Task 1, `case 'WAREHOUSE_KEEPER'` vô tình thiếu `ALL_WORKSPACES.F_QaTraceability`, làm Thủ kho không thể truy cập đóng gói lô trực tiếp từ thanh bên. |  **HOÀN TẤT (RESOLVED)** | **1.** Bổ sung `PERM_HARVEST_MANAGE` vào `anyPermissions` của `F_QaTraceability` trong [menuConfig.js](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/menuConfig.js) và [routes.jsx](file:///d:/Projects/Farm_Management/frontend/src/app/routes.jsx).<br>**2.** Cấu hình mảng 4 Workspaces theo đúng thứ tự chuẩn nghiệp vụ: `WS-G`, `WS-C`, `WS-F`, `WS-H2` và giữ nguyên menu độc lập `/app/settings`. |
| **`GAP-WH-03`** | Lỗi 403 Forbidden khi Thủ kho nạp danh sách Mùa vụ / Đàn nuôi lúc lập Phiếu xuất kho nội bộ | ❌ `@PreAuthorize` của `CropSeasonController` và `LivestockController` chỉ cho phép `PERM_CROP_VIEW`, `PERM_LIVESTOCK_VIEW` hoặc Role Owner/Manager/Tech. Thủ kho (có `PERM_INVENTORY_ISSUE`) bị chặn 403. |  **HOÀN TẤT (RESOLVED)** | Cập nhật `@PreAuthorize` của `getSeasons`, `getSeasonById` ([CropSeasonController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java)) và `getGroups`, `getGroupById` ([LivestockController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/controller/LivestockController.java)) cho phép `PERM_INVENTORY_ISSUE`, `PERM_INVENTORY_VIEW`, `PERM_HARVEST_MANAGE` và `ROLE_WAREHOUSE_STAFF`. |
| **`GAP-WH-04`** | Phiếu xuất kho thiếu liên kết Đàn chăn nuôi (`livestockGroupId`) & hạch toán chi phí giá thành | ❌ `warehouse_issues` chỉ có `season_id`, thiếu `livestock_group_id`. Khi xuất cám/thuốc thú y cho Đàn chăn nuôi không thể gắn đối tượng chi phí và không sinh `FarmExpense`. |  **HOÀN TẤT (RESOLVED)** | **1.** Tạo Flyway migration [V1_6__add_livestock_group_id_to_warehouse_issues.sql](file:///d:/Projects/Farm_Management/backend/src/main/resources/db/migration/V1_6__add_livestock_group_id_to_warehouse_issues.sql) thêm cột `livestock_group_id` và FK composite.<br>**2.** Cập nhật Entity [WarehouseIssue.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/entity/WarehouseIssue.java), DTO [CreateWarehouseIssueRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/dto/CreateWarehouseIssueRequest.java) và [WarehouseIssueDetailResponse.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/dto/WarehouseIssueDetailResponse.java).<br>**3.** Tại [InventoryServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/service/impl/InventoryServiceImpl.java): Tự động sinh `FarmExpense` (`INVENTORY_BACKFLUSH`) khi hoàn tất phiếu xuất nội bộ cho cả `seasonId` lẫn `livestockGroupId`.<br>**4.** Nâng cấp UI [CreateIssueModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx) hỗ trợ chọn Mùa vụ / Đàn nuôi theo loại hình trang trại (`CROP`, `LIVESTOCK`, `MIXED`). |
| **`GAP-WH-08`** | Mở khóa Điểm danh Tổ Kho (`Batch Roll-Call`) cho Thủ kho tại WS-G | ❌ `canPerformBatchRollCall` trong `FarmSecurityEvaluator` không có `ROLE_WAREHOUSE_STAFF` và thiếu `'WAREHOUSE_KEEPER'` trong bảng phân quyền trang trại `farm_assignments`. Frontend chặn ẩn thẻ `<Can>`. |  **HOÀN TẤT (RESOLVED)** | **1.** Cập nhật [FarmSecurityEvaluator.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/common/security/evaluators/FarmSecurityEvaluator.java) (dòng 149-162): Bổ sung `user.hasRole("ROLE_WAREHOUSE_STAFF")` và `'WAREHOUSE_KEEPER'`.<br>**2.** Cập nhật [G_EmployeeDailyOps/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/G_EmployeeDailyOps/index.jsx): Cho phép `ROLE_WAREHOUSE_STAFF` và `WAREHOUSE_KEEPER` mở `TeamRollCallPanel`. |
| **`GAP-WH-09`** | Lỗi 403 Forbidden khi Thủ kho giao việc, sửa việc hoặc hủy việc kho vận nội bộ tại WS-G | ❌ `@PreAuthorize` của `FarmTaskController` yêu cầu `PERM_TASK_ASSIGN` hoặc Role `ROLE_FARM_MANAGER` / `ROLE_TECHNICAL_STAFF`. Thủ kho bị chặn 403 khi giao việc bốc xếp, dọn kho. |  **HOÀN TẤT (RESOLVED)** | Cập nhật `@PreAuthorize` của `createTask`, `updateTask`, `cancelTask`, `deleteTask` trong [FarmTaskController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/FarmTaskController.java) bổ sung `ROLE_WAREHOUSE_STAFF` và thẩm quyền `PERM_INVENTORY_RECEIPT`, `PERM_INVENTORY_ISSUE`. |
| **`GAP-WH-10`** | Thiếu thông báo tự động (Realtime Notifications) khi Lập & Phê duyệt / Hủy phiếu kho | ❌ Khi Thủ kho lập phiếu nhập/xuất/chuyển/kiểm kê, Giám đốc trang trại không nhận được notification; khi Giám đốc duyệt/hủy phiếu, Thủ kho không được thông báo kết quả. |  **HOÀN TẤT (RESOLVED)** | Tích hợp `NotificationService` vào [InventoryServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/service/impl/InventoryServiceImpl.java): Tự động bắn thông báo loại `"SYSTEM"` (tuân thủ DB check constraint `chk_notifications_type`) tới Giám đốc khi tạo phiếu mới, và thông báo kết quả ngược lại cho người tạo khi phiếu được Phê duyệt hoặc Hủy. |

---

## II. CHI TIẾT CÁC FILE ĐÃ NÂNG CẤP VÀ DÒNG CODE CỤ THỂ

### 1. Khôi phục Menu Sidebar & Route Guard cho `WS-F`
#### a. `frontend/src/shells/TenantAppShell/menuConfig.js`
- **File:** [frontend/src/shells/TenantAppShell/menuConfig.js](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/menuConfig.js)
- **Dòng 82-87:** Bổ sung `PERM_HARVEST_MANAGE` vào `ALL_WORKSPACES.F_QaTraceability`:
  ```javascript
  F_QaTraceability: {
    id: 'F_QaTraceability',
    label: 'WS-F: KCS, Đóng Gói Lô & Tem QR',
    path: '/app/qa-traceability',
    icon: QrCode,
    anyPermissions: ['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT', 'PERM_HARVEST_MANAGE'],
    category: 'CHẤT LƯỢNG & TRUY XUẤT NGUỒN GỐC',
  },
  ```
- **Dòng 296-310:** Cấu hình 4 Workspaces đầy đủ cho Thủ kho:
  ```javascript
  case 'WAREHOUSE_KEEPER':
    return {
      workspaces: [
        { ...ALL_WORKSPACES.G_EmployeeDailyOps, label: 'WS-G: Chấm Công & Điểm Danh Tổ Kho' },
        { ...ALL_WORKSPACES.C_InventoryHub, label: 'WS-C: Quét Mã Vạch & Nhập / Xuất / Kiểm Kê' },
        { ...ALL_WORKSPACES.F_QaTraceability, label: 'WS-F: Đóng Gói Lô & In Tem Nhãn Nhiệt QR' },
        { ...ALL_WORKSPACES.H2_SalesCashflow, label: 'WS-H2: Xuất Giao Hàng Lên Xe' },
      ],
      independentModules: [
        { ...ALL_INDEPENDENT_MODULES.settings, label: 'Danh Mục Kho Bãi & Vật Tư', badge: 'Kho & Vật tư' },
      ],
    };
  ```

#### b. `frontend/src/app/routes.jsx`
- **File:** [frontend/src/app/routes.jsx](file:///d:/Projects/Farm_Management/frontend/src/app/routes.jsx)
- **Dòng 79-84:** Mở rộng quyền cho route `qa-traceability`:
  ```jsx
  <Route
    path="qa-traceability"
    element={
      <RequirePermission anyPermissions={['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT', 'PERM_HARVEST_MANAGE']}>
        <WorkspaceQaTraceability />
      </RequirePermission>
    }
  />
  ```

---

### 2. Vá lỗi 403 & Hỗ trợ Đàn nuôi khi Lập phiếu xuất kho (`GAP-WH-03` & `GAP-WH-04`)
#### a. `CropSeasonController.java` & `LivestockController.java` (`GAP-WH-03`)
- **Files:**
  - [CropSeasonController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java#L52-L68)
  - [LivestockController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/controller/LivestockController.java#L55-L71)
- Cập nhật `@PreAuthorize` trên các API `GET /api/v1/farms/{farmId}/crop-seasons` và `GET /api/v1/farms/{farmId}/livestock-groups`:
  ```java
  @PreAuthorize("(hasAnyAuthority('PERM_CROP_VIEW', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_VIEW', 'PERM_HARVEST_MANAGE') "
          + "or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF')) "
          + "and @farmSecurity.canAccessFarm(#farmId)")
  ```

#### b. Migration Cơ sở dữ liệu `V1_6` (`GAP-WH-04`)
- **File tạo mới:** [V1_6__add_livestock_group_id_to_warehouse_issues.sql](file:///d:/Projects/Farm_Management/backend/src/main/resources/db/migration/V1_6__add_livestock_group_id_to_warehouse_issues.sql)
- **Cấu trúc SQL:**
  ```sql
  ALTER TABLE warehouse_issues
      ADD COLUMN livestock_group_id BIGINT NULL AFTER season_id;

  CREATE INDEX idx_warehouse_issues_livestock_group
      ON warehouse_issues (tenant_id, farm_id, livestock_group_id);

  ALTER TABLE warehouse_issues
      ADD CONSTRAINT fk_warehouse_issues_livestock_group_composite
      FOREIGN KEY (tenant_id, farm_id, livestock_group_id)
      REFERENCES livestock_groups (tenant_id, farm_id, id)
      ON DELETE SET NULL;
  ```
- *Lưu ý kiến trúc:* Giữ nguyên toàn bộ 6 file migration `V1_0` -> `V1_5` đã đóng băng, đảm bảo tính bất biến của lịch sử cơ sở dữ liệu Flyway.

#### c. Backend Entities, DTOs & Backflush Service (`GAP-WH-04`)
- **Files:**
  - [WarehouseIssue.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/entity/WarehouseIssue.java): Thêm trường `@Column(name = "livestock_group_id") private Long livestockGroupId;`.
  - [CreateWarehouseIssueRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/dto/CreateWarehouseIssueRequest.java): Thêm `@JsonAlias({"cropSeasonId", "seasonId"}) private Long seasonId;` và `@JsonAlias({"groupId", "livestockGroupId"}) private Long livestockGroupId;`.
  - [WarehouseIssueDetailResponse.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/dto/WarehouseIssueDetailResponse.java): Thêm `private Long livestockGroupId;`.
  - [InventoryServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/service/impl/InventoryServiceImpl.java):
    - Trong `createIssue`: Ánh xạ `livestockGroupId` từ request.
    - Trong `completeIssue`: Khi phiếu xuất kho nội bộ (`INTERNAL_USE`) hoàn tất và có gắn `seasonId` hoặc `livestockGroupId`, tự động sinh bản ghi chi phí `FarmExpense` với `expenseSource = "INVENTORY_BACKFLUSH"`, gắn đúng `seasonId` / `livestockGroupId`, danh mục `CostCategory` "Vật tư xuất kho", giúp tính toán chính xác giá thành cho cả trồng trọt lẫn chăn nuôi.
    - Trong `cancelIssue`: Tự động hủy các bản ghi `FarmExpense` tương ứng nếu phiếu bị hủy.
    - Trong `enrichIssueDetail`: Map trường `.livestockGroupId(i.getLivestockGroupId())`.

#### d. Giao diện Frontend Lập Phiếu Xuất Kho (`CreateIssueModal.jsx` & `IssueDetailDrawer.jsx`)
- **File:** [CreateIssueModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx)
  - Nhận diện loại hình trang trại qua `currentFarm.farmType` (`CROP`, `LIVESTOCK`, `MIXED`).
  - Gọi đồng thời `farmingService.getCropSeasons` và `farmingService.getLivestockGroups` khi modal mở.
  - Khi chọn mục đích `INTERNAL_USE`:
    - Trại trồng trọt: Hiển thị dropdown Mùa vụ.
    - Trại chăn nuôi: Hiển thị dropdown Đàn nuôi.
    - Trại hỗn hợp: Hiển thị cả 2 dropdown với cơ chế loại trừ tương hỗ (chọn Mùa vụ thì disable Đàn nuôi và ngược lại).
  - Tự động gọi `useActiveFarmStore.getState().notifyDataChanged?.('all')` và `('inventory')` khi lưu thành công.
- **File:** [IssueDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/IssueDetailDrawer.jsx)
  - Hiển thị thông tin `Vụ Mùa / Đàn Nuôi` tùy thuộc vào `seasonId` hoặc `livestockGroupId`.

---

### 3. Mở khóa Điểm danh Tổ Kho & Giao việc Kho vận tại WS-G (`GAP-WH-08` & `GAP-WH-09`)
#### a. Điểm danh Tổ Kho (`Batch Roll-Call` - `GAP-WH-08`)
- **Backend:** [FarmSecurityEvaluator.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/common/security/evaluators/FarmSecurityEvaluator.java#L145-L165)
  - Trong phương thức `canPerformBatchRollCall(Long farmId)`:
    - Bổ sung `user.hasRole("ROLE_WAREHOUSE_STAFF")`.
    - Thêm `'WAREHOUSE_KEEPER'` vào mệnh đề SQL:
      ```sql
      SELECT COUNT(fa) FROM FarmAssignment fa
      WHERE fa.tenantId = :tenantId AND fa.farmId = :farmId AND fa.userId = :userId AND fa.status = 'ACTIVE'
      AND fa.roleInFarm IN ('FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE_KEEPER')
      ```
- **Frontend:** [G_EmployeeDailyOps/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/G_EmployeeDailyOps/index.jsx#L250-L260)
  - Cập nhật thẻ `<Can>`:
    ```jsx
    <Can
      role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF']}
      farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'WAREHOUSE_KEEPER']}
      permission="PERM_HR_ATTENDANCE"
    >
      <TeamRollCallPanel farmId={selectedFarmId} />
    </Can>
    ```

#### b. Giao việc Kho vận Nội bộ (`GAP-WH-09`)
- **Backend:** [FarmTaskController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/hr/controller/FarmTaskController.java)
  - Cập nhật `@PreAuthorize` cho các API `createTask`, `updateTask`, `cancelTask`, `deleteTask`:
    ```java
    @PreAuthorize("(hasAnyAuthority('PERM_TASK_ASSIGN', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE') "
            + "or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF', 'ROLE_WAREHOUSE_STAFF')) "
            + "and @farmSecurity.canAccessFarm(#farmId)")
    ```
  - Thủ kho có thể chủ động phân công việc sắp xếp kho bãi, bốc dỡ hàng, kiểm đếm vật tư mà không gặp lỗi `403 Forbidden`.

---

### 4. Hệ thống Bắn Thông báo Tự động Phiếu kho (`GAP-WH-10`)
- **File:** [InventoryServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/service/impl/InventoryServiceImpl.java)
- Triển khai 2 hàm trợ giúp gửi thông báo đạt chuẩn DB Constraint `chk_notifications_type` (`type = "SYSTEM"`):
  1. `notifyFarmManager(Long tenantId, Long farmId, String title, String content)`: Tìm `managerUserId` của trang trại qua `FarmRepository` và tạo bản ghi thông báo.
  2. `notifyCreator(Long tenantId, Long farmId, Long createdByUserId, String title, String content)`: Gửi thông báo đến tài khoản tạo phiếu (Thủ kho).
- **Các điểm kích hoạt tự động:**
  - **Lập phiếu mới (Gửi Giám đốc):**
    - `createReceipt`: *"Thủ kho vừa lập Phiếu nhập kho [Mã phiếu] đang chờ phê duyệt."*
    - `createIssue`: *"Thủ kho vừa lập Phiếu xuất kho [Mã phiếu] đang chờ phê duyệt."*
    - `createTransfer`: *"Thủ kho vừa lập Lệnh điều chuyển [Mã lệnh] đang chờ duyệt xuất."*
    - `recordStocktakeCount`: *"Thủ kho đã cập nhật số lượng kiểm đếm thực tế cho Đợt kiểm kê [Mã kiểm kê]."*
  - **Phê duyệt / Hủy phiếu (Gửi Thủ kho):**
    - `completeReceipt`: *"Phiếu nhập kho [Mã phiếu] đã được Giám đốc trang trại phê duyệt và nhập kho thành công."*
    - `cancelReceipt`: *"Phiếu nhập kho [Mã phiếu] đã bị hủy. Lý do: [Lý do]."*
    - `completeIssue`: *"Phiếu xuất kho [Mã phiếu] đã được Giám đốc trang trại phê duyệt hoàn tất."*
    - `cancelIssue`: *"Phiếu xuất kho [Mã phiếu] đã bị từ chối/hủy. Lý do: [Lý do]."*
    - `dispatchTransfer`: *"Lệnh điều chuyển [Mã lệnh] đã được duyệt xuất kho, hàng đang trên đường vận chuyển."*
    - `receiveTransfer`: *"Lệnh điều chuyển [Mã lệnh] đã được tiếp nhận thành công vào kho đích."*
    - `adjustStocktake`: *"Đợt kiểm kê [Mã kiểm kê] đã được Giám đốc trang trại phê duyệt và tự động cân chỉnh tồn kho."*

---

### 5. Cập nhật Tính phản ứng Dữ liệu UI (Data Reactivity)
Đã bổ sung `useActiveFarmStore.getState().notifyDataChanged?.('all')` và `('inventory')` sau mọi hành động thêm mới / duyệt / hủy phiếu tại:
- [CreateReceiptModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/CreateReceiptModal.jsx)
- [ReceiptDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/ReceiptDetailDrawer.jsx)
- [CreateIssueModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx)
- [IssueDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/IssueDetailDrawer.jsx)
- [CreateTransferModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/CreateTransferModal.jsx)
- [TransferDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/TransferDetailDrawer.jsx)
- [StocktakeDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/C_InventoryHub/components/StocktakeDetailDrawer.jsx)

---

## III. KẾT QUẢ KIỂM THỬ VÀ VALIDATION HỆ THỐNG

### 1. Backend Validation
- **Biên dịch & Test Compile:** `mvn test-compile` -> **BUILD SUCCESS**.
- **Flyway Database Migration:** Schema tự động nâng cấp từ `1.5` lên `1.6` qua script `V1_6__add_livestock_group_id_to_warehouse_issues.sql` trong 0.490s trên môi trường MySQL `farm_saas_dev`.
- **Chạy toàn bộ Integration Tests:**
  ```text
  [INFO] Running com.farm.saas.BatchRollCallAttendanceTest -> Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.InventoryPurchaseAndDebtIntegrationTest -> Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.QualityAndHrIntegrationTest -> Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SecurityAndTenantIsolationIntegrationTest -> Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SystemSubscriptionAndLimitsIntegrationTest -> Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Results: Tests run: 46, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS (Total time: 28.547 s)
  ```
  **100% 46/46 test cases PASS tuyệt đối.**

### 2. Frontend Validation
- **Vitest Unit & Flow Tests:**
  ```text
  ✓ src/OwnerRoleUiFlow.test.jsx (5 tests)
  Test Files: 2 passed (2)
  Tests: 9 passed (9)
  ```
- **Vite Production Build:**
  ```text
  > npm run build
  vite v5.4.21 building for production...
  ✓ 1781 modules transformed.
  dist/index.html                     1.01 kB
  dist/assets/index-D1oTzuCK.css     75.39 kB
  dist/assets/index-DADAakwn.js   1,452.56 kB
  ✓ built in 3.75s
  ```
  **Build thành công hoàn toàn không có lỗi cú pháp hay import.**

---

## IV. KẾT LUẬN & SẴN SÀNG CHO TASK 3 / 3
Tất cả 5 mã lỗ hổng (`GAP-WH-03`, `GAP-WH-04`, `GAP-WH-08`, `GAP-WH-09`, `GAP-WH-10`) cùng yêu cầu khôi phục WS-F đã được hoàn tất triệt để, đồng bộ từ tầng Database Migration (V1_6), Backend Domain/Security/Service, đến Frontend UI & State Management.

Hệ thống đã sẵn sàng cho **TASK 3 / 3: E2E Integration Testing & Role Matrix Verification** cho tài khoản `ROLE_WAREHOUSE_STAFF`.
