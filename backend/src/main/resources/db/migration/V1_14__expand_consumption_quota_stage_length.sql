-- V1.1: Expand stage length in consumption_quotas to varchar(255) to support detailed farming and growth phases
ALTER TABLE `consumption_quotas` MODIFY COLUMN `stage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

