# BÁO CÁO KIỂM TOÁN KIẾN TRÚC & PHÂN TÍCH LỖ HỔNG (GAP ANALYSIS)
## CƠ CHẾ TỰ ĐỘNG ĐỒNG BỘ HÓA & CẬP NHẬT DỮ LIỆU THỜI GIAN THỰC TRÊN TOÀN HỆ THỐNG
### (ZERO-F5 REACTIVITY & CASCADE DATA SYNCHRONIZATION)
**Dự án:** Hệ Thống Quản Trị Nông Nghiệp Đa Doanh Nghiệp (Agri-ERP Multi-Tenant SaaS)  
**Tác giả:** Principal Software Architect  
**Ngày kiểm toán:** 27/10/2026  
**Trạng thái kiểm toán:** Đã hoàn thành rà soát toàn diện Frontend & Backend (Chưa sửa code)

---

## MỤC LỤC
1. [I. KIỂM TRA EVENT BUS TRUNG TÂM (useActiveFarmStore.js) & ĐỒNG BỘ ĐA TAB / ĐA CỬA SỔ](#i-kiểm-tra-event-bus-trung-tâm-useactivefarmstorejs--đồng-bộ-đa-tab--đa-cửa-sổ)
2. [II. KIỂM TRA CƠ CHẾ ĐỒNG BỘ QUA CHUÔNG THÔNG BÁO (NOTIFICATION-DRIVEN REAL-TIME SYNC)](#ii-kiểm-tra-cơ-chế-đồng-bộ-qua-chuông-thông-báo-notification-driven-real-time-sync)
3. [III. RÀ SOÁT TỪNG WORKSPACE (WS-A ĐẾN WS-H2) & CÁC TRANG ĐỘC LẬP](#iii-rà-soát-từng-workspace-ws-a-đến-ws-h2--các-trang-độc-lập)
4. [IV. KIỂM TRA ĐỒNG BỘ DÂY CHUYỀN SỐ LIỆU TỔNG HỢP TẠI BACKEND (BACKEND CASCADE CONSISTENCY)](#iv-kiểm-tra-đồng-bộ-dây-chuyền-số-liệu-tổng-hợp-tại-backend-backend-cascade-consistency)
5. [V. BẢNG MA TRẬN LỖ HỔNG ĐỒNG BỘ (GAP MATRIX)](#v-bảng-ma-trận-lỗ-hổng-đồng-bộ-gap-matrix)
6. [VI. ĐỀ XUẤT LỘ TRÌNH THỰC THI (IMPLEMENTATION ROADMAP)](#vi-đề-xuất-lộ-trình-thực-thi-implementation-roadmap)

---

## I. KIỂM TRA EVENT BUS TRUNG TÂM (useActiveFarmStore.js) & ĐỒNG BỘ ĐA TAB / ĐA CỬA SỔ

### 1. Phân Tích Cấu Trúc Hiện Tại Của `syncTrigger` và `notifyDataChanged`
Đọc tại [`frontend/src/store/useActiveFarmStore.js`](file:///d:/Projects/Farm_Management/frontend/src/store/useActiveFarmStore.js) (dòng 69–115):

```javascript
// Cấu trúc khởi tạo ban đầu:
syncTrigger: {
  farms: 0,
  zones: 0,
  employees: 0,
  partners: 0,
  inventory: 0,
  batches: 0,
  finance: 0,
}
```

#### Các kênh (Channels) đang được hỗ trợ:
Hệ thống chỉ khởi tạo 7 kênh tĩnh: `farms`, `zones`, `employees`, `partners`, `inventory`, `batches`, `finance`.
- **Các kênh bị thiếu trong định nghĩa Store:**
  - `tasks`: Dành cho công việc hiện trường, mẫu việc định kỳ, biên bản nghiệm thu (WS-G, WS-E, WS-B).
  - `attendance`: Dành cho chấm công GPS, điểm danh tổ, phân ca (WS-G, WS-B).
  - `seasons` / `cycles`: Dành cho mùa vụ cây trồng, chu kỳ chăn nuôi (WS-E, WS-A, WS-H1).
  - `locations`: Dành cho ô/luống/chuồng (WS-A, WS-E).
  - `all`: Bộ đếm tổng thể phản ứng với bất kỳ thay đổi nào.

### 2. Nghịch Lý Lan Truyền Tín Hiệu (Signal Cascade Paradox)
Phân tích logic của hàm `notifyDataChanged(entityKey)` (dòng 83–109):
```javascript
notifyDataChanged: async (entityKey = 'farms') => {
  set((state) => {
    const current = state.syncTrigger || { ... };
    const updated = { ...current };
    if (entityKey && Object.prototype.hasOwnProperty.call(updated, entityKey)) {
      updated[entityKey] = (updated[entityKey] || 0) + 1;
    } else {
      // Tăng tất cả nếu không chỉ định hoặc là 'all'
      Object.keys(updated).forEach((k) => {
        updated[k] = (updated[k] || 0) + 1;
      });
    }
    return { syncTrigger: updated, dataVersion: state.dataVersion + 1 };
  });
  if (!entityKey || entityKey === 'farms' || entityKey === 'all') {
    return await get().fetchFarms(true);
  }
}
```

#### Điểm nghẽn kiến trúc nghiêm trọng:
1. **Khi gọi `notifyDataChanged('inventory')` hoặc `notifyDataChanged('finance')`:**
   - Chỉ có `updated['inventory']` hoặc `updated['finance']` tăng lên.
   - Biến `syncTrigger.all` **KHÔNG HỀ TỒN TẠI** trong object `syncTrigger`.
   - Hậu quả: Toàn bộ các component đang đăng ký lắng nghe `useEffect(..., [syncTrigger?.all])` (như tại `DebtMonitorTab`, `SalesDeliveryMonitorTab`, `SalesOrderMonitorTab`, `FarmManagerDailyOverview`, `TraceabilityDetailDrawer`) **HOÀN TOÀN KHÔNG ĐƯỢC KÍCH HOẠT RE-FETCH**!
2. **Khi gọi `notifyDataChanged('all')`:**
   - Vì `'all'` không nằm trong `Object.keys(updated)`, code rơi vào nhánh `else`. Nhánh này duyệt `Object.keys(updated)` và tăng 7 key sẵn có, nhưng **KHÔNG GÁN THUỘC TÍNH `all` VÀO OBJECT `updated`**.
   - Do đó, `state.syncTrigger.all` vẫn luôn là `undefined`. Mọi dependency `syncTrigger?.all` trong React hooks đều không bao giờ phát hiện sự thay đổi giá trị!
3. **Khi gọi các kênh chưa có tên sẵn (ví dụ: `notifyDataChanged('tasks')` hoặc `'attendance'`):**
   - Rơi vào nhánh `else` và tăng đồng loạt cả 7 kênh không liên quan, gây bão re-fetch (thừa tài nguyên mạng) cho các module khác, trong khi chính kênh `tasks` lại không có biến đếm riêng để lắng nghe trúng đích!

### 3. Kiểm Tra Đồng Bộ Đa Tab / Đa Cửa Sổ (Cross-Tab / Multi-Window Sync)
- **Hoàn toàn vắng bóng BroadcastChannel API:** Trong toàn bộ mã nguồn Frontend (`frontend/src/`), từ khóa `BroadcastChannel` có **0 kết quả**.
  - Tình huống thực tế: Tab 1 mở tài khoản Kỹ thuật/Công nhân báo cáo hoàn thành công việc hoặc nộp đơn nghỉ phép; Tab 2 mở tài khoản Giám đốc trang trại chờ duyệt. Tab 2 hoàn toàn không nhận được bất kỳ tín hiệu nào và dữ liệu bị "đóng băng" cho đến khi người dùng ấn F5.
- **Không có Storage Event Listener:** Không có `window.addEventListener('storage', ...)` đóng vai trò kênh dự phòng (fallback) khi chia sẻ trạng thái giữa các tabs.
- **Không có cơ chế Tab Visibility & Focus Reactivity:** Hoàn toàn chưa triển khai `document.addEventListener('visibilitychange')` hoặc `window.addEventListener('focus')`. Khi người dùng chuyển sang tab khác làm việc rồi quay lại tab Agri-ERP, ứng dụng không tự động kiểm tra và làm mới dữ liệu mới phát sinh.

---

## II. KIỂM TRA CƠ CHẾ ĐỒNG BỘ QUA CHUÔNG THÔNG BÁO (NOTIFICATION-DRIVEN REAL-TIME SYNC)

### 1. Thời Điểm Lấy Dữ Liệu Thông Báo (`GET /api/v1/notifications`)
Đọc tại [`frontend/src/components/layout/NotificationBell.jsx`](file:///d:/Projects/Farm_Management/frontend/src/components/layout/NotificationBell.jsx) (dòng 31–33):
```javascript
useEffect(() => {
  fetchNotifications();
}, [fetchNotifications]);
```
- **Hành vi hiện tại:** API thông báo chỉ được gọi **đúng 1 lần duy nhất** khi component `NotificationBell` được mount lên DOM, và khi người dùng click trực tiếp vào icon chuông (`if (!isOpen) fetchNotifications()`).
- **Thiếu Smart Polling:** Hoàn toàn không có cơ chế `setInterval` thăm dò định kỳ (ví dụ: mỗi 10–15 giây thăm dò 1 lần khi `document.visibilityState === 'visible'`). Nếu có người dùng khác gửi đề xuất, duyệt phiếu hoặc thông báo khẩn cấp, chuông thông báo không tự động nhảy số đỏ!

### 2. Sự Kết Nối Giữa Thông Báo Mới và Event Bus Của Hệ Thống
Đọc tại [`frontend/src/store/useNotificationStore.js`](file:///d:/Projects/Farm_Management/frontend/src/store/useNotificationStore.js) (dòng 19–42):
- Khi `fetchNotifications` nhận danh sách thông báo từ Backend, nó chỉ cập nhật `notifications` và `unreadCount`.
- **Thiếu Reactive Trigger:** Store không so sánh `unreadCount` mới với cũ, cũng không kiểm tra ID của thông báo mới nhất. Khi có thông báo mới (ví dụ: "Phiếu xuất kho #12 đã được duyệt" hoặc "Có 1 đơn nghỉ phép mới"), store **KHÔNG HỀ GỌI `useActiveFarmStore.getState().notifyDataChanged('all')`**.
- Hậu quả: Dù người dùng có thấy thông báo mới trong chuông, màn hình Workspace bên dưới vẫn hiển thị dữ liệu cũ rích.

### 3. Nút Chuông Thông Báo Trên `PlatformShell` (`/platform/*` của Super Admin)
Đọc tại [`frontend/src/shells/PlatformShell/index.jsx`](file:///d:/Projects/Farm_Management/frontend/src/shells/PlatformShell/index.jsx) (dòng 168–176):
```jsx
<button
  type="button"
  className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
  title="Thông báo hệ thống"
>
  <Bell className="h-4 w-4" />
  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
</button>
```
- **Lỗ hổng UI:** Nút chuông trên thanh Header của `PlatformShell` hiện tại chỉ là một **thẻ `<button>` tĩnh chứa icon và chấm đỏ cố định**.
- Nút này **CHƯA ĐƯỢC GẮN LINH KIỆN `<NotificationBell />`**, không có dropdown xem danh sách thông báo, không hiển thị số lượng chưa đọc thực tế, không có chức năng đánh dấu đã đọc và không kết nối với `useNotificationStore`.

---

## III. RÀ SOÁT TỪNG WORKSPACE (WS-A ĐẾN WS-H2) & CÁC TRANG ĐỘC LẬP

### 1. WS-A (A_Geography — Bản đồ & Phân khu)
- **File:** `frontend/src/workspaces/A_Geography/index.jsx`
- **Tình trạng:**
  - `fetchLocations` chỉ phụ thuộc vào `[selectedFarm?.id, selectedZone?.id, syncTrigger?.zones]`.
  - Khi WS-E (FarmingOps) mở mùa vụ mới hoặc thu hoạch đóng mùa vụ làm thay đổi trạng thái Ô/Chuồng (`OCCUPIED` <-> `EMPTY`), WS-E phát `notifyDataChanged('seasons')` và `notifyDataChanged('zones')`. Tuy nhiên, nếu người dùng đang đứng ở WS-A mà không thay đổi `selectedZone`, sơ đồ mặt bằng các Ô/Chuồng không tự đổi màu trạng thái.
  - Khi tạo hoặc sửa Trang trại, `notifyDataChanged('farms')` đã gọi `fetchFarms(true)`, nhưng danh sách `accessibleFarms` trong `useAuthStore` cần được đồng bộ đồng thời để Dropdown chọn trại trên TopHeader không bị trễ.

### 2. WS-B (B_Personnel360 — Nhân sự 360)
- **Files:** `frontend/src/workspaces/B_Personnel360/components/`
- **Tình trạng:**
  - `ShiftScheduleTab.jsx` (Phân ca làm việc): **Hoàn toàn không đăng ký `syncTrigger` trong bất kỳ `useEffect` nào!** Khi nhân viên đổi ca hoặc quản lý phân ca mới ở tab khác, bảng phân ca không tự làm mới.
  - `LeaveAndOvertimeTab.jsx` (Duyệt nghỉ phép & OT): Chỉ lắng nghe `syncTrigger?.employees`. Khi công nhân nộp đơn từ WS-G (`notifyDataChanged('tasks')`), tab duyệt đơn của Quản lý không tự tải lại danh sách đơn chờ duyệt.
  - `Employee360Drawer.jsx`: Drawer chi tiết nhân sự không lắng nghe `syncTrigger`. Nếu nhân viên vừa chấm công vào ca ở hiện trường, Drawer đang mở vẫn hiển thị trạng thái cũ.

### 3. WS-C (C_InventoryHub — Trung tâm Kho vận)
- **Files:** `frontend/src/workspaces/C_InventoryHub/`
- **Tình trạng:**
  - `C_InventoryHub/index.jsx` lắng nghe `syncTrigger?.inventory`. Khi Auto-Backflushing ở WS-E hoàn tất (ghi nhật ký canh tác/thú y tiêu hao vật tư), WS-E gọi `notifyDataChanged('all')`. Nhưng vì `syncTrigger.all` là `undefined`, WS-C không kích hoạt re-fetch tồn kho tự động.
  - Toàn bộ các Drawer chi tiết nghiệp vụ kho:
    - `IssueDetailDrawer.jsx` (Chi tiết phiếu xuất)
    - `ReceiptDetailDrawer.jsx` (Chi tiết phiếu nhập)
    - `TransferDetailDrawer.jsx` (Chi tiết phiếu điều chuyển)
    - `StocktakeDetailDrawer.jsx` (Chi tiết phiếu kiểm kê)
    **Không có bất kỳ Drawer nào lắng nghe `syncTrigger`!** Nếu Giám đốc mở Drawer và duyệt phiếu, hoặc ở một tab khác Thủ kho cập nhật trạng thái, Drawer đang mở bị đóng băng trạng thái cũ cho đến khi đóng đi mở lại.

### 4. WS-D (D_Partners — Đối tác & Nhà cung cấp/Khách hàng)
- **Files:** `frontend/src/workspaces/D_Partners/`
- **Tình trạng:**
  - `D_Partners/index.jsx` và `PartnerDetailDrawer.jsx` có khai báo `[syncTrigger?.partners, syncTrigger?.finance, syncTrigger?.all]`.
  - Tuy nhiên, khi các giao dịch thanh toán hoặc xuất nhập kho diễn ra ở WS-H2 và WS-C, nếu chỉ phát `notifyDataChanged('all')`, WS-D không phản ứng do lỗi `syncTrigger.all`.

### 5. WS-E (E_FarmingOps — Vận hành Canh tác & Chăn nuôi)
- **Files:** `frontend/src/workspaces/E_FarmingOps/`
- **Tình trạng:**
  - WS-E phát ra các channel: `'locations'`, `'seasons'`, `'groups'`, `'expenses'`, `'tasks'` — nhưng các channel này không nằm trong danh mục khởi tạo của `syncTrigger`.
  - `LivestockIndividualsTab.jsx` (Quản lý cá thể chăn nuôi RFID): Không lắng nghe `syncTrigger`. Khi bác sĩ thú y ghi nhật ký tiêm phòng hoặc cân trọng lượng cá thể từ hiện trường, danh sách cá thể không tự cập nhật chỉ số mới.

### 6. WS-F (F_QaTraceability — KCS & Truy xuất nguồn gốc)
- **Files:** `frontend/src/workspaces/F_QaTraceability/`
- **Tình trạng:**
  - `TraceabilityDetailDrawer.jsx` dòng 90: Lấy `notifyDataChanged` từ store nhưng **hoàn toàn không lấy `syncTrigger` và không có `useEffect` lắng nghe**. Khi Giám đốc duyệt KCS hoặc In tem QR, Drawer không tự động cập nhật trạng thái lô hàng.
  - Khi công nhân hoàn thành thu hoạch ở WS-E tạo ra bản ghi thu hoạch chờ đóng gói, bảng chờ đóng gói ở WS-F cần được re-fetch tức thì qua channel `batches`.

### 7. WS-G (G_EmployeeDailyOps — Tác nghiệp Hiện trường Hàng ngày)
- **Files:** `frontend/src/workspaces/G_EmployeeDailyOps/`
- **Tình trạng:**
  - `PersonalShiftScheduleCard.jsx`: Không lắng nghe `syncTrigger`.
  - `FarmManagerDailyOverview.jsx`: Lắng nghe `[syncTrigger?.all, syncTrigger?.employees, syncTrigger?.tasks, syncTrigger?.batches]`. Do `syncTrigger.all` và `syncTrigger.tasks` không tăng giá trị, khi công nhân bấm chấm công hoặc nộp báo cáo hoàn thành việc, số lượng đơn chờ duyệt trên overview của Giám đốc không tự động nhảy số.

### 8. WS-H1 (Cost Accounting) & WS-H2 (Sales & Cashflow)
- **Files:** `frontend/src/workspaces/H1_CostAccounting/`, `frontend/src/workspaces/H2_SalesCashflow/`
- **Tình trạng:**
  - Tại WS-H1: `H1_CostAccounting/index.jsx` không khai báo `syncTrigger`. `UnitCostAnalysisTab.jsx` dòng 71 lắng nghe `syncTrigger?.farming` (kênh không tồn tại).
  - Tại WS-H2: `DebtMonitorTab.jsx` dòng 276–279: Khai báo các option lọc trạng thái công nợ:
    `<option value="OPEN">Chưa thanh toán (OPEN)</option>`
    `<option value="PARTIALLY_PAID">Thanh toán 1 phần</option>`
    `<option value="PAID">Đã tất toán (PAID)</option>`
    `<option value="OVERDUE">Quá hạn (OVERDUE)</option>`
    Trong khi đó, Backend Database Constraint quy định: `chk_debt_records_status CHECK (status IN ('ACTIVE', 'OVERDUE', 'SETTLED', 'BAD_DEBT'))`. Lựa chọn `OPEN`, `PARTIALLY_PAID`, `PAID` dẫn đến kết quả truy vấn luôn trả về danh sách rỗng 0 bản ghi!

### 9. Các Trang Độc Lập: `/app/reports`, `/app/settings`, `/platform/*`
- **`/app/reports`:** Hiện tại là trang tĩnh, chưa kết nối API tổng hợp động theo `activeFarmId` và chưa có cơ chế re-fetch theo `syncTrigger`.
- **`/app/settings`:** Hai tab `WarehousesTab.jsx` và `MaterialsTab.jsx` khi tạo mới hoặc cập nhật kho bãi/vật tư không gọi `notifyDataChanged('inventory')` hay `notifyDataChanged('all')`. Kết quả: WS-C và WS-E không nhìn thấy kho mới và vật tư mới tạo cho đến khi F5.
- **`/platform/*`:** Trang `PlatformDashboardPage` chưa tham gia vào Event Bus hoặc BroadcastChannel, Super Admin phải tự ấn nút "Đồng Bộ" thủ công.

---

## IV. KIỂM TRA ĐỒNG BỘ DÂY CHUYỀN SỐ LIỆU TỔNG HỢP TẠI BACKEND (BACKEND CASCADE CONSISTENCY)

### 1. Ngân Sách vs Chi Phí Trang Trại (`BudgetLineItem.spent_amount` vs `FarmExpense`)
Kiểm tra tại `FarmExpenseServiceImpl.java`, `FarmingLogServiceImpl.java`, `InventoryServiceImpl.java`, `LivestockServiceImpl.java`:
- **Cơ chế hiện tại:** `consumeBudget` được gọi trong `FarmExpenseServiceImpl.java` (dòng 360, 406) khi chi phí được tạo hoặc chuyển sang trạng thái `CONFIRMED`.
- **Lỗ hổng 1: Auto-Backflushing sinh chi phí nhưng bỏ quên cập nhật ngân sách:**
  - Tại `FarmingLogServiceImpl.java:374` (ghi nhật ký canh tác xuất vật tư), `LivestockServiceImpl.java:780, 821` (thú y/thức ăn), và `InventoryServiceImpl.java:849` (xuất kho nội bộ): Các service này tự động tạo `FarmExpense` với trạng thái `status = 'CONFIRMED'` và lưu qua `farmExpenseRepository.save(expense)`, nhưng **KHÔNG HỀ GỌI `consumeBudget`**!
  - Hậu quả: Ngân sách dự toán (`BudgetLineItem.spent_amount`) bị tính thiếu toàn bộ số tiền chi phí vật tư thực tế phát sinh từ sản xuất tự động!
- **Lỗ hổng 2: Hủy phiếu xuất kho nhưng không hoàn lại ngân sách:**
  - Tại `InventoryServiceImpl.java:899` (`cancelIssue`): Chi phí tương ứng được chuyển sang `status = 'CANCELLED'`, nhưng **KHÔNG HỀ TRỪ ĐI** số tiền đã chi trong `budget_line_items.spent_amount`!

### 2. Công Nợ Đối Tác (`Partner.currentDebt` vs `DebtRecord` & `PaymentTransaction`)
- **Cơ chế tính công nợ hiện tại:**
  Trong `PartnerServiceImpl.java` (dòng 280–283), công nợ được tính động qua SQL:
  `SELECT COALESCE(SUM(remaining_debt), 0.00) FROM debt_records WHERE partner_id = ? AND debt_type = 'PAYABLE' AND status != 'PAID'`
- **Lỗ hổng lệch pha mã trạng thái (Status Semantic Mismatch):**
  - Database Constraint tại `V1_0__init_system_core.sql:1937`:
    `CONSTRAINT chk_debt_records_status CHECK (status IN ('ACTIVE', 'OVERDUE', 'SETTLED', 'BAD_DEBT'))`
  - Khi trả hết nợ qua `allocatePayment` hoặc `offsetDebts` (`DebtAndPaymentServiceImpl.java:325`), hệ thống gán `debt.setStatus("SETTLED")`.
  - Nhưng câu lệnh SQL tính nợ trong `PartnerServiceImpl` lại lọc `WHERE status != 'PAID'`. Vì `'SETTLED' != 'PAID'` là `TRUE`, nếu có lỗi logic làm `remaining_debt` khác 0 hoặc khi đối soát trạng thái, các khoản nợ đã tất toán vẫn bị coi là chưa tất toán!
  - Cần chuẩn hóa câu query thành: `WHERE status NOT IN ('SETTLED', 'BAD_DEBT')` để tuyệt đối an toàn.

### 3. Lô Thành Phẩm & Đơn Bán Sỉ (`ProductBatch` vs `SalesOrder` vs `SalesDelivery`)
- **Khi duyệt đơn bán sỉ (`confirmOrder`):** `batch.reservedQuantity` được tăng lên chính xác theo số lượng đặt hàng.
- **Khi hủy đơn bán sỉ (`cancelOrder`):** `batch.reservedQuantity` được hoàn trả chính xác (`reservedQuantity -= quantity`). Đồng thời nếu đơn đã có đợt giao hàng (`shippedQuantity > 0`), hệ thống chặn hủy an toàn.
- **Lỗ hổng quy trình xuất giao:**
  - Trong `SalesDeliveryServiceImpl.java:158–161`: Khi bấm tạo phiếu giao hàng (`createDelivery`), hệ thống trừ ngay lập tức cả `remainingQuantity` và `reservedQuantity` của `ProductBatch`.
  - Hiện tại hệ thống **CHƯA CÓ API `cancelDelivery`** (hủy phiếu giao hàng khi xe chưa xuất bến hoặc đối tác từ chối nhận hàng). Nếu có sự cố giao hàng, kho không có cơ chế hoàn trả tự động số lượng về `ProductBatch`, dẫn đến thất thoát số liệu tồn kho thành phẩm.

---

## V. BẢNG MA TRẬN LỖ HỔNG ĐỒNG BỘ (GAP MATRIX)

| Mã GAP | Phân hệ ảnh hưởng | Tệp & Vị trí liên quan | Mức độ | Mô tả chi tiết lỗ hổng |
|---|---|---|---|---|
| **GAP-SYNC-01** | Event Bus Trung Tâm | `frontend/src/store/useActiveFarmStore.js` (L69–115) | **CRITICAL** | `syncTrigger` thiếu khởi tạo các kênh `tasks`, `attendance`, `seasons`, `locations`, `all`. Thuộc tính `syncTrigger.all` không tồn tại khiến mọi component lắng nghe `syncTrigger?.all` bị đóng băng hoàn toàn. |
| **GAP-SYNC-02** | Cross-Tab Sync | `frontend/src/store/useActiveFarmStore.js`, `App.jsx` | **HIGH** | Thiếu `BroadcastChannel API` ('agri_erp_sync_bus') và fallback `storage` event để đồng bộ dữ liệu tức thì giữa 2 tab trình duyệt (Maker/Checker) mà không cần F5. Thiếu `visibilitychange` / `focus` reactivity. |
| **GAP-SYNC-03** | Real-Time Notifications | `frontend/src/components/layout/NotificationBell.jsx` (L31–33), `useNotificationStore.js` (L30–42) | **HIGH** | Chuông thông báo chỉ gọi API 1 lần lúc tải trang, thiếu Smart Polling định kỳ (10–15s). Khi có thông báo mới, không tự động kích hoạt `notifyDataChanged('all')` để làm mới Workspace bên dưới. |
| **GAP-SYNC-04** | Platform Shell Header | `frontend/src/shells/PlatformShell/index.jsx` (L168–176) | **MEDIUM** | Nút chuông thông báo trên Header của `PlatformShell` chỉ là button tĩnh, chưa gắn linh kiện `<NotificationBell />` hoàn chỉnh như bên `TenantAppShell`. |
| **GAP-SYNC-05** | Workspaces Freeze | WS-B (`ShiftScheduleTab`, `LeaveAndOvertimeTab`), WS-C (các Drawer chi tiết), WS-F (`TraceabilityDetailDrawer`), WS-G (`PersonalShiftScheduleCard`) | **HIGH** | Nhiều Tab và Drawer chi tiết không đăng ký lắng nghe `syncTrigger`, khiến giao diện bị đóng băng dữ liệu khi có thay đổi từ tab khác hoặc người dùng khác. |
| **GAP-SYNC-06** | Settings & Reports Sync | `frontend/src/pages/settings/tabs/` (`WarehousesTab`, `MaterialsTab`), `pages/reports/index.jsx` | **MEDIUM** | Thêm/sửa kho bãi và vật tư trong Settings không bắn tín hiệu `notifyDataChanged`. Trang Reports là trang tĩnh chưa kết nối API động và chưa lắng nghe `syncTrigger`. |
| **GAP-SYNC-07** | Backend Budget Sync | `FarmExpenseServiceImpl.java`, `FarmingLogServiceImpl.java` (L374), `InventoryServiceImpl.java` (L849, L899), `LivestockServiceImpl.java` (L780) | **CRITICAL** | Auto-Backflushing sinh chi phí CONFIRMED nhưng không cập nhật `BudgetLineItem.spent_amount`. Hủy phiếu xuất kho chuyển chi phí sang CANCELLED nhưng không hoàn trả ngân sách. |
| **GAP-SYNC-08** | Backend Debt & Delivery | `PartnerServiceImpl.java` (L281), `DebtAndPaymentServiceImpl.java` (L325), `DebtMonitorTab.jsx` (L275–280), `SalesDeliveryServiceImpl.java` | **HIGH** | Lệch pha mã trạng thái công nợ (`SETTLED` vs `PAID`), dropdown lọc trạng thái nợ trên UI lệch Check Constraint DB. Thiếu API hủy giao hàng (`cancelDelivery`) hoàn kho `ProductBatch`. |

---

## VI. ĐỀ XUẤT LỘ TRÌNH THỰC THI (IMPLEMENTATION ROADMAP)

Để đưa hệ thống đạt chuẩn phản ứng tức thì không cần F5 (**Zero-F5 Reactivity**) và đảm bảo tính nhất quán dữ liệu dây chuyền từ Backend đến Frontend, đề xuất chia thành **2 Tasks thực thi chuyên sâu**:

### TASK 1 / 2: NÂNG CẤP EVENT BUS TOÀN CỤC, CROSS-TAB BROADCASTCHANNEL, SMART POLLING CHUÔNG THÔNG BÁO & ĐỒNG BỘ DÂY CHUYỀN BACKEND
*(Trọng tâm: Xây dựng hạ tầng đồng bộ thời gian thực & nhất quán số liệu)*
- **Backend:**
  1. Xây dựng cơ chế đồng bộ ngân sách tự động (`consumeBudget` / `revertBudget`) áp dụng cho toàn bộ các luồng sinh chi phí: Auto-Backflushing cây trồng (`FarmingLog`), chăn nuôi (`Livestock`), xuất kho nội bộ (`WarehouseIssue`) và hủy phiếu xuất kho (`GAP-SYNC-07`).
  2. Chuẩn hóa câu query tính nợ trong `PartnerServiceImpl` khớp chuẩn Check Constraint (`status NOT IN ('SETTLED', 'BAD_DEBT')`), bổ sung API `cancelDelivery` hoàn trả tồn kho và giữ chỗ cho `ProductBatch` (`GAP-SYNC-08`).
- **Frontend:**
  1. Tái cấu trúc `useActiveFarmStore.js`: Khởi tạo đầy đủ các kênh `tasks`, `attendance`, `seasons`, `locations`, `all`. Sửa hàm `notifyDataChanged` để khi tăng bất kỳ kênh nào, thuộc tính `all` và `dataVersion` luôn tự động tăng kèm (`GAP-SYNC-01`).
  2. Tích hợp `BroadcastChannel API` (`agri_erp_sync_bus`) và `window.addEventListener('storage')` trong `useActiveFarmStore`: Bất kỳ thao tác thay đổi dữ liệu nào ở Tab 1 sẽ tự động phát sóng sang Tab 2, kích hoạt `syncTrigger` trên toàn bộ các tab mở song song (`GAP-SYNC-02`).
  3. Bổ sung `document.addEventListener('visibilitychange')` và `window.addEventListener('focus')`: Tự động làm mới dữ liệu khi người dùng chuyển lại tab làm việc (`GAP-SYNC-02`).
  4. Nâng cấp `NotificationBell.jsx` & `useNotificationStore.js`: Bổ sung Smart Polling (mỗi 12 giây gọi kiểm tra thông báo khi tab active). Khi phát hiện `unreadCount` tăng hoặc có thông báo mới, tự động gọi `notifyDataChanged('all')` (`GAP-SYNC-03`).
  5. Thay thế nút chuông tĩnh trên `PlatformShell` bằng `<NotificationBell />` hoàn chỉnh (`GAP-SYNC-04`).

### TASK 2 / 2: KHỬ ĐÓNG BĂNG DỮ LIỆU TOÀN DIỆN 8 WORKSPACES, TRANG CÀI ĐẶT & BÁO CÁO, KIỂM THỬ TÍCH HỢP TOÀN BỘ HỆ THỐNG
*(Trọng tâm: Phủ kín các điểm mù UI & kiểm chứng E2E)*
- **Frontend Workspaces:**
  1. Rà soát và bổ sung lắng nghe `syncTrigger` cho toàn bộ các Tab và Drawer bị thiếu: `ShiftScheduleTab`, `LeaveAndOvertimeTab`, `Employee360Drawer`, các Drawer chi tiết của WS-C, `TraceabilityDetailDrawer` của WS-F, `PersonalShiftScheduleCard` của WS-G (`GAP-SYNC-05`).
  2. Sửa dropdown lọc trạng thái công nợ trong `DebtMonitorTab.jsx` khớp 100% với CSDL (`GAP-SYNC-08`).
  3. Bổ sung phát `notifyDataChanged('inventory')` trong `WarehousesTab.jsx` và `MaterialsTab.jsx` tại trang Cài đặt (`GAP-SYNC-06`).
  4. Nâng cấp trang `/app/reports` kết nối dữ liệu điều hành và phản ứng tự động theo `activeFarmId` và `syncTrigger` (`GAP-SYNC-06`).
- **Kiểm thử tích hợp (Verification & Testing):**
  1. Viết bài test tích hợp Backend kiểm chứng việc tiêu hao và hoàn trả ngân sách tự động khi backflush/cancel.
  2. Viết bài test frontend Vitest kiểm chứng BroadcastChannel Event Bus và Cascade Reactivity.
  3. Chạy `mvn test` (đảm bảo 50+ tests PASS 100%) và `npm run build` + `npx vitest run` (đảm bảo 100% PASS).

---

*Báo cáo được hoàn thành và sẵn sàng đệ trình để bước vào giai đoạn thực thi.*

