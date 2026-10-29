# BÁO CÁO KIỂM TOÁN TOÀN DIỆN & PHÂN TÍCH LỖ HỔNG (GAP ANALYSIS)
## VAI TRÒ CẤP 1: ROLE_SUPER_ADMIN — QUẢN TRỊ VIÊN TỐI CAO NỀN TẢNG MULTI-TENANT SAAS

---

**Dự án:** Agri-ERP Multi-Tenant SaaS Platform  
**Vị trí khảo sát:** Cấp 1 — Quản trị viên Tối cao Toàn Nền tảng (`ROLE_SUPER_ADMIN` — Tài khoản mẫu `admin`)  
**Tác giả:** Principal Software Architect  
**Ngày báo cáo:** 27/10/2026  
**File lưu trữ:** `.docx/GAP_ANALYSIS_ROLE_SUPER_ADMIN.md`  
**Trạng thái khảo sát:** **HOÀN THÀNH 100% — ĐÃ XÁC ĐỊNH RÕ TOÀN BỘ 8 MÃ LỖ HỔNG (GAP-SA-01 ĐẾN GAP-SA-08)**

---

## TỔNG QUAN KIẾN TRÚC & PHÂN ĐỊNH PHẠM VI (ARCHITECTURAL SCOPE)

Trong mô hình kiến trúc phân quyền 4 Cấp Độ (4-Tier RBAC) của nền tảng Agri-ERP Multi-Tenant SaaS:
- **Cấp 1 — ROLE_SUPER_ADMIN (Quản trị viên Nền tảng / SaaS Control Plane)**:
  - Tài khoản độc lập toàn cầu, không thuộc bất kỳ Tenant nào (`users.tenant_id IS NULL`, được bảo toàn bởi ràng buộc cơ sở dữ liệu `chk_users_super_admin_tenant CHECK ((is_super_admin = TRUE AND tenant_id IS NULL) OR (is_super_admin = FALSE AND tenant_id IS NOT NULL))`).
  - Sở hữu không gian làm việc chuyên biệt `/platform/*` (`PlatformShell`), ẩn 100% các phân hệ nông nghiệp nội bộ của từng trang trại và được bảo vệ nghiêm ngặt bởi `RoleScopeGuard scope="PLATFORM"`.
  - Nắm giữ toàn quyền quản trị vòng đời khách thuê (Tenants), phát hành & kiểm soát hạn mức gói cước (Subscriptions), giám sát sổ cái kiểm toán bất biến (Global Audit Logs), hỗ trợ khẩn cấp (Reset mật khẩu, khóa tài khoản) và giám sát hạ tầng.
- **Cấp 2 — ROLE_FARM_OWNER**: Chủ đầu tư / Chủ doanh nghiệp thuê bao (`scope_level = 'TENANT'`).
- **Cấp 3 — ROLE_FARM_MANAGER / TECHNICAL_LEAD**: Giám đốc điều hành & Kỹ sư trưởng trang trại (`scope_level = 'FARM'`).
- **Cấp 4 — Đội ngũ Chuyên môn Hiện trường**: `ROLE_TECHNICAL_STAFF`, `ROLE_FIELD_STAFF`, `ROLE_WAREHOUSE_STAFF`, `ROLE_ACCOUNTANT`, `ZONE_MANAGER`.

---

## 1. KIỂM TRA ĐIỀU HƯỚNG, SHELL, MENU & ROUTE GUARDS CỦA ROLE_SUPER_ADMIN

### 1.1. Cơ Chế Định Danh & Điều Hướng Đăng Nhập
- **Tài khoản mẫu**:
  - `username = "admin"`, `email = "admin@farm.saas"`, mật khẩu mặc định `Password@123` (mã hóa chuẩn BCrypt `$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu`).
  - Thuộc tính trong bảng `users`: `id = 1`, `tenant_id = NULL`, `is_super_admin = TRUE`, `status = 'ACTIVE'`, `must_change_password = FALSE`.
  - Bản ghi trong bảng `user_roles`: `(tenant_id = NULL, user_id = 1, role_id = 1, farm_id = NULL)` tương ứng `ROLE_SUPER_ADMIN`.
- **Hàm `getOperationalRole()` trong `frontend/src/store/useAuthStore.js` (dòng 526-538)**:
  ```javascript
  getOperationalRole: (farmId = null) => {
    const { isSuperAdmin, ... } = get();
    if (isSuperAdmin()) return 'SUPER_ADMIN';
    ...
  }
  ```
  -> Trả về chính xác giá trị `'SUPER_ADMIN'`.
