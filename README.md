# Farm SaaS — Hệ Thống Quản Lý Đa Trang Trại (Multi-Tenant Farm Management)

Nền tảng SaaS số hóa nông nghiệp toàn diện cho doanh nghiệp và hợp tác xã nông nghiệp đa trang trại, áp dụng kiến trúc **Modular Monolith** kết hợp Java Spring Boot 3, MySQL 8 và ReactJS + Vite.

---

## 1. Kiến Trúc Kỹ Thuật Tổng Thể

| Thành phần | Công nghệ | Phiên bản | Vai trò & Đặc tính |
|---|---|---|---|
| **Backend** | Java / Spring Boot | Java 21 LTS, Spring Boot 3.3.4 | Modular Monolith REST API, HikariCP, Spring Data JPA, Actuator, SpringDoc OpenAPI. |
| **Cơ sở dữ liệu** | MySQL Server | 8.0.x (InnoDB, `utf8mb4_unicode_ci`) | 70 bảng nghiệp vụ, ràng buộc khóa ngoại, index tối ưu hóa. |
| **Database Migration** | Flyway | 10.x (`flyway-mysql`) | Quản lý schema tự động, baseline migration `V1_0__init_system_core.sql`. |
| **Frontend** | ReactJS + Vite | React 18, Vite 5, JavaScript | Single Page Application (SPA), TailwindCSS, Zustand state, Axios HTTP client. |
| **Tài liệu chuẩn** | Markdown / DOCX / SQL | Single Source of Truth | Lưu trữ tại `.antigravity/rules/`. |

---

## 2. Cấu Trúc Dự Án

```text
Farm_Management/
├── .antigravity/rules/          # Thư mục tài liệu quy chuẩn duy nhất (Single Source of Truth)
│   ├── V1_0__init_system_core.sql # Schema SQL baseline 70 bảng & dữ liệu seed
│   ├── DECISION_LOG.md          # Nhật ký quyết định kiến trúc & ranh giới bảo mật
│   ├── architecture-rules.md    # Quy tắc kiến trúc Modular Monolith
│   ├── security-rules.md        # Quy tắc bảo mật, tenant isolation & RBAC
│   └── ...                      # Các tài liệu đặc tả nghiệp vụ, UI/UX, code quality
│
├── backend/                     # Mã nguồn Backend (Java 21 + Spring Boot 3)
│   ├── pom.xml                  # Cấu hình Maven dependencies
│   ├── .env.example             # File mẫu biến môi trường kết nối CSDL
│   └── src/
│       ├── main/
│       │   ├── java/com/farm/saas/
│       │   │   ├── common/      # ApiResponse, ErrorResponse, GlobalExceptionHandler, Correlation ID
│       │   │   ├── config/      # OpenApiConfig, CorsConfig
│       │   │   ├── security/    # RBAC, Token filter (Sẵn sàng cho Phase 2)
│       │   │   ├── platform/    # Quản trị tenant & subscription nền tảng
│       │   │   └── modules/     # 10 phân hệ nghiệp vụ (organization, crop, livestock, inventory,...)
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── db/migration/V1_0__init_system_core.sql
│       └── test/                # Bộ kiểm thử tự động SpringBootTest + MockMvc
│
├── frontend/                    # Mã nguồn Frontend (React 18 + Vite + TailwindCSS)
│   ├── package.json             # Cấu hình dependencies frontend
│   ├── vite.config.js           # Proxy /api, /actuator, /v3/api-docs sang backend :8080
│   ├── tailwind.config.js       # Hệ thống Design Tokens & màu sắc nông nghiệp
│   └── src/
│       ├── components/          # UI, Shared (Header, Sidebar), Forms, Tables
│       ├── layouts/             # AppLayout, AuthLayout, PlatformLayout, ErrorLayout
│       ├── pages/               # Dashboard, 404 và các trang phân hệ nghiệp vụ
│       ├── routes/              # Cấu hình React Router DOM
│       ├── services/            # Axios API client & System Service
│       └── store/               # Zustand stores (UI, Auth, Tenant scope)
│
├── .gitignore                   # Quy tắc bỏ qua secrets (.env), build targets và node_modules
└── README.md                    # Hướng dẫn kỹ thuật và vận hành dự án
```

---

## 3. Yêu Cầu Môi Trường (Prerequisites)

* **Java Development Kit (JDK):** Version `21 LTS` (Oracle JDK hoặc OpenJDK 21).
* **Apache Maven:** Version `3.9.x`.
* **MySQL Server:** Version `8.0.x` (khuyến nghị chạy trên cổng `3306` hoặc `3308`).
* **Node.js & NPM:** Node.js `>= 18.x`, NPM `>= 9.x`.

---

## 4. Hướng Dẫn Cài Đặt & Chạy Dự Án

### 4.1. Thiết lập Cơ sở dữ liệu MySQL

1. Khởi động MySQL Server 8.0.
2. Tạo database phát triển (nếu chưa có):
   ```sql
   CREATE DATABASE farm_saas_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'farm_saas_app'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON farm_saas_dev.* TO 'farm_saas_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 4.2. Khởi động Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Thiết lập biến môi trường (qua file `.env` hoặc tham số dòng lệnh):
   ```bash
   # Windows PowerShell
   $env:DB_URL="jdbc:mysql://localhost:3308/farm_saas_dev?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC"
   $env:DB_USERNAME="farm_saas_app"
   $env:DB_PASSWORD="your_password"
   ```
3. Chạy kiểm thử tự động để xác nhận biên dịch và Flyway migration:
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

### 4.3. Khởi động Frontend

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện ứng dụng tại:
   * **Web App URL:** [http://localhost:5173](http://localhost:5173)
   * Dashboard sẽ tự động gọi API `/api/v1/system/info` và hiển thị trạng thái kết nối Backend & MySQL theo thời gian thực.
5. Kiểm tra build đóng gói sản phẩm:
   ```bash
   npm run build
   ```

---

## 5. Hiện Trạng & Lộ Trình Triển Khai (Roadmap)

* [x] **Giai đoạn 0:** Khảo sát, rà soát 10 tài liệu quy chuẩn, Decision Log D-01..D-14, đối chiếu SQL schema baseline.
* [x] **Giai đoạn 1 (Technical Skeleton):**
  * Backend: Khởi tạo Spring Boot 3.3.4, kết nối MySQL 8, Flyway migration 70 bảng & dữ liệu seed, OpenAPI Swagger, Correlation ID, Global Exception Handler, ApiResponse envelope.
  * Frontend: Khởi tạo React 18 + Vite, TailwindCSS design tokens, Router, Zustand stores, Axios client, Layouts & Dashboard page.
* [ ] **Giai đoạn 2 (Auth & RBAC):** Đăng nhập, JWT Bearer tokens, Token revocation blacklist, phân quyền 6 roles & scope guards.
* [ ] **Giai đoạn 3 (Tổ chức & Danh mục):** Quản lý Tenant, Enterprise, Farm, Zone, Nhà màng, Đơn vị tính và Vật tư nông nghiệp.
* [ ] **Giai đoạn 4–8:** Trồng trọt, Chăn nuôi RFID, Quản lý kho FIFO/FEFO, Thu hoạch & QC truy xuất QR code, Nhân sự & Tài chính nông trại.
