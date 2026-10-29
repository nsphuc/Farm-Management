# BÁO CÁO KIỂM TOÁN HỆ THỐNG & GAP ANALYSIS TOÀN DIỆN
## ĐÁNH GIÁ CHỨC NĂNG TÀI KHOẢN `ROLE_FARM_MANAGER` (CẤP 3 - GIÁM ĐỐC / QUẢN LÝ TRANG TRẠI)
**Dự án:** Farm Management SaaS Multi-Tenant  
**Vai trò thẩm định:** Principal Software Architect  
**Mục tiêu:** Rà soát 100% chức năng Frontend (`frontend/src/`) & Backend (`backend/src/main/java/com/farm/saas/`) cho vai trò `ROLE_FARM_MANAGER`, phát hiện toàn bộ lỗ hổng phân quyền, điểm nghẽn UX/UI, nút thiếu/bị khóa sai, API thiếu, và dữ liệu giả định/mock/TODO.

---

## TỔNG QUAN VỊ TRÍ & QUYỀN HẠN CỦA `ROLE_FARM_MANAGER` (THEO RBAC MATRIX V1_4)
Theo thiết kế kiến trúc chuẩn phân quyền 4 cấp (`V1_4__standardize_4_tier_rbac_matrix.sql`), `ROLE_FARM_MANAGER` sở hữu **25 quyền hạn nghiệp vụ cốt lõi**:
- **Địa lý & Tổ chức:** `PERM_FARM_VIEW`, `PERM_FARM_UPDATE`, `PERM_ZONE_MANAGE`, `PERM_LOCATION_MANAGE` *(Không có `PERM_FARM_CREATE` do Farm Owner nắm giữ)*.
- **Nhân sự & Phân ca:** `PERM_HR_EMPLOYEE_VIEW`, `PERM_HR_EMPLOYEE_MANAGE`, `PERM_HR_SHIFT_MANAGE`, `PERM_HR_PAYROLL_VIEW`.
- **Kho & Vật tư:** `PERM_INVENTORY_VIEW`, `PERM_INVENTORY_RECEIPT`, `PERM_INVENTORY_ISSUE`, `PERM_INVENTORY_TRANSFER`, `PERM_INVENTORY_AUDIT`, `PERM_MATERIAL_MANAGE`.
- **Canh tác & Chăn nuôi:** `PERM_CROP_PLAN`, `PERM_CROP_EXECUTE`, `PERM_LIVESTOCK_MANAGE`, `PERM_TASK_ASSIGN`, `PERM_TASK_APPROVE`.
- **Chất lượng & Truy xuất:** `PERM_QC_VIEW`, `PERM_QC_APPROVE`, `PERM_TRACEABILITY_VIEW`.
- **Đối tác & Tài chính:** `PERM_PARTNER_MANAGE`, `PERM_EXPENSE_VIEW`, `PERM_EXPENSE_APPROVE`.
- **Các quyền không sở hữu (theo đúng đặc tả vai trò):**
  - `PERM_FARM_CREATE` (Chỉ Farm Owner - Cấp 2 mới được tạo thêm nông trại mới).
  - `PERM_CONFIG_SYSTEM` (Chỉ Farm Owner cấu hình pháp nhân doanh nghiệp, tài khoản ngân hàng Tenant).
  - `PERM_LIVESTOCK_VET` (Dành riêng cho Bác sĩ thú y / Kỹ sư dinh dưỡng - Cấp 4).
  - `PERM_QC_INSPECT` (Dành riêng cho KCS Inspector lập biên bản kiểm tra).
  - `PERM_PRICE_UPDATE` (Dành riêng cho Giám đốc kinh doanh / Farm Owner duyệt biểu giá bán sỉ).

---

# PHẦN 1: KIỂM TRA QUYỀN TRUY CẬP MENU & CÀI ĐẶT DANH MỤC (`/app/settings` & `menuConfig.js`)

### 1.1. Khả năng truy cập Menu cài đặt
- Trong `menuConfig.js` (dòng 115-120), mục **"Cài đặt hệ thống" (`/app/settings`)** được cấp quyền cho `roles: ['ROLE_FARM_OWNER', 'ROLE_FARM_MANAGER']`.
- Giám đốc trang trại nhìn thấy toàn bộ menu và truy cập được vào màn hình Cài đặt.