- **Hàm `getOperationalRoleInfo()` (dòng 551-565)**:
  -> Trả về siêu dữ liệu chuẩn: `code: 'SUPER_ADMIN'`, `roleNumber: 0`, `title: 'Quản Trị Viên Toàn Hệ Thống'`, `shortTitle: 'Super Admin'`, `badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'`, `canSkipAttendance: true`, `isFarmLocked: false`, `canProxyAttendance: true`.
- **Cơ chế Điều hướng sau Đăng nhập (`frontend/src/shells/AuthShell/LoginPage.jsx`, dòng 69-73)**:
  ```javascript
  if (userInfo?.isSuperAdmin) {
    navigate(redirectUrl && redirectUrl.startsWith('/platform') ? redirectUrl : '/platform', {
      replace: true,
    });
  }
  ```
  -> Điều hướng chuẩn xác về đường dẫn **`/platform`**.
  -> Khi người dùng truy cập trang gốc `/`, `routes.jsx` chuyển hướng về `/app`, nhưng ngay lập tức bị `RoleScopeGuard scope="TENANT"` chặn lại:
  ```javascript
  if (scope === 'TENANT' && isSuper) {
    return <Navigate to="/platform" replace />;
  }
  ```
  -> Super Admin được bảo vệ cách ly tuyệt đối, tự động chuyển về `/platform`.

### 1.2. Shell & Menu Sidebar (`frontend/src/shells/PlatformShell/index.jsx`)
- **Shell áp dụng**: `PlatformShell` (Giao diện chuyên biệt dành cho Cấp 1).
- **Thanh Menu Sidebar (`PLATFORM_NAV`, dòng 20-45)** hiện có 4 mục:
  1. `tenants`: Khách Thuê (Tenants) -> `/platform/tenants` (icon: `Building`)
  2. `subscriptions`: Gói Dịch Vụ & Hạn Mức -> `/platform/subscriptions` (icon: `CreditCard`)
  3. `audit`: Nhật Ký Kiểm Toán Toàn Cầu -> `/platform/audit-logs` (icon: `FileSearch`)
  4. `metrics`: Giám Sát Hạ Tầng & Sức Khỏe -> `/platform/health` (icon: `Activity`)
- **Lỗ hổng nghiêm trọng phát hiện tại Router (`frontend/src/app/routes.jsx`, dòng 112-118 - GAP-SA-01)**:
  ```jsx
  <Route path="/platform" element={<AuthGuard><MustChangePasswordGuard><RoleScopeGuard scope="PLATFORM"><PlatformShell /></RoleScopeGuard></MustChangePasswordGuard></AuthGuard>}>
    <Route index element={<PlatformDashboardPage />} />
    <Route path="tenants" element={<PlatformDashboardPage />} />
    <Route path="subscriptions" element={<PlatformDashboardPage />} />
    <Route path="audit-logs" element={<PlatformDashboardPage />} />
    <Route path="health" element={<PlatformDashboardPage />} />
  </Route>
  ```
  -> **Khi Super Admin bấm vào từng mục menu trên Sidebar (`tenants`, `subscriptions`, `audit-logs`, `health`), Router đều chỉ hiển thị duy nhất một file tĩnh `PlatformDashboardPage`**!
  -> File `frontend/src/pages/platform/index.jsx` dài vỏn vẹn 55 dòng, chứa 4 thẻ chỉ số gán cứng (`"12 Doanh nghiệp"`, `"18 Hợp đồng"`...), 1 nút bấm "+ Khởi Tạo Khách Thuê Mới" không có sự kiện `onClick`, và một thẻ tiêu đề rỗng! Người dùng không thể xem dữ liệu riêng biệt của từng menu.
- **Hành vi khi Super Admin cố tình truy cập `/app/*`**:
  -> Được bảo vệ bởi `RoleScopeGuard` (dòng 19-24 `frontend/src/app/guards/RoleScopeGuard.jsx`), tự động `Navigate to="/platform" replace`, không phát sinh crash trắng màn hình.

---

## 2. KIỂM TRA QUẢN TRỊ VÒNG ĐỜI DOANH NGHIỆP THUÊ BAO (TENANT LIFECYCLE & OWNER PROVISIONING)

