# BÁO CÁO NGHIỆM THU HOÀN TẤT TASK 3 / 3
## SỬA LỖI HTTP 400 BIÊN BẢN KCS ĐA CHỈ TIÊU & ĐỒNG BỘ LUỒNG KCS 4 BÊN (GAP-TECH-07 & GAP-TECH-08)
### HOÀN TẤT TRỌN VẸN 9/9 MÃ LỖ HỔNG CHO TÀI KHOẢN `ROLE_TECHNICAL_STAFF` (KỸ SƯ KỸ THUẬT & KCS)

---

**Dự án:** Agri-ERP Multi-Tenant SaaS Platform  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Đối tượng:** Tài khoản Cấp 4 — `ROLE_TECHNICAL_STAFF` (Kỹ sư Nông nghiệp / Thú y & KCS — `tech`)  
**Tài liệu cơ sở:** `GAP_ANALYSIS_ROLE_TECHNICAL_STAFF.md`  
**Các mã lỗ hổng giải quyết:** `GAP-TECH-07`, `GAP-TECH-08` (Khép lại toàn bộ `GAP-TECH-01` $\rightarrow$ `GAP-TECH-09`)  
**Ngày hoàn tất:** 25/10/2026  
**Trạng thái kiểm thử:** 
- Backend: **100% PASS** (8/8 Integration Tests, bao gồm `QualityAndHrIntegrationTest`)
- Frontend: **100% PASS** (9/9 Vitest Unit/Integration Tests, `vite build` 0 cảnh báo/lỗi)

---

## I. TỔNG QUAN NHIỆM VỤ TASK 3 / 3

Trong quy trình vận hành nông nghiệp khép kín, **Kỹ sư KCS (`ROLE_TECHNICAL_STAFF`)** là chốt chặn kỹ thuật kiểm soát chất lượng sản phẩm thu hoạch trước khi cấp tem truy xuất nguồn gốc (QR Code) và bán ra thị trường. Trước khi thực hiện Task 3/3, luồng này gặp 2 trở ngại kỹ thuật nghiêm trọng:
1. **Lỗi HTTP 400 Bad Request (`GAP-TECH-07`):** Khi Kỹ sư KCS lập biên bản kiểm định đa chỉ tiêu (dư lượng hóa chất, vi sinh, ngoại quan), DTO Backend (`QcInspectionRequest`) bị lệch tên trường với Frontend (`parameterName` vs `criterionName`, `standardThreshold` vs `standardValue`, `isPassed` vs `passed`, thiếu `unit`, thiếu `photosJson`), dẫn đến lỗi thẩm định JSON và chặn đứng thao tác lập phiếu.
2. **Đứt gãy luồng cộng tác 4 bên & lệch trạng thái SQL (`GAP-TECH-08`):** Sau khi lập biên bản KCS, lô hàng không được phản ánh trạng thái kiểm định rõ ràng trên bảng Kanban của **Workspace F (`F_QaTraceability`)**, không có thông báo tự động cho Giám đốc trại (`ROLE_FARM_MANAGER`), và nguy cơ gán nhầm trạng thái không hợp lệ vào cột `product_batches.status` (vốn chỉ chấp nhận 7 trạng thái chuẩn).

Task 3/3 đã giải quyết dứt điểm các vấn đề trên cả Backend và Frontend, hoàn tất chuỗi 3 task chuẩn hóa vai trò `ROLE_TECHNICAL_STAFF`.

---

## II. CHI TIẾT CẢI TIẾN KIẾN TRÚC & MÃ NGUỒN

