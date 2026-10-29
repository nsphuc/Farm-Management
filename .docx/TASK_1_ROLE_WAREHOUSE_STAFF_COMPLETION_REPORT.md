# BÁO CÁO THỰC THI & HOÀN TẤT TASK 1 / 3 - ROLE_WAREHOUSE_STAFF
**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Đối tượng kiểm toán & thực thi:** Tài khoản Cấp 4 — `ROLE_WAREHOUSE_STAFF` (Thủ kho Vật tư, Đóng gói Lô & Giao vận — user mẫu `warehouse` / Operational Role: `WAREHOUSE_KEEPER`)  
**Chức năng nâng cấp:** Mở khóa Menu & Route Guards (`WS-H2` & `/app/settings`), Thiết lập Chế độ Giao vận Kho Chuẩn SoD tại `WS-H2`, và Phân quyền Quản trị Danh mục Kho bãi / Vật tư tại `/app/settings`  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Ngày thực hiện:** 26/10/2026  
**Mã lỗ hổng giải quyết:** `GAP-WH-01` & `GAP-WH-02` (Căn cứ Báo cáo Kiểm toán `GAP_ANALYSIS_ROLE_WAREHOUSE_STAFF.md`)

---

## I. TỔNG QUAN KẾT QUẢ THỰC THI

| Mã Lỗ Hổng | Tên Lỗ Hổng / Vấn Đề | Trạng Thái Trước | Trạng Thái Sau | Cơ Chế Giải Quyết |
| :--- | :--- | :--- | :--- | :--- |
| **`GAP-WH-01`** | `WS-H2` bị khóa cứng quyền `PERM_FINANCE_SALES_ORDER`, ẩn khỏi Sidebar và chặn 403; thiếu chế độ giao vận riêng cho Thủ kho | ❌ Thủ kho có quyền `PERM_DELIVERY_MANAGE` nhưng bị `menuConfig.js` và `routes.jsx` chặn 403 do đòi hỏi `PERM_FINANCE_SALES_ORDER`. Giao diện WS-H2 hiển thị tab Công nợ / Quyết toán tài chính nhạy cảm vi phạm nguyên tắc Tách biệt Nhiệm vụ (SoD). |  **HOÀN TẤT (RESOLVED)** | **1.** Mở rộng `anyPermissions` trong `menuConfig.js` và `routes.jsx` cho phép `PERM_DELIVERY_MANAGE`.<br>**2.** Phân tách chế độ giao vận SoD trong `WS-H2`: Tab mặc định `'DELIVERIES'`, ẩn hoàn toàn tab nợ / thanh toán / quyết toán (`DEBT`, `PAYMENTS`, `SETTLEMENT`), chỉ hiển thị tab `'DELIVERIES'` và `'ORDERS'` (chế độ xem đơn hàng đã duyệt).<br>**3.** Đổi Header ngữ cảnh *"WS-H2: Điều Phối Xuất Kho Giao Hàng B2B & Chứng Từ POD"*, bổ sung Badge *"🚛 Bộ Phận Giao Vận Kho"*, chỉ hiển thị nút hành động `[+ Lập Phiếu Giao Hàng]`. |
| **`GAP-WH-02`** | Module Cài đặt `/app/settings` chặn Thủ kho truy cập; chưa mở 2 danh mục Kho bãi & Vật tư mà Thủ kho có thẩm quyền quản trị | ❌ Route `/app/settings` yêu cầu `PERM_TENANT_MANAGE`, `PERM_FARM_UPDATE`, `PERM_CROP_PLAN` hoặc `PERM_LIVESTOCK_MANAGE`. Thủ kho (có `PERM_INVENTORY_RECEIPT`) bị chặn 403 và không có menu trên Sidebar. |  **HOÀN TẤT (RESOLVED)** | **1.** Bổ sung `PERM_INVENTORY_RECEIPT` vào `anyPermissions` của route `/app/settings` và menu `settings`.<br>**2.** Bổ sung mục độc lập *"Danh Mục Kho Bãi & Vật Tư"* (`badge: 'Kho & Vật tư'`) vào `independentModules` cho `WAREHOUSE_KEEPER` trong `menuConfig.js`.<br>**3.** Tại `pages/settings/index.jsx`: Lọc `visibleTabs` chỉ mở đúng 2 tab: Nhóm & Mặt hàng vật tư (`materials`) và Hệ thống kho bãi (`warehouses`), mặc định vào tab `materials`, đổi header banner sang ngữ cảnh Kho bãi chuyên biệt. |

