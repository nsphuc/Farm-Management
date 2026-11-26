# Báo Cáo Kiểm Thử Cô Lập Đa Chi Nhánh & Đa Trang Trại (Đợt A — Isolation & IDOR Test Report)

- **Ngày thực hiện**: 2026-11-26
- **Môi trường**: Backend `http://localhost:8080/api/v1` (sau Flyway V7), Frontend `http://localhost:5173`, MySQL `farm_saas_dev` (port `3308`)
- **Phạm vi kiểm thử**:
  - **A1**: Tấn công giả mạo tham số chéo chi nhánh (Cross-Branch Tampering: nhân sự CN1 truyền `?branchId=2`).
  - **A2**: Chủ trại điều chuyển nhân sự (`tech` `0966333444`) từ CN1 → CN2 và hoàn tác về CN1 trên Chrome.
  - **A3**: Đối chiếu số liệu `Toàn chuỗi (ALL)` vs `CN1` vs `CN2` trên Dashboard, Cashbook, Workforce, Warehouses, Inventory, Purchase Invoices, Sales.
  - **A4**: Tấn công chéo trang trại (Cross-Tenant IDOR: tài khoản Trang trại 1 gọi `/farms/2/...` và `?farmId=2`).

---

## 1. Tóm tắt Kết quả (4 hạng mục)

| Hạng mục | Kết quả | Mức độ nghiêm trọng | Tóm tắt phát hiện |
|---|---|---|---|
| **A1 — Cross-Branch Tampering (`?branchId=2`)** | **FAIL** | **CRITICAL** (`ISO-01`) | Toàn bộ 10 API dữ liệu chính chấp nhận `?branchId=2` từ nhân sự CN1 và trả về `200 OK` dữ liệu thật của Chi nhánh 2 (Trại Gà). |
| **A2 — Đổi Chi nhánh nhân sự (CN1 ↔ CN2)** | **PASS** *(1 lỗi UX nhỏ)* | **MEDIUM** (`ISO-05`) | Đổi `tech` sang CN2 hoạt động chuẩn (TopBar, Chuồng, Kho đổi hoàn toàn sang Trại Gà); lỗi nhỏ: khi Owner ở `ALL`, dropdown chi nhánh trong Modal chỉ hiện 1 fallback `Chi nhánh 1`. |
| **A3 — Tổng hợp `ALL = CN1 + CN2` & Lọc Chi nhánh** | **FAIL** | **HIGH** (`ISO-03`, `ISO-04`) | `Cashbook` & `Workforce` bỏ qua hoàn toàn `branchId`; `Dashboard` `ALL` không cộng gộp `CN1 + CN2` và Frontend còn trộn số liệu tĩnh (`24.855 con`, `185.4M`, `284.5M`, pie chart `7.005 con`). |
| **A4 — Cross-Tenant IDOR (`/farms/2/...`)** | **FAIL** | **CRITICAL** (`ISO-02`) | 6 Controller trả `200 OK` (lộ dữ liệu Farm 2) và `AddonsOperationsController` trả `500` thay vì `403 Forbidden` do thiếu `@farmSecurity.canAccessFarm(#farmId)`. |

---

## 2. Chi tiết Bằng chứng Kiểm thử

### 2.1. `ISO-01` [CRITICAL] — Lộ dữ liệu Chéo Chi Nhánh (Cross-Branch Tampering)
Các tài khoản nhân sự đang có `assignedBranchId = 1` (Chi nhánh 1 — Trại Heo) gửi request trực tiếp với `?branchId=2`:

| Tài khoản (CN1) | Endpoint gọi trực tiếp | HTTP | Kết quả thực tế (LỖI) |
|---|---|---|---|
| `MGR` (`0977111222`) | `GET /farms/1/warehouses?branchId=2` | **200** | Trả kho thuộc CN2 (`branchId: 2, zoneName: "Khu A"`) |
| `MGR`, `ACCT`, `TECH` | `GET /farms/1/inventory?branchId=2` | **200** | Trả tồn kho CN2 (`warehouseId: 4, skuCode: "CAM-BOM-277"`) |
| `MGR`, `ACCT` | `GET /farms/1/purchase-invoices?branchId=2` | **200** | Trả hóa đơn CN2 (`id: 9, branchId: 2, invoiceNumber: "PN-2026-002"`) |
| `MGR` | `GET /farms/1/inventory/stocktakes?branchId=2` | **200** | Trả phiếu kiểm kê CN2 (`STK-2026112...`, `Cám A`) |
| `MGR`, `WORKER` | `GET /barns?farmId=1&branchId=2` | **200** | Trả chuồng CN2 (`Chuồng Gà Thịt 01`, `Chuồng A2, branchId: 2`) |
| `MGR` | `GET /zones?farmId=1&branchId=2` | **200** | Trả khu nuôi CN2 (`Khu C - Gà thịt`) |
| `MGR`, `WORKER` | `GET /farms/1/dashboard/summary?branchId=2` | **200** | Trả `"branchName": "Chi nhánh 2 — Phân khu Trại Gà", "livestockType": "POULTRY"` |

