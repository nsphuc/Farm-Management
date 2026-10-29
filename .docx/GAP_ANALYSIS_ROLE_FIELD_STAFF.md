# BÁO CÁO KIỂM TOÁN HỆ THỐNG & GAP ANALYSIS TOÀN DIỆN
## ĐÁNH GIÁ CHỨC NĂNG TÀI KHOẢN `ROLE_FIELD_STAFF` (CẤP 4 - NHÂN VIÊN / CÔNG NHÂN HIỆN TRƯỜNG)
**Dự án:** Farm Management SaaS Multi-Tenant  
**Vai trò thẩm định:** Principal Software Architect  
**Tài khoản mẫu kiểm thử:** `staff` (`ROLE_FIELD_STAFF`)  
**Mục tiêu:** Rà soát 100% chức năng Frontend (`frontend/src/`) & Backend (`backend/src/main/java/com/farm/saas/`) liên quan đến `ROLE_FIELD_STAFF`, phát hiện toàn bộ lỗ hổng phân quyền (RBAC), điểm nghẽn UX/UI Mobile-First, lỗi HTTP 403/400, thiếu sót SoD (Maker-Checker), và sai lệch luồng đồng bộ dữ liệu tự động giữa các Workspace.

---

## TỔNG QUAN VỊ TRÍ & QUYỀN HẠN CỦA `ROLE_FIELD_STAFF` (THEO RBAC MATRIX V1_4)
Theo thiết kế kiến trúc chuẩn phân quyền 4 cấp (`V1_4__standardize_4_tier_rbac_matrix.sql`, dòng 179-190), `ROLE_FIELD_STAFF` là vai trò **Cấp 4 (Tầng Thực thi Hiện trường - Operator)** với đúng **6 quyền hạn nghiệp vụ cốt lõi**:
1. `PERM_FARM_VIEW` (#3): Xem thông tin cơ bản của nông trại trực thuộc.
2. `PERM_CROP_VIEW` (#6): Theo dõi tiến độ và lịch mùa vụ canh tác tại phân khu phụ trách.
3. `PERM_CROP_LOG` (#8): **Maker hiện trường**: Trực tiếp ghi nhật ký canh tác (làm đất, gieo hạt, tưới nước, bón phân, phun thuốc BVTV) và kích hoạt trừ kho vật tư tự động (Crop Auto-Backflushing).
4. `PERM_LIVESTOCK_VIEW` (#9): Theo dõi đàn nuôi và xem lịch sử cân nặng cá thể RFID / cả đàn.
5. `PERM_HARVEST_MANAGE` (#17): **Maker hiện trường**: Lập biên bản thu hoạch thực tế tại ruộng hoặc xuất bán tại chuồng trước khi chuyển giao cho Thủ kho / KCS.
6. `PERM_HR_ATTENDANCE` (#24): Chấm công GPS + Selfie cá nhân 2 đầu, xem lịch phân ca, gửi đơn nghỉ phép/OT và nhận việc hàng ngày.

### Các ranh giới cấm tuyệt đối theo nguyên tắc Tách biệt nhiệm vụ (Separation of Duties - SoD & Maker-Checker):
- **CẤM LẬP KẾ HOẠCH MÙA VỤ / ĐÀN NUÔI (`PERM_CROP_PLAN`, `PERM_LIVESTOCK_MANAGE`)**: Thuộc về Kỹ sư kỹ thuật (`ROLE_TECHNICAL_STAFF`) và Giám đốc trại (`ROLE_FARM_MANAGER`).
- **CẤM ĐÓNG / HỦY VỤ MÙA / KẾT THÚC ĐÀN NUÔI**: Phải do Giám đốc trang trại (`ROLE_FARM_MANAGER`) chốt sổ.
- **CẤM ĐĂNG KÝ CÁ THỂ RFID MỚI / SỬA THÔNG TIN CÁ THỂ**: Thuộc về Kỹ sư kỹ thuật (`ROLE_TECHNICAL_STAFF`).
- **CẤM KÊ ĐƠN THÚ Y / VẮC-XIN (`PERM_LIVESTOCK_VET`)**: Độc quyền của Bác sĩ thú y / Kỹ thuật viên.
- **CẤM THAO TÁC KHO (`PERM_INVENTORY_VIEW`, `PERM_INVENTORY_RECEIPT`, `PERM_INVENTORY_ISSUE`, `PERM_INVENTORY_TRANSFER`, `PERM_INVENTORY_STOCKTAKE`)**: Nhập/xuất/kiểm kê thuộc độc quyền của Thủ kho (`ROLE_WAREHOUSE_STAFF`).
- **CẤM KIỂM ĐỊNH KCS & DUYỆT LÔ THÀNH PHẨM (`PERM_QC_INSPECT`, `PERM_QC_APPROVE`)**: Thuộc về KCS và Giám đốc trại.
- **CẤM TIẾP NHẬN & ĐÓNG GÓI LÔ THÀNH PHẨM**: Phải do Thủ kho và Quản lý trại tiếp nhận sản lượng.
- **CẤM QUẢN LÝ NHÂN SỰ TOÀN TRẠI (`PERM_HR_EMPLOYEE_MANAGE`)**: Thuộc về Quản lý trại.
- **CẤM TỰ DUYỆT NGHIỆM THU CÔNG VIỆC (`DONE`) HOẶC HỦY VIỆC (`CANCELLED`)**: Công nhân chỉ được chuyển từ `TODO` -> `IN_PROGRESS` -> `PENDING_REVIEW`. Duyệt nghiệm thu `DONE` bắt buộc phải có `PERM_TASK_ASSIGN` (Trưởng kỹ thuật hoặc Quản lý trại).

---

# BẢNG TỔNG HỢP TOÀN BỘ LỖ HỔNG & ĐIỂM NGHẼN (EXECUTIVE GAP MATRIX)

| Mã Lỗ Hổng | Phân Vùng | Vị Trí File & Dòng Code | Hiện Trạng Thực Tế | Rủi Ro & Hành Vi Lỗi | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-FIELD-01** | **Điều hướng Menu** | `frontend/src/shells/TenantAppShell/menuConfig.js`<br>*(Dòng 358-372)* | Menu `case 'FIELD_WORKER'` chỉ hiển thị DUY NHẤT `WS-G` (`ALL_WORKSPACES.G_EmployeeDailyOps`). Hoàn toàn thiếu `WS-E` (`E_FarmingOps`). | `ROLE_FIELD_STAFF` có quyền `PERM_CROP_LOG`, `PERM_CROP_VIEW`, `PERM_LIVESTOCK_VIEW`, `PERM_HARVEST_MANAGE` nhưng Sidebar không có link vào WS-E để ghi nhật ký canh tác, cân vật nuôi và lập biên bản thu hoạch! | **CRITICAL** |
| **GAP-FIELD-02** | **Lộ Route Guard** | `frontend/src/app/routes.jsx`<br>*(Dòng 136, 160, 254)* | Các route `/app/geography` (WS-A), `/app/partners` (WS-D), và `/app/settings` chứa quyền `PERM_FARM_VIEW` trong danh sách bảo vệ. | `ROLE_FIELD_STAFF` có quyền `PERM_FARM_VIEW` nên nếu gõ trực tiếp URL sẽ lọt vào xem Sơ đồ phân khu (WS-A), Danh sách Đối tác/NCC (WS-D) và Cài đặt hồ sơ pháp nhân/ngân hàng (`/app/settings`). Vi phạm SoD. | **HIGH** |
| **GAP-FIELD-03** | **Crop Auto-Backflush** | `frontend/src/workspaces/E_FarmingOps/components/FarmingLogsTimelineTab.jsx`<br>*(Dòng 41-47, 314-338, 574-640)* | Modal Ghi Nhật Ký Canh Tác (`isAddLogOpen`) chỉ là form văn bản đơn giản (hoạt động, ngày, giai đoạn, phiDays, thời tiết). Hoàn toàn không có form chọn vật tư xuất kho (`supplies`). | Backend `FarmingLogServiceImpl.java` đã lập trình đầy đủ cơ chế trừ kho FEFO, tạo phiếu xuất kho và hạch toán chi phí `farm_expenses`. Nhưng vì Frontend gửi `supplies: undefined`, tính năng Crop Auto-Backflushing bị vô hiệu hóa 100%! | **CRITICAL** |
| **GAP-FIELD-04** | **Lập Biên Bản Thu Hoạch** | `frontend/src/workspaces/E_FarmingOps/components/GrowthAndHarvestTab.jsx`<br>*(Dòng 115-121, 435-439)* | Frontend gửi `{ actualYieldKg, qualityGrade: 'EXPORT' }` và thiếu `sourceType`, `unit`. Backend `CreateHarvestRecordRequest.java` yêu cầu `@NotBlank sourceType`, `@NotNull quantity`, `@NotBlank unit`, regex `GRADE_A\|GRADE_B\|STANDARD\|REJECT`. | **LỖI HTTP 400 BAD REQUEST FATAL:** Khi công nhân bấm "Lưu Biên Bản Thu Hoạch", Backend ném lỗi validation vì sai tên trường và vi phạm enum regex. Công nhân hoàn toàn không thể lập biên bản thu hoạch trên ruộng! | **CRITICAL** |
| **GAP-FIELD-05** | **Xem Lịch Phân Ca** | `backend/src/main/java/com/farm/saas/modules/hr/controller/ShiftAssignmentController.java`<br>*(Dòng 31-33)* | Endpoint `GET /api/v1/hr/shifts/assignments` kiểm tra `@PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")`. | **LỖI HTTP 403 FORBIDDEN FATAL:** `ROLE_FIELD_STAFF` có `PERM_HR_ATTENDANCE` nhưng không có `PERM_HR_EMPLOYEE_MANAGE`. Khi công nhân vào WS-G xem thẻ lịch ca cá nhân (`PersonalShiftScheduleCard.jsx`), API tải lịch ca bị chặn 403 Forbidden! | **CRITICAL** |
| **GAP-FIELD-06** | **Thiếu Hồ Sơ Nhân Sự Seed** | `backend/src/main/resources/db/migration/V1_0__init_system_core.sql`<br>*(Dòng 2244-2286)* | Bảng `users` có tài khoản `staff` (id 3), nhưng bảng `employees` hoàn toàn rỗng, không có bản ghi nhân sự nào được liên kết với `user_id = 3`. | Nếu Quản lý trại chưa tạo hồ sơ nhân sự thủ công, công nhân bấm Chấm công GPS hoặc gửi Đơn nghỉ phép/OT sẽ bị Backend từ chối ngay lập tức: `EMPLOYEE_PROFILE_REQUIRED` (HTTP 400). | **HIGH** |
| **GAP-FIELD-07** | **Đóng Gói Lô Thành Phẩm** | `frontend/src/workspaces/E_FarmingOps/components/GrowthAndHarvestTab.jsx`<br>*(Dòng 140-150, 350-360)* | Modal đóng gói lô thành phẩm không truyền `sourceHarvestRecordIds` và không có nút liên kết trực tiếp từ từng dòng biên bản thu hoạch thực tế. | Lô thành phẩm tạo ra bị "mồ côi" (orphan), không truy vết được bắt nguồn từ đợt thu hoạch thực tế nào ngoài ruộng, làm giảm độ tin cậy của mã QR truy xuất nguồn gốc. | **MEDIUM** |
| **GAP-FIELD-08** | **Đồng Bộ Dữ Liệu Liên Workspace** | `frontend/src/workspaces/G_EmployeeDailyOps/components/`<br>`LeaveRequestModal.jsx` *(Dòng 84)*<br>`OvertimeRequestModal.jsx` *(Dòng 84)*<br>`CompleteTaskModal.jsx` *(Dòng 53)* | Các Modal nghỉ phép, OT, và hoàn thành nhiệm vụ chỉ gọi `onSuccess?.()` cục bộ, không kích hoạt `notifyDataChanged` đến `useActiveFarmStore`. Backend HR cũng không bắn `Notification`. | Giám đốc trại và Kỹ sư kỹ thuật đang mở màn hình WS-G (`FarmManagerDailyOverview`) hoặc WS-B không nhận được thông báo chuông và dữ liệu không tự làm mới để duyệt; bắt buộc phải F5 hoặc bấm nút "Làm Mới". | **MEDIUM** |

---

# PHẦN 1: KIỂM TRA MENU ĐIỀU HƯỚNG, ROUTE GUARDS & RANH GIỚI TRUY CẬP

### 1.1. Khảo sát Thanh Sidebar Navigation (`menuConfig.js` & `useAuthStore.js`)
Khi đăng nhập bằng tài khoản `staff` (`ROLE_FIELD_STAFF`):
1. **Kiểm tra `useAuthStore.js`:**
   - Hàm `isFieldWorker()` (dòng 457-487) kiểm tra `hasRole('ROLE_FIELD_STAFF')` và trả về `true`.
   - Hàm `getOperationalRole()` (dòng 494-512) trả về mã vai trò `'FIELD_WORKER'` (Role 6, `roleNumber: 6`).
   - Hàm `getOperationalRoleInfo()` (dòng 592-603) cấu hình:
     - `title: 'Nhân Viên Hiện Trường / Nông Vụ'`
     - `shortTitle: 'Nông Vụ Hiện Trường'`
     - `badgeColor: 'bg-teal-100 text-teal-900 border-teal-300 font-bold'`
     - `canSkipAttendance: false` (Bắt buộc chấm công GPS hàng ngày)
     - `isFarmLocked: true` (Khóa chặt vào trại phụ trách)
     - `isMobileFirst: true` (Thiết kế tối ưu hóa cho màn hình di động)

2. **Kiểm tra `menuConfig.js` (dòng 358-372):**
   ```javascript
   // 6. Role 6A: Field Worker (Nhân viên hiện trường có tài khoản)
   // Chỉ hiển thị DUY NHẤT WS-G
   case 'FIELD_WORKER':
     return {
       sectionTitle: 'Bàn Tác Nghiệp Hiện Trường',
       workspaces: [
         {
           ...ALL_WORKSPACES.G_EmployeeDailyOps,
           label: 'WS-G: Bảng Tác Nghiệp & Chấm Công',
           badge: 'Hôm nay',
         },
       ],
       independentModules: [],
     };
   ```

#### ĐÁNH GIÁ & PHÁT HIỆN LỖ HỔNG (GAP-FIELD-01):
- **Hiện trạng:** Sidebar của `ROLE_FIELD_STAFF` hiện tại chỉ hiển thị **DUY NHẤT WS-G** (`/app/my-dashboard`).
- **Phân tích nghiệp vụ:** Theo ma trận RBAC V1_4, `ROLE_FIELD_STAFF` sở hữu 4 quyền nghiệp vụ sản xuất cốt lõi:
  - `PERM_CROP_LOG`: Ghi nhật ký canh tác (bón phân, phun thuốc, làm đất).
  - `PERM_CROP_VIEW`: Xem lịch trình vụ mùa.
  - `PERM_LIVESTOCK_VIEW`: Xem đàn nuôi và lịch sử cân nặng.
  - `PERM_HARVEST_MANAGE`: Lập biên bản thu hoạch nông sản / xuất bán vật nuôi.
  Toàn bộ 4 nghiệp vụ này nằm trọn vẹn trong **WS-E (`E_FarmingOps` - `/app/farming`)**.
- **Hậu quả:** Nhân viên hiện trường hoàn toàn không có mục menu để vào WS-E thực hiện nhiệm vụ ghi chép nhật ký và thu hoạch! Để vào được, công nhân phải tự gõ URL `/app/farming` trên thanh địa chỉ trình duyệt — một trải nghiệm người dùng không thể chấp nhận được trên thiết bị di động.
- **Khắc phục:** Cần bổ sung ngay `ALL_WORKSPACES.E_FarmingOps` vào danh sách `workspaces` của `case 'FIELD_WORKER'` trong `menuConfig.js` với nhãn: `WS-E: Nhật Ký Hiện Trường & Thu Hoạch` (badge: `'Hiện trường'`).

---

### 1.2. Kiểm tra Route Guards tại `frontend/src/app/routes.jsx`
Theo nguyên tắc Tối thiểu Đặc quyền (Principle of Least Privilege) và Tách biệt Nhiệm vụ (SoD), chúng ta kiểm tra hành vi của hệ thống khi tài khoản `ROLE_FIELD_STAFF` cố tình gõ trực tiếp URL vào các phân hệ khác:

| Đường Dẫn URL | Workspace / Phân Hệ | Cấu Hình Route Guard (`routes.jsx`) | Kết Quả Thực Tế | Đánh Giá Rủi Ro |
| :--- | :--- | :--- | :--- | :--- |
| `/app/geography` | **WS-A:** Hạ tầng & Phân khu | `<PermissionGuard permission="PERM_FARM_VIEW">` *(Dòng 136)* | ❌ **CHO LỌT VÀO** | **HIGH (GAP-FIELD-02):** `ROLE_FIELD_STAFF` có `PERM_FARM_VIEW` nên truy cập được vào xem toàn bộ danh mục phân khu, nhà màng, ô thửa và tọa độ GPS của trang trại. |
| `/app/hr` | **WS-B:** Quản trị Nhân sự | `<PermissionGuard permission="PERM_HR_EMPLOYEE_MANAGE">` *(Dòng 144)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. Công nhân không có quyền quản lý nhân sự. |
| `/app/inventory` | **WS-C:** Kho Bãi & Mã Vạch | `<PermissionGuard permission="PERM_INVENTORY_VIEW">` *(Dòng 152)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. Công nhân không có quyền tra cứu kho. |
| `/app/partners` | **WS-D:** Đối Tác & Khách Hàng | `<PermissionGuard anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_VIEW']}>` *(Dòng 160)* | ❌ **CHO LỌT VÀO** | **HIGH (GAP-FIELD-02):** Do `anyPermissions` chứa `PERM_FARM_VIEW`, công nhân hiện trường lọt vào xem danh bạ nhà cung cấp giống/phân bón và khách hàng bán buôn của doanh nghiệp! |
| `/app/farming` | **WS-E:** Canh Tác & Chăn Nuôi | `<PermissionGuard anyPermissions={['PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_CROP_LOG']}>` *(Dòng 169)* | ✅ **CHO PHÉP TRUY CẬP** | Đúng thiết kế nghiệp vụ (Công nhân cần vào đây để ghi nhật ký và thu hoạch). |
| `/app/qa-traceability` | **WS-F:** KCS & QR Code | `<PermissionGuard anyPermissions={['PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT']}>` *(Dòng 208)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. Công nhân không có quyền KCS. |
| `/app/my-dashboard` | **WS-G:** Chấm Công & Bảng Việc | `<PermissionGuard anyPermissions={['PERM_HR_ATTENDANCE', ... ]}>` *(Dòng 217)* | ✅ **CHO PHÉP TRUY CẬP** | Đúng thiết kế (Bàn làm việc chính của công nhân). |
| `/app/cost-accounting` | **WS-H1:** Giá Thành Chi Phí | `<PermissionGuard permission="PERM_FINANCE_EXPENSE">` *(Dòng 236)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. Công nhân không được xem sổ cái chi phí. |
| `/app/sales-cashflow` | **WS-H2:** Bán Sỉ & VietQR | `<PermissionGuard permission="PERM_FINANCE_SALES_ORDER">` *(Dòng 244)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. Công nhân không được lên đơn bán hàng. |
| `/app/settings` | **Cài Đặt Hệ Thống** | `<PermissionGuard anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_FARM_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']}>` *(Dòng 254)* | ❌ **CHO LỌT VÀO** | **HIGH (GAP-FIELD-02):** Do chứa `PERM_FARM_VIEW`, công nhân vào được trang Cài đặt, mặc định rơi vào Tab Hồ sơ doanh nghiệp (`EnterpriseProfileTab`), xem được thông tin pháp nhân và tài khoản ngân hàng VietQR của chủ trại! |
| `/app/reports` | **Báo Cáo Quản Trị** | `<PermissionGuard permission="PERM_FINANCE_REPORT">` *(Dòng 262)* | ✅ **CHẶN ĐÚNG (403)** | An toàn. |

#### ĐỀ XUẤT KIẾN TRÚC CHO `routes.jsx`:
1. Tại `/app/partners`: Loại bỏ `PERM_FARM_VIEW` khỏi `anyPermissions`. Chỉ giữ `['PERM_FINANCE_SALES_ORDER', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_VIEW']`.
2. Tại `/app/settings`: Loại bỏ `PERM_FARM_VIEW` khỏi `anyPermissions`. Chỉ giữ `['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']`.
3. Tại `/app/geography`: Đổi guard sang `['PERM_ZONE_MANAGE', 'PERM_FARM_UPDATE', 'ROLE_TECHNICAL_STAFF']` hoặc thêm check vai trò vận hành để ngăn công nhân hiện trường can thiệp cấu hình mặt bằng.

---

# PHẦN 2: KIỂM TRA WORKSPACE E (`E_FarmingOps`) — NHẬT KÝ CANH TÁC, AUTO-BACKFLUSHING, CÂN VẬT NUÔI & THU HOẠCH

### 2.1. Ghi Nhật Ký Canh Tác & Cơ Chế Auto-Backflushing Vật Tư
`ROLE_FIELD_STAFF` (`PERM_CROP_LOG`) là người trực tiếp bón phân, phun thuốc ngoài đồng và bấm nút **`[+ Ghi Nhật Ký Canh Tác & Xuất Vật Tư]`** trong `FarmingLogsTimelineTab.jsx`.

#### 2.1.1. Khảo sát 4 API phụ trợ khi mở Modal:
Khi công nhân mở Modal chọn vật tư phân bón / thuốc BVTV để xuất kho và nạp định mức BOM:
1. `GET /api/v1/farms/{farmId}/warehouses` (`WarehouseController.java`, dòng 24):
   - `@PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', ...) ...)")`
   - **Kết quả:** `ROLE_FIELD_STAFF` có `PERM_FARM_VIEW` -> **HỢP LỆ (200 OK)**, không bị 403.
2. `GET /api/v1/farms/{farmId}/inventory` (`InventoryQueryController.java`, dòng 34):
   - `@PreAuthorize("(hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_LIVESTOCK_VET', 'PERM_CROP_LOG') ...)")`
   - **Kết quả:** `ROLE_FIELD_STAFF` có `PERM_CROP_LOG` -> **HỢP LỆ (200 OK)**, không bị 403.
3. `GET /api/v1/materials` (`MaterialController.java`, dòng 27):
   - `@PreAuthorize("hasAnyAuthority('PERM_INVENTORY_VIEW', 'PERM_FARM_VIEW', ...) ...")`
   - **Kết quả:** `ROLE_FIELD_STAFF` có `PERM_FARM_VIEW` -> **HỢP LỆ (200 OK)**, không bị 403.
4. `GET /api/v1/quotas` (`ConsumptionQuotaController.java`, dòng 24):
   - `@PreAuthorize("hasAnyAuthority('PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_FARM_VIEW', ...)")`
   - **Kết quả:** `ROLE_FIELD_STAFF` có `PERM_CROP_VIEW` và `PERM_FARM_VIEW` -> **HỢP LỆ (200 OK)**, không bị 403.

#### 2.1.2. Hiện trạng Giao diện Modal trong `FarmingLogsTimelineTab.jsx` (GAP-FIELD-03):
- **Phát hiện nghiêm trọng:** Mặc dù nút bấm hiển thị tiêu đề hoành tráng: `+ Ghi Nhật Ký Canh Tác & Xuất Vật Tư` (dòng 449), nhưng bên trong `Modal` (`isAddLogOpen`, dòng 574-640), giao diện **hoàn toàn chỉ có 5 trường nhập liệu văn bản**:
  1. `activityType` (Loại hoạt động canh tác)
  2. `logDate` (Ngày thực hiện)
  3. `stage` (Giai đoạn sinh trưởng)
  4. `phiDays` (Số ngày cách ly PHI nhập tay)
  5. `weatherNotes` (Ghi chú thời tiết)
- **HOÀN TOÀN THIẾU BẢNG CHỌN VẬT TƯ (`supplies`):**
  - Không có dropdown chọn Kho xuất vật tư (`warehouseId`).
  - Không có dropdown chọn Phân bón / Thuốc BVTV (`materialId`).
  - Không có dropdown chọn Số lô theo chuẩn FEFO (`batchNumber`).
  - Không có ô nhập Số lượng thực tế tiêu hao (`actualQuantity`, `unit`).
  - Không có gợi ý tự động thời gian cách ly `defaultPhiDays` từ danh mục thuốc để cảnh báo an toàn thực phẩm.
- **Hậu quả hệ thống:**
  - Backend `FarmingLogServiceImpl.java` (dòng 102-190) đã được lập trình cực kỳ hoàn hảo: Nếu nhận được `supplies`, service sẽ kiểm tra tồn khả dụng, trừ kho nguyên tử, tự động sinh Phiếu xuất kho `PXK-AUTO-CROP-...` tại WS-C, tạo bản ghi chi phí `farm_expenses` tại WS-H1, và cập nhật `phiEndDate` cho vụ mùa.
  - Tuy nhiên, vì Frontend chỉ gửi `{ seasonId, activityType, logDate, stage, phiDays, weatherNotes }` với `supplies: undefined`, toàn bộ khối logic tự động hóa nói trên **không bao giờ được chạy**!
  - Vật tư bón ra ruộng không bị trừ trong kho; chi phí phân thuốc không được hạch toán vào giá thành vụ mùa; công nhân phải tự tính nhẩm ngày cách ly PHI bằng tay.

---

### 2.2. Kiểm tra Cân Trọng Lượng Vật Nuôi (`GrowthAndHarvestTab.jsx` & `LivestockIndividualsTab.jsx`)
1. **Nút `[+ Ghi Cân Nặng]`:**
   - Trong `GrowthAndHarvestTab.jsx` (dòng 261-270):
     ```jsx
     <Can role={['ROLE_FIELD_STAFF', 'ROLE_TECHNICAL_STAFF', 'ROLE_FARM_MANAGER']}>
       <Button size="sm" variant="primary" icon={<Scale className="h-3.5 w-3.5" />} onClick={() => setIsWeightModalOpen(true)}>
         + Ghi Cân Nặng
       </Button>
     </Can>
     ```
     -> Nút bấm hiển thị đầy đủ cho `ROLE_FIELD_STAFF`.
   - Backend `POST /api/v1/farms/{farmId}/livestock/weigh-in` (`LivestockController.java`, dòng 171):
     `@PreAuthorize("hasAnyAuthority('PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VIEW') and @farmSecurity.canAccessFarm(#farmId)")`
     -> `ROLE_FIELD_STAFF` có quyền `PERM_LIVESTOCK_VIEW` nên gọi API ghi nhận cân nặng hoàn toàn thành công (201 Created).
2. **Tải danh sách cá thể RFID:**
   - API `GET /api/v1/farms/{farmId}/livestock-individuals` (`LivestockController.java`, dòng 93):
     `@PreAuthorize("(hasAnyAuthority('PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE') or ...) and @farmSecurity.canAccessFarm(#farmId)")`
     -> Cho phép `ROLE_FIELD_STAFF` (`PERM_LIVESTOCK_VIEW`) tải 100% danh sách thẻ tai để chọn cân cá thể theo mã RFID (INDIVIDUAL).

---

### 2.3. Lập Biên Bản Thu Hoạch Ngoài Ruộng / Xuất Chuồng (`GrowthAndHarvestTab.jsx` & `HarvestController.java`)
`ROLE_FIELD_STAFF` sở hữu quyền `PERM_HARVEST_MANAGE` để ghi nhận sản lượng thực thu ngoài đồng.

#### 2.3.1. Sai lệch định dạng dữ liệu (GAP-FIELD-04 - Fatal 400 Bad Request):
Khi công nhân điền form và bấm **`[Lưu Biên Bản Thu Hoạch]`**, đối chiếu dữ liệu giữa Frontend và Backend:

| Thuộc Tính Payload | Frontend Gửi Đi (`GrowthAndHarvestTab.jsx`, L115-121) | Backend Yêu Cầu (`CreateHarvestRecordRequest.java`) | Đánh Giá Hợp Chuẩn |
| :--- | :--- | :--- | :--- |
| **Nguồn thu hoạch** | *Không gửi (undefined)* | `@NotBlank String sourceType;`<br>Regex: `CROP_SEASON\|LIVESTOCK_GROUP` | ❌ **FAIL 400:** Vi phạm validation `@NotBlank`. Backend từ chối ngay lập tức. |
| **ID Vụ mùa** | `seasonId: item.id` | `Long seasonId;` | ✅ Khớp. |
| **Ngày thu hoạch** | `harvestDate: harvestForm.harvestDate` | `@NotNull LocalDate harvestDate;` | ✅ Khớp. |
| **Sản lượng** | `actualYieldKg: Number(...)` | `@NotNull @DecimalMin("0.01") BigDecimal quantity;` | ❌ **FAIL 400:** Sai tên trường! Backend yêu cầu `quantity`, Frontend gửi `actualYieldKg`. Giá trị `quantity` bị null -> Vi phạm `@NotNull`. |
| **Đơn vị tính** | *Không gửi (undefined)* | `@NotBlank String unit;` | ❌ **FAIL 400:** Vi phạm validation `@NotBlank`. |
| **Xếp loại phẩm cấp** | `qualityGrade: harvestForm.qualityGrade` | `@Pattern(regexp = "GRADE_A\|GRADE_B\|STANDARD\|REJECT")` | ❌ **RỦI RO 400:** Trong dropdown form (dòng 437) có tùy chọn `EXPORT`. Nếu công nhân chọn `EXPORT`, Backend ném lỗi vi phạm Pattern regex! |

> [!CAUTION]
> **HẬU QUẢ NGHIÊM TRỌNG:** Công nhân hiện trường bấm nút Lưu biên bản thu hoạch **LUÔN LUÔN BỊ LỖI HTTP 400 BAD REQUEST**! Toàn bộ sản lượng thu hoạch nông sản ngoài đồng không thể lưu vào cơ sở dữ liệu.

#### 2.3.2. Chốt chặn an toàn sinh học (PHI & Withdrawal Period):
- Trong `GrowthAndHarvestTab.jsx` (dòng 203-243), hệ thống đã hiển thị Banner cảnh báo màu đỏ trực quan khi đang trong thời gian cách ly thuốc BVTV hoặc kháng sinh: `CẢNH BÁO AN TOÀN SINH HỌC: ĐANG TRONG THỜI GIAN CÁCH LY THUỐC (Còn X ngày)`.
- Nút bấm `+ Ghi Nhận Sản Lượng Thu Hoạch` (dòng 343) đã được gắn cờ `disabled={isQuarantined}` kèm tooltip giải thích rõ ràng.
- Trong hàm `handleCreateHarvest` (dòng 109), có chốt chặn kiểm tra `if (isQuarantined) return;` trước khi gửi request.
- Tuy nhiên, phần thu hoạch hiện tại chỉ mới hỗ trợ cho Cây trồng (`sector === 'CROP'`). Chăn nuôi (`sector === 'LIVESTOCK'`) chưa có giao diện lập biên bản xuất bán / thu hoạch thịt tại tab này.

---

### 2.4. Kiểm Tra Tách Biệt Nhiệm Vụ (SoD) Tại Workspace E
Đã kiểm tra kỹ mã nguồn của 5 thành phần UI trong `E_FarmingOps`:
1. `[+ Mở Mùa Vụ Mới]` & `[Sửa Kế Hoạch Vụ]`: Được bọc trong `<Can permission="PERM_CROP_PLAN" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>` -> **ẨN 100%**.
2. `[Đóng Vụ Mùa]` & `[Xóa Mùa Vụ]`: Được bọc trong `<Can permission="PERM_CROP_PLAN" role="ROLE_FARM_MANAGER">` -> **ẨN 100%**.
3. `[+ Nhập Đàn Mới]` & `[Sửa Thông Tin Đàn]`: Được bọc trong `<Can permission="PERM_LIVESTOCK_MANAGE" role={["ROLE_TECHNICAL_STAFF", "ROLE_FARM_MANAGER"]}>` -> **ẨN 100%**.
4. `[Kết Thúc Đàn (SOLD)]` & `[Xóa Đàn Nuôi]`: Được bọc trong `<Can permission="PERM_LIVESTOCK_MANAGE" role="ROLE_FARM_MANAGER">` -> **ẨN 100%**.
5. `[+ Gắn Thẻ Tai RFID]` & `[Sửa/Xóa Thẻ Tai]`: Được bọc trong `<Can anyPermissions={['PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET']} ...>` -> **ẨN 100%**.
6. `[+ Ghi Sự Kiện Thú Y & Kê Đơn Thuốc]`: Được bọc trong `<Can permission="PERM_LIVESTOCK_VET" ...>` -> **ẨN 100%**.
7. `[+ Thêm/Sửa/Xóa Mẫu Việc Định Kỳ]`: Được bọc trong `<Can permission="PERM_TASK_ASSIGN" ...>` -> **ẨN 100%**.
8. `[Tiếp Nhận & Đóng Gói Lô Thành Phẩm]`: Được bọc trong `<Can permission="PERM_HARVEST_MANAGE" role={['ROLE_WAREHOUSE_STAFF', 'ROLE_FARM_MANAGER']}>` -> **ẨN 100% đối với công nhân**.

> **Kết luận SoD tại WS-E:** Toàn bộ 10 quyền hạn điều hành và giám sát kỹ thuật đều được khóa chặt và ẩn hoàn toàn đối với `ROLE_FIELD_STAFF`. Ranh giới phân quyền SoD tại WS-E được thiết kế rất chuẩn mực.

---

# PHẦN 3: KIỂM TRA WORKSPACE G (`G_EmployeeDailyOps`) — CHẤM CÔNG GPS, NGHỈ PHÉP/OT, NHẬN VIỆC & ĐIỂM DANH TỔ

### 3.1. Chấm Công GPS + Selfie 2 Đầu (`OneTapTimekeepingCard.jsx` & `TimeAttendanceController.java`)
1. **Dữ liệu gửi lên từ Frontend:**
   Khi công nhân bấm `[Check-in Vào Ca]` hoặc `[Check-out Tan Ca]`, `OneTapTimekeepingCard.jsx` (dòng 71-79) gửi payload:
   ```javascript
   const payload = {
     farmId: activeFarm.id,
     shiftId: todayShift?.id || 1,
     latitude: Number(effectiveLat.toFixed(6)),
     longitude: Number(effectiveLon.toFixed(6)),
     photoUrl: effectivePhoto,
     notes: effectiveNotes,
     deviceInfo: navigator.userAgent.substring(0, 100),
   };
   ```
   *Lưu ý:* Payload này không gửi `employeeId` (giá trị `employeeId = null`).
2. **Cơ chế phân giải nhân sự ở Backend (`TimeAttendanceServiceImpl.java`, dòng 560-568):**
   ```java
   private Employee resolveEmployee(Long tenantId, Long currentUserId, Long requestedEmployeeId) {
       if (requestedEmployeeId != null) {
           return employeeRepository.findById(requestedEmployeeId)...;
       }
       return employeeRepository.findByTenantIdAndUserId(tenantId, currentUserId)
               .orElseThrow(() -> new BusinessException("EMPLOYEE_PROFILE_REQUIRED", "Tài khoản hiện tại chưa được liên kết với hồ sơ nhân sự"));
   }
   ```
3. **Phát hiện lỗ hổng thiếu Seed dữ liệu (GAP-FIELD-06):**
   - Trong file migration khởi tạo hệ thống (`V1_0__init_system_core.sql`, dòng 2251), tài khoản mẫu `staff` (id 3) được tạo trong bảng `users`.
   - **Tuy nhiên, bảng `employees` hoàn toàn không có bất kỳ dòng dữ liệu nào!**
   - Do đó, nếu Farm Manager chưa vào WS-B để tạo hồ sơ nhân viên thủ công cho `Nguyễn Văn Nông Vụ` và gán `user_id = 3`, khi tài khoản `staff` bấm chấm công GPS, Backend sẽ ném lỗi ngay lập tức:
     `HTTP 400 Bad Request: EMPLOYEE_PROFILE_REQUIRED - Tài khoản hiện tại chưa được liên kết với hồ sơ nhân sự`.
   - Cần bổ sung bản ghi nhân sự cho `staff` trong cơ sở dữ liệu mẫu.

---

### 3.2. Xem Lịch Phân Ca & Gửi Đơn Nghỉ Phép / Tăng Ca
1. **Điểm nghẽn nghiêm trọng khi xem Lịch phân ca (GAP-FIELD-05 - Fatal 403 Forbidden):**
   - Tại `PersonalShiftScheduleCard.jsx`, frontend gọi API `GET /api/v1/hr/shifts/assignments?employeeId={empId}&workDate={date}`.
   - Kiểm tra `ShiftAssignmentController.java` (dòng 31-33):
     ```java
     @GetMapping("/assignments")
     @PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER', 'ROLE_ACCOUNTANT')")
     public ResponseEntity<List<ShiftAssignmentResponse>> getAssignments(...)
     ```
   - **Phân tích lỗi:** `ROLE_FIELD_STAFF` chỉ có quyền `PERM_HR_ATTENDANCE` và không có role nào trong danh sách trên!
   - **Hậu quả:** Công nhân hiện trường vào xem lịch phân ca của chính mình bị hệ thống chặn **HTTP 403 Forbidden**! Lịch làm việc tuần/tháng bị rỗng.
   - **Khắc phục:** Cần bổ sung `PERM_HR_ATTENDANCE` vào `@PreAuthorize` của endpoint `GET /api/v1/hr/shifts/assignments` trong `ShiftAssignmentController.java`.

2. **Gửi Đơn Xin Nghỉ Phép & Đăng Ký Tăng Ca:**
   - Endpoint `POST /api/v1/hr/leaves` và `POST /api/v1/hr/overtime` (`LeaveOvertimeController.java`, dòng 30, 61) sử dụng `@PreAuthorize("isAuthenticated()")`.
   - Payload gửi từ `LeaveRequestModal.jsx` (`farmId`, `employeeId`, `leaveType`, `startDate`, `endDate`, `totalDays`, `reason`) khớp 100% với `CreateLeaveRequest.java`.
   - Payload gửi từ `OvertimeRequestModal.jsx` (`farmId`, `employeeId`, `shiftId`, `otDate`, `startTime`, `endTime`, `totalHours`, `otMultiplier`, `reason`) khớp 100% với `CreateOvertimeRequest.java`.
   - Công nhân gửi đơn nghỉ phép và tăng ca OT hoàn toàn trơn tru.

---

### 3.3. Nhận Việc & Báo Cáo Hoàn Thành Nhiệm Vụ (`WorkerDailyTasksView.jsx`)
1. **Giao diện hiển thị:**
   - Trong `G_EmployeeDailyOps/index.jsx` (dòng 264-270), logic `fieldWorker ? <WorkerDailyTasksView ... /> : <PersonalTaskKanban ... />` hoạt động cực kỳ chính xác. Công nhân hiện trường được phục vụ riêng màn hình danh sách nhiệm vụ tối ưu hóa cho Mobile (`WorkerDailyTasksView`).
2. **Luồng nhận việc & báo cáo hoàn thành:**
   - **Bước 1 (Nhận việc):** Khi task ở trạng thái `TODO`, nút bấm to bản màu xanh `▶️ BẮT ĐẦU LÀM` (dòng 247-257) gọi `hrService.updateTaskStatus(taskId, { status: 'IN_PROGRESS' })`.
   - **Bước 2 (Báo cáo hoàn thành):** Khi task ở trạng thái `IN_PROGRESS`, nút bấm màu xanh ngọc `📸 CHỤP ẢNH BÁO CÁO HOÀN THÀNH` (dòng 261-274) mở `CompleteTaskModal.jsx`.
   - Công nhân nhập ghi chú kết quả, đính kèm ảnh hiện trường và bấm gửi -> Hệ thống chuyển trạng thái task sang `PENDING_REVIEW` (Chờ duyệt).
3. **Cơ chế bảo vệ SoD (Maker-Checker):**
   - Trên giao diện `WorkerDailyTasksView.jsx`, tuyệt đối không có bất kỳ nút bấm nào để `Nghiệm thu (DONE)`, `Sửa việc`, hay `Hủy việc`.
   - Ở Backend `FarmTaskServiceImpl.java` (dòng 223-233), có chốt chặn kiểm tra: Nếu request gửi `status == 'DONE'` hoặc `'CANCELLED'`, người thực hiện bắt buộc phải có quyền `PERM_TASK_ASSIGN` hoặc role Quản lý. Nếu công nhân cố tình can thiệp API, Backend sẽ chặn đứng bằng `AccessDeniedException`.

---

### 3.4. Trường Hợp Công Nhân Được Bổ Nhiệm Làm Trưởng Phân Khu (`ZONE_MANAGER`)
Nếu một công nhân có `ROLE_FIELD_STAFF` được Giám đốc trại giao phụ trách phân khu (`role_in_farm = 'ZONE_MANAGER'`):
1. **Hiển thị Bảng Điểm Danh Tổ (`TeamRollCallPanel.jsx`):**
   - Trong `G_EmployeeDailyOps/index.jsx` (dòng 253), component được bọc bởi:
     `<Can permission="PERM_HR_ATTENDANCE" role={['ROLE_FARM_MANAGER', 'ROLE_TECHNICAL_STAFF']} farmRole={['FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD']}>`
   - Nhờ có thuộc tính `farmRole` chứa `'ZONE_MANAGER'`, bảng điểm danh tổ sẽ tự động hiển thị cho công nhân này.
2. **Khả năng gọi API:**
   - Để tải danh sách tổ viên: Gọi `GET /api/v1/hr/employees`. `EmployeeController.java` (dòng 41) chấp nhận `PERM_HR_ATTENDANCE` -> **KHÔNG BỊ 403**.
   - Để submit điểm danh hàng loạt: Gọi `POST /api/v1/hr/attendance/batch-roll-call`. `TimeAttendanceController.java` (dòng 42) kiểm tra `@farmSecurity.canPerformBatchRollCall(#request.farmId)`.
   - Trong `FarmSecurityEvaluator.java` (dòng 155-158), câu lệnh SQL kiểm tra tường minh:
     `WHERE user_id = ? AND farm_id = ? AND role_in_farm IN ('FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD') AND is_active = TRUE`.
   - **Kết luận:** Trưởng phân khu cấp cơ sở thực hiện điểm danh hộ tổ viên hoàn toàn hợp lệ, không bị bất kỳ rào cản 403 nào!

---

# PHẦN 4: KIỂM TRA LUỒNG ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG GIỮA CÁC WORKSPACE & CÁC TÀI KHOẢN

### 4.1. Luồng Ghi Nhật Ký Canh Tác (WS-E) -> Kho (WS-C) & Chi Phí (WS-H1)
- **Thiết kế Backend:** Khi ghi nhật ký có vật tư, Backend tự động sinh phiếu xuất kho FEFO (WS-C), sinh bản ghi chi phí trong `farm_expenses` (WS-H1) và cập nhật ngày hết hạn cách ly thuốc `phi_end_date` (WS-E).
- **Thực tế:** Do lỗ hổng **GAP-FIELD-03** (Modal thiếu form chọn vật tư), luồng này hoàn toàn bị ngắt quãng. Tồn kho và chi phí không hề biến động sau khi công nhân lưu nhật ký.
- **Đồng bộ UI:** Sau khi gọi `createFarmingLog`, `FarmingLogsTimelineTab.jsx` chỉ kích hoạt `notifyDataChanged?.('all')` và `notifyDataChanged?.('seasons')`. Cần bổ sung thêm `notifyDataChanged?.('inventory')` và `notifyDataChanged?.('expenses')` để đồng bộ tức thời sang màn hình của Thủ kho và Kế toán.

---

### 4.2. Luồng Thu Hoạch Thực Địa (WS-E) -> Tiếp Nhận & Đóng Gói Lô (WS-C / WS-F)
- **Thực tế:** Do lỗ hổng **GAP-FIELD-04** (sai tên trường và thiếu sourceType dẫn tới lỗi 400 Bad Request), biên bản thu hoạch không thể tạo thành công.
- **Liên kết Lô thành phẩm (GAP-FIELD-07):** Modal `Tiếp Nhận & Đóng Gói Lô Thành Phẩm` (`GrowthAndHarvestTab.jsx`, dòng 140-150) tạo `ProductBatch` mà không truyền mảng `sourceHarvestRecordIds`. Thủ kho tiếp nhận lô hàng bằng cách gõ tay lại số lượng thay vì bấm nút "Tiếp nhận từ biên bản thu hoạch #XYZ", dẫn tới nguy cơ thất thoát và đứt gãy chuỗi truy xuất nguồn gốc nông sản.

---

### 4.3. Luồng Chấm Công, Nghỉ Phép/OT & Báo Cáo Việc (WS-G) -> Phê Duyệt (WS-B & WS-G)
- **Hiện trạng đồng bộ (GAP-FIELD-08):**
  1. Khi công nhân gửi đơn nghỉ phép (`LeaveRequestModal.jsx`) hoặc đơn làm thêm giờ (`OvertimeRequestModal.jsx`), modal chỉ gọi `onSuccess?.()` đóng form, hoàn toàn không gọi `notifyDataChanged('employees')` hoặc `notifyDataChanged('tasks')`.
  2. Khi công nhân báo cáo hoàn thành nhiệm vụ (`CompleteTaskModal.jsx`), trạng thái task chuyển sang `PENDING_REVIEW` nhưng cũng không thông báo cho `activeFarmStore`.
  3. Ở Backend, module HR (`LeaveOvertimeServiceImpl.java`, `FarmTaskServiceImpl.java`) không chèn bản ghi vào bảng `notifications` (#71).
  4. Màn hình của Giám đốc trang trại (`FarmManagerDailyOverview.jsx`) chỉ tải các chỉ số chờ duyệt 1 lần duy nhất khi chuyển farm. Khi công nhân nộp báo cáo ngoài đồng, số đếm trên thẻ "Đơn chờ duyệt" và "Việc chờ nghiệm thu" trên máy tính của Giám đốc trại không tự tăng lên, trừ khi Giám đốc bấm nút "Làm Mới".

---

# PHẦN 5: KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC (ACTIONABLE REMEDIATION ROADMAP)

Để đưa tài khoản `ROLE_FIELD_STAFF` đạt chuẩn 100% về cả RBAC, nghiệp vụ hiện trường, SoD và đồng bộ dữ liệu, đề xuất lộ trình xử lý theo 3 giai đoạn:

### Giai Đoạn 1: Vá Lỗi Lộ Ranh Giới Route Guard, Sidebar & Quyền Lịch Phân Ca (Ưu tiên Cao nhất)
1. **`menuConfig.js`:** Bổ sung `ALL_WORKSPACES.E_FarmingOps` vào `case 'FIELD_WORKER'` để công nhân có lối vào ghi nhật ký và thu hoạch.
2. **`routes.jsx`:** Loại bỏ `PERM_FARM_VIEW` khỏi các Route Guard của `/app/partners` và `/app/settings` để ngăn công nhân truy cập trái phép danh bạ đối tác và cấu hình doanh nghiệp.
3. **`ShiftAssignmentController.java`:** Bổ sung `PERM_HR_ATTENDANCE` vào `@PreAuthorize` của endpoint `GET /api/v1/hr/shifts/assignments` để công nhân xem được lịch phân ca cá nhân (khắc phục lỗi 403 Forbidden).
4. **`V1_0__init_system_core.sql`:** Bổ sung bản ghi `employees` mẫu cho tài khoản `staff` (`user_id = 3`, mã nhân viên `NV-FIELD-001`, họ tên `Nguyễn Văn Nông Vụ`) để đảm bảo chức năng chấm công GPS cá nhân chạy thành công 100%.

### Giai Đoạn 2: Nâng Cấp Form Crop Auto-Backflushing & Sửa Lỗi Thu Hoạch 400 Bad Request
1. **`GrowthAndHarvestTab.jsx`:**
   - Sửa hàm `handleCreateHarvest`: Đổi tên trường gửi lên từ `actualYieldKg` -> `quantity`; bổ sung `sourceType: 'CROP_SEASON'`; bổ sung `unit: 'KG'`.
   - Loại bỏ option `EXPORT` trong dropdown `qualityGrade` hoặc sửa Backend validator cho phép `EXPORT`.
   - Bổ sung nút bấm "Đóng gói lô từ đợt này" trên từng dòng bảng thu hoạch, tự động mở Modal đóng gói và điền sẵn `sourceHarvestRecordIds`.
2. **`FarmingLogsTimelineTab.jsx`:**
   - Nâng cấp Modal Ghi Nhật Ký Canh Tác (`isAddLogOpen`): Tái sử dụng bảng chọn vật tư xuất kho theo chuẩn FEFO tương tự như bên Modal Thú y (gồm: chọn Kho xuất, chọn Vật tư/Phân bón/Thuốc BVTV, chọn Số lô FEFO, nhập Số lượng xuất, tự động tính ngày cách ly `defaultPhiDays`).
   - Cập nhật hàm `handleCreateCropLog` gửi mảng `supplies` lên Backend để kích hoạt Crop Auto-Backflushing hoàn chỉnh.

### Giai Đoạn 3: Hoàn Thiện Luồng Đồng Bộ Dữ Liệu Tức Thời & Thông Báo Phê Duyệt
1. **Frontend Modals (`LeaveRequestModal`, `OvertimeRequestModal`, `CompleteTaskModal`):**
   - Kích hoạt `notifyDataChanged('employees')` và `notifyDataChanged('tasks')` ngay sau khi tạo đơn hoặc nộp báo cáo hoàn thành.
2. **`FarmManagerDailyOverview.jsx`:**
   - Đưa `syncTrigger?.employees` và `syncTrigger?.tasks` vào dependency array của `useEffect` để tự động làm mới số lượng đơn chờ duyệt và công việc chờ nghiệm thu trong ngày.
