# Nhật ký công việc (Worklog)

Quy tắc làm việc bắt buộc áp dụng theo [CLAUDE.md](../CLAUDE.md):
1. **Think Before Coding**: Nêu rõ giả định, hỏi lại khi chưa rõ ràng, không tự ý đoán.
2. **Simplicity First**: Code tối giản đúng yêu cầu, không thêm tính năng/trừu tượng hóa thừa.
3. **Surgical Changes**: Chỉ sửa đúng phần liên quan, không động code không liên quan.
4. **Goal-Driven Execution**: Đặt tiêu chí kiểm chứng rõ ràng và xác minh trước khi kết thúc.

---

## 2026-11-25

### 1. Hóa đơn nhập hàng (`/app/purchase-invoices`)
- **Frontend** (`frontend/src/pages/farm/PurchaseInvoicesPage.jsx`):
  - Lọc danh sách **Kho tiếp nhận** (Lựa chọn A) và **Chuồng nuôi & Lứa tiếp nhận** (Lựa chọn B) theo `currentBranchId`, hỗ trợ chọn **Chuồng Trống (Tự động mở lứa mới)**.
  - Đổi cột **Tên sản phẩm** sang Dropdown lấy từ `/api/v1/materials`, lọc theo loại kho đã chọn, tự động điền ĐVT + đơn giá gần nhất, kèm tùy chọn `+ Thêm mã hàng mới...`.
  - Sửa nút `+ + Thêm Mặt Hàng` → `+ Thêm Mặt Hàng`, thêm dòng sạch và tự động sinh mã lô `LOT-YYYYMMDD-XX`.
- **Backend** (`PurchaseInvoiceServiceImpl.java`, `PurchaseInvoiceController.java`, `CreatePurchaseInvoiceRequest.java`, `MaterialDetailResponse.java`, `MaterialServiceImpl.java`):
  - Bổ sung `categoryCode` vào `MaterialDetailResponse`.
  - Nhân số lượng với `conversionRate` sang đơn vị gốc khi cộng `warehouse_inventory` (dùng lock `findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate`) và ghi thẻ kho `warehouse_inventory_transactions`.
  - Tự động tạo `LivestockGroup` mới khi nhập con giống vào Chuồng Trống.
- **Kiểm tra**: `mvn compile -q` & `npm run build` pass (exit code `0`).

### 2. Kho hàng hóa (`/app/inventory`) & Sidebar
- **Frontend** (`frontend/src/pages/farm/InventoryPage.jsx`, `frontend/src/components/layout/DynamicSidebar.jsx`):
  - Ẩn nút `+ Tạo Đơn Nhập Hàng`, chuẩn hóa nút `+ Khai báo Hàng hóa mới` (tồn đầu = `0`).
  - Sửa cột `TỒN KHO ĐA ĐƠN VỊ` hiển thị chuẩn `95 bao (2.375 kg)` kèm `(1 bao = 25 kg)` và tách rõ ĐVT nhập / Hệ số quy đổi / ĐVT gốc.
  - Sửa Sidebar `+ + Thêm kho mới` → `+ Thêm kho mới` và nối query `?action=create-warehouse` để mở modal tạo kho.
  - Cải tiến modal Quản lý kho: tự động sinh mã kho tăng dần (`KHO-001`, `KHO-002`...), chỉ hiện dropdown **Gắn với Khu nuôi** khi loại kho là Cám, xóa trường **Vị trí thực tế / Mô tả**, và sắp xếp lại bố cục form 2 cột cân đối.
- **Backend** (`InventoryItemResponse.java`, `InventoryServiceImpl.java`):
  - Bổ sung `packUnit`, `baseUnit`, `conversionFactor`, `materialCategoryCode`, `materialCategoryName`, `minStockLevel`, `defaultPhiDays` vào `InventoryItemResponse`.
- **Kiểm tra**: `mvn compile -q` & `npm run build` pass (exit code `0`).

### 3. Xuất nhập nội bộ & Kiểm kê kho (`/app/internal-transfers`)
- **Backend** (`InventoryService.java`, `InventoryServiceImpl.java`, `WarehouseTransferController.java`, `StocktakeController.java`):
  - Bổ sung lọc `branchId` (cô lập theo chi nhánh) cho `getTransfers` và `getStocktakes`.
- **Frontend** (`frontend/src/pages/farm/InternalTransfersPage.jsx`):
  - Thay toàn bộ dữ liệu mock bằng dữ liệu thật từ DB (`getIssues`, `getReceipts`, `getTransfers`, `getStocktakes`, `getWarehouses`, `getBarns`, `getInventory`), cô lập theo `currentBranchId`.
  - Lọc các dropdown Kho, Chuồng & Lứa, Mặt hàng & Lô theo chi nhánh và kho đang chọn; nối các thao tác tạo / duyệt / hủy phiếu với API thật.
- **Kiểm tra**: `mvn compile -q` & `npm run build` pass (exit code `0`).

### 4. Khắc phục trọn bộ Kịch bản 1 (Vòng đời Chăn nuôi & Tự động Trừ kho FEFO)
- **Backend** (`DailyLogServiceImpl.java`, `BarnBatchServiceImpl.java`):
  - Quy đổi chính xác đơn vị trừ kho FEFO (Bao ↔ Kg theo `material.standardUnit` và `MaterialUnitConversion`), lưu `LivestockEventSupply` cho mỗi lần xuất kho từ nhật ký để hạch toán chi phí thực tế và hoàn tồn khi xóa nhật ký.
  - Gỡ toàn bộ chi phí giả lập (`59.525.000đ`, `3.820.000đ`...) và đơn thu hoạch/phụ phẩm giả lập trong `BarnBatchServiceImpl.getBatchById`; tính chi phí thật từ `LivestockGroup.totalCost` (Con giống) và `LivestockEventSupply` (Thức ăn / Thuốc / Vật tư).
- **Frontend** (`DailyLogsPage.jsx`):
  - Tải tồn kho cám/thuốc thật theo chi nhánh (`inventoryService.getInventory`) thay cho mảng mock cứng `FEED_WAREHOUSE_STOCK` / `MEDICINE_WAREHOUSE_STOCK`.
  - Gỡ hardcode `feedWarehouseId: 1` & `medWarehouseId: 2`, truyền đúng `warehouseId` của vật tư hoặc `null` để Backend tự tìm Kho Cám theo Khu nuôi.
  - Dùng đúng `reminders.feedQuota.totalFlockKg` cho cảnh báo vượt định mức cám (>10%).
- **Kiểm tra**: `mvn compile -q` & `npm run build`.

