-- =============================================================================
-- Migration: V3_0__init_production_and_inventory.sql
-- Description: Khởi tạo phân hệ Phase 3: Vận hành Cốt lõi - Sản xuất & Kho vật tư
--              (Trồng trọt VietGAP, Chăn nuôi RFID, Kho vật tư & Lô thành phẩm QR)
-- Author: Senior Full-stack Software Engineer & Technical Lead
-- Database: MySQL 8.x (InnoDB, utf8mb4)
-- =============================================================================

-- =============================================================================
-- PHẦN 1: QUẢN LÝ TRỒNG TRỌT & NHẬT KÝ ĐỒNG RUỘNG (VIETGAP CROPS)
-- =============================================================================

-- 1.1. BẢNG CROP_TYPES (Danh mục Giống / Cây trồng)
CREATE TABLE IF NOT EXISTS `crop_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `variety_code` VARCHAR(50) NOT NULL,
    `growth_days_standard` INT NOT NULL DEFAULT 90,
    `water_need_m3_day` DECIMAL(10,2) NULL,
    `optimal_temp_min` DECIMAL(5,2) NULL,
    `optimal_temp_max` DECIMAL(5,2) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_crop_types_tenant_variety` UNIQUE (`tenant_id`, `variety_code`),
    CONSTRAINT `fk_crop_types_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2. BẢNG CROP_SEASONS (Vụ mùa gieo trồng)
CREATE TABLE IF NOT EXISTS `crop_seasons` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `season_code` VARCHAR(50) NOT NULL,
    `crop_type_id` BIGINT UNSIGNED NOT NULL,
    `start_date` DATE NOT NULL,
    `expected_harvest_date` DATE NOT NULL,
    `actual_harvest_date` DATE NULL,
    `planted_area_m2` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `seed_quantity` DECIMAL(10,2) NULL,
    `estimated_yield_kg` DECIMAL(12,2) NULL,
    `actual_yield_kg` DECIMAL(12,2) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'LAM_DAT' COMMENT 'LAM_DAT, GIEO_HAT, SINH_TRUONG, THU_HOACH, DONG_VU',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_crop_seasons_farm_code` UNIQUE (`tenant_id`, `farm_id`, `season_code`),
    CONSTRAINT `fk_crop_seasons_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crop_seasons_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crop_seasons_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_crop_seasons_crop_type` FOREIGN KEY (`crop_type_id`) REFERENCES `crop_types` (`id`) ON DELETE RESTRICT,
    INDEX `idx_crop_seasons_farm_status` (`tenant_id`, `farm_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3. BẢNG FARMING_LOGS (Nhật ký canh tác điện tử VietGAP)
CREATE TABLE IF NOT EXISTS `farming_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `season_id` BIGINT UNSIGNED NOT NULL,
    `log_date` DATETIME(6) NOT NULL,
    `stage` VARCHAR(100) NULL,
    `activity_type` VARCHAR(50) NOT NULL COMMENT 'TUOI_TIEU, BON_PHAN, PHUN_THUOC, TIA_CANH, LAM_CO, THU_HOACH',
    `supplies_used_json` JSON NULL COMMENT 'Danh sách vật tư sử dụng: [{materialId, batchNumber, quantity, unit}]',
    `weather_notes` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `performed_by_user_id` BIGINT UNSIGNED NULL,
    `image_urls_json` JSON NULL COMMENT 'Mảng URL ảnh hiện trường',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_farming_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farming_logs_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farming_logs_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_farming_logs_user` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_farming_logs_season_date` (`season_id`, `log_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- PHẦN 2: QUẢN LÝ CHĂN NUÔI (LIVESTOCK ENGINE - RFID & BẦY ĐÀN)
-- =============================================================================

-- 2.1. BẢNG LIVESTOCK_BREEDS (Danh mục Giống vật nuôi)
CREATE TABLE IF NOT EXISTS `livestock_breeds` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `species` VARCHAR(30) NOT NULL COMMENT 'BO, HEO, GA, DE, VIT, KHAC',
    `breed_name` VARCHAR(150) NOT NULL,
    `standard_growth_days` INT NOT NULL DEFAULT 120,
    `target_weight_kg` DECIMAL(8,2) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_livestock_breeds_tenant_species_name` UNIQUE (`tenant_id`, `species`, `breed_name`),
    CONSTRAINT `fk_livestock_breeds_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2. BẢNG LIVESTOCK_GROUPS (Quản lý Đàn vật nuôi: đàn gia cầm, lứa heo)
CREATE TABLE IF NOT EXISTS `livestock_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `group_code` VARCHAR(50) NOT NULL,
    `breed_id` BIGINT UNSIGNED NOT NULL,
    `initial_quantity` INT NOT NULL DEFAULT 0,
    `current_quantity` INT NOT NULL DEFAULT 0,
    `entry_date` DATE NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DANG_NUOI' COMMENT 'DANG_NUOI, XUAT_CHUONG, CACH_LY, DONG_DAN',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_livestock_groups_farm_code` UNIQUE (`tenant_id`, `farm_id`, `group_code`),
    CONSTRAINT `fk_livestock_groups_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_groups_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_groups_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_livestock_groups_breed` FOREIGN KEY (`breed_id`) REFERENCES `livestock_breeds` (`id`) ON DELETE RESTRICT,
    INDEX `idx_livestock_groups_farm_status` (`tenant_id`, `farm_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3. BẢNG LIVESTOCK_INDIVIDUALS (Quản lý Cá thể có mã RFID/Thẻ tai: bò sữa, lợn giống)
CREATE TABLE IF NOT EXISTS `livestock_individuals` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `rfid_tag_code` VARCHAR(50) NOT NULL COMMENT 'Mã thẻ tai/RFID tự động [LOAI-NAM-STT]',
    `group_id` BIGINT UNSIGNED NULL,
    `gender` VARCHAR(10) NOT NULL DEFAULT 'DUC' COMMENT 'DUC, CAI',
    `birth_date` DATE NULL,
    `mother_tag_code` VARCHAR(50) NULL,
    `father_tag_code` VARCHAR(50) NULL,
    `current_weight_kg` DECIMAL(8,2) NULL,
    `health_status` VARCHAR(30) NOT NULL DEFAULT 'KHOE_MANH' COMMENT 'KHOE_MANH, BENH, CACH_LY, DA_CHET, DA_XUAT',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_livestock_individuals_rfid` UNIQUE (`tenant_id`, `rfid_tag_code`),
    CONSTRAINT `fk_livestock_individuals_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_individuals_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_individuals_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_livestock_individuals_group` FOREIGN KEY (`group_id`) REFERENCES `livestock_groups` (`id`) ON DELETE SET NULL,
    INDEX `idx_livestock_individuals_rfid` (`rfid_tag_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4. BẢNG LIVESTOCK_EVENTS (Lịch sử biến động & sự kiện chăn nuôi)
CREATE TABLE IF NOT EXISTS `livestock_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `target_type` VARCHAR(20) NOT NULL COMMENT 'GROUP, INDIVIDUAL',
    `target_id` BIGINT UNSIGNED NOT NULL,
    `event_type` VARCHAR(50) NOT NULL COMMENT 'TIEM_PHONG, DO_TRONG_LUONG, PHOI_GIONG, DE_CON, DIEU_TRI_BENH, XUAT_CHUONG',
    `event_date` DATETIME(6) NOT NULL,
    `details_json` JSON NULL COMMENT 'Chi tiết sự kiện: vắc-xin, số cân, liều thuốc',
    `veterinarian_user_id` BIGINT UNSIGNED NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_livestock_events_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_events_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_livestock_events_vet` FOREIGN KEY (`veterinarian_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_livestock_events_target` (`target_type`, `target_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- PHẦN 3: QUẢN TRỊ KHO & VẬT TƯ (INVENTORY & WAREHOUSE MANAGEMENT)
-- =============================================================================

-- 3.1. BẢNG WAREHOUSES (Danh mục kho bãi thuộc trang trại)
CREATE TABLE IF NOT EXISTS `warehouses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `warehouse_type` VARCHAR(50) NOT NULL COMMENT 'KHO_PHAN_BON, KHO_THUOC_BVTV, KHO_THUC_AN, KHO_NONG_SAN, KHO_CONG_CU',
    `location_desc` VARCHAR(500) NULL,
    `manager_user_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_warehouses_farm_code` UNIQUE (`tenant_id`, `farm_id`, `code`),
    CONSTRAINT `fk_warehouses_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouses_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouses_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2. BẢNG MATERIAL_CATEGORIES (Nhóm danh mục vật tư)
CREATE TABLE IF NOT EXISTS `material_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_material_categories_tenant_code` UNIQUE (`tenant_id`, `code`),
    CONSTRAINT `fk_material_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3. BẢNG MATERIALS (Danh mục vật tư: phân bón, thuốc BVTV, cám, hạt giống)
CREATE TABLE IF NOT EXISTS `materials` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `sku_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `standard_unit` VARCHAR(30) NOT NULL DEFAULT 'KG' COMMENT 'KG, LIT, BAO, LIEU, HOP, GOI, CHAI',
    `expiry_alert_days` INT NOT NULL DEFAULT 30,
    `min_stock_level` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `max_stock_level` DECIMAL(12,2) NULL,
    `unit_price_standard` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `active_ingredient` VARCHAR(255) NULL COMMENT 'Hoạt chất hóa học / sinh học',
    `isolation_days` INT NOT NULL DEFAULT 0 COMMENT 'Thời gian cách ly an toàn (PHI) tính theo ngày',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_materials_tenant_sku` UNIQUE (`tenant_id`, `sku_code`),
    CONSTRAINT `fk_materials_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_materials_category` FOREIGN KEY (`category_id`) REFERENCES `material_categories` (`id`) ON DELETE RESTRICT,
    INDEX `idx_materials_tenant_sku` (`tenant_id`, `sku_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4. BẢNG WAREHOUSE_INVENTORY (Tồn kho thực tế theo Lô và Hạn sử dụng)
CREATE TABLE IF NOT EXISTS `warehouse_inventory` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL DEFAULT 'DEFAULT',
    `expiry_date` DATE NULL,
    `quantity_on_hand` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `reserved_quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `storage_bin_code` VARCHAR(50) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_warehouse_inventory_item_batch` UNIQUE (`warehouse_id`, `material_id`, `batch_number`),
    CONSTRAINT `fk_warehouse_inventory_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_inventory_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_inventory_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT,
    INDEX `idx_inventory_mat_expiry` (`material_id`, `expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5. BẢNG WAREHOUSE_RECEIPTS (Phiếu Nhập Kho)
CREATE TABLE IF NOT EXISTS `warehouse_receipts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `receipt_code` VARCHAR(50) NOT NULL,
    `receipt_type` VARCHAR(50) NOT NULL COMMENT 'PURCHASE, HARVEST_PRODUCT, INITIAL, OTHER',
    `partner_id` BIGINT UNSIGNED NULL,
    `receipt_date` DATETIME(6) NOT NULL,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `created_by_user_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' COMMENT 'DRAFT, COMPLETED, CANCELLED',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_warehouse_receipts_tenant_code` UNIQUE (`tenant_id`, `receipt_code`),
    CONSTRAINT `fk_warehouse_receipts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_receipts_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_receipts_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_warehouse_receipts_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_warehouse_receipts_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.6. BẢNG WAREHOUSE_RECEIPT_ITEMS (Chi tiết Phiếu Nhập Kho)
CREATE TABLE IF NOT EXISTS `warehouse_receipt_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `receipt_id` BIGINT UNSIGNED NOT NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL DEFAULT 'DEFAULT',
    `expiry_date` DATE NULL,
    `quantity` DECIMAL(12,2) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `storage_bin_code` VARCHAR(50) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `warehouse_receipts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_receipt_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.7. BẢNG WAREHOUSE_ISSUES (Phiếu Xuất Kho)
CREATE TABLE IF NOT EXISTS `warehouse_issues` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `issue_code` VARCHAR(50) NOT NULL,
    `issue_type` VARCHAR(50) NOT NULL COMMENT 'AUTO_CONSUMPTION_LOG, PRODUCTION_ISSUE, SALE, LOSS_DISPOSAL',
    `reference_log_id` BIGINT UNSIGNED NULL COMMENT 'ID của farming_logs hoặc livestock_events',
    `season_id` BIGINT UNSIGNED NULL,
    `livestock_group_id` BIGINT UNSIGNED NULL,
    `issue_date` DATETIME(6) NOT NULL,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `issued_by_user_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ISSUED' COMMENT 'DRAFT, ISSUED, CANCELLED',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_warehouse_issues_tenant_code` UNIQUE (`tenant_id`, `issue_code`),
    CONSTRAINT `fk_warehouse_issues_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_issues_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_warehouse_issues_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_warehouse_issues_user` FOREIGN KEY (`issued_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_issues_reference_log` (`reference_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.8. BẢNG WAREHOUSE_ISSUE_ITEMS (Chi tiết Phiếu Xuất Kho)
CREATE TABLE IF NOT EXISTS `warehouse_issue_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `issue_id` BIGINT UNSIGNED NOT NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL,
    `quantity` DECIMAL(12,2) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_issue_items_issue` FOREIGN KEY (`issue_id`) REFERENCES `warehouse_issues` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_issue_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.9. BẢNG WAREHOUSE_TRANSFERS (Phiếu Điều Chuyển Kho Liên Trang Trại)
CREATE TABLE IF NOT EXISTS `warehouse_transfers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `transfer_code` VARCHAR(50) NOT NULL,
    `from_warehouse_id` BIGINT UNSIGNED NOT NULL,
    `to_warehouse_id` BIGINT UNSIGNED NOT NULL,
    `transfer_date` DATETIME(6) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, IN_TRANSIT, COMPLETED, CANCELLED',
    `notes` TEXT NULL,
    `requested_by_user_id` BIGINT UNSIGNED NULL,
    `dispatched_at` DATETIME(6) NULL,
    `received_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_warehouse_transfers_tenant_code` UNIQUE (`tenant_id`, `transfer_code`),
    CONSTRAINT `fk_transfers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transfers_from_wh` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_transfers_to_wh` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_transfers_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.10. BẢNG WAREHOUSE_TRANSFER_ITEMS (Chi tiết Phiếu Điều Chuyển)
CREATE TABLE IF NOT EXISTS `warehouse_transfer_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `transfer_id` BIGINT UNSIGNED NOT NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL,
    `quantity` DECIMAL(12,2) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_transfer_items_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `warehouse_transfers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transfer_items_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.11. BẢNG STOCKTAKES (Phiếu Kiểm Kê Kho)
CREATE TABLE IF NOT EXISTS `stocktakes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `stocktake_code` VARCHAR(50) NOT NULL,
    `stocktake_date` DATETIME(6) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, COMPLETED, RECONCILED, CANCELLED',
    `notes` TEXT NULL,
    `created_by_user_id` BIGINT UNSIGNED NULL,
    `reconciled_by_user_id` BIGINT UNSIGNED NULL,
    `reconciled_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_stocktakes_tenant_code` UNIQUE (`tenant_id`, `stocktake_code`),
    CONSTRAINT `fk_stocktakes_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stocktakes_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stocktakes_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_stocktakes_created_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_stocktakes_recon_user` FOREIGN KEY (`reconciled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.12. BẢNG STOCKTAKE_ITEMS (Chi tiết Kiểm Kê Kho)
CREATE TABLE IF NOT EXISTS `stocktake_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `stocktake_id` BIGINT UNSIGNED NOT NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL,
    `system_quantity` DECIMAL(12,2) NOT NULL,
    `actual_quantity` DECIMAL(12,2) NOT NULL,
    `discrepancy_quantity` DECIMAL(12,2) NOT NULL,
    `reason` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_stocktake_items_st` FOREIGN KEY (`stocktake_id`) REFERENCES `stocktakes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stocktake_items_mat` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.13. BẢNG CONSUMPTION_QUOTAS (Định mức tiêu hao chuẩn)
CREATE TABLE IF NOT EXISTS `consumption_quotas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `crop_type_id` BIGINT UNSIGNED NULL,
    `breed_id` BIGINT UNSIGNED NULL,
    `material_id` BIGINT UNSIGNED NOT NULL,
    `stage_name` VARCHAR(100) NOT NULL,
    `standard_quantity_per_unit` DECIMAL(12,4) NOT NULL,
    `unit` VARCHAR(30) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_quotas_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quotas_crop_type` FOREIGN KEY (`crop_type_id`) REFERENCES `crop_types` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quotas_breed` FOREIGN KEY (`breed_id`) REFERENCES `livestock_breeds` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quotas_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- PHẦN 4: LÔ THÀNH PHẨM & TRUY XUẤT NGUỒN GỐC (PRODUCT BATCHES & TRACEABILITY)
-- =============================================================================

-- 4.1. BẢNG PRODUCT_BATCHES (Lô Nông Sản Thành Phẩm Sau Đóng Gói)
CREATE TABLE IF NOT EXISTS `product_batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `livestock_group_id` BIGINT UNSIGNED NULL,
    `batch_code` VARCHAR(50) NOT NULL,
    `traceability_code` VARCHAR(64) NULL COMMENT 'Mã UUID v4 duy nhất toàn hệ thống (NULL khi PENDING_APPROVAL)',
    `product_name` VARCHAR(255) NOT NULL,
    `harvest_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `initial_quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `remaining_quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'KG' COMMENT 'KG, TUI, HOP, KHAY, QUA',
    `quality_grade` VARCHAR(30) NOT NULL DEFAULT 'LOAI_1' COMMENT 'LOAI_1, LOAI_2, XUAT_KHAU',
    `qr_image_url` LONGTEXT NULL COMMENT 'Ảnh mã QR (Base64 hoặc URL)',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL' 
        COMMENT 'PENDING_APPROVAL, READY_TO_PRINT, DA_IN_TEM, DANG_XUAT_BAN, HET_HANG, REJECTED, RECALLED',
    `approved_by_user_id` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME(6) NULL,
    `rejected_by_user_id` BIGINT UNSIGNED NULL,
    `rejected_at` DATETIME(6) NULL,
    `rejection_reason` TEXT NULL,
    `recalled_by_user_id` BIGINT UNSIGNED NULL,
    `recalled_at` DATETIME(6) NULL,
    `recall_reason` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_product_batches_farm_code` UNIQUE (`tenant_id`, `farm_id`, `batch_code`),
    CONSTRAINT `uk_product_batches_trace_code` UNIQUE (`traceability_code`),
    CONSTRAINT `fk_product_batches_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_batches_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_batches_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_product_batches_ls_group` FOREIGN KEY (`livestock_group_id`) REFERENCES `livestock_groups` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_product_batches_approver` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_product_batches_rejecter` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_product_batches_recaller` FOREIGN KEY (`recalled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_product_batches_trace` (`traceability_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2. BẢNG TRACEABILITY_SNAPSHOTS (Hồ Sơ Snapshot Bất Biến Phục Vụ Truy Xuất QR)
CREATE TABLE IF NOT EXISTS `traceability_snapshots` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `product_batch_id` BIGINT UNSIGNED NOT NULL,
    `enterprise_info_json` JSON NOT NULL COMMENT 'Tên HTX, địa chỉ, người đại diện, logo',
    `vietgap_cert_json` JSON NULL COMMENT 'Mã VietGAP, cơ quan cấp, ngày hết hạn',
    `farming_timeline_json` JSON NOT NULL COMMENT 'Chuỗi nhật ký chăm sóc, bón phân, tưới nước, PHI',
    `harvest_info_json` JSON NOT NULL COMMENT 'Ngày thu hoạch, nhà kính, sản lượng đóng gói',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_traceability_snapshots_batch` UNIQUE (`product_batch_id`),
    CONSTRAINT `fk_snapshots_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_snapshots_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_snapshots_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3. BẢNG LABEL_PRINT_LOGS (Lịch Sử In Tem Nhãn Nhiệt Tại Bàn Đóng Gói Kho)
CREATE TABLE IF NOT EXISTS `label_print_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `product_batch_id` BIGINT UNSIGNED NOT NULL,
    `printed_by_user_id` BIGINT UNSIGNED NOT NULL,
    `label_size` VARCHAR(30) NOT NULL DEFAULT 'SIZE_50X50' COMMENT 'SIZE_50X50, SIZE_35X22',
    `print_quantity` INT NOT NULL DEFAULT 1,
    `printed_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `printer_model` VARCHAR(100) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_print_logs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_print_logs_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_print_logs_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_print_logs_user` FOREIGN KEY (`printed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