- **Nguyên nhân gốc**: `FarmSecurityEvaluator.getAssignedBranchId(farmId)` mới chỉ được gọi trong `BranchServiceImpl`, chưa được áp dụng để ghi đè/chặn `branchId` tại các controller/service dữ liệu.

### 2.2. `ISO-02` [CRITICAL] — Lỗ hổng Chéo Trang Trại (Cross-Tenant IDOR)
Dùng token của `OWNER` / `ACCT` thuộc **Trang trại 1 (`farmId = 1`)** gọi tài nguyên của **Trang trại 2 (`farmId = 2`)**:

| Controller / Endpoint | HTTP Thực tế | Kỳ vọng | Trạng thái |
|---|---|---|---|
| `GET /farms/2/branches`, `/warehouses`, `/inventory`, `/inventory/transfers`, `/inventory/issues`, `/inventory/stocktakes`, `/settings/members?farmId=2` | **403** | 403 | **PASS** |
| `GET /farms/2/purchase-invoices` (`PurchaseInvoiceController`) | **200** | 403 | **FAIL (IDOR)** |
| `GET /farms/2/sales` (`FarmSalesController`) | **200** | 403 | **FAIL (IDOR)** |
| `GET /farms/2/cashbook` (`CashbookController`) | **200** | 403 | **FAIL (IDOR)** |
| `GET /farms/2/workforce/overview` (`WorkforceController`) | **200** (2.441 bytes) | 403 | **FAIL (IDOR)** |
| `GET /farms/2/dashboard/summary` (`DashboardController`) | **200** (1.386 bytes) | 403 | **FAIL (IDOR)** |
| `GET /barns?farmId=2`, `GET /zones?farmId=2` (`BarnBatchController`) | **200** | 403 | **FAIL (IDOR)** |
| `GET /addons/*?farmId=2` (`AddonsOperationsController`) | **500** | 403 | **FAIL (thiếu guard)** |

### 2.3. `ISO-03` [HIGH] — `Cashbook` & `Workforce` bỏ qua hoàn toàn `branchId`
- **`GET /farms/1/cashbook`** (`ALL` vs `?branchId=1` vs `?branchId=2`): Đều trả đúng 5 dòng giống hệt nhau (`totalIncome = 1.000.000 đ`, `totalExpense = 26.700.000 đ`, `Tồn quỹ = 204.300.000 đ`).
- **`GET /farms/1/workforce/overview`** (`ALL` vs `?branchId=1` vs `?branchId=2`): Đều trả danh sách `5 người cố định + 2 tổ thời vụ`, `totalMonthlySalaryFund = 54.000.000 đ`, `totalAdvancePaid = 200.000 đ`.
- **Ghi chú**: Các module `Warehouses` (`4 = 2 + 2`), `Inventory` (`7 = 4 + 3`), `Purchase Invoices` (`8 = 6 + 2`), `Sales` (`CN1 = 1, CN2 = 0`) lọc theo chi nhánh **chính xác**.

### 2.4. `ISO-04` [HIGH] — `Dashboard` lệch tổng hợp `Toàn chuỗi (ALL)` & còn dữ liệu tĩnh
- **Backend `GET /farms/1/dashboard/summary`**:
  - Không truyền `branchId` (`ALL`): trả `branchId = 1, totalActiveHeads = 88` (rơi về CN1 thay vì cộng gộp `88 + 3.530 = 3.618`).
- **Frontend `/app/dashboard`** (`ISO-A3-owner-dashboard-all.png`):
  - `CN1` hiển thị `1.025 con / 4 chuồng`, `CN2` hiển thị `6.130 con / 3 chuồng` → Tổng đúng phải là `7.155 con / 7 chuồng`, nhưng `ALL` hiển thị **`24.855 con / 9 chuồng`**.
  - Thẻ `TỔNG GIÁ TRỊ TỒN KHO: 185.400.000 đ`, `TỒN QUỸ THỰC TẾ: 284.500.000 đ` và biểu đồ tròn `Cơ cấu Đàn vật nuôi (7.005 con)` giữ nguyên dữ liệu tĩnh kể cả khi chuyển chi nhánh (nhân sự `tech` ở CN2 Trại Gà vẫn thấy `Heo thịt 3 máu: 875 con` trên biểu đồ tròn).

### 2.5. `ISO-05` [MEDIUM] — Kiểm thử đổi chi nhánh nhân sự (A2)
- **PASS**: Chủ trại đổi `Lê Kỹ Thuật` (`0966333444`) từ CN1 → CN2 (`ISO-A2-owner-assign-cn2.png`), đăng nhập lại bằng `tech` thấy TopBar khóa cứng `Chi nhánh 2 — Phân khu Trại Gà`, `/app/barns` chỉ hiển thị 4 chuồng Gà CN2, `/app/inventory` chỉ hiển thị 2 kho & 3 SKU CN2 (`ISO-A2-tech-switched-to-cn2.png`). Đã hoàn tác `tech` về `branchId = 1` thành công.
- **Lỗi UX nhỏ**: Khi Chủ trại đang để bộ lọc TopBar ở `Toàn chuỗi (ALL)` rồi mở modal `Phân quyền & Gán chuồng` tại `GeneralSettingsPage.jsx`, danh sách chi nhánh chưa được tải đầy đủ (chỉ hiện 1 fallback `Chi nhánh 1`).

