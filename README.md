# Farm SaaS — Hệ Thống Quản Lý Đa Trang Trại (Multi-Tenant Farm Management)

Nền tảng SaaS số hóa nông nghiệp toàn diện cho doanh nghiệp và hợp tác xã nông nghiệp đa trang trại, áp dụng kiến trúc **Modular Monolith** kết hợp Java Spring Boot 3, MySQL 8 và ReactJS + Vite.

---

## 1. Kiến Trúc Kỹ Thuật Tổng Thể

| Thành phần | Công nghệ | Phiên bản | Vai trò & Đặc tính |
|---|---|---|---|
| **Backend** | Java / Spring Boot | Java 21 LTS, Spring Boot 3.3.4 | Modular Monolith REST API, Spring Data JPA, Spring Security 6, JJWT 0.12.6, Actuator, SpringDoc OpenAPI. |
| **Cơ sở dữ liệu** | MySQL Server | 8.0.x (InnoDB, `utf8mb4_unicode_ci`) | 71 bảng nghiệp vụ (70 core + notifications), khóa ngoại composite, index tối ưu hóa. |
| **Database Migration** | Flyway | 10.x (`flyway-mysql`) | Quản lý schema tự động: `V1_0__init_system_core.sql` (baseline) và `V1_1__init_system_core.sql` (Notifications & RBAC Patch). |
| **Frontend** | ReactJS + Vite | React 18, Vite 5, JavaScript | Single Page Application (SPA), TailwindCSS, Zustand state, Axios HTTP client, Lucide Icons. |
| **Tài liệu chuẩn** | Markdown / DOCX / SQL | Single Source of Truth | Lưu trữ tại `.antigravity/rules/` (DECISION_LOG.md, architecture-rules.md, v.v.). |

---

## 2. Cấu Trúc Dự Án (Project Skeleton)

```text
Farm_Management/
├── .antigravity/rules/                 # Thư mục tài liệu quy chuẩn duy nhất (Single Source of Truth)
│   ├── V1_0__init_system_core.sql       # Schema SQL baseline 70 bảng & dữ liệu seed gốc
│   ├── DECISION_LOG.md                 # Nhật ký quyết định kiến trúc & ranh giới bảo mật (CONFIRMED)
│   ├── architecture-rules.md           # Quy tắc kiến trúc Modular Monolith
│   ├── roles-permissions.md            # Quy tắc vai trò & phân quyền RBAC
│   ├── security-rules.md               # Quy tắc bảo mật, tenant isolation & JWT
│   └── ...                             # Các tài liệu đặc tả nghiệp vụ, UI/UX, code quality
│
├── backend/                            # Mã nguồn Backend (Java 21 + Spring Boot 3.3.4)
│   ├── pom.xml                         # Cấu hình Maven: Spring Web, JPA, Security, JJWT, Flyway, MySQL
│   ├── .env.example                    # File mẫu biến môi trường kết nối CSDL và JWT
│   └── src/
│       ├── main/
│       │   ├── java/com/farm/saas/
│       │   │   ├── FarmSaasApplication.java
│       │   │   ├── config/             # SecurityConfig (JWT Stateless), CorsConfig, OpenApiConfig
│       │   │   ├── security/           # JWT Provider, Auth Filter, RBAC & Scopes (DEC-01, DEC-05)
│       │   │   ├── common/             # ApiResponse, ErrorResponse, GlobalExceptionHandler, Correlation ID
│       │   │   ├── platform/           # tenant, subscription, enterprise
│       │   │   ├── modules/            # 11 phân hệ nghiệp vụ:
│       │   │   │   ├── organization/   # Farms, Production Zones, Zone Locations
│       │   │   │   ├── crop/           # Crop Varieties, Crop Seasons, Farming Logs
│       │   │   │   ├── livestock/      # Breeds, Groups, RFID Animals, Vet Events
│       │   │   │   ├── inventory/      # Warehouses, Batches, Receipts, Issues, Stock Ledger FIFO/FEFO
│       │   │   │   ├── harvest/        # Harvest Records, Product Batches
│       │   │   │   ├── quality/        # QC Inspections (Maker-Checker DEC-02), QR Traceability
│       │   │   │   ├── hr/             # Employees, Shifts, Attendance GPS (Bảo mật DEC-03)
│       │   │   │   ├── tasks/          # Field Tasks Kanban
│       │   │   │   ├── finance/        # Expenses, Sales Orders, Deliveries, Debt & Payments (DEC-06)
│       │   │   │   ├── reporting/      # Dashboards & Metrics
│       │   │   │   └── notification/   # In-app Notifications (DEC-04) - Entity & Repository
│       │   │   ├── audit/              # Audit Logs
│       │   │   └── integration/        # External Services (Storage, Mail, Webhooks)
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── db/migration/
│       │           ├── V1_0__init_system_core.sql # Baseline 70 bảng nghiệp vụ
│       │           └── V1_1__init_system_core.sql # Bảng notifications & RBAC Patch
│       └── test/                       # Test suite xác thực Spring Boot context, Flyway & 71 bảng
│
├── frontend/                           # Mã nguồn Frontend (React 18 + Vite 5 + TailwindCSS)
│   ├── package.json                    # Cấu hình dependencies: React Router, Zustand, Axios, Tailwind
│   ├── vite.config.js                  # Proxy /api, /actuator, /v3/api-docs sang backend :8080
│   ├── tailwind.config.js              # Hệ thống Design Tokens & màu sắc nông nghiệp
│   ├── .env.example                    # File mẫu biến môi trường frontend
│   └── src/
│       ├── components/                 # UI, Shared (Header, Sidebar), Forms, Tables, Charts
│       ├── layouts/                    # AppLayout, AuthLayout, PlatformLayout, ErrorLayout
│       ├── pages/                      # Dashboard, 404 và các trang phân hệ nghiệp vụ
│       ├── routes/                     # Cấu hình React Router DOM
│       ├── services/                   # Axios API clients (auth, crop, livestock, notifications,...)
│       ├── store/                      # Zustand stores (UI, Auth, Tenant scope)
│       ├── hooks/                      # Custom hooks
│       ├── permissions/                # Permission checks & Route guards
│       └── utils/                      # Helper formatters
│
├── docker-compose.yml                  # MySQL 8.0 container (Port 3309)
├── .env.example                        # Template biến môi trường toàn dự án
├── .gitignore                          # Quy tắc loại trừ secrets (.env), build artifacts, node_modules
└── README.md                           # Hướng dẫn kỹ thuật và vận hành dự án
```

