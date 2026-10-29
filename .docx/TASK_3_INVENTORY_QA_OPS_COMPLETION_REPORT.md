# BÁO CÁO NGHIỆM THU KỸ THUẬT: TASK 3 / 6
## SỬA 3 LỖI LỆCH DTO (HTTP 400) KHI HỦY PHIẾU KHO / IN TEM QR & HOÀN THIỆN SỬA / HỦY / LỌC NHIỆM VỤ HIỆN TRƯỜNG (WS-C, WS-F, WS-G)

---

### THÔNG TIN TỔNG QUAN
- **Dự án:** Agri-ERP Multi-Tenant SaaS
- **Hạng mục:** Task 3 / 6 theo Lộ trình Khắc phục Gap Analysis cho `ROLE_FARM_MANAGER` (Mục 2.3, 2.6, 2.7 & 3.3).
- **Vị trí thực thi:** Principal Software Architect & Senior Fullstack Engineer.
- **Trạng thái:** **HOÀN THÀNH 100% - TOÀN BỘ TEST TÍCH HỢP & BUILD FRONTEND ĐỀU PASS.**

---

## I. TỔNG HỢP CÁC LỖI ĐÃ KHẮC PHỤC TRIỆT ĐỂ

### 1. Sửa Lỗi Lệch DTO Hủy Phiếu Nhập Kho & Hủy Phiếu Xuất Kho (WS-C)
- **Nguyên nhân gốc rễ:**
  - Backend `POST /api/v1/farms/{farmId}/inventory/receipts/{id}/cancel` và `POST /api/v1/farms/{farmId}/inventory/issues/{id}/cancel` yêu cầu body JSON `@Valid CancelWarehouseReceiptRequest` / `CancelWarehouseIssueRequest` có trường `@NotBlank String cancellationReason`.
  - Frontend trước đây gọi `cancelReceipt(targetFarmId, id)` và `cancelIssue(targetFarmId, id)` với payload rỗng `{}` dẫn tới `HTTP 400 Bad Request`.
- **Giải pháp đã triển khai:**
  1. `frontend/src/services/modules/inventoryService.js`:
     - Cập nhật cả `cancelReceipt` và `cancelIssue` tự động chuẩn hóa tham số đầu vào. Nếu truyền chuỗi `reason` hoặc object `{ cancellationReason }`, đều format chính xác thành `{ cancellationReason: reason }` gửi xuống backend.
  2. `frontend/src/workspaces/C_InventoryHub/components/ReceiptDetailDrawer.jsx`:
     - Bổ sung Inline Collapse Form xác nhận hủy phiếu với cảnh báo chuyên dụng, yêu cầu người dùng nhập `cancellationReason` bắt buộc tối thiểu 5 ký tự.
     - Sau khi hủy thành công: Cập nhật trạng thái phiếu tức thời sang `CANCELLED`, hiển thị banner đỏ nổi bật chứa lý do hủy, hiển thị Toast thông báo thành công và gọi `onSuccess()` reload danh sách bảng.
  3. `frontend/src/workspaces/C_InventoryHub/components/IssueDetailDrawer.jsx`:
     - Đồng bộ Inline Collapse Form hủy phiếu xuất kho với cơ chế xác thực tối thiểu 5 ký tự và hiển thị banner trạng thái `CANCELLED` kèm lý do chi tiết.

### 2. Sửa Lỗi Lệch DTO In Tem Nhãn Nhiệt QR Truy Xuất (WS-F)
- **Nguyên nhân gốc rễ:**
  - Endpoint `POST /api/v1/farms/{farmId}/product-batches/{batchId}/print-label` yêu cầu `@Valid PrintLabelRequest` với `@NotBlank String labelSize` (`"50x50"` hoặc `"35x22"`), `@NotNull @Min(1) Integer printQuantity`, và tùy chọn `printerModel`.
  - Frontend trước đây gọi `qaService.printLabel(batch.farmId, batch.id)` không truyền body `{}` gây `HTTP 400`. Ngoài ra, endpoint chỉ cấp quyền cho `ROLE_WAREHOUSE_STAFF` (`PERM_LABEL_PRINT`), chưa mở cho `ROLE_FARM_MANAGER`.