### 2.1. Danh Sách & Chi Tiết Doanh Nghiệp (Tenants)
- **Backend API**:
  - `PlatformTenantController.java` (dòng 32-39): Endpoint `GET /api/v1/platform/tenants?status={status}&keyword={keyword}&page={page}&size={size}` phân quyền `@PreAuthorize("hasAuthority('PERM_TENANT_MANAGE')")`.
  - `PlatformTenantServiceImpl.java` (dòng 142-145 và 230-275): `toTenantDetailResponse()` trả về DTO `TenantDetailResponse`:
    + Thông tin cơ bản: `id`, `code`, `name`, `subdomain`, `status` (`ACTIVE`, `SUSPENDED`, `INACTIVE`), `subscriptionPlan`.
    + Gói cước (`activeSubscription`): `planType`, `maxFarms`, `maxUsers`, `validFrom`, `validTo`, `remainingDays`, `isExpired`, `isActive`.
    + Hạn mức sử dụng thực tế (`currentUsage`):
      * `totalFarms`: Đếm số lượng trang trại đang có trong DB (`SELECT COUNT(*) FROM farms WHERE tenant_id = ?`).
      * `totalUsers`: Đếm số lượng tài khoản người dùng đang có (`SELECT COUNT(*) FROM users WHERE tenant_id = ?`).
    + Dấu vết kiểm toán: `createdAt`, `updatedAt`.
  - Endpoint `GET /api/v1/platform/tenants/{id}` trả về chi tiết 1 Tenant.
- **Frontend Hiện Tại (GAP-SA-02)**:
  - Hoàn toàn **chưa có bảng danh sách Tenants**.
  - Phần `Danh Sách Doanh Nghiệp Thuê Nền Tảng (Tenants)` trong `PlatformDashboardPage.jsx` chỉ là 2 dòng thẻ `<p>` và `<h2>` tĩnh, không kết nối API, không có ô tìm kiếm, không có bộ lọc trạng thái và không có phân trang.

### 2.2. Khởi Tạo Doanh Nghiệp Thuê Bao Mới (Atomic Onboarding + Owner Provisioning)
- **Backend API**:
  - Endpoint `POST /api/v1/platform/tenants` nhận `CreateTenantRequest` (`code`, `name`, `subdomain`, `planType`, `maxFarms`, `maxUsers`, `validFrom`, `validTo`, `adminEmail`, `adminFullName`, `adminPassword`).
  - Xử lý trong `PlatformTenantServiceImpl.createTenant()` (dòng 55-138):
    Trong một Transaction duy nhất (`@Transactional`), Backend tự động khởi tạo đồng bộ:
    1. Bản ghi `Tenant` mới (`status = 'ACTIVE'`).
    2. Bản ghi `TenantSubscription` với hạn mức `maxFarms`, `maxUsers`, thời hạn `validFrom` - `validTo`.
    3. Bản ghi hồ sơ pháp nhân `Enterprise` (`contactEmail = adminEmail`).
    4. **Tự động tạo luôn Tài khoản Chủ Đầu Tư (`ROLE_FARM_OWNER`)**:
       - `username = adminEmail`, `email = adminEmail`, `fullName = adminFullName`.
       - Mật khẩu: Mã hóa BCrypt mật khẩu do admin chỉ định hoặc mặc định `"Password@2026"`.
       - Thiết lập `mustChangePassword = true` để bắt buộc đổi mật khẩu khi đăng nhập lần đầu.
       - Gán quyền `ROLE_FARM_OWNER` tại bảng `user_roles`.
    5. Ghi nhật ký kiểm toán bất biến `CREATE_TENANT`.
  => **Backend đã hoàn chỉnh 100% cơ chế Onboarding trọn gói (Atomic Tenant + Owner Provisioning)**.
- **Frontend Hiện Tại (GAP-SA-03)**:
  - Nút `Khởi Tạo Khách Thuê Mới` trên `PlatformDashboardPage.jsx` (dòng 28-30) **hoàn toàn không có thuộc tính `onClick`**.
  - Chưa xây dựng `CreateTenantModal.jsx` để hiển thị form nhập thông tin khách thuê và tài khoản Owner.

### 2.3. Tạm Khóa (Suspend) & Kích Hoạt Lại (Activate) Doanh Nghiệp
- **Backend API & Chốt Chặn Bảo Mật**:
  - Endpoint: `PUT /api/v1/platform/tenants/{id}/status` nhận `UpdateTenantStatusRequest` (`ACTIVE`, `SUSPENDED`, `INACTIVE`).
  - Khi chuyển sang `SUSPENDED` hoặc `INACTIVE` (`PlatformTenantServiceImpl.java`, dòng 165-174):
    ```java
    jdbcTemplate.update(
        "UPDATE refresh_tokens rt JOIN users u ON rt.user_id = u.id " +
        "SET rt.revoked = TRUE, rt.revoked_at = NOW() " +
        "WHERE u.tenant_id = ? AND rt.revoked = FALSE", id);
    ```
    -> **Thu hồi ngay lập tức 100% Refresh Tokens** của tất cả user thuộc Tenant đó.
  - Chốt chặn thời gian thực tại `JwtAuthenticationFilter.java` (dòng 46-69):
    Mỗi request mang JWT của user thuộc tenant đều bị kiểm tra `SELECT status FROM tenants WHERE id = ?`. Nếu `status != 'ACTIVE'`, request bị chặn ngay lập tức với HTTP 403 `TENANT_SUSPENDED`.
  - Chốt chặn đăng nhập tại `AuthServiceImpl.login()` (dòng 87-93):
    Nếu Tenant có `status != 'ACTIVE'`, từ chối đăng nhập ngay lập tức với HTTP 403 `TENANT_SUSPENDED`.
