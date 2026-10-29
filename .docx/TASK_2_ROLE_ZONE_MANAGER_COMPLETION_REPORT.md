# BÁO CÁO HOÀN THÀNH NHIỆM VỤ THỰC THI (TASK 2 / 2 - ROLE_ZONE_MANAGER)
## MỞ KHÓA ĐIỀU PHỐI & NGHIỆM THU CÔNG VIỆC PHÂN KHU TẠI WS-G, ĐỒNG BỘ TỰ ĐỘNG TỔ VIÊN (WS-A <-> WS-G <-> WS-B) & HỆ THỐNG THÔNG BÁO LIÊN CẤP (GAP-ZM-03, GAP-ZM-06, GAP-ZM-07)

---

**Dự án:** Agri-ERP Multi-Tenant SaaS Platform  
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer  
**Đối tượng:** Trưởng Phân Khu / Tổ Trưởng Hiện Trường (`ZONE_MANAGER` — Tài khoản mẫu `zone_manager`)  
**Ngày hoàn thành:** 27/10/2026  
**Trạng thái:** **100% HOÀN TẤT & ĐÃ KIỂM THỬ TOÀN DIỆN (ALL TESTS PASSED)**

---

## I. TỔNG QUAN THỰC HIỆN & BẢNG ĐỐI SOÁT LỖ HỔNG (GAP MATRIX)

Tiếp nối thành công của Task 1 / 2 (đã giải quyết `GAP-ZM-01`, `GAP-ZM-02`, `GAP-ZM-04`, `GAP-ZM-05`), Task 2 / 2 là giai đoạn hoàn thiện cuối cùng cho vai trò **ZONE_MANAGER**. Nhiệm vụ tập trung xử lý dứt điểm 3 lỗ hổng nghiệp vụ vận hành thực địa cốt lõi:
1. **GAP-ZM-03**: Mở khóa quyền giao việc phát sinh, sửa/hủy việc và nghiệm thu chất lượng công việc (`PENDING_REVIEW` -> `DONE` / `IN_PROGRESS`) tại WS-G không bị lỗi 403 Forbidden.
2. **GAP-ZM-06**: Cơ chế tự động đồng bộ danh sách tổ viên phân khu và trạng thái điểm danh liên Workspace (WS-A <-> WS-G <-> WS-B) thông qua Event Bus toàn cục.
3. **GAP-ZM-07**: Hệ thống thông báo liên cấp phân tầng thời gian thực (giao việc, nghiệm thu đạt, yêu cầu làm lại, điểm danh hàng loạt) tuân thủ chặt chẽ Check Constraint của Database.

### Bảng Tổng Hợp Khắc Phục Toàn Diện 7 Mã Lỗ Hổng (`GAP-ZM-01` -> `GAP-ZM-07`)