### 1.2. Hiện trạng các Tab trong `/app/settings` đối với `ROLE_FARM_MANAGER`
Trong `pages/settings/index.jsx`, giao diện render 9 Tab:
1. **Hồ sơ doanh nghiệp (`EnterpriseProfileTab`)**
2. **Chu kỳ & Cấu hình trại (`CyclesAndFarmSettingsTab`)**
3. **Danh mục cây trồng (`CropTypesTab`)**
4. **Giống vật nuôi (`LivestockBreedsTab`)**
5. **Kho bãi (`WarehousesTab`)**
6. **Vật tư & Thức ăn (`MaterialsTab`)**
7. **Định mức tiêu hao (`ConsumptionQuotasTab`)**
8. **Ca làm việc (`WorkShiftsTab`)**
9. **Danh mục chi phí (`CostCategoriesTab`)**

### 1.3. Bảng phân tích chi tiết Gaps & Lỗ hổng tại từng Tab Cài Đặt

| Tab Cài Đặt | Thao tác UI hiện có | Hiện trạng Phân quyền Backend & Frontend | Lỗ hổng & Điểm nghẽn (GAPs) | Mức độ nghiêm trọng |
| :--- | :--- | :--- | :--- | :--- |
| **Tab 1: EnterpriseProfileTab** | Xem & Lưu thông tin Pháp nhân, Thuế, Ngân hàng Napas | Nút lưu bọc `<Can permission="PERM_FARM_UPDATE">`. Backend `EnterpriseProfileController.java` dùng `@PreAuthorize("hasAuthority('PERM_FARM_UPDATE')")`. | **LỖ HỔNG BẢO MẬT MULTI-TENANT CỰC NGUY HIỂM:** `ROLE_FARM_MANAGER` có quyền `PERM_FARM_UPDATE` (để sửa cấu hình nông trại mình quản lý), nhưng vì Backend kiểm tra `PERM_FARM_UPDATE` trên API Tenant Profile `PUT /api/v1/enterprise/profile`, dẫn tới Giám đốc của 1 trang trại có thể ghi đè Mã số thuế, Tên pháp nhân công ty mẹ và Số tài khoản thụ hưởng của toàn bộ Tập đoàn. Tab này phải chuyển sang quyền `PERM_CONFIG_SYSTEM` (Chỉ Owner) hoặc ẩn/Read-only với Farm Manager. | **CRITICAL** |
| **Tab 2: CyclesAndFarmSettingsTab** | Thêm mới, Sửa Chu kỳ vận hành | Có nút `+ Thêm Chu Kỳ`, `Sửa`. Backend `FarmOperationsController.java` cho phép `PERM_FARM_UPDATE`. | 1. Khi TopBar chọn `"ALL"`, tab bị rỗng do `activeFarmId` không xác định (thiếu bộ chọn Farm nội bộ trong tab).<br>2. **Thiếu API Xóa / Hủy / Đổi trạng thái chu kỳ**: Backend không có endpoint `DELETE` hoặc `PATCH /cycles/{id}/status`. Khi tạo nhầm chu kỳ, Farm Manager không thể xóa hay hủy. | **HIGH** |
| **Tab 3: CropTypesTab** | Thêm mới, Sửa, Xóa Loại cây | UI có nút Thêm, Sửa, Xóa. Gọi `masterDataService.deleteCropType(id)`. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `CropTypeController.java` chỉ có `@GetMapping` và `@PostMapping`, hoàn toàn **KHÔNG CÓ `@DeleteMapping("/{id}")`**. Nút Xóa trên giao diện bấm vào chắc chắn báo lỗi 405! | **HIGH** |
| **Tab 4: LivestockBreedsTab** | Thêm mới, Sửa, Xóa Giống vật nuôi | UI có nút Thêm, Sửa, Xóa. Gọi `masterDataService.deleteLivestockBreed(id)`. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `LivestockBreedController.java` chỉ có `@GetMapping` và `@PostMapping`, hoàn toàn **KHÔNG CÓ `@DeleteMapping("/{id}")`**. | **HIGH** |
| **Tab 5: WarehousesTab** | Thêm kho, Sửa kho, Đổi trạng thái | Nút Thêm/Sửa bị bọc `<Can permission="PERM_INVENTORY_RECEIPT">` (Dòng 104). | 1. **Sai lệch phân quyền ngữ nghĩa:** Quản lý kho bãi thuộc danh mục cơ sở hạ tầng, nhưng lại dùng quyền "Nhập kho" (`PERM_INVENTORY_RECEIPT`). Cần chuẩn hóa sang `PERM_INVENTORY_VIEW` & `PERM_FARM_UPDATE`.<br>2. **Thiếu API Xóa kho:** Backend `WarehouseController.java` chỉ có GET/POST/PUT, không có `@DeleteMapping("/{warehouseId}")`. | **MEDIUM** |
| **Tab 6: MaterialsTab** | Thêm vật tư, Sửa vật tư, Xóa vật tư, Quản lý nhóm vật tư | UI có nút Thêm, Sửa, Xóa vật tư & danh mục. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `MaterialController.java` và `MaterialCategoryController.java` đều **KHÔNG CÓ `@DeleteMapping("/{id}")`**. Không thể xóa vật tư/danh mục rác khi nhập nhầm. | **HIGH** |
| **Tab 7: ConsumptionQuotasTab** | Thêm định mức, Sửa định mức, Xóa định mức | UI có nút Thêm, Sửa, Xóa. Gọi `masterDataService.deleteQuota(id)`. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `ConsumptionQuotaController.java` chỉ có GET/POST/PUT, **KHÔNG CÓ `@DeleteMapping("/{id}")`**. | **HIGH** |
| **Tab 8: WorkShiftsTab** | Thêm ca, Sửa ca, Xóa ca làm việc | UI có nút Thêm, Sửa, Xóa ca làm việc. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `WorkShiftController.java` chỉ có GET/POST/PUT, **KHÔNG CÓ `@DeleteMapping("/{id}")`**. | **HIGH** |
| **Tab 9: CostCategoriesTab** | Thêm danh mục chi phí, Sửa, Xóa | UI có nút Thêm, Sửa, Xóa danh mục chi phí. | **LỖI HTTP 405 METHOD NOT ALLOWED:** Backend `CostCategoryController.java` chỉ có GET/POST/PUT, **KHÔNG CÓ `@DeleteMapping("/{id}")`**. | **HIGH** |