- **Frontend Hiện Tại (GAP-SA-02)**:
  - Chưa có nút bấm hoặc menu thao tác Tạm khóa / Mở khóa Tenant trên giao diện.

---

## 3. KIỂM TRA QUẢN LÝ GÓI CƯỚC SAAS & HẠN MỨC QUOTA (SUBSCRIPTIONS & QUOTA ENFORCEMENT)

### 3.1. Quản Lý & Nâng Cấp Gói Cước
- **Backend API**:
  - Endpoint: `POST /api/v1/platform/tenants/{id}/subscriptions` nhận `CreateSubscriptionRequest` (`planType`, `maxFarms`, `maxUsers`, `validFrom`, `validTo`).
  - Xử lý trong `PlatformTenantServiceImpl.addSubscription()` (dòng 192-228):
    + Tắt cờ kích hoạt của gói cũ (`UPDATE tenant_subscriptions SET is_active = FALSE WHERE tenant_id = ?`).
    + Thêm bản ghi gói cước mới (`is_active = TRUE`) với các hạn mức mới.
    + Cập nhật trường `tenants.subscription_plan`.
    + Ghi Audit Log hành động `UPGRADE_SUBSCRIPTION`.
- **Frontend Hiện Tại (GAP-SA-04)**:
  - Hoàn toàn **chưa có giao diện xem danh sách Gói dịch vụ & Hợp đồng thuê bao**.
  - Chưa có Modal Nâng cấp / Gia hạn gói cước (`UpgradeSubscriptionModal.jsx`).
  - Menu `/platform/subscriptions` chỉ trỏ về dashboard tĩnh.

### 3.2. Chốt Chặn Giới Hạn Quota Có Hiệu Lực Tức Thì
Khi Super Admin nâng cấp hạn mức trên Backend:
1. **Hạn mức Trang trại (`maxFarms`)**:
   - Khi Chủ đầu tư (`ROLE_FARM_OWNER`) tạo trang trại mới tại WS-A (`POST /api/v1/farms`), `FarmServiceImpl.createFarm()` (dòng 116-128) kiểm tra:
     `long currentFarmsCount = farmRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");`
     Nếu `currentFarmsCount >= activeSub.getMaxFarms()`, Backend lập tức quăng lỗi HTTP 403 `SUBSCRIPTION_FARM_LIMIT_EXCEEDED` kèm thông báo: *"Số lượng trang trại đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!"*.
2. **Hạn mức Người dùng (`maxUsers`)**:
   - Khi Chủ đầu tư tạo nhân sự mới tại WS-B (`POST /api/v1/users`), `UserServiceImpl.createUser()` (dòng 124-137) kiểm tra:
     `long currentUserCount = userRepository.countByTenantIdAndStatusNot(tenantId, "DELETED");`
     Nếu `currentUserCount >= activeSub.getMaxUsers()`, Backend lập tức quăng lỗi HTTP 403 `SUBSCRIPTION_USER_LIMIT_EXCEEDED` kèm thông báo: *"Số lượng người dùng đã đạt hạn mức tối đa của gói dịch vụ (%d/%d). Vui lòng nâng cấp gói!"*.
=> **Ngay khi Super Admin cập nhật `maxFarms` hoặc `maxUsers` qua API `addSubscription`, chốt chặn này có hiệu lực tức thì** đối với các thao tác của Tenant!

---

## 4. KIỂM TRA QUẢN LÝ TÀI KHOẢN CHỦ ĐẦU TƯ (TENANT OWNERS) & HỖ TRỢ KHẨN CẤP

### 4.1. Xem Danh Sách Tài Khoản Chủ Đầu Tư Của Từng Tenant
- **Backend Hiện Tại**:
  - DTO `TenantDetailResponse` (dòng 15-27 `TenantDetailResponse.java`) hiện chỉ trả về thông tin Tenant, Subscription và Usage (`totalFarms`, `totalUsers`). **Hoàn toàn KHÔNG trả về thông tin tài khoản Chủ đầu tư (Owner ID, Username, Email, Họ tên, SĐT)** của Tenant đó.
  - `PlatformTenantController` chưa có endpoint `GET /api/v1/platform/tenants/{id}/owners` hoặc `GET /api/v1/platform/tenants/{id}/users`.
  - Endpoint `GET /api/v1/users` trong `UserController.java` (dòng 28-36) có hỗ trợ Super Admin xem user toàn hệ thống, nhưng tham số tìm kiếm chỉ gồm `status`, `roleId`, `keyword` — **thiếu tham số `tenantId`** để lọc ra người dùng của 1 Tenant cụ thể!
