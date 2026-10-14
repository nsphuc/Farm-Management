-- ==============================================================================
-- FARM SAAS PLATFORM - PRODUCTION-GRADE DATABASE ARCHITECTURE (V1.0 FINAL)
-- Migration File: V1_0__init_system_core.sql
-- Database Engine: MySQL 8.x (InnoDB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Architecture: Enterprise Multi-Tenancy & The Farm Barrier Guard (Tenant -> Farm -> Zone -> Location)
-- Total Tables: 70 tables (Structured into 9 Functional Modules + Idempotent Seeds)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- PHẦN 1: QUẢN TRỊ NỀN TẢNG (CORE SYSTEM & MULTI-TENANCY)
-- ==============================================================================

-- 1. Bảng Tổ chức / Khách hàng thuê nền tảng (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'FREE', -- FREE, STARTER, PROFESSIONAL, ENTERPRISE
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, SUSPENDED, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT chk_tenants_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Hợp đồng / Gói đăng ký dịch vụ của Tenant (Tenant Subscriptions)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    plan_type VARCHAR(50) NOT NULL,                        -- FREE, STARTER, PROFESSIONAL, ENTERPRISE
    max_farms INT NOT NULL DEFAULT 1,
    max_users INT NOT NULL DEFAULT 5,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_tenant_sub_dates CHECK (valid_to >= valid_from),
    CONSTRAINT chk_tenant_sub_limits CHECK (max_farms > 0 AND max_users > 0),
    INDEX idx_tenant_subscriptions_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Hồ sơ pháp lý Doanh nghiệp / Hợp tác xã (Enterprises)
CREATE TABLE IF NOT EXISTS enterprises (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL UNIQUE,
    tax_number VARCHAR(50),
    legal_representative VARCHAR(150),
    headquarter_address VARCHAR(500),
    established_date DATE,
    certifications_json JSON,                              -- VietGAP, GlobalGAP, Organic certificates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_enterprises_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Quản lý Đối tác & Chuỗi cung ứng (Partners: NCC, Khách mua sỉ, Đơn vị vận chuyển)
CREATE TABLE IF NOT EXISTS partners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL,                     -- SUPPLIER, BUYER, LOGISTICS, AGENT
    tax_code VARCHAR(50),
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(100),
    address VARCHAR(500),
    bank_account_info VARCHAR(255),
    credit_rating VARCHAR(30) DEFAULT 'UNRATED',          -- A, B, C, UNRATED
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, INACTIVE, BLACKLISTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_partners_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT chk_partners_type CHECK (partner_type IN ('SUPPLIER', 'BUYER', 'LOGISTICS', 'AGENT')),
    CONSTRAINT chk_partners_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
    UNIQUE KEY uk_partners_tenant_code (tenant_id, code),
    UNIQUE KEY uk_partners_tenant_id (tenant_id, id),      -- Composite Parent Key cho cô lập Tenant
    INDEX idx_partners_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 2: PHÂN QUYỀN VÀ BẢO MẬT (RBAC, SECURITY & AUDIT)
-- ==============================================================================

-- 5. Người dùng hệ thống (Users)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,                                 -- NULL chỉ khi is_super_admin = TRUE
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,         -- Phân định rõ Super Admin nền tảng
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, LOCKED, INACTIVE
    failed_logins INT NOT NULL DEFAULT 0,
    lock_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT chk_users_super_admin_tenant CHECK (
        (is_super_admin = TRUE AND tenant_id IS NULL) OR
        (is_super_admin = FALSE AND tenant_id IS NOT NULL)
    ),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'INACTIVE')),
    UNIQUE KEY uk_users_tenant_id (tenant_id, id),
    INDEX idx_users_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Danh mục Vai trò (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    scope_level VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',     -- SYSTEM, TENANT, FARM
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT chk_roles_scope CHECK (scope_level IN ('SYSTEM', 'TENANT', 'FARM'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Danh mục Quyền hạn (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,                           -- CREATE, READ, UPDATE, DELETE, APPROVE, EXPORT
    resource VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Phân quyền Người dùng - Vai trò theo Phạm vi (User Roles với Scoped Farm Assignment)
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,                                 -- NULL nếu Super Admin, khớp tenant của user nếu Tenant/Farm scope
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    farm_id BIGINT NULL,                                   -- NULL nếu vai trò cấp SYSTEM hoặc TENANT; Bắt buộc có khi gán vai trò cấp FARM
    assigned_scope_farm_id BIGINT GENERATED ALWAYS AS (COALESCE(farm_id, 0)) VIRTUAL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT NULL,
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_roles_scoped (user_id, role_id, assigned_scope_farm_id),
    INDEX idx_user_roles_tenant (tenant_id),
    INDEX idx_user_roles_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Phân quyền Vai trò - Quyền hạn (Role Permissions)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Nhật ký hoạt động & Truy vết thay đổi bảo mật (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    status_code INT,
    execution_time_ms BIGINT,
    trace_id VARCHAR(100),
    old_value JSON,
    new_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_tenant (tenant_id),
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_action (module, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 3: TỔ CHỨC TRANG TRẠI VÀ PHÂN VÙNG (THE FARM BARRIER GUARD)
-- ==============================================================================

-- 11. Danh mục Trang trại (Farms)
CREATE TABLE IF NOT EXISTS farms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    farm_type VARCHAR(50) NOT NULL,                         -- CROP, LIVESTOCK, MIXED, AQUACULTURE
    total_area_m2 DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address VARCHAR(500),
    manager_user_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, INACTIVE, MAINTENANCE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farms_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_farms_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_farms_type CHECK (farm_type IN ('CROP', 'LIVESTOCK', 'MIXED', 'AQUACULTURE')),
    CONSTRAINT chk_farms_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    CONSTRAINT chk_farms_area CHECK (total_area_m2 >= 0.00),
    UNIQUE KEY uk_farms_tenant_code (tenant_id, code),
    UNIQUE KEY uk_farms_tenant_id (tenant_id, id),         -- Composite Parent Key cho The Farm Barrier Guard
    INDEX idx_farms_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bổ sung ràng buộc cho user_roles để kiểm tra farm_id thuộc tenant_id
ALTER TABLE user_roles
ADD CONSTRAINT fk_user_roles_farm FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE;

-- 12. Phân quyền truy cập Trang trại cho Người dùng (User Farm Access)
CREATE TABLE IF NOT EXISTS user_farm_access (
    user_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT NULL,
    PRIMARY KEY (user_id, farm_id),
    CONSTRAINT fk_user_farm_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_farm_access_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    INDEX idx_user_farm_access_farm (farm_id),
    INDEX idx_user_farm_access_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Phân khu sản xuất (Production Zones: Nhà màng, Nhà kính, Đồng ruộng, Chuồng trại)
CREATE TABLE IF NOT EXISTS production_zones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,                         -- GREENHOUSE, OPEN_FIELD, BARN, POND, STORAGE, ISOLATION
    area_m2 DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    soil_type VARCHAR(100),
    water_source VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, FALLOW, QUARANTINE, MAINTENANCE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_production_zones_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_production_zones_type CHECK (zone_type IN ('GREENHOUSE', 'OPEN_FIELD', 'BARN', 'POND', 'STORAGE', 'ISOLATION')),
    CONSTRAINT chk_production_zones_status CHECK (status IN ('ACTIVE', 'FALLOW', 'QUARANTINE', 'MAINTENANCE')),
    CONSTRAINT chk_production_zones_area CHECK (area_m2 >= 0.00),
    UNIQUE KEY uk_production_zones_farm_code (farm_id, code),
    UNIQUE KEY uk_production_zones_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_production_zones_tenant (tenant_id),
    INDEX idx_production_zones_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Vị trí chi tiết trong phân khu (Zone Locations: Luống rau, Ô đất nhỏ, Dãy chuồng)
CREATE TABLE IF NOT EXISTS zone_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, OCCUPIED, EMPTY, MAINTENANCE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_zone_locations_zone_composite FOREIGN KEY (tenant_id, farm_id, zone_id) REFERENCES production_zones(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_zone_locations_status CHECK (status IN ('ACTIVE', 'OCCUPIED', 'EMPTY', 'MAINTENANCE')),
    UNIQUE KEY uk_zone_locations_zone_code (zone_id, code),
    UNIQUE KEY uk_zone_locations_composite_id (tenant_id, farm_id, zone_id, id),
    INDEX idx_zone_locations_tenant (tenant_id),
    INDEX idx_zone_locations_farm (farm_id),
    INDEX idx_zone_locations_zone (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Phân công cán bộ quản trị & kỹ thuật trang trại (Farm Assignments)
CREATE TABLE IF NOT EXISTS farm_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_in_farm VARCHAR(50) NOT NULL,                     -- FARM_MANAGER, TECHNICAL_LEAD, AGRONOMIST, VETERINARIAN, WAREHOUSE_KEEPER, FIELD_WORKER
    assigned_from DATE NOT NULL,
    assigned_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farm_assignments_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_assignments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_farm_assignments_dates CHECK (assigned_to IS NULL OR assigned_to >= assigned_from),
    INDEX idx_farm_assignments_tenant (tenant_id),
    INDEX idx_farm_assignments_farm (farm_id),
    INDEX idx_farm_assignments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Chu kỳ canh tác / Năm tài chính vận hành (Operational Cycles)
CREATE TABLE IF NOT EXISTS operational_cycles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    fiscal_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNING',        -- PLANNING, ACTIVE, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_operational_cycles_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_operational_cycles_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_operational_cycles_status CHECK (status IN ('PLANNING', 'ACTIVE', 'CLOSED')),
    UNIQUE KEY uk_operational_cycles_farm_year_name (farm_id, fiscal_year, name),
    UNIQUE KEY uk_operational_cycles_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_operational_cycles_tenant (tenant_id),
    INDEX idx_operational_cycles_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Cấu hình vận hành đặc thù từng trang trại (Farm Operational Settings)
CREATE TABLE IF NOT EXISTS farm_operational_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL UNIQUE,
    irrigation_threshold_json JSON,
    work_shift_config_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farm_operational_settings_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    INDEX idx_farm_operational_settings_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 4: SẢN XUẤT NÔNG NGHIỆP - TRỒNG TRỌT (CROP PRODUCTION)
-- ==============================================================================

-- 18. Danh mục Giống cây trồng (Crop Types)
CREATE TABLE IF NOT EXISTS crop_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    variety_code VARCHAR(50) NOT NULL,
    growth_days_standard INT NOT NULL DEFAULT 90,
    water_need_m3_day DECIMAL(8, 2),
    optimal_temp_min DECIMAL(5, 2),
    optimal_temp_max DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_crop_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT chk_crop_types_growth_days CHECK (growth_days_standard > 0),
    CONSTRAINT chk_crop_types_temp_range CHECK (optimal_temp_min IS NULL OR optimal_temp_max IS NULL OR optimal_temp_min <= optimal_temp_max),
    UNIQUE KEY uk_crop_types_tenant_variety (tenant_id, variety_code),
    UNIQUE KEY uk_crop_types_tenant_id (tenant_id, id),
    INDEX idx_crop_types_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Mùa vụ canh tác (Crop Seasons - Khóa ngoại xác thực đúng Tenant & Farm & Zone)
CREATE TABLE IF NOT EXISTS crop_seasons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    season_code VARCHAR(50) NOT NULL,
    crop_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    planted_area_m2 DECIMAL(12, 2) NOT NULL,
    seed_quantity DECIMAL(10, 2),
    estimated_yield_kg DECIMAL(12, 2),
    actual_yield_kg DECIMAL(12, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'SOIL_PREPARATION', -- SOIL_PREPARATION, SOWING, GROWING, HARVESTING, CLOSED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_crop_seasons_zone_composite FOREIGN KEY (tenant_id, farm_id, zone_id) REFERENCES production_zones(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_seasons_crop_type_composite FOREIGN KEY (tenant_id, crop_type_id) REFERENCES crop_types(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_crop_seasons_area CHECK (planted_area_m2 > 0.00),
    CONSTRAINT chk_crop_seasons_dates CHECK (
        (expected_harvest_date IS NULL OR expected_harvest_date >= start_date) AND
        (actual_harvest_date IS NULL OR actual_harvest_date >= start_date)
    ),
    CONSTRAINT chk_crop_seasons_yields CHECK (
        (seed_quantity IS NULL OR seed_quantity >= 0.00) AND
        (estimated_yield_kg IS NULL OR estimated_yield_kg >= 0.00) AND
        (actual_yield_kg IS NULL OR actual_yield_kg >= 0.00)
    ),
    CONSTRAINT chk_crop_seasons_status CHECK (status IN ('SOIL_PREPARATION', 'SOWING', 'GROWING', 'HARVESTING', 'CLOSED', 'CANCELLED')),
    UNIQUE KEY uk_crop_seasons_farm_code (tenant_id, farm_id, season_code),
    UNIQUE KEY uk_crop_seasons_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_crop_seasons_tenant (tenant_id),
    INDEX idx_crop_seasons_farm (farm_id),
    INDEX idx_crop_seasons_zone (zone_id),
    INDEX idx_crop_seasons_crop_type (crop_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Nhật ký canh tác đồng ruộng (Farming Logs)
CREATE TABLE IF NOT EXISTS farming_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    log_date DATE NOT NULL,
    stage VARCHAR(50),                                      -- SEEDLING, VEGETATIVE, FLOWERING, FRUITING, MATURATION
    activity_type VARCHAR(50) NOT NULL,                     -- SOIL_TILLAGE, IRRIGATION, FERTILIZATION, PESTICIDE_APPLICATION, PRUNING, WEEDING, HARVESTING
    supplies_used_json JSON,                                -- Snapshot dữ liệu thô
    weather_notes VARCHAR(500),
    performed_by_user_id BIGINT NULL,
    image_urls_json JSON,
    is_inventory_backflushed BOOLEAN NOT NULL DEFAULT FALSE,-- Đánh dấu đã sinh phiếu xuất kho hay chưa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farming_logs_season_composite FOREIGN KEY (tenant_id, farm_id, season_id) REFERENCES crop_seasons(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farming_logs_performed_by FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_farming_logs_activity CHECK (activity_type IN ('SOIL_TILLAGE', 'IRRIGATION', 'FERTILIZATION', 'PESTICIDE_APPLICATION', 'PRUNING', 'WEEDING', 'HARVESTING')),
    UNIQUE KEY uk_farming_logs_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_farming_logs_tenant (tenant_id),
    INDEX idx_farming_logs_farm (farm_id),
    INDEX idx_farming_logs_season (season_id),
    INDEX idx_farming_logs_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 5: SẢN XUẤT NÔNG NGHIỆP - CHĂN NUÔI (LIVESTOCK PRODUCTION)
-- ==============================================================================

-- 21. Danh mục Giống vật nuôi (Livestock Breeds)
CREATE TABLE IF NOT EXISTS livestock_breeds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    species VARCHAR(50) NOT NULL,                          -- CATTLE, SWINE, POULTRY, GOAT, SHEEP, AQUA
    breed_name VARCHAR(150) NOT NULL,
    standard_growth_days INT,
    target_weight_kg DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_livestock_breeds_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT chk_livestock_breeds_species CHECK (species IN ('CATTLE', 'SWINE', 'POULTRY', 'GOAT', 'SHEEP', 'AQUA')),
    CONSTRAINT chk_livestock_breeds_metrics CHECK (
        (standard_growth_days IS NULL OR standard_growth_days > 0) AND
        (target_weight_kg IS NULL OR target_weight_kg > 0.00)
    ),
    UNIQUE KEY uk_livestock_breeds_tenant_code (tenant_id, species, breed_name),
    UNIQUE KEY uk_livestock_breeds_tenant_id (tenant_id, id),
    INDEX idx_livestock_breeds_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Quản lý Đàn / Bầy vật nuôi (Livestock Groups)
-- Sửa lỗi logic nghiệp vụ: Đàn có thể sinh sản/tăng số lượng, bỏ ràng buộc current_quantity <= initial_quantity
CREATE TABLE IF NOT EXISTS livestock_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    group_code VARCHAR(50) NOT NULL,
    breed_id BIGINT NOT NULL,
    initial_quantity INT NOT NULL,
    current_quantity INT NOT NULL,
    entry_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, QUARANTINED, SOLD, CULLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_livestock_groups_zone_composite FOREIGN KEY (tenant_id, farm_id, zone_id) REFERENCES production_zones(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_groups_breed_composite FOREIGN KEY (tenant_id, breed_id) REFERENCES livestock_breeds(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_livestock_groups_qty CHECK (initial_quantity >= 0 AND current_quantity >= 0),
    CONSTRAINT chk_livestock_groups_status CHECK (status IN ('ACTIVE', 'QUARANTINED', 'SOLD', 'CULLED')),
    UNIQUE KEY uk_livestock_groups_code (tenant_id, farm_id, group_code),
    UNIQUE KEY uk_livestock_groups_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_livestock_groups_tenant (tenant_id),
    INDEX idx_livestock_groups_farm (farm_id),
    INDEX idx_livestock_groups_zone (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Quản lý Cá thể vật nuôi độc lập (Livestock Individuals - Thẻ tai RFID)
CREATE TABLE IF NOT EXISTS livestock_individuals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    rfid_tag_code VARCHAR(50) NOT NULL,
    group_id BIGINT NULL,
    gender VARCHAR(10) NOT NULL,                           -- MALE, FEMALE, CASTRATED
    birth_date DATE,
    mother_tag_code VARCHAR(50),
    father_tag_code VARCHAR(50),
    current_weight_kg DECIMAL(8, 2),
    health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY',  -- HEALTHY, SICK, INJURED, QUARANTINED, DECEASED, SOLD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_livestock_ind_zone_composite FOREIGN KEY (tenant_id, farm_id, zone_id) REFERENCES production_zones(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_ind_group_composite FOREIGN KEY (tenant_id, farm_id, group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_livestock_ind_gender CHECK (gender IN ('MALE', 'FEMALE', 'CASTRATED')),
    CONSTRAINT chk_livestock_ind_health CHECK (health_status IN ('HEALTHY', 'SICK', 'INJURED', 'QUARANTINED', 'DECEASED', 'SOLD')),
    CONSTRAINT chk_livestock_ind_weight CHECK (current_weight_kg IS NULL OR current_weight_kg >= 0.00),
    UNIQUE KEY uk_livestock_individuals_rfid (tenant_id, rfid_tag_code),
    UNIQUE KEY uk_livestock_individuals_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_livestock_individuals_tenant (tenant_id),
    INDEX idx_livestock_individuals_farm (farm_id),
    INDEX idx_livestock_individuals_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Lịch sử cân nặng tăng trưởng vật nuôi (Livestock Weight Growth Logs)
-- Sửa lỗi logic: Bắt buộc đúng 1 đối tượng cân (cá thể hoặc bầy đàn)
CREATE TABLE IF NOT EXISTS livestock_weight_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, GROUP
    individual_id BIGINT NULL,
    group_id BIGINT NULL,
    record_date DATE NOT NULL,
    weight_kg DECIMAL(8, 2) NOT NULL,
    recorded_by_user_id BIGINT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_weight_logs_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_weight_logs_individual FOREIGN KEY (tenant_id, farm_id, individual_id) REFERENCES livestock_individuals(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_weight_logs_group FOREIGN KEY (tenant_id, farm_id, group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_weight_logs_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_weight_log_target CHECK (
        (target_type = 'INDIVIDUAL' AND individual_id IS NOT NULL AND group_id IS NULL) OR
        (target_type = 'GROUP' AND group_id IS NOT NULL AND individual_id IS NULL)
    ),
    CONSTRAINT chk_weight_positive CHECK (weight_kg > 0.00),
    INDEX idx_weight_logs_tenant (tenant_id),
    INDEX idx_weight_logs_farm (farm_id),
    INDEX idx_weight_logs_individual (individual_id),
    INDEX idx_weight_logs_group (group_id),
    INDEX idx_weight_logs_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Sự kiện chăn nuôi & Thú y (Livestock Events)
CREATE TABLE IF NOT EXISTS livestock_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    target_type VARCHAR(30) NOT NULL,                      -- GROUP, INDIVIDUAL
    livestock_group_id BIGINT NULL,
    livestock_individual_id BIGINT NULL,
    event_type VARCHAR(50) NOT NULL,                       -- VACCINATION, WEIGHT_CHECK, BREEDING, BIRTH, MEDICAL_TREATMENT, TRANSFER, SLAUGHTER
    event_date DATE NOT NULL,
    withdrawal_days INT NOT NULL DEFAULT 0,                -- Số ngày cách ly ngừng thuốc trước xuất chuồng
    withdrawal_end_date DATE NULL,                         -- Ngày kết thúc cách ly ngừng thuốc
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    details_json JSON,
    veterinarian_user_id BIGINT NULL,
    is_inventory_backflushed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_livestock_events_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_events_group FOREIGN KEY (tenant_id, farm_id, livestock_group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_events_individual FOREIGN KEY (tenant_id, farm_id, livestock_individual_id) REFERENCES livestock_individuals(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_events_vet FOREIGN KEY (veterinarian_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_livestock_event_target CHECK (
        (target_type = 'GROUP' AND livestock_group_id IS NOT NULL AND livestock_individual_id IS NULL) OR
        (target_type = 'INDIVIDUAL' AND livestock_individual_id IS NOT NULL AND livestock_group_id IS NULL)
    ),
    CONSTRAINT chk_livestock_events_type CHECK (event_type IN ('VACCINATION', 'WEIGHT_CHECK', 'BREEDING', 'BIRTH', 'MEDICAL_TREATMENT', 'TRANSFER', 'SLAUGHTER')),
    CONSTRAINT chk_livestock_events_withdrawal CHECK (withdrawal_days >= 0),
    UNIQUE KEY uk_livestock_events_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_livestock_events_tenant (tenant_id),
    INDEX idx_livestock_events_farm (farm_id),
    INDEX idx_livestock_events_group (livestock_group_id),
    INDEX idx_livestock_events_individual (livestock_individual_id),
    INDEX idx_livestock_events_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 6: QUẢN TRỊ KHO BÃI VÀ VẬT TƯ (INVENTORY, TRANSFERS & BACKFLUSHING)
-- ==============================================================================

-- 26. Danh mục Kho (Warehouses)
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    warehouse_type VARCHAR(50) NOT NULL,                   -- FERTILIZER, PESTICIDE, ANIMAL_FEED, HARVESTED_PRODUCE, TOOLS_EQUIPMENT, GENERAL
    location_desc VARCHAR(255),
    manager_user_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, INACTIVE, FULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_warehouses_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouses_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_warehouses_type CHECK (warehouse_type IN ('FERTILIZER', 'PESTICIDE', 'ANIMAL_FEED', 'HARVESTED_PRODUCE', 'TOOLS_EQUIPMENT', 'GENERAL')),
    CONSTRAINT chk_warehouses_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'FULL')),
    UNIQUE KEY uk_warehouses_farm_code (farm_id, code),
    UNIQUE KEY uk_warehouses_tenant_farm_id (tenant_id, farm_id, id),
    UNIQUE KEY uk_warehouses_tenant_id (tenant_id, id),
    INDEX idx_warehouses_tenant (tenant_id),
    INDEX idx_warehouses_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Danh mục Nhóm vật tư (Material Categories)
CREATE TABLE IF NOT EXISTS material_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_material_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_material_categories_code (tenant_id, code),
    UNIQUE KEY uk_material_categories_tenant_id (tenant_id, id),
    INDEX idx_material_categories_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. Danh mục Mặt hàng / Vật tư nông nghiệp (Materials)
CREATE TABLE IF NOT EXISTS materials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sku_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    standard_unit VARCHAR(30) NOT NULL,                     -- KG, GRAM, LITER, ML, BAG, BOTTLE, DOSE, PIECE, BOX
    dispatch_strategy VARCHAR(20) NOT NULL DEFAULT 'FIFO',  -- FIFO (First In First Out), FEFO (First Expired First Out)
    expiry_alert_days INT NOT NULL DEFAULT 30,
    min_stock_level DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    max_stock_level DECIMAL(12, 2),
    unit_price_standard DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_materials_category_composite FOREIGN KEY (tenant_id, category_id) REFERENCES material_categories(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_materials_dispatch CHECK (dispatch_strategy IN ('FIFO', 'FEFO')),
    CONSTRAINT chk_materials_min_stock CHECK (min_stock_level >= 0.00),
    CONSTRAINT chk_materials_max_stock CHECK (max_stock_level IS NULL OR max_stock_level >= min_stock_level),
    CONSTRAINT chk_materials_price CHECK (unit_price_standard >= 0.00),
    CONSTRAINT chk_materials_alert_days CHECK (expiry_alert_days >= 0),
    UNIQUE KEY uk_materials_sku (tenant_id, sku_code),
    UNIQUE KEY uk_materials_tenant_id (tenant_id, id),
    INDEX idx_materials_tenant (tenant_id),
    INDEX idx_materials_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Bảng Quy đổi Đơn vị Tính Vật tư (Material Unit Conversions - Bổ sung mới)
CREATE TABLE IF NOT EXISTS material_unit_conversions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    unit_name VARCHAR(30) NOT NULL,                         -- BAG, BOX, BOTTLE, PACK
    conversion_factor DECIMAL(12, 4) NOT NULL,              -- 1 BAG = 25.0000 KG (quy về standard_unit)
    is_purchase_unit BOOLEAN NOT NULL DEFAULT FALSE,
    is_dispatch_unit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_unit_conversions_material FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT chk_unit_conv_factor CHECK (conversion_factor > 0.0000),
    UNIQUE KEY uk_material_unit_name (material_id, unit_name),
    INDEX idx_unit_conv_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. Định mức tiêu hao vật tư chuẩn (Consumption Quotas)
CREATE TABLE IF NOT EXISTS consumption_quotas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    crop_type_id BIGINT NULL,
    livestock_breed_id BIGINT NULL,
    material_id BIGINT NOT NULL,
    standard_quantity DECIMAL(12, 2) NOT NULL,
    unit_of_measure VARCHAR(30) NOT NULL,                  -- PER_HECTARE, PER_HEAD, PER_DAY
    stage VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_consumption_quotas_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_consumption_quotas_crop_type FOREIGN KEY (tenant_id, crop_type_id) REFERENCES crop_types(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_consumption_quotas_breed FOREIGN KEY (tenant_id, livestock_breed_id) REFERENCES livestock_breeds(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_consumption_quotas_material FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_consumption_quotas_target CHECK (
        (crop_type_id IS NOT NULL AND livestock_breed_id IS NULL) OR
        (crop_type_id IS NULL AND livestock_breed_id IS NOT NULL)
    ),
    CONSTRAINT chk_consumption_quotas_qty CHECK (standard_quantity > 0.00),
    INDEX idx_consumption_quotas_tenant (tenant_id),
    INDEX idx_consumption_quotas_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. Sổ Tồn kho Chi tiết theo Lô FIFO/FEFO (Warehouse Inventory Snapshot)
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    inward_date DATE NOT NULL,                             -- Phục vụ chiến lược FIFO
    expiry_date DATE,                                      -- Phục vụ chiến lược FEFO
    unit_cost DECIMAL(14, 2) NOT NULL DEFAULT 0.00,        -- Đơn giá vốn thực tế
    quantity_on_hand DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    reserved_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    storage_bin_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_warehouse_inventory_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_inventory_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_warehouse_inventory_quantity_non_negative CHECK (quantity_on_hand >= 0.00),
    CONSTRAINT chk_warehouse_inventory_reserved_non_negative CHECK (reserved_quantity >= 0.00),
    CONSTRAINT chk_warehouse_inventory_reserved_le_on_hand CHECK (reserved_quantity <= quantity_on_hand),
    CONSTRAINT chk_warehouse_inventory_unit_cost CHECK (unit_cost >= 0.00),
    UNIQUE KEY uk_warehouse_inventory_batch (warehouse_id, material_id, batch_number),
    INDEX idx_warehouse_inventory_tenant (tenant_id),
    INDEX idx_warehouse_inventory_farm (farm_id),
    INDEX idx_warehouse_inventory_warehouse (warehouse_id),
    INDEX idx_warehouse_inventory_material (material_id),
    INDEX idx_warehouse_inventory_fifo (material_id, inward_date, expiry_date),
    INDEX idx_warehouse_inventory_fefo (material_id, expiry_date, inward_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. Phiếu Nhập kho (Warehouse Receipts) - Mặc định DRAFT, bảo đảm an toàn dữ liệu
CREATE TABLE IF NOT EXISTS warehouse_receipts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    receipt_code VARCHAR(50) NOT NULL,
    receipt_type VARCHAR(50) NOT NULL,                     -- PURCHASE, HARVEST_RETURN, INTERNAL_TRANSFER, ADJUSTMENT
    partner_id BIGINT NULL,                                -- Nhà cung cấp (bắt buộc cùng tenant)
    receipt_date DATE NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',           -- DRAFT, APPROVED, COMPLETED, CANCELLED
    cancelled_at TIMESTAMP NULL,
    cancelled_by BIGINT NULL,
    cancellation_reason VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_warehouse_receipts_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_receipts_partner_composite FOREIGN KEY (tenant_id, partner_id) REFERENCES partners(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_receipts_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_warehouse_receipts_type CHECK (receipt_type IN ('PURCHASE', 'HARVEST_RETURN', 'INTERNAL_TRANSFER', 'ADJUSTMENT')),
    CONSTRAINT chk_warehouse_receipts_status CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_warehouse_receipts_amount CHECK (total_amount >= 0.00),
    UNIQUE KEY uk_warehouse_receipts_code (tenant_id, farm_id, receipt_code),
    UNIQUE KEY uk_warehouse_receipts_tenant_farm_id (tenant_id, farm_id, id),
    UNIQUE KEY uk_warehouse_receipts_tenant_id (tenant_id, id),
    INDEX idx_warehouse_receipts_tenant (tenant_id),
    INDEX idx_warehouse_receipts_farm (farm_id),
    INDEX idx_warehouse_receipts_date (receipt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 33. Chi tiết Phiếu Nhập kho (Warehouse Receipt Items)
CREATE TABLE IF NOT EXISTS warehouse_receipt_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    storage_bin_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_receipt_items_receipt FOREIGN KEY (receipt_id) REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_items_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_receipt_items_quantity CHECK (quantity > 0.00),
    CONSTRAINT chk_receipt_items_price CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    UNIQUE KEY uk_receipt_items_batch (receipt_id, material_id, batch_number),
    INDEX idx_receipt_items_receipt (receipt_id),
    INDEX idx_receipt_items_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34. Phiếu Xuất kho (Warehouse Issues)
-- Giải quyết mâu thuẫn Multi-warehouse Backflushing & Cho phép Hủy / Tái lập chứng từ bằng Partial Unique Index
CREATE TABLE IF NOT EXISTS warehouse_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    issue_code VARCHAR(50) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,                       -- PRODUCTION_BACKFLUSH, INTERNAL_USE, SALE_FULFILLMENT, DAMAGE_DISPOSAL, TRANSFER
    receiver_name VARCHAR(150),
    season_id BIGINT NULL,                                 -- Vụ mùa tiêu thụ
    farming_log_id BIGINT NULL,                            -- Hoạt động canh tác
    livestock_event_id BIGINT NULL,                        -- Sự kiện chăn nuôi
    is_backflushed BOOLEAN NOT NULL DEFAULT FALSE,         -- Đánh dấu phiếu sinh tự động
    issue_date DATE NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',           -- DRAFT, APPROVED, COMPLETED, CANCELLED
    cancelled_at TIMESTAMP NULL,
    cancelled_by BIGINT NULL,
    cancellation_reason VARCHAR(500) NULL,
    -- Cột sinh phục vụ cơ chế Idempotency: Chỉ khóa duy nhất đối với các phiếu ĐANG HOẠT ĐỘNG (khác CANCELLED)
    active_farming_backflush BIGINT GENERATED ALWAYS AS (CASE WHEN status <> 'CANCELLED' AND farming_log_id IS NOT NULL THEN farming_log_id ELSE NULL END) VIRTUAL,
    active_livestock_backflush BIGINT GENERATED ALWAYS AS (CASE WHEN status <> 'CANCELLED' AND livestock_event_id IS NOT NULL THEN livestock_event_id ELSE NULL END) VIRTUAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_warehouse_issues_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_issues_season_composite FOREIGN KEY (tenant_id, farm_id, season_id) REFERENCES crop_seasons(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_issues_farming_log_composite FOREIGN KEY (tenant_id, farm_id, farming_log_id) REFERENCES farming_logs(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_issues_livestock_event_composite FOREIGN KEY (tenant_id, farm_id, livestock_event_id) REFERENCES livestock_events(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_issues_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_warehouse_issues_type CHECK (issue_type IN ('PRODUCTION_BACKFLUSH', 'INTERNAL_USE', 'SALE_FULFILLMENT', 'DAMAGE_DISPOSAL', 'TRANSFER')),
    CONSTRAINT chk_warehouse_issues_status CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_warehouse_issues_amount CHECK (total_amount >= 0.00),
    UNIQUE KEY uk_warehouse_issues_code (tenant_id, farm_id, issue_code),
    UNIQUE KEY uk_wh_issue_farm_log_wh (active_farming_backflush, warehouse_id),
    UNIQUE KEY uk_wh_issue_live_event_wh (active_livestock_backflush, warehouse_id),
    UNIQUE KEY uk_warehouse_issues_tenant_farm_id (tenant_id, farm_id, id),
    UNIQUE KEY uk_warehouse_issues_tenant_id (tenant_id, id),
    INDEX idx_warehouse_issues_tenant (tenant_id),
    INDEX idx_warehouse_issues_farm (farm_id),
    INDEX idx_warehouse_issues_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 35. Chi tiết Phiếu Xuất kho (Warehouse Issue Items)
CREATE TABLE IF NOT EXISTS warehouse_issue_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_issue_items_issue FOREIGN KEY (issue_id) REFERENCES warehouse_issues(id) ON DELETE CASCADE,
    CONSTRAINT fk_issue_items_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_issue_items_quantity CHECK (quantity > 0.00),
    CONSTRAINT chk_issue_items_price CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    INDEX idx_issue_items_issue (issue_id),
    INDEX idx_issue_items_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 36. Điều chuyển Kho liên cơ sở & nội bộ (Warehouse Transfers)
-- Thiết kế lại: Hỗ trợ điều chuyển cùng farm hoặc khác farm trong cùng tenant, ngăn chặn tuyệt đối chéo tenant
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    from_farm_id BIGINT NOT NULL,
    to_farm_id BIGINT NOT NULL,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    transfer_code VARCHAR(50) NOT NULL,
    transfer_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',           -- DRAFT, PENDING, IN_TRANSIT, COMPLETED, CANCELLED
    transferred_by_user_id BIGINT NULL,
    received_by_user_id BIGINT NULL,
    dispatched_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_transfers_from_farm FOREIGN KEY (tenant_id, from_farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_to_farm FOREIGN KEY (tenant_id, to_farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_from_wh FOREIGN KEY (tenant_id, from_farm_id, from_warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_to_wh FOREIGN KEY (tenant_id, to_farm_id, to_warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_dispatched_by FOREIGN KEY (transferred_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_transfers_received_by FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_warehouse_transfers_diff_wh CHECK (from_warehouse_id <> to_warehouse_id),
    CONSTRAINT chk_warehouse_transfers_status CHECK (status IN ('DRAFT', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    UNIQUE KEY uk_warehouse_transfers_tenant_code (tenant_id, transfer_code),
    UNIQUE KEY uk_warehouse_transfers_tenant_id (tenant_id, id),
    INDEX idx_warehouse_transfers_tenant (tenant_id),
    INDEX idx_warehouse_transfers_from_farm (from_farm_id),
    INDEX idx_warehouse_transfers_to_farm (to_farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 37. Chi tiết Vật tư Điều chuyển Kho (Warehouse Transfer Items)
CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transfer_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    from_batch_number VARCHAR(50) NOT NULL,
    to_batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    from_bin_code VARCHAR(50) NULL,
    to_bin_code VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_transfer_items_transfer FOREIGN KEY (transfer_id) REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    CONSTRAINT fk_transfer_items_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_transfer_item_qty CHECK (quantity > 0.00),
    CONSTRAINT chk_transfer_item_price CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    INDEX idx_transfer_items_transfer (transfer_id),
    INDEX idx_transfer_items_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 38. Sổ cái Biến động Giao dịch Kho Thống nhất (Warehouse Inventory Transactions / Stock Ledger)
-- Single Source of Truth cho biến động kho, kiểm toán bất biến & bảo đảm tính toàn vẹn toán học
CREATE TABLE IF NOT EXISTS warehouse_inventory_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,                 -- INWARD, OUTWARD, TRANSFER_OUT, TRANSFER_IN, STOCKTAKE_ADJUST_IN, STOCKTAKE_ADJUST_OUT, DAMAGE_DISPOSAL, CANCELLATION_REVERSAL
    reference_doc_type VARCHAR(50) NOT NULL,               -- WAREHOUSE_RECEIPT, WAREHOUSE_ISSUE, WAREHOUSE_TRANSFER, STOCKTAKE
    reference_doc_id BIGINT NOT NULL,
    reference_item_id BIGINT NOT NULL,                     -- Bắt buộc trỏ đúng dòng chi tiết chứng từ để bảo đảm Idempotency
    direction VARCHAR(10) NOT NULL,                        -- IN, OUT
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    CONSTRAINT fk_inv_trans_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_trans_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_inv_trans_direction CHECK (direction IN ('IN', 'OUT')),
    CONSTRAINT chk_inv_trans_qty CHECK (quantity > 0.00),
    CONSTRAINT chk_inv_trans_amounts CHECK (unit_price >= 0.00 AND total_amount >= 0.00),
    CONSTRAINT chk_inv_trans_balances CHECK (balance_before >= 0.00 AND balance_after >= 0.00),
    -- Ràng buộc toàn vẹn toán học giữa số dư trước, chiều biến động, số lượng và số dư sau
    CONSTRAINT chk_inv_trans_balance_math CHECK (
        (direction = 'IN' AND balance_after = balance_before + quantity) OR
        (direction = 'OUT' AND balance_after = balance_before - quantity)
    ),
    -- Idempotency Tuyệt đối: Mỗi dòng chứng từ chi tiết chỉ được ghi nhận một lần duy nhất cho mỗi chiều
    UNIQUE KEY uk_inv_trans_item_idempotent (reference_doc_type, reference_item_id, direction),
    INDEX idx_inv_trans_tenant (tenant_id),
    INDEX idx_inv_trans_farm (farm_id),
    INDEX idx_inv_trans_warehouse_material (warehouse_id, material_id, batch_number),
    INDEX idx_inv_trans_doc (reference_doc_type, reference_doc_id),
    INDEX idx_inv_trans_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 39. Phiếu Kiểm kê Kho định kỳ (Stocktakes)
CREATE TABLE IF NOT EXISTS stocktakes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    stocktake_code VARCHAR(50) NOT NULL,
    stocktake_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',           -- DRAFT, IN_PROGRESS, COMPLETED, CANCELLED
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_stocktakes_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_stocktakes_status CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    UNIQUE KEY uk_stocktakes_code (tenant_id, farm_id, stocktake_code),
    UNIQUE KEY uk_stocktakes_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_stocktakes_tenant (tenant_id),
    INDEX idx_stocktakes_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 40. Chi tiết Sai lệch Kiểm kê Kho (Stocktake Items)
CREATE TABLE IF NOT EXISTS stocktake_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stocktake_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    book_quantity DECIMAL(12, 2) NOT NULL,
    actual_quantity DECIMAL(12, 2) NOT NULL,
    difference_quantity DECIMAL(12, 2) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_stocktake_items_stocktake FOREIGN KEY (stocktake_id) REFERENCES stocktakes(id) ON DELETE CASCADE,
    CONSTRAINT fk_stocktake_items_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_stocktake_items_quantities CHECK (book_quantity >= 0.00 AND actual_quantity >= 0.00),
    CONSTRAINT chk_stocktake_difference CHECK (difference_quantity = (actual_quantity - book_quantity)),
    INDEX idx_stocktake_items_stocktake (stocktake_id),
    INDEX idx_stocktake_items_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 41. Bảng Chi tiết Vật tư Tiêu hao Nhật ký Canh tác (Farming Log Supplies)
CREATE TABLE IF NOT EXISTS farming_log_supplies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    farming_log_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    actual_quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    warehouse_issue_item_id BIGINT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farming_log_supplies_log FOREIGN KEY (farming_log_id) REFERENCES farming_logs(id) ON DELETE CASCADE,
    CONSTRAINT fk_farming_log_supplies_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farming_log_supplies_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farming_log_supplies_issue_item FOREIGN KEY (warehouse_issue_item_id) REFERENCES warehouse_issue_items(id) ON DELETE SET NULL,
    CONSTRAINT chk_farming_supplies_qty CHECK (actual_quantity > 0.00),
    CONSTRAINT chk_farming_supplies_cost CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    INDEX idx_farming_log_supplies_log (farming_log_id),
    INDEX idx_farming_log_supplies_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 42. Bảng Chi tiết Vật tư Tiêu hao Sự kiện Chăn nuôi (Livestock Event Supplies)
CREATE TABLE IF NOT EXISTS livestock_event_supplies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    livestock_event_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    actual_quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    warehouse_issue_item_id BIGINT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_livestock_event_supplies_event FOREIGN KEY (livestock_event_id) REFERENCES livestock_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_livestock_event_supplies_material_composite FOREIGN KEY (tenant_id, material_id) REFERENCES materials(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_event_supplies_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_livestock_event_supplies_issue_item FOREIGN KEY (warehouse_issue_item_id) REFERENCES warehouse_issue_items(id) ON DELETE SET NULL,
    CONSTRAINT chk_livestock_supplies_qty CHECK (actual_quantity > 0.00),
    CONSTRAINT chk_livestock_supplies_cost CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    INDEX idx_livestock_event_supplies_event (livestock_event_id),
    INDEX idx_livestock_event_supplies_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 7: THU HOẠCH, KIỂM ĐỊNH QC VÀ TRUY XUẤT NGUỒN GỐC (HARVEST, QC & TRACEABILITY)
-- ==============================================================================

-- 43. Hồ sơ Thu hoạch Nông sản / Xuất chuồng (Harvest Records - Bổ sung mới)
-- Đóng vai trò là bảng đích hợp lệ cho các lần thu hoạch từ ruộng hoặc đàn vật nuôi
CREATE TABLE IF NOT EXISTS harvest_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    harvest_code VARCHAR(50) NOT NULL,
    harvest_date DATE NOT NULL,
    source_type VARCHAR(30) NOT NULL,                      -- CROP_SEASON, LIVESTOCK_GROUP
    season_id BIGINT NULL,                                 -- Mùa vụ trồng trọt
    livestock_group_id BIGINT NULL,                        -- Lứa chăn nuôi
    quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL DEFAULT 'STANDARD', -- GRADE_A, GRADE_B, STANDARD, REJECT
    harvested_by_user_id BIGINT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_harvest_records_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_harvest_records_season_composite FOREIGN KEY (tenant_id, farm_id, season_id) REFERENCES crop_seasons(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_harvest_records_group_composite FOREIGN KEY (tenant_id, farm_id, livestock_group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_harvest_records_user FOREIGN KEY (harvested_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_harvest_records_source CHECK (
        (source_type = 'CROP_SEASON' AND season_id IS NOT NULL AND livestock_group_id IS NULL) OR
        (source_type = 'LIVESTOCK_GROUP' AND livestock_group_id IS NOT NULL AND season_id IS NULL)
    ),
    CONSTRAINT chk_harvest_records_qty CHECK (quantity > 0.00),
    UNIQUE KEY uk_harvest_records_code (tenant_id, farm_id, harvest_code),
    UNIQUE KEY uk_harvest_records_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_harvest_records_tenant (tenant_id),
    INDEX idx_harvest_records_farm (farm_id),
    INDEX idx_harvest_records_date (harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 44. Lô thành phẩm nông sản & Cổng phê duyệt QC (Product Batches)
CREATE TABLE IF NOT EXISTS product_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    warehouse_id BIGINT NULL,                              -- Kho lưu trữ thành phẩm
    season_id BIGINT NULL,                                 -- Vụ mùa chính
    livestock_group_id BIGINT NULL,                        -- Lứa chăn nuôi chính
    batch_code VARCHAR(50) NOT NULL,
    traceability_code VARCHAR(64) NULL UNIQUE,             -- UUID / NanoID sinh khi ĐÃ PHÊ DUYỆT QC
    product_name VARCHAR(255) NOT NULL,
    harvest_date DATE NOT NULL,
    expiry_date DATE,
    initial_quantity DECIMAL(12, 2) NOT NULL,
    remaining_quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quality_grade VARCHAR(20) DEFAULT 'STANDARD',          -- GRADE_A, GRADE_B, EXPORT, STANDARD
    qr_image_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, READY_TO_PRINT, PRINTED, SELLING, REJECTED, RECALLED
    approved_by_user_id BIGINT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by_user_id BIGINT NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason VARCHAR(500),
    recalled_by_user_id BIGINT NULL,
    recalled_at TIMESTAMP NULL,
    recall_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_product_batches_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_batches_warehouse_composite FOREIGN KEY (tenant_id, farm_id, warehouse_id) REFERENCES warehouses(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_batches_season_composite FOREIGN KEY (tenant_id, farm_id, season_id) REFERENCES crop_seasons(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_batches_livestock_composite FOREIGN KEY (tenant_id, farm_id, livestock_group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_batches_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_product_batches_rejected_by FOREIGN KEY (rejected_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_product_batches_recalled_by FOREIGN KEY (recalled_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_product_batches_quantities CHECK (initial_quantity > 0.00 AND remaining_quantity >= 0.00 AND remaining_quantity <= initial_quantity),
    CONSTRAINT chk_product_batches_dates CHECK (expiry_date IS NULL OR expiry_date >= harvest_date),
    CONSTRAINT chk_product_batches_status CHECK (status IN ('PENDING_APPROVAL', 'READY_TO_PRINT', 'PRINTED', 'SELLING', 'REJECTED', 'RECALLED')),
    UNIQUE KEY uk_product_batch_code (tenant_id, farm_id, batch_code),
    UNIQUE KEY uk_product_batches_tenant_farm_id (tenant_id, farm_id, id),
    UNIQUE KEY uk_product_batches_tenant_id (tenant_id, id),
    INDEX idx_product_batches_tenant (tenant_id),
    INDEX idx_product_batches_farm (farm_id),
    INDEX idx_product_batches_status (status),
    INDEX idx_product_batches_trace_code (traceability_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 45. Bảng Nguồn gốc Đa nguồn cho Lô thành phẩm (Product Batch Sources)
-- Xác thực source_type ứng với đúng 1 nguồn hợp lệ: HARVEST_RECORD, CROP_SEASON hoặc LIVESTOCK_GROUP
CREATE TABLE IF NOT EXISTS product_batch_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_batch_id BIGINT NOT NULL,
    source_type VARCHAR(30) NOT NULL,                      -- HARVEST_RECORD, CROP_SEASON, LIVESTOCK_GROUP
    harvest_record_id BIGINT NULL,
    crop_season_id BIGINT NULL,
    livestock_group_id BIGINT NULL,
    contributed_quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    harvest_date DATE NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_sources_batch FOREIGN KEY (product_batch_id) REFERENCES product_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_sources_harvest_record FOREIGN KEY (harvest_record_id) REFERENCES harvest_records(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_sources_season FOREIGN KEY (crop_season_id) REFERENCES crop_seasons(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_sources_group FOREIGN KEY (livestock_group_id) REFERENCES livestock_groups(id) ON DELETE RESTRICT,
    CONSTRAINT chk_batch_source_valid CHECK (
        (source_type = 'HARVEST_RECORD' AND harvest_record_id IS NOT NULL AND crop_season_id IS NULL AND livestock_group_id IS NULL) OR
        (source_type = 'CROP_SEASON' AND crop_season_id IS NOT NULL AND harvest_record_id IS NULL AND livestock_group_id IS NULL) OR
        (source_type = 'LIVESTOCK_GROUP' AND livestock_group_id IS NOT NULL AND harvest_record_id IS NULL AND crop_season_id IS NULL)
    ),
    CONSTRAINT chk_batch_source_qty CHECK (contributed_quantity > 0.00),
    INDEX idx_batch_sources_batch (product_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 46. Phiếu Kiểm định Chất lượng Thành phẩm (QC Inspections - Bổ sung mới)
CREATE TABLE IF NOT EXISTS qc_inspections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    product_batch_id BIGINT NOT NULL,
    inspection_code VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_user_id BIGINT NULL,
    sample_size DECIMAL(10, 2) NOT NULL,
    sample_unit VARCHAR(30) NOT NULL,
    overall_result VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PASSED, REJECTED, CONDITIONAL
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_qc_inspections_batch_composite FOREIGN KEY (tenant_id, farm_id, product_batch_id) REFERENCES product_batches(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_qc_inspections_user FOREIGN KEY (inspector_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_qc_sample_size CHECK (sample_size > 0.00),
    CONSTRAINT chk_qc_result CHECK (overall_result IN ('PENDING', 'PASSED', 'REJECTED', 'CONDITIONAL')),
    UNIQUE KEY uk_qc_inspections_code (tenant_id, farm_id, inspection_code),
    UNIQUE KEY uk_qc_inspections_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_qc_inspections_tenant (tenant_id),
    INDEX idx_qc_inspections_batch (product_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 47. Chi tiết Chỉ tiêu Kiểm định QC (QC Inspection Items - Bổ sung mới)
CREATE TABLE IF NOT EXISTS qc_inspection_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    parameter_name VARCHAR(150) NOT NULL,                  -- Ví dụ: Dư lượng thuốc BVTV, Độ Brix ngọt, Hình thức ngoại quan, Vi sinh
    standard_threshold VARCHAR(100) NOT NULL,              -- Chuẩn: <= 0.01 ppm, >= 12 Brix
    measured_value VARCHAR(100) NOT NULL,                  -- Đo thực tế: 0.00 ppm, 13.5 Brix
    is_passed BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_qc_items_inspection FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id) ON DELETE CASCADE,
    INDEX idx_qc_items_inspection (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 48. Sổ theo dõi Biến động Thành phẩm (Product Batch Transactions / Finished Goods Ledger)
-- Bảo vệ lịch sử: ON DELETE RESTRICT, kiểm tra toàn vẹn toán học
CREATE TABLE IF NOT EXISTS product_batch_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    product_batch_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,                 -- HARVEST_IN, SALE_DISPATCH, DAMAGE_WRITE_OFF, RECALL_IN, RETURN_RESTOCK
    reference_type VARCHAR(50) NOT NULL,                   -- SALES_DELIVERY, HARVEST_RECORD, QC_RECALL, MANUAL_ADJUST
    reference_id BIGINT NOT NULL,
    reference_item_id BIGINT NULL,
    direction VARCHAR(10) NOT NULL,                        -- IN, OUT
    quantity DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    CONSTRAINT fk_batch_trans_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_trans_batch_composite FOREIGN KEY (tenant_id, farm_id, product_batch_id) REFERENCES product_batches(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_batch_trans_direction CHECK (direction IN ('IN', 'OUT')),
    CONSTRAINT chk_batch_trans_qty CHECK (quantity > 0.00),
    CONSTRAINT chk_batch_trans_balances CHECK (balance_before >= 0.00 AND balance_after >= 0.00),
    CONSTRAINT chk_batch_trans_balance_math CHECK (
        (direction = 'IN' AND balance_after = balance_before + quantity) OR
        (direction = 'OUT' AND balance_after = balance_before - quantity)
    ),
    INDEX idx_batch_trans_tenant (tenant_id),
    INDEX idx_batch_trans_farm (farm_id),
    INDEX idx_batch_trans_batch (product_batch_id),
    INDEX idx_batch_trans_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 49. Bản chụp hồ sơ canh tác bất biến đóng băng khi xuất lô (Traceability Snapshots)
-- Bất biến, bảo vệ pháp lý: ON DELETE RESTRICT
CREATE TABLE IF NOT EXISTS traceability_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    product_batch_id BIGINT NOT NULL UNIQUE,
    enterprise_info_json JSON NOT NULL,
    vietgap_cert_json JSON,
    farming_timeline_json JSON NOT NULL,
    harvest_info_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_snapshots_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_snapshots_batch FOREIGN KEY (product_batch_id) REFERENCES product_batches(id) ON DELETE RESTRICT,
    INDEX idx_traceability_snapshots_tenant (tenant_id),
    INDEX idx_traceability_snapshots_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 50. Nhật ký in tem nhãn nhiệt tập trung tại Bàn đóng gói Kho (Label Print Logs)
CREATE TABLE IF NOT EXISTS label_print_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    product_batch_id BIGINT NOT NULL,
    printed_by_user_id BIGINT NULL,
    label_size VARCHAR(20) NOT NULL,                       -- 50x50, 35x22
    print_quantity INT NOT NULL,
    printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printer_model VARCHAR(100),
    CONSTRAINT fk_label_print_logs_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_label_print_logs_batch FOREIGN KEY (product_batch_id) REFERENCES product_batches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_label_print_logs_user FOREIGN KEY (printed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_label_print_qty CHECK (print_quantity > 0),
    INDEX idx_label_print_logs_tenant (tenant_id),
    INDEX idx_label_print_logs_farm (farm_id),
    INDEX idx_label_print_logs_batch (product_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 8: NHÂN SỰ VÀ TỔ CHỨC CÔNG VIỆC (HR, ATTENDANCE & TASKS)
-- ==============================================================================

-- 51. Hồ sơ Nhân viên trang trại (Employees)
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NULL,                                   -- NULL nếu nhân sự văn phòng điều hành công ty
    user_id BIGINT NULL,                                   -- Tài khoản đăng nhập hệ thống nếu có
    employee_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    id_card_number VARCHAR(30),
    position VARCHAR(100),
    department VARCHAR(100),
    joined_date DATE NOT NULL,
    base_salary DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    contract_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',-- FULL_TIME, PART_TIME, SEASONAL, INTERN
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, ON_LEAVE, RESIGNED, TERMINATED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_farm_composite FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_employees_salaries CHECK (base_salary >= 0.00 AND hourly_rate >= 0.00),
    CONSTRAINT chk_employees_contract CHECK (contract_type IN ('FULL_TIME', 'PART_TIME', 'SEASONAL', 'INTERN')),
    CONSTRAINT chk_employees_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED')),
    UNIQUE KEY uk_employees_tenant_code (tenant_id, employee_code),
    UNIQUE KEY uk_employees_tenant_id (tenant_id, id),
    INDEX idx_employees_tenant (tenant_id),
    INDEX idx_employees_farm (farm_id),
    INDEX idx_employees_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 52. Danh mục Ca làm việc (Work Shifts)
CREATE TABLE IF NOT EXISTS work_shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NULL,                                   -- NULL nếu là ca chuẩn dùng chung toàn tenant
    name VARCHAR(100) NOT NULL,
    shift_code VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_overnight BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_work_shifts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_shifts_farm_composite FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    UNIQUE KEY uk_work_shifts_code (tenant_id, shift_code),
    UNIQUE KEY uk_work_shifts_tenant_id (tenant_id, id),
    INDEX idx_work_shifts_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 53. Phân ca làm việc chi tiết (Shift Assignments)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    shift_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',       -- SCHEDULED, COMPLETED, ABSENT, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_shift_assignments_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_employee_composite FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_shift_composite FOREIGN KEY (tenant_id, shift_id) REFERENCES work_shifts(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_shift_assignments_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED')),
    UNIQUE KEY uk_employee_shift_date (employee_id, work_date, shift_id),
    INDEX idx_shift_assignments_tenant (tenant_id),
    INDEX idx_shift_assignments_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 54. Chấm công GPS di động (Time Attendances)
CREATE TABLE IF NOT EXISTS time_attendances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    shift_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    gps_distance_m DECIMAL(8, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'VALID',           -- VALID, LATE, EARLY_DEPARTURE, OUT_OF_RANGE, ABSENT
    notes VARCHAR(255),
    is_adjusted BOOLEAN NOT NULL DEFAULT FALSE,
    adjusted_by_user_id BIGINT NULL,
    adjustment_reason VARCHAR(500) NULL,
    original_check_in TIMESTAMP NULL,
    original_check_out TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_time_attendances_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_time_attendances_employee_composite FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_time_attendances_shift_composite FOREIGN KEY (tenant_id, shift_id) REFERENCES work_shifts(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_time_attendances_adjusted_by FOREIGN KEY (adjusted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_time_attendances_times CHECK (check_out_time IS NULL OR check_out_time >= check_in_time),
    CONSTRAINT chk_time_attendances_status CHECK (status IN ('VALID', 'LATE', 'EARLY_DEPARTURE', 'OUT_OF_RANGE', 'ABSENT')),
    UNIQUE KEY uk_employee_attendance_date (employee_id, work_date, shift_id),
    INDEX idx_time_attendances_tenant (tenant_id),
    INDEX idx_time_attendances_farm (farm_id),
    INDEX idx_time_attendances_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 55. Đơn xin nghỉ phép (Leave Requests)
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    leave_type VARCHAR(50) NOT NULL,                       -- ANNUAL_LEAVE, SICK_LEAVE, UNPAID_LEAVE, MATERNITY_LEAVE, BEREAVEMENT_LEAVE
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4, 1) NOT NULL DEFAULT 1.0,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',         -- PENDING, APPROVED, REJECTED, CANCELLED
    approved_by_user_id BIGINT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_leave_requests_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_employee_composite FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_leave_requests_dates CHECK (end_date >= start_date AND total_days > 0.0),
    CONSTRAINT chk_leave_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    INDEX idx_leave_requests_tenant (tenant_id),
    INDEX idx_leave_requests_farm (farm_id),
    INDEX idx_leave_requests_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 56. Đơn đăng ký làm thêm giờ / tăng ca (Overtime Requests)
CREATE TABLE IF NOT EXISTS overtime_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    shift_id BIGINT NULL,
    ot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4, 2) NOT NULL,
    ot_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.50,     -- 1.50 Ngày thường, 2.00 Cuối tuần, 3.00 Ngày lễ
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',         -- PENDING, APPROVED, REJECTED, CANCELLED
    approved_by_user_id BIGINT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_overtime_requests_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_overtime_requests_employee_composite FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_overtime_requests_shift FOREIGN KEY (shift_id) REFERENCES work_shifts(id) ON DELETE SET NULL,
    CONSTRAINT fk_overtime_requests_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_overtime_requests_hours CHECK (total_hours > 0.00 AND ot_multiplier >= 1.00),
    CONSTRAINT chk_overtime_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    INDEX idx_overtime_requests_tenant (tenant_id),
    INDEX idx_overtime_requests_farm (farm_id),
    INDEX idx_overtime_requests_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 57. Quản lý Nhiệm vụ hiện trường (Farm Tasks - Bảng Kanban)
CREATE TABLE IF NOT EXISTS farm_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    zone_id BIGINT NULL,
    task_title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,                         -- PLANTING, FERTILIZING, HARVESTING, FEEDING, MAINTENANCE, SANITATION
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',        -- LOW, MEDIUM, HIGH, URGENT
    assigned_to_employee_id BIGINT NULL,                   -- Nhân viên phụ trách chính
    assigned_by_user_id BIGINT NULL,
    deadline TIMESTAMP NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'TODO',            -- TODO, IN_PROGRESS, PENDING_REVIEW, DONE, CANCELLED
    completion_notes TEXT,
    photos_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farm_tasks_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_tasks_zone FOREIGN KEY (zone_id) REFERENCES production_zones(id) ON DELETE SET NULL,
    CONSTRAINT fk_farm_tasks_assigned_to FOREIGN KEY (assigned_to_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_farm_tasks_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_farm_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_farm_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'PENDING_REVIEW', 'DONE', 'CANCELLED')),
    UNIQUE KEY uk_farm_tasks_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_farm_tasks_tenant (tenant_id),
    INDEX idx_farm_tasks_farm (farm_id),
    INDEX idx_farm_tasks_assigned (assigned_to_employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 58. Bảng Phân công Đa nhân viên cho Nhiệm vụ (Farm Task Assignees)
CREATE TABLE IF NOT EXISTS farm_task_assignees (
    task_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_in_task VARCHAR(50) DEFAULT 'MEMBER',             -- LEADER, MEMBER
    PRIMARY KEY (task_id, employee_id),
    CONSTRAINT fk_task_assignees_task FOREIGN KEY (task_id) REFERENCES farm_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignees_employee_composite FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, id) ON DELETE CASCADE,
    INDEX idx_task_assignees_emp (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- PHẦN 9: TÀI CHÍNH, BÁN HÀNG, CÔNG NỢ VÀ THANH TOÁN (FINANCE & SETTLEMENTS)
-- ==============================================================================

-- 59. Danh mục Khoản mục Chi phí (Cost Categories)
CREATE TABLE IF NOT EXISTS cost_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    cost_type VARCHAR(50) NOT NULL,                         -- MATERIALS, DIRECT_LABOR, MACHINERY_FUEL, DEPRECIATION, INDIRECT_OVERHEAD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_cost_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT chk_cost_categories_type CHECK (cost_type IN ('MATERIALS', 'DIRECT_LABOR', 'MACHINERY_FUEL', 'DEPRECIATION', 'INDIRECT_OVERHEAD')),
    UNIQUE KEY uk_cost_categories_code (tenant_id, code),
    UNIQUE KEY uk_cost_categories_tenant_id (tenant_id, id),
    INDEX idx_cost_categories_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 60. Sổ Ghi nhận Chi phí Vận hành (Farm Expenses)
CREATE TABLE IF NOT EXISTS farm_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    cost_category_id BIGINT NOT NULL,
    expense_code VARCHAR(50) NOT NULL,
    expense_source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',  -- MANUAL, INVENTORY_BACKFLUSH, PAYROLL_ALLOCATION, UTILITY_BILL
    reference_id BIGINT NULL,                              -- ID tham chiếu phiếu xuất kho hoặc kỳ lương
    season_id BIGINT NULL,                                 -- Liên kết trực tiếp mùa vụ (nếu áp dụng)
    livestock_group_id BIGINT NULL,                        -- Liên kết trực tiếp lứa chăn nuôi (nếu áp dụng)
    expense_date DATE NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    unit_cost_eligible BOOLEAN NOT NULL DEFAULT TRUE,      -- Tính vào Giá thành đơn vị sản phẩm
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',    -- CASH, BANK_TRANSFER, TRADE_CREDIT
    recipient_name VARCHAR(150),
    receipt_photo_url VARCHAR(500),
    notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',       -- DRAFT, CONFIRMED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_farm_expenses_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farm_expenses_category_composite FOREIGN KEY (tenant_id, cost_category_id) REFERENCES cost_categories(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farm_expenses_season_composite FOREIGN KEY (tenant_id, farm_id, season_id) REFERENCES crop_seasons(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_farm_expenses_livestock_composite FOREIGN KEY (tenant_id, farm_id, livestock_group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_farm_expenses_amount CHECK (amount >= 0.00),
    CONSTRAINT chk_farm_expenses_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    UNIQUE KEY uk_farm_expenses_code (tenant_id, farm_id, expense_code),
    UNIQUE KEY uk_farm_expenses_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_farm_expenses_tenant (tenant_id),
    INDEX idx_farm_expenses_farm (farm_id),
    INDEX idx_farm_expenses_source (expense_source, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 61. Phân bổ chi phí đa đối tượng (Cost Allocations)
CREATE TABLE IF NOT EXISTS cost_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    target_type VARCHAR(30) NOT NULL,                      -- CROP_SEASON, LIVESTOCK_GROUP, PRODUCTION_ZONE
    target_id BIGINT NOT NULL,
    allocated_amount DECIMAL(14, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_cost_allocations_expense FOREIGN KEY (expense_id) REFERENCES farm_expenses(id) ON DELETE CASCADE,
    CONSTRAINT chk_cost_allocations_amount CHECK (allocated_amount > 0.00),
    INDEX idx_cost_allocations_expense (expense_id),
    INDEX idx_cost_allocations_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 62. Đơn hàng Bán sỉ Nông sản (Sales Orders)
-- Ràng buộc toàn vẹn tài chính: subtotal - discount + vat = final, và final - paid = debt
CREATE TABLE IF NOT EXISTS sales_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    order_code VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,                            -- Khách thu mua / Đại lý (bắt buộc cùng tenant)
    order_date DATE NOT NULL,
    delivery_date DATE,
    subtotal_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,  -- Tiền hàng trước chiết khấu và thuế
    discount_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,  -- Tiền chiết khấu
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,          -- Tỷ lệ VAT (%)
    vat_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,       -- Tiền thuế VAT
    final_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,     -- Tổng thanh toán thực tế (Subtotal - Discount + VAT)
    paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,      -- Tiền đã trả tích lũy
    debt_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,      -- Tiền nợ còn lại (Final - Paid)
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',  -- UNPAID, PARTIALLY_PAID, PAID, REFUNDED
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',         -- PENDING, CONFIRMED, DELIVERED, COMPLETED, CANCELLED
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_sales_orders_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_orders_partner_composite FOREIGN KEY (tenant_id, partner_id) REFERENCES partners(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_sales_orders_financials CHECK (
        subtotal_amount >= 0.00 AND
        discount_amount >= 0.00 AND discount_amount <= subtotal_amount AND
        vat_rate >= 0.00 AND vat_rate <= 100.00 AND
        vat_amount >= 0.00 AND
        final_amount >= 0.00 AND
        paid_amount >= 0.00 AND
        debt_amount >= 0.00 AND
        paid_amount <= final_amount AND
        final_amount = (subtotal_amount - discount_amount + vat_amount) AND
        debt_amount = (final_amount - paid_amount)
    ),
    CONSTRAINT chk_sales_orders_payment_status CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED')),
    CONSTRAINT chk_sales_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
    UNIQUE KEY uk_sales_orders_code (tenant_id, farm_id, order_code),
    UNIQUE KEY uk_sales_orders_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_sales_orders_tenant (tenant_id),
    INDEX idx_sales_orders_farm (farm_id),
    INDEX idx_sales_orders_partner (partner_id),
    INDEX idx_sales_orders_payment (payment_status),
    INDEX idx_sales_orders_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 63. Chi tiết Mặt hàng Đơn bán (Sales Order Items)
-- Hỗ trợ theo dõi tiến độ giao hàng: shipped_quantity
CREATE TABLE IF NOT EXISTS sales_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT NOT NULL,
    product_batch_id BIGINT NULL,                          -- Lô dự kiến ban đầu (nếu có chỉ định)
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    shipped_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Số lượng đã giao thực tế qua các phiếu giao hàng
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL,
    discount_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    vat_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,     -- Thành tiền sau chiết khấu và thuế
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_sales_order_items_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_order_items_batch FOREIGN KEY (product_batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    CONSTRAINT chk_sales_order_items_qty CHECK (quantity > 0.00),
    CONSTRAINT chk_sales_order_items_shipped CHECK (shipped_quantity >= 0.00 AND shipped_quantity <= quantity),
    CONSTRAINT chk_sales_order_items_prices CHECK (
        unit_price >= 0.00 AND
        discount_amount >= 0.00 AND
        vat_amount >= 0.00 AND
        final_amount >= 0.00
    ),
    INDEX idx_sales_order_items_order (sales_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 64. Phiếu Giao hàng / Xuất bán nhiều đợt (Sales Deliveries - Bổ sung mới)
CREATE TABLE IF NOT EXISTS sales_deliveries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    sales_order_id BIGINT NOT NULL,
    delivery_code VARCHAR(50) NOT NULL,
    delivery_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',           -- DRAFT, DISPATCHED, DELIVERED, CANCELLED
    delivered_by_user_id BIGINT NULL,
    receiver_name VARCHAR(150),
    shipping_address VARCHAR(500),
    tracking_number VARCHAR(100),
    total_shipped_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_sales_deliveries_order_composite FOREIGN KEY (tenant_id, farm_id, sales_order_id) REFERENCES sales_orders(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_deliveries_user FOREIGN KEY (delivered_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_sales_deliveries_status CHECK (status IN ('DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT chk_sales_deliveries_amount CHECK (total_shipped_amount >= 0.00),
    UNIQUE KEY uk_sales_deliveries_code (tenant_id, farm_id, delivery_code),
    UNIQUE KEY uk_sales_deliveries_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_sales_deliveries_tenant (tenant_id),
    INDEX idx_sales_deliveries_farm (farm_id),
    INDEX idx_sales_deliveries_order (sales_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 65. Chi tiết Xuất giao hàng theo Lô Thành phẩm (Sales Delivery Items - Bổ sung mới)
-- Cho phép 1 dòng đơn bán được giao từ nhiều lô thành phẩm khác nhau
CREATE TABLE IF NOT EXISTS sales_delivery_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT NOT NULL,
    sales_order_item_id BIGINT NOT NULL,
    product_batch_id BIGINT NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_items_delivery FOREIGN KEY (delivery_id) REFERENCES sales_deliveries(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_items_order_item FOREIGN KEY (sales_order_item_id) REFERENCES sales_order_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_items_batch FOREIGN KEY (product_batch_id) REFERENCES product_batches(id) ON DELETE RESTRICT,
    CONSTRAINT chk_delivery_item_qty CHECK (quantity > 0.00),
    CONSTRAINT chk_delivery_item_cost CHECK (unit_price >= 0.00 AND total_price >= 0.00),
    INDEX idx_delivery_items_delivery (delivery_id),
    INDEX idx_delivery_items_order_item (sales_order_item_id),
    INDEX idx_delivery_items_batch (product_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 66. Sổ Công nợ Mua bán (Debt Records)
CREATE TABLE IF NOT EXISTS debt_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    sales_order_id BIGINT NULL,                            -- Gốc nợ từ đơn bán
    warehouse_receipt_id BIGINT NULL,                      -- Gốc nợ từ phiếu nhập mua vật tư
    debt_type VARCHAR(30) NOT NULL,                        -- RECEIVABLE (Phải thu), PAYABLE (Phải trả)
    total_debt DECIMAL(14, 2) NOT NULL,
    paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    remaining_debt DECIMAL(14, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, OVERDUE, SETTLED, BAD_DEBT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_debt_records_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_debt_records_partner_composite FOREIGN KEY (tenant_id, partner_id) REFERENCES partners(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_debt_records_order_composite FOREIGN KEY (tenant_id, farm_id, sales_order_id) REFERENCES sales_orders(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_debt_records_receipt_composite FOREIGN KEY (tenant_id, farm_id, warehouse_receipt_id) REFERENCES warehouse_receipts(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_debt_records_type CHECK (debt_type IN ('RECEIVABLE', 'PAYABLE')),
    CONSTRAINT chk_debt_records_status CHECK (status IN ('ACTIVE', 'OVERDUE', 'SETTLED', 'BAD_DEBT')),
    CONSTRAINT chk_debt_records_amounts CHECK (
        total_debt >= 0.00 AND
        paid_amount >= 0.00 AND
        remaining_debt >= 0.00 AND
        paid_amount <= total_debt AND
        remaining_debt = (total_debt - paid_amount)
    ),
    UNIQUE KEY uk_debt_records_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_debt_records_tenant (tenant_id),
    INDEX idx_debt_records_farm (farm_id),
    INDEX idx_debt_records_partner (partner_id),
    INDEX idx_debt_records_due (due_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 67. Sổ Giao dịch Thanh toán Thu/Chi/Công nợ (Payment Transactions)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    payment_code VARCHAR(50) NOT NULL,
    payment_type VARCHAR(30) NOT NULL,                     -- RECEIPT (Thu tiền khách), PAYMENT (Chi trả NCC), REFUND (Hoàn tiền)
    partner_id BIGINT NULL,
    sales_order_id BIGINT NULL,
    warehouse_receipt_id BIGINT NULL,
    debt_record_id BIGINT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    allocated_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00, -- Số tiền đã được phân bổ cho các chứng từ nợ cụ thể
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER', -- CASH, BANK_TRANSFER, E_WALLET
    reference_code VARCHAR(100),                           -- Mã giao dịch ngân hàng / hóa đơn
    payment_date DATE NOT NULL,
    notes VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',         -- PENDING, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_payment_trans_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_trans_partner_composite FOREIGN KEY (tenant_id, partner_id) REFERENCES partners(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_trans_order_composite FOREIGN KEY (tenant_id, farm_id, sales_order_id) REFERENCES sales_orders(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_trans_receipt_composite FOREIGN KEY (tenant_id, farm_id, warehouse_receipt_id) REFERENCES warehouse_receipts(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_trans_debt_composite FOREIGN KEY (tenant_id, farm_id, debt_record_id) REFERENCES debt_records(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_payment_trans_amount CHECK (amount > 0.00),
    CONSTRAINT chk_payment_trans_alloc CHECK (allocated_amount >= 0.00 AND allocated_amount <= amount),
    CONSTRAINT chk_payment_trans_type CHECK (payment_type IN ('RECEIPT', 'PAYMENT', 'REFUND')),
    CONSTRAINT chk_payment_trans_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    UNIQUE KEY uk_payment_transactions_code (tenant_id, farm_id, payment_code),
    UNIQUE KEY uk_payment_transactions_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_payment_trans_tenant (tenant_id),
    INDEX idx_payment_trans_farm (farm_id),
    INDEX idx_payment_trans_partner (partner_id),
    INDEX idx_payment_trans_order (sales_order_id),
    INDEX idx_payment_trans_debt (debt_record_id),
    INDEX idx_payment_trans_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 68. Phân bổ Giao dịch Thanh toán cho Nhiều Khoản nợ (Payment Allocations - Bổ sung mới)
-- Cho phép 1 giao dịch thanh toán ngân hàng được chia nhỏ để tất toán nhiều hóa đơn/khoản nợ
CREATE TABLE IF NOT EXISTS payment_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    payment_id BIGINT NOT NULL,
    debt_record_id BIGINT NOT NULL,
    allocated_amount DECIMAL(14, 2) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_alloc_payment_composite FOREIGN KEY (tenant_id, farm_id, payment_id) REFERENCES payment_transactions(tenant_id, farm_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_alloc_debt_composite FOREIGN KEY (tenant_id, farm_id, debt_record_id) REFERENCES debt_records(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_payment_alloc_amount CHECK (allocated_amount > 0.00),
    UNIQUE KEY uk_payment_allocations_pay_debt (payment_id, debt_record_id),
    INDEX idx_payment_alloc_tenant (tenant_id),
    INDEX idx_payment_alloc_farm (farm_id),
    INDEX idx_payment_alloc_debt (debt_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 69. Kế hoạch Ngân sách mùa vụ (Budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    operational_cycle_id BIGINT NULL,
    name VARCHAR(150) NOT NULL,
    fiscal_year INT NOT NULL,
    total_budget_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',          -- DRAFT, ACTIVE, CLOSED, REVISED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_budgets_farm_tenant FOREIGN KEY (tenant_id, farm_id) REFERENCES farms(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_budgets_cycle_composite FOREIGN KEY (tenant_id, farm_id, operational_cycle_id) REFERENCES operational_cycles(tenant_id, farm_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_budgets_amount CHECK (total_budget_amount >= 0.00),
    CONSTRAINT chk_budgets_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'REVISED')),
    UNIQUE KEY uk_budgets_farm_year_name (farm_id, fiscal_year, name),
    UNIQUE KEY uk_budgets_tenant_farm_id (tenant_id, farm_id, id),
    INDEX idx_budgets_tenant (tenant_id),
    INDEX idx_budgets_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 70. Chi tiết Hạng mục Ngân sách (Budget Line Items)
CREATE TABLE IF NOT EXISTS budget_line_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    budget_id BIGINT NOT NULL,
    cost_category_id BIGINT NOT NULL,
    allocated_amount DECIMAL(14, 2) NOT NULL,
    spent_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_budget_line_items_budget FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_line_items_category FOREIGN KEY (cost_category_id) REFERENCES cost_categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_budget_line_items_amounts CHECK (allocated_amount >= 0.00 AND spent_amount >= 0.00),
    INDEX idx_budget_line_items_budget (budget_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- PHẦN 10: DỮ LIỆU KHỞI TẠO CỐT LÕI (DEFAULT ROLES & PERMISSIONS SEED DATA)
-- ==============================================================================

-- 1. Khởi tạo Danh mục Vai trò (Roles)
INSERT INTO roles (code, name, scope_level, description) VALUES
('ROLE_SUPER_ADMIN', 'Quản trị viên toàn hệ thống', 'SYSTEM', 'Toàn quyền cấu hình nền tảng SaaS đa khách hàng'),
('ROLE_FARM_OWNER', 'Chủ trang trại / Giám đốc HTX', 'TENANT', 'Quản trị toàn diện hoạt động, tài chính và phân quyền trong doanh nghiệp'),
('ROLE_FIELD_STAFF', 'Nhân viên nông vụ / Hiện trường', 'FARM', 'Ghi chép nhật ký canh tác, chăm sóc cây trồng, đàn vật nuôi'),
('ROLE_WAREHOUSE_STAFF', 'Thủ kho vật tư & Thành phẩm', 'FARM', 'Quản lý xuất nhập tồn, điều chuyển, kiểm kê và in tem truy xuất'),
('ROLE_TECHNICAL_STAFF', 'Kỹ thuật viên trưởng / Bác sĩ Thú y', 'FARM', 'Kiểm tra chất lượng QC, thú y điều trị và phê duyệt xuất xưởng'),
('ROLE_ACCOUNTANT', 'Kế toán nông trại', 'TENANT', 'Quản lý doanh thu, chi phí, công nợ mua bán và phân bổ thanh toán')
ON DUPLICATE KEY UPDATE name = VALUES(name), scope_level = VALUES(scope_level), description = VALUES(description);

-- 2. Khởi tạo Danh mục Quyền hạn (Permissions)
INSERT INTO permissions (code, module, action, resource, description) VALUES
-- System & Platform
('PERM_TENANT_MANAGE', 'SYSTEM', 'APPROVE', 'TENANT', 'Quản trị danh sách khách hàng thuê nền tảng'),
-- Farm & Organization
('PERM_FARM_CREATE', 'FARM', 'CREATE', 'FARM', 'Tạo mới trang trại'),
('PERM_FARM_VIEW', 'FARM', 'READ', 'FARM', 'Xem danh sách và thông tin trang trại'),
('PERM_FARM_UPDATE', 'FARM', 'UPDATE', 'FARM', 'Cập nhật thông tin trang trại'),
('PERM_ZONE_MANAGE', 'FARM', 'CREATE', 'ZONE', 'Phân chia nhà màng, đồng ruộng, dãy chuồng'),
-- Crop Production
('PERM_CROP_VIEW', 'CROP', 'READ', 'CROP_SEASON', 'Xem mùa vụ và nhật ký canh tác'),
('PERM_CROP_PLAN', 'CROP', 'CREATE', 'CROP_SEASON', 'Lập kế hoạch mùa vụ trồng trọt'),
('PERM_CROP_LOG', 'CROP', 'CREATE', 'FARMING_LOG', 'Ghi nhật ký phân bón, tưới tiêu, sâu bệnh'),
-- Livestock Production
('PERM_LIVESTOCK_VIEW', 'LIVESTOCK', 'READ', 'LIVESTOCK', 'Xem đàn và cá thể vật nuôi RFID'),
('PERM_LIVESTOCK_MANAGE', 'LIVESTOCK', 'CREATE', 'LIVESTOCK', 'Nhập đàn, tách đàn, quản lý thẻ tai RFID'),
('PERM_LIVESTOCK_VET', 'LIVESTOCK', 'CREATE', 'VET_EVENT', 'Ghi nhật ký tiêm phòng, dịch bệnh và thú y'),
-- Inventory
('PERM_INVENTORY_VIEW', 'INVENTORY', 'READ', 'INVENTORY', 'Xem tồn kho theo lô FIFO/FEFO và thẻ kho'),
('PERM_INVENTORY_RECEIPT', 'INVENTORY', 'CREATE', 'RECEIPT', 'Lập phiếu nhập kho vật tư nông nghiệp'),
('PERM_INVENTORY_ISSUE', 'INVENTORY', 'CREATE', 'ISSUE', 'Lập phiếu xuất kho vật tư sản xuất'),
('PERM_INVENTORY_TRANSFER', 'INVENTORY', 'CREATE', 'TRANSFER', 'Điều chuyển vật tư liên kho / liên trang trại'),
('PERM_INVENTORY_STOCKTAKE', 'INVENTORY', 'CREATE', 'STOCKTAKE', 'Kiểm kê kho và cân chỉnh thừa thiếu'),
-- Harvest & QC
('PERM_HARVEST_MANAGE', 'HARVEST', 'CREATE', 'HARVEST_RECORD', 'Ghi nhận sản lượng thu hoạch nông sản'),
('PERM_QC_INSPECT', 'QC', 'CREATE', 'QC_INSPECTION', 'Kiểm định chỉ tiêu chất lượng và phân loại lô'),
('PERM_QC_APPROVE', 'QC', 'APPROVE', 'BATCH', 'Phê duyệt lô thành phẩm xuất xưởng & sinh mã QR'),
('PERM_LABEL_PRINT', 'QC', 'EXPORT', 'LABEL', 'In tem nhãn nhiệt mã QR truy xuất nguồn gốc'),
('PERM_QC_RECALL', 'QC', 'APPROVE', 'RECALL', 'Thu hồi lô thành phẩm có lỗi chất lượng'),
-- Delivery & Sales
('PERM_DELIVERY_MANAGE', 'DELIVERY', 'CREATE', 'DELIVERY', 'Lập phiếu xuất giao hàng theo đợt từ lô thành phẩm'),
-- HR & Tasks
('PERM_HR_EMPLOYEE_MANAGE', 'HR', 'CREATE', 'EMPLOYEE', 'Quản lý hồ sơ nhân viên và hợp đồng'),
('PERM_HR_ATTENDANCE', 'HR', 'READ', 'ATTENDANCE', 'Chấm công GPS và duyệt đơn nghỉ phép'),
('PERM_TASK_ASSIGN', 'HR', 'CREATE', 'TASK', 'Giao nhiệm vụ hiện trường trên bảng Kanban'),
-- Finance & Costing
('PERM_FINANCE_EXPENSE', 'FINANCE', 'CREATE', 'EXPENSE', 'Ghi nhận chi phí vận hành và phân bổ giá thành'),
('PERM_FINANCE_SALES_ORDER', 'FINANCE', 'CREATE', 'ORDER', 'Lập đơn bán sỉ nông sản'),
('PERM_FINANCE_PAYMENT', 'FINANCE', 'CREATE', 'PAYMENT', 'Ghi nhận giao dịch thanh toán ngân hàng / tiền mặt'),
('PERM_PAYMENT_ALLOCATE', 'FINANCE', 'UPDATE', 'ALLOCATION', 'Phân bổ thanh toán cho các khoản công nợ'),
('PERM_FINANCE_REPORT', 'FINANCE', 'READ', 'REPORT', 'Xem báo cáo tài chính, dòng tiền và chi phí sản xuất')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 3. Gán Quyền cho Role Chủ trang trại (ROLE_FARM_OWNER)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_OWNER' AND p.code IN (
    'PERM_FARM_CREATE', 'PERM_FARM_VIEW', 'PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE',
    'PERM_CROP_VIEW', 'PERM_CROP_PLAN', 'PERM_CROP_LOG',
    'PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET',
    'PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_TRANSFER', 'PERM_INVENTORY_STOCKTAKE',
    'PERM_HARVEST_MANAGE', 'PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_LABEL_PRINT', 'PERM_QC_RECALL',
    'PERM_DELIVERY_MANAGE', 'PERM_HR_EMPLOYEE_MANAGE', 'PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN',
    'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_PAYMENT', 'PERM_PAYMENT_ALLOCATE', 'PERM_FINANCE_REPORT'
);

-- 4. Gán Quyền cho Role Nhân viên Nông vụ / Hiện trường (ROLE_FIELD_STAFF)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FIELD_STAFF' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_LOG',
    'PERM_LIVESTOCK_VIEW', 'PERM_HARVEST_MANAGE', 'PERM_HR_ATTENDANCE'
);

-- 5. Gán Quyền cho Role Thủ kho (ROLE_WAREHOUSE_STAFF)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_WAREHOUSE_STAFF' AND p.code IN (
    'PERM_FARM_VIEW',
    'PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE', 'PERM_INVENTORY_TRANSFER', 'PERM_INVENTORY_STOCKTAKE',
    'PERM_LABEL_PRINT', 'PERM_DELIVERY_MANAGE', 'PERM_HR_ATTENDANCE'
);

-- 6. Gán Quyền cho Role Kỹ thuật viên trưởng / Bác sĩ Thú y (ROLE_TECHNICAL_STAFF)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_TECHNICAL_STAFF' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_PLAN',
    'PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET',
    'PERM_QC_INSPECT', 'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_HR_ATTENDANCE'
);

-- 7. Gán Quyền cho Role Kế toán (ROLE_ACCOUNTANT)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_ACCOUNTANT' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_INVENTORY_VIEW',
    'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_PAYMENT', 'PERM_PAYMENT_ALLOCATE', 'PERM_FINANCE_REPORT',
    'PERM_HR_ATTENDANCE'
);
