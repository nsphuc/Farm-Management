# BÁO CÁO KIỂM TOÁN HỆ THỐNG & GAP ANALYSIS TOÀN DIỆN
## ĐÁNH GIÁ CHỨC NĂNG TÀI KHOẢN `ROLE_TECHNICAL_STAFF` (CẤP 4 - KỸ SƯ KỸ THUẬT NÔNG NGHIỆP / THÚ Y & KIỂM ĐỊNH VIÊN KCS)
**Dự án:** Farm Management SaaS Multi-Tenant  
**Vai trò thẩm định:** Principal Software Architect  
**Tài khoản mẫu kiểm thử:** `tech` (`ROLE_TECHNICAL_STAFF`)  
**Mục tiêu:** Rà soát 100% chức năng Frontend (`frontend/src/`) & Backend (`backend/src/main/java/com/farm/saas/`) liên quan đến `ROLE_TECHNICAL_STAFF`, phát hiện toàn bộ lỗ hổng phân quyền (RBAC), điểm nghẽn UX/UI, lỗi HTTP 403/400, thiếu sót SoD (Maker-Checker), và sai lệch luồng đồng bộ dữ liệu tự động giữa các Workspace.

---

## TỔNG QUAN VỊ TRÍ & QUYỀN HẠN CỦA `ROLE_TECHNICAL_STAFF` (THEO RBAC MATRIX V1_4)
Theo thiết kế kiến trúc chuẩn phân quyền 4 cấp (`V1_4__standardize_4_tier_rbac_matrix.sql`, dòng 132-147), `ROLE_TECHNICAL_STAFF` là vai trò **Cấp 4 (Tầng Thực thi - Maker Kỹ thuật)** với đúng **11 quyền hạn nghiệp vụ cốt lõi**:
1. `PERM_FARM_VIEW` (#3): Xem thông tin nông trại, phân khu, sơ đồ mặt bằng và chu kỳ.
2. `PERM_CROP_VIEW` (#6): Theo dõi tiến độ và lịch sử các mùa vụ canh tác.
3. `PERM_CROP_PLAN` (#7): Lên lịch/phác đồ trồng trọt, định nghĩa giống cây trồng và định mức tiêu hao BOM.
4. `PERM_LIVESTOCK_VIEW` (#9): Theo dõi đàn nuôi, cá thể đeo thẻ tai RFID và cân nặng ADG.
5. `PERM_LIVESTOCK_MANAGE` (#10): Lập kế hoạch lứa nuôi, đăng ký cá thể RFID, định nghĩa giống vật nuôi.
6. `PERM_LIVESTOCK_VET` (#11): **Độc quyền nghiệp vụ thú y**: Khám bệnh, điều trị, kê đơn vắc-xin/kháng sinh và kích hoạt Auto-Backflushing trừ kho thuốc.
7. `PERM_INVENTORY_VIEW` (#12): Tra cứu tồn kho vật tư, số lô, hạn dùng thuốc/thức ăn để lập kế hoạch & kê đơn.
8. `PERM_HARVEST_MANAGE` (#17): Xem đánh giá năng suất giống cây/con (Không thu hoạch thực địa).
9. `PERM_QC_INSPECT` (#18): **Maker độc quyền**: Lấy mẫu kiểm nghiệm, lập biên bản KCS (Tuyệt đối cấm tự phê duyệt `#19`).
10. `PERM_HR_ATTENDANCE` (#24): Tự chấm công GPS cá nhân và điểm danh tổ hộ công nhân hiện trường.
11. `PERM_TASK_ASSIGN` (#25): Giao việc kỹ thuật hiện trường và nghiệm thu kết quả công việc (`DONE` / trả về `IN_PROGRESS`).

### Các ranh giới cấm tuyệt đối theo nguyên tắc Tách biệt nhiệm vụ (Separation of Duties - SoD & Maker-Checker):
- **CẤM DUYỆT KCS (`PERM_QC_APPROVE`)**: Chỉ có Farm Manager (Cấp 3) hoặc Farm Owner (Cấp 2) mới được duyệt lô và cấp mã QR xuất xưởng.
- **CẤM PHÁT LỆNH THU HỒI (`PERM_QC_RECALL`)**: Chỉ Giám đốc trại hoặc Chủ đầu tư mới được thu hồi sản phẩm.
- **CẤM THAO TÁC KHO (`PERM_INVENTORY_RECEIPT`, `PERM_INVENTORY_ISSUE`, `PERM_INVENTORY_TRANSFER`, `PERM_INVENTORY_STOCKTAKE`)**: Việc nhập/xuất/chuyển/kiểm kê thủ công thuộc độc quyền của Thủ kho (`ROLE_WAREHOUSE_STAFF`).
- **CẤM ĐÓNG / HỦY VỤ MÙA / XÓA ĐÀN NUÔI**: Phải do Giám đốc trang trại (`ROLE_FARM_MANAGER`) chốt sổ.
- **CẤM GHI NHẬT KÝ CANH TÁC ĐỒNG RUỘNG (`PERM_CROP_LOG`)**: Thuộc về Công nhân hiện trường (`ROLE_FIELD_STAFF`).

---

# BẢNG TỔNG HỢP TOÀN BỘ LỖ HỔNG & ĐIỂM NGHẼN (EXECUTIVE GAP MATRIX)

| Mã Lỗ Hổng | Phân Vùng | Vị Trí File & Dòng Code | Hiện Trạng Thực Tế | Rủi Ro & Hành Vi Lỗi | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-TECH-01** | **Điều hướng Menu** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 248-275)* | Menu `TECHNICAL_LEAD` hoàn toàn thiếu `WS-C: Kho Bãi & Mã Vạch` (`C_InventoryHub`) và `ALL_INDEPENDENT_MODULES.settings`. | Kỹ sư kỹ thuật có quyền `PERM_INVENTORY_VIEW`, `PERM_CROP_PLAN`, `PERM_LIVESTOCK_MANAGE` nhưng Sidebar không có link vào Kho để tra cứu thuốc/vật tư, cũng không có link vào Cài đặt để quản lý Giống và Định mức BOM. | **CRITICAL** |
| **GAP-TECH-02** | **Danh mục Kỹ thuật** | `frontend/src/pages/settings/index.jsx`<br>*(Dòng 87-95)* | Truy cập `/app/settings` mặc định nhảy vào Tab `enterprise` (Hồ sơ pháp nhân). Danh sách tab không được lọc theo quyền. | Kỹ sư kỹ thuật bị đẩy vào màn hình xem thông tin công ty mẹ/thuế/ngân hàng. Thấy cả 9 tab (Kho bãi, Ca làm việc, Chi phí...) dù không có quyền. | **HIGH** |
| **GAP-TECH-03** | **Danh mục Cây/Con/BOM** | `frontend/src/pages/settings/tabs/`<br>`CropTypesTab.jsx` *(Dòng 177, 212)*<br>`LivestockBreedsTab.jsx` *(Dòng 170, 215)*<br>`ConsumptionQuotasTab.jsx` *(Dòng 349, 398)* | Các nút Thêm/Sửa/Xóa bị bọc cứng `<Can permission="PERM_FARM_UPDATE">`. Backend các Controller này lại yêu cầu `PERM_CROP_PLAN` và `PERM_LIVESTOCK_MANAGE`. | Kỹ sư kỹ thuật sở hữu `PERM_CROP_PLAN` và `PERM_LIVESTOCK_MANAGE` nhưng bị ẩn 100% các nút Thêm/Sửa/Xóa Giống cây trồng, Giống vật nuôi và Định mức BOM trên giao diện! | **CRITICAL** |
| **GAP-TECH-04** | **Tra cứu Kho WS-C** | `frontend/src/workspaces/C_InventoryHub/index.jsx`<br>*(Dòng 52, 67)* | Logic `isReadOnly = Boolean(owner && !farmManager)` trả về `false` cho Kỹ sư kỹ thuật. Do đó `activeTab` mặc định là `'RECEIPTS'` (Phiếu nhập kho). | Kỹ sư kỹ thuật vào WS-C bị hiển thị tab Phiếu nhập kho (không có nút tạo vì thiếu quyền) thay vì tab `'STOCK'` (Tồn kho tức thời) vốn là mục tiêu nghiệp vụ chính của họ. | **MEDIUM** |
| **GAP-TECH-05** | **Nhân sự Hiện trường** | `backend/src/main/java/com/farm/saas/modules/hr/controller/EmployeeController.java`<br>*(Dòng 41-42)* | Endpoint `GET /api/v1/hr/employees` kiểm tra `@PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole(...)")`. | **LỖI HTTP 403 FORBIDDEN FATAL:** `ROLE_TECHNICAL_STAFF` có `PERM_TASK_ASSIGN` và `PERM_HR_ATTENDANCE` nhưng KHÔNG có `PERM_HR_EMPLOYEE_MANAGE`. Dẫn tới vào WS-G, mở Modal Giao việc (`CreateTaskModal`), hoặc Điểm danh tổ (`TeamRollCallPanel`) đều bị chặn 403, danh sách công nhân bị rỗng 100%! | **CRITICAL** |
| **GAP-TECH-06** | **Thú y Auto-Backflush** | `frontend/src/workspaces/E_FarmingOps/components/FarmingLogsTimelineTab.jsx`<br>*(Dòng 41-49, 113-122, 360-445)* | Modal Sự kiện thú y chỉ có các ô nhập chuỗi `detailsJson` và số `withdrawalDays`. Hoàn toàn không có form chọn vật tư thuốc/vắc-xin (`supplies`), kho xuất, số lô, số lượng, `totalCost`. | Backend `LivestockServiceImpl.java` (dòng 525-660) đã code đầy đủ 100% cơ chế trừ kho FEFO, tạo phiếu xuất kho và tạo chi phí `farm_expenses`. Nhưng vì Frontend gửi mảng `supplies: null/empty`, cơ chế Auto-Backflushing bị vô hiệu hóa hoàn toàn trong thực tế! | **CRITICAL** |
| **GAP-TECH-07** | **Lập Biên bản KCS** | `frontend/src/workspaces/F_QaTraceability/index.jsx`<br>*(Dòng 155-162, 834-850)*<br>`TraceabilityDetailDrawer.jsx` *(Dòng 183-190)* | Frontend gửi `actualValue` và `passed` trong mảng `items`. Backend `QcInspectionRequest.java` (dòng 60-65) yêu cầu `@NotBlank measuredValue` và `@NotNull isPassed`. | **LỖI HTTP 400 BAD REQUEST FATAL:** Khi KCS bấm Lưu biên bản kiểm định, Backend ném lỗi validation vì sai tên trường. Biên bản không thể tạo được! Đồng thời form chỉ nhập được đúng 1 tiêu chuẩn cứng, thiếu upload ảnh minh chứng `photosJson`. | **CRITICAL** |
| **GAP-TECH-08** | **Trạng thái Lô sau KCS** | `backend/src/main/java/com/farm/saas/modules/quality/service/impl/QcInspectionServiceImpl.java`<br>*(Dòng 41-91)* | Sau khi lưu `QcInspection`, service không cập nhật trạng thái của `ProductBatch` sang `INSPECTING` hoặc cập nhật cờ chờ duyệt. | Lô thành phẩm trên bảng Kanban không đổi trạng thái trực quan để Giám đốc trại biết đã có biên bản KCS mẫu đạt chuẩn để bấm duyệt xuất xưởng. | **HIGH** |
| **GAP-TECH-09** | **Đồng bộ Ô/Chuồng WS-A** | `backend/src/main/java/com/farm/saas/modules/crop/service/impl/CropSeasonServiceImpl.java`<br>`LivestockServiceImpl.java` | `CropSeason` và `LivestockGroup` chỉ liên kết `zoneId`, không có trường `locationId` và không tự động cập nhật `zone_locations.status = 'OCCUPIED'`. | Tạo mùa vụ hoặc đàn nuôi mới ở WS-E không làm đổi trạng thái lấp đầy của các ô/chuồng con ở WS-A. Bản đồ địa lý luôn hiển thị `EMPTY` nếu không sửa tay. | **MEDIUM** |

---

# PHẦN 1: KIỂM TRA MENU ĐIỀU HƯỚNG, ROUTE GUARDS & QUYỀN TRUY CẬP DANH MỤC KỸ THUẬT

### 1.1. Khảo sát Thanh Sidebar Navigation (`menuConfig.js` & `useAuthStore.js`)
Khi đăng nhập bằng tài khoản `tech` (`ROLE_TECHNICAL_STAFF`), hàm `useAuthStore.getOperationalRole()` trả về mã vai trò `'TECHNICAL_LEAD'` (Role 3).  
Kiểm tra cấu hình tại `frontend/src/shells/TenantAppShell/menuConfig.js` (dòng 248-275):
```javascript
case 'TECHNICAL_LEAD':
  return {
    sectionTitle: 'Bàn Tác Nghiệp Trưởng Kỹ Thuật',
    workspaces: [
      { ...ALL_WORKSPACES.G_EmployeeDailyOps, label: 'WS-G: Chấm Công & Điểm Danh Tổ', badge: 'Điểm danh tổ' },
      { ...ALL_WORKSPACES.A_Geography, label: 'WS-A: Phân Khu & Nhân Sự Khu Mình', badge: 'Khu vực' },
      { ...ALL_WORKSPACES.E_FarmingOps, label: 'WS-E: Nhật Ký Canh Tác / Nuôi & Thu Hoạch', badge: 'Tác nghiệp' },
      { ...ALL_WORKSPACES.F_QaTraceability, label: 'WS-F: Lập Biên Bản Kiểm Định KCS', badge: 'Kiểm định' },
    ],
    independentModules: [],
  };
```

#### Kết quả đánh giá:
1. **Các mục hiển thị đúng:**
   - WS-G (`/app/my-dashboard`): Chấm công, giao việc, điểm danh tổ.
   - WS-A (`/app/geography`): Xem hạ tầng phân khu mình quản lý.
   - WS-E (`/app/farming`): Lập kế hoạch mùa vụ, đàn nuôi, thú y.
   - WS-F (`/app/qa-traceability`): Kiểm định KCS lô thành phẩm.
2. **Các mục thừa đã được loại bỏ chính xác:**
   - WS-B (Nhân sự SaaS toàn chuỗi), WS-D (Đối tác bán buôn), WS-H1 (Giá thành chi phí), WS-H2 (Bán hàng VietQR), Báo cáo vĩ mô (`/app/reports`) và Quản trị hệ thống (`/app/system`) đều bị ẩn 100%. Ranh giới SoD rất tốt.
3. **HAI ĐIỂM NGHẼN BỊ THIẾU NGHIÊM TRỌNG:**
   - **THIẾU WS-C (`C_InventoryHub` - `/app/inventory`):** `ROLE_TECHNICAL_STAFF` có quyền `PERM_INVENTORY_VIEW`. Kỹ sư kỹ thuật và Bác sĩ thú y bắt buộc phải tra cứu tồn kho khả dụng, số lô, hạn sử dụng của thuốc thú y, phân bón, thức ăn đậm đặc để lên phác đồ điều trị và kế hoạch gieo trồng. Việc thiếu WS-C trên menu khiến Kỹ sư phải gõ URL thủ công.
   - **THIẾU STANDALONE MODULE CÀI ĐẶT (`independentModules` rỗng `[]`):** Kỹ sư kỹ thuật không nhìn thấy menu `/app/settings` để cấu hình danh mục Giống và Định mức BOM.

---

### 1.2. Điểm nghẽn Danh mục Kỹ thuật (`/app/settings`)
Kỹ sư kỹ thuật sở hữu `PERM_CROP_PLAN` và `PERM_LIVESTOCK_MANAGE` để định nghĩa:
- **Giống cây trồng (`CropTypesTab`)**
- **Giống vật nuôi (`LivestockBreedsTab`)**
- **Định mức tiêu hao vật tư BOM (`ConsumptionQuotasTab`)**

#### Kiểm tra Route Guards & Khả năng truy cập:
1. Trong `frontend/src/app/routes.jsx` (dòng 252-258):
   ```jsx
   <Route
     path="settings"
     element={
       <PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_FARM_VIEW']}>
         <SettingsPage />
       </PermissionGuard>
     }
   />
   ```
   *Nhận xét:* Nhờ có `PERM_FARM_VIEW`, `ROLE_TECHNICAL_STAFF` không bị Route Guard chặn ở cấp độ URL.
2. Tuy nhiên, trong `frontend/src/pages/settings/index.jsx` (dòng 87-95):
   ```javascript
   const activeTab = searchParams.get('tab') || 'enterprise';
   ```
   - Kỹ sư kỹ thuật truy cập `/app/settings` bị rơi ngay vào Tab 1: **Hồ sơ doanh nghiệp & VietQR (`EnterpriseProfileTab`)**. Màn hình này chứa thông tin bảo mật pháp nhân công ty mẹ.
   - Các Tab không được lọc theo quyền: Kỹ sư kỹ thuật nhìn thấy cả Tab 1 (Enterprise), Tab 2 (Cycles), Tab 5 (Warehouses), Tab 6 (Materials), Tab 8 (WorkShifts), Tab 9 (CostCategories) dù họ không có quyền sửa.
3. **LỖI CHẶN PHÂN QUYỀN TRÊN NÚT BẤM (BUTTON GUARDS):**
   - **Tại `CropTypesTab.jsx` (dòng 177, 212):** Nút `+ Thêm Giống Cây Trồng`, nút Sửa và nút Xóa được bọc trong `<Can permission="PERM_FARM_UPDATE">`.
   - **Tại `LivestockBreedsTab.jsx` (dòng 170, 215):** Nút `+ Thêm Giống Vật Nuôi`, nút Sửa và nút Xóa được bọc trong `<Can permission="PERM_FARM_UPDATE">`.
   - **Tại `ConsumptionQuotasTab.jsx` (dòng 349, 398):** Nút `+ Thêm Định Mức BOM`, nút Sửa và nút Xóa được bọc trong `<Can permission="PERM_FARM_UPDATE">`.
   - Trong khi đó, ở Backend:
     - `CropTypeController.java` (dòng 36, 42, 50): Chấp nhận `PERM_CROP_PLAN`!
     - `LivestockBreedController.java` (dòng 37, 43, 51): Chấp nhận `PERM_LIVESTOCK_MANAGE`!
     - `ConsumptionQuotaController.java` (dòng 31, 37, 45): Chấp nhận `PERM_CROP_PLAN` và `PERM_LIVESTOCK_MANAGE`!
   - **HẬU QUẢ:** Backend đã mở hoàn toàn cho Kỹ sư kỹ thuật, nhưng Frontend lại khóa chặt bằng quyền `PERM_FARM_UPDATE` (chỉ có ở Farm Manager / Owner). Kỹ sư kỹ thuật vào Tab Giống và BOM nhưng **hoàn toàn không thấy nút Thêm/Sửa/Xóa**!

---

# PHẦN 2: KIỂM TRA CHI TIẾT CÁC NÚT THAO TÁC, MODAL & DỮ LIỆU TRÊN TỪNG WORKSPACE

### 2.1. Workspace A: Mặt bằng & Phân công (`A_Geography`)
- **Xem sơ đồ & trạng thái lấp đầy:**
  - `ROLE_TECHNICAL_STAFF` có `PERM_FARM_VIEW`, Backend `ProductionZoneController.java` (dòng 27, 67) cho phép `PERM_FARM_VIEW`.
  - Cây địa lý 3 cấp (`MasterGeographicTree.jsx`) hiển thị đầy đủ Nông trại -> Phân khu (`production_zones`) -> Vị trí/Ô/Chuồng (`zone_locations`).
  - Trạng thái lấp đầy (`EMPTY` / `OCCUPIED`), mã ô, diện tích m² và thông tin nhân sự khu vực đều xem được bình thường.
- **Khóa các nút Thêm/Sửa/Xóa:**
  - Nút `+ Thêm Nông Trại`: Guarded by `PERM_FARM_CREATE` + `ROLE_FARM_OWNER` -> Ẩn 100%.
  - Nút `Sửa thông tin Nông trại`: Guarded by `PERM_FARM_UPDATE` -> Ẩn 100%.
  - Nút `+ Thêm Phân Khu`, `Sửa Phân Khu`, `Xóa Phân Khu`: Guarded by `PERM_ZONE_MANAGE` -> Ẩn 100%.
  - Nút `+ Thêm Vị Trí/Ô/Chuồng`, `Sửa Vị Trí`, `Xóa Vị Trí`: Guarded by `PERM_ZONE_MANAGE` -> Ẩn 100%.
  - Nút Phân công nhân sự (`StaffAssignmentPane.jsx` dòng 77, 161): Guarded by `PERM_ZONE_MANAGE` -> Ẩn 100%.
- **Kết luận WS-A:** Hoàn hảo về phân quyền Read-Only. Không có lỗ hổng bảo mật.

---

### 2.2. Workspace C: Kho bãi & Mã vạch (`C_InventoryHub`)
- **Khả năng tra cứu dữ liệu kho:**
  - `ROLE_TECHNICAL_STAFF` có `PERM_INVENTORY_VIEW`. Backend `InventoryQueryController.java` (dòng 26, 34, 48) cấp phép cho `PERM_INVENTORY_VIEW`.
  - Kỹ sư kỹ thuật xem được bảng Tồn kho tức thời (`warehouse_inventory`), số lượng khả dụng, số lô, hạn sử dụng, và bấm mở được `StockLedgerDrawer.jsx` (Thẻ kho chi tiết lịch sử nhập/xuất).
- **Điểm nghẽn UX (Tab mặc định):**
  - Tại `C_InventoryHub/index.jsx` dòng 52: `const isReadOnly = Boolean(owner && !farmManager);`.
  - Với tài khoản `tech`, `owner = false` nên `isReadOnly = false`. Dòng 67: `useState(isReadOnly ? 'STOCK' : 'RECEIPTS')` làm cho Kỹ sư kỹ thuật khi mở trang lại nhảy vào tab "Phiếu nhập kho" (trống nút tạo vì thiếu quyền) thay vì tab "Tồn kho tức thời" (`STOCK`).
- **Khóa các nút Lập/Duyệt phiếu kho:**
  - Nút `+ Lập Phiếu Nhập Kho`: Guarded by `PERM_INVENTORY_RECEIPT` + `ROLE_WAREHOUSE_STAFF` / `ROLE_FARM_MANAGER` (dòng 718) -> Ẩn 100%.
  - Nút `+ Lập Phiếu Xuất Kho`: Guarded by `PERM_INVENTORY_ISSUE` (dòng 730) -> Ẩn 100%.
  - Nút `+ Lập Lệnh Điều Chuyển`: Guarded by `PERM_INVENTORY_TRANSFER` (dòng 742) -> Ẩn 100%.
  - Nút `+ Lập Phiếu Kiểm Kê`: Guarded by `PERM_INVENTORY_STOCKTAKE` (dòng 754) -> Ẩn 100%.
  - Các nút Duyệt/Hủy phiếu trong các Drawer: Guarded bởi `ROLE_FARM_MANAGER` -> Ẩn 100%.
- **Kết luận WS-C:** Phân quyền kho chuẩn xác, chỉ cần đưa WS-C lên Menu `TECHNICAL_LEAD` và đặt tab mặc định là `'STOCK'`.

---

### 2.3. Workspace E: Canh tác, Chăn nuôi & Nghiệp vụ Thú y (`E_FarmingOps`)

#### 1. Khởi tạo & Sửa Mùa vụ / Đàn nuôi (`CropSeasonModal.jsx` & `LivestockGroupModal.jsx`):
- Khi Modal mở ra, các API phụ trợ được gọi song song:
  - `geographyService.getZones`: Backend `ProductionZoneController.java` (dòng 27) yêu cầu `PERM_FARM_VIEW` -> **Hợp lệ (200 OK)**.
  - `geographyService.getCycles`: Backend `FarmOperationsController.java` (dòng 55) yêu cầu `PERM_FARM_VIEW` -> **Hợp lệ (200 OK)**.
  - `masterDataService.getCropTypes`: Backend `CropTypeController.java` (dòng 24) yêu cầu `PERM_CROP_VIEW` -> **Hợp lệ (200 OK)**.
  - `masterDataService.getLivestockBreeds`: Backend `LivestockBreedController.java` (dòng 24) yêu cầu `PERM_LIVESTOCK_VIEW` -> **Hợp lệ (200 OK)**.
  - `geographyService.getAssignments`: Backend `FarmOperationsController.java` (dòng 30) yêu cầu `PERM_FARM_VIEW` -> **Hợp lệ (200 OK)**.
- Khi bấm Lưu:
  - Tạo/Sửa mùa vụ (`POST / PUT /crop-seasons`): Backend `CropSeasonController.java` (dòng 49, 58) yêu cầu `PERM_CROP_PLAN` -> **Hợp lệ (200 OK)**.
  - Tạo/Sửa đàn nuôi (`POST / PUT /livestock-groups`): Backend `LivestockController.java` (dòng 51, 60) yêu cầu `PERM_LIVESTOCK_MANAGE` -> **Hợp lệ (200 OK)**.
- **Điểm khuyết thiếu:** Cả hai modal hiện mới chỉ chọn `zoneId` (Phân khu), chưa có trường chọn `locationId` (Ô/Luống/Chuồng cụ thể trong phân khu).

#### 2. Quản lý Cá thể RFID (`LivestockIndividualsTab.jsx` & `LivestockIndividualModal.jsx`):
- `ROLE_TECHNICAL_STAFF` có `PERM_LIVESTOCK_MANAGE` và `PERM_LIVESTOCK_VET`.
- Nút `+ Gắn Thẻ Tai RFID Mới` (dòng 271) và nút `Cập Nhật` (dòng 223) đều được mở cho `ROLE_TECHNICAL_STAFF`.
- Thay đổi tình trạng sức khỏe (`HEALTHY`, `SICK`, `INJURED`, `QUARANTINED`, `DECEASED`, `SOLD`): Hoạt động tốt.
- Ghi nhận cân nặng cá thể & tính ADG: Đã có nút `+ Ghi Cân Nặng` trong `GrowthAndHarvestTab.jsx` (dòng 261), gọi `farmingService.recordLivestockWeight` (`POST /livestock/weigh-in`).

#### 3. Ghi nhận Sự kiện Thú y & Tiêm phòng (`FarmingLogsTimelineTab.jsx`):
- Nút `+ Ghi Sự Kiện Thú Y / Tiêm Phòng` (dòng 164) được mở độc quyền cho `ROLE_TECHNICAL_STAFF` (`PERM_LIVESTOCK_VET`).
- **ĐIỂM NGHẼN BẬC NHẤT (GAP-TECH-06):**
  - Backend `CreateLivestockEventRequest.java` (dòng 45-71) được thiết kế rất hoàn chỉnh với mảng `supplies`:
    ```java
    List<LivestockEventSupplyRequest> supplies; // materialId, warehouseId, batchNumber, actualQuantity, unit, notes
    ```
  - Backend `LivestockServiceImpl.java` (dòng 525-660) đã hiện thực hóa 100% **Atomic Auto-Backflushing**:
    1. Khóa bi quan `PESSIMISTIC_WRITE` trên từng dòng tồn kho lô `warehouse_inventory`.
    2. Tự động trừ tồn kho tức thời.
    3. Tự động sinh phiếu xuất kho `WarehouseIssue` loại `PRODUCTION_BACKFLUSH` trạng thái `COMPLETED`.
    4. Tự động ghi thẻ kho `WarehouseInventoryTransaction` loại `OUTWARD`.
    5. Tự động hạch toán chi phí `farm_expenses` vào danh mục `MATERIALS` ở WS-H1.
    6. Tự động cập nhật `withdrawal_end_date` cho đàn/cá thể.
  - **TUY NHIÊN TRÊN FRONTEND:** Trong `FarmingLogsTimelineTab.jsx` (dòng 41-49 và 360-445), Modal sự kiện thú y **chỉ có ô nhập text tự do `detailsJson` và số `withdrawalDays`**!
  - Hoàn toàn **KHÔNG CÓ UI CHỌN THUỐC/VẮC-XIN TỪ KHO**, không có bộ chọn Kho xuất, không có trường nhập liều lượng tiêu hao thực tế và chi phí dịch vụ ngoài (`totalCost`).
  - Do Frontend gửi `supplies: undefined`, toàn bộ logic Auto-Backflushing của Backend không bao giờ được kích hoạt!

#### 4. Ranh giới Cấm (Maker-Checker & Separation of Duties):
- Nút `[+ Ghi Nhật Ký Canh Tác]` (`PERM_CROP_LOG`): Guarded by `['ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER']` (dòng 153) -> **Bị ẩn hoàn toàn đối với Kỹ sư kỹ thuật**. Rất chuẩn xác!
- Nút `[Đóng Vụ Mùa]` và `[Xóa Mùa Vụ]`: Guarded by `role="ROLE_FARM_MANAGER"` trong `E_FarmingOps/index.jsx` (dòng 366, 390). Backend `CropSeasonController.java` (dòng 68, 77) yêu cầu `@farmSecurity.isFarmManager(#farmId)` -> **Kỹ sư kỹ thuật không được phép đóng hoặc xóa mùa vụ**.
- Nút `[Kết Thúc Đàn (SOLD)]` và `[Xóa Đàn Nuôi]`: Guarded by `role="ROLE_FARM_MANAGER"` (dòng 533, 555) -> **Kỹ sư kỹ thuật không được phép đóng hoặc xóa đàn nuôi**.
- Nút `[+ Ghi Nhận Sản Lượng Thu Hoạch]` (`POST /harvest-records`):
  - Frontend `GrowthAndHarvestTab.jsx` (dòng 337) giới hạn cho `ROLE_FIELD_STAFF` và `ROLE_FARM_MANAGER`.
  - Backend `HarvestController.java` (dòng 24) yêu cầu `hasAnyRole('ROLE_FIELD_STAFF', 'ROLE_FARM_MANAGER', 'ROLE_SUPER_ADMIN')`.
  - Kỹ sư kỹ thuật xem biên bản thu hoạch trong bảng danh sách phía dưới của `GrowthAndHarvestTab.jsx` để đối chiếu năng suất giống.

---

### 2.4. Workspace F: Đường ống QA & QR (`F_QaTraceability`)
- **Khả năng nhìn thấy Lô thành phẩm mới:**
  - Thủ kho tạo lô thành phẩm đóng gói ở trạng thái `PENDING_APPROVAL` hoặc `INSPECTING`.
  - Backend `ProductBatchController.java` (dòng 33) cho phép `PERM_HARVEST_MANAGE` và `PERM_FARM_VIEW` lấy danh sách lô.
  - Kỹ sư kỹ thuật vào WS-F nhìn thấy đầy đủ các thẻ Kanban ở cột "Chờ Kiểm Định KCS" và mở được Drawer chi tiết `TraceabilityDetailDrawer.jsx`.
- **Form Lập Biên Bản KCS (`POST /api/v1/farms/{farmId}/qc-inspections`):**
  - Nút `[+ Lập Biên Bản KCS]` hiển thị tại thanh công cụ (dòng 421) và bên trong banner của Drawer (dòng 278) dành cho `ROLE_TECHNICAL_STAFF` (`PERM_QC_INSPECT`).
  - **LỖI LẬP TỨC HTTP 400 KHI SUBMIT (GAP-TECH-07):**
    - Tại `F_QaTraceability/index.jsx` dòng 159-160 và `TraceabilityDetailDrawer.jsx` dòng 187-188:
      ```javascript
      items: [{
        parameterName: inspectionForm.parameterName,
        standardThreshold: inspectionForm.standardThreshold,
        actualValue: inspectionForm.actualValue,           // <-- SAI TÊN TRƯỜNG!
        passed: inspectionForm.overallResult !== 'REJECTED' // <-- SAI TÊN TRƯỜNG!
      }]
      ```
    - Trong khi Backend `QcInspectionRequest.QcInspectionItemRequest.java` (dòng 60-65) bắt buộc:
      ```java
      @NotBlank(message = "Giá trị đo thực tế không được để trống")
      private String measuredValue;

      @NotNull(message = "Đánh giá đạt/không đạt không được để trống")
      private Boolean isPassed;
      ```
    - Vì Frontend gửi `actualValue` và `passed`, Backend nhận `measuredValue = null` và `isPassed = null`, kích hoạt validation ném lỗi: **HTTP 400 Bad Request: "Giá trị đo thực tế không được để trống" & "Đánh giá đạt/không đạt không được để trống"**!
  - **Hạn chế giao diện:** Form chỉ có đúng 1 dòng chỉ tiêu cố định, không cho phép bấm `+ Thêm Chỉ Tiêu` động (ví dụ: Dư lượng thuốc BVTV, Vi sinh vật E.Coli, Kim loại nặng chì/cadimi, Độ ngọt Brix...), và thiếu ô tải ảnh kết quả test phòng thí nghiệm `photosJson`.
- **Khóa các nút Thao tác Checker:**
  - Nút `[Phê Duyệt Lô & Cấp Mã QR]`: Guarded by `PERM_QC_APPROVE` + `ROLE_FARM_MANAGER` / `ROLE_FARM_OWNER` (dòng 330) -> Ẩn 100%.
  - Nút `[Từ Chối Lô]`: Guarded by `PERM_QC_APPROVE` (dòng 353) -> Ẩn 100%.
  - Nút `[In Tem Nhãn Nhiệt QR]`: Guarded by `PERM_LABEL_PRINT` + `ROLE_WAREHOUSE_STAFF` / `ROLE_FARM_MANAGER` (dòng 401) -> Ẩn 100%.
  - Nút `[Thu Hồi Khẩn Cấp]`: Guarded by `PERM_QC_RECALL` + `ROLE_FARM_MANAGER` / `ROLE_FARM_OWNER` (dòng 416) -> Ẩn 100%.

---

### 2.5. Workspace G: Chấm công GPS & Điều hành Daily (`G_EmployeeDailyOps`)
- **Giao diện render đối với `ROLE_TECHNICAL_STAFF`:**
  - `technicalLead = isTechnicalLead()` trả về `true`.
  - Khối 1: `OneTapTimekeepingCard` (Chấm công GPS + Chụp ảnh Selfie vào/ra ca của bản thân).
  - Khối 2: `TeamRollCallPanel` (Bảng điểm danh tổ hiện trường hộ công nhân thời vụ không có smartphone).
  - Khối 3: Tabs chuyển đổi giữa `DailyRoutineTaskTab` (Nhiệm vụ định kỳ) và `PersonalTaskKanban` (Kanban giao việc). Có nút `+ Giao Việc Mới` mở `CreateTaskModal.jsx`.
  - Khối 4: `PersonalShiftScheduleCard` (Lịch ca cá nhân & gửi đơn nghỉ/OT).
- **LỖI PHÂN QUYỀN CHẾT NGƯỜI (GAP-TECH-05 - HTTP 403 FORBIDDEN):**
  - Để giao việc trong `CreateTaskModal.jsx` hoặc điểm danh tổ trong `TeamRollCallPanel.jsx`, Frontend gọi:
    ```javascript
    const res = await hrService.getEmployees({ farmId: activeFarmId });
    ```
  - Kiểm tra `backend/src/main/java/com/farm/saas/modules/hr/controller/EmployeeController.java` (dòng 41-42):
    ```java
    @GetMapping
    @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<Page<EmployeeDetailResponse>> getEmployees(...)
    ```
  - **NGUYÊN NHÂN GỐC RỄ:** `ROLE_TECHNICAL_STAFF` sở hữu `PERM_TASK_ASSIGN` và `PERM_HR_ATTENDANCE`, nhưng **KHÔNG CÓ** `PERM_HR_EMPLOYEE_MANAGE`!
  - **HẬU QUẢ NGHIÊM TRỌNG:** Ngay khi Kỹ sư kỹ thuật vào WS-G, API `GET /api/v1/hr/employees` lập tức trả về **HTTP 403 Forbidden**! Danh sách `employees` bị rỗng.
    1. Khi mở Modal Giao việc (`CreateTaskModal`), dropdown danh sách nhân viên để phân công bị trắng trơn! Không thể giao việc cho ai.
    2. Trong `TeamRollCallPanel`, danh sách công nhân để điểm danh tổ bị rỗng 100%!
  - Ngược lại, API Ca làm việc `GET /api/v1/hr/shifts` tại `WorkShiftController.java` (dòng 24) có kiểm tra `hasAuthority('PERM_HR_ATTENDANCE')` nên chạy thành công (200 OK).
- **Luồng Nghiệm thu Công việc (`ReviewTaskModal.jsx`):**
  - Khi công nhân hoàn thành và chuyển task sang `PENDING_REVIEW`, Kỹ sư kỹ thuật bấm "Nghiệm thu".
  - Kiểm tra `FarmTaskServiceImpl.java` (dòng 224-232):
    ```java
    boolean canApprove = currentUser != null && (
            currentUser.isSuperAdmin()
            || currentUser.hasPermission("PERM_TASK_ASSIGN")
            || currentUser.hasRole("ROLE_FARM_MANAGER")
            || currentUser.hasRole("ROLE_TECHNICAL_STAFF")
    );
    ```
  - Backend đã kiểm tra trực tiếp `hasRole("ROLE_TECHNICAL_STAFF")` và `PERM_TASK_ASSIGN`.
  - Kỹ sư kỹ thuật bấm duyệt nghiệm thu (`DONE`) hoặc yêu cầu làm lại (`IN_PROGRESS`) đều hoạt động trơn tru.

---

# PHẦN 3: KIỂM TRA LUỒNG ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG GIỮA CÁC WORKSPACE & CÁC TÀI KHOẢN

### 3.1. Luồng Tạo Mùa vụ / Đàn nuôi (WS-E) -> Trạng thái Mặt bằng (WS-A)
- **Hiện trạng kiểm tra mã nguồn:**
  - Trong `CropSeasonServiceImpl.java` (dòng 89-106) và `LivestockServiceImpl.java` (dòng 119-134), thực thể `CropSeason` và `LivestockGroup` chỉ lưu trường `zoneId` (thuộc bảng `production_zones`).
  - Trong database và DTO, hoàn toàn **chưa có trường `locationId`** để trỏ tới `zone_locations`.
  - Service Backend **KHÔNG CÓ DÒNG CODE NÀO** cập nhật `zone_locations.setStatus("OCCUPIED")`.
- **Kết luận:** Khi Kỹ sư kỹ thuật tạo Mùa vụ mới hoặc Đàn nuôi mới ở WS-E, trạng thái của các ô/luống/chuồng tại WS-A **vẫn giữ nguyên là `EMPTY`**, không tự động chuyển sang `OCCUPIED`.

### 3.2. Luồng Sự kiện Thú y (WS-E) -> Tồn kho (WS-C) & Giá thành (WS-H1)
- **Hiện trạng kiểm tra mã nguồn:**
  - Backend `LivestockServiceImpl.java` (dòng 525-660) đã cài đặt thuật toán Atomic Auto-Backflushing chuẩn enterprise:
    1. Lấy khóa bi quan `findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate`.
    2. Trừ tồn kho tức thời tại `warehouse_inventory`.
    3. Tạo phiếu xuất kho `warehouse_issues` loại `PRODUCTION_BACKFLUSH` trạng thái `COMPLETED`.
    4. Ghi sổ nhật ký kho `warehouse_inventory_transactions`.
    5. Tự động sinh khoản chi phí `farm_expenses` thuộc nhóm `MATERIALS`.
  - **Điểm gãy luồng:** Do Frontend `FarmingLogsTimelineTab.jsx` chưa có giao diện chọn vật tư, nên mảng `supplies` gửi lên Backend luôn rỗng (`[]`). Toàn bộ luồng trừ kho và hạch toán chi phí tự động không bao giờ chạy trong thực tế.

### 3.3. Luồng Lập Biên bản KCS (WS-F) -> Phê duyệt Lô thành phẩm (Role Giám Đốc Trại)
- **Hiện trạng kiểm tra mã nguồn:**
  - Backend `ProductBatchServiceImpl.java` (dòng 578-633) trong hàm `mapToDetailResponse` đã có logic tự động query `qcInspectionRepository.findTopByProductBatchIdOrderByCreatedAtDesc`. Nếu tìm thấy biên bản KCS, nó tự động map `qcOverallResult`, `inspectorName` và bản chụp JSON chỉ tiêu kiểm tra `qcJson`.
  - Khi Giám đốc trại mở `TraceabilityDetailDrawer.jsx`, biến `canApprove` sẽ tự động thành `true` để bấm nút `[Phê Duyệt Lô & Cấp Mã QR]`.
  - **Điểm gãy luồng:**
    1. Do lỗi sai tên trường `actualValue` và `passed` ở Frontend, API tạo biên bản KCS bị HTTP 400 và không bao giờ lưu được vào database.
    2. Trong `QcInspectionServiceImpl.java` (dòng 41-91), khi tạo biên bản KCS xong, Backend không cập nhật trạng thái `ProductBatch.status` sang `INSPECTING`.

### 3.4. Cơ chế Refetching Dữ liệu giữa các Workspace
- **Cơ chế chuyển Menu:** Ứng dụng dùng React Router tiêu chuẩn. Khi người dùng bấm chuyển giữa các Workspace trên Sidebar, component cũ unmount và component mới mount, kích hoạt `useEffect` tải lại dữ liệu mới nhất từ Backend (không bị cache đè).
- **Bộ đếm Cross-Workspace Sync Bus (`useActiveFarmStore.js`):**
  - Store cung cấp `syncTrigger` (`farms`, `zones`, `employees`, `partners`, `inventory`, `batches`, `finance`) và hàm `notifyDataChanged`.
  - Các Workspace đều đã lắng nghe `syncTrigger` tương ứng (ví dụ WS-F lắng nghe `syncTrigger?.batches`, WS-C lắng nghe `syncTrigger?.inventory`).
  - Sau khi các lỗi API HTTP 400/403 được sửa chữa, việc gọi `notifyDataChanged` sau khi đóng Modal sẽ kích hoạt refetch dữ liệu tự động giữa các Workspace và giữa các phiên làm việc của người dùng khác nhau.

---

# PHẦN 4: LỘ TRÌNH SỬA CHỮA TRIỆT ĐỂ (REMEDIATION ROADMAP)

Để đưa tài khoản `ROLE_TECHNICAL_STAFF` (`tech`) vào vận hành thực tế 100% trơn tru, không gặp bất kỳ lỗi 403, 400 hay đứt gãy luồng dữ liệu, chúng ta cần triển khai theo 3 Giai đoạn kỹ thuật:

### Giai đoạn 1: Mở khóa Phân quyền & Navigation Menu (Backend & Frontend)
1. **Backend `EmployeeController.java` (dòng 41):**
   - Bổ sung quyền `PERM_TASK_ASSIGN`, `PERM_HR_ATTENDANCE` hoặc role `ROLE_TECHNICAL_STAFF` vào `@PreAuthorize` của `GET /api/v1/hr/employees` để chấm dứt ngay lỗi 403 Forbidden khi tải danh sách công nhân giao việc & điểm danh tổ.
2. **Frontend `menuConfig.js` (dòng 248-275):**
   - Bổ sung `ALL_WORKSPACES.C_InventoryHub` vào `workspaces` của `TECHNICAL_LEAD` (badge: `'Tra cứu kho'`).
   - Bổ sung `ALL_INDEPENDENT_MODULES.settings` vào `independentModules` của `TECHNICAL_LEAD`.
3. **Frontend `pages/settings/index.jsx` & Các Tab Kỹ thuật:**
   - Điều chỉnh logic tab mặc định cho `TECHNICAL_LEAD`: Nếu không có quyền quản lý doanh nghiệp, tự động chọn tab đầu tiên được phép xem (`crop-types` hoặc `livestock-breeds`).
   - Ẩn các tab không liên quan (Enterprise, Warehouses, Shifts, CostCategories) đối với `ROLE_TECHNICAL_STAFF`.
   - Tại `CropTypesTab.jsx` (dòng 177, 212), `LivestockBreedsTab.jsx` (dòng 170, 215), `ConsumptionQuotasTab.jsx` (dòng 349, 398): Thay `<Can permission="PERM_FARM_UPDATE">` bằng `<Can anyPermissions={['PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE', 'PERM_FARM_UPDATE']}>` để hiển thị đầy đủ các nút Thêm/Sửa/Xóa cho Kỹ sư kỹ thuật.

### Giai đoạn 2: Khắc phục Lỗi KCS & Kích hoạt Auto-Backflushing Thú y
1. **Frontend `F_QaTraceability` (`index.jsx` & `TraceabilityDetailDrawer.jsx`):**
   - Khắc phục lỗi HTTP 400: Đổi `actualValue` thành `measuredValue`, đổi `passed` thành `isPassed` khớp 100% với `QcInspectionRequest.java`.
   - Nâng cấp Modal Lập Biên Bản KCS: Cho phép thêm động nhiều chỉ tiêu kiểm tra (`items`), chọn đạt/trượt từng chỉ tiêu, nhập ghi chú phòng lab.
   - Thêm trường upload ảnh minh chứng kết quả KCS (`photosJson`).
2. **Backend `QcInspectionServiceImpl.java`:**
   - Sau khi tạo biên bản KCS, cập nhật trạng thái `product_batches.status` sang `INSPECTING` (hoặc giữ `PENDING_APPROVAL` nhưng cập nhật trường `updatedAt` để trigger WebSocket / polling).
3. **Frontend `FarmingLogsTimelineTab.jsx`:**
   - Thiết kế lại Modal Sự kiện thú y: Bổ sung bảng chọn Vắc-xin / Thuốc thú y từ kho (`supplies`: chọn kho từ `getWarehouses`, chọn thuốc từ tồn kho `getInventory`, nhập số lô, số lượng tiêm thực tế, đơn vị tính).
   - Bổ sung trường chọn Ngày hết cách ly ngưng thuốc (`withdrawalEndDate`) và Chi phí dịch vụ thú y ngoài (`totalCost`).
   - Gửi payload chuẩn lên `POST /livestock-events` để kích hoạt Atomic Auto-Backflushing của Backend.

### Giai đoạn 3: Tối ưu UX & Liên kết Dữ liệu Vị trí Ô/Chuồng
1. **Frontend `C_InventoryHub/index.jsx`:**
   - Đặt tab mặc định là `'STOCK'` (Tồn kho tức thời) đối với tài khoản Kỹ thuật viên / Bác sĩ thú y (`TECHNICAL_LEAD`).
2. **Backend & Frontend WS-A / WS-E:**
   - Bổ sung trường `locationId` (tùy chọn) khi tạo Mùa vụ (`CropSeason`) và Đàn nuôi (`LivestockGroup`).
   - Tự động cập nhật `zone_locations.status = 'OCCUPIED'` khi có mùa vụ hoặc đàn nuôi gắn với vị trí đó, và tự động hoàn trả `EMPTY` khi đóng mùa vụ hoặc xuất bán hết đàn.
