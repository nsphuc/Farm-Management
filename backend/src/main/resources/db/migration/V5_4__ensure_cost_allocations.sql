-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_4: ENSURE COST ALLOCATIONS TABLE
-- =============================================================================

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
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_alloc_expense` ON `cost_allocations` (`expense_id`);
CREATE INDEX `idx_alloc_season` ON `cost_allocations` (`season_id`);