### 5. Kịch bản 2: Xuất bán cân trừ bì nhiều mã, VietQR động & Chốt lãi/lỗ (TC2.1 – TC2.3)
- **TC2.1 (Cấu hình VietQR)**: Sửa lỗi lệch tên trường `bankAccountName` / `bankName` trong `GeneralSettingsPage.jsx` khi tải & lưu `farm_financial_settings`.
- **TC2.2 & TC2.3 (Backend)**: Cập nhật `FarmSalesController.java` (nhận `partnerId` thật thay cho hardcode `1L`, lọc `getSales` theo `branchId`, sinh `vietQrUrl` động từ `FarmFinancialSetting`) và `CashbookController.java` (nhận diện `SALES_HARVEST` là Phiếu Thu `INCOME`).
- **TC2.2 & TC2.3 (Frontend)**: Nâng cấp `SalesPage.jsx` + `financeService.js` với bảng nhiều mã cân trừ bì (`+ Thêm mã cân`, tổng con / cân tịnh / bình quân kg/con / tổng tiền), dropdown thương lái & chuồng đang nuôi cô lập theo `currentBranchId`, preview mã VietQR động ngay trong modal, chọn **Bán tỉa** / **Xuất hết đàn (Đóng lứa)**, thanh toán thực tế / công nợ phải thu và gọi `triggerRefresh()`.
- **Dashboard**: Cập nhật `DashboardPage.jsx` đồng bộ biểu đồ Doanh thu / Chi phí / Lợi nhuận tháng hiện tại từ API thật (`getFarmSales`, `getCashbook`) theo `dataVersion`.
- **Kiểm tra**: `mvn compile -q` & `npm run build`.

### 6. Kịch bản 3: Phân quyền động (RBAC + Data Scope) & Bảo mật giá vốn (TC3.1 – TC3.3)
- **TC3.1 (`GeneralSettingsPage.jsx`)**: Tải danh sách chuồng thật (`barnBatchService.getBarns`) với ID số từ DB thay cho mảng chuỗi giả `['A1', 'A2', ...]`; sửa điều kiện lưu `barnScopeType === 'CUSTOM'` (trước đó so sánh sai `'SPECIFIC'`) để lưu chính xác `all_barns` và `barn_ids` vào bảng `farm_members`.
- **TC3.2 (`DailyLogsPage.jsx`)**: Cập nhật `setRealBarns` kể cả khi API trả rỗng để công nhân chuồng không bị fallback sang danh sách chuồng mẫu.
- **TC3.3 (`BarnsPage.jsx`, `BarnBatchDetailView.jsx`)**: Giới hạn `canViewFinancialPnL` chỉ cho Chủ trại / Kế toán / quyền `financial.view_cost` (`ROLE_FARM_MANAGER` không còn thấy); ẩn hoàn toàn ô **Chi phí / kg** và khối **Biểu đồ Hạch toán Lãi/Lỗ** khi `!canViewFinancials`.
- **Kiểm tra**: `npm run build`.

---

## 2026-11-25 — Kịch bản 4: Nâng cấp Dịch vụ VNPAY & Quản trị Super Admin (TC4.1 – TC4.3)
- **Backend**:
  - `SubscriptionOrderServiceImpl.java`: Trong `mockSuccess`, bổ sung gán `vnpBankCode = "NCB"` và `vnpPayDate` chuẩn `yyyyMMddHHmmss` (UTC) để bản ghi giao dịch `PAID` và gói tin Webhook JSON trên cổng Super Admin đầy đủ thông tin.
- **Frontend**:
  - `GeneralSettingsPage.jsx`: Sửa `handleSimulateWebhook` đọc đúng `res?.orderCode || res?.orderNo`; đồng bộ lại `useAuthStore.getState().setUserInfo(...)` kèm `farmAddOnSubscriptions` ngay sau khi kích hoạt Webhook IPN để Sidebar hiển thị ngay mục dịch vụ mới mà không cần đăng xuất/đăng nhập lại (TC4.1).
  - `AdminTransactionsPage.jsx`: Map bổ sung `serviceName` & `duration` (khớp cột bảng) và parse `payloadJson` an toàn bằng `try/catch` (TC4.2).
  - `routes.jsx`: Cập nhật `PlatformDispatcher` chặn tài khoản đã đăng nhập không phải Super Admin truy cập `/platform/*` và chuyển hướng ngay về `/app/dashboard`; đẩy khách chưa đăng nhập truy cập các đường dẫn con `/platform/*` về `/login` (TC4.3).
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

---

## 2026-11-25 — Kịch bản 5: 5 Phân hệ Mở rộng Chuyên sâu (Add-ons — TC5.1 – TC5.5)
- **Backend (`AddonsOperationsController`, `AddonsOperationsServiceImpl`, `AddonsDto`)**:
  - **TC5.2 (Custom Roles)**: Thêm `GET /api/v1/addons/custom-roles/permissions` trả về danh sách `Permission` thực tế từ bảng `permissions`.
  - **TC5.3 (Breeding)**: Hỗ trợ lọc `branchId` cho `getBreedingSummary`, mặc định `avgBornAlive = 0.0` khi chưa có cá thể đẻ.
  - **TC5.4 (Hatchery)**: Bổ sung `destinationBarnId` vào `FinalizeHatchRequest`; khi `finalizeHatch`, tự động tạo lứa nuôi `LivestockGroup` (`status = ACTIVE`, `entryDate = today`, `initialQuantity = currentQuantity = actualHatchedCount`) vào đúng Chuồng nuôi đã chọn.
  - **TC5.5 (Feed Production)**: Trong `executeFeedOrder`, tự động trừ tồn kho nguyên liệu thô theo FEFO (`WarehouseInventory` + `WarehouseInventoryTransaction` `OUTWARD_PRODUCTION`) và tự động tạo/cộng cám thành phẩm vào kho đích (`WarehouseInventory` + `WarehouseInventoryTransaction` `INWARD_PRODUCTION`).
- **Frontend**:
  - **TC5.1 (`PayrollKpiPage.jsx`)**: Tính `unpaidTotalNet`, hiển thị xem trước Thực lĩnh khi sửa bảng lương, gọi `triggerRefresh()` sau khi chốt chi trả.
  - **TC5.2 (`CustomRolesPage.jsx`, `addonsService.js`, `menuConfig.js`)**: Thay ma trận checkbox giả bằng danh sách quyền thật từ DB cho cả tạo mới và cập nhật vai trò; hỗ trợ `anyPermissions` khi lọc Sidebar menu.
  - **TC5.3 (`BreedingLivestockPage.jsx`)**: Truyền `branchId` khi tải KPI tổng hợp đàn nái.
  - **TC5.4 (`HatcheryPage.jsx`)**: Tải danh sách Chuồng nuôi thật cho modal Chốt nở, hiển thị chính xác 1 chữ số thập phân cho Tỷ lệ có phôi (`92.5%`) & Tỷ lệ nở (`94.6%`), gọi `triggerRefresh()`.
  - **TC5.5 (`FeedProductionPage.jsx`)**: Liên kết danh mục vật tư thật trong BOM (`materialId`), tải danh sách kho thật (`targetWarehouseId`) trong modal Lệnh sản xuất, thêm nút `+ Tạo Lệnh Trộn Cám` ở Tab 2 và gọi `triggerRefresh()`.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

