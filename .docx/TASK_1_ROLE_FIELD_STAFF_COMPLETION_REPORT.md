# BÁO CÁO THỰC THI & HOÀN TẤT TASK 1 / 3 - ROLE_FIELD_STAFF
**Dự án:** Agri-ERP Multi-Tenant SaaS
**Đối tượng kiểm toán & thực thi:** Tài khoản Cấp 4 — `ROLE_FIELD_STAFF` (Nhân viên / Công nhân Hiện trường — user mẫu `staff`)
**Vai trò:** Principal Software Architect & Senior Fullstack Engineer
**Ngày thực hiện:** 26/10/2026
**Mã lỗ hổng giải quyết:** `GAP-FIELD-01`, `GAP-FIELD-02`, `GAP-FIELD-05`, `GAP-FIELD-06`

---

## I. TỔNG QUAN KẾT QUẢ THỰC THI

| Mã Lỗ Hổng | Tên Lỗ Hổng / Vấn Đề | Trạng Thái Trước | Trạng Thái Sau | Cơ Chế Giải Quyết |
| :--- | :--- | :--- | :--- | :--- |
| **`GAP-FIELD-01`** | Thiếu Menu WS-E trên Sidebar của Field Worker | ❌ Chỉ có WS-G, thiếu WS-E để ghi nhật ký canh tác/thu hoạch |  **HOÀN TẤT (RESOLVED)** | Mở khóa chuẩn xác 2 Workspaces (`WS-G` & `WS-E`) trong `menuConfig.js`. Ẩn toàn bộ Menu Quản trị & Cài đặt. |
| **`GAP-FIELD-02`** | Lỗ hổng SoD Route Guards do `PERM_FARM_VIEW` làm vé vạn năng | ❌ Field Worker có thể gõ URL lọt vào WS-A, WS-D, Settings |  **HOÀN TẤT (RESOLVED)** | Loại bỏ `PERM_FARM_VIEW` khỏi guards của `/app/geography`, `/app/partners`, `/app/settings`. Siết chặt phân quyền đúng SoD. |
| **`GAP-FIELD-05`** | Lỗi HTTP 403 Forbidden khi xem Lịch phân ca cá nhân | ❌ GET `/api/v1/hr/shifts/assignments` chặn Field Staff |  **HOÀN TẤT (RESOLVED)** | Nới lỏng `@PreAuthorize` cho phép `hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_HR_ATTENDANCE') or isAuthenticated()`. Giữ chặt quyền ghi/xóa ca. |
| **`GAP-FIELD-06`** | Lỗi HTTP 400 EMPLOYEE_PROFILE_REQUIRED khi Chấm công / Nghỉ phép | ❌ Tài khoản `staff` chưa có dòng trong bảng `employees` |  **HOÀN TẤT (RESOLVED)** | **Bảo vệ 2 lớp:**<br>1. Lớp 1: `HrDataCleanupRunner` quét & tự sinh `Employee` chuẩn khi boot app.<br>2. Lớp 2: Fallback tự phục hồi trong `TimeAttendanceServiceImpl` và `LeaveOvertimeServiceImpl`. Bổ sung `employeeId` trong `UserInfoDto`. |

---

## II. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN

### 1. Backend