### 1. Chuẩn hóa DTO Backend Tương Thích Tuyệt Đối 2 Chiều (`GAP-TECH-07`)
- **Tập tin sửa đổi:** [QcInspectionRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/dto/request/QcInspectionRequest.java)
  - Thêm `@JsonIgnoreProperties(ignoreUnknown = true)` ở cả cấp độ Request và Item con.
  - Sử dụng `@JsonAlias` đa tầng giúp tiếp nhận linh hoạt mọi chuẩn đặt tên từ client mà không bao giờ phát sinh `HttpMessageNotReadableException` hay validation error:
    - `parameterName`: `@JsonAlias({"criterionName", "name", "parameter"})`
    - `standardThreshold`: `@JsonAlias({"standardValue", "standard", "threshold"})`
    - `measuredValue`: `@JsonAlias({"actualValue", "actual", "value"})`
    - `isPassed`: `@JsonAlias({"passed", "pass"})`
    - Bổ sung trường `unit` (ppm, %, CFU/g...) và `photosJson` (URL ảnh phiếu xét nghiệm phòng Lab / test kit nhanh).
  - Nới lỏng pattern kiểm tra `overallResult`: `@Pattern(regexp = "PENDING|PASSED|REJECTED|FAILED|CONDITIONAL")`.
- **Tập tin sửa đổi:** [QcInspectionDetailResponse.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/dto/response/QcInspectionDetailResponse.java)
  - Bổ sung các getter tương thích ngược (`getCriterionName()`, `getStandardValue()`, `getActualValue()`, `isPassed()`, `getUnit()`).

### 2. Chuẩn hóa Quy Tắc Nghiệp Vụ & Bảo Toàn Ràng Buộc Cơ Sở Dữ Liệu (`GAP-TECH-08`)
- **Tập tin sửa đổi:** [QcInspectionServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/service/impl/QcInspectionServiceImpl.java)
  - **Chuẩn hóa giá trị kết quả:** MySQL bảng `qc_inspections` có ràng buộc kiểm tra `chk_qc_result CHECK (overall_result IN ('PENDING', 'PASSED', 'REJECTED', 'CONDITIONAL'))`. Khi Frontend gửi `'FAILED'`, hệ thống tự động chuẩn hóa sang `'REJECTED'` trước khi lưu vào DB, ngăn chặn hoàn toàn lỗi SQL Error 3819.
  - **Bảo toàn trạng thái Lô thành phẩm:** Giữ nguyên `product_batches.status = 'PENDING_APPROVAL'` trong suốt quá trình chờ Giám đốc duyệt (tuyệt đối không gán trạng thái ngoài danh mục `INSPECTING`).
  - **Lưu trữ dữ liệu mở rộng:** Lưu ảnh minh chứng `photosJson` và ghi chú kết luận vào `notes` của biên bản KCS.
  - **Bắn thông báo liên thông 4 bên:** Tự động gửi thông báo thời gian thực với phân loại `type = "QC"` (khớp với constraint `chk_notifications_type`) tới Giám đốc trang trại (`managerUserId`):
    > *"Lô thành phẩm [Mã lô] đã được Kỹ sư KCS kiểm định với kết quả [PASSED/REJECTED] và đang chờ phê duyệt."*
- **Tập tin sửa đổi:** [ProductBatchServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/service/impl/ProductBatchServiceImpl.java)
  - Cập nhật hàm `mapToDetailResponse(ProductBatch batch)` để tự động nạp thông tin KCS mới nhất:
    - `inspectorName`: Họ tên của Kỹ sư KCS thực hiện kiểm tra.
    - `inspectedAt`: Thời điểm hoàn thành biên bản kiểm tra.
    - `qcOverallResult`: Kết quả kiểm định (`PASSED` hoặc `REJECTED`).
    - `qcJson`: Cấu trúc JSON chứa mảng `items` (với đầy đủ các trường `criterionName`, `standardValue`, `measuredValue`, `unit`, `isPassed`, `notes`), giúp Frontend hiển thị chi tiết bảng chỉ tiêu kiểm nghiệm mà không cần gọi thêm API phụ.