- **Frontend Hiện Tại (GAP-SA-05)**:
  - Chưa có Drawer hoặc màn hình chi tiết Tenant để Super Admin xem danh sách các Chủ đầu tư của Tenant đó.

### 4.2. Tạo Bổ Sung Owner & Hỗ Trợ Khẩn Cấp (Khóa Tài Khoản, Reset Mật Khẩu)
- **Tạo bổ sung tài khoản `ROLE_FARM_OWNER` cho Tenant**:
  - **Lỗ hổng logic Backend nghiêm trọng (GAP-SA-05)**:
    Trong `UserServiceImpl.createUser()` (dòng 118-121):
    ```java
    Long tenantId = SecurityUtils.getCurrentTenantId();
    if (tenantId == null && !SecurityUtils.isSuperAdmin()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_TENANT", "Thiếu định danh khách thuê.");
    }
    ```
    DTO `CreateUserRequest` hiện **không có trường `tenantId`**. Khi Super Admin gọi `createUser`, `tenantId` lấy từ `SecurityUtils.getCurrentTenantId()` là `null`. Khi lưu user vào database, user mới sẽ có `tenant_id = null` và `is_super_admin = false`, dẫn đến **vi phạm ngay lập tức ràng buộc cơ sở dữ liệu `chk_users_super_admin_tenant`** và báo lỗi SQL Error!
    => Super Admin hiện chưa có cơ chế sanctioned để tạo bổ sung tài khoản nhân sự/Owner cho một Tenant cụ thể sau khi đã tạo Tenant.
- **Hỗ trợ khẩn cấp: Khóa / Mở khóa tài khoản Owner & Reset Mật khẩu**:
  - **Backend**:
    + `PUT /api/v1/users/{id}/status`: Cho phép Super Admin cập nhật trạng thái `ACTIVE` / `LOCKED` / `INACTIVE` cho bất kỳ user nào trong hệ thống.
    + `POST /api/v1/users/{id}/reset-password`: `UserServiceImpl.resetPassword()` (dòng 478-525) cho phép Super Admin đặt lại mật khẩu cho bất kỳ user nào. Hệ thống thiết lập mật khẩu tạm thời, bật cờ `mustChangePassword = true`, thu hồi toàn bộ refresh token cũ và ghi Audit Log.
  - **Frontend Hiện Tại (GAP-SA-05)**:
    + `PlatformShell` hoàn toàn **không có menu "Người Dùng Nền Tảng" (Platform Users)**.
    + Super Admin không có màn hình tra cứu danh sách người dùng toàn nền tảng, không có nút Reset Mật Khẩu hay Khóa tài khoản từ giao diện web.

---

## 5. KIỂM TRA DASHBOARD TOÀN NỀN TẢNG, NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) & THÔNG BÁO HỆ THỐNG

### 5.1. Bảng Điều Khiển Tổng Quan Nền Tảng (Platform Executive Dashboard)
- **Thực trạng Frontend (`PlatformDashboardPage.jsx`, dòng 9-14 - GAP-SA-07)**:
  - Các chỉ số trên Dashboard hiện tại là **100% số liệu giả gán cứng (hardcoded mock data)**:
    ```javascript
    const metrics = [
      { label: 'Tổng Số Khách Thuê (Tenants)', value: '12 Doanh nghiệp' ... },
      { label: 'Gói Dịch Vụ Đang Kích Hoạt', value: '18 Hợp đồng' ... },
      { label: 'Tổng Tài Khoản Đang Hoạt Động', value: '348 Người dùng' ... },
      { label: 'Trạng Thái Máy Chủ MySQL 72 Bảng', value: 'Ổn định (Healthy)' ... },
    ];
    ```
  - Hoàn toàn chưa có API kết nối để lấy dữ liệu thực từ Backend.
- **Thực trạng Backend**:
  - Backend chưa có API `GET /api/v1/platform/metrics` hoặc `GET /api/v1/platform/dashboard-stats` để tính toán tổng số Tenant (Active/Suspended), tổng số Trang trại, tổng số User, phân bổ gói cước và trạng thái tài nguyên.

