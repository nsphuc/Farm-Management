# BÁO CÁO HOÀN THÀNH NHIỆM VỤ THỰC THI (TASK 2 / 3 - ROLE_TECHNICAL_STAFF)
**Dự án:** Agri-ERP Multi-Tenant SaaS  
**Vai trò thực hiện:** Principal Software Architect & Senior Fullstack Engineer  
**Đối tượng:** `ROLE_TECHNICAL_STAFF` (Kỹ sư Kỹ thuật Nông nghiệp / Bác sĩ Thú y & KCS - Tài khoản mẫu: `tech`)  
**Mã lỗ hổng giải quyết triệt để:** `GAP-TECH-06` và `GAP-TECH-09`  
**Ngày hoàn thành:** 25/10/2026  

---

## I. TỔNG QUAN KẾT QUẢ THỰC HIỆN

Trong Task 2 / 3, toàn bộ trục liên thông dữ liệu tự động giữa **WS-E (Sản xuất & Thú y)** $\leftrightarrow$ **WS-C (Tồn kho & Phiếu xuất)** $\leftrightarrow$ **WS-H1 (Chi phí giá thành)** $\leftrightarrow$ **WS-A (Sơ đồ vị trí Ô / Luống / Chuồng)** đã được khơi thông 100%, tuân thủ nghiêm ngặt các nguyên tắc kiến trúc:
1. **Tuyệt đối bảo toàn Flyway Checksum:** Không sửa đổi bất kỳ file migration cũ nào (`V1_0` $\rightarrow$ `V1_5`), sử dụng cấu trúc bảng hiện hành.
2. **Auto-Backflushing nguyên tử (Atomic Transaction):** Khi Kỹ sư thú y lưu sự kiện điều trị hoặc tiêm phòng có vật tư, hệ thống tự động:
   - Tạo `LivestockEvent` gắn với đàn hoặc cá thể RFID.
   - Tự động sinh `WarehouseIssue` loại `INTERNAL_USE` với `referenceType = 'LIVESTOCK_EVENT'`.
   - Trừ kho tức thời theo số lô ưu tiên cận hạn nhất (**FEFO**).
   - Tự động hạch toán chi phí thuốc và chi phí dịch vụ thuê ngoài vào bảng `farm_expenses` để tính giá thành lứa nuôi.
3. **Đồng bộ vị trí địa lý tự động (WS-E $\leftrightarrow$ WS-A):**
   - Khi khởi tạo Mùa vụ trồng trọt hoặc Đàn nuôi có gán `locationId` (hoặc phân khu có 1 ô duy nhất), trạng thái ô/luống trong `zone_locations` tự động chuyển sang **`OCCUPIED`**.
   - Khi Mùa vụ đóng (`CLOSED` / xóa) hoặc Đàn nuôi xuất bán hết (`SOLD` / `CLOSED` / xóa), hệ thống kiểm tra phân khu nếu không còn vụ/đàn nào hoạt động thì tự động hoàn trả các vị trí về **`EMPTY`**.
   - Frontend kích hoạt `useActiveFarmStore.getState().notifyDataChanged('all')` để người dùng ở bất kỳ Workspace nào (WS-A, WS-C, WS-E, WS-H1) đều nhìn thấy dữ liệu mới nhất mà không cần tải lại trang.

---

## II. CHI TIẾT CÁC HẠNG MỤC ĐÃ THỰC THI

### 1. Nâng cấp Modal Sự Kiện Thú Y & Kích Hoạt Auto-Backflushing (`GAP-TECH-06`)

#### 1.1. Backend (`CreateLivestockEventRequest.java`, `LivestockServiceImpl.java`, `InventoryQueryController.java`)
- **[InventoryQueryController.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/inventory/controller/InventoryQueryController.java):**
  - Mở khóa quyền tra cứu tồn kho khả dụng cho `ROLE_TECHNICAL_STAFF`, `PERM_LIVESTOCK_VET`, `PERM_CROP_LOG` trên các endpoint:
    - `GET /api/v1/farms/{farmId}/inventory`
    - `GET /api/v1/farms/{farmId}/inventory/summary`
    - `GET /api/v1/farms/{farmId}/inventory/transactions`
