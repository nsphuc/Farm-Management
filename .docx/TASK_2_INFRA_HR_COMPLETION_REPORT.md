# BÁO CÁO THỰC THI TASK 2 / 6
## MỞ KHÓA QUẢN TRỊ HẠ TẦNG (WORKSPACE A) & HOÀN THIỆN QUẢN LÝ TÀI KHOẢN CẤP 4, SỬA LỊCH PHÂN CA (WORKSPACE B) CHO `ROLE_FARM_MANAGER`

---

## I. TỔNG QUAN KẾT QUẢ THỰC HIỆN
Căn cứ trên Báo cáo Kiểm toán (`GAP_ANALYSIS_ROLE_FARM_MANAGER.md` - Mục 2.1 và 2.2), **Task 2** đã hoàn thành 100% mục tiêu tại cả Backend và Frontend:

1. **Mở khóa Quản trị Hạ tầng Nông trại (Workspace A - `A_Geography`):**
   - Đảm bảo endpoint `PUT /api/v1/farms/{farmId}` có `@PreAuthorize("hasAuthority('PERM_FARM_UPDATE') and @farmSecurity.canAccessFarm(#farmId)")`.
   - Tại `FarmServiceImpl.java`: Cho phép `ROLE_FARM_MANAGER` (Cấp 3) sửa đổi toàn bộ thông số kỹ thuật và vận hành trang trại mình phụ trách (`name`, `farmType`, `totalAreaM2`, `latitude`, `longitude`, `geofenceRadiusM`, `address`), nhưng **bảo vệ bất biến `managerUserId`** (chỉ cho phép `ROLE_FARM_OWNER` hoặc Super Admin bổ nhiệm lại Giám đốc trại).
   - Tại `frontend/src/workspaces/A_Geography/index.jsx` và `MasterGeographicTree.jsx`: Gỡ bỏ điều kiện `{owner && ...}`, mở quyền bấm nút `[✏️ Cập Nhật Thông Số Trại]` cho `ROLE_FARM_MANAGER` qua `<Can permission="PERM_FARM_UPDATE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>`.
   - Tại `FarmFormModal.jsx`: Mở khóa trường diện tích `totalAreaM2` cho Farm Manager, cập nhật Banner hướng dẫn quyền hạn minh bạch; giữ nguyên nút `[+ Thêm Trang Trại Mới]` độc quyền cho `ROLE_FARM_OWNER`.

2. **Hoàn thiện Bộ ba API & Giao diện Quản trị Tài khoản Cấp 4 (Workspace B - `B_Personnel360`):**
   - **Khóa / Mở khóa tài khoản (`PUT /api/v1/users/{id}/status`):** Yêu cầu `PERM_HR_EMPLOYEE_MANAGE`. Giám đốc trang trại chỉ được phép thao tác trên nhân sự Cấp 4 thuộc phạm vi trang trại mình quản lý; cấm tuyệt đối thao tác trên Owner hoặc Giám đốc trại khác. Khi chuyển sang `LOCKED`/`INACTIVE`, hệ thống tự động thu hồi toàn bộ refresh tokens cũ (`revoked = true`).
   - **Đổi Vai trò Nhân sự Cấp 4 (`PUT /api/v1/users/{id}/roles`):** Yêu cầu `PERM_HR_EMPLOYEE_MANAGE`. Kiểm tra bảo mật ma trận phân cấp và `farmSecurity.canAssignRole`. Cho phép Farm Manager chuyển đổi vai trò nhân sự trong 4 Role Cấp 4 (`ROLE_TECHNICAL_STAFF`, `ROLE_WAREHOUSE_STAFF`, `ROLE_ACCOUNTANT`, `ROLE_FIELD_STAFF`), đồng thời tự động đồng bộ chức danh kỹ thuật tương ứng trong bảng `farm_assignments` (`TECHNICAL_LEAD`, `WAREHOUSE_KEEPER`, `ACCOUNTANT`, `FIELD_WORKER`). Hỗ trợ nhận cả `roleIds` lẫn `roleCodes` và tự suy diễn `assignedFarmIds` từ hồ sơ nhân sự.
   - **Reset Mật khẩu Nhân sự (`POST /api/v1/users/{id}/reset-password`):** Bổ sung endpoint mới nhận body `{ "newPassword": "..." }` (mặc định `"Farm@123456"` nếu không truyền). Kiểm tra phân cấp quyền, mã hóa BCrypt, bật cờ `mustChangePassword = true`, reset số lần sai `failedLogins = 0`, gỡ khóa `lockUntil = null`, thu hồi toàn bộ refresh tokens cũ, ghi nhật ký Audit Trail và trả về thông tin mật khẩu tạm thời.
   - Tại `EmployeeDetailDrawer.jsx` (Tab 2 - Tài khoản SaaS): Bổ sung Nút **Khóa / Mở Khóa**, Dropdown + Nút **Lưu Vai Trò** (chỉ hiển thị 4 Role Cấp 4 đối với Farm Manager), và Nút **Reset Mật Khẩu** kèm Modal xác nhận và Toast thông báo mật khẩu tạm trực quan.