### 5.2. Nhật Ký Kiểm Toán Hệ Thống (System Audit Logs — Bảng `audit_logs`)
- **Backend API (`AuditLogController.java` & `AuditLogQueryServiceImpl.java`)**:
  - Endpoint: `GET /api/v1/system/audit-logs`
  - Hoạt động: Khi Super Admin gọi (`tenantId == null`), `AuditLogQueryServiceImpl.java` (dòng 61-63) không gán điều kiện lọc `tenantId`, do đó **trả về toàn bộ lịch sử thao tác bất biến của tất cả các khách thuê trên toàn nền tảng (Global Audit Trail)**! Hỗ trợ lọc theo `module`, `action`, `userId`, `fromDate`, `toDate`.
- **Lỗ hổng Lệch Endpoint & Thiếu Giao Diện (GAP-SA-06)**:
  - Trong `frontend/src/services/api/endpoints.js` (dòng 29):
    Khai báo `PLATFORM: { AUDIT_LOGS: '/platform/audit-logs' }`. Backend không có controller nào map `/platform/audit-logs` (Backend dùng `/system/audit-logs`), do đó nếu gọi theo endpoint này sẽ gặp **HTTP 404 Not Found**!
  - Menu `/platform/audit-logs` trên Sidebar hiện chỉ trỏ về `PlatformDashboardPage` tĩnh, chưa có màn hình bảng tra cứu Audit Logs và xem JSON diff thay đổi dữ liệu.

### 5.3. Thông Báo Hệ Thống (System Broadcast Notification) & Chuông Thông Báo Của Super Admin
1. **Kiểm tra API Chuông Thông Báo khi `tenant_id = NULL`**:
   - Trong `NotificationController.java` (dòng 32) và `NotificationServiceImpl.java` (dòng 46-58):
     `getUserNotifications()` chỉ truy vấn theo `currentUserId` (`notificationRepository.findByUserId(userId, pageable)`). Nó **hoàn toàn không bắt buộc hay kiểm tra `tenantId`**.
     => Khi tài khoản `admin` đăng nhập, gọi API `GET /api/v1/notifications` **KHÔNG bị lỗi HTTP 400 hay 500**.
   - Tuy nhiên, trên giao diện `PlatformShell` hiện tại **không có thanh Header phía trên và không có chuông thông báo (Bell Icon)**.
2. **Chức năng Phát Thông Báo Hệ Thống Diện Rộng (Broadcast Notification - GAP-SA-08)**:
   - **Backend**: Hoàn toàn **chưa có API** cho phép Super Admin gửi thông báo hệ thống hàng loạt (`POST /api/v1/platform/notifications/broadcast`) tới các Chủ đầu tư (`ROLE_FARM_OWNER`) của một hoặc tất cả các Tenant (ví dụ: thông báo bảo trì máy chủ, thông báo nhắc gia hạn gói cước).
   - **Frontend**: Chưa có giao diện soạn thảo và gửi thông báo hệ thống.

---

## 6. TỔNG HỢP MA TRẬN LỖ HỔNG (GAP MATRIX)

