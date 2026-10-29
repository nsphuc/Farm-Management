# BÁO CÁO KIỂM TOÁN HỆ THỐNG & GAP ANALYSIS TOÀN DIỆN
## ĐÁNH GIÁ CHỨC NĂNG TÀI KHOẢN `ROLE_WAREHOUSE_STAFF` (CẤP 4 - THỦ KHO VẬT TƯ, ĐÓNG GÓI LÔ THÀNH PHẨM & GIAO VẬN)
**Dự án:** Farm Management SaaS Multi-Tenant Platform  
**Vai trò thẩm định:** Principal Software Architect  
**Tài khoản mẫu kiểm thử:** `warehouse` (`ROLE_WAREHOUSE_STAFF`)  
**Mục tiêu:** Rà soát 100% chức năng Frontend (`frontend/src/`) & Backend (`backend/src/main/java/com/farm/saas/`) liên quan đến `ROLE_WAREHOUSE_STAFF`, phát hiện toàn bộ lỗ hổng phân quyền (RBAC), điểm nghẽn UX/UI, lỗi HTTP 403 Forbidden / HTTP 400 Bad Request, vi phạm nguyên tắc tách biệt trách nhiệm Maker-Checker (SoD), và sai lệch luồng đồng bộ dữ liệu tự động giữa các Workspace trong chuỗi giá trị nông nghiệp.

---

