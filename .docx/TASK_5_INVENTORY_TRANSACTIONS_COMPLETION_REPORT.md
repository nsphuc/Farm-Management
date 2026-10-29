# BÁO CÁO HOÀN THÀNH TASK 5: XÓA BỎ TOÀN BỘ `alert(...)` TẠI WORKSPACE C, XÂY DỰNG 5 MODAL/FORM GIAO DỊCH KHO THỰC TẾ & MỞ QUYỀN LẬP PHIẾU CHO `ROLE_FARM_MANAGER`

> **Dự án:** Agri-ERP Multi-Tenant SaaS  
> **Giai đoạn:** Triển khai Kiến trúc Phân quyền Chuẩn & Giao diện Nghiệp vụ Kho Vận Thực tế  
> **Căn cứ tài liệu:** `GAP_ANALYSIS_ROLE_FARM_MANAGER.md` (Mục 2.3 và 3.1)  
> **Ngày thực hiện:** 24/10/2026  
> **Vị trí:** Principal Software Architect & Senior Fullstack Engineer  

---

## 1. TỔNG QUAN & MỤC TIÊU THỰC HIỆN

Tại **Workspace C (`frontend/src/workspaces/C_InventoryHub/`)**, kiểm toán trước đây ghi nhận 5 nút giao dịch kho mang tính chất giả lập `alert(...)` và việc khóa nhầm quyền của `ROLE_FARM_MANAGER` sang chế độ `isReadOnly`.