3. **Bổ sung API & Giao diện Sửa Lịch Phân Ca Làm Việc (Workspace B):**
   - **API Cập nhật Lịch Phân Ca (`PUT /api/v1/hr/shifts/assignments/{id}`):** Bổ sung endpoint trong `ShiftAssignmentController.java` và `ShiftAssignmentServiceImpl.java` có `@PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")`. Cho phép đổi `employeeId` (đổi người trực thay), `shiftId` (đổi ca), `workDate` (đổi ngày), `status` (`SCHEDULED`, `COMPLETED`, `ABSENT`, `CANCELLED`). Kiểm tra `@farmSecurity.canAccessFarm` và kiểm tra chống trùng lặp ca trực trong ngày (`uk_employee_shift_date`) kèm ngoại lệ nghiệp vụ thân thiện `DUPLICATE_SHIFT_ASSIGNMENT`.
   - Tại `ShiftScheduleTab.jsx`: Trên từng ô ca trực trong ma trận tuần, bổ sung nút **`[Sửa Ca]`** (icon `Edit2`) bọc trong `<Can permission="PERM_HR_EMPLOYEE_MANAGE" role={['ROLE_FARM_MANAGER', 'ROLE_FARM_OWNER']}>`.
   - Tại `ShiftScheduleModal.jsx`: Nâng cấp hỗ trợ 2 chế độ **Tạo mới (`create`)** (chọn dải ngày, chọn nhiều nhân viên) và **Chỉnh sửa (`edit`)** (điền sẵn thông tin ca, chọn nhân viên trực thay, ngày trực, trạng thái ca).

---

## II. DANH SÁCH FILE ĐÃ THAY ĐỔI

### 1. Backend (Spring Boot 3.3.4, Java 21)
| STT | File Path | Loại thay đổi | Chi tiết |
|:---:|:---|:---:|:---|
| 1 | `backend/.../modules/geography/service/impl/FarmServiceImpl.java` | Business Logic & RBAC | Kiểm tra quyền `isOwnerOrAdmin` trước khi cho phép cập nhật `managerUserId`. Farm Manager được phép cập nhật tất cả thông số kỹ thuật, vị trí GPS và diện tích. |
| 2 | `backend/.../modules/auth/dto/request/ResetPasswordRequest.java` | DTO Mới | Tạo request body nhận `newPassword` (tùy chọn). |
| 3 | `backend/.../modules/auth/dto/request/UpdateUserRolesRequest.java` | DTO Update | Bổ sung hỗ trợ `roleCodes` và `roles` (danh sách String mã role) bên cạnh `roleIds`. |
| 4 | `backend/.../modules/auth/controller/UserController.java` | API Endpoint | Thêm `@PostMapping("/api/v1/users/{id}/reset-password")` với `@PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")`. |
| 5 | `backend/.../modules/auth/service/UserService.java` | Service Interface | Bổ sung phương thức `resetPassword(Long id, ResetPasswordRequest request)`. |
| 6 | `backend/.../modules/auth/service/UserServiceImpl.java` | Core Service | Hiện thực kiểm tra bảo mật phân cấp (Tier 4, cùng trang trại) cho `updateUserStatus`, `updateUserRoles`, `resetPassword`. Tự động thu hồi refresh token khi khóa/reset; tự động đồng bộ chức danh sang `farm_assignments`. |
| 7 | `backend/.../modules/hr/dto/request/UpdateShiftAssignmentRequest.java` | DTO Mới | Tạo request body nhận `employeeId`, `shiftId`, `workDate`, `status`. |
| 8 | `backend/.../modules/hr/controller/ShiftAssignmentController.java` | API Endpoint | Thêm `@PutMapping("/assignments/{id}")` với `@PreAuthorize("hasAuthority('PERM_HR_EMPLOYEE_MANAGE')")`. |
| 9 | `backend/.../modules/hr/service/ShiftAssignmentService.java` | Service Interface | Bổ sung phương thức `updateAssignment(Long id, UpdateShiftAssignmentRequest request)`. |
| 10 | `backend/.../modules/hr/service/impl/ShiftAssignmentServiceImpl.java` | Service Impl | Hiện thực cập nhật ca trực, kiểm tra `@farmSecurity.canAccessFarm`, chặn trùng lặp ca theo `uk_employee_shift_date`. |
| 11 | `backend/.../modules/hr/dto/response/EmployeeDetailResponse.java` | DTO Update | Thêm trường `userRole` và `userRoles` để trả về vai trò SaaS hiện tại của nhân sự. |
| 12 | `backend/.../modules/hr/service/impl/EmployeeServiceImpl.java` | Service Impl | Truy vấn và nạp `userRole` / `userRoles` cho `EmployeeDetailResponse`. |