## TỔNG QUAN VỊ TRÍ & QUYỀN HẠN CỦA `ROLE_WAREHOUSE_STAFF` (THEO RBAC MATRIX V1_4)
Theo thiết kế chuẩn phân quyền 4 cấp (`V1_4__standardize_4_tier_rbac_matrix.sql`, dòng 149-163), `ROLE_WAREHOUSE_STAFF` là vai trò **Cấp 4 (Tầng Thực thi - Maker Kho vận & Đóng gói)** với đúng **10 quyền hạn nghiệp vụ cốt lõi**:
1. `PERM_FARM_VIEW` (#3): Xem thông tin cơ sở nông trại, danh sách kho bãi và sơ đồ hạ tầng.
2. `PERM_INVENTORY_VIEW` (#12): Tra cứu số lượng tồn kho khả dụng, thẻ kho, số lô, hạn sử dụng vật tư và nông sản.
3. `PERM_INVENTORY_RECEIPT` (#13): **Maker Nhập kho**: Lập phiếu nhập kho mua hàng (`PURCHASE`) từ nhà cung cấp, nhập kho thu hồi (`RETURN`) hoặc nhập khác (`OTHER`).
4. `PERM_INVENTORY_ISSUE` (#14): **Maker Xuất kho**: Lập phiếu xuất vật tư phục vụ nội bộ vụ mùa (`INTERNAL_USE`), xuất hủy/hỏng (`DISCARD`), xuất bán lẻ hoặc chuyển kho.
5. `PERM_INVENTORY_TRANSFER` (#15): **Maker Điều chuyển**: Lập yêu cầu điều chuyển hàng giữa các kho nội bộ trại (`PENDING`) và **Tiếp nhận hàng điều chuyển (`RECEIVE`)** khi hàng đến kho đích (`IN_TRANSIT`).
6. `PERM_INVENTORY_STOCKTAKE` (#16): **Maker Kiểm kê**: Tạo đợt kiểm kê kho (`DRAFT`), nhập số lượng thực tế đếm được (`IN_PROGRESS`) và ghi nhận lý do chênh lệch.
7. `PERM_HARVEST_MANAGE` (#17): **Tiếp nhận nông sản & Đóng gói**: Tiếp nhận sản lượng từ biên bản thu hoạch của công nhân hiện trường, đóng gói thành các Lô thành phẩm (`product_batches`) ở trạng thái chờ kiểm định (`PENDING_APPROVAL`).
8. `PERM_LABEL_PRINT` (#20): **In tem nhãn nhiệt QR**: Phát lệnh in tem nhãn nhiệt ESC/POS dán thùng/bao bì cho các lô thành phẩm đã được phê duyệt KCS (`READY_TO_PRINT` -> `PRINTED`).
9. `PERM_DELIVERY_MANAGE` (#22): **Maker Giao vận B2B**: Lập phiếu xuất giao hàng (`sales_deliveries`), điều phối xuất bến xe tải (`dispatch`) và cập nhật ảnh chứng từ biên bản giao nhận POD (`pod`).
10. `PERM_HR_ATTENDANCE` (#24): **Chấm công & Điểm danh tổ**: Tự chấm công 2 đầu GPS + Selfie cá nhân và **điểm danh hộ (Batch Roll-Call)** cho đội ngũ công nhân bốc xếp kho, đóng gói thời vụ không có tài khoản.

### Các ranh giới cấm tuyệt đối theo nguyên tắc Tách biệt nhiệm vụ (Separation of Duties - SoD & Maker-Checker):
- **CẤM DUYỆT PHIẾU KHO (`PERM_INVENTORY_RECEIPT / ISSUE / TRANSFER / STOCKTAKE`)**: Thủ kho chỉ được lập phiếu ở trạng thái `DRAFT` / `PENDING` / `IN_PROGRESS`. Quyền `[Phê Duyệt & Hoàn Tất Nhập/Xuất]`, `[Duyệt Xuất Điều Chuyển (Dispatch)]`, và `[Phê Duyệt Chốt Cân Chỉnh Kiểm Kê (Adjust)]` thuộc độc quyền của **Giám đốc trang trại (`ROLE_FARM_MANAGER`)**.
- **CẤM DUYỆT KCS LÔ THÀNH PHẨM (`PERM_QC_APPROVE`) & CẤM PHÁT LỆNH THU HỒI (`PERM_QC_RECALL`)**: Việc kiểm nghiệm mẫu thuộc về Kỹ sư KCS (`ROLE_TECHNICAL_STAFF`), việc duyệt xuất xưởng cấp mã QR thuộc Giám đốc trại (`ROLE_FARM_MANAGER`), và thu hồi khẩn cấp thuộc Owner/Manager. Thủ kho chỉ in tem khi lô đã `READY_TO_PRINT`.
- **CẤM TỰ TẠO ĐƠN BÁN HÀNG B2B (`PERM_FINANCE_SALES_ORDER`) & THU CHI TIỀN (`PERM_FINANCE_PAYMENT`)**: Thuộc về Kế toán trang trại (`ROLE_ACCOUNTANT`). Thủ kho chỉ xuất giao hàng theo đơn bán sỉ đã được Giám đốc trại duyệt (`CONFIRMED`).
- **CẤM GHI NHẬT KÝ ĐỒNG RUỘNG (`PERM_CROP_LOG`) & LẬP BIÊN BẢN THU HOẠCH TẠI RUỘNG**: Việc thu hoạch tại ruộng thuộc Công nhân hiện trường (`ROLE_FIELD_STAFF`). Thủ kho chỉ tiếp nhận tại cửa kho để đóng gói lô.

---

# BẢNG TỔNG HỢP TOÀN BỘ LỖ HỔNG & ĐIỂM NGHẼN (EXECUTIVE GAP MATRIX)

| Mã Lỗ Hổng | Phân Vùng | Vị Trí File & Dòng Code | Hiện Trạng Thực Tế | Rủi Ro & Hành Vi Lỗi | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-WH-01** | **Điều hướng Menu & Route WS-H2** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 309-312, 93-99)*<br>`frontend/src/app/routes.jsx`<br>*(Dòng 242-248)* | Menu gán `WS-H2: Xuất Giao Hàng Lên Xe` cho Thủ kho, nhưng `ALL_WORKSPACES.H2_SalesCashflow` và `routes.jsx` bọc cứng quyền `PERM_FINANCE_SALES_ORDER`. Thủ kho chỉ có `PERM_DELIVERY_MANAGE`. | **HTTP 403 FORBIDDEN FATAL:** Sidebar ẩn hoàn toàn WS-H2 đối với Thủ kho. Nếu gõ URL `/app/sales-cashflow`, Route Guard chặn và redirect sang trang `/403`. Thủ kho không vào được bàn làm việc giao vận. | **CRITICAL** |
| **GAP-WH-02** | **Quản trị Danh mục Kho & Vật tư** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 314, 104-110)*<br>`frontend/src/app/routes.jsx`<br>*(Dòng 252-258)*<br>`frontend/src/pages/settings/index.jsx`<br>*(Dòng 88-102)* | Thủ kho sở hữu `PERM_INVENTORY_RECEIPT` (được phép tạo/sửa vật tư & kho ở backend), nhưng `menuConfig.js` để `independentModules: []`, `routes.jsx` chặn vì thiếu quyền `settings`, và `pages/settings/index.jsx` chưa lọc 2 tab `materials` & `warehouses`. | **HTTP 403 FORBIDDEN:** Thủ kho bị chặn 100% không thể vào `/app/settings` để cấu hình danh mục Vật tư, Đơn vị quy đổi và Danh mục Kho bãi phục vụ nhập kho. | **CRITICAL** |
| **GAP-WH-03** | **Lỗi 403 Lập Phiếu Xuất Kho** | `backend/src/main/java/com/farm/saas/modules/crop/controller/CropSeasonController.java`<br>*(Dòng 28-37)*<br>`frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx`<br>*(Dòng 52-61)* | Khi mở modal xuất vật tư nội bộ `INTERNAL_USE`, frontend gọi `farmingService.getCropSeasons(farmId)`. Backend yêu cầu `PERM_CROP_VIEW`, nhưng Thủ kho KHÔNG có quyền này. | **LỖI HTTP 403 FORBIDDEN:** API lấy mùa vụ bị từ chối 403, dropdown Mùa vụ liên kết bị rỗng 100% (`seasons = []`). Thủ kho không thể chọn mùa vụ thụ hưởng để hạch toán chi phí vật tư. | **CRITICAL** |
| **GAP-WH-04** | **Thiếu Xuất Vật tư Chăn nuôi** | `frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx`<br>*(Dòng 40-75, 45)* | `CreateIssueModal` chỉ có trường chọn `seasonId` (Mùa vụ trồng trọt). Hoàn toàn thiếu trường chọn Đàn nuôi (`livestockGroupId`) khi trang trại là trại chăn nuôi hoặc hỗn hợp. | Thủ kho trại chăn nuôi không thể xuất cám, thức ăn thô xanh, vắc-xin cho các đàn/chuồng nuôi cụ thể, làm đứt gãy luồng hạch toán chi phí chăn nuôi. | **HIGH** |
| **GAP-WH-05** | **Đứt gãy Khâu Đóng gói Lô Thành phẩm** | `frontend/src/workspaces/E_FarmingOps/components/GrowthAndHarvestTab.jsx`<br>*(Dòng 180-227, 518-531)*<br>`frontend/src/workspaces/F_QaTraceability/index.jsx`<br>*(Dòng 108-119, 194-221, 501-510, 836-918)*<br>`frontend/src/app/routes.jsx`<br>*(Dòng 167-173)* | Nút `[📦 Đóng Gói Lô]` gắn với biên bản thu hoạch thực tế nằm ở WS-E. Nhưng Thủ kho bị chặn 403 khỏi WS-E. Tại WS-F (bàn làm việc chính), modal tạo lô chỉ là form nhập text chay, không có danh sách biên bản thu hoạch để tiếp nhận. | **ĐỨT GÃY CHUỖI GIÁ TRỊ:** Công nhân thu hoạch xong ngoài đồng, Thủ kho không vào được WS-E để đóng gói; còn ở WS-F thì không biết có đợt thu hoạch nào vừa về kho để đóng gói lô `PENDING_APPROVAL`. | **CRITICAL** |
| **GAP-WH-06** | **Lỗi 403 Lập Phiếu Giao Hàng B2B** | `backend/src/main/java/com/farm/saas/modules/finance/controller/SalesOrderController.java`<br>*(Dòng 27-36)*<br>`frontend/src/workspaces/H2_SalesCashflow/components/CreateDeliveryModal.jsx`<br>*(Dòng 93-125)* | Khi mở `CreateDeliveryModal`, modal gọi `financeService.getSalesOrders` để chọn đơn hàng cần xuất xe. Backend `SalesOrderController.getOrders` chỉ cho phép `PERM_FINANCE_SALES_ORDER` / `PERM_FINANCE_REPORT`. Thủ kho bị chặn 403. | **LỖI HTTP 403 FORBIDDEN FATAL:** Thủ kho có quyền `PERM_DELIVERY_MANAGE` để giao hàng, nhưng không được phép đọc danh sách đơn hàng đã duyệt (`CONFIRMED`). Dropdown Đơn hàng bị rỗng, không thể lập bất kỳ phiếu giao hàng nào! | **CRITICAL** |
| **GAP-WH-07** | **Thiếu UI Quản lý Giao vận & Xuất Xe** | `frontend/src/workspaces/H2_SalesCashflow/index.jsx`<br>*(Dòng 291-295)*<br>`frontend/src/services/modules/financeService.js`<br>*(Dòng 164-180)* | Tab `DELIVERIES` tại WS-H2 hiện chỉ render lại `SalesOrderMonitorTab`. Không có Bảng danh sách các đợt giao hàng (`DO-...`), không có nút bấm `[🚚 Xuất Bến / Dispatch]` và không có nút `[📸 Cập Nhật POD]`. | Backend `SalesDeliveryController` đã có đủ 100% API tạo, xuất xe, upload POD, nhưng Frontend hoàn toàn thiếu giao diện theo dõi đợt giao và thao tác xuất xe của Thủ kho. | **CRITICAL** |
| **GAP-WH-08** | **Chặn Điểm danh Tổ Kho (Batch Roll-Call)** | `frontend/src/workspaces/G_EmployeeDailyOps/index.jsx`<br>*(Dòng 254)*<br>`backend/src/main/java/com/farm/saas/common/security/FarmSecurityEvaluator.java`<br>*(Dòng 150, 156)* | Frontend `Can` tại dòng 254 chỉ cho phép `ROLE_FARM_MANAGER`, `ROLE_TECHNICAL_STAFF`. Backend `canPerformBatchRollCall` cũng bỏ quên `ROLE_WAREHOUSE_STAFF` và `'WAREHOUSE_KEEPER'`. | **LỖI HTTP 403 / ẨN UI:** Menu hiển thị "Điểm danh tổ kho", component `TeamRollCallPanel` đã viết sẵn logic lọc nhân sự kho, nhưng Thủ kho bị ẩn UI; nếu mở được cũng bị Backend ném `AccessDeniedException` 403. | **HIGH** |
| **GAP-WH-09** | **Lỗi 403 Giao việc Kho vận Phát sinh** | `backend/src/main/java/com/farm/saas/modules/hr/controller/FarmTaskController.java`<br>*(Dòng 25-32)*<br>`frontend/src/workspaces/G_EmployeeDailyOps/index.jsx`<br>*(Dòng 55, 326)* | `canSuperviseTasks` bật `canManageTasks={true}` cho Thủ kho. Nhưng khi Thủ kho bấm `+ Giao Việc Phát Sinh` (giao việc bốc xếp, kiểm kho cho nhân viên), Backend `createTask` yêu cầu `PERM_TASK_ASSIGN`. Thủ kho không có quyền này. | **LỖI HTTP 403 FORBIDDEN:** Thủ kho không thể giao các công việc kho vận phát sinh hàng ngày cho công nhân bốc vác trong tổ kho của mình. | **MEDIUM** |
| **GAP-WH-10** | **Thiếu Thông báo Duyệt Phiếu Kho** | `backend/src/main/java/com/farm/saas/modules/inventory/service/impl/InventoryServiceImpl.java` | Khi Thủ kho lập phiếu nhập (`DRAFT`), phiếu xuất (`DRAFT`), điều chuyển (`PENDING`), kiểm kê (`IN_PROGRESS`), service hoàn toàn KHÔNG gọi `NotificationService`. | Giám đốc trại không nhận được chuông thông báo có phiếu kho mới chờ duyệt; phải tự mò vào từng tab của WS-C để tìm phiếu `DRAFT`. | **MEDIUM** |
| **GAP-WH-11** | **Thiếu Thông báo Kiểm định Lô Thành phẩm** | `backend/src/main/java/com/farm/saas/modules/quality/service/impl/ProductBatchServiceImpl.java` | Khi Thủ kho đóng gói Lô thành phẩm mới (`PENDING_APPROVAL`), service KHÔNG gọi `NotificationService` để gửi thông báo cho Kỹ sư KCS (`tech`). | Kỹ sư KCS không nhận được thông báo có lô nông sản vừa về kho cần lấy mẫu kiểm nghiệm VietGAP, gây chậm trễ khâu xuất xưởng. | **MEDIUM** |
| **GAP-WH-12** | **Thiếu Thông báo Xuất Xe Giao Hàng B2B** | `backend/src/main/java/com/farm/saas/modules/finance/service/impl/SalesDeliveryServiceImpl.java` | Khi Thủ kho xuất xe (`dispatchDelivery`), service không gửi thông báo cho Kế toán (`accountant`) và Giám đốc trại về việc hàng đã rời kho và công nợ đã phát sinh. | Kế toán không nắm bắt được thời điểm xe lăn bánh để theo dõi công nợ phải thu và chuẩn bị hóa đơn đối chiếu cho khách hàng B2B. | **LOW** |

---

# PHẦN 1: KIỂM TRA MENU ĐIỀU HƯỚNG, ROUTE GUARDS & DANH MỤC KHO/VẬT TƯ

### 1.1. Khảo sát Thanh Sidebar Navigation (`menuConfig.js` & `useAuthStore.js`)
Khi đăng nhập bằng tài khoản `warehouse` (`ROLE_WAREHOUSE_STAFF`):
1. **Mã vai trò vận hành:** Hàm `useAuthStore.getOperationalRole()` (dòng 509) kiểm tra `isWarehouseKeeper()` và trả về chính xác chuỗi:
   ```javascript
   'WAREHOUSE_KEEPER'
   ```
2. **Cấu hình Menu hiển thị:** Tại `frontend/src/shells/TenantAppShell/menuConfig.js` (dòng 289-315):
   ```javascript
   case 'WAREHOUSE_KEEPER':
     return {
       sectionTitle: 'Bàn Thao Tác Thủ Kho Trang Trại',
       workspaces: [
         {
           ...ALL_WORKSPACES.G_EmployeeDailyOps,
           label: 'WS-G: Chấm Công & Điểm Danh Tổ Kho',
           badge: 'Tổ kho',
         },
         {
           ...ALL_WORKSPACES.C_InventoryHub,
           label: 'WS-C: Quét Mã Vạch & Nhập / Xuất / Kiểm Kê',
           badge: 'Thủ kho',
         },
         {
           ...ALL_WORKSPACES.F_QaTraceability,
           label: 'WS-F: In Tem Nhãn Nhiệt QR & Mã Vạch',
           badge: 'In tem QR',
         },
         {
           ...ALL_WORKSPACES.H2_SalesCashflow,
           label: 'WS-H2: Xuất Giao Hàng Lên Xe',
           badge: 'Giao hàng',
         },
       ],
       independentModules: [],
     };
   ```

#### Đánh giá Lỗi Phân Quyền (`GAP-WH-01`):
- `ALL_WORKSPACES.H2_SalesCashflow` được định nghĩa ở dòng 93-99:
  ```javascript
  H2_SalesCashflow: {
    id: 'H2_SalesCashflow',
    label: 'WS-H2: Bán Hàng & VietQR',
    path: '/app/sales-cashflow',
    icon: BadgeDollarSign,
    permission: 'PERM_FINANCE_SALES_ORDER', // <-- VẤN ĐỀ Ở ĐÂY
    badge: 'VietQR',
  }
  ```
- Trong `DynamicSidebar.jsx` (dòng 101-105):
  ```jsx
  <Can
    key={item.id}
    permission={item.permission}
    anyPermissions={item.anyPermissions}
  >
  ```
- Vì `ROLE_WAREHOUSE_STAFF` sở hữu `PERM_DELIVERY_MANAGE` chứ **không sở hữu** `PERM_FINANCE_SALES_ORDER`, component `<Can>` đánh giá `false`, khiến **WS-H2 bị ẩn hoàn toàn khỏi Sidebar** của Thủ kho!
- Thêm vào đó, tại `frontend/src/app/routes.jsx` (dòng 244):
  ```jsx
  <Route
    path="sales-cashflow"
    element={
      <PermissionGuard permission="PERM_FINANCE_SALES_ORDER">
        <SalesCashflowWorkspace />
      </PermissionGuard>
    }
  />
  ```
  Nếu Thủ kho gõ URL `/app/sales-cashflow`, Route Guard lập tức điều hướng sang `/403`. Thủ kho bị cô lập hoàn toàn khỏi nghiệp vụ xuất xe giao hàng!

---

### 1.2. Khảo sát Lối vào Tiếp nhận Thu hoạch & Đóng gói Lô Thành phẩm (`GAP-WH-05`)
1. **Hiện trạng nút Đóng gói Lô:**
   - Trong toàn bộ codebase, nút `[📦 Đóng Gói Lô]` gắn với dữ liệu thực tế chỉ xuất hiện tại duy nhất một nơi: `GrowthAndHarvestTab.jsx` (dòng 518-531) thuộc **WS-E (`E_FarmingOps`)**:
     ```jsx
     <Can permission="PERM_HARVEST_MANAGE" role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
       <Button
         size="xs"
         variant="outline"
         icon={<PackageCheck className="h-3 w-3" />}
         onClick={() => handleOpenPackagingForRecord(hr)}
         title="Tiếp nhận đợt thu hoạch này để đóng gói lô thành phẩm"
       >
         Đóng Gói Lô
       </Button>
     </Can>
     ```
2. **Hành vi chặn 403 Forbidden đối với Thủ kho:**
   - Sidebar của `WAREHOUSE_KEEPER` **hoàn toàn không có WS-E** (`/app/farming`).
   - Route Guard tại `routes.jsx` (dòng 169):
     ```jsx
     <PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>
       <FarmingOpsWorkspace />
     </PermissionGuard>
     ```
     `ROLE_WAREHOUSE_STAFF` không có `PERM_CROP_VIEW` hay `PERM_LIVESTOCK_VIEW`, chỉ có `PERM_HARVEST_MANAGE`. Do đó nếu truy cập `/app/farming`, Thủ kho bị chặn **HTTP 403 Forbidden**.
3. **Tại WS-F (`F_QaTraceability`) — Nơi làm việc chính của Thủ kho:**
   - Có nút `+ Tạo Lô Thành Phẩm Đóng Gói` (dòng 501-510) mở modal `isCreateBatchOpen` (dòng 836-918).
   - Tuy nhiên, modal này chỉ chứa các ô nhập tĩnh: Tên sản phẩm, Số lượng ban đầu, Đơn vị tính, Ngày thu hoạch, Hạn dùng.
   - **HOÀN TOÀN KHÔNG CÓ dropdown hay bảng chọn Biên bản thu hoạch (`harvest_records`)** của trang trại! Không gọi `qaService.getHarvestRecords(farmId)` và không truyền `sourceHarvestRecordIds` về Backend.
   - Hậu quả: Lô đóng gói ở WS-F là lô trôi nổi, không truy vết được nguồn gốc từ đợt thu hoạch nào của ruộng/chuồng nào.

---

### 1.3. Khảo sát Quyền Quản lý Danh mục Kho & Vật tư tại `/app/settings` (`GAP-WH-02`)
1. **Phân quyền tại các Tab:**
   - Trong `MaterialsTab.jsx` (dòng 213, 250) và `WarehousesTab.jsx` (dòng 299), các nút Thêm/Sửa/Xóa đã được cấu hình:
     ```jsx
     <Can anyPermissions={["PERM_FARM_UPDATE", "PERM_INVENTORY_RECEIPT"]}>
     ```
   - Backend `MaterialController.java` (dòng 42, 48) và `WarehouseController.java` (dòng 40, 48) đều cho phép `PERM_INVENTORY_RECEIPT`.
2. **Điểm nghẽn chặn 3 lớp ở Frontend:**
   - **Lớp 1 (Menu Sidebar):** `menuConfig.js` cấu hình `independentModules: []` cho `WAREHOUSE_KEEPER`. Sidebar không có link vào Cài đặt.
   - **Lớp 2 (Route Guard):** `routes.jsx` (dòng 254):
     ```jsx
     <PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']}>
       <SettingsPage />
     </PermissionGuard>
     ```
     Danh sách quyền này thiếu `PERM_INVENTORY_RECEIPT`, khiến Thủ kho truy cập `/app/settings` bị văng ra trang `/403`.
   - **Lớp 3 (Lọc Tab hiển thị):** `pages/settings/index.jsx` (dòng 90-102) chỉ có logic lọc tab cho `isTechStaff`. Nếu Thủ kho vượt qua được Route Guard, hệ thống sẽ để mặc định `visibleTabs` hiển thị toàn bộ 9 tab (bao gồm cả Hồ sơ công ty mẹ, Ca làm việc, Nhóm chi phí kế toán).

---

# PHẦN 2: KIỂM TRA TRUNG TÂM GIAO DỊCH KHO — WORKSPACE C (`C_InventoryHub`) & CÁC API PHỤ TRỢ

### 2.1. Kiểm tra 4 Modal Lập Phiếu Kho & Phát hiện Lỗi HTTP 403 Forbidden
1. **Modal Nhập Kho Mua Hàng (`CreateReceiptModal.jsx`):**
   - Khi `issueType === 'PURCHASE'`, modal gọi `partnerService.getPartners({ size: 100 })` (`GET /api/v1/partners`).
   - Kiểm tra `PartnerController.java` (dòng 26):
     ```java
     @PreAuthorize("hasAuthority('PERM_FINANCE_SALES_ORDER') or hasAuthority('PERM_INVENTORY_RECEIPT') or hasAuthority('PERM_FARM_VIEW') or hasAnyRole(...)")
     ```
     `ROLE_WAREHOUSE_STAFF` sở hữu `PERM_INVENTORY_RECEIPT` và `PERM_FARM_VIEW` -> **HỢP LỆ (200 OK)**, tải danh sách nhà cung cấp trơn tru.
2. **Modal Xuất Kho Vật Tư (`CreateIssueModal.jsx` — `GAP-WH-03`):**
   - Khi mở modal (dòng 55-61):
     ```javascript
     farmingService.getCropSeasons(farmId, { size: 100 })
       .then((res) => setSeasons(res?.content || []))
       .catch(() => setSeasons([]));
     ```
   - Kiểm tra Backend `CropSeasonController.java` (dòng 29):
     ```java
     @GetMapping
     @PreAuthorize("(hasAuthority('PERM_CROP_VIEW') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER')) and @farmSecurity.canAccessFarm(#farmId)")
     ```
   - **PHÁT HIỆN LỖI 403 FORBIDDEN:** `ROLE_WAREHOUSE_STAFF` **hoàn toàn không có** `PERM_CROP_VIEW`. Endpoint ném `AccessDeniedException` 403. Dù frontend bọc `.catch(() => setSeasons([]))` tránh crash trắng màn hình, dropdown Mùa vụ liên kết bị rỗng 100%. Thủ kho không thể gắn phiếu xuất kho với vụ mùa canh tác.
3. **Modal Điều Chuyển Kho (`CreateTransferModal.jsx`):**
   - Modal gọi `masterDataService.getWarehouses(farmId)` (`WarehouseController.java`) và `inventoryService.getInventory` (`InventoryQueryController.java`). Cả hai Controller này đều chấp nhận `PERM_INVENTORY_VIEW`.
   - `ROLE_WAREHOUSE_STAFF` có `PERM_INVENTORY_VIEW` -> **HỢP LỆ (200 OK)**, hoạt động 100%.

---

### 2.2. Kiểm tra Ranh giới Maker - Checker (Separation of Duties) tại WS-C
Đã kiểm tra toàn bộ 4 Drawer chi tiết giao dịch kho:
1. **Phiếu Nhập Kho (`ReceiptDetailDrawer.jsx` dòng 176-187):**
   - Nút `[Phê Duyệt & Hoàn Tất Nhập Kho]` được bọc:
     ```jsx
     <Can permission="PERM_INVENTORY_RECEIPT" role="ROLE_FARM_MANAGER">
     ```
     -> Đã khóa chặt độc quyền cho Farm Manager, ẩn 100% đối với Thủ kho.
2. **Phiếu Xuất Kho (`IssueDetailDrawer.jsx` dòng 169-179):**
   - Nút `[Phê Duyệt Xuất Kho]` được bọc:
     ```jsx
     <Can permission="PERM_INVENTORY_ISSUE" role="ROLE_FARM_MANAGER">
     ```
     -> Đã khóa chặt độc quyền cho Farm Manager, ẩn 100% đối với Thủ kho.
3. **Phiếu Kiểm Kê Kho (`StocktakeDetailDrawer.jsx` dòng 344-367):**
   - Nút `[Nhập Số Lượng Đếm]` (Maker): `<Can permission="PERM_INVENTORY_STOCKTAKE" role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>` -> Thủ kho thực hiện kiểm đếm và lưu số liệu thực tế (`handleSaveCount`).
   - Nút `[Phê Duyệt & Chốt Kiểm Kê]` (Checker): `<Can permission="PERM_INVENTORY_STOCKTAKE" role="ROLE_FARM_MANAGER">` -> Chỉ Giám đốc trại mới được bấm chốt cân chỉnh sổ cái tồn kho. Ranh giới SoD tuyệt hảo!
4. **Lệnh Điều Chuyển Kho (`TransferDetailDrawer.jsx` dòng 148-176):**
   - Nút `[Duyệt Lệnh Xuất Điều Chuyển]` (Xuất hàng khỏi kho nguồn): `<Can permission="PERM_INVENTORY_TRANSFER" role="ROLE_FARM_MANAGER">` -> Độc quyền Farm Manager.
   - Nút `[Tiếp Nhận Hàng Điều Chuyển]` (Nhận hàng vào kho đích khi trạng thái là `IN_TRANSIT`):
     ```jsx
     <Can permission="PERM_INVENTORY_TRANSFER" role={['ROLE_FARM_MANAGER', 'ROLE_WAREHOUSE_STAFF']}>
     ```
     -> Backend `WarehouseTransferController.java` (dòng 55) yêu cầu `@PreAuthorize("hasAuthority('PERM_INVENTORY_TRANSFER') and @farmSecurity.canAccessFarm(#farmId)")`. Thủ kho kho nhận hoàn toàn đủ điều kiện bấm nút tiếp nhận hàng vào kho đích. Rất chính xác và thực tế!

---

# PHẦN 3: KIỂM TRA TIẾP NHẬN THU HOẠCH, ĐÓNG GÓI LÔ & IN TEM NHIỆT QR — WORKSPACE F (`F_QaTraceability`)

### 3.1. Tiếp nhận Thu hoạch & Đóng gói Lô Thành phẩm
1. **Quyền hạn Backend:**
   - `HarvestController.java` (dòng 33): `GET /harvest-records` cho phép `hasAnyAuthority('PERM_HARVEST_MANAGE', ...)`.
   - `ProductBatchController.java` (dòng 24): `POST /product-batches` cho phép `hasAuthority('PERM_HARVEST_MANAGE')`.
   - Backend `ProductBatchServiceImpl.java` (dòng 130-140) đã hỗ trợ nạp `sourceHarvestRecordIds` để tự động tạo bản ghi `product_batch_sources`.
2. **Điểm nghẽn Frontend (`GAP-WH-05`):**
   - Tại WS-F, giao diện dành cho Thủ kho chưa có tab hoặc bảng "Biên bản thu hoạch chờ đóng gói" (`harvest_records` có sản lượng chưa đóng gói).
   - Modal `+ Tạo Lô Thành Phẩm Đóng Gói` (`isCreateBatchOpen`) không cho phép chọn biên bản thu hoạch nguồn, buộc Thủ kho phải tự gõ tay lại mã, tên nông sản và số lượng, gây mất tính toàn vẹn dữ liệu truy xuất nguồn gốc.

---

### 3.2. In Tem Nhãn Nhiệt QR ESC/POS & Ranh giới KCS
1. **Kiểm tra chức năng In Tem Nhiệt QR:**
   - Tại `TraceabilityDetailDrawer.jsx` (dòng 530-542):
     ```jsx
     <Can anyPermissions={['PERM_LABEL_PRINT', 'PERM_QC_APPROVE']} role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>
       <Button onClick={handleOpenPrintModal} className="font-bold border-slate-300">
         🖨️ In Tem Nhãn Nhiệt QR
       </Button>
     </Can>
     ```
   - Khi lô thành phẩm ở trạng thái `READY_TO_PRINT` (đã được duyệt KCS), Thủ kho mở Drawer và bấm in tem:
     - Gọi `qaService.printLabel` (`POST /api/v1/farms/{farmId}/product-batches/{id}/print-label`).
     - Backend `ProductBatchServiceImpl.java` (dòng 380-401) kiểm tra trạng thái, ghi log vào bảng `label_print_logs`, và tự động chuyển trạng thái lô sang `PRINTED`.
     - Chức năng hoạt động trơn tru 100%.
2. **Kiểm tra ẩn các nút Checker / QA:**
   - Nút `[🔬 Lập Biên Bản KCS]`: Bọc `<Can permission="PERM_QC_INSPECT" role="ROLE_TECHNICAL_STAFF">` -> Ẩn 100% với Thủ kho.
   - Nút `[✔️ Phê Duyệt Lô]` & `[🚫 Từ Chối Lô]`: Bọc `<Can permission="PERM_QC_APPROVE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>` -> Ẩn 100% với Thủ kho.
   - Nút `[🚨 Thu Hồi Khẩn Cấp]`: Bọc `<Can permission="PERM_QC_RECALL" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>` -> Ẩn 100% với Thủ kho.

---

# PHẦN 4: KIỂM TRA NGHIỆP VỤ XUẤT XE GIAO HÀNG B2B (`sales_deliveries`) CỦA THỦ KHO

### 4.1. Khảo sát Thiết kế Backend (`SalesDeliveryController.java`)
Backend được xây dựng rất chuẩn chỉ theo quy trình giao vận nguyên tử (Atomic Delivery Flow):
- `POST /api/v1/farms/{farmId}/sales-deliveries`: Lập đợt giao hàng, giải phóng giữ chỗ (`reserved_quantity`), trừ tồn kho thực tế (`quantity_on_hand`), ghi sổ cái `product_batch_transactions` và sinh công nợ phải thu. Cho phép `PERM_DELIVERY_MANAGE`.
- `POST /api/v1/farms/{farmId}/sales-deliveries/{id}/dispatch`: Xác nhận xe xuất bến, chuyển trạng thái sang `DISPATCHED`. Cho phép `PERM_DELIVERY_MANAGE`.
- `POST /api/v1/farms/{farmId}/sales-deliveries/{id}/pod`: Đính kèm ảnh biên bản giao nhận có chữ ký khách hàng (Proof of Delivery), chuyển sang `DELIVERED`. Cho phép `PERM_DELIVERY_MANAGE`.

---

### 4.2. Hai Điểm Nghẽn Nghiêm Trọng Tại Frontend (`GAP-WH-06` & `GAP-WH-07`)
1. **Lỗi 403 Forbidden khi mở `CreateDeliveryModal.jsx` (`GAP-WH-06`):**
   - Trong `CreateDeliveryModal.jsx` (dòng 100-115), modal gọi `financeService.getSalesOrders` để tải danh sách các đơn bán sỉ đã được duyệt (`CONFIRMED`) cần giao hàng.
   - Kiểm tra `SalesOrderController.java` (dòng 28):
     ```java
     @PreAuthorize("(hasAnyAuthority('PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
     ```
   - **THỦ KHO BỊ CHẶN 403:** Thủ kho sở hữu `PERM_DELIVERY_MANAGE` nhưng Backend quên không cho phép quyền này trong `getOrders` và `getOrderById`. Kết quả là `CreateDeliveryModal` mở lên thì danh sách đơn hàng bị rỗng, Thủ kho không thể chọn đơn để xuất hàng!
2. **Giao diện Theo Dõi Giao Vận Bị Bỏ Trống (`GAP-WH-07`):**
   - Trong `H2_SalesCashflow/index.jsx` (dòng 292-294):
     ```jsx
     {!owner && !manager && activeTab === 'DELIVERIES' && (
       <SalesOrderMonitorTab farmId={activeFarmId} />
     )}
     ```
   - Khi bấm vào Tab `Giao Hàng (Split Shipments)`, giao diện chỉ render lại bảng Đơn bán sỉ.
   - Hoàn toàn **chưa có bảng danh sách các đợt giao hàng (`sales_deliveries`)**, không có nút bấm `[🚚 Điều Xe Xuất Bến]` và không có nút `[📸 Cập Nhật POD]`.
   - Toàn bộ nghiệp vụ theo dõi xe và chứng từ giao hàng POD của Thủ kho bị đóng băng trên giao diện.

---

# PHẦN 5: KIỂM TRA BÀN LÀM VIỆC HÀNG NGÀY & CHẤM CÔNG — WORKSPACE G (`G_EmployeeDailyOps`)

### 5.1. Các Khối Hiển Thị trên Bàn Làm Việc của Thủ Kho
Khi đăng nhập bằng `warehouse` (`ROLE_WAREHOUSE_STAFF`) vào `/app/my-dashboard`:
1. **`OneTapTimekeepingCard` (Khối 1):** Hiển thị đầy đủ. Thủ kho chấm công GPS + Chụp ảnh Selfie vào ca / ra ca hoạt động 100%.
2. **`PersonalShiftScheduleCard` (Khối 4):** Hiển thị đầy đủ. Xem lịch ca làm việc chuẩn, gửi đơn xin nghỉ phép năm và đăng ký làm thêm giờ (OT) hoạt động 100%.
3. **Tab Quản lý Công việc (Khối 3):** Hiển thị 2 tab:
   - Tab 1: `DailyRoutineTaskTab` (Công việc cố định hàng ngày).
   - Tab 2: `PersonalTaskKanban` (Tiến độ công việc hôm nay).
   - Thủ kho nhận các công việc được giao (`TODO`), chuyển sang `IN_PROGRESS` và báo cáo hoàn thành gửi Giám đốc trại duyệt (`PENDING_REVIEW`) hoạt động 100%.

---

### 5.2. Hai Lỗ Hổng Phân Quyền tại WS-G (`GAP-WH-08` & `GAP-WH-09`)
1. **Lỗ hổng Chặn Điểm Danh Tổ Kho (`GAP-WH-08`):**
   - `menuConfig.js` ghi rõ: `WS-G: Chấm Công & Điểm Danh Tổ Kho`.
   - `TeamRollCallPanel.jsx` (dòng 59-60) đã code sẵn bộ lọc nhân sự kho vận và lao động thời vụ không có tài khoản.
   - Nhưng tại `G_EmployeeDailyOps/index.jsx` (dòng 254):
     ```jsx
     <Can permission="PERM_HR_ATTENDANCE" role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']} farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD']}>
     ```
     `role` bị thiếu `'ROLE_WAREHOUSE_STAFF'` và `farmRole` bị thiếu `'WAREHOUSE_KEEPER'`.
   - Đồng thời tại Backend `FarmSecurityEvaluator.java` (dòng 150 & 156):
     ```java
     if (user.isSuperAdmin() || user.hasRole("ROLE_FARM_MANAGER") || user.hasRole("ROLE_TECHNICAL_STAFF")) { return true; }
     ... WHERE ... role_in_farm IN ('FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD') ...
     ```
     Backend cũng bỏ sót `ROLE_WAREHOUSE_STAFF` và `'WAREHOUSE_KEEPER'`, dẫn tới lỗi **HTTP 403 Forbidden** khi Thủ kho điểm danh hộ nhân viên bốc xếp kho!
2. **Lỗ hổng Giao việc Kho vận Phát sinh (`GAP-WH-09`):**
   - Khi Thủ kho bấm nút `+ Giao Việc Phát Sinh` trên bảng Kanban để giao việc đột xuất (như bốc xếp container mới về, dọn dẹp kho), Frontend gọi `POST /api/v1/farms/{farmId}/tasks`.
   - Backend `FarmTaskController.createTask` kiểm tra `@PreAuthorize("hasAuthority('PERM_TASK_ASSIGN')")`.
   - `ROLE_WAREHOUSE_STAFF` không có quyền này nên bị chặn **HTTP 403 Forbidden**.

---

# PHẦN 6: KIỂM TRA LUỒNG ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG GIỮA CÁC WORKSPACE & TÀI KHOẢN

### 6.1. Đồng bộ Phiếu Kho (WS-C) sang Giám Đốc Trại (`GAP-WH-10`)
- **Hiện trạng:** Khi Thủ kho tạo Phiếu nhập mua (`DRAFT`), Phiếu xuất (`DRAFT`), Lệnh điều chuyển (`PENDING`) hoặc mở đợt kiểm kê (`IN_PROGRESS`), `InventoryServiceImpl.java` hoàn toàn không tích hợp `NotificationService`.
- **Hệ quả:** Giám đốc trang trại (`farm_manager`) không nhận được thông báo chuông hoặc thông báo đẩy để biết có phiếu mới cần ký duyệt. Giám đốc trại chỉ thấy phiếu khi chủ động truy cập WS-C và lọc trạng thái.

---

### 6.2. Đồng bộ Lô Thành Phẩm Đóng Gói (WS-F) sang Kỹ Sư KCS (`GAP-WH-11`)
- **Hiện trạng:** Khi Thủ kho đóng gói một Lô thành phẩm mới (`product_batches`), lô xuất hiện trên Kanban cột `PENDING_APPROVAL` của WS-F.
- **Hệ quả:** Tuy nhiên, `ProductBatchServiceImpl.java` không gửi thông báo nào đến Kỹ sư KCS (`ROLE_TECHNICAL_STAFF`). Kỹ sư KCS không biết có lô nông sản vừa về kho để ra lấy mẫu kiểm định dư lượng và vi sinh.

---

### 6.3. Đồng bộ In Tem Nhãn Nhiệt QR (WS-F) sang Bán Hàng & VietQR (WS-H2)
- **Kiểm tra luồng dữ liệu:**
  1. Khi Thủ kho bấm `[🖨️ In Tem Nhãn Nhiệt QR]` tại WS-F:
     - Backend `ProductBatchServiceImpl.java` (dòng 396-401) tự động chuyển trạng thái của Lô từ `READY_TO_PRINT` -> `PRINTED`.
     - Frontend kích hoạt `notifyDataChanged?.('batches')`.
  2. Tại WS-H2, khi Kế toán hoặc Giám đốc trại mở Modal Tạo Đơn Bán Sỉ (`CreateSalesOrderModal.jsx` dòng 109-112):
     ```javascript
     const available = list.filter((b) => {
       const rem = Number(b.remainingQuantity || 0) - Number(b.reservedQuantity || 0);
       return rem > 0 && (b.status === 'SELLING' || b.status === 'PRINTED' || b.status === 'READY_TO_PRINT');
     });
     ```
  3. Lô hàng vừa được in tem nhãn (`PRINTED`) lập tức xuất hiện trong danh sách Lô có thể chọn để bán sỉ.
- **Kết luận:** Luồng đồng bộ từ in tem sang bán sỉ hoạt động **chính xác 100%**.

---

# KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC (ACTIONABLE REMEDIATION ROADMAP)

Để đưa tài khoản `ROLE_WAREHOUSE_STAFF` (`warehouse`) đạt chuẩn 100% sẵn sàng vận hành thực tế, chúng ta chia thành 3 Task thực thi tuần tự:

### TASK 1: Khắc phục Hạ tầng Điều hướng, Route Guards & Danh mục Kho/Vật tư tại `/app/settings`
- Sửa `menuConfig.js` và `routes.jsx`: Mở quyền truy cập WS-H2 cho `PERM_DELIVERY_MANAGE`.
- Thêm Standalone Module Cài đặt (`settings`) vào menu của `WAREHOUSE_KEEPER`.
- Cập nhật Route Guard `/app/settings` cho phép `PERM_INVENTORY_RECEIPT`.
- Cập nhật `pages/settings/index.jsx` lọc đúng 2 tab `materials` và `warehouses` khi `isWarehouseKeeper()` là `true`.

### TASK 2: Khắc phục Điểm nghẽn Giao dịch Kho (WS-C) & Chấm công Tổ kho (WS-G)
- Sửa `CropSeasonController.java`: Mở quyền `getSeasons` cho `PERM_INVENTORY_ISSUE` để xóa lỗi 403 khi lập phiếu xuất vật tư.
- Bổ sung chọn Đàn vật nuôi (`livestockGroupId`) trong `CreateIssueModal.jsx`.
- Sửa `FarmSecurityEvaluator.java` và `G_EmployeeDailyOps/index.jsx`: Cấp quyền `canPerformBatchRollCall` cho `ROLE_WAREHOUSE_STAFF` và `'WAREHOUSE_KEEPER'` để Thủ kho điểm danh tổ kho mượt mà.
- Phân quyền hợp lý cho thao tác giao việc kho vận phát sinh.

### TASK 3: Hoàn thiện Khép kín Tiếp nhận Đóng gói Lô (WS-F) & Giao vận Xuất xe B2B (WS-H2)
- Tại WS-F: Bổ sung cơ chế tiếp nhận biên bản thu hoạch (`harvest_records`) chưa đóng gói vào Modal tạo lô thành phẩm; liên kết `sourceHarvestRecordIds`.
- Sửa `SalesOrderController.java`: Mở quyền `getOrders` cho `PERM_DELIVERY_MANAGE` để `CreateDeliveryModal` tải được đơn hàng đã duyệt.
- Xây dựng component `SalesDeliveryMonitorTab.jsx` tại WS-H2 để Thủ kho theo dõi danh sách chuyến xe giao hàng, bấm `[🚚 Xuất Bến]` và `[📸 Upload POD]`.
- Tích hợp `NotificationService` vào `InventoryServiceImpl`, `ProductBatchServiceImpl`, và `SalesDeliveryServiceImpl`.