---

## 3. Database Migration V1.1 (Notifications & RBAC Patch)

File migration `backend/src/main/resources/db/migration/V1_1__init_system_core.sql` thực thi các nội dung:

### A. Module Notifications (Phase 1 MVP Scope - DEC-04)
* Tạo bảng `notifications` lưu trữ thông báo in-app đa cấp:
  * Khóa chính `id` BIGINT AUTO_INCREMENT
  * `tenant_id` (FK tới `tenants.id`, CASCADE), `user_id` (FK tới `users.id`, CASCADE)
  * `title`, `message`, `type` (INFO, WARNING, ALERT, TASK, QC, SYSTEM)
  * Trạng thái đọc: `is_read`, `read_at`
  * Liên kết nghiệp vụ: `reference_type`, `reference_id`, `action_url`
  * Index tối ưu hóa truy vấn danh sách chưa đọc: `idx_notifications_user_read (user_id, is_read, created_at)`

### B. Cập nhật phân quyền RBAC Patch (DEC-01, DEC-02, DEC-03)
* **DEC-01:** Gán `PERM_TENANT_MANAGE` cho `ROLE_SUPER_ADMIN` (phân quyền quản trị nền tảng chính thức qua RBAC).
* **DEC-02:** Áp dụng nguyên tắc **Maker-Checker**:
  * Gỡ `PERM_QC_APPROVE` và `PERM_QC_RECALL` khỏi `ROLE_TECHNICAL_STAFF` (chỉ giữ quyền kiểm định `PERM_QC_INSPECT`).
  * Gán `PERM_QC_APPROVE` và `PERM_QC_RECALL` cho `ROLE_FARM_OWNER` (phê duyệt và phát lệnh thu hồi).