---

## 2026-11-25 — Kiểm tra & Đánh giá Giao diện Tổng thể (UI/UX Audit)
- **Phạm vi**: Rà soát trực tiếp trên trình duyệt Chrome (chế độ chỉ đọc, không sửa code/dữ liệu) toàn bộ Public/Auth, Tenant App (`/app/*`), 5 phân hệ Add-ons, góc nhìn RBAC (Chủ trại, Trại trưởng, Công nhân), Super Admin (`/platform/*`) và Responsive 4 kích thước màn hình (`1920×1080`, `1366×768`, `768×1024`, `390×844`).
- **Tài liệu báo cáo**: Lưu tại `docs/testing/ui-audit/system-ui-audit.md` kèm 24 ảnh chụp minh chứng tại `docs/testing/ui-audit/screenshots/`.

---

## 2026-11-25 — Khắc phục Lỗi UI Audit Đợt 1 (ERR-01 – ERR-05)
- **ERR-01 (RBAC Công nhân & Daily Logs)**:
  - `BarnBatchController.java`: Bổ sung `ROLE_FIELD_STAFF` vào `@PreAuthorize` của `GET /zones`, `GET /barns`, `GET /batches/{id}`.
  - `BarnsPage.jsx`: Nhận diện thêm `ROLE_FIELD_STAFF`, bỏ dữ liệu mẫu cứng khởi tạo (`[]`) để không hiện tab/chuồng giả lập khi chưa có chuồng.
  - `DailyLogsPage.jsx`: Khởi tạo `realBarns = []`, khóa/ẩn form nhập liệu với thông báo rõ ràng khi chưa có chuồng được chọn và bỏ chuỗi khuyết `"Tại  —"`.
- **ERR-02 (`GeneralSettingsPage.jsx`)**:
  - Sửa trạng thái mặc định danh sách nhân sự Tab 2 (`Đang hoạt động` thay vì gán nhầm `Chờ xác nhận` khi backend không trả trường `status`) và sửa nhãn fallback `Khu nuôi: Không có` (bị ghi nhầm thành `Kho: Không có`).
- **ERR-03 (`BarnsPage.jsx`, `DailyLogsPage.jsx`)**:
  - Map và tính `mortalityCount` / `mortalityRatePct` cho thẻ chuồng nuôi (fallback `0`); map `currentAgeDays` và làm tròn `quantityKg` 2 chữ số thập phân ở `DailyLogsPage.jsx`.
- **ERR-04 (`SuperAdminPortalController.java`, `AdminDashboardPage.jsx`, `AdminLayout.jsx`, `AdminFarmsPage.jsx`)**:
  - Đồng bộ `recentActivities` và cơ cấu loại hình trang trại theo dữ liệu thật trong DB; định dạng tiền tệ `formatVnd(act.amount)` trên Dashboard; bỏ badge số tĩnh `128` / `2 lỗi` ở Sidebar Admin; bổ sung tên tiếng Việt cho `CUSTOM_ROLES`.
- **ERR-05 (`InventoryPage.jsx`, `InternalTransfersPage.jsx`, `FeedProductionPage.jsx`)**:
  - Chuẩn hóa `activeFarmId` (tránh gửi `'ALL'` hoặc `undefined` vào `/farms/{farmId}/...`); xử lý nghịch đảo `conversionFactor < 1` (`1 bao = 25 kg`) và hiển thị `"Đã quá hạn X ngày"` cho lô quá hạn âm.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

---

## 2026-11-25 — Khắc phục Lỗi UI Audit Đợt 2 (ERR-06 – ERR-09)
- **ERR-06 (`AddonsOperationsServiceImpl.java`, `HatcheryPage.jsx`)**:
  - Đặt giá trị mặc định `fertilityRate = 0.0`, `hatchRate = 0.0` khi chưa có mẻ ấp nào trong DB/UI, tránh hiển thị số liệu giả lập khi bảng trống.
- **ERR-07 (`CustomRolesPage.jsx`)**:
  - Bổ sung đầy đủ từ điển `MODULE_LABELS` tiếng Việt cho mọi nhóm quyền (`BARN`, `DAILY_LOG`, `CASHFLOW`, `ADDON_BRANCHES`, `ADDON_PAYROLL`, `ADDON_ROLES`, `ADDON_BREEDING`, `ADDON_HATCHERY`, `ADDON_FEED_MILL`...) và hiển thị đầy đủ quyền cho `ROLE_SUPER_ADMIN`.
- **ERR-08 (`FormControls.jsx`, `AuthLayout.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`)**:
  - Tự động loại bỏ dấu `*` dư trong prop `label` tại `FormField` khi `required=true` (khắc phục triệt để lỗi `* *` trên toàn bộ form); bỏ nút `Quay lại trang chủ` bị trùng ở `LoginPage` / `RegisterPage` (giữ lại 1 nút ở `AuthLayout`); bỏ ghi chú kỹ thuật `(ADR-02 In-Memory Token)` ở footer Auth.
- **ERR-09 (`DynamicSidebar.jsx`, `DashboardPage.jsx`)**:
  - Thống nhất thương hiệu hiển thị **FarmGo** / **FarmGo v2.0** (thay `GREENFARM` / `Agri-ERP v2.0`); tăng `width={68}` cho `YAxis` trên biểu đồ `DashboardPage` để nhãn `1400 kg` không bị rớt dòng.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

---

## 2026-11-25 — Khắc phục Lỗi UI Audit Đợt 3 (ERR-10 – ERR-11)
- **ERR-10 (Responsive Mobile & Header)**:
  - `MobileBottomNav.jsx`: Đổi nhãn nút `Menu 10` → `Menu`, bổ sung `aria-label`.
  - `FarmContextSwitcher.jsx`: Ẩn dòng nhãn phụ trên màn hình mobile rất hẹp (`hidden sm:flex`) và dùng `truncate` để nút chọn trang trại trên Header Mobile giữ gọn 1 dòng thay vì rớt 3 dòng.
  - `TopBar.jsx`: Bổ sung `aria-label="Mở menu điều hướng"` cho nút menu mobile.
- **ERR-11 (Thẩm mỹ, Trùng lặp & Accessibility)**:
  - `PlatformIntroPage.jsx`: Cập nhật tiêu đề `"Tách bạch 5 vai trò"` khớp với 5 dòng bảng ma trận.
  - `BarnBatchDetailView.jsx`: Xóa nút `Kết thúc lứa nuôi` bị lặp ở khối thao tác nhanh, giữ 1 nút chuẩn hóa tại thẻ Kết thúc lứa nuôi.
  - `PurchaseInvoicesPage.jsx`: Bổ sung khối Page Header tiêu đề & mô tả trang đồng nhất với các trang còn lại.
  - `BreedingLivestockPage.jsx`: Bổ sung `aria-label` và `title` cho các nút icon Sửa/Xóa.
  - `CashbookPage.jsx`: Thêm `whitespace-nowrap` cho mã phiếu, ngày và badge `Phiếu Thu`/`Phiếu Chi` để không bị ngắt dòng chật ở màn hình `1366×768`.