| Mã Lỗ Hổng | Tên Lỗ Hổng & Mô Tả Chi Tiết | File Backend & Dòng Code | File Frontend & Dòng Code | Mức Độ |
| :--- | :--- | :--- | :--- | :---: |
| **GAP-SA-01** | **Sub-routes Platform trỏ chung 1 trang tĩnh**<br>Cả 4 menu trên Sidebar (`tenants`, `subscriptions`, `audit-logs`, `health`) đều render cùng 1 trang placeholder `PlatformDashboardPage`. | *(Backend đã có đầy đủ API)* | `frontend/src/app/routes.jsx`<br>(dòng 112-118) | **CRITICAL** |
| **GAP-SA-02** | **Thiếu Giao diện Bảng Quản trị Khách thuê (Tenants Console)**<br>Không có bảng hiển thị danh sách Tenants, không có tìm kiếm, lọc trạng thái, hiển thị tỷ lệ hạn mức (`currentFarms/maxFarms`, `currentUsers/maxUsers`) và nút Tạm khóa/Mở khóa. | `PlatformTenantController.java`<br>`PlatformTenantServiceImpl.java` | `frontend/src/pages/platform/index.jsx`<br>(dòng 45-51) | **CRITICAL** |
| **GAP-SA-03** | **Thiếu Modal Khởi tạo Khách thuê mới + Tài khoản Owner**<br>Nút "+ Khởi Tạo Khách Thuê Mới" trên UI không có `onClick`, chưa có form nhập thông tin Tenant, gói cước và thông tin Chủ đầu tư ban đầu. | `PlatformTenantServiceImpl.java`<br>(dòng 55-138 `createTenant`) | `frontend/src/pages/platform/index.jsx`<br>(dòng 28-30) | **HIGH** |
| **GAP-SA-04** | **Thiếu Giao diện & Modal Nâng cấp / Gia hạn Gói cước (Subscriptions)**<br>Super Admin không có giao diện xem danh sách hợp đồng gói cước và không có Modal nâng cấp (`addSubscription`) để tăng `maxFarms`, `maxUsers` hoặc gia hạn ngày kết thúc. | `PlatformTenantServiceImpl.java`<br>(dòng 192-228 `addSubscription`) | `frontend/src/pages/platform/index.jsx`<br>`frontend/src/shells/PlatformShell/index.jsx` | **HIGH** |
| **GAP-SA-05** | **Thiếu Quản trị Người dùng Toàn Nền tảng & Lỗi Tạo User của Super Admin**<br>1. `PlatformShell` thiếu menu Platform Users.<br>2. `CreateUserRequest` thiếu `tenantId` khiến Super Admin không thể tạo user cho 1 Tenant mà không vi phạm DB constraint.<br>3. `TenantDetailResponse` thiếu thông tin Owner. | `UserServiceImpl.java` (dòng 118-121)<br>`TenantDetailResponse.java` (dòng 15-27) | `frontend/src/shells/PlatformShell/index.jsx`<br>(dòng 20-45) | **HIGH** |
| **GAP-SA-06** | **Lệch Endpoint & Thiếu Giao diện Tra cứu Audit Logs Toàn Cầu**<br>`endpoints.js` khai báo sai `/platform/audit-logs` (gây 404). Thiếu bảng tra cứu lịch sử kiểm toán bất biến toàn cầu (lọc Module, Action, Ngày, User, JSON diff viewer). | `AuditLogController.java` (dòng 23)<br>`AuditLogQueryServiceImpl.java` | `frontend/src/services/api/endpoints.js` (dòng 29)<br>`frontend/src/pages/platform/index.jsx` | **MEDIUM** |
| **GAP-SA-07** | **Thiếu API & Dashboard Giám sát Sức khỏe Hạ tầng Thực tế**<br>Dashboard đang hiển thị 100% số liệu giả gán cứng. Backend thiếu API tổng hợp số liệu thực tế (JVM Memory, Connection Pool HikariCP, Uptime, Tổng số Tenant/Farm/User). | `backend/src/main/resources/application.yml`<br>(chỉ có `/actuator/health` cơ bản) | `frontend/src/pages/platform/index.jsx`<br>(dòng 9-14) | **MEDIUM** |
| **GAP-SA-08** | **Thiếu Tính năng Phát Thông Báo Hệ Thống Diện Rộng (Broadcast)**<br>Chưa có API và giao diện cho Super Admin phát thông báo bảo trì/gia hạn tới Chủ đầu tư của các Tenant. `PlatformShell` thiếu chuông thông báo (Bell Icon). | `NotificationController.java`<br>`NotificationServiceImpl.java` | `frontend/src/shells/PlatformShell/index.jsx` | **LOW** |

---

## 7. ĐỀ XUẤT LỘ TRÌNH THỰC THI (ACTIONABLE ROADMAP)

Để giải quyết triệt để 8 mã lỗ hổng trên, đảm bảo vai trò `ROLE_SUPER_ADMIN` và phân hệ SaaS Control Plane đạt chuẩn Enterprise 100%, đề xuất chia làm **2 Task thực thi chuẩn mực**:

### TASK 1 / 2: XÂY DỰNG PLATFORM SERVICE, BÀN LÀM VIỆC SAAS DASHBOARD & QUẢN TRỊ KHÁCH THUÊ / GÓI CƯỚC (GAP-SA-01, GAP-SA-02, GAP-SA-03, GAP-SA-04, GAP-SA-07)
1. **Frontend Platform Service (`platformService.js`)**:
   - Tạo file `frontend/src/services/modules/platformService.js` bao gồm đầy đủ các hàm: `getTenants`, `getTenantById`, `createTenant`, `updateTenantStatus`, `addSubscription`, `getPlatformMetrics`, `getAuditLogs`.
   - Sửa lỗi lệch endpoint trong `frontend/src/services/api/endpoints.js`: Sửa `PLATFORM.AUDIT_LOGS` thành `'/system/audit-logs'`.
2. **Backend Platform Metrics Controller (`PlatformMetricsController.java`)**:
   - Xây dựng endpoint `GET /api/v1/platform/metrics` phân quyền `hasAuthority('PERM_TENANT_MANAGE')`.
   - Trả về thống kê thực tế từ DB & JVM: Tổng số Tenant (Active, Suspended), Tổng số Farms, Tổng số Users, Phân bổ theo Plan, Dung lượng JVM Heap, Trạng thái HikariCP, Server Uptime.