---

# PHẦN 2: KIỂM TRA CÁC NÚT THAO TÁC & BẢNG DỮ LIỆU TRÊN 9 WORKSPACES

### 2.1. Workspace A: Bản đồ Địa lý & Phân vùng hạ tầng (`A_Geography`)
- **Sửa thông tin Nông trại (`FarmFormModal`):**
  - **Hiện trạng:** Backend `FarmController.java` cấp phép `PUT /api/v1/farms/{id}` cho `PERM_FARM_UPDATE` (Farm Manager có quyền này).
  - **Điểm nghẽn UI:** Trong `A_Geography/index.jsx` (dòng 607) và `MasterGeographicTree.jsx` (dòng 233), nút `[Sửa thông tin]` nông trại bị chặn cứng bởi logic:
    `{owner && (<Can permission="PERM_FARM_UPDATE">...)}`
    -> `ROLE_FARM_MANAGER` bị ẩn nút chỉnh sửa thông tin kỹ thuật nông trại mình quản lý (diện tích, tọa độ GPS, chuẩn canh tác).
- **Phân khu sản xuất (`ZoneFormModal`):**
  - `ROLE_FARM_MANAGER` tạo phân khu mới sẽ ở trạng thái `MAINTENANCE` (chờ Farm Owner duyệt `ACTIVE`).
  - Đã có đầy đủ nút Sửa phân khu và Xóa mềm phân khu (`DELETE /api/v1/zones/{id}`).
- **Vị trí / Lô / Ô / Chuồng (`LocationFormModal`):**
  - Đã có đầy đủ nút Thêm mới, Sửa thông tin, Xóa mềm vị trí (`DELETE /api/v1/locations/{id}`).
- **Phân công nhân sự (`StaffAssignmentPane.jsx` & `AssignmentModal.jsx`):**
  - Đã có nút gán nhân sự vào khu vực và nút hủy phân công (`DELETE /api/v1/staff-assignments/{id}`).
  - Backend `StaffAssignmentController.java` cấp quyền `PERM_HR_EMPLOYEE_MANAGE` (Farm Manager sở hữu).

---

### 2.2. Workspace B: Nhân sự & Hồ sơ năng lực 360 (`B_Personnel360`)
- **Sửa thông tin nhân viên:**
  - Trong `EmployeeDetailDrawer.jsx`, Farm Manager xem được hồ sơ chi tiết. Có nút cập nhật thông tin nhân viên qua `EmployeeFormModal`.
- **Cho thôi việc / Chấm dứt hợp đồng (`RESIGNED` / `TERMINATED`):**
  - Tại bảng danh sách `B_Personnel360/index.jsx`, đã có nút bấm chuyển trạng thái `RESIGNED`. Khi chuyển `RESIGNED`, Backend `EmployeeServiceImpl.java` tự động khóa tài khoản đăng nhập `user.status = 'LOCKED'`.