- **Kiểm chứng**: `npm run build` thoát với mã `0`.

---

## 2026-11-25 — Chuẩn bị môi trường & 3 tài khoản kiểm thử (Super Admin, Onboarding, Force Change Password)
- Tạo 2 tài khoản kiểm thử riêng biệt trên database `farm_saas_dev` (cổng `3308`) mà không ảnh hưởng dữ liệu gốc:
  - `test_onboarding` (`0999000001` / `123456`): `is_super_admin = 0`, `must_change_password = 0`, `accessibleFarms = 0` → vào `/onboarding`.
  - `test_forcepwd` (`0999000002` / `123456`): `is_super_admin = 0`, `must_change_password = 1`, gắn `farm_id = 1` → vào `/force-change-password`.
- Đã xác minh đăng nhập thực tế qua `POST /api/v1/auth/login` cho cả 3 tài khoản (`admin@gmail.com`, `0999000001`, `0999000002`).

---

## 2026-11-25 — Kiểm thử bổ sung 3 khu vực còn lại (`/platform/dashboard`, `/onboarding`, `/force-change-password`)
- Thực hiện kiểm thử trực tiếp trên Chrome với 3 tài khoản test (`admin@gmail.com`, `0999000001`, `0999000002`), chụp 19 ảnh minh chứng tại `docs/testing/ui-audit/screenshots/AREA*`.
- Cập nhật kết quả đối chiếu và danh sách lỗi phát hiện thêm (`ERR-12` – `ERR-16`) vào `docs/testing/ui-audit/system-ui-audit.md`.

---

## 2026-11-25 — Khắc phục Lỗi 3 Khu vực Bổ sung (ERR-12 – ERR-16)
- **ERR-12 (`routes.jsx`)**: Bọc `/admin/*` và các route quản trị con `/platform/*` bằng `AuthGuard` để tự động Silent Refresh Token khi F5/truy cập trực tiếp thay vì mất phiên và bị đẩy về `/login`.
- **ERR-13 (`AdminLayout.jsx`)**: Đổi breakpoint Sidebar Super Admin từ `md:` sang `lg:` (`1024px`) để Tablet `768×1024` dùng Drawer gọn gàng; bỏ `sticky` đè nội dung ở thanh Header Super Admin.
- **ERR-14 (`OnboardingPage.jsx`)**: Sửa `useAuthStore` destructure `accessToken: token` (trước đó lấy `token` bị `undefined` gây lỗi `401 Unauthorized` ở Modal tìm cơ sở).
- **ERR-15 (`OnboardingPage.jsx`, `AdminDashboardPage.jsx`)**: Áp dụng giảm `10%` khi chọn gói từ 2 năm trở lên trong `calculatePrice()`; đổi nút `Đối soát giao dịch` trên Super Admin Dashboard trỏ đúng `/platform/transactions`.
- **ERR-16 (`OnboardingPage.jsx`, `AuthLayout.jsx`)**: Thêm nút **Đăng xuất** và `whitespace-nowrap` trên Header `/onboarding`, bỏ ký tự `<` thừa trên nút quay lại, và xóa dấu chấm thừa ở footer `AuthLayout`.
- **Kiểm chứng**: `npm run build` thoát với mã `0`.

---

## 2026-11-25 — Kiểm thử Chức năng (Functional Testing) Đợt 1 & Đợt 2 (Tạm dừng Đợt 3 & 4)
- Hoàn tất kiểm thử trực tiếp trên Chrome 13 Test Cases (**TC1.1–TC1.4, TC2.1–TC2.3, TC3.1–TC3.3, TC4.1–TC4.3**): **6 Pass, 7 Fail**; tạm dừng Đợt 3 (`TC5.1–TC5.5`) và Đợt 4 (`Nhóm 6`) theo yêu cầu người dùng (`Not Run`).
- Lưu báo cáo đầy đủ kèm 27 ảnh minh chứng tại `docs/testing/functional-test/functional-test-report.md` và `docs/testing/functional-test/screenshots/`.
- Xác định 10 lỗi (`BUG-F01` – `BUG-F10`), nổi bật 4 lỗi Critical: `chk_farm_expenses_status`, `chk_sales_orders_payment_status`, 403 `programs` trên `/app/barns` Công nhân, và lộ giá vốn/lãi lỗ ở chi tiết chuồng với Trại trưởng.

---

## 2026-11-26 — Hoàn tất Kiểm thử Chức năng (Functional Testing) Đợt 3 & Đợt 4
- Hoàn tất chạy nốt **Đợt 3 (TC5.1–TC5.5)** và **Đợt 4 (TC6.1–TC6.6)** trực tiếp trên Chrome, lưu thêm 26 ảnh minh chứng (tổng 53 ảnh tại `docs/testing/functional-test/screenshots/`).
- Tổng kết 24/24 Test Cases đã chạy: **10 Pass, 14 Fail** (ghi nhận tổng cộng 16 lỗi `BUG-F01` – `BUG-F16`, trong đó 6 lỗi Critical) tại `docs/testing/functional-test/functional-test-report.md`.

---

## 2026-11-26 — Khắc phục Lỗi Chức năng Đợt sửa 1 (6 lỗi Critical)
- **BUG-F01 (`chk_farm_expenses_status`)**: Đổi toàn bộ `.status("PAID")` thành `.status("CONFIRMED")` (đúng constraint `DRAFT|CONFIRMED|CANCELLED` của `farm_expenses`) trong `PurchaseInvoiceServiceImpl.java`, `AddonsOperationsServiceImpl.java`, `FarmSalesController.java`, `CashbookController.java`, `WorkforceController.java`; gỡ bỏ fallback tạo hóa đơn giả khi API lỗi trong `PurchaseInvoicesPage.jsx`.
- **BUG-F02 (`chk_sales_orders_payment_status`)**: Sửa `"PARTIAL"` thành `"PARTIALLY_PAID"` trong `FarmSalesController.java` để khớp constraint `UNPAID|PARTIALLY_PAID|PAID|REFUNDED`.
- **BUG-F07 (Worker `/app/barns` hiển thị 0 chuồng)**: Bọc các lệnh gọi `getZones`, `getBarns`, `getPrograms` bằng `.catch(() => [])` trong `BarnsPage.jsx` để tránh `403` từ `programs` làm sập toàn bộ `Promise.all`.
- **BUG-F09 (RBAC Trại trưởng lộ PnL ở chi tiết chuồng)**: Tách `isFarmManagerOnly` và loại trừ khỏi `canViewFinancialPnL` trong `BarnsPage.jsx` để ẩn `CHI PHÍ / KG` và `HẠCH TOÁN & CHI PHÍ` với `ROLE_FARM_MANAGER`.
- **BUG-F13 (`/app/workforce` dùng mock state)**: Cập nhật `WorkforceController.java` tính `advancePaid` và `payrollHistory` trực tiếp từ bảng `farm_expenses` (lưu DB bền vững, không phụ thuộc `ADVANCE_MAP` in-memory); nối `WorkforcePage.jsx` vào API thật (`/overview`, `/workers`, `/piecework`, `/advance`, `/pay-salary`).
- **BUG-F15 (`/app/cashbook` dùng mock state)**: Bổ sung `createCashbookEntry` & `deleteCashbookEntry` trong `financeService.js`, sửa phân loại `INCOME`/`EXPENSE` và sort theo `date, id DESC` trong `CashbookController.java`, và nối toàn bộ `CashbookPage.jsx` vào API thật (`/cashbook`).
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