---

## 3. Đề xuất Kế hoạch Khắc phục (3 Nhóm gọn nhẹ)

1. **Nhóm 1 (CRITICAL — Vá Cross-Tenant IDOR `ISO-02` & Cross-Branch `ISO-01`)**:
   - Thêm helper `resolveEffectiveBranchId(Long farmId, Long requestedBranchId)` trong `FarmSecurityEvaluator`: nếu user có `assignedBranchId != null` → bắt buộc trả về `assignedBranchId` (hoặc ném `AccessDeniedException` nếu `requestedBranchId != null && !requestedBranchId.equals(assignedBranchId)`). Áp dụng nhất quán cho các controller/service dữ liệu (`BarnBatch`, `Warehouse`, `Inventory`, `PurchaseInvoice`, `FarmSales`, `Dashboard`, `Cashbook`, `Workforce`).
   - Bổ sung `and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))` vào `@PreAuthorize` của 7 controller còn thiếu (`PurchaseInvoiceController`, `FarmSalesController`, `CashbookController`, `WorkforceController`, `DashboardController`, `BarnBatchController`, `AddonsOperationsController`).
2. **Nhóm 2 (HIGH — Lọc `branchId` cho `Cashbook` & `Workforce` — `ISO-03`)**:
   - Lọc `FarmExpense` theo `branchId` (qua `farm_expenses.branch_id` hoặc liên kết `livestock_group` / `purchase_invoice` / `sales_order`) trong `CashbookController`, và lọc nhân sự theo `farm_members.branch_id` trong `WorkforceController`.
3. **Nhóm 3 (HIGH/MEDIUM — Chuẩn hóa `Dashboard` `ALL = CN1 + CN2` & Modal chọn Chi nhánh — `ISO-04`, `ISO-05`)**:
   - Sửa `DashboardController` khi `branchId == null` cộng gộp thật toàn bộ chi nhánh của farm; gỡ số liệu mock tĩnh trên `DashboardPage.jsx` (`185.4M`, `284.5M`, pie chart `7.005 con`).
   - Trong `GeneralSettingsPage.jsx`, luôn tải danh sách chi nhánh thật của `currentFarmId` khi mở Modal `Phân quyền & Gán chuồng` bất kể TopBar đang ở `ALL`.

---

## 4. Ảnh Minh Chứng (`docs/testing/isolation-test/screenshots/`)
- `ISO-A2-owner-assign-cn2.png`: Chủ trại mở modal gán `Lê Kỹ Thuật` sang `Chi nhánh 2 — Phân khu Trại Gà`.
- `ISO-A2-tech-switched-to-cn2.png`: `tech` đăng nhập lại thấy TopBar khóa `Chi nhánh 2`, chỉ hiện chuồng Gà & kho Trại Gà.
- `ISO-A3-owner-dashboard-all.png`: Chủ trại xem `/app/dashboard` chế độ `Toàn chuỗi (ALL)` cho thấy lệch số liệu (`24.855 con`) và số liệu tĩnh.


---

## 5. Kết quả Kiểm thử Hồi quy Sau Khắc phục (`ISO-01` – `ISO-05` — 2026-11-26)

| Hạng mục | Kết quả | Bằng chứng kiểm chứng thực tế |
|---|---|---|
| **`ISO-01` (Cross-Branch Tampering)** | **PASS** | **13/13 API** đều trả **`403 Forbidden`** khi nhân sự CN1 (`MGR`, `ACCT`, `TECH`, `WORKER`) truyền `?branchId=2`. |
| **`ISO-02` (Cross-Tenant IDOR)** | **PASS** | **11/11 API** đều trả **`403 Forbidden`** khi tài khoản Farm 1 gọi `/farms/2/...` hoặc `?farmId=2`. |
| **`ISO-03` (`Cashbook` & `Workforce`)** | **PASS** | Trên API & Chrome: `CN1` (`+1M / -26.7M / 204.3M`; `5 người cố định, 57.2M`) tách biệt hoàn toàn với `CN2` (`0 đ`; `0 người cố định, 0 đ`). (`ISO-REG-02`) |
| **`ISO-04` (`Dashboard ALL = CN1 + CN2`)** | **PASS** | `CN1` (`88 con / 1 chuồng / tồn kho 87.900.000 đ`) + `CN2` (`3.530 con / 2 chuồng / tồn kho 53.446.140 đ`) = `ALL` (`3.618 con / 3 chuồng / tồn kho 141.346.140 đ`, tồn quỹ `204.300.000 đ`). Đã xóa sạch số liệu giả. (`ISO-REG-01`) |
| **`ISO-05` (Modal Chi nhánh khi ở `ALL`)** | **PASS** | Mở modal `Phân quyền & Gán chuồng` khi TopBar đang ở `Toàn chuỗi (ALL)` vẫn hiển thị đầy đủ cả `Chi nhánh 1` & `Chi nhánh 2`. (`ISO-REG-03`) |
