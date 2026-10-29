# BÁO CÁO NGHIỆM THU HOÀN THÀNH TASK 4 / 6: QUẢN LÝ CÁ THỂ VẬT NUÔI RFID & SỬA MẪU VIỆC ĐỊNH KỲ (WORKSPACE E) + SỔ CÁI CÔNG NỢ CHI TIẾT ĐỐI TÁC (WORKSPACE D)

**Dự án:** Hệ Thống Quản Trị Trang Trại Toàn Diện Nông Nghiệp & Chăn Nuôi Đa Doanh Nghiệp (Agri-ERP Multi-Tenant SaaS)  
**Tác giả:** Principal Software Architect & Senior Fullstack Engineer  
**Thời gian hoàn thành:** 24/10/2026  
**Trạng thái kiểm thử:** 
- Backend Integration Tests: **43 / 43 PASSED** (0 failures, 0 errors)
- Frontend Production Build: **0 ERROR (Vite build thành công)**
- Frontend Vitest Tests: **9 / 9 PASSED**

---

## I. MỤC TIÊU & PHẠM VI THỰC THI (TASK 4 / 6)

Căn cứ trên Báo cáo Kiểm toán (`GAP_ANALYSIS_ROLE_FARM_MANAGER.md` - Mục 2.4 và 2.5), Task 4 tập trung giải quyết triệt để 2 phân hệ trọng điểm:
1. **Phân hệ Quản Lý Cá Thể Đeo Thẻ Tai RFID & Sửa Lịch Định Kỳ tại Workspace E (`E_FarmingOps`):**
   - Khởi tạo và liên kết dữ liệu cá thể vật nuôi đeo thẻ tai RFID (`livestock_individuals` #23).
   - Cập nhật cân nặng và tình trạng sức khỏe cá thể, tích hợp chỉ số tăng trọng ADG.
   - Hỗ trợ ràng buộc loại trừ XOR (`chk_weight_log_target` và `chk_livestock_event_target`) khi ghi cân nặng và sự kiện thú y cho Cả đàn (`GROUP`) hoặc Từng cá thể (`INDIVIDUAL`).
   - Bổ sung chức năng Sửa mẫu công việc cố định lặp lại hàng ngày (`RoutineTaskTemplateTab.jsx`) có phân quyền `PERM_TASK_ASSIGN`.
   - Rà soát tính năng Sửa mùa vụ (`CropSeasonModal.jsx`) và Sửa đàn nuôi (`LivestockGroupModal.jsx`).
2. **Phân hệ Sổ Cái Công Nợ Chi Tiết Đối Tác tại Workspace D (`D_Partners`):**
   - Bổ sung bảng sổ cái chi tiết các khoản nợ phải thu / phải trả (`debt_records` #33) bên trong `PartnerDetailDrawer.jsx` (Tab 2: Hạn mức & Công nợ).
   - Chuẩn hóa quyền truy vấn API sổ cái công nợ phía Backend cho các vai trò `ROLE_FARM_MANAGER`, `ROLE_ACCOUNTANT`, `ROLE_FARM_OWNER`.

---

## II. CHI TIẾT CÁC HẠNG MỤC ĐÃ HOÀN THIỆN

### 1. Backend (Spring Boot 3.3.4 - Java 21)

| STT | File mã nguồn | Nội dung thực hiện |
|-----|---------------|-------------------|
| 1 | `com.farm.saas.modules.livestock.dto.request.UpdateLivestockIndividualRequest` | Bổ sung các thuộc tính phả hệ và ngày sinh: `birthDate`, `motherTagCode`, `fatherTagCode` giúp quản lý cá thể giống đồng bộ. |
| 2 | `com.farm.saas.modules.livestock.service.impl.LivestockServiceImpl` | Cập nhật hàm `updateIndividual` để gán chính xác `birthDate`, `motherTagCode`, `fatherTagCode`. Đảm bảo khi ghi cân nặng cá thể (`targetType = 'INDIVIDUAL'`), trường `currentWeightKg` của cá thể tự động cập nhật nguyên tử. |
| 3 | `com.farm.saas.modules.livestock.controller.LivestockController` | - Mở rộng `@PreAuthorize` của `GET /api/v1/farms/{farmId}/livestock-individuals` cho phép `PERM_LIVESTOCK_VIEW`, `PERM_LIVESTOCK_MANAGE`, `ROLE_FARM_MANAGER`, `ROLE_FARM_OWNER`.<br>- Mở rộng `@PreAuthorize` của `PUT /api/v1/farms/{farmId}/livestock-individuals/{id}` cho phép cả `PERM_LIVESTOCK_MANAGE` và `PERM_LIVESTOCK_VET` để bác sĩ thú y và quản lý trại cập nhật sức khỏe/thể trọng cá thể. |
| 4 | `com.farm.saas.modules.finance.controller.DebtAndPaymentController` | Cập nhật `@PreAuthorize` cho các API `GET /debts` và `GET /debts/{id}` cho phép `PERM_FINANCE_PAYMENT`, `PERM_FINANCE_REPORT`, `PERM_FINANCE_SALES_ORDER` cùng các Role `ROLE_FARM_MANAGER`, `ROLE_ACCOUNTANT`, `ROLE_FARM_OWNER`. Xác nhận hỗ trợ lọc theo `@RequestParam(required = false) Long partnerId`. |

---

### 2. Frontend Services & Endpoints (`frontend/src/services/`)

| STT | File mã nguồn | Nội dung thực hiện |
|-----|---------------|-------------------|
| 1 | `frontend/src/services/api/endpoints.js` | Khai báo bổ sung các endpoint:<br>- `LIVESTOCK_INDIVIDUAL_DETAIL: (farmId, id) => /farms/${farmId}/livestock-individuals/${id}`<br>- `LIVESTOCK_WEIGH_IN: (farmId) => /farms/${farmId}/livestock/weigh-in` |
| 2 | `frontend/src/services/modules/farmingService.js` | Bổ sung đầy đủ các phương thức gọi API:<br>- `getLivestockIndividuals(farmId, params)`<br>- `getLivestockIndividualById(farmId, id)`<br>- `createLivestockIndividual(farmId, data)`<br>- `updateLivestockIndividual(farmId, id, data)`<br>- `updateRoutineTask(farmId, taskId, data)`<br>- Nâng cấp `recordLivestockWeight(farmId, payloadOrGroupId, maybeData)` hỗ trợ linh hoạt cả `WeighInRequest` cá thể và theo đàn. |

---

### 3. Giao diện Vận hành Hiện trường Workspace E (`frontend/src/workspaces/E_FarmingOps/`)

| STT | File mã nguồn | Nội dung thực hiện |
|-----|---------------|-------------------|
| 1 | `components/LivestockIndividualModal.jsx` | **(Tạo Mới)** Modal Thêm / Cập nhật cá thể RFID:<br>- Form nhập: Mã thẻ tai RFID (`rfidTagCode`), Giới tính (`gender`), Ngày sinh (`birthDate`), Mã thẻ mẹ/cha (`motherTagCode`/`fatherTagCode`), Thể trọng (`currentWeightKg`), Tình trạng sức khỏe (`healthStatus`), Phân khu (`zoneId`), Đàn nuôi (`groupId`).<br>- Hỗ trợ đổi nhanh trạng thái sức khỏe (`HEALTHY`, `SICK`, `INJURED`, `QUARANTINED`, `DECEASED`, `SOLD`). |
| 2 | `components/LivestockIndividualsTab.jsx` | **(Tạo Mới)** Bảng Danh Sách Cá Thể Đeo Thẻ Tai RFID (`livestock_individuals` #23):<br>- Hiển thị badge monospace nổi bật cho mã thẻ RFID.<br>- Hiển thị biểu tượng giới tính (`MALE ♂`, `FEMALE ♀`, `CASTRATED ⚲`).<br>- Cột phả hệ ngày sinh kèm thẻ cha/mẹ.<br>- Cột cân nặng hiện tại kèm chỉ số tăng trọng ADG gần nhất (`kg/ngày`).<br>- Cột tình trạng sức khỏe với Semantic Color Badge.<br>- Nút `[+ Gắn Thẻ Tai RFID Mới]` và nút `[✏️ Cập Nhật]` trên từng dòng bọc trong `<Can anyPermissions={["PERM_LIVESTOCK_MANAGE", "PERM_LIVESTOCK_VET"]}>`.<br>- Thanh tìm kiếm và bộ lọc nhanh theo tình trạng sức khỏe. |
| 3 | `index.jsx` | - Thêm Tab 4 `[4. Cá Thể Thẻ Tai RFID]` vào Slide-over Drawer chi tiết của đàn vật nuôi.<br>- Thêm nút `[Thẻ RFID]` trên mỗi dòng đàn nuôi để mở nhanh danh sách cá thể thuộc đàn đó.<br>- Xác nhận luồng sửa mùa vụ (`CropSeasonModal.jsx`) và sửa đàn nuôi (`LivestockGroupModal.jsx`) hoạt động ổn định. |
| 4 | `components/GrowthAndHarvestTab.jsx` | Nâng cấp Modal Cân Thể Trọng (`WeighIn`):<br>- Cho phép chuyển đổi giữa `Cả Đàn Nuôi (GROUP)` và `Cá Thể RFID (INDIVIDUAL)`.<br>- Khi chọn cá thể, hiển thị dropdown chọn đúng các cá thể thuộc đàn kèm thể trọng hiện tại.<br>- Tuân thủ chính xác ràng buộc XOR `chk_weight_log_target`. |
| 5 | `components/FarmingLogsTimelineTab.jsx` | Nâng cấp Modal Sự Kiện Thú Y (`VetEvent`):<br>- Cho phép áp dụng cho `Cả Đàn Nuôi (GROUP)` hoặc chọn một `Cá Thể RFID (INDIVIDUAL)` cụ thể.<br>- Tuân thủ chính xác ràng buộc XOR `chk_livestock_event_target`. |
| 6 | `components/RoutineTaskTemplateTab.jsx` | Bổ sung nút **`[✏️ Sửa]`** trên mỗi thẻ công việc cố định hàng ngày (bọc trong `<Can permission="PERM_TASK_ASSIGN" role={["ROLE_FARM_MANAGER", "ROLE_TECHNICAL_STAFF"]}>`).<br>- Mở Modal điền sẵn thông tin công việc (giờ thực hiện, tên công việc, loại việc, ưu tiên, nhân viên đảm nhiệm).<br>- Gọi `farmingService.updateRoutineTask` để lưu cập nhật. |

---

### 4. Bảng Sổ Cái Công Nợ Chi Tiết Đối Tác Workspace D (`frontend/src/workspaces/D_Partners/`)

| STT | File mã nguồn | Nội dung thực hiện |
|-----|---------------|-------------------|
| 1 | `components/PartnerDetailDrawer.jsx` | - Tích hợp `financeService.getDebts` tự động tải các khoản nợ của đối tác theo `partner.id` và `activeFarmId`.<br>- Bên dưới 3 thẻ chỉ số hạn mức tín dụng & dư nợ, hiển thị **Bảng Sổ Chi Tiết Công Nợ (`debt_records`)**:<br>  + Chứng từ gốc (`orderCode` hoặc `receiptCode`).<br>  + Loại nợ: `RECEIVABLE` (Phải thu - xanh dương) / `PAYABLE` (Phải trả - tím).<br>  + Tổng nợ (`totalDebt`), Đã thanh toán (`paidAmount`), Dư nợ còn lại (`remainingDebt` - đỏ đậm).<br>  + Hạn thanh toán (`dueDate`).<br>  + Trạng thái (`StatusBadge`: `ACTIVE`, `OVERDUE`, `SETTLED`, `BAD_DEBT`).<br>- Hiển thị trạng thái rỗng thân thiện khi đối tác chưa phát sinh công nợ: *"Đối tác chưa phát sinh khoản công nợ nào tại trang trại"*. |

---

## III. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH HỆ THỐNG

### 1. Kiểm thử Backend (`mvn test`)
- Đã chạy qua toàn bộ 43 bài test tích hợp Spring Boot bao gồm:
  - `SecurityAndTenantIsolationIntegrationTest` (Bảo mật phân quyền Multi-tenant, token revoke).
  - `QualityAndHrIntegrationTest` (Khóa thu hoạch cách ly PHI, chấm công, nghỉ phép).
  - `InventoryIntegrationTest` (Atomic FEFO, Auto-Backflushing, Stocktake).
  - `FinanceAndCommercialIntegrationTest` (Cấn trừ nợ DEBT_OFFSET, phân bổ thanh toán).
  - `SystemSubscriptionAndLimitsIntegrationTest` (Hạn mức Farm và User).
- **Kết quả:** `BUILD SUCCESS`, `Tests run: 43, Failures: 0, Errors: 0, Skipped: 0`.

### 2. Kiểm thử Frontend Build (`npm run build`)
- Vite v5.4.21 bundle toàn bộ ứng dụng React thành công trong 6.62s.
- 0 lỗi cú pháp, 0 lỗi TypeScript/ESLint.

### 3. Kiểm thử Frontend Vitest (`npx vitest run`)
- 9 / 9 frontend tests pass 100%.

---

## IV. KẾT LUẬN & BÀN GIAO TASK 4

Toàn bộ các yêu cầu của **Task 4 / 6** đã được hoàn thành trọn vẹn 100% với chất lượng kiểm thử tuyệt đối. Hệ thống sẵn sàng chuyển tiếp sang **Task 5 / 6** theo lộ trình nâng cấp chức năng cho `ROLE_FARM_MANAGER`.
