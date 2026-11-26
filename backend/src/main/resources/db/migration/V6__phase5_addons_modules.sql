-- ==============================================================================
-- FARMGO SAAS PLATFORM - PHASE 5 ADD-ON EXPANSIONS (V6.0)
-- Migration File: V6__phase5_addons_modules.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. BẢNG BẢNG LƯƠNG & CHẤM CÔNG KPI (PAYROLL_SHEETS)
CREATE TABLE IF NOT EXISTS `payroll_sheets` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL DEFAULT 1,
    `farm_id` BIGINT NOT NULL DEFAULT 1,
    `branch_id` BIGINT DEFAULT NULL,
    `period_month` VARCHAR(20) NOT NULL DEFAULT '2026-11',
    `employee_id` BIGINT DEFAULT NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `base_salary` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `actual_work_days` DECIMAL(5,1) NOT NULL DEFAULT 26.0,
    `standard_work_days` DECIMAL(5,1) NOT NULL DEFAULT 26.0,
    `kpi_bonus` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `allowance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `advance_deduction` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `net_salary` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' / 'PAID'
    `paid_at` TIMESTAMP NULL DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_payroll_farm_period` (`farm_id`, `period_month`),
    KEY `idx_payroll_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG GIA SÚC SINH SẢN THEO THẺ TAI (BREEDING_ANIMALS)
CREATE TABLE IF NOT EXISTS `breeding_animals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL DEFAULT 1,
    `farm_id` BIGINT NOT NULL DEFAULT 1,
    `branch_id` BIGINT DEFAULT NULL,
    `tag_code` VARCHAR(50) NOT NULL,
    `breed_name` VARCHAR(100) NOT NULL,
    `parity` INT NOT NULL DEFAULT 1,
    `reproductive_status` VARCHAR(50) NOT NULL DEFAULT 'PREGNANT', -- 'HEIFER', 'MATING', 'PREGNANT', 'LACTATING'
    `mating_date` DATE DEFAULT NULL,
    `expected_birth_date` DATE DEFAULT NULL,
    `actual_birth_date` DATE DEFAULT NULL,
    `born_alive_count` INT NOT NULL DEFAULT 0,
    `weaned_count` INT NOT NULL DEFAULT 0,
    `barn_name` VARCHAR(100) DEFAULT 'Chuồng Nái Đẻ A1',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_breeding_tag` (`farm_id`, `tag_code`),
    KEY `idx_breeding_farm` (`farm_id`),
    KEY `idx_breeding_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG QUẢN LÝ MẺ ẤP TRỨNG & CON GIỐNG (HATCHERY_BATCHES)
CREATE TABLE IF NOT EXISTS `hatchery_batches` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL DEFAULT 1,
    `farm_id` BIGINT NOT NULL DEFAULT 1,
    `branch_id` BIGINT DEFAULT NULL,
    `batch_code` VARCHAR(50) NOT NULL,
    `egg_type` VARCHAR(50) NOT NULL DEFAULT 'CHICKEN', -- 'CHICKEN', 'DUCK'
    `breed_name` VARCHAR(100) DEFAULT 'Gà Ri / Mía cao sản',
    `set_date` DATE NOT NULL,
    `total_eggs` INT NOT NULL DEFAULT 0,
    `fertile_eggs` INT NOT NULL DEFAULT 0,
    `expected_hatch_date` DATE NOT NULL,
    `actual_hatched_count` INT NOT NULL DEFAULT 0,
    `cull_count` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'INCUBATING', -- 'INCUBATING', 'HATCHED'
    `destination_barn_name` VARCHAR(100) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_hatchery_batch_code` (`farm_id`, `batch_code`),
    KEY `idx_hatchery_farm` (`farm_id`),
    KEY `idx_hatchery_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG CÔNG THỨC PHỐI TRỘN CÁM BOM (FEED_PRODUCTION_BOMS & ITEMS)
