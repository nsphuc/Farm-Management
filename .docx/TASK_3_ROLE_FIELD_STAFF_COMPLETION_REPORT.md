# BÁO CÁO THỰC THI & HOÀN TẤT TASK 3 / 3 - ROLE_FIELD_STAFF
**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Đối tượng kiểm toán & nghiệm thu:** Tài khoản Cấp 4 — `ROLE_FIELD_STAFF` (Nhân viên / Công nhân Hiện trường — user mẫu `staff`)  
**Chức năng nâng cấp:** Sửa Lỗi HTTP 400 Biên Bản Thu Hoạch (Trồng Trọt & Chăn Nuôi), Liên Kết Đóng Gói Lô Truy Xuất Nguồn Gốc & Đồng Bộ Thông Báo Thực Thi Thời Gian Thực (WS-G -> WS-B / Quản Lý Trại)  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Ngày thực hiện:** 26/10/2026  
**Mã lỗ hổng giải quyết:** `GAP-FIELD-04`, `GAP-FIELD-07`, `GAP-FIELD-08` (Tổng kết hoàn tất trọn vẹn 8/8 mã `GAP-FIELD-01` -> `GAP-FIELD-08`)

---

## I. TỔNG HỢP TIẾN ĐỘ NGHIỆM THU TOÀN DIỆN VAI TRÒ `ROLE_FIELD_STAFF` (8/8 GAPS)