- **[CreateLivestockEventRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/dto/request/CreateLivestockEventRequest.java):**
  - Hỗ trợ đầy đủ: `targetType` (`'GROUP'` | `'INDIVIDUAL'`), alias `groupId` & `livestockGroupId`, alias `individualId` & `livestockIndividualId`.
  - Mở rộng tập hợp `eventType`: `'VACCINATION'`, `'DISEASE_TREATMENT'`, `'BIRTH'`, `'MORTALITY'`, `'CULLING'`, `'SOLD'`, `'WEIGHT_CHECK'`, `'BREEDING'`, `'TRANSFER'`, `'SLAUGHTER'`.
  - Bổ sung `headCountAffected`, `totalCost`, `withdrawalEndDate`, và danh sách vật tư `supplies` (chấp nhận cả `actualQuantity` và `quantity`).
- **[LivestockServiceImpl.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/service/impl/LivestockServiceImpl.java):**
  - Tự động tính toán `withdrawalEndDate = eventDate.plusDays(withdrawalDays)` nếu frontend không truyền trực tiếp.
  - Tự động cập nhật số lượng đàn hoặc tình trạng cá thể khi diễn ra sự kiện hao hụt/tăng đàn (`MORTALITY`, `CULLING`, `BIRTH`, `DISEASE_TREATMENT`).
  - Tự động sinh `FarmExpense` cho chi phí dịch vụ thuê ngoài (`totalCost`) nếu có.
  - Tự động xuất kho vắc-xin/thuốc theo chuẩn FEFO, giảm tồn kho tức thời và sinh thẻ kho.

#### 1.2. Frontend (`FarmingLogsTimelineTab.jsx`)
- **[FarmingLogsTimelineTab.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/E_FarmingOps/components/FarmingLogsTimelineTab.jsx):**
  - **Tải dữ liệu Kho & Tồn kho:** Khi mở Modal Thú y, tự động gọi `masterDataService.getWarehouses(farmId)`, `inventoryService.getInventory({ farmId, size: 300 })` và `masterDataService.getMaterials({ farmId, size: 300 })`.
  - **Lọc và sắp xếp FEFO:** Danh sách lô thuốc được lọc chỉ lấy các lô có `availableQuantity > 0`, sắp xếp ưu tiên hạn dùng gần nhất (`expiryDate ASC`).
  - **Tính toán Thời gian ngưng thuốc (Withdrawal Period):**
    - Nhập số ngày cách ly (`withdrawalDays`) $\rightarrow$ tự động tính ngày kết thúc (`withdrawalEndDate`).
    - Hoặc chọn trực tiếp ngày kết thúc $\rightarrow$ tự động tính số ngày cách ly.
    - Hiển thị **Badge cảnh báo viền vàng nhấp nháy**: *"⛔ KHÓA XUẤT BÁN / GIẾT MỔ: Đàn nuôi bị hạn chế xuất bán đến hết ngày DD/MM/YYYY"*.
    - **Gợi ý tự động thông minh:** Khi chọn loại thuốc có cấu hình `defaultPhiDays > 0`, hệ thống tự động gợi ý nâng `withdrawalDays` lên tối thiểu bằng số ngày ngưng thuốc của loại thuốc đó.
  - **Bảng Kê Đơn Thuốc Xuất Kho Tự Động (`supplies`):**
    - Nút `[+ Thêm Thuốc / Vắc-xin Xuất Kho]` cho phép kê đơn nhiều dòng thuốc.
    - Mỗi dòng gồm: Chọn Kho xuất $\rightarrow$ Chọn Thuốc $\rightarrow$ Chọn Lô FEFO $\rightarrow$ Nhập Số lượng xuất kèm Đơn vị tính.
    - Kiểm tra giới hạn: Báo lỗi trực tiếp nếu số lượng xuất vượt quá tồn khả dụng trong lô.
  - **Đồng bộ đa Workspace:** Sau khi tạo sự kiện thành công, gọi `useActiveFarmStore.getState().notifyDataChanged('all')`, tự động làm mới tồn kho WS-C, chi phí giá thành WS-H1 và timeline WS-E.

---

### 2. Đồng Bộ Tự Động Trạng Thái Ô / Luống / Chuồng (`zone_locations`) Giữa WS-E và WS-A (`GAP-TECH-09`)