---

## II. CHI TIẾT CÁC FILE ĐÃ NÂNG CẤP VÀ DÒNG CODE CỤ THỂ

### 1. Phân quyền Điều hướng & Route Guard (`GAP-WH-01` & `GAP-WH-02`)

#### a. `frontend/src/shells/TenantAppShell/menuConfig.js`
- **File:** [frontend/src/shells/TenantAppShell/menuConfig.js](file:///d:/Projects/Farm_Management/frontend/src/shells/TenantAppShell/menuConfig.js)
- **Thay đổi cụ thể:**
  1. **Dòng 93-98 (`ALL_WORKSPACES.H2_SalesCashflow`):**
     Thay thế `permission: 'PERM_FINANCE_SALES_ORDER'` bằng `anyPermissions`:
     ```javascript
     H2_SalesCashflow: {
       id: 'H2_SalesCashflow',
       label: 'WS-H2: Bán Sỉ & Thu Tiền B2B',
       path: '/app/sales-cashflow',
       icon: ShoppingCart,
       anyPermissions: ['PERM_FINANCE_SALES_ORDER', 'PERM_DELIVERY_MANAGE', 'PERM_FINANCE_PAYMENT'],
       category: 'VẬN HÀNH BÁN HÀNG & DÒNG TIỀN',
     },
     ```
     *Ý nghĩa:* Cho phép cả Kế toán (`PERM_FINANCE_SALES_ORDER`, `PERM_FINANCE_PAYMENT`) và Thủ kho / Giao vận (`PERM_DELIVERY_MANAGE`) truy cập WS-H2 từ Sidebar.
  2. **Dòng 145-151 (`ALL_INDEPENDENT_MODULES.settings`):**
     Bổ sung `PERM_INVENTORY_RECEIPT` vào danh sách quyền hợp lệ:
     ```javascript
     settings: {
       id: 'settings',
       label: 'Cài Đặt Danh Mục Tĩnh',
       path: '/app/settings',
       icon: Settings,
       anyPermissions: [
         'PERM_TENANT_MANAGE', 
         'PERM_FARM_UPDATE', 
         'PERM_CROP_PLAN', 
         'PERM_LIVESTOCK_MANAGE', 
         'PERM_INVENTORY_RECEIPT'
       ],
     },
     ```
  3. **Dòng 296-308 (`case 'WAREHOUSE_KEEPER':`):**
     Bổ sung menu danh mục độc lập dành riêng cho Thủ kho:
     ```javascript
     case 'WAREHOUSE_KEEPER':
       return {
         homePath: '/app/inventory',
         roleLabel: 'Thủ Kho & Quản Lý Vật Tư',
         workspaces: [
           ALL_WORKSPACES.C_InventoryHub,
           {
             ...ALL_WORKSPACES.H2_SalesCashflow,
             label: 'WS-H2: Xuất Giao Hàng Lên Xe',
             badge: 'Giao Vận',
           },
           ALL_WORKSPACES.G_EmployeeDailyOps,
         ],
         independentModules: [
           {
             ...ALL_INDEPENDENT_MODULES.settings,
             label: 'Danh Mục Kho Bãi & Vật Tư',
             badge: 'Kho & Vật tư',
           },
         ],
       };
     ```

#### b. `frontend/src/app/routes.jsx`
- **File:** [frontend/src/app/routes.jsx](file:///d:/Projects/Farm_Management/frontend/src/app/routes.jsx)
- **Thay đổi cụ thể:**
  1. **Dòng 242-247 (Route `path="sales-cashflow"`):**
     Nâng cấp `<PermissionGuard>` từ kiểm tra đơn lẻ sang đa quyền:
     ```jsx
     <Route
       path="sales-cashflow"
       element={
         <PermissionGuard anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_DELIVERY_MANAGE', 'PERM_FINANCE_PAYMENT']}>
           <SalesCashflowWorkspace />
         </PermissionGuard>
       }
     />
     ```
  2. **Dòng 250-256 (Route `path="settings"`):**
     Thêm `PERM_INVENTORY_RECEIPT` vào `<PermissionGuard>`:
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

---

### 2. Thiết lập Chế độ Giao vận Kho Chuẩn SoD tại `WS-H2` (`H2_SalesCashflow/index.jsx`)

- **File:** [frontend/src/workspaces/H2_SalesCashflow/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/H2_SalesCashflow/index.jsx)
- **Thay đổi cụ thể:**
  1. **Dòng 35-45:** Nhận diện người dùng là Thủ kho / Giao vận:
     ```javascript
     const { isOwner, isFarmManager, isWarehouseKeeper, hasPermission } = useAuthStore();
     const owner = isOwner();
     const manager = isFarmManager(activeFarmId);
     const warehouseKeeper = isWarehouseKeeper() || (!hasPermission('PERM_FINANCE_SALES_ORDER') && hasPermission('PERM_DELIVERY_MANAGE'));
     ```
  2. **Dòng 46-55:** Thiết lập tab mặc định là `'DELIVERIES'` cho Thủ kho và cơ chế SoD Guard tự động chuyển hướng nếu người dùng cố tình truy cập tab tài chính bị ẩn:
     ```javascript
     const [activeTab, setActiveTab] = useState(warehouseKeeper ? 'DELIVERIES' : 'ORDERS');

     // SoD Guard: Thủ kho tuyệt đối không được xem tab nợ / thanh toán / quyết toán
     useEffect(() => {
       if (warehouseKeeper && (activeTab === 'DEBT' || activeTab === 'PAYMENTS' || activeTab === 'SETTLEMENT')) {
         setActiveTab('DELIVERIES');
       }
     }, [warehouseKeeper, activeTab]);
     ```
  3. **Dòng 75-100:** Header thích ứng theo ngữ cảnh vận hành của Thủ kho:
     - **Tiêu đề:** *"WS-H2: Điều Phối Xuất Kho Giao Hàng B2B & Chứng Từ POD"* (thay vì Bán sỉ & Dòng tiền thu).
     - **Badge:** Badge *"🚛 Bộ Phận Giao Vận Kho"* nổi bật (màu xanh dương `border-blue-300 bg-blue-100 text-blue-800`).
     - **Subtitle:** *"Quản lý điều phối giao vận, bốc dỡ hàng lên xe, lập phiếu giao hàng và số hóa biên bản bàn giao (POD)"*.
  4. **Dòng 115-180:** Phân tách nút bấm nghiệp vụ trên Header:
     - **Đối với Thủ kho:** Hiển thị duy nhất nút nổi bật `[+ Lập Phiếu Giao Hàng]` (variant `primary`, màu xanh dương `bg-blue-600 hover:bg-blue-700 font-bold`).
     - **Ẩn hoàn toàn** các nút tạo đơn bán sỉ (`+ Tạo Đơn Bán Sỉ`), lập phiếu thu chi (`+ Lập Phiếu Thu/Chi`) và cấn trừ công nợ (`+ Phân Bổ / Cấn Trừ Nợ`) của Kế toán.
  5. **Dòng 186-200:** Bổ sung Banner hướng dẫn nghiệp vụ dành riêng cho Thủ kho:
     - Hướng dẫn quy trình đối chiếu đơn hàng đã duyệt (`CONFIRMED`), xuất hàng theo đợt từ lô thành phẩm dán tem QR, cập nhật số xe/tài xế/đơn vị vận chuyển và lưu chứng từ POD.
  6. **Dòng 285-320:** Phân tách danh sách Tabs theo chuẩn SoD:
     - Khi `warehouseKeeper = true`: Chỉ hiển thị 2 Tabs:
       - **Tab 1:** `Xuất Giao Hàng Lên Xe & POD` (`id: 'DELIVERIES'`, Badge: *"Nhiệm vụ chính"*).
       - **Tab 2:** `Đơn Hàng Đã Duyệt Chờ Giao (Read-Only)` (`id: 'ORDERS'`).
     - **Ẩn hoàn toàn:** Tab `Công Nợ & Đối Soát B2B` (`'DEBT'`), Tab `Phiếu Thu & Thanh Toán VietQR` (`'PAYMENTS'`) và Tab `Quyết Toán Chu Kỳ` (`'SETTLEMENT'`).
  7. **Dòng 370-405:** Tích hợp đầy đủ các modal chức năng:
     - `<CreateDeliveryModal>` liên kết với nút `[+ Lập Phiếu Giao Hàng]`.
     - `<CreateSalesOrderModal>`, `<CreatePaymentModal>`, `<AllocateOrOffsetDebtModal>` sẵn sàng phục vụ khi tài khoản có thẩm quyền kế toán / quản lý.

---

### 3. Phân quyền & Tinh gọn Danh mục Kho bãi / Vật tư tại `/app/settings` (`GAP-WH-02`)

- **File:** [frontend/src/pages/settings/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/pages/settings/index.jsx)
- **Thay đổi cụ thể:**
  1. **Dòng 88-91:** Nhận diện vai trò Thủ kho trong cài đặt danh mục:
     ```javascript
     const { isTechnicalLead, isWarehouseKeeper, hasPermission } = useAuthStore();

     const isTechStaff = isTechnicalLead() || (!hasPermission('PERM_FARM_UPDATE') && (hasPermission('PERM_CROP_PLAN') || hasPermission('PERM_LIVESTOCK_MANAGE')));
     const isWarehouseStaff = isWarehouseKeeper() || (!hasPermission('PERM_FARM_UPDATE') && hasPermission('PERM_INVENTORY_RECEIPT'));
     ```
  2. **Dòng 93-108:** Lọc `visibleTabs` chặt chẽ theo thẩm quyền chuyên môn:
     ```javascript
     const visibleTabs = React.useMemo(() => {
       return SETTINGS_TABS.filter((tab) => {
         // Thủ kho chỉ quản lý 2 danh mục: Nhóm & Mặt hàng vật tư ('materials'), Hệ thống kho bãi ('warehouses')
         if (isWarehouseStaff && !['materials', 'warehouses'].includes(tab.id)) {
           return false;
         }
         // Kỹ sư kỹ thuật chỉ quản lý 3 danh mục kỹ thuật: Giống cây, Giống vật nuôi, Định mức BOM
         if (isTechStaff && !['crop-types', 'livestock-breeds', 'quotas'].includes(tab.id)) {
           return false;
         }
         if (tab.id === 'livestock-breeds' && !supportsLivestock) return false;
         if (tab.id === 'crop-types' && !supportsCrop) return false;
         return true;
       });
     }, [isWarehouseStaff, isTechStaff, supportsCrop, supportsLivestock]);
     ```
  3. **Dòng 109-114:** Khởi tạo tab mặc định thông minh:
     ```javascript
     const defaultTab = React.useMemo(() => {
       if (visibleTabs.length > 0) return visibleTabs[0].id;
       return isWarehouseStaff ? 'materials' : 'enterprise';
     }, [visibleTabs, isWarehouseStaff]);
     ```
  4. **Dòng 130-165:** Header Banner tùy biến theo nghiệp vụ Kho:
     - **Icon:** `<Warehouse className="h-6 w-6" />` khi là Thủ kho (hoặc `<Settings />` cho các vai trò khác).
     - **Tiêu đề:** *"Danh Mục Kho Bãi & Vật Tư"* khi là Thủ kho (hoặc *"Danh Mục Giống & Định Mức BOM"* cho Kỹ thuật, *"Trung Tâm Cài Đặt Danh Mục Tĩnh"* cho Owner/Manager).
     - **Badge:** `📦 Chuyên môn Kho bãi & Vật tư` (màu xanh dương `border-blue-300 bg-blue-100 text-blue-800`).
     - **Subtitle:** *"Cấu hình chuẩn hóa danh mục vật tư, bao bì đóng gói và hệ thống kho bãi bảo quản cho trang trại"*.
  5. **Dòng 169-175:** Tiêu đề nhóm thanh điều hướng Sidebar:
     ```javascript
     <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
       {isWarehouseStaff
         ? 'Danh Mục Kho & Vật Tư'
         : isTechStaff
         ? 'Danh Mục Kỹ Thuật'
         : 'Phân khu Danh Mục Chuẩn'}
     </div>
     ```

---

## III. KIỂM THỬ XÁC NHẬN & BUILD HỆ THỐNG

1. **Kiểm tra biên dịch & bundle Frontend:**
   - Đã chạy lệnh `npm run build` tại `frontend/`.
   - **Kết quả:**
     ```
     ✓ 1781 modules transformed.
     dist/index.html                     1.01 kB │ gzip:   0.60 kB
     dist/assets/index-D1oTzuCK.css     75.39 kB │ gzip:  12.19 kB
     dist/assets/index-Dwgfv02Z.js   1,449.91 kB │ gzip: 361.98 kB
     ✓ built in 3.94s
     Exit code: 0
     ```
   - Không xuất hiện bất kỳ lỗi cú pháp (syntax error) hay cảnh báo vi phạm module/import nào.

2. **Xác nhận ma trận phân quyền (RBAC Matrix) & Nguyên tắc Tách biệt Nhiệm vụ (SoD):**
   - **Tài khoản `warehouse` (`ROLE_WAREHOUSE_STAFF`):**
     - Đăng nhập -> Sidebar xuất hiện 3 workspace: `WS-C: Quản Trị Kho & Nhập/Xuất Vật Tư`, `WS-H2: Xuất Giao Hàng Lên Xe` (Badge Giao Vận) và `WS-G: Tác Nghiệp Hằng Ngày`.
     - Independent Module: Xuất hiện `Danh Mục Kho Bãi & Vật Tư` (Badge `Kho & Vật tư`).
     - Vào `WS-H2`: Mặc định mở tab `Xuất Giao Hàng Lên Xe & POD`. Chỉ có thêm tab `Đơn Hàng Đã Duyệt Chờ Giao (Read-Only)`. Hoàn toàn không xem được dữ liệu nợ, tiền hay quyết toán. Nút hành động duy nhất là `[+ Lập Phiếu Giao Hàng]`.
     - Vào `/app/settings`: Mở trực tiếp tab `5. Nhóm & Mặt Hàng Vật Tư` và `6. Hệ Thống Kho Bãi`. Không bị chặn 403, có thể thêm/sửa vật tư và kho bãi của trang trại mình quản lý.

---

## IV. TỔNG KẾT & BÀN GIAO SANG TASK 2 / 3

- **Hạng mục hoàn tất:** 100% yêu cầu của **TASK 1 / 3** giải quyết triệt để 2 lỗ hổng `GAP-WH-01` và `GAP-WH-02`.
- **Sẵn sàng tiếp nhận:**
  - **TASK 2 / 3:** Mở rộng luồng In Tem Mã Vạch QR Truy Xuất Nguồn Gốc Lô Thành Phẩm tại `WS-F` (`GAP-WH-03`), Quản lý Lô Đóng Gói Thành Phẩm (`GAP-WH-04`), và Đơn Đặt Hàng Chờ Giao B2B (`GAP-WH-05`).
  - **TASK 3 / 3:** Quy trình Điều Phối Xuất Kho Giao Hàng B2B, Giao Hàng Đa Đợt & Chữ Ký Số Hóa POD tại `WS-H2` (`GAP-WH-06` -> `GAP-WH-12`).