---

## 2026-11-26 — Khắc phục Lỗi Chức năng Đợt sửa 2 (5 lỗi High)
- **BUG-F03 (Thẻ kho trống, định mức cám 0.15kg, JSON thô)**: Bổ sung `materialId` và gọi `inventoryService.getTransactions` khi mở Drawer trong `InventoryPage.jsx` để hiển thị lịch sử Thẻ kho thật; quy đổi `perHeadG < 1` từ kg sang gram trong `DailyLogServiceImpl.java`; format gọn `detailsJson` khi hiển thị nhật ký trong `DailyLogsPage.jsx`.
- **BUG-F10 (Webhook toast lỗi + lệch trạng thái/giá App Store)**: Đổi `authService.getCurrentUser()` (không tồn tại) thành `authService.getMe()` trong `GeneralSettingsPage.jsx`; đồng bộ trạng thái `ACTIVE`/`isEnabled` và bảng giá thật `yearlyPrice`/`halfYearPrice` từ `serviceData.addons` + `subscriptions/add-ons` theo `addonCode`.
- **BUG-F11 (Custom Role chưa gán được ở Settings & đếm sai nhân sự)**: Tải danh sách vai trò từ `addonsService.getCustomRoles` vào modal `Cấu Hình Quyền Hạn` tại `GeneralSettingsPage.jsx` để chọn gán trực tiếp vai trò tùy chỉnh; bổ sung `userCount` thật trong `RoleMatrixResponse.java` & `UserServiceImpl.getRolesForFarm` và sửa `r.userCount || 1` → `r.userCount ?? 0` trong `CustomRolesPage.jsx`.
- **BUG-F12 (Điều chuyển kho chọn kho rỗng & Kiểm kê `403` với Chủ trại)**: Bổ sung `ROLE_FARM_OWNER`, `ROLE_FARM_MANAGER`, `ROLE_ACCOUNTANT`, `ROLE_SUPER_ADMIN` và `inventory.manage` vào `@PreAuthorize` trong `StocktakeController.java`; ưu tiên tự chọn kho có hàng tồn và kho đích khác kho nguồn khi mở modal trong `InternalTransfersPage.jsx`.
- **BUG-F16 (Super Admin bảng giá gói & bộ lọc trang trại)**: Đồng bộ mapping `price6Months`/`price1Year` với `halfYearPrice`/`yearlyPrice` từ API, thay `UNLIMITED_USERS` bằng `CUSTOM_ROLES` và sửa payload `handleSaveAddon` trong `AdminPackagesPage.jsx`; chuẩn hóa `status` in hoa khi lọc trạng thái trong `AdminFarmsPage.jsx`.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.


---

## 2026-11-26 — Khắc phục Lỗi Chức năng Đợt sửa 3 (5 lỗi Medium/Low — Hoàn tất 16/16 lỗi)
- **BUG-F04 (Card chuồng `ALERT` render nhầm Chuồng Trống & hardcode `175 con`)**: Sửa `isOccupied` thành `Boolean(barn.batch) && barn.status !== 'EMPTY'` trong `BarnsPage.jsx`; thay toàn bộ fallback cứng (`175`, `1850`, `150`, `7.5`, `2.15`) thành `?? 0` trong `BarnBatchDetailView.jsx`.
- **BUG-F05 (VietQR hardcode BIN `970436`)**: Bổ sung `resolveBankBin(fin.bankName, fin.bankBin)` tự động ánh xạ BIN chuẩn theo tên ngân hàng (`MBBank → 970422`, `BIDV → 970418`, `Techcombank → 970407`, v.v.) trong `SalesPage.jsx`.
- **BUG-F06 (Bảng thành viên ngoài modal trống Vai trò & Phạm vi chuồng)**: Hiển thị badge `m.roleName` khi API không trả tổ hợp 3 cột cũ và tính tên phạm vi chuồng từ `m.allBarns`/`m.barnIds` đối chiếu `realBarns` trong `GeneralSettingsPage.jsx`.
- **BUG-F08 (Sidebar Công nhân lộ Kho hàng hóa & Xuất nhập nội bộ)**: Bổ sung lọc `isWorkerOnly` ẩn mục `inventory` và `internal-transfers` cho tài khoản `ROLE_BARN_WORKER`/`ROLE_FIELD_STAFF` trong `DynamicSidebar.jsx`.
- **BUG-F14 (Đa chi nhánh: Header kẹt `ALL`, 400 `/farms/ALL/warehouses` & số liệu cứng)**: Chuẩn hóa `activeFarmId` (tránh `'ALL'`) trong `DynamicSidebar.jsx`; gọi `setCurrentBranchId(branch.id)` trong `handleEnterBranch` và thay `"tại 3 trại"` thành `{consolidatedKpi.branchCount} chi nhánh` trong `BranchesPage.jsx`; gỡ 3 giá trị tài chính giả (`245M`, `430M/620M`, `340M/460M`) trong `BranchOperationsController.java`.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.


---

## 2026-11-26 — Kiểm thử Hồi quy (Regression Testing) & Vá bổ sung DB/RBAC
- **Phát hiện bổ sung trong quá trình hồi quy và xử lý ngay**:
  - Bảng `cost_categories` trong `farm_saas_dev` trống (`0` dòng) làm khóa ngoại `fk_farm_expenses_category_composite` trả `HTTP 409` trên mọi thao tác sinh `farm_expenses`: đã seed 5 danh mục chuẩn (`ID 1..5`).
  - `userInfo.roles` từ API là mảng object `[{ code: 'ROLE_...' }]`: đã chuẩn hóa `roleCodes` trong `DynamicSidebar.jsx` & `BarnsPage.jsx`.
  - Ưu tiên map BIN theo tên ngân hàng trong `SalesPage.jsx` (`MBBank → 970422`), bổ sung đọc `snake_case` JSON trong `DailyLogsPage.jsx`, và chống trùng mã `invoiceNumber` trong `PurchaseInvoicesPage.jsx`.
