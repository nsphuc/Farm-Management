-- ==============================================================================
-- FLYWAY MIGRATION V4.0: QUẢN TRỊ NỘI BỘ - NHÂN SỰ & TÀI CHÍNH (HR & FINANCIAL INTELLIGENCE)
-- Database: MySQL 8.x (InnoDB, utf8mb4)
-- ==============================================================================

-- ==============================================================================
-- PHẦN 1: PHÂN HỆ NHÂN SỰ, CA LÀM VIỆC & CHẤM CÔNG GPS
-- ==============================================================================

-- 1. BẢNG HỒ SƠ NHÂN SỰ (employees)
CREATE TABLE IF NOT EXISTS `employees` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `national_id` VARCHAR(50) NULL COMMENT 'CCCD / CMND',
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(500) NULL,
    `department` VARCHAR(100) NULL,
    `position` VARCHAR(100) NULL,
    `contract_type` VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    `basic_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `daily_allowance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `join_date` DATE NOT NULL,
    `termination_date` DATE NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `bank_account` VARCHAR(50) NULL,
    `bank_name` VARCHAR(100) NULL,
    `emergency_contact_name` VARCHAR(150) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_emp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_emp_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_emp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_employees_farm_code` UNIQUE (`tenant_id`, `farm_id`, `employee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_employees_lookup` ON `employees` (`farm_id`, `status`);
CREATE INDEX `idx_employees_phone` ON `employees` (`phone`);

-- 2. BẢNG CA LÀM VIỆC (work_shifts)
CREATE TABLE IF NOT EXISTS `work_shifts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `shift_code` VARCHAR(50) NOT NULL,
    `shift_name` VARCHAR(100) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `break_minutes` INT NOT NULL DEFAULT 60,
    `working_hours` DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
    `late_grace_minutes` INT NOT NULL DEFAULT 15,
    `early_leave_grace_minutes` INT NOT NULL DEFAULT 15,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `is_overnight` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ws_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ws_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_work_shifts_farm_code` UNIQUE (`tenant_id`, `farm_id`, `shift_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_shifts_farm` ON `work_shifts` (`farm_id`, `status`);

-- 3. BẢNG PHÂN CÔNG CA LÀM VIỆC (shift_assignments)
CREATE TABLE IF NOT EXISTS `shift_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` BIGINT UNSIGNED NOT NULL,
    `shift_id` BIGINT UNSIGNED NOT NULL,
    `assigned_date` DATE NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_sa_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sa_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sa_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sa_ws` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `uk_shift_assignment` UNIQUE (`tenant_id`, `farm_id`, `employee_id`, `shift_id`, `assigned_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_assignments_date` ON `shift_assignments` (`farm_id`, `assigned_date`, `status`);
CREATE INDEX `idx_assignments_emp` ON `shift_assignments` (`employee_id`, `assigned_date`);

-- 4. BẢNG CHẤM CÔNG GPS (time_attendances)
CREATE TABLE IF NOT EXISTS `time_attendances` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` BIGINT UNSIGNED NOT NULL,
    `shift_id` BIGINT UNSIGNED NULL,
    `work_date` DATE NOT NULL,
    `check_in_time` DATETIME(6) NULL,
    `check_in_latitude` DECIMAL(10, 7) NULL,
    `check_in_longitude` DECIMAL(10, 7) NULL,
    `check_in_distance_m` DECIMAL(8, 2) NULL,
    `check_out_time` DATETIME(6) NULL,
    `check_out_latitude` DECIMAL(10, 7) NULL,
    `check_out_longitude` DECIMAL(10, 7) NULL,
    `check_out_distance_m` DECIMAL(8, 2) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DUNG_GIO',
    `working_hours` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `overtime_hours` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `notes` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ta_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ta_ws` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_time_attendance` UNIQUE (`tenant_id`, `farm_id`, `employee_id`, `work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_attendances_farm_date` ON `time_attendances` (`farm_id`, `work_date`);
CREATE INDEX `idx_attendances_emp_date` ON `time_attendances` (`employee_id`, `work_date`);

-- 5. BẢNG ĐƠN NGHỈ PHÉP (leave_requests)
CREATE TABLE IF NOT EXISTS `leave_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` BIGINT UNSIGNED NOT NULL,
    `leave_type` VARCHAR(30) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `total_days` DECIMAL(4, 1) NOT NULL,
    `reason` VARCHAR(500) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME(6) NULL,
    `rejection_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_lr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lr_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lr_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lr_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_leaves_farm_status` ON `leave_requests` (`farm_id`, `status`);

-- 6. BẢNG ĐĂNG KÝ TĂNG CA (overtime_requests)
CREATE TABLE IF NOT EXISTS `overtime_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` BIGINT UNSIGNED NOT NULL,
    `overtime_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `planned_hours` DECIMAL(4, 2) NOT NULL,
    `actual_hours` DECIMAL(4, 2) NULL,
    `reason` VARCHAR(500) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME(6) NULL,
    `rejection_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_or_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_or_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_or_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_or_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_ot_farm_date` ON `overtime_requests` (`farm_id`, `overtime_date`, `status`);

-- 7. BẢNG PHÂN CÔNG CÔNG VIỆC HIỆN TRƯỜNG (farm_tasks)
CREATE TABLE IF NOT EXISTS `farm_tasks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `task_code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(30) NOT NULL DEFAULT 'TODO',
    `assigned_to` BIGINT UNSIGNED NULL,
    `supervisor_id` BIGINT UNSIGNED NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `herd_id` BIGINT UNSIGNED NULL,
    `zone_id` BIGINT UNSIGNED NULL,
    `due_date` DATE NULL,
    `start_time` DATETIME(6) NULL,
    `completed_at` DATETIME(6) NULL,
    `estimated_hours` DECIMAL(4, 2) NULL,
    `actual_hours` DECIMAL(4, 2) NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ft_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ft_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ft_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ft_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ft_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ft_herd` FOREIGN KEY (`herd_id`) REFERENCES `livestock_groups` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ft_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_farm_tasks_code` UNIQUE (`tenant_id`, `farm_id`, `task_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_tasks_farm_status` ON `farm_tasks` (`farm_id`, `status`);
CREATE INDEX `idx_tasks_assignee` ON `farm_tasks` (`assigned_to`, `status`);
CREATE INDEX `idx_tasks_due_date` ON `farm_tasks` (`due_date`);

-- ==============================================================================
-- PHẦN 2: PHÂN HỆ TÀI CHÍNH, GIÁ THÀNH & CÔNG NỢ NÔNG SẢN
-- ==============================================================================

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
    `reference_issue_id` BIGINT UNSIGNED NULL COMMENT 'Hạch toán tự động từ phiếu xuất kho',
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
    `debt_type` VARCHAR(50) NOT NULL COMMENT 'PHAI_THU_KHACH, PHAI_TRA_NCC',
    `original_amount` DECIMAL(15, 2) NOT NULL,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `remaining_amount` DECIMAL(15, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'TRONG_HAN',
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

-- 14. BẢNG DỰ TOÁN NGÂN SÁCH MÙA VỤ (budgets & budget_line_items)
CREATE TABLE IF NOT EXISTS `budgets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `season_id` BIGINT UNSIGNED NULL,
    `budget_code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `total_budget` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'DANG_AP_DUNG',
    `notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_b_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_b_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_b_season` FOREIGN KEY (`season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_budgets_farm_code` UNIQUE (`tenant_id`, `farm_id`, `budget_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_budgets_season` ON `budgets` (`season_id`);

CREATE TABLE IF NOT EXISTS `budget_line_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `budget_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `planned_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_bli_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_bli_category` FOREIGN KEY (`category_id`) REFERENCES `cost_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_budget_items_budget` ON `budget_line_items` (`budget_id`);