CREATE TABLE IF NOT EXISTS `feed_production_boms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL DEFAULT 1,
    `farm_id` BIGINT NOT NULL DEFAULT 1,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `target_species` VARCHAR(50) NOT NULL DEFAULT 'SWINE', -- 'SWINE', 'POULTRY'
    `batch_weight_kg` DECIMAL(12,2) NOT NULL DEFAULT 100.00,
    `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `cost_per_kg` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `description` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_bom_code` (`farm_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feed_production_bom_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `bom_id` BIGINT NOT NULL,
    `material_id` BIGINT DEFAULT NULL,
    `material_name` VARCHAR(150) NOT NULL,
    `quantity_kg` DECIMAL(10,2) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    KEY `fk_bom_items_bom` (`bom_id`),
    CONSTRAINT `fk_bom_items_bom` FOREIGN KEY (`bom_id`) REFERENCES `feed_production_boms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG LỆNH SẢN XUẤT CÁM (FEED_PRODUCTION_ORDERS)
CREATE TABLE IF NOT EXISTS `feed_production_orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL DEFAULT 1,
    `farm_id` BIGINT NOT NULL DEFAULT 1,
    `branch_id` BIGINT DEFAULT NULL,
    `order_code` VARCHAR(50) NOT NULL,
    `bom_id` BIGINT NOT NULL,
    `bom_name` VARCHAR(150) NOT NULL,
    `batch_count` INT NOT NULL DEFAULT 1,
    `total_output_kg` DECIMAL(12,2) NOT NULL,
    `target_warehouse_id` BIGINT DEFAULT NULL,
    `target_warehouse_name` VARCHAR(150) DEFAULT NULL,
    `total_material_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `cost_per_kg` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    `executed_date` DATE NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_feed_order_code` (`farm_id`, `order_code`),
    KEY `idx_feed_order_farm` (`farm_id`),
    KEY `idx_feed_order_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SEED DỮ LIỆU BAN ĐẦU CHUẨN THỰC CHIẾN
INSERT INTO `payroll_sheets` (`id`, `tenant_id`, `farm_id`, `branch_id`, `period_month`, `employee_id`, `employee_code`, `full_name`, `base_salary`, `actual_work_days`, `standard_work_days`, `kpi_bonus`, `allowance`, `advance_deduction`, `net_salary`, `status`, `notes`)
VALUES
(1, 1, 1, 1, '2026-11', 1, 'NV-001', 'Nguyễn Văn Minh (Kỹ thuật chuồng)', 9500000.00, 26.0, 26.0, 1500000.00, 1000000.00, 2000000.00, 10000000.00, 'DRAFT', 'Tỷ lệ sống đạt 98.2%, thưởng FCR 1.58'),
(2, 1, 1, 1, '2026-11', 2, 'NV-002', 'Trần Thị Thu (Quản lý kho cám)', 8000000.00, 25.0, 26.0, 800000.00, 800000.00, 1000000.00, 8292300.00, 'DRAFT', 'Kiểm kê kho cám đạt định mức hao hụt < 0.3%'),
(3, 1, 1, 1, '2026-11', 3, 'NV-003', 'Lê Hoàng Long (Công nhân chăm sóc)', 7500000.00, 26.0, 26.0, 1200000.00, 500000.00, 1500000.00, 7700000.00, 'DRAFT', 'Hoàn thành tốt công tác dọn chuồng sát trùng')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

INSERT INTO `breeding_animals` (`id`, `tenant_id`, `farm_id`, `branch_id`, `tag_code`, `breed_name`, `parity`, `reproductive_status`, `mating_date`, `expected_birth_date`, `born_alive_count`, `weaned_count`, `barn_name`, `notes`)
VALUES
(1, 1, 1, 2, 'NAI-001', 'Heo nái Landrace ngoại thuần', 3, 'PREGNANT', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 60 DAY), INTERVAL 114 DAY), 14, 13, 'Chuồng Nái Chửa B1', 'Phối tinh nhân tạo Duroc hạt nhân ngày 25/09'),
(2, 1, 1, 2, 'NAI-002', 'Heo nái Yorkshire cao sản', 2, 'LACTATING', DATE_SUB(CURDATE(), INTERVAL 125 DAY), DATE_SUB(CURDATE(), INTERVAL 11 DAY), 12, 12, 'Chuồng Nái Đẻ B2', 'Đã đẻ 12 con khỏe mạnh, cai sữa dự kiến sau 21 ngày'),
(3, 1, 1, 2, 'NAI-003', 'Heo nái Duroc 3 máu', 4, 'MATING', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 114 DAY), 0, 0, 'Chuồng Phối Giống B1', 'Vừa lên giống lần 2, đã phối 2 liều tinh'),
(4, 1, 1, 2, 'NAI-004', 'Heo hậu bị Landrace', 1, 'HEIFER', NULL, NULL, 0, 0, 'Chuồng Hậu Bị B1', 'Đạt 115kg, chuẩn bị đưa vào phối giống lứa đầu')
ON DUPLICATE KEY UPDATE `tag_code` = VALUES(`tag_code`);

INSERT INTO `hatchery_batches` (`id`, `tenant_id`, `farm_id`, `branch_id`, `batch_code`, `egg_type`, `breed_name`, `set_date`, `total_eggs`, `fertile_eggs`, `expected_hatch_date`, `actual_hatched_count`, `cull_count`, `status`, `destination_barn_name`, `notes`)
VALUES
(1, 1, 1, 1, 'AP-GA-2611-01', 'CHICKEN', 'Gà trắng Ross 308 giống bố mẹ', DATE_SUB(CURDATE(), INTERVAL 12 DAY), 5000, 4750, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 21 DAY), 0, 0, 'INCUBATING', 'Chuồng Úm Gà A1', 'Soi trứng ngày 7 tỷ lệ phôi 95%, nhiệt độ máy ấp ổn định 37.5°C'),
(2, 1, 1, 1, 'AP-GA-2611-02', 'CHICKEN', 'Gà Ri lai Lạc Thủy', DATE_SUB(CURDATE(), INTERVAL 22 DAY), 3000, 2820, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2680, 45, 'HATCHED', 'Chuồng Nuôi Thịt A2', 'Đã xuất lò thành công 2.680 con gà giống đạt chuẩn, tỷ lệ nở 95%'),
(3, 1, 1, 1, 'AP-VIT-2611-01', 'DUCK', 'Vịt siêu thịt Cherry Valley', DATE_SUB(CURDATE(), INTERVAL 8 DAY), 2000, 1860, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 DAY), INTERVAL 28 DAY), 0, 0, 'INCUBATING', 'Chuồng Úm Vịt A3', 'Trứng chọn lọc loại 1 từ đàn đẻ nhánh Phú Lương')
ON DUPLICATE KEY UPDATE `batch_code` = VALUES(`batch_code`);

INSERT INTO `feed_production_boms` (`id`, `tenant_id`, `farm_id`, `code`, `name`, `target_species`, `batch_weight_kg`, `total_cost`, `cost_per_kg`, `description`, `is_active`)
VALUES
(1, 1, 1, 'BOM-HEO-100', 'Cám Heo Thịt Giai Đoạn 30-60kg (Mẻ 100kg)', 'SWINE', 100.00, 1150000.00, 11500.00, 'Công thức đạm tiêu chuẩn 17.5%, bổ sung enzyme tiêu hóa và axit amin', 1),
(2, 1, 1, 'BOM-GA-100', 'Cám Gà Thịt Vỗ Béo 25-45 Ngày (Mẻ 100kg)', 'POULTRY', 100.00, 1220000.00, 12200.00, 'Công thức năng lượng cao ME 3150 kcal/kg, hạt mảnh tiêu chuẩn', 1)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

INSERT INTO `feed_production_bom_items` (`id`, `bom_id`, `material_name`, `quantity_kg`, `unit_price`, `amount`)
VALUES
(1, 1, 'Ngô hạt nghiền mịn', 55.00, 9500.00, 522500.00),
(2, 1, 'Khô đậu tương 46% đạm', 24.00, 16500.00, 396000.00),
(3, 1, 'Cám gạo xát mới thơm', 17.00, 8500.00, 144500.00),
(4, 1, 'Premix khoáng vitamin tổng hợp', 3.00, 25000.00, 75000.00),
(5, 1, 'Chế phẩm men vi sinh ủ men', 1.00, 12000.00, 12000.00),
(6, 2, 'Ngô mảnh vàng', 58.00, 9500.00, 551000.00),
(7, 2, 'Khô đậu tương nhập khẩu', 26.00, 16500.00, 429000.00),
(8, 2, 'Cám mì', 12.00, 8000.00, 96000.00),
(9, 2, 'Premix gà thịt cao cấp', 4.00, 36000.00, 144000.00)
ON DUPLICATE KEY UPDATE `material_name` = VALUES(`material_name`);

INSERT INTO `feed_production_orders` (`id`, `tenant_id`, `farm_id`, `branch_id`, `order_code`, `bom_id`, `bom_name`, `batch_count`, `total_output_kg`, `target_warehouse_name`, `total_material_cost`, `cost_per_kg`, `status`, `executed_date`, `notes`)
VALUES
(1, 1, 1, 2, 'SX-CAM-2611-01', 1, 'Cám Heo Thịt Giai Đoạn 30-60kg (Mẻ 100kg)', 10, 1000.00, 'Kho Cám Khu B', 11500000.00, 11500.00, 'COMPLETED', CURDATE(), 'Đã hoàn tất trộn 10 mẻ (1 tấn cám), xuất thẳng vào silo Kho Cám Khu B')
ON DUPLICATE KEY UPDATE `order_code` = VALUES(`order_code`);

SET FOREIGN_KEY_CHECKS = 1;