- **Kết quả hồi quy trên Chrome**: Toàn bộ **6/6 lỗi Critical PASS** (xác minh bền vững sau F5 trên Mua hàng, Bán hàng trả 1 phần, Chốt lương KPI, Tạm ứng Nhân công, Sổ quỹ thủ công, Công nhân `/app/barns` & ẩn PnL Trại trưởng) cùng các lỗi High/Medium/Low. Lưu 16 ảnh minh chứng `REG-*.png` và cập nhật báo cáo `docs/testing/functional-test/functional-test-report.md`.

- **Hoàn tất 2 điểm cuối (`BUG-F05` & `BUG-F16`)**: Cập nhật `SalesPage.jsx` + `FarmSalesController.java` (`resolveBankBin`) cho modal `Xem QR` luôn trả BIN `970422`; chuyển modal `Sửa giá` (`AdminPackagesPage.jsx`) và modal `Eye` (`AdminFarmsPage.jsx`) sang `createPortal(..., document.body)` với `z-[9999]`. Đã xác minh **PASS 100% (16/16 lỗi)** trên Chrome và lưu thêm 3 ảnh `REG-F05-vietqr-970422-pass.png`, `REG-F16-admin-packages-modal-pass.png`, `REG-F16-admin-tenants-eye-pass.png`.


---

## 2026-11-26 — Hoàn tất Kiểm thử Phân quyền (RBAC) Đợt 1 & Đợt 2 (13/13 Test Cases — Phương án A)
- Hoàn tất phân tích 3 lớp phân quyền (`docs/testing/authorization-test/permission-analysis.md`) và chạy kiểm thử trực tiếp trên Chrome cho cả 4 vai trò (`accountant`, `tech`, `manager`, `worker`) + kiểm chứng HTTP API trực tiếp (`RBAC-TC12`) + TopBar Chi nhánh (`RBAC-TC13`).
- Lưu đầy đủ báo cáo kèm 26 ảnh minh chứng (`RBAC-*.png`) tại `docs/testing/authorization-test/rbac-test-report.md`.
- Xác nhận thực tế toàn bộ **12 lỗi phân quyền (`RBAC-01` – `RBAC-12`)**, sẵn sàng chuyển sang giai đoạn khắc phục 4 nhóm (`P1` DB → `P2` Backend → `P3` Frontend Guards → `P4` TopBar Branch Lock).


---

## 2026-11-26 — Khắc phục Trọn bộ 12 Lỗi Phân quyền (RBAC-01 – RBAC-12) & Khóa Phạm vi 1 Chi nhánh (P1 – P4)
- **P1 — Chuẩn hóa Database (`V7__rbac_hardening_and_branch_scope.sql`)**:
  - Thêm cột `branch_id` (+ FK tới `farm_branches`) vào bảng `farm_members`; gán mặc định `branch_id = 1` cho toàn bộ tài khoản nhân sự và `NULL` cho `ROLE_FARM_OWNER` (`RBAC-11`).
  - Gỡ 10 quyền nhạy cảm khỏi `ROLE_FARM_MANAGER` (`cashbook.*`, `financial.price.view`, `general_settings.*`, `branches.*`, `payroll.*`, `roles.view`), giữ `purchase_invoices.*` & `sales.*` ở chế độ chỉ kiểm đếm số lượng/cân xe không thấy đơn giá (`RBAC-04`).
  - Gỡ `inventory.view` khỏi `ROLE_BARN_WORKER` (`RBAC-05`), cấp `workforce.salary.view` cho `ROLE_ACCOUNTANT` (`RBAC-10`), và seed idempotent 5 danh mục `cost_categories`.
- **P2 — Vá Backend Security, Data Scope & Branch Scope**:
  - Bổ sung `branchId`/`assignedBranchId` vào `FarmMember`, `FarmMemberRequest`, `FarmMemberResponse`, `UserInfoDto`, `AuthServiceImpl`, `UserServiceImpl`, `BranchServiceImpl`, `BranchController` để lọc đúng 1 chi nhánh được phân công cho mọi nhân sự.
  - Thay `@PreAuthorize("isAuthenticated()")` trên 25 endpoints của `AddonsOperationsController` bằng quyền cụ thể (`RBAC-02`); siết chặt `BranchOperationsController`, `GeneralSettingsController` (checkout/webhook), `WarehouseIssueController`, `StocktakeController`, `DailyLogController` (chặn worker sửa/xóa nhật ký), `PurchaseInvoiceController` (`RBAC-03`), `DashboardController`, `MaterialController`, `MaterialCategoryController`, `WarehouseController`, `PartnerController`, `BarnBatchController` (`RBAC-06`, `RBAC-07`, `RBAC-08`).
  - Sửa `FarmSecurityEvaluator.canAccessBarn()` từ `.contains()` chuỗi con sang regex khớp nguyên số (`RBAC-09`) và bổ sung `getAssignedBranchId(farmId)`.
- **P3 — Vá Frontend Route Guards, RBAC & Ẩn giá vốn**:
  - Bọc `<PermissionGuard>` cho toàn bộ 15 route phân quyền trong `routes.jsx` (`RBAC-01`); chuẩn hóa `userInfo.roles` (mảng object `[{ code }]`) trên `CashbookPage`, `WorkforcePage`, `InternalTransfersPage`, `BranchesPage`, `InventoryPage`, `PurchaseInvoicesPage`, `SalesPage`, `DailyLogsPage`.
  - Ẩn toàn bộ cột giá vốn/giá bán/thành tiền ở khối `Thu Hoạch & Doanh Thu Bán Hàng` trong `BarnBatchDetailView.jsx` khi `!canViewFinancials` (`RBAC-12`).
- **P4 — Khóa TopBar 1 Chi nhánh & UI gán Chi nhánh**:
  - `BranchContextSwitcher.jsx` & `useActiveBranchStore.js`: Chỉ `ROLE_FARM_OWNER`/`ROLE_SUPER_ADMIN` thấy dropdown chọn `Toàn chuỗi (ALL)` & 2 chi nhánh; toàn bộ tài khoản nhân sự hiển thị badge khóa cứng đúng 1 chi nhánh được phân công và tự chặn URL `?branchId=` trái phép.
  - `GeneralSettingsPage.jsx`: Bổ sung dropdown **Chi nhánh làm việc được phân công** trong Modal `Cấu Hình Quyền Hạn` để Chủ trại gán chi nhánh cho từng nhân sự.
- **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.