3. **Màn Hình Quản Trị Khách Thuê (`TenantsManagementPage.jsx` hoặc tích hợp vào `PlatformDashboardPage.jsx`)**:
   - Bảng danh sách Tenants chuyên nghiệp: Mã, Tên doanh nghiệp, Subdomain, Gói dịch vụ, Tỷ lệ hạn mức trang trại (`currentFarms / maxFarms`), Tỷ lệ hạn mức người dùng (`currentUsers / maxUsers`), Trạng thái (`ACTIVE` / `SUSPENDED`), Ngày hết hạn & Số ngày còn lại.
   - Bộ lọc trạng thái (Tất cả, Đang hoạt động, Tạm khóa) và ô tìm kiếm theo tên/mã/subdomain.
   - Thao tác nhanh: Nút Tạm khóa (`SUSPENDED`) / Mở khóa (`ACTIVE`) gọi API `updateTenantStatus`.
4. **Modal Khởi Tạo Khách Thuê Mới (`CreateTenantModal.jsx`)**:
   - Form nhập liệu chuẩn: Mã tenant, Tên doanh nghiệp, Subdomain.
   - Chọn Gói dịch vụ (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`), tự động gợi ý `maxFarms`, `maxUsers`, thời hạn hiệu lực.
   - Nhập thông tin Chủ đầu tư ban đầu: Email, Họ tên, Mật khẩu khởi tạo.
   - Gọi API `POST /api/v1/platform/tenants`.
5. **Modal Nâng Cấp & Gia Hạn Gói Cước (`UpgradeSubscriptionModal.jsx`)**:
   - Cho phép chọn gói mới, điều chỉnh `maxFarms`, `maxUsers`, gia hạn ngày kết thúc và áp dụng ngay lập tức cho Tenant qua API `POST /api/v1/platform/tenants/{id}/subscriptions`.
6. **Cập nhật Executive Metrics Dashboard**:
   - Thay thế toàn bộ số liệu gán cứng bằng dữ liệu thực lấy từ `GET /api/v1/platform/metrics`.

---

### TASK 2 / 2: QUẢN TRỊ NGƯỜI DÙNG TOÀN NỀN TẢNG, SỔ CÁI AUDIT LOGS TOÀN CẦU, BROADCAST THÔNG BÁO & KIỂM THỬ E2E (GAP-SA-05, GAP-SA-06, GAP-SA-08)
1. **Nâng Cấp Backend Cho Quản Trị Người Dùng Toàn Nền Tảng**:
   - Bổ sung `ownerInfo` vào `TenantDetailResponse` để Super Admin biết ai là Owner của Tenant.
   - Cho phép Super Admin tạo bổ sung user/owner cho một Tenant cụ thể (hỗ trợ `tenantId` trong request khi caller là Super Admin).
   - Thêm tham số `@RequestParam(required = false) Long tenantId` vào `UserController.getUsers` để lọc danh sách nhân sự theo từng Tenant.
2. **Màn Hình Quản Trị Người Dùng Toàn Nền Tảng (`PlatformUsersPage.jsx`)**:
   - Bổ sung menu "Người Dùng Nền Tảng" vào `PLATFORM_NAV` trong `PlatformShell`.
   - Bảng danh sách tài khoản toàn hệ thống: Hiển thị Tenant, Username, Email, Họ tên, Vai trò, Trạng thái.
   - Nút Reset Mật Khẩu (sinh mật khẩu tạm thời và bật `mustChangePassword`).
   - Nút Khóa / Mở khóa tài khoản (`LOCKED` / `ACTIVE`).
3. **Màn Hình Tra Cứu Sổ Cái Kiểm Toán Bất Biến Toàn Cầu (`PlatformAuditLogsPage.jsx`)**:
   - Kết nối `GET /api/v1/system/audit-logs`.
   - Bộ lọc theo Module, Loại hành động, Người thực hiện, Khoảng ngày.
   - Bảng hiển thị lịch sử thao tác kèm Drawer xem chi tiết dữ liệu JSON Diff (trước và sau thay đổi).
4. **Hệ Thống Thông Báo Diện Rộng (Broadcast Notification)**:
   - Backend: Tạo endpoint `POST /api/v1/platform/notifications/broadcast` để Super Admin gửi thông báo bảo trì/thông báo chung tới toàn bộ Chủ đầu tư.
   - Frontend: Thêm chuông thông báo (Bell icon) trên thanh điều hướng của `PlatformShell`.
5. **Cập Nhật Routes & Layout**:
   - Tách rời các route trong `routes.jsx` trỏ tới các trang component chuyên biệt.
6. **Kiểm Thử Tích Hợp Toàn Diện (End-to-End Verification)**:
   - Xây dựng `RoleSuperAdminWorkflowIntegrationTest.java` trên Backend.
   - Xây dựng `SuperAdminPlatformUiFlow.test.jsx` trên Frontend.
   - Đảm bảo 100% tests PASS và `npm run build` thành công.
