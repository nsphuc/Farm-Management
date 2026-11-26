# Báo Cáo Kiểm Thử Vòng Đời SaaS Khách Hàng Mới & Khóa Gói Add-on (Đợt C — SaaS Lifecycle & Feature Gating)

- **Ngày thực hiện**: 2026-11-26
- **Tài khoản test tạo mới qua `/register`**: `Nguyễn Test SaaS` (`0999888777` / `test_saas_c1@gmail.com` / `TestSaas123`) → `userId: 11`, `tenantId: 2`, `farmId: 2`, `branchId: 3` (`CN-CHINH` - `Chi nhánh chính`).
- **Phạm vi kiểm thử**:
  - **C1**: Đăng ký tài khoản mới + OTP Email + Onboarding + Kiểm tra Empty State toàn hệ thống.
  - **C2**: Feature Gating (kiểm tra Sidebar, nhập URL trực tiếp & gọi API trực tiếp khi chưa mua gói Add-on).
  - **C3**: Mua gói Add-on (`BREEDING`) qua VNPAY Sandbox + Webhook IPN → xác minh mở khóa tức thời.

---

## 1. Tóm tắt Kết quả

| Hạng mục | Kết quả | Mức độ | Lỗi phát hiện |
|---|---|---|---|
| **C1.1 Đăng ký & OTP Email** | **PASS** | — | Đăng ký thành công tạo `tenantId=2`, `farmId=2`, `branchId=3`. |
| **C1.2 Đồng bộ `farmId` / `branchId` mới** | **FAIL** | **CRITICAL** (`SAAS-01`) | Frontend mặc định `farmId=1`, `branchId=1` thay vì `farmId=2`, `branchId=3` của user mới → hàng loạt `403 Access Denied` và `404 /enterprise/profile`. |
| **C1.3 Empty State sạch (không mock data)** | **FAIL** | **HIGH** (`SAAS-02`) | `Dashboard`, `Inventory`, `Cashbook`, `Workforce`, `Branches`, `GeneralSettings` vẫn hiển thị dữ liệu mẫu cứng khi trang trại mới hoàn toàn trống. |
| **C2.1 Sidebar ẩn Add-on chưa mua** | **PASS** | — | Cả 6 Add-on chưa mua đều được ẩn khỏi Sidebar. |
| **C2.2 Chặn URL trực tiếp Add-on chưa mua** | **FAIL** | **HIGH** (`SAAS-03`) | Nhập URL trực tiếp cả 6 route Add-on đều mở được giao diện + hiện badge `"ADD-ON ACTIVE"` (thiếu `<AddonGuard>`). |
| **C2.3 Chặn API Backend Add-on chưa mua** | **FAIL** | **CRITICAL** (`SAAS-04`) | `AddonsOperationsServiceImpl` cố tự động `INSERT INTO farm_add_on_subscriptions` ngay trong hàm `GET` (read-only) khiến crash **`500 Connection is read-only`** thay vì chặn **`403`**. |
| **C3 Mua gói VNPAY Sandbox & Mở khóa tức thời** | **PASS** | — | Mua `BREEDING` + Simulate Webhook IPN → Sidebar hiện ngay `Gia súc sinh sản` & API `/addons/breeding/summary` trả `200 OK` không cần đăng nhập lại. |

---

## 2. Chi tiết 4 Lỗi Phát Hiện (`SAAS-01` – `SAAS-04`)

### 2.1. `SAAS-01` [CRITICAL] — Store `useActiveFarmStore` / `useActiveBranchStore` mặc định sai sang `farmId=1, branchId=1`
- **Tái hiện**: Đăng ký tài khoản mới (`0999888777`) → được cấp `farmId=2, branchId=3`, nhưng sau khi vào `/app/dashboard`, Frontend vẫn giữ `activeFarmId=1` và `currentBranchId=1`.
- **Hệ quả**: Toàn bộ request `/api/v1/farms/1/warehouses`, `/dashboard/summary`, `/sales`, `/cashbook`, `/barns?farmId=1`, `/settings/members?farmId=1` đều bị Backend chặn **`403 Access Denied`** (vì user thuộc Farm 2!). Ngoài ra `GET /api/v1/enterprise/profile` trả `404`.
- **Kỳ vọng**: Ngay khi `login` / `register` / `getMe`, `useActiveFarmStore` và `useActiveBranchStore` phải reset & đồng bộ theo `userInfo.accessibleFarms[0].farmId` (`2`) và `userInfo.branches[0].id` (`3`).