* **DEC-03:** Gỡ `PERM_HR_ATTENDANCE` khỏi `ROLE_WAREHOUSE_STAFF` và `ROLE_ACCOUNTANT` (bảo vệ dữ liệu chấm công nhạy cảm).

---

## 4. Hướng Dẫn Cài Đặt & Chạy Dự Án

### 4.1. Khởi động Cơ sở dữ liệu MySQL bằng Docker Compose

Dự án cung cấp sẵn cấu hình Docker Compose chạy MySQL 8.0:

```bash
# 1. Tạo file .env từ template mẫu
cp .env.example .env

# 2. Khởi chạy MySQL container ngầm (Port 3309:3306)
docker compose up -d

# 3. Kiểm tra container đang chạy
docker compose ps
```

Hoặc nếu dùng MySQL cục bộ, hãy tạo database:
```sql
CREATE DATABASE farm_saas_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 4.2. Khởi động Backend (Spring Boot)

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Thiết lập biến môi trường (nếu không dùng file `.env`):
   * **Windows PowerShell:**
     ```powershell
     $env:DB_URL="jdbc:mysql://localhost:3309/farm_saas_dev?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC"
     $env:DB_USERNAME="root"
     $env:DB_PASSWORD="your_secure_mysql_root_password"
     ```
3. Chạy biên dịch và kiểm thử tự động (Flyway tự động migrate V1.0 và V1.1):
   ```bash
   mvn clean test
   ```
4. Khởi chạy Backend Application:
   ```bash
   mvn spring-boot:run
   ```
5. Kiểm tra các endpoints quan trọng:
   * **Actuator Health:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) -> `{"status":"UP"}`
   * **Swagger UI API Docs:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   * **System Info API:** [http://localhost:8080/api/v1/system/info](http://localhost:8080/api/v1/system/info)
   * **OpenAPI JSON Spec:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

### 4.3. Khởi động Frontend (React + Vite)

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện (nếu chưa cài):
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện ứng dụng tại:
   * **Web App URL:** [http://localhost:5173](http://localhost:5173)
   * Dashboard tự động gọi API `/api/v1/system/info` và hiển thị trạng thái kết nối Backend & MySQL theo thời gian thực.
5. Kiểm tra đóng gói build:
   ```bash
   npm run build
   ```

---

## 5. Hiện Trạng & Lộ Trình Triển Khai (Roadmap)

* [x] **Giai đoạn 0:** Khảo sát, rà soát 10 tài liệu quy chuẩn, Decision Log DEC-01..DEC-06, đối chiếu SQL schema baseline.
* [x] **Giai đoạn 1 (Technical Skeleton & Database Migration V1.1):**
  * **Database Migration V1.1:** Bảng `notifications` (DEC-04) và RBAC Patch (DEC-01, DEC-02, DEC-03). Tổng số bảng: 71.
  * **Backend Skeleton:** Java 21 LTS + Spring Boot 3.3.4, Spring Security 6.x, JJWT 0.12.6 (Stateless Bearer Access JWT Provider & Filter), HikariCP, Flyway MySQL, OpenAPI Swagger UI, Correlation ID, Global Exception Handler, ApiResponse. Đã cấu trúc chuẩn 11 modules nghiệp vụ và platform.
  * **Frontend Skeleton:** React 18 + Vite 5 + TailwindCSS + Zustand + React Router DOM 6 + Axios + Lucide Icons. Layouts & Dashboard page, build production thành công.
  * **Cấu hình chung:** `.env.example` toàn dự án và backend, `.gitignore` bảo vệ secrets, `README.md` tài liệu hóa chi tiết.
* [ ] **Giai đoạn 2 (Auth & RBAC Service):** Đăng nhập, JWT Bearer tokens, HttpOnly Cookie Refresh Token (DEC-05), Token revocation blacklist, phân quyền 6 roles & scope guards.
* [ ] **Giai đoạn 3 (Tổ chức & Danh mục):** Quản lý Tenant, Enterprise, Farm, Zone, Nhà màng, Đơn vị tính và Vật tư nông nghiệp.
* [ ] **Giai đoạn 4–8:** Trồng trọt, Chăn nuôi RFID, Quản lý kho FIFO/FEFO, Thu hoạch & QC truy xuất QR code (Maker-Checker), Nhân sự & Tài chính nông trại B2B.