Task 5 đã giải quyết triệt để các tồn đọng này:
1. **Xóa bỏ 100% các lệnh `alert(...)`** giả lập tại Workspace C, thay thế bằng các Modal/Form giao dịch chuyên nghiệp kết nối API thực tế và hệ thống thông báo Toast chuẩn.
2. **Xây dựng 4 Modal Lập Chứng từ Kho Mới:**
   - `CreateReceiptModal.jsx`: Lập phiếu nhập kho (`warehouse_receipts` #32 & `warehouse_receipt_items` #33) tích hợp quét mã vạch và quy đổi đơn vị bao bì.
   - `CreateIssueModal.jsx`: Lập phiếu xuất kho (`warehouse_issues` #34 & `warehouse_issue_items` #35) lọc tồn kho khả dụng theo nguyên tắc FEFO.
   - `CreateTransferModal.jsx`: Lập phiếu điều chuyển nội bộ/liên trại (`warehouse_transfers` #36 & `warehouse_transfer_items` #37).
   - `CreateStocktakeModal.jsx`: Mở đợt kiểm kê kho mới (`stocktakes` #39).
3. **Nâng cấp Bảng Nhập Số Lượng Kiểm Đếm Thực Tế trong `StocktakeDetailDrawer.jsx`:**
   - Cho phép Thủ kho và Giám đốc trại nhập số lượng kiểm đếm thực tế (`actualQuantity`), tự động tính toán chênh lệch (`differenceQuantity`) và giải trình lý do (`reason`).
   - Tự động nạp danh sách tồn kho hiện hữu từ `warehouse_inventory` nếu đợt kiểm kê mới mở chưa có dòng dữ liệu.
   - Lưu trực tiếp thông qua endpoint `recordStocktakeCount` và chuyển trạng thái sang `IN_PROGRESS` để Giám đốc trại phê duyệt.
4. **Mở khóa Quyền Lập Phiếu cho `ROLE_FARM_MANAGER`:**
   - Sửa `isReadOnly = Boolean(owner && !farmManager)` trong `C_InventoryHub/index.jsx`.
   - Cập nhật thẻ `<Can>` của 4 nút hành động chính cho cả `ROLE_WAREHOUSE_STAFF` và `ROLE_FARM_MANAGER`.

---

## 2. ĐỐI CHIẾU HỢP ĐỒNG BACKEND & BẢO MẬT PHÂN QUYỀN

### 2.1. Backend API & Request DTOs
- `WarehouseReceiptController.java` (`POST /api/v1/farms/{farmId}/inventory/receipts`):
  - Request DTO: `CreateWarehouseReceiptRequest` (warehouseId, receiptType, partnerId, receiptDate, notes, items).
  - RBAC: `hasAuthority('PERM_INVENTORY_RECEIPT') and @farmSecurity.canAccessFarm(#farmId)`.
- `WarehouseIssueController.java` (`POST /api/v1/farms/{farmId}/inventory/issues`):
  - Request DTO: `CreateWarehouseIssueRequest` (warehouseId, issueType, receiverName, seasonId, issueDate, notes, items).
  - RBAC: `hasAuthority('PERM_INVENTORY_ISSUE') and @farmSecurity.canAccessFarm(#farmId)`.
- `WarehouseTransferController.java` (`POST /api/v1/farms/{farmId}/inventory/transfers`):
  - Request DTO: `CreateWarehouseTransferRequest` (fromWarehouseId, toFarmId, toWarehouseId, transferDate, notes, items).
  - RBAC: `hasAuthority('PERM_INVENTORY_TRANSFER') and @farmSecurity.canAccessFarm(#farmId)`.
- `StocktakeController.java`:
  - `POST /api/v1/farms/{farmId}/inventory/stocktakes`: Request DTO `CreateStocktakeRequest` (warehouseId, stocktakeCode, stocktakeDate, notes).
  - `POST /api/v1/farms/{farmId}/inventory/stocktakes/{id}/count` và `POST .../record-count`:
    - Cập nhật `@PostMapping(value = {"/{id}/count", "/{id}/record-count"})` nhằm đảm bảo tương thích 100% với cả 2 quy chuẩn endpoint của Frontend.
    - Request DTO: `RecordStocktakeCountRequest` (items: materialId, batchNumber, actualQuantity, reason).
  - RBAC: `hasAuthority('PERM_INVENTORY_STOCKTAKE') and @farmSecurity.canAccessFarm(#farmId)`.

### 2.2. Quy tắc Maker - Checker Bất biến
- **Maker (Tạo phiếu & Kiểm đếm):** Được cấp cho `ROLE_WAREHOUSE_STAFF` và `ROLE_FARM_MANAGER` (khi cần linh hoạt điều hành).
- **Checker (Phê duyệt hoàn tất, xuất kho điều chuyển, chốt cân chỉnh):**
  - `/complete`, `/dispatch`, `/adjust` chỉ dành riêng cho `@farmSecurity.isFarmManager(#farmId)`.
  - Đảm bảo tính minh bạch, chống gian lận và tuân thủ chuẩn kiểm soát nội bộ.

---

## 3. CHI TIẾT CÁC THAY ĐỔI TẠI FRONTEND

### 3.1. Các File Tạo Mới & Chỉnh Sửa

| STT | Tên File | Loại Thao Tác | Mô Tả Chi Tiết |
|---|---|---|---|
| 1 | `frontend/src/workspaces/C_InventoryHub/components/CreateReceiptModal.jsx` | Tạo Mới | Modal lập phiếu nhập kho: hỗ trợ chọn kho, đối tác NCC (khi PURCHASE), nhúng `BarcodeScannerInput`, quy đổi đơn vị bao bì sang đơn vị chuẩn, tạo mã lô tự động (`LOT-YYMMDD-XX`), hạn sử dụng, vị trí kệ. |
| 2 | `frontend/src/workspaces/C_InventoryHub/components/CreateIssueModal.jsx` | Tạo Mới | Modal lập phiếu xuất kho: hỗ trợ chọn kho, loại xuất kho (`INTERNAL_USE`, `SALE_FULFILLMENT`, `DAMAGE_DISPOSAL`), nạp tồn kho khả dụng theo lô, sắp xếp FEFO (`expiryDate ASC`), kiểm tra số lượng không vượt quá khả dụng. |
| 3 | `frontend/src/workspaces/C_InventoryHub/components/CreateTransferModal.jsx` | Tạo Mới | Modal lập lệnh điều chuyển: hỗ trợ điều chuyển nội bộ hoặc liên trại, kiểm tra bắt buộc `toWarehouseId !== fromWarehouseId`, chọn lô xuất từ tồn kho khả dụng của kho nguồn, mã lô kho đích, vị trí kệ xuất/nhập. |
| 4 | `frontend/src/workspaces/C_InventoryHub/components/CreateStocktakeModal.jsx` | Tạo Mới | Modal mở đợt kiểm kê: chọn kho kiểm kê, sinh mã đợt kiểm kê tự động (`STK-YYMMDD-XX`), chọn ngày và ghi chú đợt kiểm kê. |
| 5 | `frontend/src/workspaces/C_InventoryHub/components/StocktakeDetailDrawer.jsx` | Chỉnh Sửa | Xóa bỏ `alert(...)`; thêm chế độ nhập số liệu thực đếm; tự động nạp danh sách tồn kho hiện có; tính toán chênh lệch và hiển thị cảnh báo màu; lưu số liệu kiểm đếm qua `inventoryService.recordStocktakeCount`; thay thế alert duyệt bằng toast. |
| 6 | `frontend/src/workspaces/C_InventoryHub/components/TransferDetailDrawer.jsx` | Chỉnh Sửa | Xóa bỏ toàn bộ `alert(...)` khi duyệt xuất (`dispatch`) và tiếp nhận (`receive`), chuyển sang `toast.success` và `toast.error`. |
| 7 | `frontend/src/workspaces/C_InventoryHub/index.jsx` | Chỉnh Sửa | Cập nhật `isReadOnly = Boolean(owner && !farmManager)`; mở rộng `<Can role={["ROLE_WAREHOUSE_STAFF", "ROLE_FARM_MANAGER"]}>`; xóa bỏ 4 hàm `alert(...)` mở 4 Modal; cập nhật banner thông báo quyền quản trị cho Farm Manager. |
| 8 | `backend/src/main/java/com/farm/saas/modules/inventory/controller/StocktakeController.java` | Chỉnh Sửa | Mở rộng đường dẫn `@PostMapping(value = {"/{id}/count", "/{id}/record-count"})` cho endpoint ghi nhận kiểm đếm thực tế. |

### 3.2. Kiểm tra Tuyệt Đối: Xóa Bỏ Hoàn Toàn `alert(...)`
Kết quả quét `grep_search` trên toàn bộ thư mục `frontend/src/workspaces/C_InventoryHub/`:
- **Số lượng `alert(...)` còn lại:** `0` (Zero results found).
- 100% thông báo thành công / thất bại chuyển sang hệ thống `toast` của `@/store/useToastStore`.

---

## 4. KẾT QUẢ KIỂM THỬ & ĐỘ TIN CẬY (VERIFICATION)

### 4.1. Backend Build & Integration Tests
- Lệnh chạy: `mvn test-compile` và `mvn test`
- Kết quả:
  ```
  [INFO] Tests run: 43, Failures: 0, Errors: 0, Skipped: 0
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] ------------------------------------------------------------------------
  [INFO] Total time: 49.403 s
  ```
- 43/43 bài kiểm thử bảo mật Multi-Tenant, phân quyền 4 cấp, cô lập dữ liệu, giới hạn gói dịch vụ và kiểm soát tồn kho đồng thời đều vượt qua 100%.

### 4.2. Frontend Build & Vitest Tests
- Lệnh chạy: `npm run build`
  ```
  ✓ 1775 modules transformed.
  dist/index.html                     1.01 kB │ gzip:   0.60 kB
  dist/assets/index-CQjEaeHF.css     74.74 kB │ gzip:  12.10 kB
  dist/assets/index-BGaCCoKO.js   1,316.24 kB │ gzip: 329.87 kB
  ✓ built in 5.35s
  ```
- Lệnh chạy: `npx vitest run`
  ```
  Test Files  2 passed (2)
  Tests  9 passed (9)
  ✓ Owner Role UI Flow & Security Isolation Tests > Assert 4.1: Trên UI WS-C khi isOwner = true, kiểm tra DOM không render các nút tạo phiếu nhập/xuất kho của Thủ kho
  ```
- 0 lỗi biên dịch, 0 cảnh báo import không tồn tại.

---

## 5. KẾT LUẬN & SẴN SÀNG CHO TASK 6
Task 5 đã hoàn tất 100% mục tiêu:
- Workspace C đã sở hữu quy trình giao dịch kho hoàn chỉnh từ Lập phiếu -> Quét mã vạch -> Kiểm đếm thực tế -> Phê duyệt chốt số liệu.
- Phân quyền Maker - Checker được thực thi nhất quán cả Frontend và Backend.
- Hệ thống đã sẵn sàng cho **TASK 6** (Nhiệm vụ cuối cùng trong kế hoạch kiểm toán hoàn thiện hệ thống).