| Mã Lỗ Hổng | Tên Nghiệp Vụ | Trạng Thái Trước Khắc Phục | Giải Pháp Thực Thi | Trạng Thái Hiện Tại |
| :--- | :--- | :--- | :--- | :---: |
| **GAP-ZM-01** | Khởi tạo tài khoản mẫu `zone_manager` & Seeding phân khu | Chưa có tài khoản mẫu `zone_manager`, thiếu bản ghi `farm_assignments` và Employee profile. | Seeding idempotent trong `HrDataCleanupRunner.java` tại Farm 1 / Zone 1, liên kết Employee profile chuẩn. | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-02** | Quyền xem và quản trị sơ đồ Phân khu WS-A | Bị Route Guard WS-A chặn vì thiếu quyền quản trị địa lý cao cấp. | Bổ sung `PERM_TASK_ASSIGN` vào Route Guard `/app/geography` và `@farmSecurity.isZoneManager(#farmId)`. | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-03** | Giao việc, sửa/hủy việc & Nghiệm thu phân khu tại WS-G | Gặp lỗi 403 Forbidden khi `updateTaskStatus` hoặc tạo việc do thiếu Role quản lý. | Mở rộng SpEL trong `FarmTaskController` và `canApprove` trong `FarmTaskServiceImpl` cho `isZoneManager`. | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-04** | Nghịch lý Base Role (`ROLE_FIELD_STAFF` vs `PERM_TASK_ASSIGN`) | Base role `ROLE_FIELD_STAFF` không có quyền giao việc và điều phối nhân sự. | Triển khai Dynamic Field Leadership Promotion trong `CustomUserDetailsService` & `AuthServiceImpl`. | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-05** | Định danh `useAuthStore` & Bàn làm việc 3 Workspaces | `getOperationalRole()` trả về `FIELD_WORKER` khiến mất quyền và menu điều hướng. | Định danh chuẩn `ZONE_MANAGER`, menu cấu hình 3 Workspaces cốt lõi (WS-G, WS-A, WS-E). | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-06** | Tự động đồng bộ tổ viên liên Workspace (WS-A <-> WS-G <-> WS-B) | Phân công nhân sự ở WS-A không cập nhật tức thì sang WS-G và WS-B. | Kích hoạt `notifyDataChanged` ('employees', 'zones', 'attendance') và hook `syncTrigger` trên toàn hệ thống. | **ĐÃ GIẢI QUYẾT** |
| **GAP-ZM-07** | Hệ thống thông báo phân tầng hiện trường | Chưa có thông báo khi giao việc, nghiệm thu hoàn thành, trả lại làm lại và điểm danh tổ. | Tích hợp Notification đa cấp chuẩn DB Constraint (`TASK`, `WARNING`, `SYSTEM`) trong các Service. | **ĐÃ GIẢI QUYẾT** |

---

## II. CHI TIẾT CÁC HẠNG MỤC THỰC HIỆN TẠI TASK 2 / 2

### 1. Mở Khóa Giao Việc, Sửa/Hủy Việc & Nghiệm Thu Công Việc Hiện Trường (GAP-ZM-03)

#### A. Backend Refactoring:
- **`FarmTaskController.java`**:
  - Endpoint `createTask` (`POST /api/v1/farms/{farmId}/tasks`): Đảm bảo `@PreAuthorize` cho phép `@farmSecurity.isZoneManager(#farmId)` bên cạnh `PERM_TASK_ASSIGN`.
  - Endpoint `updateTask` (`PUT /api/v1/farms/{farmId}/tasks/{id}` & `/api/v1/tasks/{id}`): Cập nhật SpEL cho phép `(#farmId != null and @farmSecurity.isZoneManager(#farmId))`.
  - Endpoint `cancelTask` (`PATCH .../cancel`): Cho phép Trưởng phân khu hủy nhiệm vụ với lý do ghi rõ vào `completionNotes`.
  - Endpoint `deleteTask` (`DELETE /api/v1/farms/{farmId}/tasks/{id}`): Cho phép xóa nhiệm vụ phát sinh chưa thực hiện thuộc phân khu phụ trách.
- **`FarmTaskServiceImpl.java`**:
  - Tại phương thức `updateTaskStatus`:
    ```java
    if ("DONE".equals(targetStatus) || "CANCELLED".equals(targetStatus)) {
        boolean isZoneManager = farmSecurity != null && farmSecurity.isZoneManager(task.getFarmId());
        boolean canApprove = currentUser != null && (
                currentUser.isSuperAdmin()
                || currentUser.hasPermission("PERM_TASK_ASSIGN")
                || currentUser.hasRole("ROLE_FARM_MANAGER")
                || currentUser.hasRole("ROLE_TECHNICAL_STAFF")
                || currentUser.hasRole("ROLE_WAREHOUSE_STAFF")
                || isZoneManager
        );
        if (!canApprove) {
            throw new AccessDeniedException("Chỉ Quản lý trang trại, Trưởng phân khu hoặc Kỹ thuật viên (PERM_TASK_ASSIGN) mới có quyền nghiệm thu hoàn thành (DONE) hoặc hủy (CANCELLED) nhiệm vụ");
        }
    }
    ```
  - Cho phép chuyển từ `PENDING_REVIEW` về `IN_PROGRESS` khi nghiệm thu chưa đạt (Yêu cầu làm lại kèm ghi chú chi tiết).