- **Kiểm thử Hồi quy RBAC (sau khởi động lại Backend & Flyway V7)**:
  - Xác minh Flyway `V7` chạy thành công (`assignedBranchId = 1` & trả đúng 1 chi nhánh cho cả 4 nhân sự).
  - Vá bổ sung 3 điểm sót phát hiện khi hồi quy: gỡ `ROLE_FARM_MANAGER` khỏi `GET /cashbook` (`CashbookController.java`), ẩn 3 thẻ KPI tiền VND trên `SalesPage.jsx` khi `!canViewPrice`, và chuẩn hóa `userInfo.roles` trong `DailyLogsPage.jsx` để ẩn nút sửa/xóa với Worker.
  - Xác minh trên trình duyệt Chrome **PASS 100%** cho cả 4 vai trò nhân sự (`Worker`, `Manager`, `Tech`, `Accountant`) + `Owner`, lưu 10 ảnh minh chứng `RBAC-REG-01` → `RBAC-REG-10` và cập nhật `docs/testing/authorization-test/rbac-test-report.md`.


---

## 2026-11-26 — Kiểm thử Cô lập Đa Chi Nhánh & Đa Trang Trại (Đợt A — Isolation & IDOR Audit)
- Thực hiện kiểm thử đọc-only trên API + trình duyệt Chrome cho 4 nhóm (A1 Cross-Branch Tampering, A2 Đổi chi nhánh nhân sự CN1 ↔ CN2, A3 Đối chiếu `Toàn chuỗi ALL = CN1 + CN2`, A4 Cross-Tenant IDOR `/farms/2/...`).
- Lưu báo cáo chi tiết kèm 3 ảnh minh chứng tại `docs/testing/isolation-test/isolation-test-report.md`.
- Phát hiện **5 lỗi/lỗ hổng (`ISO-01` – `ISO-05`)**: 2 lỗi Critical (`ISO-01` nhân sự CN1 truyền `?branchId=2` đọc được dữ liệu CN2 trên 10 API; `ISO-02` 7 controller thiếu `@farmSecurity.canAccessFarm(#farmId)` gây Cross-Tenant IDOR), 2 lỗi High (`ISO-03` Cashbook & Workforce bỏ qua `branchId`; `ISO-04` Dashboard `ALL` lệch `CN1 + CN2` và còn số liệu mock), 1 lỗi Medium (`ISO-05` dropdown chi nhánh trong Modal Settings khi TopBar ở `ALL`).

- **Khắc phục trọn bộ 5 lỗi Cô lập Đa Chi Nhánh & Đa Trang Trại (`ISO-01` – `ISO-05`)**:
  - **`ISO-01` & `ISO-02` (Cross-Branch & Cross-Tenant IDOR)**: Bổ sung `assertFarmAccess(farmId)` và `resolveEffectiveBranchId(farmId, requestedBranchId)` trong `FarmSecurityEvaluator.java` (nhân sự truyền `branchId` khác chi nhánh được gán sẽ bị chặn `403 AccessDeniedException`, bỏ trống sẽ tự ép về `assignedBranchId`). Áp dụng `@farmSecurity.canAccessFarm` + `resolveEffectiveBranchId` trên toàn bộ 11 controller dữ liệu (`PurchaseInvoiceController`, `FarmSalesController`, `WarehouseController`, `BarnBatchController`, `InventoryQueryController`, `StocktakeController`, `WarehouseTransferController`, `CashbookController`, `WorkforceController`, `DashboardController`, `AddonsOperationsController`).
  - **`ISO-03` (Cashbook & Workforce branch filter)**: Lọc `farm_expenses` theo `branchId` trong `CashbookController` (chỉ cộng baseline quỹ cho CN1/ALL, gán `branchId` khi tạo phiếu) và lọc `Employee`/`FarmExpense`/`Piecework` theo `farm_members.branch_id` trong `WorkforceController`.
  - **`ISO-04` (Dashboard `ALL = CN1 + CN2` & dữ liệu thật)**: Bỏ fallback tự rơi về `branchId = 1` và các giá trị giả (`485M`, `248.5M`, `385M`, `85M`, `120M`) trong `DashboardController.java`; nối `DashboardPage.jsx` vào `/api/v1/farms/{farmId}/dashboard/summary`, gỡ `MOCK_BARNS_BY_BRANCH` (gồm Trại Cá giả `17.700 con`), `185.4M`, `284.5M`, và biểu đồ tròn tĩnh `7.005 con`.
  - **`ISO-05` (Modal gán Chi nhánh khi TopBar ở `ALL`)**: Gọi `fetchBranches(currentFarmId)` khi mở modal `Phân quyền & Gán chuồng` trong `GeneralSettingsPage.jsx` để luôn hiển thị đầy đủ danh sách chi nhánh.
  - **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.
- **Kiểm thử Hồi quy Cô lập Đa Chi Nhánh & Đa Trang Trại (Đợt A)**: Xác minh **PASS 100% (5/5 lỗi `ISO-01` – `ISO-05`)** trên API (13/13 Cross-Branch trả `403`, 11/11 Cross-Tenant trả `403`) và trình duyệt Chrome (`ALL = CN1 + CN2`, `Cashbook` & `Workforce` lọc theo chi nhánh, Modal `Settings` tải đủ chi nhánh khi ở `ALL`), lưu 3 ảnh `ISO-REG-01` → `ISO-REG-03` và cập nhật `docs/testing/isolation-test/isolation-test-report.md`.

---

## 2026-11-26 — Kiểm thử Biên độ, Dữ liệu Lỗi & Edge Cases (Đợt B)
- Thực hiện kiểm thử biên độ API + trình duyệt Chrome cho 3 nhóm (**B1** Kho & FEFO, **B2** Chuồng nuôi/Bán hàng/Sổ quỹ/Nhân công, **B3** Phiên đăng nhập & JWT).
- Lưu báo cáo chi tiết kèm 4 ảnh minh chứng tại `docs/testing/boundary-test/boundary-test-report.md`.
- Phát hiện **5 lỗi biên độ (`BND-01` – `BND-05`)**: `BND-01` cho ăn số âm gây `500 / by zero`; `BND-02` bán vượt sĩ số gây `500` & lộ SQL Hibernate; `BND-03` thiếu validate số dương ở Backend (`500 Check constraint`); `BND-04` cho phép tạm ứng vượt lương (`999.999.999 đ`); `BND-05` báo chết vượt sĩ số (`9999 > 88`) không chặn và xóa log không hoàn sĩ số. (Các điểm B1 vượt tồn kho `INSUFFICIENT_STOCK` và B3 JWT lỗi/thu hồi quyền tức thời đều PASS).
- **Khắc phục trọn bộ 5 lỗi biên độ (`BND-01` – `BND-05`)**:
  - **`BND-01` & `BND-05` (`DailyLogServiceImpl.java`)**: Chặn `feedAmount <= 0`, `medAmount <= 0`, bảo vệ `Math.max(1, currentQty)` tránh `/ by zero`; chặn `deadCount + cullCount > currentQuantity` với `400 MORTALITY_EXCEEDS_STOCK`, và tự động hoàn lại sĩ số đàn khi xóa phiếu `MORTALITY`.
  - **`BND-02` & `BND-03` (`FarmSalesController.java`, `SalesPage.jsx`, `CashbookController.java`)**: Validate `headsSold > 0`, `gross > 0`, `netWeight > 0`, `unitPrice >= 0`, `paidAmount >= 0`, `cashbook.amount > 0`, và chặn xuất bán vượt sĩ số hiện có (`HEADS_EXCEED_STOCK`) ở cả Backend lẫn Frontend.
  - **`BND-04` (`WorkforceController.java`, `WorkforcePage.jsx`)**: Validate `workerId != null`, `amount > 0`, và chặn tạm ứng vượt quá lương còn lại trong tháng (`ADVANCE_EXCEEDS_SALARY`) ở cả Backend lẫn Frontend.
  - **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.