- **Khóa / Mở khóa tài khoản đăng nhập (`users.status`) & Đổi vai trò Cấp 4:**
  - **ĐIỂM NGHẼN:** Trong `EmployeeDetailDrawer.jsx` (Tab 2: Tài khoản & Hệ thống), **THIẾU HẲN NÚT THAO TÁC TRỰC TIẾP**:
    1. Không có nút gạt Khóa / Mở khóa tài khoản đăng nhập tức thì (chỉ xem trạng thái `ACTIVE` / `LOCKED`).
    2. Không có nút Thay đổi Role Cấp 4 (Công nhân, Kỹ sư, Thủ kho, KCS).
    3. Không có nút Reset mật khẩu cho nhân viên hiện trường.
- **Lịch phân ca (`ShiftScheduleTab.jsx`):**
  - Đã có nút `+ Phân Ca Làm Việc` (`POST /api/v1/hr/shifts/assignments`).
  - Đã có nút Hủy ca trực (`DELETE /api/v1/hr/shifts/assignments/{id}`).
  - **THIẾU:** Không có nút **Sửa lịch phân ca** (Đổi ca trực, đổi nhân viên thay thế). Backend `ShiftAssignmentController.java` cũng chưa có API `PUT /assignments/{id}`.

---

### 2.3. Workspace C: Điều phối & Quản trị kho (`C_InventoryHub`)
- **Tình trạng phân quyền tạo phiếu kho:**
  - **ĐIỂM NGHẼN BẢO THỦ TRÊN GIAO DIỆN:** Tại dòng 47 file `C_InventoryHub/index.jsx`:
    `const isReadOnly = Boolean(owner || farmManager);`
    Hệ thống mặc định gán `isReadOnly = true` cho cả Farm Owner lẫn Farm Manager!
  - Toàn bộ 4 nút hành động chính:
    1. `+ Lập Phiếu Kho` (Nhập kho)
    2. `+ Lập Phiếu Xuất Kho`
    3. `+ Lập Lệnh Điều Chuyển`
    4. `+ Mở Đợt Kiểm Kê`
    Đều bị bọc điều kiện `role="ROLE_WAREHOUSE_STAFF"`. Khi trang trại vắng Thủ kho hoặc trường hợp khẩn cấp, **Farm Manager hoàn toàn bị tước quyền tạo phiếu**, dù Backend RBAC cấp đầy đủ `PERM_INVENTORY_RECEIPT`, `PERM_INVENTORY_ISSUE`, `PERM_INVENTORY_TRANSFER`, `PERM_INVENTORY_AUDIT`.
- **Lỗi Mock Data / Placeholder rỗng:**
  - Ngay cả với Thủ kho, 4 nút trên đang gắn sự kiện:
    `onClick={() => alert('Thủ kho tạo phiếu ... (DRAFT)')}`!
    -> **HỆ THỐNG HOÀN TOÀN CHƯA CÓ CÁC MODAL LẬP PHIẾU NHẬP/XUẤT/ĐIỀU CHUYỂN/KIỂM KÊ TRÊN FRONTEND.**
- **Duyệt phiếu & Từ chối / Hủy phiếu kho:**
  - Bảng danh sách phiếu Nhập, Xuất, Điều chuyển, Kiểm kê hiển thị tốt.
  - Trong `ReceiptDetailDrawer.jsx` và `IssueDetailDrawer.jsx`, Farm Manager có nút **Duyệt (`APPROVE`)** hoạt động tốt.
  - **LỖI DTO KHI TỪ CHỐI / HỦY PHIẾU (HTTP 400 BAD REQUEST):**
    Trong `ReceiptDetailDrawer.jsx` (dòng 48) và `IssueDetailDrawer.jsx` (dòng 54), nút Hủy gọi `warehouseService.cancelReceipt(receipt.id)` không truyền body. Trong khi Backend `WarehouseReceiptController.java` yêu cầu DTO `@Valid CancelWarehouseReceiptRequest` với trường `@NotBlank cancellationReason`. Khi bấm Hủy sẽ bị lỗi 400 Validation Error do thiếu lý do hủy!
- **Kiểm kê kho (`StocktakeDetailDrawer.jsx`):**
  - Nút nhập số lượng kiểm kê thực tế đang là: `alert('Mở modal kiểm đếm thực tế')` -> Chưa có modal cập nhật số kiểm đếm.

---