#### B. Frontend Refactoring:
- **`G_EmployeeDailyOps/index.jsx`**:
  - Trích xuất `isZoneManager` từ `useAuthStore` và gán `const zoneManager = isZoneManager(activeFarmId)`.
  - Khởi tạo quyền giám sát điều phối: `const canSuperviseTasks = farmManager || technicalLead || warehouseKeeper || zoneManager;`.
  - Khởi tạo quyền điểm danh tổ: `const canRollCallTeam = farmManager || technicalLead || warehouseKeeper || zoneManager;`.
  - Đảm bảo hiển thị đầy đủ giao diện quản lý thực địa (Bảng Kanban điều phối và Panel điểm danh tập thể), không bị hạ cấp về giao diện công nhân (`WorkerDailyTasksView`).
- **`PersonalTaskKanban.jsx`**:
  - Truyền `isZoneManager={zoneManager}` vào `PersonalTaskKanban`.
  - Huy hiệu chức danh hiển thị: `"Trưởng Phân Khu / Tổ Trưởng"`.
  - Mở khóa các nút: `+ Giao Việc Phát Sinh`, `Giao nhanh việc phát sinh` (Bón phân vi sinh, Tiêm vắc-xin/phòng dịch), `Sửa`, `Hủy việc`, và nút `🔍 Xem Ảnh & Duyệt (DONE)`.
- **`ReviewTaskModal.jsx`**:
  - Hỗ trợ xem ảnh báo cáo thực địa từ công nhân (`photosJson`).
  - Hỗ trợ 2 luồng phê duyệt:
    1. **Nghiệm thu ĐẠT**: Gọi `updateTaskStatus` -> `DONE`.
    2. **Yêu cầu làm lại**: Gọi `updateTaskStatus` -> `IN_PROGRESS` kèm ghi chú nhắc nhở hiện trường.
- **`GrowthAndHarvestTab.jsx`**:
  - Đảm bảo các nút `+ Ghi Nhận Sản Lượng Thu Hoạch / Xuất Chuồng` và `+ Ghi Cân Nặng` được mở khóa cho `ZONE_MANAGER`.

---

### 2. Tự Động Đồng Bộ Tổ Viên & Điểm Danh Liên Workspace (GAP-ZM-06)

- **Cơ chế Event Bus (`useActiveFarmStore`)**:
  - Khi phân công hoặc kết thúc phân công cán bộ/công nhân tại WS-A (`A_Geography/index.jsx`), hệ thống tự động phát tín hiệu:
    ```javascript
    notifyDataChanged?.('employees');
    notifyDataChanged?.('zones');
    notifyDataChanged?.('farms');
    ```
  - Tại `TeamRollCallPanel.jsx` (WS-G), hook `useEffect` lắng nghe và tự động tái nạp dữ liệu:
    ```javascript
    useEffect(() => {
      if (syncTrigger?.all || syncTrigger?.employees || syncTrigger?.attendance || syncTrigger?.zones) {
        onRefresh?.();
      }
    }, [syncTrigger?.all, syncTrigger?.employees, syncTrigger?.attendance, syncTrigger?.zones]);
    ```
  - Khi Trưởng phân khu hoàn tất điểm danh hàng loạt cho tổ viên tại `TeamRollCallPanel.jsx`, hệ thống kích hoạt đồng bộ ngược:
    ```javascript
    store.notifyDataChanged?.('all');
    store.notifyDataChanged?.('employees');
    store.notifyDataChanged?.('attendance');
    ```
    Giúp bảng chấm công toàn trại tại WS-B (`B_Personnel360`) cập nhật tức thì mà không cần người dùng F5 tải lại trang.

---

