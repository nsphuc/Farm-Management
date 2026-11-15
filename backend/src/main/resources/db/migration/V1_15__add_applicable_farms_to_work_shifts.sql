-- V1.15: Add applicable_farms column to work_shifts to support multi-farm selection
ALTER TABLE `work_shifts` ADD COLUMN `applicable_farms` VARCHAR(255) NULL AFTER `farm_id`;