### 2.4. Workspace D: Đối tác & Nhà cung cấp / Khách hàng (`D_Partners`)
- **Thêm & Sửa đối tác:** Đã có nút `+ Thêm Đối Tác` và `Sửa thông tin đối tác` (`PartnerModal.jsx`), gọi đúng API `POST`/`PUT /api/v1/partners`.
- **Duyệt hạn mức tín dụng:** Có nút `Duyệt hạn mức tín dụng` mở `ApproveCreditLimitModal.jsx`, gọi `POST /api/v1/partners/{id}/credit-limit/approve`.
- **Khóa / Mở khóa đối tác:** Có nút đưa vào danh sách đen/chặn giao dịch (`PATCH /api/v1/partners/{id}/blacklist`).
- **Xóa đối tác:** Đã có nút Xóa mềm (`DELETE /api/v1/partners/{id}`).
- **Sổ chi tiết công nợ (`PartnerDetailDrawer.jsx`):**
  - Tab 2 hiển thị các chỉ số tổng hợp (Hạn mức, Dư nợ, Nợ quá hạn).
  - **THIẾU:** Chưa có bảng danh sách lịch sử giao dịch/hóa đơn công nợ chi tiết (Ledger History Table) của đối tác đó trong Drawer.

---

### 2.5. Workspace E: Quản trị Canh tác & Chăn nuôi (`E_FarmingOps`)
- **Quản lý Mùa vụ Trồng trọt (`CropSeasonTab.jsx`):**
  - Đã có nút `+ Khởi Tạo Vụ Mùa`, `Sửa Vụ Mùa` (`CropSeasonModal.jsx`).
  - Đã có nút `Đóng Mùa Vụ` (`PATCH /api/v1/crop-seasons/{id}/status` -> `HARVESTED`).
  - Đã có nút `Hủy Mùa Vụ` (`DELETE /api/v1/crop-seasons/{id}`).
- **Quản lý Đàn nuôi (`LivestockGroupTab.jsx`):**
  - Đã có nút `+ Tiếp Nhận Đàn Mới`, `Sửa thông tin đàn` (`LivestockGroupModal.jsx`).
  - Đã có nút `Xuất Chuồng / Thanh Lý` và `Xóa Đàn Nuôi`.
- **Quản lý Cá thể RFID / Đeo thẻ tai (Individual Animal Tracking):**
  - **LỖ HỔNG LỚN NHẤT CỦA WORKSPACE E:**
    Backend `LivestockController.java` đã xây dựng đầy đủ toàn bộ API quản lý cá thể:
    - `POST /api/v1/livestock-individuals` (Khai báo thẻ tai RFID, ngày sinh, trọng lượng sơ sinh).
    - `GET /api/v1/livestock-individuals/group/{groupId}` (Danh sách cá thể theo đàn).
    - `POST /api/v1/livestock-individuals/{id}/weight-logs` (Ghi nhận cân nặng định kỳ).
    - `POST /api/v1/livestock-individuals/{id}/health-logs` (Ghi nhận bệnh lý, tiêm phòng).
    **Tuy nhiên trên Frontend hoàn toàn CHƯA CÓ UI/Tab/Modal nào để Giám đốc trại quản lý thẻ tai RFID và lịch sử cá thể!**
- **Lịch công việc định kỳ (`RoutineTaskTemplateTab.jsx`):**
  - Đã có nút Thêm mẫu công việc (`POST /api/v1/task-templates`) và Xóa mẫu (`DELETE /api/v1/task-templates/{id}`).
  - **THIẾU:** Chưa có nút **Sửa mẫu công việc định kỳ**.

---

### 2.6. Workspace F: KCS, Đóng gói & Truy xuất nguồn gốc (`F_QaTraceability`)
- **Bảng Kanban 6 cột & Chi tiết lô hàng:**
  - Hoạt động mượt mà, phân loại lô theo trạng thái từ DRAFT, INSPECTING, APPROVED, PACKAGED, EXPORTED đến RECALLED.
- **Xem biên bản KCS & Phê duyệt / Từ chối lô:**
  - Trong `BatchDetailDrawer.jsx`, Farm Manager xem được kết quả KCS từ kiểm định viên.
  - Có nút **Phê duyệt lô (`approveBatch`)** gọi `POST /api/v1/product-batches/{id}/approve`.
  - Có nút **Từ chối lô (`rejectBatch`)** mở `BatchRejectionModal.jsx` ghi nhận lý do phế phẩm và cách xử lý.
- **Mã QR & Snapshot truy xuất:**
  - Xem được cây phả hệ nguồn gốc, mùa vụ/đàn nuôi, vật tư sử dụng và chứng chỉ VietGAP/GlobalGAP.