### 3. Hệ Thống Thông Báo Phân Tầng Hiện Trường (GAP-ZM-07)

Tuân thủ nghiêm ngặt ràng buộc cơ sở dữ liệu `chk_notifications_type CHECK (type IN ('INFO', 'WARNING', 'ALERT', 'TASK', 'QC', 'SYSTEM'))`, hệ thống thông báo 4 phân tầng đã được kích hoạt hoàn chỉnh:

1. **Thông báo Giao việc mới (Task Assignment)**:
   - **Service**: `FarmTaskServiceImpl.createTask()`
   - **Type**: `"TASK"`
   - **ReferenceType**: `"FARM_TASK"`
   - **Tiêu đề**: `"Nhiệm vụ mới được giao: [Tiêu đề task]"`
   - **Người nhận**: Tất cả công nhân được chỉ định thực hiện nhiệm vụ.
   - **Link điều hướng**: `/app/my-dashboard`

2. **Thông báo Báo cáo hoàn thành (Submit for Review)**:
   - **Service**: `FarmTaskServiceImpl.updateTaskStatus()` (`IN_PROGRESS` -> `PENDING_REVIEW`)
   - **Type**: `"TASK"`
   - **ReferenceType**: `"FARM_TASK"`
   - **Tiêu đề**: `"Nhiệm vụ hoàn thành chờ nghiệm thu: [Tiêu đề task]"`
   - **Người nhận**: Giám đốc trang trại và Trưởng phân khu phụ trách.

3. **Thông báo Nghiệm thu ĐẠT (Task Approved)**:
   - **Service**: `FarmTaskServiceImpl.updateTaskStatus()` (`PENDING_REVIEW` -> `DONE`)
   - **Type**: `"TASK"`
   - **ReferenceType**: `"FARM_TASK"`
   - **Tiêu đề**: `"Nhiệm vụ đã được nghiệm thu hoàn thành: [Tiêu đề task]"`
   - **Người nhận**: Công nhân thực hiện nhiệm vụ.

4. **Thông báo Yêu cầu làm lại (Task Rework)**:
   - **Service**: `FarmTaskServiceImpl.updateTaskStatus()` (`PENDING_REVIEW` -> `IN_PROGRESS`)
   - **Type**: `"WARNING"`
   - **ReferenceType**: `"FARM_TASK"`
   - **Tiêu đề**: `"Yêu cầu thực hiện lại công việc: [Tiêu đề task]"`
   - **Nội dung**: Chứa ghi chú hiện trường cụ thể của Trưởng phân khu (ví dụ: *"Còn sót luống 3 và 4 mép mương, đề nghị phun dặm lại ngay"*).
   - **Người nhận**: Công nhân thực hiện nhiệm vụ.

5. **Thông báo Điểm danh tổ tập thể (Batch Roll-Call)**:
   - **Service**: `TimeAttendanceServiceImpl.batchRollCall()`
   - **Type**: `"SYSTEM"`
   - **ReferenceType**: `"BATCH_ROLL_CALL"`
   - **Tiêu đề**: `"Hoàn tất điểm danh tổ hiện trường ngày [YYYY-MM-DD]"`
   - **Người nhận**: Giám đốc trang trại (`managerUserId`) và Kế toán trang trại (`ROLE_ACCOUNTANT`).

---

## III. BẰNG CHỨNG KIỂM THỬ TOÀN DIỆN (VERIFICATION & TEST RESULTS)

### 1. Integration Test Backend (`RoleZoneManagerWorkflowIntegrationTest.java`)
Kiểm thử tích hợp kịch bản End-to-End từ khâu đăng nhập, thăng cấp quyền động, truy cập phân khu, giao việc, yêu cầu làm lại, nghiệm thu và điểm danh tổ:

```
[INFO] Running com.farm.saas.RoleZoneManagerWorkflowIntegrationTest
2026-10-27T08:37:25.068+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Created farm task id=7, title=[PHÁT SINH] Phun thuốc vi sinh phòng nấm phân khu A1 on farmId=1
2026-10-27T08:37:25.131+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Updated task id=7 status from TODO to IN_PROGRESS
2026-10-27T08:37:25.145+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Updated task id=7 status from IN_PROGRESS to PENDING_REVIEW
2026-10-27T08:37:25.158+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Updated task id=7 status from PENDING_REVIEW to IN_PROGRESS
2026-10-27T08:37:25.179+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Updated task id=7 status from IN_PROGRESS to PENDING_REVIEW
2026-10-27T08:37:25.202+07:00  INFO c.f.s.m.h.s.impl.FarmTaskServiceImpl     : Updated task id=7 status from PENDING_REVIEW to DONE
2026-10-27T08:37:25.273+07:00  INFO c.f.s.m.h.s.i.TimeAttendanceServiceImpl  : Completed batchRollCall: action=CHECK_IN, farmId=1, total=1, distance=0.0m
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 15.73 s -- in com.farm.saas.RoleZoneManagerWorkflowIntegrationTest
[INFO] BUILD SUCCESS
```

### 2. Bộ Kiểm Thử Đơn Vị & Tích Hợp Toàn Bộ Backend (`mvn test`)
Toàn bộ 49/49 bài test tích hợp nghiệp vụ của hệ thống Backend đều vượt qua 100%:

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 49, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  37.169 s
```

### 3. Bộ Kiểm Thử Frontend (`vitest`) & Build Production (`npm run build`)
Toàn bộ 12 test cases kiểm thử giao diện phân quyền vai trò (Zone Manager, Owner, Geography) chạy thành công, và bản dựng Frontend được build sạch sẽ:

```
 RUN  v2.1.9 D:/Projects/Farm_Management/frontend

 ✓ src/ZoneManagerRoleUiFlow.test.jsx (3 tests) 9ms
 ✓ src/GeographyWorkspaceUxStandard.test.jsx (4 tests) 314ms
 ✓ src/OwnerRoleUiFlow.test.jsx (5 tests) 349ms

 Test Files  3 passed (3)
      Tests  12 passed (12)
   Duration  3.47s

> farm-saas-frontend@0.0.1 build
> vite build
✓ 1782 modules transformed.
dist/index.html                     1.01 kB │ gzip:   0.60 kB
dist/assets/index-B5UkWJpS.css     76.64 kB │ gzip:  12.34 kB
dist/assets/index-u9uP51ZT.js   1,489.55 kB │ gzip: 371.80 kB
✓ built in 5.09s
```

---

## IV. KẾT LUẬN & BÀN GIAO

Vai trò **Trưởng Phân Khu / Tổ Trưởng Sản Xuất Hiện Trường (`ZONE_MANAGER` — tài khoản mẫu `zone_manager`)** đã chính thức hoàn thành 100% cả về mặt kiến trúc phân quyền, backend logic, frontend UX và kịch bản kiểm thử tự động.

Hệ thống Agri-ERP Multi-Tenant SaaS hiện đã khép lại trọn vẹn chuỗi phân quyền 4 Cấp Độ RBAC chuẩn Enterprise:
- **Cấp 1**: System Owner / Super Admin
- **Cấp 2**: Giám Đốc Trang Trại (`ROLE_FARM_MANAGER`)
- **Cấp 3**: Kỹ Sư Trưởng / Trưởng Kỹ Thuật (`TECHNICAL_LEAD`)
- **Cấp 4 Vận Hành Chuyên Môn**:
  + Kỹ thuật viên nông nghiệp (`ROLE_TECHNICAL_STAFF`)
  + Công nhân đồng ruộng (`ROLE_FIELD_STAFF`)
  + Thủ kho nông trại (`ROLE_WAREHOUSE_STAFF`)
  + Kế toán trang trại (`ROLE_ACCOUNTANT`)
  + **Trưởng Phân Khu / Tổ Trưởng Hiện Trường (`ZONE_MANAGER`)**