### 2. Frontend (React 18, Vite, Zustand)
| STT | File Path | Chi tiết cập nhật |
|:---:|:---|:---|
| 1 | `frontend/src/services/api/endpoints.js` | Thêm endpoint `USERS.RESET_PASSWORD(id)` và `HR.SHIFT_ASSIGNMENT_UPDATE(id)`. |
| 2 | `frontend/src/services/modules/hrService.js` | Bổ sung các hàm: `updateUserRoles`, `resetUserPassword`, `updateShiftAssignment`. |
| 3 | `frontend/src/services/modules/employeeService.js` | Bổ sung các hàm helper: `updateUserStatus`, `updateUserRoles`, `resetUserPassword`. |
| 4 | `frontend/src/workspaces/A_Geography/index.jsx` | Gỡ bỏ điều kiện `{owner && ...}`, mở khóa nút `[✏️ Cập Nhật Thông Số Trại]` cho `ROLE_FARM_MANAGER` qua `<Can permission="PERM_FARM_UPDATE" role={["ROLE_FARM_OWNER", "ROLE_FARM_MANAGER"]}>`. |
| 5 | `frontend/src/workspaces/A_Geography/components/MasterGeographicTree.jsx` | Mở khóa nút sửa trang trại trên cây địa lý cho `ROLE_FARM_MANAGER`. |
| 6 | `frontend/src/workspaces/A_Geography/components/FarmFormModal.jsx` | Mở khóa sửa `totalAreaM2` cho Farm Manager, cập nhật Banner giải thích quyền hạn. |
| 7 | `frontend/src/workspaces/B_Personnel360/components/EmployeeDetailDrawer.jsx` | Tab 2: Thêm cụm quản trị tài khoản (Khóa/Mở khóa, Đổi vai trò Cấp 4, Reset mật khẩu kèm Modal nhập mật khẩu mới và Toast thông báo). |
| 8 | `frontend/src/workspaces/B_Personnel360/components/ShiftScheduleTab.jsx` | Bổ sung nút `[Sửa Ca]` (icon Edit2) trên từng thẻ ca trực của ma trận tuần; liên kết state `editingAssignment`. |
| 9 | `frontend/src/workspaces/B_Personnel360/components/ShiftScheduleModal.jsx` | Nâng cấp hỗ trợ đồng thời cả 2 chế độ Tạo mới (`create`) và Chỉnh sửa ca (`edit`). |

---

## III. MA TRẬN BẢO MẬT & PHÂN QUYỀN RBAC ĐÃ HOÀN TẤT TRONG TASK 2

| Nghiệp vụ / Thao tác | `ROLE_FARM_OWNER` (Cấp 2) | `ROLE_FARM_MANAGER` (Cấp 3) | Nhân sự Cấp 4 |
|:---|:---:|:---:|:---:|
| **Tạo mới Trang trại** (`POST /api/v1/farms`) | ✅ Cho phép | ❌ Chặn (Chỉ xem) | ❌ Chặn |
| **Sửa thông số Trang trại** (`PUT /api/v1/farms/{id}`) | ✅ Toàn quyền (gồm đổi Giám đốc) | ✅ Cho phép (Tên, Loại hình, Diện tích, GPS, Bán kính) - Khóa cố định Giám đốc | ❌ Chặn |
| **Khóa / Mở khóa tài khoản SaaS** | ✅ Mọi tài khoản trong Tenant | ✅ Chỉ nhân sự Cấp 4 thuộc trang trại mình quản lý | ❌ Chặn |
| **Đổi vai trò nhân sự (Roles)** | ✅ Phân quyền Giám đốc & Cấp 4 | ✅ Chuyển đổi giữa 4 vai trò Cấp 4 (`FIELD`, `TECH`, `WAREHOUSE`, `ACCOUNTANT`) | ❌ Chặn |
| **Reset mật khẩu nhân sự** | ✅ Reset Giám đốc & Cấp 4 | ✅ Chỉ reset Cấp 4 thuộc trại mình quản lý | ❌ Chặn |
| **Phân ca & Sửa lịch trực ca** | ✅ Toàn quyền | ✅ Toàn quyền trên các trại mình quản lý | ❌ Chặn |

---

## IV. KẾT QUẢ KIỂM THỬ TÍCH HỢP (AUTOMATED TESTING)

1. **Backend Tests:**
   - Biên dịch: `mvn test-compile` -> **BUILD SUCCESS** (435 source files, 14 test files).
   - Kiểm thử đơn vị & tích hợp: `mvn test` -> **BUILD SUCCESS (0 Errors, 0 Failures)**.
2. **Frontend Tests:**
   - Kiểm tra Bundle: `npm run build` -> **Vite v5.4.21: 1769 modules transformed, built in 10.60s (0 errors)**.
   - Kiểm thử đơn vị: `npx vitest run` -> **2 test files passed, 9 tests passed (100% PASS)**.