- **Phát lệnh thu hồi khẩn cấp (`EmergencyRecallModal.jsx`):**
  - Farm Manager phát lệnh thu hồi toàn thị trường gọi `POST /api/v1/product-batches/{id}/recall`.
- **LỖI DTO IN TEM NHÃN TRUY XUẤT (HTTP 400):**
  - Trong `TraceabilityDetailDrawer.jsx`, nút `In Tem Nhãn` gọi `qaService.printLabel(batch.id)` với body rỗng. Backend `ProductBatchController.java` yêu cầu `@Valid PrintLabelRequest` gồm `@NotBlank labelSize` và `@NotNull printQuantity` -> Gây lỗi 400 Bad Request.

---

### 2.7. Workspace G: Nhật ký & Giám sát hiện trường (`G_EmployeeDailyOps`)
- **Màn hình tổng quan của Farm Manager (`FarmManagerDailyOverview.jsx`):**
  - Hiển thị 4 thẻ KPI: Tỷ lệ chuyên cần, Đơn nghỉ phép/tăng ca chờ duyệt, Lô hàng chờ KCS, Tiến độ hoàn thành công việc.
  - Phân tích chi tiết nhiệm vụ theo Phân khu và Kho bãi.
- **Bảng Kanban nhiệm vụ (`PersonalTaskKanban.jsx`):**
  - Hiển thị 4 cột: Cần làm (`TODO`), Đang làm (`IN_PROGRESS`), Chờ nghiệm thu (`PENDING_REVIEW`), Hoàn thành (`DONE`).
- **Nghiệm thu công việc (`ReviewTaskModal.jsx`):**
  - Farm Manager nghiệm thu công việc có hình ảnh bằng chứng, đánh giá đạt (chuyển `DONE`) hoặc yêu cầu làm lại (chuyển về `IN_PROGRESS` kèm nhận xét).
- **ĐIỂM NGHẼN:**
  - **Không có nút Sửa nhiệm vụ**: Khi phân công sai người hoặc sai thời hạn, Farm Manager không có nút chỉnh sửa trên thẻ Task.
  - **Không có nút Hủy nhiệm vụ (`CANCELLED`)**: Khi thời tiết xấu hoặc hủy kế hoạch, không có nút Hủy công việc.
  - Cột `CANCELLED` bị ẩn hoàn toàn, không có bộ lọc để xem lại các công việc đã hủy.

---

### 2.8. Workspace H1 & H2: Kế toán chi phí & Dòng tiền bán hàng (`H1_CostAccounting` & `H2_SalesCashflow`)

#### Workspace H1 (`H1_CostAccounting`):
- **Bảng chi phí (`MultiFarmExpenseSummary.jsx`):**
  - Farm Manager xem được hóa đơn, chứng từ chi phí (`ReceiptPhotoModal.jsx`).
  - Có nút `Phê Duyệt` chi phí trạng thái `DRAFT` chuyển sang `APPROVED`.
  - **THIẾU:** Chưa có nút **Từ chối / Hủy chi phí** kèm lý do khi chứng từ không hợp lệ.
  - Nút `+ Khai Báo Chi Phí` và `Phân Bổ Chi Phí` đang gán: `onClick={() => alert('Thủ kho/Kế toán tạo phiếu...')}` -> Chưa có Modal khai báo chi phí trực tiếp cho Quản lý trại.
- **Quản lý Ngân sách (`BudgetManagementTab.jsx`):**
  - Farm Manager có nút `Phê Duyệt Ngân Sách` (`BudgetApprovalModal.jsx`).
  - **THIẾU:** Chưa có nút **Hủy / Từ chối ngân sách**.

#### Workspace H2 (`H2_SalesCashflow`):
- **Đơn bán sỉ (`SalesOrderMonitorTab.jsx`):**
  - Đã có nút `Duyệt Đơn` (`confirmSalesOrder`) gọi `POST /api/v1/sales/orders/{id}/confirm`.
  - **THIẾU:** Chưa có nút **Hủy đơn / Từ chối đơn bán hàng** (`CANCEL`).
  - Nút `+ Tạo Đơn Bán Sỉ` đang gán: `alert('Nhân viên kinh doanh tạo đơn...')` -> Chưa có modal tạo đơn bán sỉ trực tiếp.
- **Giao hàng & Công nợ:**
  - Nút `+ Lập Phiếu Giao Hàng` và `Phân Bổ / Cấn Trừ Nợ` đang là `alert(...)`.
- **Kết toán chu kỳ sản xuất (`SettlementDetailDrawer.jsx`):**
  - Farm Manager có nút ký duyệt báo cáo kết toán chu kỳ (`POST /api/v1/finance/cycle-settlements/{id}/approve-settlement`).
  - Xem được chi tiết doanh thu, chi phí, biên lợi nhuận và hóa đơn thanh lý.

