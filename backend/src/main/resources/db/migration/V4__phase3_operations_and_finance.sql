-- ==============================================================================
-- FARMGO SAAS PLATFORM - PHASE 3 OPERATIONS & FINANCE (V4.0)
-- Migration File: V4__phase3_operations_and_finance.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. BẢNG HÓA ĐƠN NHẬP HÀNG (PURCHASE_INVOICES)
CREATE TABLE IF NOT EXISTS `purchase_invoices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `farm_id` BIGINT NOT NULL,
    `branch_id` BIGINT DEFAULT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `invoice_date` DATE NOT NULL,
    `supplier_id` BIGINT DEFAULT NULL,
    `supplier_name` VARCHAR(255) DEFAULT NULL,
    `invoice_type` VARCHAR(50) NOT NULL DEFAULT 'FEED_MED',
    `destination_type` VARCHAR(50) NOT NULL DEFAULT 'WAREHOUSE',
    `destination_name` VARCHAR(255) DEFAULT NULL,
    `warehouse_id` BIGINT DEFAULT NULL,
    `barn_id` BIGINT DEFAULT NULL,
    `batch_id` BIGINT DEFAULT NULL,
    `total_goods_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_payment_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `remaining_debt` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `payment_status` VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    `payment_method` VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    `creator_name` VARCHAR(150) DEFAULT NULL,
    `approver_name` VARCHAR(150) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` BIGINT DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_pi_tenant_farm` (`tenant_id`, `farm_id`),
    KEY `idx_pi_branch` (`branch_id`),
    KEY `idx_pi_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CHI TIẾT HÓA ĐƠN NHẬP HÀNG (PURCHASE_INVOICE_ITEMS)
CREATE TABLE IF NOT EXISTS `purchase_invoice_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `invoice_id` BIGINT NOT NULL,
    `material_id` BIGINT DEFAULT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) DEFAULT NULL,
    `quantity` DECIMAL(12,2) NOT NULL,
    `lot_code` VARCHAR(100) DEFAULT NULL,
    `expiry_date` DATE DEFAULT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    KEY `idx_pi_items_invoice` (`invoice_id`),
    CONSTRAINT `fk_pi_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MỞ RỘNG BẢNG XUẤT NHẬP NỘI BỘ (WAREHOUSE_TRANSFERS)
ALTER TABLE `warehouse_transfers`
    ADD COLUMN `transfer_type` VARCHAR(50) DEFAULT 'TRANSFER',
    ADD COLUMN `barn_id` BIGINT DEFAULT NULL,
    ADD COLUMN `batch_id` BIGINT DEFAULT NULL,
    ADD COLUMN `destination_location` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN `source_location` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN `total_value` DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN `creator_name` VARCHAR(150) DEFAULT NULL,
    ADD COLUMN `approver_name` VARCHAR(150) DEFAULT NULL,
    ADD COLUMN `approved_at` VARCHAR(50) DEFAULT NULL;

-- Cho phép to_warehouse_id null hoặc giống nhau trong trường hợp xuất dùng nội bộ hoặc kiểm kê
ALTER TABLE `warehouse_transfers` MODIFY COLUMN `to_warehouse_id` BIGINT DEFAULT NULL;
ALTER TABLE `warehouse_transfers` MODIFY COLUMN `from_warehouse_id` BIGINT DEFAULT NULL;

-- 4. MỞ RỘNG BẢNG SỔ QUỸ & CHI PHÍ (FARM_EXPENSES)
ALTER TABLE `farm_expenses`
    ADD COLUMN `entry_type` VARCHAR(20) DEFAULT 'EXPENSE',
    ADD COLUMN `is_system_locked` TINYINT(1) DEFAULT 0,
    ADD COLUMN `allocated_cycle_id` BIGINT DEFAULT NULL,
    ADD COLUMN `category_name` VARCHAR(150) DEFAULT NULL,
    ADD COLUMN `branch_id` BIGINT DEFAULT NULL;

-- 5. BẢNG NHẬT KÝ CÔNG KHOÁN / THỜI VỤ (PIECEWORK_LOGS)
CREATE TABLE IF NOT EXISTS `piecework_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `farm_id` BIGINT NOT NULL,
    `branch_id` BIGINT DEFAULT NULL,
    `employee_id` BIGINT DEFAULT NULL,
    `worker_name` VARCHAR(150) NOT NULL,
    `barn_id` BIGINT DEFAULT NULL,
    `batch_id` BIGINT DEFAULT NULL,
    `work_date` DATE NOT NULL,
    `task_description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    `payment_status` VARCHAR(30) DEFAULT 'UNPAID',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_piecework_farm` (`farm_id`),
    KEY `idx_piecework_batch` (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
