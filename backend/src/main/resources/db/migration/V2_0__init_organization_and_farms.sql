-- =============================================================================
-- Migration: V2_0__init_organization_and_farms.sql
-- Description: Khởi tạo phân hệ Core SaaS: Tổ chức & Trang trại (Phase 2 - Module 1)
-- Author: Senior Full-stack Software Engineer & Technical Lead
-- Database: MySQL 8.x (InnoDB, utf8mb4)
-- =============================================================================

-- 1. BẢNG ENTERPRISES (Hồ sơ pháp lý Doanh nghiệp / Hợp tác xã của Tenant)
CREATE TABLE IF NOT EXISTS `enterprises` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `tax_number` VARCHAR(50) NOT NULL,
    `legal_representative` VARCHAR(100) NOT NULL,
    `headquarter_address` VARCHAR(500) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `website` VARCHAR(255) NULL,
    `logo_url` VARCHAR(500) NULL,
    `established_date` DATE NULL,
    `certifications_json` JSON NULL COMMENT 'Lưu thông tin chứng nhận VietGAP, GlobalGAP, ngày cấp, hạn và URL chứng nhận',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_enterprises_tenant` UNIQUE (`tenant_id`),
    CONSTRAINT `fk_enterprises_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG FARMS (Danh mục các cơ sở trang trại thuộc Tenant)
CREATE TABLE IF NOT EXISTS `farms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `farm_type` VARCHAR(50) NOT NULL DEFAULT 'TRONG_TROT' COMMENT 'TRONG_TROT, CHAN_NUOI, HON_HOP',
    `total_area_m2` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `latitude` DECIMAL(10,7) NULL,
    `longitude` DECIMAL(10,7) NULL,
    `address` VARCHAR(500) NOT NULL,
    `manager_user_id` BIGINT UNSIGNED NULL COMMENT 'Người đại diện hoặc Trưởng trang trại',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE, MAINTENANCE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_farms_tenant_code` UNIQUE (`tenant_id`, `code`),
    CONSTRAINT `fk_farms_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farms_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_farms_tenant_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG PRODUCTION_ZONES (Phân khu sản xuất: Nhà màng, Đồng ruộng, Chuồng trại)
CREATE TABLE IF NOT EXISTS `production_zones` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `zone_type` VARCHAR(50) NOT NULL DEFAULT 'NHA_MANG' COMMENT 'NHA_MANG, DONG_RUONG, CHUONG_TRAI, KHO, HO_CHUA',
    `area_m2` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `soil_type` VARCHAR(100) NULL,
    `water_source` VARCHAR(100) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, CULTIVATING, ISOLATING, DISINFECTING, INACTIVE',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_zones_farm_code` UNIQUE (`farm_id`, `code`),
    CONSTRAINT `fk_zones_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_zones_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    INDEX `idx_zones_farm_type` (`farm_id`, `zone_type`),
    INDEX `idx_zones_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ZONE_LOCATIONS (Các ô đất nhỏ / lô phụ canh tác hoặc chuồng cụ thể bên trong zone)
CREATE TABLE IF NOT EXISTS `zone_locations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location_type` VARCHAR(50) NOT NULL DEFAULT 'O_DAT' COMMENT 'O_DAT, LUONG_RAU, CHUONG_NUOI, DAY_CHUONG, NGAN_KHO',
    `area_m2` DECIMAL(12,2) NULL,
    `capacity` INT NULL COMMENT 'Sức chứa tối đa (số con / số chậu cây / khối lượng kg)',
    `status` VARCHAR(30) NOT NULL DEFAULT 'EMPTY' COMMENT 'EMPTY, OCCUPIED, MAINTENANCE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_locations_zone_code` UNIQUE (`zone_id`, `code`),
    CONSTRAINT `fk_locations_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_locations_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE CASCADE,
    INDEX `idx_locations_zone` (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG FARM_ASSIGNMENTS (Bảng Phân công Quản lý & Nhân sự phụ trách Trang trại)
CREATE TABLE IF NOT EXISTS `farm_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_in_farm` VARCHAR(50) NOT NULL DEFAULT 'WORKER' COMMENT 'FARM_MANAGER, CHIEF_TECHNICIAN, VETERINARIAN, WAREHOUSE_SUPERVISOR, FIELD_LEAD, WORKER',
    `assigned_from` DATE NOT NULL,
    `assigned_to` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_assignments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assignments_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_farm_assignments_user` (`user_id`, `farm_id`, `is_active`),
    INDEX `idx_farm_assignments_farm` (`farm_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG OPERATIONAL_CYCLES (Chu kỳ vận hành / Năm tài chính / Niên vụ lớn của trang trại)
CREATE TABLE IF NOT EXISTS `operational_cycles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `fiscal_year` INT NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PREPARING' COMMENT 'PREPARING, RUNNING, CLOSED',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_cycles_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cycles_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    INDEX `idx_cycles_farm_status` (`farm_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG FARM_OPERATIONAL_SETTINGS (Cấu hình tham số vận hành riêng của từng trang trại)
CREATE TABLE IF NOT EXISTS `farm_operational_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `irrigation_threshold_json` JSON NULL COMMENT 'Ngưỡng độ ẩm đất, nhiệt độ kích hoạt tưới tiêu tự động',
    `work_shift_config_json` JSON NULL COMMENT 'Khung giờ các ca làm việc ngoài đồng ruộng',
    `general_settings_json` JSON NULL COMMENT 'Các cài đặt tham số mở rộng',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_farm_settings_farm` UNIQUE (`farm_id`),
    CONSTRAINT `fk_farm_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farm_settings_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG PARTNERS (Danh mục Đối tác & Chuỗi Cung Ứng chung toàn Tenant)
CREATE TABLE IF NOT EXISTS `partners` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `partner_type` VARCHAR(50) NOT NULL DEFAULT 'SUPPLIER' COMMENT 'SUPPLIER, DISTRIBUTOR, TRANSPORTER',
    `tax_code` VARCHAR(50) NULL,
    `contact_person` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `address` VARCHAR(500) NULL,
    `bank_account_info` VARCHAR(255) NULL,
    `credit_rating` VARCHAR(10) NOT NULL DEFAULT 'A' COMMENT 'A, B, C, D',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_partners_tenant_code` UNIQUE (`tenant_id`, `code`),
    CONSTRAINT `fk_partners_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    INDEX `idx_partners_tenant_type` (`tenant_id`, `partner_type`),
    INDEX `idx_partners_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