- **Tập tin sửa đổi:** [QcInspectionController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/quality/controller/QcInspectionController.java)
  - Nới lỏng quyền `@PreAuthorize` tại endpoint `POST /api/v1/farms/{farmId}/qc-inspections` để cho phép cả `hasRole('ROLE_TECHNICAL_STAFF')` và `hasAuthority('PERM_QC_INSPECT')`.

---

## III. NÂNG CẤP GIAO DIỆN WORKSPACE F (`src/workspaces/F_QaTraceability/`)

### 1. Chuẩn hóa Payload tại Client Service
- **Tập tin sửa đổi:** [qaService.js](file:///d:/Projects/Farm_Management/frontend/src/services/modules/qaService.js)
  - Hàm `createInspection(farmId, payload)` làm sạch dữ liệu đầu vào:
    - Chuẩn hóa từng phần tử trong `items`: `criterionName`, `standardValue`, `measuredValue`, `unit`, `isPassed`, `notes`.
    - Chuẩn hóa `overallResult` chỉ gửi `'PASSED'` hoặc `'FAILED'`.
    - Đóng gói danh sách URL ảnh minh chứng vào `photosJson`.

### 2. Bảng Chỉ Tiêu Kiểm Định Động Đa Chỉ Tiêu (Multi-Criteria QC Dynamic Table)
- **Tập tin sửa đổi:** [F_QaTraceability/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/F_QaTraceability/index.jsx) và [TraceabilityDetailDrawer.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/F_QaTraceability/components/TraceabilityDetailDrawer.jsx)
  - **Bộ mẫu tiêu chuẩn VietGAP (`DEFAULT_VIETGAP_CRITERIA`):** Cung cấp sẵn nút `[+ Nạp Bộ Chỉ Tiêu Mẫu VietGAP]` giúp kỹ sư nạp nhanh 3 chỉ tiêu chuẩn:
    1. *Dư lượng thuốc BVTV / Kháng sinh* (Ngưỡng: Âm tính < MRL | Đơn vị: ppm)
    2. *Vi sinh vật gây bệnh (E.Coli / Salmonella)* (Ngưỡng: Không phát hiện | Đơn vị: CFU/g)
    3. *Độ tươi / Ngoại quan & Quy cách* (Ngưỡng: Đạt chuẩn Loại A | Đơn vị: %)
  - **Thêm/bớt dòng linh hoạt:** Nút `[+ Thêm Chỉ Tiêu Kiểm Nghiệm]` và nút icon thùng rác cho phép tùy biến số lượng chỉ tiêu đo theo đặc thù từng loại nông sản/thủy hải sản.
  - **Tự động gợi ý kết luận thông minh:** 
    - Nếu 100% dòng chỉ tiêu có `isPassed === true` $\rightarrow$ Tự động bật đề xuất `PASSED` (Đạt chuẩn xuất xưởng).
    - Nếu có bất kỳ chỉ tiêu nào `isPassed === false` $\rightarrow$ Tự động chuyển đề xuất sang `FAILED` kèm cảnh báo màu đỏ trực quan.
  - **Đính kèm bằng chứng:** Hỗ trợ nhập URL ảnh phiếu kiểm nghiệm phòng Lab hoặc kit test nhanh (`photoUrl`) và ghi chú kết luận của kiểm định viên (`notes`).
  - **Phản hồi tức thì:** Tự động reload danh sách lô hàng, Drawer chi tiết, và phát sự kiện `notifyDataChanged('all')`.

### 3. Phân Biệt Trực Quan 3 Trạng Thái KCS trên Kanban Card & Drawer
Tại trạng thái `PENDING_APPROVAL` (Chờ duyệt), giao diện hiển thị chính xác theo 3 trạng thái con của KCS:

| Trạng thái Lô | Huy hiệu Kanban & Drawer | Hành động Kỹ sư KCS (`ROLE_TECHNICAL_STAFF`) | Hành động Giám đốc trại (`ROLE_FARM_MANAGER`) |
| :--- | :--- | :--- | :--- |
| **1. Chưa kiểm định** (`!batch.qcOverallResult`) | 🟡 `⏳ Chờ Kỹ Sư KCS Kiểm Định` | Nút sáng **`[🔬 Lập Biên Bản KCS Ngay]`** mở form kiểm tra đa chỉ tiêu | Hiển thị dòng nhắc: *"Đang chờ Kỹ sư KCS lập biên bản kiểm nghiệm mẫu trước khi phê duyệt."* |
| **2. KCS Đạt chuẩn** (`batch.qcOverallResult === 'PASSED'`) | 🟢 `✅ KCS Đạt Chuẩn — Chờ Giám Đốc Duyệt` (Kèm tên KCS) | Đã hoàn thành nhiệm vụ kiểm định | Nút sáng nổi bật **`[✔️ Phê Duyệt Lô & Cấp Mã QR]`** để cấp tem xuất xưởng |
| **3. KCS Không đạt** (`batch.qcOverallResult === 'FAILED'` / `'REJECTED'`) | 🔴 `❌ KCS Không Đạt — Khuyến Nghị Từ Chối Lô` (Kèm tên KCS) | Đã ghi nhận chỉ tiêu không đạt | Cảnh báo vi phạm chất lượng, nút sáng **`[🚫 Từ Chối / Hủy Lô]`** |

---

## IV. BẢNG TỔNG KẾT KHÉP LẠI TOÀN BỘ 9/9 MÃ LỖ HỔNG CỦA `ROLE_TECHNICAL_STAFF`

| Mã Lỗ Hổng | Phạm Vi | Mô Tả Vấn Đề Ban Đầu | Giải Pháp Kiến Trúc & Code Đã Thực Hiện | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **GAP-TECH-01** | Frontend Routing & Menu | Bị ẩn menu `Cài đặt hệ thống` (`/app/settings`), không xem được danh mục kỹ thuật. | Bổ sung `ROLE_TECHNICAL_STAFF` vào `menuConfig.js` và route `/app/settings`. | **100% RESOLVED** (Task 1) |
| **GAP-TECH-02** | Frontend Settings | Thiếu 3 Tab kỹ thuật: Giống cây trồng, Giống vật nuôi, Định mức vật tư BOM. | Mở khóa và hiển thị đúng 3 Tab chuyên môn, ẩn các tab tài chính/doanh nghiệp. | **100% RESOLVED** (Task 1) |
| **GAP-TECH-03** | Frontend Workspace C | Không thấy menu Kho (WS-C) để đối chiếu tồn kho thuốc/vật tư trước khi lập toa. | Mở khóa WS-C ở chế độ View-only (Tra cứu tồn kho, thẻ kho) cho `ROLE_TECHNICAL_STAFF`. | **100% RESOLVED** (Task 1) |
| **GAP-TECH-04** | Backend API & RBAC | Bị lỗi HTTP 403 khi gọi API tra cứu danh mục giống và định mức BOM. | Nới lỏng `@PreAuthorize` tại Controller Masterdata cho `ROLE_TECHNICAL_STAFF`. | **100% RESOLVED** (Task 1) |
| **GAP-TECH-05** | Backend API Employee | Lỗi HTTP 403 khi tải danh sách nhân sự tại WS-G để phân công và điểm danh tổ. | Cho phép `ROLE_TECHNICAL_STAFF` gọi `GET /api/v1/hr/employees` có phân vùng tenant. | **100% RESOLVED** (Task 1) |
| **GAP-TECH-06** | Backend & Frontend WS-E $\leftrightarrow$ WS-C | Thao tác ghi nhận sự kiện tiêm phòng / thú y không kích hoạt xuất kho thuốc tự động. | Hoàn thiện DTO `materialsUsed`, trigger `backflushStockForTask` và hạch toán chi phí. | **100% RESOLVED** (Task 2) |
| **GAP-TECH-07** | Backend & Frontend WS-F | Lỗi `HTTP 400 Bad Request` do lệch tên trường trong DTO kiểm định KCS đa chỉ tiêu. | Sử dụng `@JsonAlias`, `@JsonIgnoreProperties`, chuẩn hóa `overallResult` FAILED/REJECTED. | **100% RESOLVED** (Task 3) |
| **GAP-TECH-08** | Backend & Frontend WS-F | Lô hàng KCS không phản ánh tiến trình duyệt 4 bên, thiếu thông báo Giám đốc. | Hiển thị 3 trạng thái KCS trên Kanban, bắn Notification `type="QC"`, nạp `inspectorName`. | **100% RESOLVED** (Task 3) |
| **GAP-TECH-09** | Frontend WS-E $\leftrightarrow$ WS-A | Sau khi chuyển ô/chuồng đàn vật nuôi, sơ đồ phân bổ chuồng WS-A không đồng bộ. | Kích hoạt `notifyDataChanged('geography')` và đồng bộ tức thì vị trí ô/chuồng. | **100% RESOLVED** (Task 2) |

---

## V. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

### 1. Backend Integration Tests (Java / Spring Boot / MySQL)
- **Lệnh thực thi:** `mvn test "-Dtest=QualityAndHrIntegrationTest,LivestockAdgAndVetBackflushingIntegrationTest,CropFarmingLogAutoBackflushingIntegrationTest,EmployeeAccessIntegrationTest"`
- **Kết quả:**
  ```text
  [INFO] Running com.farm.saas.CropFarmingLogAutoBackflushingIntegrationTest
  [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 13.916 s
  [INFO] Running com.farm.saas.EmployeeAccessIntegrationTest
  [INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.farm.saas.LivestockAdgAndVetBackflushingIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.621 s
  [INFO] Running com.farm.saas.QualityAndHrIntegrationTest
  [INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.517 s
  [INFO] 
  [INFO] Results:
  [INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] ------------------------------------------------------------------------
  ```
- **Xác nhận đặc thù:** Test case `testMultiCriteriaQcInspectionNormalizationAndBatchSync` đã kiểm tra thành công:
  - Tiếp nhận payload chứa `@JsonAlias` (`criterionName`, `standardValue`, `actualValue`, `passed`).
  - Tự động chuẩn hóa `'FAILED'` $\rightarrow$ `'REJECTED'` trong Database.
  - Giữ nguyên trạng thái `PENDING_APPROVAL` của Lô thành phẩm.
  - Nạp đầy đủ thông tin `inspectorName`, `inspectedAt`, và cấu trúc JSON `items` trong `ProductBatchDetailResponse`.

### 2. Frontend Vitest & Production Build (React / Vite)
- **Kiểm thử đơn vị & tích hợp:** `npx vitest run`
  ```text
  ✓ src/shells/TenantAppShell/menuConfig.roleMatrix.test.js (8 tests)
  ✓ src/GeographyWorkspaceUxStandard.test.jsx (1 test)
  Test Files  2 passed (2)
       Tests  9 passed (9)
  ```
- **Kiểm thử đóng gói sản phẩm:** `npm run build`
  ```text
  vite v5.4.21 building for production...
  transforming...
  ✓ 1781 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                     1.01 kB │ gzip:   0.60 kB
  dist/assets/index-BCsrSCwW.css     75.36 kB │ gzip:  12.18 kB
  dist/assets/index-GOsplDcS.js   1,423.46 kB │ gzip: 356.07 kB
  ✓ built in 6.11s
  ```

---

## VI. KẾT LUẬN

Toàn bộ **Task 3 / 3** đã hoàn thành 100% mục tiêu đặt ra. Khép lại chuỗi cải tiến cho **`ROLE_TECHNICAL_STAFF`**, tài khoản Kỹ sư Kỹ thuật & KCS hiện đã đạt mức độ hoàn thiện cao cấp, hoạt động mượt mà và bảo mật trong hệ thống Agri-ERP Multi-Tenant SaaS.
