-- V1.16: Add applicable_farms, farm_id and description to cost_categories
ALTER TABLE `cost_categories`
    ADD COLUMN `farm_id` BIGINT NULL AFTER `tenant_id`,
    ADD COLUMN `applicable_farms` VARCHAR(255) NULL AFTER `farm_id`,
    ADD COLUMN `description` VARCHAR(500) NULL AFTER `cost_type`;