- **Giải pháp đã triển khai:**
  1. `backend/.../ProductBatchController.java`:
     - Cập nhật `@PreAuthorize("hasAnyAuthority('PERM_LABEL_PRINT', 'PERM_QC_APPROVE') and @farmSecurity.canAccessFarm(#farmId)")` cho endpoint `print-label`.
     - Cho phép cả Quản lý trang trại (`ROLE_FARM_MANAGER`) và Thủ kho (`ROLE_WAREHOUSE_STAFF`) thực hiện in tem nhãn nhiệt ESC/POS.
  2. `frontend/src/services/modules/qaService.js`:
     - Bổ sung fallback và format chuẩn xác payload `{ labelSize, printQuantity, printerModel }`.
  3. `frontend/src/workspaces/F_QaTraceability/components/TraceabilityDetailDrawer.jsx`:
     - Bọc nút `[🖨️ In Tem Nhãn Nhiệt QR]` trong `<Can anyPermissions={["PERM_LABEL_PRINT", "PERM_QC_APPROVE"]} role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>`.
     - Xây dựng **Modal Cấu Hình In Tem Nhiệt QR ESC/POS**:
       - Khổ tem: Radio chọn `'50x50'` (*Tem vuông 50x50mm - Dán thùng/bao lớn*) hoặc `'35x22'` (*Tem nhỏ 35x22mm - Dán quả/hộp lẻ*).
       - Số lượng in: Ô nhập số nguyên `>= 1` (mặc định gợi ý theo số lượng tồn khả dụng của lô).
       - Model máy in: Ô nhập chuỗi (mặc định `"Xprinter XP-365B ESC/POS"`).
       - Khung xem trước mã truy xuất QR và định dạng lệnh in ESC/POS.
     - Sau khi in: Hiển thị Toast thông báo thành công và reload trạng thái lô hàng (chuyển sang `PRINTED`).

---

## II. HOÀN THIỆN ĐIỀU PHỐI NHIỆM VỤ HIỆN TRƯỜNG (WORKSPACE G)

### 1. Tại Backend (Spring Boot)
1. **Bổ sung DTO `UpdateFarmTaskRequest.java`:**
   - Đặt tại `com.farm.saas.modules.hr.dto.request.UpdateFarmTaskRequest`.
   - Chứa đầy đủ các trường cập nhật: `taskTitle`, `taskType`, `zoneId`, `priority`, `deadline`, `assignedToEmployeeId`, `completionNotes`, `photosJson`, `assignees`.
2. **Controller & Service (`FarmTaskController.java`, `FarmTaskService.java`, `FarmTaskServiceImpl.java`):**
   - Hỗ trợ `PUT /api/v1/farms/{farmId}/tasks/{id}` và alias `PUT /api/v1/tasks/{id}` bảo vệ bởi `@PreAuthorize("hasAuthority('PERM_TASK_ASSIGN')")`.
   - Chặn tuyệt đối việc chỉnh sửa các nhiệm vụ đã đóng hoàn tất (`status == 'DONE'`) hoặc đã hủy (`status == 'CANCELLED'`).
   - Hỗ trợ `PATCH /api/v1/tasks/{id}/cancel` (và alias `/api/v1/farms/{farmId}/tasks/{id}/cancel`), đồng thời tương thích `PUT /api/v1/tasks/{id}/status` với `status = 'CANCELLED'`.
   - Kiểm tra Maker-Checker: Chỉ cấp quản lý (`ROLE_FARM_MANAGER`, `ROLE_TECHNICAL_STAFF`) hoặc người có quyền `PERM_TASK_ASSIGN` mới được duyệt `DONE` hoặc hủy `CANCELLED`.

### 2. Tại Frontend (React + Vite)
1. **`endpoints.js` & `hrService.js`:**
   - Khai báo `TASK_UPDATE` và `TASK_CANCEL`.
   - Bổ sung hàm `updateTask(farmId, id, data)` và `cancelTask(taskId, reason)`.
2. **`CreateTaskModal.jsx`:**
   - Nâng cấp hỗ trợ 2 chế độ Tạo mới (`create`) và Chỉnh sửa (`edit`) thông qua prop `editingTask`.
   - Tự động điền đầy đủ dữ liệu cũ: tiêu đề, loại công việc, phân khu, ưu tiên, deadline, ghi chú chỉ tiêu kỹ thuật, danh sách nhân viên thực hiện và trưởng nhóm.
   - Khi lưu: gọi `hrService.updateTask(...)` và hiển thị Toast thành công.