---

# PHẦN 3: KIỂM TRA LUỒNG DỮ LIỆU & DANH SÁCH API CÒN THIẾU / MOCK DATA / TODO

### 3.1. Danh sách các nút thao tác đang dùng `alert(...)` (Mock Dummy Button)
1. **Workspace C (`C_InventoryHub/index.jsx`):**
   - Nút `+ Lập Phiếu Kho`: `alert('Thủ kho tạo phiếu nhập kho (DRAFT)')`
   - Nút `+ Lập Phiếu Xuất Kho`: `alert('Thủ kho tạo phiếu xuất kho (DRAFT)')`
   - Nút `+ Lập Lệnh Điều Chuyển`: `alert('Thủ kho tạo lệnh điều chuyển kho (DRAFT)')`
   - Nút `+ Mở Đợt Kiểm Kê`: `alert('Thủ kho mở đợt kiểm kê mới')`
2. **Workspace C (`StocktakeDetailDrawer.jsx`):**
   - Nút `Nhập số lượng thực tế`: `alert('Mở modal kiểm đếm thực tế')`
3. **Workspace H1 (`MultiFarmExpenseSummary.jsx`):**
   - Nút `+ Khai Báo Chi Phí`: `alert('Mở modal khai báo chi phí')`
   - Nút `Phân Bổ Chi Phí`: `alert('Mở modal phân bổ chi phí gián tiếp')`
4. **Workspace H2 (`SalesOrderMonitorTab.jsx`):**
   - Nút `+ Tạo Đơn Bán Sỉ`: `alert('Mở modal tạo đơn hàng B2B')`
5. **Workspace H2 (`InvoiceAndDeliveryTab.jsx`):**
   - Nút `+ Lập Phiếu Giao Hàng`: `alert('Mở modal tạo lệnh vận chuyển')`
6. **Workspace H2 (`CustomerDebtTab.jsx`):**
   - Nút `+ Thu Tiền / Cấn Trừ Nợ`: `alert('Mở modal lập phiếu thu công nợ')`

---

### 3.2. Danh sách các API Backend bị thiếu (Missing Controller Endpoints)

| STT | Endpoint cần thiết | Phương thức | Module Controller tương ứng | Mục đích nghiệp vụ |
| :---: | :--- | :---: | :--- | :--- |
| **1** | `/api/v1/master/crop-types/{id}` | `DELETE` | `CropTypeController.java` | Xóa/Vô hiệu hóa loại cây trồng |
| **2** | `/api/v1/master/livestock-breeds/{id}` | `DELETE` | `LivestockBreedController.java` | Xóa/Vô hiệu hóa giống vật nuôi |
| **3** | `/api/v1/materials/{id}` | `DELETE` | `MaterialController.java` | Xóa/Vô hiệu hóa vật tư |
| **4** | `/api/v1/material-categories/{id}` | `DELETE` | `MaterialCategoryController.java` | Xóa nhóm vật tư |
| **5** | `/api/v1/farms/{farmId}/warehouses/{warehouseId}` | `DELETE` | `WarehouseController.java` | Xóa/Đóng kho bãi |
| **6** | `/api/v1/quotas/{id}` | `DELETE` | `ConsumptionQuotaController.java` | Xóa định mức tiêu hao |
| **7** | `/api/v1/hr/shifts/{id}` | `DELETE` | `WorkShiftController.java` | Xóa ca làm việc |
| **8** | `/api/v1/cost-categories/{id}` | `DELETE` | `CostCategoryController.java` | Xóa danh mục chi phí |
| **9** | `/api/v1/farms/{farmId}/operations/cycles/{id}` | `DELETE` | `FarmOperationsController.java` | Xóa/Hủy chu kỳ vận hành sai |
| **10** | `/api/v1/hr/shifts/assignments/{id}` | `PUT` | `ShiftAssignmentController.java` | Điều chỉnh ca trực nhân viên |
| **11** | `/api/v1/tasks/{id}` | `PUT` | `TaskExecutionController.java` | Sửa hạn chót, mô tả nhiệm vụ |
| **12** | `/api/v1/tasks/{id}/cancel` | `PATCH` | `TaskExecutionController.java` | Hủy nhiệm vụ hiện trường |
| **13** | `/api/v1/finance/expenses/{id}/reject` | `POST` | `ExpenseController.java` | Từ chối phiếu chi/hóa đơn sai |
| **14** | `/api/v1/finance/budgets/{id}/reject` | `POST` | `BudgetController.java` | Từ chối dự toán ngân sách |
| **15** | `/api/v1/sales/orders/{id}/cancel` | `POST` | `SalesOrderController.java` | Hủy đơn đặt hàng bán sỉ |