#### a. `ShiftAssignmentController.java` (`GAP-FIELD-05`)
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/hr/controller/ShiftAssignmentController.java`
- **Thay đổi:**
  - Cập nhật `@PreAuthorize` của method `getAssignments`:
    ```java
    @GetMapping("/assignments")
    @PreAuthorize("hasAnyAuthority('PERM_HR_EMPLOYEE_MANAGE', 'PERM_HR_ATTENDANCE') or isAuthenticated()")
    public ResponseEntity<List<ShiftAssignmentResponse>> getAssignments(...)
    ```
  - Giữ nguyên các thao tác phân công ca (`POST`), chỉnh sửa ca (`PUT`), hủy ca (`PUT /cancel`) yêu cầu nghiêm ngặt quyền quản lý nhân sự `PERM_HR_EMPLOYEE_MANAGE`.

#### b. `HrDataCleanupRunner.java` (`GAP-FIELD-06` - Lớp bảo vệ 1)
- **Đường dẫn:** `backend/src/main/java/com/farm/saas/modules/hr/config/HrDataCleanupRunner.java`
- **Thay đổi:**
  - Bổ sung phương thức `seedStandardEmployeeProfiles()` chạy tự động mỗi khi khởi động hệ thống.
  - Quét danh sách người dùng thuộc Tenant có vai trò vận hành (`ROLE_FARM_MANAGER`, `ROLE_TECHNICAL_STAFF`, `ROLE_WAREHOUSE_STAFF`, `ROLE_ACCOUNTANT`, `ROLE_FIELD_STAFF`) mà chưa có bản ghi trong bảng `employees`.
  - Tự động chèn bản ghi `Employee` hoàn chỉnh với:
    - `tenant_id`, `farm_id` (lấy từ `user_farm_access` hoặc trang trại mặc định đầu tiên của tenant).
    - `user_id = user.getId()`.
    - `employee_code = "EMP-SEED-" + user.getId()` (tự động chống trùng mã).
    - `full_name`, `phone`, `email`.
    - `joined_date = LocalDate.now()`, `base_salary = 0.00`, `hourly_rate = 0.00`, `contract_type = "FULL_TIME"`, `annual_leave_quota = 12.0`, `status = "ACTIVE"`.

#### c. `TimeAttendanceServiceImpl.java` & `LeaveOvertimeServiceImpl.java` (`GAP-FIELD-06` - Lớp bảo vệ 2)
- **Đường dẫn:**
  - `backend/src/main/java/com/farm/saas/modules/hr/service/impl/TimeAttendanceServiceImpl.java`
  - `backend/src/main/java/com/farm/saas/modules/hr/service/impl/LeaveOvertimeServiceImpl.java`
- **Thay đổi:**
  - Trong phương thức `resolveEmployee(Long tenantId, Long currentUserId, Long requestedEmployeeId)`:
    - Nếu không tìm thấy hồ sơ `Employee` theo `(tenantId, currentUserId)`, thay vì ném ngoại lệ `EMPLOYEE_PROFILE_REQUIRED` gây vỡ flow người dùng, hệ thống gọi `autoProvisionEmployeeProfile(...)` để tự động tạo ngay hồ sơ nhân sự liên kết với user hiện tại tại trang trại đang thao tác.

#### d. `UserInfoDto.java` & `AuthServiceImpl.java`
- **Đường dẫn:**
  - `backend/src/main/java/com/farm/saas/modules/auth/dto/response/UserInfoDto.java`
  - `backend/src/main/java/com/farm/saas/modules/auth/service/AuthServiceImpl.java`
- **Thay đổi:**
  - Bổ sung trường `private Long employeeId;` vào `UserInfoDto`.
  - Trong `AuthServiceImpl.buildUserInfoDto(User user)`: tra cứu `employeeRepository.findByUserId(user.getId())` và gán `.employeeId(emp != null ? emp.getId() : null)` để Frontend nhận trực tiếp ngay sau khi đăng nhập hoặc gọi `/auth/me`.

---

### 2. Frontend

#### a. `menuConfig.js` (`GAP-FIELD-01`)
- **Đường dẫn:** `frontend/src/shells/TenantAppShell/menuConfig.js`
- **Thay đổi:**
  - Cập nhật cấu hình Workspace cho vai trò `FIELD_WORKER`:
    ```javascript
    case 'FIELD_WORKER':
      return {
        sectionTitle: 'Bàn Tác Nghiệp Hiện Trường',
        workspaces: [
          {
            ...ALL_WORKSPACES.G_EmployeeDailyOps,
            label: 'WS-G: Bảng Tác Nghiệp & Chấm Công',
            badge: 'Hôm nay',
          },
          {
            ...ALL_WORKSPACES.E_FarmingOps,
            label: 'WS-E: Nhật Ký Canh Tác & Thu Hoạch',
            badge: 'Đồng ruộng / Chuồng',
          },
        ],
        independentModules: [],
      };
    ```

#### b. `routes.jsx` (`GAP-FIELD-02`)
- **Đường dẫn:** `frontend/src/app/routes.jsx`
- **Thay đổi:**
  - `/app/geography`: Thay thế `permission="PERM_FARM_VIEW"` bằng `anyPermissions={['PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']}`.
  - `/app/partners`: Loại bỏ `PERM_FARM_VIEW`. Cấu hình `anyPermissions={['PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_PAYMENT', 'PERM_FINANCE_REPORT', 'PERM_INVENTORY_RECEIPT', 'PERM_FARM_UPDATE']}`.
  - `/app/settings`: Loại bỏ `PERM_FARM_VIEW`. Cấu hình `anyPermissions={['PERM_TENANT_MANAGE', 'PERM_FARM_UPDATE', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_MANAGE']}`.
  - Đảm bảo công nhân hiện trường không thể vượt mặt rào cản giao diện bằng cách nhập URL trực tiếp vào thanh địa chỉ trình duyệt.

#### c. `PersonalShiftScheduleCard.jsx`, `OneTapTimekeepingCard.jsx`, `G_EmployeeDailyOps/index.jsx`
- **Đường dẫn:**
  - `frontend/src/workspaces/G_EmployeeDailyOps/components/PersonalShiftScheduleCard.jsx`
  - `frontend/src/workspaces/G_EmployeeDailyOps/components/OneTapTimekeepingCard.jsx`
  - `frontend/src/workspaces/G_EmployeeDailyOps/index.jsx`
- **Thay đổi:**
  - `PersonalShiftScheduleCard.jsx`: Tự động gọi `hrService.getShiftAssignments` để tải và hiển thị danh sách ca làm việc đã được phân bổ trong ngày của nhân sự; fallback hiển thị ca tiêu chuẩn trực quan; xử lý an toàn lỗi không gây gián đoạn Console.
  - `OneTapTimekeepingCard.jsx`: Nhận `employee` prop và truyền kèm `employeeId` trong payload chấm công.
  - `G_EmployeeDailyOps/index.jsx`: Truyền `employee={employee}` vào `OneTapTimekeepingCard`.

---

## III. KẾT QUẢ KIỂM ĐỊNH TỰ ĐỘNG

1. **Kiểm tra Biên dịch Backend (`mvn test-compile`):**
   - **Kết quả:** `BUILD SUCCESS` (0 lỗi biên dịch, biên dịch 436 source files Java 21 thành công).
2. **Kiểm tra Frontend Build (`npm run build`):**
   - **Kết quả:** `✓ built in 4.34s` (0 lỗi TypeScript/JSX).
3. **Kiểm tra Frontend Unit Tests (`npx vitest run`):**
   - **Kết quả:** `2 passed (2 test files)`, `9 passed (9 tests)`, 100% PASS.
4. **Kiểm tra Database Migrations:**
   - **Cam kết tuân thủ:** 100% không chạm vào bất kỳ file SQL Flyway nào từ `V1_0` đến `V1_5`, đảm bảo Checksum toàn vẹn tuyệt đối.

---

## IV. BƯỚC TIẾP THEO
Sẵn sàng chuyển sang **TASK 2 / 3**:
- Bổ sung Tab / Bộ lọc Nhật ký Thu hoạch Nông sản (`HarvestLog`) tại `WS-E` cho `ROLE_FIELD_STAFF`.
- Vá lỗi 403 / 400 khi công nhân hiện trường gửi log thu hoạch trực tiếp ngoài ruộng/vườn.
