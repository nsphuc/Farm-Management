-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_3: ENSURE BUDGETS & BUDGET LINE ITEMS
-- =============================================================================

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
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_budget_items_budget` ON `budget_line_items` (`budget_id`);
CREATE INDEX `idx_budget_items_category` ON `budget_line_items` (`category_id`);