- **Kiểm thử Hồi quy Biên độ (Đợt B)**: Xác minh **PASS 100% (5/5 lỗi `BND-01` – `BND-05`)** trên API (7/7 case trả `400` kèm thông báo tiếng Việt chuẩn) và Chrome (`SalesPage` chặn bán vượt sĩ số, `WorkforcePage` chặn tạm ứng vượt lương), lưu 2 ảnh `BND-REG-01`, `BND-REG-02` và cập nhật `docs/testing/boundary-test/boundary-test-report.md`.

---

## 2026-11-26 — Kiểm thử Vòng đời SaaS Khách hàng Mới & Feature Gating (Đợt C)
- Đăng ký mới tài khoản Owner `0999888777` (`test_saas_c1@gmail.com` → `tenantId=2, farmId=2, branchId=3`), kiểm thử Empty State (`C1`), Feature Gating URL & API (`C2`), và mua gói `BREEDING` qua VNPAY Sandbox + Simulate Webhook (`C3`).
- Lưu báo cáo chi tiết kèm 3 ảnh minh chứng tại `docs/testing/saas-lifecycle-test/saas-lifecycle-report.md`.
- Xác nhận `C3` (mua gói & mở khóa Sidebar tức thời) **PASS**, đồng thời phát hiện **4 lỗi (`SAAS-01` – `SAAS-04`)**: lệch `activeFarmId=1` cho user mới (`403`), rò rỉ mock data vào Empty State, thiếu `<AddonGuard>` chặn URL trực tiếp, và lỗi `AddonsOperationsServiceImpl` tự `INSERT` subscription trong `GET` read-only gây `500`.
- **Khắc phục trọn bộ 4 lỗi SaaS Lifecycle & Feature Gating (`SAAS-01` – `SAAS-04`)**:
  - **`SAAS-04` (`AddonsOperationsServiceImpl.java`)**: Gỡ bỏ cơ chế tự động `INSERT` kích hoạt Add-on trong hàm `GET` (gây crash `500 Connection is read-only`), thay bằng chặn **`403 ADDON_NOT_SUBSCRIBED`** khi trang trại chưa mua/chưa bật gói mở rộng.
  - **`SAAS-01` (`TenantAppLayout.jsx`, `DynamicSidebar.jsx`, `DashboardPage.jsx`, `InventoryPage.jsx`, `WorkforcePage.jsx`)**: Tự động đồng bộ `activeFarmId` và `currentBranchId` theo đúng `userInfo.accessibleFarms[0]` và `userInfo.branches[0]` ngay khi đăng ký/đăng nhập (chấm dứt lỗi rơi nhầm sang `farmId=1, branchId=1` gây `403`).
  - **`SAAS-03` (`PermissionGuard.jsx`, `routes.jsx`)**: Bổ sung cơ chế **Add-on Feature Gating (`addonCode`)** ngay trên chốt chặn route cho cả 6 phân hệ (`MULTI_BRANCH`, `PAYROLL`, `CUSTOM_ROLES`, `BREEDING`, `HATCHERY`, `FEED_MILL`), chặn vượt URL trực tiếp bằng màn hình yêu cầu nâng cấp gói.
  - **`SAAS-02` (`CashbookController.java`, `DashboardPage.jsx`, `InventoryPage.jsx`, `WorkforcePage.jsx`)**: Giới hạn baseline tồn quỹ `230M` chỉ cho farm demo `farmId = 1`, khởi tạo `InventoryPage` bằng mảng rỗng `[]`, ẩn mock alerts/activities trên Dashboard khi trang trại mới chưa có đàn, và đổi `+ 2 tổ thời vụ` cứng sang `{seasonalTasks.length}`.
  - **Kiểm chứng**: `mvn compile -q` và `npm run build` đều thoát với mã `0`.
- **Kiểm thử Hồi quy Đợt C (SaaS Lifecycle & Feature Gating)**: Vá bổ sung `CashbookPage.jsx` (`defaultFarmId` & `openingBalance` động) và xác minh **PASS 100% (4/4 lỗi `SAAS-01` – `SAAS-04`)** trên API (`403 ADDON_NOT_SUBSCRIBED`) và trình duyệt Chrome (`0999888777` Farm 2 Empty State sạch `0 ₫`, không `403`, `<PermissionGuard>` chặn 100% URL Add-on chưa mua), lưu 3 ảnh `SAAS-REG-01` → `SAAS-REG-03` và cập nhật `docs/testing/saas-lifecycle-test/saas-lifecycle-report.md`.

---

## 2026-11-26 — Xây dựng Bộ Automated Test Hồi Quy (Đợt D: JUnit 5 + Vitest)
- **Backend (`mvn test` — 7/7 PASS)**:
  - `backend/src/test/java/com/farm/saas/common/security/FarmSecurityEvaluatorTest.java` (4 tests): Kiểm chứng Cross-Tenant IDOR (`ISO-02`), khóa cứng 1 chi nhánh & chặn `?branchId=` chéo chi nhánh (`ISO-01`), và regex word-boundary cho `canAccessBarn` (`RBAC-09`).
  - `backend/src/test/java/com/farm/saas/modules/addons/BoundaryAndGatingTest.java` (3 tests): Kiểm chứng `403 ADDON_NOT_SUBSCRIBED` không tự `save()` (`SAAS-04`), chặn `feedAmount <= 0` (`BND-01`), và chặn `dead + cull > currentQuantity` (`BND-05`).
- **Frontend (`npm test` / `vitest run` — 5/5 PASS)**:
  - `frontend/src/test/setup.js`, `frontend/package.json` (`"test": "vitest run"`).
  - `frontend/src/test/PermissionGuard.test.jsx` (3 tests): Kiểm chứng chặn RBAC thiếu quyền (`RBAC-01`) và chặn Add-on chưa kích hoạt (`SAAS-03`).
  - `frontend/src/test/useActiveBranchStore.test.js` (2 tests): Kiểm chứng khóa cứng 1 chi nhánh cho nhân sự (`RBAC-11`) và cho phép Chủ trại chuyển đổi `ALL` / chi nhánh.