### 2.2. `SAAS-02` [HIGH] — Dữ liệu mẫu cứng (Mock Data) rò rỉ vào Empty State khách hàng mới
- `/app/dashboard`: `3.250 kg`, `1.190 kg`, `800M`, `30.1%`, 4 cảnh báo giả (`Gumboro`, `Chuồng B1`, `Tuấn Béo 35tr`), 6 hoạt động giả (`Nguyễn Văn Nam`, `Trần Văn Cường`).
- `/app/inventory`: Hiện 8 vật tư mẫu (`101.165.000 VNĐ`, 4 kho mẫu) khi trang trại chưa có kho nào.
- `/app/cashbook`: Hiện `TỒN QUỸ ĐẦU KỲ: 230.000.000 ₫` (`45M + 185M`) dù là trang trại mới tinh.
- `/app/workforce`: Hiện `0 người cố định + 2 tổ thời vụ` dù danh sách Tab 2 là `(0)`.
- `/app/branches`: Hiện dữ liệu mẫu `4 / 6 chuồng`, `24.000 con gà thịt`, `Trần Văn Quản`, `FCR 1.62`.
- `/app/general-settings`: Form & thẻ quota hiện cứng `Trang trại Hòa Bình`, `3 / 5 tài khoản`, `5 / 8 chuồng`.

### 2.3. `SAAS-03` [HIGH] — Thiếu `<AddonGuard>` chặn truy cập URL trực tiếp cho 6 Add-on chưa mua
- Nhập trực tiếp URL `/app/payroll-kpi`, `/app/custom-roles`, `/app/breeding-livestock`, `/app/hatchery`, `/app/feed-production`, `/app/branches` trên trình duyệt của Farm 2 (khi chưa mua gói nào) vẫn vào thẳng trang và hiện badge `"ADD-ON ACTIVE"` (`SAAS-C2-addon-url-bypass-before-buy.png`).

### 2.4. `SAAS-04` [CRITICAL] — Backend `AddonsOperationsServiceImpl` cố tự `INSERT` subscription trong hàm `GET` gây `500`
- Gọi API `/api/v1/addons/payroll/sheets?farmId=2`, `/custom-roles?farmId=2`, `/hatchery/*?farmId=2`, `/feed-production/orders?farmId=2` khi chưa mua gói đều trả **`500 Internal Server Error`**:
  > `Connection is read-only. Queries leading to data modification are not allowed [insert into farm_add_on_subscriptions ...]`
- **Nguyên nhân gốc**: Thay vì kiểm tra gói `farm_add_on_subscriptions` có `status = 'ACTIVE'` hay chưa và ném `403` (`ADDON_NOT_SUBSCRIBED`), service lại gọi helper tự chèn bản ghi kích hoạt Add-on ngay trong hàm `GET` `@Transactional(readOnly = true)`.

---

## 3. Ảnh Minh Chứng (`docs/testing/saas-lifecycle-test/screenshots/`)
- `SAAS-C1-new-tenant-empty-dashboard.png`: Trang chủ tài khoản mới `0999888777` bị lỗi `403` do lệch `farmId=1` & hiện số liệu giả.
- `SAAS-C2-addon-url-bypass-before-buy.png`: Truy cập trực tiếp `/app/payroll-kpi` khi chưa mua gói vẫn vào được trang + hiện `ADD-ON ACTIVE`.
- `SAAS-C3-vnpay-unlock-instant.png`: Sau khi mua `BREEDING` & Simulate Webhook IPN, Sidebar mở khóa ngay mục `Gia súc sinh sản` không cần đăng nhập lại.


---

## 4. Kết quả Kiểm thử Hồi quy Sau Khắc phục (`SAAS-01` – `SAAS-04` — 2026-11-26)

| Hạng mục | Kết quả | Bằng chứng kiểm chứng thực tế |
|---|---|---|
| **`SAAS-01` (Đồng bộ `farmId=2`, `branchId=3`)** | **PASS** | `0999888777` đăng nhập thấy ngay `Trang trại Nguyễn Test SaaS` & `Chi nhánh chính`; không còn lỗi gọi nhầm `/farms/1/...` bị `403` trên Dashboard, Kho, Sổ quỹ, Nhân công. |
| **`SAAS-02` (Empty State sạch)** | **PASS** | Dashboard (`0M`, không mock alerts/activities), Inventory (`0` vật tư), Cashbook (`Tồn quỹ đầu kỳ: 0 ₫`, `Số dư: 0 ₫`), Workforce (`0 người cố định + 0 tổ thời vụ`). (`SAAS-REG-01`, `SAAS-REG-03`) |
| **`SAAS-03` (Khóa URL Add-on chưa mua)** | **PASS** | Truy cập trực tiếp `/app/payroll-kpi`, `/app/hatchery`, `/app/branches` đều bị `<PermissionGuard>` chặn với màn hình `"Gói dịch vụ mở rộng chưa kích hoạt"`; `/app/breeding-livestock` (đã mua) mở bình thường. (`SAAS-REG-02`) |
| **`SAAS-04` (Chặn API Add-on chưa mua)** | **PASS** | `PAYROLL`, `CUSTOM_ROLES`, `POULTRY_HATCHERY`, `FEED_MILL` đều trả **`403 ADDON_NOT_SUBSCRIBED`**; `BREEDING` (đã mua) trả **`200 OK`**. |