| Mã Lỗ Hổng | Tên Nghiệp Vụ / Lỗ Hổng | Task Thực Hiện | Trạng Thái Trước | Trạng Thái Sau Nghiệm Thu |
| :---: | :--- | :---: | :---: | :---: |
| **`GAP-FIELD-01`** | Thiếu Menu WS-E trên Sidebar của Field Worker | Task 1 | ❌ Chỉ có WS-G, thiếu WS-E để ghi nhật ký canh tác & thu hoạch |  **HOÀN TẤT (100%)** — Sidebar hiển thị đúng 2 Workspaces (`WS-G` & `WS-E`), ẩn toàn bộ menu quản trị & cài đặt |
| **`GAP-FIELD-02`** | Lỗ hổng SoD Route Guards do `PERM_FARM_VIEW` làm vé vạn năng | Task 1 | ❌ Field Worker có thể gõ URL lọt vào WS-A, WS-D, Settings |  **HOÀN TẤT (100%)** — Siết chặt Route Guards, loại bỏ triệt để `PERM_FARM_VIEW` khỏi các route nhạy cảm |
| **`GAP-FIELD-03`** | Modal Ghi Nhật Ký chưa hỗ trợ xuất vật tư, định mức BOM & PHI | Task 2 | ❌ Modal chỉ ghi text đơn thuần, không trừ kho, không khóa PHI |  **HOÀN TẤT (100%)** — Modal liên thông Crop Auto-Backflushing WS-E -> WS-C -> WS-H1, FEFO batch, khóa thu hoạch PHI |
| **`GAP-FIELD-04`** | Lỗi HTTP 400 khi Lập Biên Bản Thu Hoạch & Xuất Chuồng | Task 3 | ❌ Lệch DTO (`actualYieldKg` vs `quantity`), thiếu `sourceType`, cứng nhắc `qualityGrade` |  **HOÀN TẤT (100%)** — Chuẩn hóa DTO 2 chiều, tự suy diễn `sourceType`, chuẩn hóa `qualityGrade`, hỗ trợ cả Trồng trọt & Chăn nuôi |
| **`GAP-FIELD-05`** | Lỗi HTTP 403 Forbidden khi xem Lịch phân ca cá nhân | Task 1 | ❌ Chặn GET `/api/v1/hr/shifts/assignments` đối với Field Staff |  **HOÀN TẤT (100%)** — Nới lỏng quyền xem lịch ca cá nhân, giữ chặt quyền phân công/sửa ca của Quản lý |
| **`GAP-FIELD-06`** | Lỗi HTTP 400 EMPLOYEE_PROFILE_REQUIRED khi Chấm công / Nghỉ phép | Task 1 | ❌ Tài khoản `staff` chưa có dòng trong bảng `employees` |  **HOÀN TẤT (100%)** — Bảo vệ 2 lớp: `HrDataCleanupRunner` auto-seed khi boot app + cơ chế tự phục hồi trong Service |
| **`GAP-FIELD-07`** | Đứt gãy liên kết Biên bản Thu hoạch sang Đóng gói Lô KCS | Task 3 | ❌ Tạo lô thành phẩm không liên kết `sourceHarvestRecordIds` |  **HOÀN TẤT (100%)** — Nút `[📦 Đóng Gói Lô]`, tự động liên kết bảng `product_batch_sources` (#42), đảm bảo truy xuất nguồn gốc 100% |
| **`GAP-FIELD-08`** | Thiếu đồng bộ thời gian thực & thông báo từ WS-G sang WS-B / Quản lý | Task 3 | ❌ Gửi đơn nghỉ phép, OT, nộp việc xong Quản lý không nhận được thông báo, KPI không nhảy |  **HOÀN TẤT (100%)** — Bắn `Notification` tự động 2 chiều, kích hoạt `syncTrigger` đa kênh cập nhật tức thì KPI Quản lý trại |

---

## II. CHI TIẾT CÁC THAY ĐỔI TRONG TASK 3 / 3

### 1. Backend: Chuẩn hóa Lập Biên Bản Thu Hoạch & Liên Kết Lô Thành Phẩm (`GAP-FIELD-04`, `GAP-FIELD-07`)

#### a. `CreateHarvestRecordRequest.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/quality/dto/request/CreateHarvestRecordRequest.java`
- **Các cải tiến kỹ thuật:**
  - Bổ sung `@JsonIgnoreProperties(ignoreUnknown = true)`.
  - Hỗ trợ `@JsonAlias({"actualYieldKg", "yieldKg", "harvestQuantity"})` cho trường `quantity` (`@NotNull @DecimalMin("0.01")`).
  - Hỗ trợ `@JsonAlias({"cropSeasonId", "seasonId"})` cho `seasonId`, và `@JsonAlias({"groupId", "livestockGroupId"})` cho `livestockGroupId`.
  - Tự động suy diễn `sourceType` nếu không được truyền lên:
    - Nếu `seasonId != null` -> tự động gán `"CROP_SEASON"`.
    - Nếu `livestockGroupId != null` -> tự động gán `"LIVESTOCK_GROUP"`.
  - Tự động gán mặc định `unit = "KG"` nếu để trống hoặc null.
  - Xử lý chuẩn hóa phẩm cấp chất lượng `qualityGrade`: Khi Frontend gửi `"EXPORT"` hoặc biến thể, setter/getter tự động chuẩn hóa về `"GRADE_A"` để tuân thủ tuyệt đối ràng buộc cơ sở dữ liệu (`'GRADE_A'`, `'GRADE_B'`, `'STANDARD'`, `'REJECT'`).
  - Hỗ trợ trường `lossPercentage` (tỷ lệ hao hụt %), `harvestedByEmployeeId`, và `notes`.

#### b. `ProductBatchSourceRepository.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/quality/repository/ProductBatchSourceRepository.java`
- **Bổ sung:** Phương thức truy vấn `List<ProductBatchSource> findByHarvestRecordId(Long harvestRecordId);` cho phép tra cứu lô thành phẩm tương ứng đã đóng gói từ đợt thu hoạch.

#### c. `HarvestRecordDetailResponse.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/quality/dto/response/HarvestRecordDetailResponse.java`
- **Bổ sung:** Các trường `productBatchId`, `productBatchCode`, `lossPercentage`, cùng phương thức tương thích ngược `getActualYieldKg()`.

#### d. `HarvestServiceImpl.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/quality/service/impl/HarvestServiceImpl.java`
- **Nghiệp vụ cốt lõi:**
  1. **Khóa chốt chặn an toàn sinh học 2 lớp:**
     - Với `CROP_SEASON`: Kiểm tra ngày cách ly an toàn thuốc BVTV qua `farmingLogRepository.findMaxPhiEndDateBySeasonId(seasonId)`. Nếu `harvestDate <= maxPhiEndDate`, lập tức ném lỗi `BusinessException("HARVEST_BLOCKED_BY_PHI", "Mùa vụ đang trong thời gian cách ly an toàn nông dược (PHI đến ngày " + maxPhiEndDate + ")")`.
     - Với `LIVESTOCK_GROUP`: Kiểm tra thời gian cách ly ngưng thuốc thú y qua `livestockEventRepository.findMaxWithdrawalEndDateByGroupId(groupId)`. Nếu `harvestDate <= maxWithdrawalEndDate`, ném lỗi `BusinessException("HARVEST_BLOCKED_BY_WITHDRAWAL", "Đàn nuôi đang trong thời gian cách ly ngưng thuốc thú y đến hết ngày " + maxWithdrawalEndDate)`.
  2. **Cập nhật mùa vụ:** Tự động cộng dồn sản lượng vào `cropSeason.actualYieldKg`, chuyển trạng thái vụ từ `GROWING` sang `HARVESTING`, và ghi nhận `actualHarvestDate`.
  3. **Tự động bắn Notification:** Sau khi lưu biên bản thu hoạch thành công, hệ thống tự động bắn thông báo loại `QC` tới Giám đốc trang trại (`farm.getManagerUserId()`) và Thủ kho (`userRepository.findByUsername("warehouse")`) thông báo có đợt thu hoạch mới sẵn sàng tiếp nhận đóng gói lô.
  4. **Ánh xạ lô thành phẩm:** Tra cứu `productBatchSourceRepository.findByHarvestRecordId(record.getId())` để trả về `productBatchCode` trên từng dòng biên bản thu hoạch.

---

### 2. Backend: Đồng Bộ Thông Báo Thời Gian Thực WS-G -> WS-B (`GAP-FIELD-08`)

#### a. `LeaveOvertimeServiceImpl.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/hr/service/impl/LeaveOvertimeServiceImpl.java`
- **Các luồng thông báo tự động (Tuân thủ SQL Constraint `type IN ('INFO', 'WARNING', 'ALERT', 'TASK', 'QC', 'SYSTEM')`):**
  - **Tạo đơn nghỉ phép (`createLeaveRequest`):** Bắn `Notification` (`type = "SYSTEM"`, `referenceType = "LEAVE_REQUEST"`) tới Giám đốc trang trại (`farm.getManagerUserId()`) với nội dung: *"Nhân viên [Họ tên] vừa gửi đơn xin nghỉ phép (X ngày) chờ phê duyệt."*
  - **Xét duyệt đơn nghỉ phép (`approveLeaveRequest`):** Bắn `Notification` kết quả xét duyệt (phê duyệt / từ chối) về trực tiếp cho user tài khoản công nhân (`employee.getUserId()`).
  - **Tạo đơn tăng ca (`createOvertimeRequest`):** Bắn `Notification` tới Giám đốc trang trại: *"Nhân viên [Họ tên] vừa gửi đơn đăng ký làm thêm giờ (X giờ) chờ phê duyệt."*
  - **Xét duyệt đơn tăng ca (`approveOvertimeRequest`):** Bắn `Notification` kết quả xét duyệt về cho user công nhân.

#### b. `FarmTaskServiceImpl.java`
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/hr/service/impl/FarmTaskServiceImpl.java`
- **Luồng thông báo nghiệm thu công việc:**
  - Khi công nhân nộp báo cáo hoàn thành công việc chuyển trạng thái sang `'PENDING_REVIEW'`, hệ thống tự động bắn `Notification` (`type = "TASK"`, `referenceType = "FARM_TASK"`) tới Người giao việc (`task.getAssignedByUserId()`) và Giám đốc trang trại (`farm.getManagerUserId()`) thông báo công việc tại hiện trường đã hoàn tất và đang chờ nghiệm thu.
  - Cung cấp constructor `@Autowired` 7 tham số hỗ trợ Spring container và constructor tương thích 6 tham số cho mock unit tests.

---

### 3. Frontend: Nâng Cấp UI/UX Ghi Nhận Thu Hoạch, Đóng Gói Lô & Đồng Bộ Store

#### a. `qaService.js`
- **Đường dẫn:** `frontend/src/services/modules/qaService.js`
- **Bổ sung:** Cung cấp 2 API chuẩn hóa `createHarvestRecord(farmId, data)` và `getHarvestRecords(farmId, params)`.

#### b. `GrowthAndHarvestTab.jsx`
- **Đường dẫn:** `frontend/src/workspaces/E_FarmingOps/components/GrowthAndHarvestTab.jsx`
- **Các nâng cấp nổi bật:**
  1. **Hỗ trợ toàn diện cả Trồng trọt & Chăn nuôi:** Nút `[+ Ghi Nhận Sản Lượng Thu Hoạch / Xuất Chuồng]` bọc trong `<Can permission="PERM_HARVEST_MANAGE" role={["ROLE_FIELD_STAFF", "ROLE_FARM_MANAGER"]}>`, tự động `disabled` kèm tooltip cảnh báo khi mùa vụ hoặc đàn nuôi đang trong thời gian cách ly thuốc (`isQuarantined`).
  2. **Modal Ghi Nhận Thu Hoạch Chuẩn Hóa:** Cho phép nhập Ngày thu hoạch, Sản lượng thực thu (`> 0`), Đơn vị tính (`KG`, `TAN`, `CON`, `BO`, `THUNG`), Phẩm cấp chất lượng (`GRADE_A`, `GRADE_B`, `STANDARD`, `REJECT`), Tỷ lệ hao hụt (%) và Ghi chú.
  3. **Liên Kết Đóng Gói Lô Thành Phẩm (`GAP-FIELD-07`):**
     - Trên từng dòng của bảng biên bản thu hoạch, bổ sung nút **`[📦 Đóng Gói Lô]`** (chỉ hiển thị với Thủ kho và Quản lý trại).
     - Khi bấm nút, modal đóng gói tự động điền sẵn mã đợt thu hoạch vào danh sách `sourceHarvestRecordIds: [record.id]`, đề xuất khối lượng lô bằng sản lượng thực thu, đơn vị tính và ngày thu hoạch tương ứng.
     - Trong modal tạo lô thành phẩm, cung cấp bảng checkbox cho phép chọn/bỏ chọn linh hoạt nhiều biên bản thu hoạch nguồn để lưu vào bảng `product_batch_sources`.
     - Bảng biên bản hiển thị rõ Badge lô thành phẩm (`productBatchCode`) nếu đợt thu hoạch đã được tiếp nhận đóng gói.
  4. **Kích hoạt Store Sync:** Sau khi lưu thu hoạch hoặc đóng gói lô thành công, tự động gọi `useActiveFarmStore.getState().notifyDataChanged` trên các kênh `all`, `batches`, `seasons`, `inventory`.

#### c. `LeaveRequestModal.jsx` & `OvertimeRequestModal.jsx` & `CompleteTaskModal.jsx`
- **Đường dẫn:** `frontend/src/workspaces/G_EmployeeDailyOps/components/`
- **Thay đổi:** Sau khi gửi đơn nghỉ phép, đơn tăng ca hoặc nộp báo cáo hoàn thành công việc `PENDING_REVIEW`, tự động kích hoạt `store.notifyDataChanged?.('all')`, `('employees')`, `('tasks')`.

#### d. `FarmManagerDailyOverview.jsx`
- **Đường dẫn:** `frontend/src/workspaces/G_EmployeeDailyOps/components/FarmManagerDailyOverview.jsx`
- **Thay đổi:** Đăng ký lắng nghe `syncTrigger` (`syncTrigger?.all`, `syncTrigger?.employees`, `syncTrigger?.tasks`, `syncTrigger?.batches`) trong `useEffect` để các thẻ KPI (*"Đơn nghỉ phép/OT chờ duyệt"*, *"Lô KCS chờ duyệt"*, *"Tiến độ công việc hiện trường"*) tự động làm mới ngay khi công nhân thao tác tại hiện trường.

---

## III. KẾT QUẢ KIỂM THỬ HỆ THỐNG

### 1. Backend Test Suite (Toàn bộ 46 Integration Tests)
- **Lệnh thực thi:**
  ```bash
  mvn test
  ```
- **Kết quả kiểm thử:**
  ```text
  [INFO] Running com.farm.saas.CropFarmingLogAutoBackflushingIntegrationTest
  [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.FarmDailyRoutineTaskTest
  [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.QualityAndHrIntegrationTest
  [INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SecurityAndTenantIsolationIntegrationTest
  [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.SystemSubscriptionAndLimitsIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] ...
  [INFO] Results:
  [INFO] Tests run: 46, Failures: 0, Errors: 0, Skipped: 0
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] Total time: 29.369 s
  [INFO] ------------------------------------------------------------------------
  ```
- **Xác nhận:**
  - 100% test suites (46/46 tests) đều PASS.
  - Chốt chặn `HARVEST_BLOCKED_BY_PHI` (HTTP 400) và `HARVEST_BLOCKED_BY_WITHDRAWAL` hoạt động hoàn hảo.
  - Toàn bộ các thông báo `Notification` được lưu trữ an toàn trong DB không vi phạm check constraint.

### 2. Frontend Build & Vitest Suite
- **Lệnh thực thi build:**
  ```bash
  npm run build
  ```
  - **Kết quả:** `✓ built in 4.05s` — Biên dịch production sạch sẽ, 0 lỗi.
- **Lệnh thực thi tests:**
  ```bash
  npx vitest run
  ```
  - **Kết quả:** `Test Files 2 passed (2)`, `Tests 9 passed (9)`.

---

## IV. BẢNG TỔNG HỢP CÁC FILE ĐÃ SỬA TRONG TASK 3 / 3

| STT | Tập Tin Sửa Đổi | Phân Hệ | Mô Tả Tóm Tắt |
| :---: | :--- | :--- | :--- |
| 1 | `CreateHarvestRecordRequest.java` | Backend (Quality) | Thêm aliases 2 chiều, tự suy diễn `sourceType`, mặc định `unit="KG"`, chuẩn hóa `qualityGrade`, hỗ trợ `lossPercentage`. |
| 2 | `HarvestRecordDetailResponse.java` | Backend (Quality) | Bổ sung `productBatchId`, `productBatchCode`, `lossPercentage`, alias `getActualYieldKg()`. |
| 3 | `ProductBatchSourceRepository.java` | Backend (Quality) | Thêm phương thức tra cứu `findByHarvestRecordId`. |
| 4 | `HarvestServiceImpl.java` | Backend (Quality) | Khóa an toàn PHI & Withdrawal, cập nhật mùa vụ, bắn notification tới Thủ kho & Quản lý trại, liên kết lô thành phẩm. |
| 5 | `LeaveOvertimeServiceImpl.java` | Backend (HR) | Tự động bắn notification loại `SYSTEM` tới Quản lý trại khi nộp đơn và tới công nhân khi duyệt đơn. |
| 6 | `FarmTaskServiceImpl.java` | Backend (HR) | Bắn notification tới người giao việc & Quản lý trại khi việc chuyển sang `PENDING_REVIEW`, bổ sung constructor @Autowired. |
| 7 | `qaService.js` | Frontend (Services) | Cung cấp `createHarvestRecord` và `getHarvestRecords`. |
| 8 | `GrowthAndHarvestTab.jsx` | Frontend (WS-E) | Modal thu hoạch cho cả Trồng trọt & Chăn nuôi, nút `[📦 Đóng Gói Lô]`, liên kết `sourceHarvestRecordIds`, store sync. |
| 9 | `LeaveRequestModal.jsx` | Frontend (WS-G) | Bổ sung kích hoạt `store.notifyDataChanged` khi tạo đơn nghỉ phép. |
| 10 | `OvertimeRequestModal.jsx` | Frontend (WS-G) | Bổ sung kích hoạt `store.notifyDataChanged` khi tạo đơn tăng ca. |
| 11 | `CompleteTaskModal.jsx` | Frontend (WS-G) | Bổ sung kích hoạt `store.notifyDataChanged` khi nộp báo cáo hoàn thành việc. |
| 12 | `FarmManagerDailyOverview.jsx` | Frontend (WS-G) | Đăng ký lắng nghe `syncTrigger` để tự động làm mới các thẻ chỉ số KPI của Quản lý trại. |
| 13 | `TASK_3_ROLE_FIELD_STAFF_COMPLETION_REPORT.md` | Tài liệu (.docx) | Báo cáo hoàn tất Task 3/3 và tổng kết 8/8 mã lỗ hổng vai trò Field Staff. |

---

## V. KẾT LUẬN & BÀN GIAO TOÀN DIỆN VAI TRÒ `ROLE_FIELD_STAFF`

- **Trạng thái bàn giao: 100% HOÀN TẤT & ĐẠT CHUẨN DOANH NGHIỆP (ENTERPRISE-GRADE).**
- Toàn bộ chuỗi nghiệp vụ thực tế của Nhân viên / Công nhân Hiện trường (`staff`) đã được kết nối liền mạch:
  1. **Đăng nhập & Điều hướng:** Chỉ truy cập WS-G và WS-E, tuân thủ nguyên tắc SoD, không thể bypass qua route guards.
  2. **Vận hành công việc hằng ngày (WS-G):** Xem lịch ca làm việc cá nhân, chấm công GPS 1 chạm, gửi đơn nghỉ phép / tăng ca, báo cáo tiến độ công việc kèm ảnh hiện trường — mọi thay đổi lập tức bắn notification và nhảy số trên bảng điều khiển của Giám đốc trại.
  3. **Canh tác & Xuất kho vật tư (WS-E -> WS-C -> WS-H1):** Ghi nhật ký canh tác tự động trừ kho khả dụng FEFO, đối chiếu định mức BOM, kiểm soát chênh lệch và kích hoạt thời gian cách ly an toàn nông dược PHI.
  4. **Thu hoạch & Đóng gói truy xuất (WS-E -> WS-F):** Chặn thu hoạch khi còn trong thời gian cách ly PHI/Withdrawal, lập biên bản thu hoạch chuẩn hóa cho cả cây trồng và vật nuôi, chuyển giao trực tiếp sang bộ phận đóng gói lô thành phẩm phục vụ xuất bán và truy xuất nguồn gốc QR code.