---

### 3.3. Danh sách lỗi Request DTO Mismatch (Frontend gọi không khớp Backend)

1. **Hủy phiếu nhập kho (`ReceiptDetailDrawer.jsx` -> `WarehouseReceiptController.java`):**
   - Frontend gửi: `POST /api/v1/warehouse/receipts/{id}/cancel` (Body rỗng).
   - Backend yêu cầu: `CancelWarehouseReceiptRequest` với `@NotBlank String cancellationReason`.
   - **Hậu quả:** Báo lỗi `400 Bad Request` trên giao diện người dùng.
2. **Hủy phiếu xuất kho (`IssueDetailDrawer.jsx` -> `WarehouseIssueController.java`):**
   - Frontend gửi: `POST /api/v1/warehouse/issues/{id}/cancel` (Body rỗng).
   - Backend yêu cầu: `CancelWarehouseIssueRequest` với `@NotBlank String cancellationReason`.
   - **Hậu quả:** Báo lỗi `400 Bad Request`.
3. **In tem nhãn truy xuất (`TraceabilityDetailDrawer.jsx` -> `ProductBatchController.java`):**
   - Frontend gửi: `POST /api/v1/product-batches/{id}/print-label` (Body rỗng).
   - Backend yêu cầu: `PrintLabelRequest` với `@NotBlank String labelSize` và `@NotNull Integer printQuantity`.
   - **Hậu quả:** Báo lỗi `400 Bad Request`.

---

# PHẦN 4: KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC (ACTION PLAN CHO BƯỚC CODE TIẾP THEO)

Để đưa tài khoản `ROLE_FARM_MANAGER` đạt mức độ hoàn thiện 100% không còn bất kỳ lỗi nào, lộ trình triển khai gồm 4 giai đoạn kỹ thuật:

### Giai đoạn 1: Bổ sung 15 API Backend còn thiếu & Chuẩn hóa DTOs
- Bổ sung các annotation `@DeleteMapping` và `@PutMapping` vào các Controller trong `modules/masterdata`, `modules/hr`, `modules/inventory`, `modules/farming`, `modules/finance`.
- Triển khai logic kiểm tra ràng buộc toàn vẹn dữ liệu (Integrity Check) trước khi xóa mềm (ví dụ: Không cho xóa Loại vật tư nếu đã phát sinh phiếu kho; Không cho xóa Giống nếu đang có đàn nuôi `ACTIVE`).
- Khắc phục lỗ hổng phân quyền tại `EnterpriseProfileController.java` (yêu cầu `PERM_CONFIG_SYSTEM` thay vì `PERM_FARM_UPDATE`).

### Giai đoạn 2: Chuẩn hóa & Mở khóa Phân quyền trên Frontend Settings & Workspaces
- Mở khóa nút `[Sửa thông tin]` nông trại trong Workspace A cho `ROLE_FARM_MANAGER` (`PERM_FARM_UPDATE`).
- Bỏ cờ `isReadOnly = Boolean(owner || farmManager)` trong Workspace C, cho phép Farm Manager tự tạo phiếu kho khi cần thiết.
- Khắc phục phân quyền Tab 5 Settings từ `PERM_INVENTORY_RECEIPT` về `PERM_INVENTORY_VIEW`.
- Thêm Modal nhập lý do hủy (Prompt/Modal dialog) trước khi gọi API Hủy phiếu kho và In tem nhãn với đầy đủ body DTO.

### Giai đoạn 3: Hiện thực hóa các Modal tạo nghiệp vụ thay cho `alert(...)`
- Xây dựng 4 Modal hoàn chỉnh cho Workspace C: `CreateReceiptModal`, `CreateIssueModal`, `CreateTransferModal`, `CreateStocktakeModal`.
- Xây dựng Modal tạo chi phí nhanh `CreateExpenseModal` trong Workspace H1.
- Xây dựng Modal tạo đơn bán sỉ `CreateSalesOrderModal` trong Workspace H2.

### Giai đoạn 4: Hoàn thiện tính năng Quản lý Cá thể RFID trong Workspace E
- Bổ sung Tab con hoặc Modal quản lý cá thể thẻ tai RFID trong `LivestockGroupTab.jsx`.
- Kết nối trực tiếp vào các endpoint sẵn có của `LivestockController.java`.

---