#### 2.1. Backend (`CropSeasonServiceImpl.java`, `LivestockServiceImpl.java`, Request DTOs)
- **Bổ sung trường `Long locationId`:**
  - [CreateCropSeasonRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/dto/request/CreateCropSeasonRequest.java)
  - [UpdateCropSeasonRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/crop/dto/request/UpdateCropSeasonRequest.java)
  - [CreateLivestockGroupRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/dto/request/CreateLivestockGroupRequest.java)
  - [UpdateLivestockGroupRequest.java](file:///d:/Projects/Farm_Management/backend/src/main/java/com/farm/saas/modules/livestock/dto/request/UpdateLivestockGroupRequest.java)
- **Tự động chuyển vị trí sang `'OCCUPIED'` khi tạo vụ/đàn:**
  - Trong `CropSeasonServiceImpl.createSeason` và `LivestockServiceImpl.createGroup`: Nếu có `locationId`, tìm `ZoneLocation` tương ứng, cập nhật `status = "OCCUPIED"`. Nếu không truyền `locationId` nhưng phân khu chỉ có 1 vị trí duy nhất đang `EMPTY`, tự động chuyển vị trí đó sang `OCCUPIED`.
- **Tự động giải phóng vị trí về `'EMPTY'` khi đóng vụ/đàn:**
  - Trong `CropSeasonServiceImpl.closeSeason` / `deleteSeason` / `updateSeason` (khi status chuyển sang `CLOSED` / `CANCELLED`) và `LivestockServiceImpl.updateGroup` (khi status chuyển sang `SOLD` / `CLOSED` / `CULLED`) / `closeGroup` / `deleteGroup`:
    - Hệ thống kiểm tra xem trong phân khu đó (`zoneId`) còn vụ mùa nào đang hoạt động (`status != CLOSED && status != CANCELLED`) hoặc đàn nuôi nào đang hoạt động (`status != SOLD && status != CLOSED && status != CULLED`) hay không.
    - Nếu không còn vụ/đàn nào hoạt động, tự động cập nhật toàn bộ `zone_locations` đang `OCCUPIED` thuộc phân khu đó trở về **`'EMPTY'`**.

#### 2.2. Frontend (`CropSeasonModal.jsx`, `LivestockGroupModal.jsx`, `E_FarmingOps/index.jsx`)
- **[CropSeasonModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/E_FarmingOps/components/CropSeasonModal.jsx):**
  - Tải danh sách vị trí chi tiết qua `geographyService.getLocations(farmId, zoneId)` khi người dùng chọn phân khu.
  - Hiển thị Dropdown *"Vị trí / Luống / Ô cụ thể (locationId - Tùy chọn)"*, thể hiện rõ tên, mã và trạng thái (`EMPTY` / `OCCUPIED`).
  - Gửi `locationId` trong payload tạo/sửa mùa vụ và gọi `notifyDataChanged('all')`.
- **[LivestockGroupModal.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/E_FarmingOps/components/LivestockGroupModal.jsx):**
  - Tải danh sách ô chuồng chi tiết qua `geographyService.getLocations(farmId, zoneId)` khi chọn phân khu chuồng.
  - Hiển thị Dropdown *"Ô chuồng / Vị trí cụ thể (locationId - Tùy chọn)"*.
  - Gửi `locationId` trong payload và gọi `notifyDataChanged('all')`.
- **[E_FarmingOps/index.jsx](file:///d:/Projects/Farm_Management/frontend/src/workspaces/E_FarmingOps/index.jsx):**
  - Trong `handleCloseCropSeason`, `handleCloseLivestockGroup`, `handleDeleteCropSeason`, `handleDeleteLivestockGroup`: Bổ sung `notifyDataChanged?.('all')` và `notifyDataChanged?.('locations')` để sơ đồ vị trí chuồng trại (WS-A) lập tức phản chiếu trạng thái trống `EMPTY`.

---

## III. KẾT QUẢ KIỂM THỬ HỆ THỐNG

### 1. Backend Testing (`mvn test`)
- Đã mở rộng bộ test tích hợp [LivestockAdgAndVetBackflushingIntegrationTest.java](file:///d:/Projects/Farm_Management/backend/src/test/java/com/farm/saas/LivestockAdgAndVetBackflushingIntegrationTest.java) với test case kiểm thử tự động toàn diện:
  - `TC-LIVE-001`: Tính tốc độ tăng trọng ADG & Sự kiện tiêm vắc xin Auto-Backflushing (giảm tồn kho từ 50 xuống 45 liều, ngày ngưng thuốc +21 ngày).
  - `GAP-TECH-09`: Tự động đồng bộ trạng thái Ô chuồng / Vị trí `OCCUPIED` khi tạo Mùa vụ / Đàn nuôi và giải phóng về `EMPTY` khi kết thúc.
- **Kết quả thực thi:**
  ```text
  [INFO] Running com.farm.saas.CropFarmingLogAutoBackflushingIntegrationTest
  [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.farm.saas.CropFarmingLogAutoBackflushingIntegrationTest
  [INFO] Running com.farm.saas.FarmSaasApplicationTests
  [INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 -- in com.farm.saas.FarmSaasApplicationTests
  [INFO] Running com.farm.saas.LivestockAdgAndVetBackflushingIntegrationTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in com.farm.saas.LivestockAdgAndVetBackflushingIntegrationTest
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] Total time: 17.807 s
  ```
  **100% PASS** (11/11 tests đạt).

### 2. Frontend Testing (`npm run build` & `npx vitest run`)
- **Biên dịch Production (`npm run build`):**
  ```text
  ✓ 1781 modules transformed.
  dist/index.html                   1.01 kB
  dist/assets/index-BJqk8Wz7.css   75.06 kB
  dist/assets/index-DBjRqQnx.js 1,405.67 kB
  ✓ built in 3.66s
  ```
  **0 lỗi biên dịch.**
- **Kiểm thử giao diện (`npx vitest run`):**
  ```text
  Test Files  2 passed (2)
       Tests  9 passed (9)
    Duration  2.51s
  ```
  **100% PASS.**

---

## IV. BẢNG TỔNG HỢP TRẠNG THÁI CÁC LỖ HỔNG

| Mã Lỗ Hổng | Tên Lỗ Hổng | Phạm Vi Ảnh Hưởng | Trạng Thái Sau Task 2/3 |
|---|---|---|---|
| `GAP-TECH-06` | Modal Sự kiện Thú y thiếu bảng kê đơn vật tư Auto-backflushing & cảnh báo ngưng thuốc | Backend DTOs, `LivestockServiceImpl`, Frontend `FarmingLogsTimelineTab.jsx` | **ĐÃ GIẢI QUYẾT TRIỆT ĐỂ (RESOLVED)** |
| `GAP-TECH-09` | Trạng thái Ô/Luống/Chuồng (`zone_locations`) không đồng bộ giữa WS-E và WS-A | Backend `CropSeasonServiceImpl`, `LivestockServiceImpl`, Frontend `CropSeasonModal`, `LivestockGroupModal` | **ĐÃ GIẢI QUYẾT TRIỆT ĐỂ (RESOLVED)** |

---

## V. CÁC TẬP TIN ĐÃ THAY ĐỔI
1. `backend/src/main/java/com/farm/saas/modules/inventory/controller/InventoryQueryController.java`
2. `backend/src/main/java/com/farm/saas/modules/livestock/dto/request/CreateLivestockEventRequest.java`
3. `backend/src/main/java/com/farm/saas/modules/crop/dto/request/CreateCropSeasonRequest.java`
4. `backend/src/main/java/com/farm/saas/modules/crop/dto/request/UpdateCropSeasonRequest.java`
5. `backend/src/main/java/com/farm/saas/modules/livestock/dto/request/CreateLivestockGroupRequest.java`
6. `backend/src/main/java/com/farm/saas/modules/livestock/dto/request/UpdateLivestockGroupRequest.java`
7. `backend/src/main/java/com/farm/saas/modules/crop/service/impl/CropSeasonServiceImpl.java`
8. `backend/src/main/java/com/farm/saas/modules/livestock/service/impl/LivestockServiceImpl.java`
9. `backend/src/test/java/com/farm/saas/LivestockAdgAndVetBackflushingIntegrationTest.java`
10. `frontend/src/workspaces/E_FarmingOps/components/FarmingLogsTimelineTab.jsx`
11. `frontend/src/workspaces/E_FarmingOps/components/CropSeasonModal.jsx`
12. `frontend/src/workspaces/E_FarmingOps/components/LivestockGroupModal.jsx`
13. `frontend/src/workspaces/E_FarmingOps/index.jsx`
14. `.docx/TASK_2_ROLE_TECHNICAL_STAFF_COMPLETION_REPORT.md`