3. **`PersonalTaskKanban.jsx`:**
   - Thêm nút toggle `[🚫 Hiển thị việc đã hủy (X)]` trên thanh công cụ Kanban: Khi bật, kích hoạt cột thứ 5 **`ĐÃ HỦY (CANCELLED)`** và tự động co giãn lưới sang `lg:grid-cols-5`.
   - Trên mỗi thẻ nhiệm vụ chưa `DONE` và chưa `CANCELLED`, bổ sung cụm nút:
     - `[✏️ Sửa]`: Mở `CreateTaskModal` ở chế độ chỉnh sửa.
     - `[🚫 Hủy việc]`: Mở Modal xác nhận nhập lý do hủy việc (tối thiểu 3 ký tự).
   - Hiển thị trực quan thẻ công việc đã hủy kèm lý do tại cột `CANCELLED`.

---

## III. DANH SÁCH TẬP TIN ĐÃ THAY ĐỔI & BỔ SUNG

| STT | Tập Tin | Phân Loại | Nội Dung Thay Đổi |
|:---:|:---|:---:|:---|
| 1 | `backend/.../PrintLabelRequest.java` | Backend | Đối chiếu cấu trúc `@NotBlank labelSize`, `@Min(1) printQuantity` |
| 2 | `backend/.../ProductBatchController.java` | Backend | Mở `@PreAuthorize` in tem cho cả `ROLE_FARM_MANAGER` (`PERM_QC_APPROVE`) |
| 3 | `backend/.../UpdateFarmTaskRequest.java` | Backend | **Tạo mới DTO** cập nhật nhiệm vụ hiện trường |
| 4 | `backend/.../FarmTaskController.java` | Backend | Thêm API `PUT` sửa nhiệm vụ và `PATCH` hủy nhiệm vụ |
| 5 | `backend/.../FarmTaskService.java` | Backend | Bổ sung method signature `updateTask` và `cancelTask` |
| 6 | `backend/.../FarmTaskServiceImpl.java` | Backend | Triển khai logic kiểm tra farm access, chặn sửa/hủy task `DONE`, lưu lý do hủy |
| 7 | `frontend/.../inventoryService.js` | Frontend | Chuẩn hóa payload `{ cancellationReason }` cho `cancelReceipt` và `cancelIssue` |
| 8 | `frontend/.../ReceiptDetailDrawer.jsx` | Frontend | Bổ sung Inline Form nhập lý do hủy (>=5 ký tự), toast & banner hiển thị lý do |
| 9 | `frontend/.../IssueDetailDrawer.jsx` | Frontend | Bổ sung Inline Form nhập lý do hủy (>=5 ký tự), toast & banner hiển thị lý do |
| 10 | `frontend/.../qaService.js` | Frontend | Chuẩn hóa payload `{ labelSize, printQuantity, printerModel }` cho `printLabel` |
| 11 | `frontend/.../TraceabilityDetailDrawer.jsx` | Frontend | Mở quyền in tem cho Quản lý trại, xây dựng Modal cấu hình tem nhiệt ESC/POS |
| 12 | `frontend/.../endpoints.js` | Frontend | Khai báo `TASK_UPDATE` và `TASK_CANCEL` |
| 13 | `frontend/.../hrService.js` | Frontend | Bổ sung hàm `cancelTask(taskId, reason)` và hoàn thiện `updateTask` |
| 14 | `frontend/.../CreateTaskModal.jsx` | Frontend | Hỗ trợ 2 chế độ create/edit qua `editingTask`, bổ sung trường `completionNotes` |
| 15 | `frontend/.../PersonalTaskKanban.jsx` | Frontend | Bổ sung nút Sửa/Hủy trên Task Card, Modal hủy việc, toggle cột `CANCELLED` |

---

## IV. KẾT QUẢ KIỂM THỬ HỆ THỐNG

### 1. Backend (Spring Boot 3.3.4 - Java 21)
- `mvn test-compile`: **BUILD SUCCESS** (436 files compile thành công).
- `mvn test`: **BUILD SUCCESS**
  - **Tests run: 43, Failures: 0, Errors: 0, Skipped: 0** (100% Pass bao gồm toàn bộ luồng RBAC, Multi-Tenant Isolation, Chấm công, Phiếu kho, KCS).

### 2. Frontend (React 18 + Vite)
- `npm run build`: **BUILD SUCCESS** (1,769 modules transformed, 0 lỗi cú pháp).
- `npx vitest run`: **2 passed (2 test files), 9 passed (9 tests)** (100% Pass).

---
*Báo cáo được khởi tạo tự động bởi Principal Software Architect & Senior Fullstack Engineer.*
