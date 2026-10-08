-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_2: ENSURE ALL FINANCE TABLES FOR HIBERNATE SCHEMA VALIDATION
-- =============================================================================

-- 8. BẢNG DANH MỤC CHI PHÍ (cost_categories)
CREATE TABLE IF NOT EXISTS `cost_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `cost_type` VARCHAR(50) NOT NULL COMMENT 'TRUC_TIEP_VAT_TU, TRUC_TIEP_NHAN_CONG, MAY_MOC, KHAU_HAO, GIAN_TIEP',
    `description` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_cc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_cost_cat_code` UNIQUE (`tenant_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_cost_cat` ON `cost_categories` (`tenant_id`, `cost_type`);

-- 9. BẢNG CHI PHÍ TRANG TRẠI PHÁT SINH (farm_expenses)
CREATE TABLE IF NOT EXISTS `farm_expenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `herd_id` BIGINT UNSIGNED NULL,
    `expense_code` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'TIEN_MAT',
    `expense_date` DATE NOT NULL,
    `invoice_number` VARCHAR(100) NULL,
    `recipient_partner_id` BIGINT UNSIGNED NULL,
    `reference_issue_id` BIGINT UNSIGNED NULL,
    `notes` TEXT NULL,
    `created_by_user_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_fe_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fe_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fe_category` FOREIGN KEY (`category_id`) REFERENCES `cost_categories` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_fe_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fe_herd` FOREIGN KEY (`herd_id`) REFERENCES `livestock_groups` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fe_partner` FOREIGN KEY (`recipient_partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fe_issue` FOREIGN KEY (`reference_issue_id`) REFERENCES `warehouse_issues` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fe_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_expenses_farm_code` UNIQUE (`tenant_id`, `farm_id`, `expense_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_expenses_farm_date` ON `farm_expenses` (`farm_id`, `expense_date`);
CREATE INDEX `idx_expenses_season` ON `farm_expenses` (`season_id`);
CREATE INDEX `idx_expenses_herd` ON `farm_expenses` (`herd_id`);

-- 10. BẢNG PHÂN BỔ CHI PHÍ CHUNG (cost_allocations)
CREATE TABLE IF NOT EXISTS `cost_allocations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `expense_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `allocation_ratio` DECIMAL(5, 4) NOT NULL COMMENT 'Tỷ lệ phân bổ (vd 0.2500 là 25%)',
    `allocated_amount` DECIMAL(15, 2) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ca_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ca_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ca_expense` FOREIGN KEY (`expense_id`) REFERENCES `farm_expenses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ca_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ca_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_alloc_expense` ON `cost_allocations` (`expense_id`);
CREATE INDEX `idx_alloc_season` ON `cost_allocations` (`season_id`);

-- 11. BẢNG ĐƠN HÀNG XUẤT BÁN NÔNG SẢN (sales_orders)
CREATE TABLE IF NOT EXISTS `sales_orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `order_code` VARCHAR(50) NOT NULL,
    `partner_id` BIGINT UNSIGNED NOT NULL,
    `order_date` DATE NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `vat_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `final_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    `delivery_status` VARCHAR(50) NOT NULL DEFAULT 'CHO_XUAT',
    `notes` TEXT NULL,
    `created_by_user_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_so_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_so_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_so_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_so_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_orders_farm_code` UNIQUE (`tenant_id`, `farm_id`, `order_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_orders_farm_date` ON `sales_orders` (`farm_id`, `order_date`);
CREATE INDEX `idx_orders_partner` ON `sales_orders` (`partner_id`, `payment_status`);

-- 12. BẢNG CHI TIẾT ĐƠN HÀNG BÁN (sales_order_items)
CREATE TABLE IF NOT EXISTS `sales_order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `batch_id` BIGINT UNSIGNED NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `herd_id` BIGINT UNSIGNED NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `quantity_kg` DECIMAL(12, 2) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_soi_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_soi_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_soi_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_soi_herd` FOREIGN KEY (`herd_id`) REFERENCES `livestock_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_order_items_order` ON `sales_order_items` (`order_id`);
CREATE INDEX `idx_order_items_batch` ON `sales_order_items` (`batch_id`);

-- 13. BẢNG SỔ CÔNG NỢ ĐỐI TÁC (debt_records)
CREATE TABLE IF NOT EXISTS `debt_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `partner_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NULL,
    `debt_type` VARCHAR(50) NOT NULL COMMENT 'RECEIVABLE, PAYABLE',
    `original_amount` DECIMAL(15, 2) NOT NULL,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `remaining_amount` DECIMAL(15, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_dr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dr_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dr_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_dr_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_debt_partner` ON `debt_records` (`partner_id`, `status`);
CREATE INDEX `idx_debt_due` ON `debt_records` (`farm_id`, `due_date`, `status`);
