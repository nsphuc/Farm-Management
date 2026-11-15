
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_code` int DEFAULT NULL,
  `execution_time_ms` bigint DEFAULT NULL,
  `trace_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_tenant` (`tenant_id`),
  KEY `idx_audit_logs_user` (`user_id`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  KEY `idx_audit_logs_action` (`module`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `budget_line_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_line_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `budget_id` bigint NOT NULL,
  `cost_category_id` bigint NOT NULL,
  `allocated_amount` decimal(14,2) NOT NULL,
  `spent_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_budget_line_items_category` (`cost_category_id`),
  KEY `idx_budget_line_items_budget` (`budget_id`),
  CONSTRAINT `fk_budget_line_items_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_line_items_category` FOREIGN KEY (`cost_category_id`) REFERENCES `cost_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_budget_line_items_amounts` CHECK (((`allocated_amount` >= 0.00) and (`spent_amount` >= 0.00)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `operational_cycle_id` bigint DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fiscal_year` int NOT NULL,
  `total_budget_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_budgets_farm_year_name` (`farm_id`,`fiscal_year`,`name`),
  UNIQUE KEY `uk_budgets_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_budgets_cycle_composite` (`tenant_id`,`farm_id`,`operational_cycle_id`),
  KEY `idx_budgets_tenant` (`tenant_id`),
  KEY `idx_budgets_farm` (`farm_id`),
  CONSTRAINT `fk_budgets_cycle_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `operational_cycle_id`) REFERENCES `operational_cycles` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_budgets_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_budgets_amount` CHECK ((`total_budget_amount` >= 0.00)),
  CONSTRAINT `chk_budgets_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'ACTIVE',_utf8mb4'CLOSED',_utf8mb4'REVISED')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consumption_quotas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumption_quotas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `crop_type_id` bigint DEFAULT NULL,
  `livestock_breed_id` bigint DEFAULT NULL,
  `material_id` bigint NOT NULL,
  `standard_quantity` decimal(12,2) NOT NULL,
  `unit_of_measure` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_consumption_quotas_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_consumption_quotas_crop_type` (`tenant_id`,`crop_type_id`),
  KEY `fk_consumption_quotas_breed` (`tenant_id`,`livestock_breed_id`),
  KEY `fk_consumption_quotas_material` (`tenant_id`,`material_id`),
  KEY `idx_consumption_quotas_tenant` (`tenant_id`),
  KEY `idx_consumption_quotas_farm` (`farm_id`),
  CONSTRAINT `fk_consumption_quotas_breed` FOREIGN KEY (`tenant_id`, `livestock_breed_id`) REFERENCES `livestock_breeds` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_consumption_quotas_crop_type` FOREIGN KEY (`tenant_id`, `crop_type_id`) REFERENCES `crop_types` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_consumption_quotas_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consumption_quotas_material` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_consumption_quotas_qty` CHECK ((`standard_quantity` > 0.00)),
  CONSTRAINT `chk_consumption_quotas_target` CHECK ((((`crop_type_id` is not null) and (`livestock_breed_id` is null)) or ((`crop_type_id` is null) and (`livestock_breed_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cost_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_allocations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expense_id` bigint NOT NULL,
  `target_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint NOT NULL,
  `allocated_amount` decimal(14,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_cost_allocations_expense` (`expense_id`),
  KEY `idx_cost_allocations_target` (`target_type`,`target_id`),
  CONSTRAINT `fk_cost_allocations_expense` FOREIGN KEY (`expense_id`) REFERENCES `farm_expenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cost_allocations_amount` CHECK ((`allocated_amount` > 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cost_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cost_categories_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_cost_categories_tenant_id` (`tenant_id`,`id`),
  KEY `idx_cost_categories_tenant` (`tenant_id`),
  CONSTRAINT `fk_cost_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_cost_categories_type` CHECK ((`cost_type` in (_utf8mb4'MATERIALS',_utf8mb4'DIRECT_LABOR',_utf8mb4'MACHINERY_FUEL',_utf8mb4'DEPRECIATION',_utf8mb4'INDIRECT_OVERHEAD')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crop_seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_seasons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint NOT NULL,
  `operational_cycle_id` bigint DEFAULT NULL,
  `season_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `crop_type_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `expected_harvest_date` date DEFAULT NULL,
  `actual_harvest_date` date DEFAULT NULL,
  `planted_area_m2` decimal(12,2) NOT NULL,
  `seed_quantity` decimal(10,2) DEFAULT NULL,
  `estimated_yield_kg` decimal(12,2) DEFAULT NULL,
  `actual_yield_kg` decimal(12,2) DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SOIL_PREPARATION',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_crop_seasons_farm_code` (`tenant_id`,`farm_id`,`season_code`),
  UNIQUE KEY `uk_crop_seasons_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_crop_seasons_zone_composite` (`tenant_id`,`farm_id`,`zone_id`),
  KEY `fk_crop_seasons_crop_type_composite` (`tenant_id`,`crop_type_id`),
  KEY `fk_crop_seasons_cycle_composite` (`tenant_id`,`farm_id`,`operational_cycle_id`),
  KEY `idx_crop_seasons_tenant` (`tenant_id`),
  KEY `idx_crop_seasons_farm` (`farm_id`),
  KEY `idx_crop_seasons_zone` (`zone_id`),
  KEY `idx_crop_seasons_cycle` (`operational_cycle_id`),
  KEY `idx_crop_seasons_crop_type` (`crop_type_id`),
  CONSTRAINT `fk_crop_seasons_crop_type_composite` FOREIGN KEY (`tenant_id`, `crop_type_id`) REFERENCES `crop_types` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_crop_seasons_cycle_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `operational_cycle_id`) REFERENCES `operational_cycles` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_crop_seasons_zone_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `zone_id`) REFERENCES `production_zones` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_crop_seasons_area` CHECK ((`planted_area_m2` > 0.00)),
  CONSTRAINT `chk_crop_seasons_dates` CHECK ((((`expected_harvest_date` is null) or (`expected_harvest_date` >= `start_date`)) and ((`actual_harvest_date` is null) or (`actual_harvest_date` >= `start_date`)))),
  CONSTRAINT `chk_crop_seasons_status` CHECK ((`status` in (_utf8mb4'SOIL_PREPARATION',_utf8mb4'SOWING',_utf8mb4'GROWING',_utf8mb4'HARVESTING',_utf8mb4'CLOSED',_utf8mb4'CANCELLED'))),
  CONSTRAINT `chk_crop_seasons_yields` CHECK ((((`seed_quantity` is null) or (`seed_quantity` >= 0.00)) and ((`estimated_yield_kg` is null) or (`estimated_yield_kg` >= 0.00)) and ((`actual_yield_kg` is null) or (`actual_yield_kg` >= 0.00))))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crop_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `variety_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `growth_days_standard` int NOT NULL DEFAULT '90',
  `water_need_m3_day` decimal(8,2) DEFAULT NULL,
  `optimal_temp_min` decimal(5,2) DEFAULT NULL,
  `optimal_temp_max` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_crop_types_tenant_variety` (`tenant_id`,`variety_code`),
  UNIQUE KEY `uk_crop_types_tenant_id` (`tenant_id`,`id`),
  KEY `idx_crop_types_tenant` (`tenant_id`),
  CONSTRAINT `fk_crop_types_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_crop_types_growth_days` CHECK ((`growth_days_standard` > 0)),
  CONSTRAINT `chk_crop_types_temp_range` CHECK (((`optimal_temp_min` is null) or (`optimal_temp_max` is null) or (`optimal_temp_min` <= `optimal_temp_max`)))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `debt_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debt_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `partner_id` bigint NOT NULL,
  `sales_order_id` bigint DEFAULT NULL,
  `warehouse_receipt_id` bigint DEFAULT NULL,
  `debt_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_debt` decimal(14,2) NOT NULL,
  `paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `remaining_debt` decimal(14,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_debt_records_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_debt_records_partner_composite` (`tenant_id`,`partner_id`),
  KEY `fk_debt_records_order_composite` (`tenant_id`,`farm_id`,`sales_order_id`),
  KEY `fk_debt_records_receipt_composite` (`tenant_id`,`farm_id`,`warehouse_receipt_id`),
  KEY `idx_debt_records_tenant` (`tenant_id`),
  KEY `idx_debt_records_farm` (`farm_id`),
  KEY `idx_debt_records_partner` (`partner_id`),
  KEY `idx_debt_records_due` (`due_date`,`status`),
  CONSTRAINT `fk_debt_records_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_debt_records_order_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `sales_order_id`) REFERENCES `sales_orders` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_debt_records_partner_composite` FOREIGN KEY (`tenant_id`, `partner_id`) REFERENCES `partners` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_debt_records_receipt_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_receipt_id`) REFERENCES `warehouse_receipts` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_debt_records_amounts` CHECK (((`total_debt` >= 0.00) and (`paid_amount` >= 0.00) and (`remaining_debt` >= 0.00) and (`paid_amount` <= `total_debt`) and (`remaining_debt` = (`total_debt` - `paid_amount`)))),
  CONSTRAINT `chk_debt_records_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'OVERDUE',_utf8mb4'SETTLED',_utf8mb4'BAD_DEBT'))),
  CONSTRAINT `chk_debt_records_type` CHECK ((`debt_type` in (_utf8mb4'RECEIVABLE',_utf8mb4'PAYABLE')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joined_date` date NOT NULL,
  `base_salary` decimal(14,2) NOT NULL DEFAULT '0.00',
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT '0.00',
  `contract_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL_TIME',
  `annual_leave_quota` decimal(4,1) NOT NULL DEFAULT '12.0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employees_tenant_code` (`tenant_id`,`employee_code`),
  UNIQUE KEY `uk_employees_tenant_id` (`tenant_id`,`id`),
  KEY `fk_employees_farm_composite` (`tenant_id`,`farm_id`),
  KEY `idx_employees_tenant` (`tenant_id`),
  KEY `idx_employees_farm` (`farm_id`),
  KEY `idx_employees_user` (`user_id`),
  CONSTRAINT `fk_employees_farm_composite` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_employees_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_employees_contract` CHECK ((`contract_type` in (_utf8mb4'FULL_TIME',_utf8mb4'PART_TIME',_utf8mb4'SEASONAL',_utf8mb4'INTERN'))),
  CONSTRAINT `chk_employees_leave_quota` CHECK ((`annual_leave_quota` >= 0.0)),
  CONSTRAINT `chk_employees_salaries` CHECK (((`base_salary` >= 0.00) and (`hourly_rate` >= 0.00))),
  CONSTRAINT `chk_employees_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'ON_LEAVE',_utf8mb4'RESIGNED',_utf8mb4'TERMINATED')))
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enterprises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enterprises` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `tax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legal_representative` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headquarter_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `established_date` date DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_bin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certifications_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `fk_enterprises_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farm_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `role_in_farm` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_from` date NOT NULL,
  `assigned_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_farm_assignments_zone_composite` (`tenant_id`,`farm_id`,`zone_id`),
  KEY `idx_farm_assignments_tenant` (`tenant_id`),
  KEY `idx_farm_assignments_farm` (`farm_id`),
  KEY `idx_farm_assignments_zone` (`zone_id`),
  KEY `idx_farm_assignments_user` (`user_id`),
  CONSTRAINT `fk_farm_assignments_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_farm_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_farm_assignments_zone_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `zone_id`) REFERENCES `production_zones` (`tenant_id`, `farm_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `chk_farm_assignments_dates` CHECK (((`assigned_to` is null) or (`assigned_to` >= `assigned_from`))),
  CONSTRAINT `chk_farm_assignments_role` CHECK ((`role_in_farm` in (_utf8mb4'FARM_MANAGER',_utf8mb4'ZONE_MANAGER',_utf8mb4'TECHNICAL_LEAD',_utf8mb4'AGRONOMIST',_utf8mb4'VETERINARIAN',_utf8mb4'WAREHOUSE_KEEPER',_utf8mb4'ACCOUNTANT',_utf8mb4'FIELD_WORKER')))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farm_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `cost_category_id` bigint NOT NULL,
  `expense_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MANUAL',
  `reference_id` bigint DEFAULT NULL,
  `season_id` bigint DEFAULT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `unit_cost_eligible` tinyint(1) NOT NULL DEFAULT '1',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'BANK_TRANSFER',
  `recipient_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONFIRMED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farm_expenses_code` (`tenant_id`,`farm_id`,`expense_code`),
  UNIQUE KEY `uk_farm_expenses_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_farm_expenses_category_composite` (`tenant_id`,`cost_category_id`),
  KEY `fk_farm_expenses_season_composite` (`tenant_id`,`farm_id`,`season_id`),
  KEY `fk_farm_expenses_livestock_composite` (`tenant_id`,`farm_id`,`livestock_group_id`),
  KEY `idx_farm_expenses_tenant` (`tenant_id`),
  KEY `idx_farm_expenses_farm` (`farm_id`),
  KEY `idx_farm_expenses_source` (`expense_source`,`reference_id`),
  CONSTRAINT `fk_farm_expenses_category_composite` FOREIGN KEY (`tenant_id`, `cost_category_id`) REFERENCES `cost_categories` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_farm_expenses_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_farm_expenses_livestock_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_farm_expenses_season_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `season_id`) REFERENCES `crop_seasons` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_farm_expenses_amount` CHECK ((`amount` >= 0.00)),
  CONSTRAINT `chk_farm_expenses_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'CONFIRMED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farm_operational_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_operational_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `irrigation_threshold_json` json DEFAULT NULL,
  `work_shift_config_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `farm_id` (`farm_id`),
  KEY `fk_farm_operational_settings_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `idx_farm_operational_settings_tenant` (`tenant_id`),
  CONSTRAINT `fk_farm_operational_settings_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farm_task_assignees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_task_assignees` (
  `task_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role_in_task` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MEMBER',
  PRIMARY KEY (`task_id`,`employee_id`),
  KEY `fk_task_assignees_employee_composite` (`tenant_id`,`employee_id`),
  KEY `idx_task_assignees_emp` (`employee_id`),
  CONSTRAINT `fk_task_assignees_employee_composite` FOREIGN KEY (`tenant_id`, `employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_assignees_task` FOREIGN KEY (`task_id`) REFERENCES `farm_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farm_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farm_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint DEFAULT NULL,
  `task_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `assigned_to_employee_id` bigint DEFAULT NULL,
  `assigned_by_user_id` bigint DEFAULT NULL,
  `deadline` timestamp NULL DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TODO',
  `completion_notes` text COLLATE utf8mb4_unicode_ci,
  `photos_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farm_tasks_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_farm_tasks_zone` (`zone_id`),
  KEY `fk_farm_tasks_assigned_by` (`assigned_by_user_id`),
  KEY `idx_farm_tasks_tenant` (`tenant_id`),
  KEY `idx_farm_tasks_farm` (`farm_id`),
  KEY `idx_farm_tasks_assigned` (`assigned_to_employee_id`),
  CONSTRAINT `fk_farm_tasks_assigned_by` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farm_tasks_assigned_to` FOREIGN KEY (`assigned_to_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farm_tasks_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_farm_tasks_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_farm_tasks_priority` CHECK ((`priority` in (_utf8mb4'LOW',_utf8mb4'MEDIUM',_utf8mb4'HIGH',_utf8mb4'URGENT'))),
  CONSTRAINT `chk_farm_tasks_status` CHECK ((`status` in (_utf8mb4'TODO',_utf8mb4'IN_PROGRESS',_utf8mb4'PENDING_REVIEW',_utf8mb4'DONE',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farming_log_supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farming_log_supplies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `farming_log_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actual_quantity` decimal(12,2) NOT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `warehouse_issue_item_id` bigint DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_farming_log_supplies_material_composite` (`tenant_id`,`material_id`),
  KEY `fk_farming_log_supplies_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_farming_log_supplies_issue_item` (`warehouse_issue_item_id`),
  KEY `idx_farming_log_supplies_log` (`farming_log_id`),
  KEY `idx_farming_log_supplies_material` (`material_id`),
  CONSTRAINT `fk_farming_log_supplies_issue_item` FOREIGN KEY (`warehouse_issue_item_id`) REFERENCES `warehouse_issue_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farming_log_supplies_log` FOREIGN KEY (`farming_log_id`) REFERENCES `farming_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_farming_log_supplies_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_farming_log_supplies_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_farming_supplies_cost` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_farming_supplies_qty` CHECK ((`actual_quantity` > 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farming_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farming_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `season_id` bigint NOT NULL,
  `log_date` date NOT NULL,
  `stage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phi_days` int NOT NULL DEFAULT '0',
  `phi_end_date` date DEFAULT NULL,
  `supplies_used_json` json DEFAULT NULL,
  `weather_notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by_user_id` bigint DEFAULT NULL,
  `image_urls_json` json DEFAULT NULL,
  `is_inventory_backflushed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farming_logs_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_farming_logs_season_composite` (`tenant_id`,`farm_id`,`season_id`),
  KEY `fk_farming_logs_performed_by` (`performed_by_user_id`),
  KEY `idx_farming_logs_tenant` (`tenant_id`),
  KEY `idx_farming_logs_farm` (`farm_id`),
  KEY `idx_farming_logs_season` (`season_id`),
  KEY `idx_farming_logs_date` (`log_date`),
  CONSTRAINT `fk_farming_logs_performed_by` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farming_logs_season_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `season_id`) REFERENCES `crop_seasons` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_farming_logs_activity` CHECK ((`activity_type` in (_utf8mb4'SOIL_TILLAGE',_utf8mb4'IRRIGATION',_utf8mb4'FERTILIZATION',_utf8mb4'PESTICIDE_APPLICATION',_utf8mb4'PRUNING',_utf8mb4'WEEDING',_utf8mb4'HARVESTING'))),
  CONSTRAINT `chk_farming_logs_phi` CHECK ((`phi_days` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `farms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `farm_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_area_m2` decimal(12,2) NOT NULL DEFAULT '0.00',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `geofence_radius_m` int NOT NULL DEFAULT '300',
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_user_id` bigint DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_farms_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_farms_tenant_id` (`tenant_id`,`id`),
  KEY `fk_farms_manager` (`manager_user_id`),
  KEY `idx_farms_tenant` (`tenant_id`),
  CONSTRAINT `fk_farms_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farms_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_farms_area` CHECK ((`total_area_m2` >= 0.00)),
  CONSTRAINT `chk_farms_geofence` CHECK ((`geofence_radius_m` > 0)),
  CONSTRAINT `chk_farms_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'MAINTENANCE'))),
  CONSTRAINT `chk_farms_type` CHECK ((`farm_type` in (_utf8mb4'CROP',_utf8mb4'LIVESTOCK',_utf8mb4'MIXED')))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `script` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `harvest_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `harvest_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `harvest_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `harvest_date` date NOT NULL,
  `source_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `season_id` bigint DEFAULT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quality_grade` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `harvested_by_user_id` bigint DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_harvest_records_code` (`tenant_id`,`farm_id`,`harvest_code`),
  UNIQUE KEY `uk_harvest_records_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_harvest_records_season_composite` (`tenant_id`,`farm_id`,`season_id`),
  KEY `fk_harvest_records_group_composite` (`tenant_id`,`farm_id`,`livestock_group_id`),
  KEY `fk_harvest_records_user` (`harvested_by_user_id`),
  KEY `idx_harvest_records_tenant` (`tenant_id`),
  KEY `idx_harvest_records_farm` (`farm_id`),
  KEY `idx_harvest_records_date` (`harvest_date`),
  CONSTRAINT `fk_harvest_records_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_harvest_records_group_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_harvest_records_season_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `season_id`) REFERENCES `crop_seasons` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_harvest_records_user` FOREIGN KEY (`harvested_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_harvest_records_qty` CHECK ((`quantity` > 0.00)),
  CONSTRAINT `chk_harvest_records_source` CHECK ((((`source_type` = _utf8mb4'CROP_SEASON') and (`season_id` is not null) and (`livestock_group_id` is null)) or ((`source_type` = _utf8mb4'LIVESTOCK_GROUP') and (`livestock_group_id` is not null) and (`season_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `label_print_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `label_print_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `product_batch_id` bigint NOT NULL,
  `printed_by_user_id` bigint DEFAULT NULL,
  `label_size` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `print_quantity` int NOT NULL,
  `printed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `printer_model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_label_print_logs_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_label_print_logs_user` (`printed_by_user_id`),
  KEY `idx_label_print_logs_tenant` (`tenant_id`),
  KEY `idx_label_print_logs_farm` (`farm_id`),
  KEY `idx_label_print_logs_batch` (`product_batch_id`),
  CONSTRAINT `fk_label_print_logs_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_label_print_logs_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_label_print_logs_user` FOREIGN KEY (`printed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_label_print_qty` CHECK ((`print_quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `leave_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(4,1) NOT NULL DEFAULT '1.0',
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approved_by_user_id` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_leave_requests_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_leave_requests_employee_composite` (`tenant_id`,`employee_id`),
  KEY `fk_leave_requests_approved_by` (`approved_by_user_id`),
  KEY `idx_leave_requests_tenant` (`tenant_id`),
  KEY `idx_leave_requests_farm` (`farm_id`),
  KEY `idx_leave_requests_employee` (`employee_id`),
  CONSTRAINT `fk_leave_requests_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_requests_employee_composite` FOREIGN KEY (`tenant_id`, `employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_requests_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `chk_leave_requests_dates` CHECK (((`end_date` >= `start_date`) and (`total_days` > 0.0))),
  CONSTRAINT `chk_leave_requests_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'APPROVED',_utf8mb4'REJECTED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_breeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_breeds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `species` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `breed_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `standard_growth_days` int DEFAULT NULL,
  `target_weight_kg` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  `management_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FLOCK_HERD',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_livestock_breeds_tenant_code` (`tenant_id`,`species`,`breed_name`),
  UNIQUE KEY `uk_livestock_breeds_tenant_id` (`tenant_id`,`id`),
  KEY `idx_livestock_breeds_tenant` (`tenant_id`),
  CONSTRAINT `fk_livestock_breeds_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_livestock_breeds_metrics` CHECK ((((`standard_growth_days` is null) or (`standard_growth_days` > 0)) and ((`target_weight_kg` is null) or (`target_weight_kg` > 0.00)))),
  CONSTRAINT `chk_livestock_breeds_species` CHECK ((`species` in (_utf8mb4'CATTLE',_utf8mb4'SWINE',_utf8mb4'POULTRY',_utf8mb4'GOAT',_utf8mb4'SHEEP')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_event_supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_event_supplies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `livestock_event_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actual_quantity` decimal(12,2) NOT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `warehouse_issue_item_id` bigint DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_livestock_event_supplies_material_composite` (`tenant_id`,`material_id`),
  KEY `fk_livestock_event_supplies_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_livestock_event_supplies_issue_item` (`warehouse_issue_item_id`),
  KEY `idx_livestock_event_supplies_event` (`livestock_event_id`),
  KEY `idx_livestock_event_supplies_material` (`material_id`),
  CONSTRAINT `fk_livestock_event_supplies_event` FOREIGN KEY (`livestock_event_id`) REFERENCES `livestock_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_livestock_event_supplies_issue_item` FOREIGN KEY (`warehouse_issue_item_id`) REFERENCES `warehouse_issue_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_livestock_event_supplies_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_event_supplies_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_livestock_supplies_cost` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_livestock_supplies_qty` CHECK ((`actual_quantity` > 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `target_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `livestock_individual_id` bigint DEFAULT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `withdrawal_days` int NOT NULL DEFAULT '0',
  `withdrawal_end_date` date DEFAULT NULL,
  `is_quarantined` tinyint(1) NOT NULL DEFAULT '0',
  `details_json` json DEFAULT NULL,
  `veterinarian_user_id` bigint DEFAULT NULL,
  `is_inventory_backflushed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_livestock_events_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_livestock_events_group` (`tenant_id`,`farm_id`,`livestock_group_id`),
  KEY `fk_livestock_events_individual` (`tenant_id`,`farm_id`,`livestock_individual_id`),
  KEY `fk_livestock_events_vet` (`veterinarian_user_id`),
  KEY `idx_livestock_events_tenant` (`tenant_id`),
  KEY `idx_livestock_events_farm` (`farm_id`),
  KEY `idx_livestock_events_group` (`livestock_group_id`),
  KEY `idx_livestock_events_individual` (`livestock_individual_id`),
  KEY `idx_livestock_events_date` (`event_date`),
  CONSTRAINT `fk_livestock_events_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_events_group` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_events_individual` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_individual_id`) REFERENCES `livestock_individuals` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_events_vet` FOREIGN KEY (`veterinarian_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_livestock_event_target` CHECK ((((`target_type` = _utf8mb4'GROUP') and (`livestock_group_id` is not null) and (`livestock_individual_id` is null)) or ((`target_type` = _utf8mb4'INDIVIDUAL') and (`livestock_individual_id` is not null) and (`livestock_group_id` is null)))),
  CONSTRAINT `chk_livestock_events_type` CHECK ((`event_type` in (_utf8mb4'VACCINATION',_utf8mb4'WEIGHT_CHECK',_utf8mb4'BREEDING',_utf8mb4'BIRTH',_utf8mb4'MEDICAL_TREATMENT',_utf8mb4'TRANSFER',_utf8mb4'SLAUGHTER'))),
  CONSTRAINT `chk_livestock_events_withdrawal` CHECK ((`withdrawal_days` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint NOT NULL,
  `operational_cycle_id` bigint DEFAULT NULL,
  `group_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `breed_id` bigint NOT NULL,
  `partner_id` bigint DEFAULT NULL,
  `initial_quantity` int NOT NULL,
  `unit_price` decimal(14,2) DEFAULT NULL,
  `total_cost` decimal(14,2) DEFAULT NULL,
  `avg_initial_weight_kg` decimal(8,2) DEFAULT NULL,
  `health_certificate` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `current_quantity` int NOT NULL,
  `entry_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  `management_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FLOCK_HERD',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_livestock_groups_code` (`tenant_id`,`farm_id`,`group_code`),
  UNIQUE KEY `uk_livestock_groups_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_livestock_groups_zone_composite` (`tenant_id`,`farm_id`,`zone_id`),
  KEY `fk_livestock_groups_breed_composite` (`tenant_id`,`breed_id`),
  KEY `fk_livestock_groups_cycle_composite` (`tenant_id`,`farm_id`,`operational_cycle_id`),
  KEY `idx_livestock_groups_tenant` (`tenant_id`),
  KEY `idx_livestock_groups_farm` (`farm_id`),
  KEY `idx_livestock_groups_zone` (`zone_id`),
  KEY `idx_livestock_groups_cycle` (`operational_cycle_id`),
  CONSTRAINT `fk_livestock_groups_breed_composite` FOREIGN KEY (`tenant_id`, `breed_id`) REFERENCES `livestock_breeds` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_groups_cycle_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `operational_cycle_id`) REFERENCES `operational_cycles` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_groups_zone_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `zone_id`) REFERENCES `production_zones` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_livestock_groups_qty` CHECK (((`initial_quantity` >= 0) and (`current_quantity` >= 0))),
  CONSTRAINT `chk_livestock_groups_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'QUARANTINED',_utf8mb4'SOLD',_utf8mb4'CULLED')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_individuals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_individuals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint NOT NULL,
  `rfid_tag_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` bigint DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `mother_tag_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_tag_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_weight_kg` decimal(8,2) DEFAULT NULL,
  `health_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HEALTHY',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_livestock_individuals_rfid` (`tenant_id`,`rfid_tag_code`),
  UNIQUE KEY `uk_livestock_individuals_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_livestock_ind_zone_composite` (`tenant_id`,`farm_id`,`zone_id`),
  KEY `fk_livestock_ind_group_composite` (`tenant_id`,`farm_id`,`group_id`),
  KEY `idx_livestock_individuals_tenant` (`tenant_id`),
  KEY `idx_livestock_individuals_farm` (`farm_id`),
  KEY `idx_livestock_individuals_group` (`group_id`),
  CONSTRAINT `fk_livestock_ind_group_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_livestock_ind_zone_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `zone_id`) REFERENCES `production_zones` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_livestock_ind_gender` CHECK ((`gender` in (_utf8mb4'MALE',_utf8mb4'FEMALE',_utf8mb4'CASTRATED'))),
  CONSTRAINT `chk_livestock_ind_health` CHECK ((`health_status` in (_utf8mb4'HEALTHY',_utf8mb4'SICK',_utf8mb4'INJURED',_utf8mb4'QUARANTINED',_utf8mb4'DECEASED',_utf8mb4'SOLD'))),
  CONSTRAINT `chk_livestock_ind_weight` CHECK (((`current_weight_kg` is null) or (`current_weight_kg` >= 0.00)))
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livestock_weight_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livestock_weight_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `target_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INDIVIDUAL',
  `individual_id` bigint DEFAULT NULL,
  `group_id` bigint DEFAULT NULL,
  `record_date` date NOT NULL,
  `weight_kg` decimal(8,2) NOT NULL,
  `recorded_by_user_id` bigint DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_weight_logs_individual` (`tenant_id`,`farm_id`,`individual_id`),
  KEY `fk_weight_logs_group` (`tenant_id`,`farm_id`,`group_id`),
  KEY `fk_weight_logs_user` (`recorded_by_user_id`),
  KEY `idx_weight_logs_tenant` (`tenant_id`),
  KEY `idx_weight_logs_farm` (`farm_id`),
  KEY `idx_weight_logs_individual` (`individual_id`),
  KEY `idx_weight_logs_group` (`group_id`),
  KEY `idx_weight_logs_date` (`record_date`),
  CONSTRAINT `fk_weight_logs_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_weight_logs_group` FOREIGN KEY (`tenant_id`, `farm_id`, `group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_weight_logs_individual` FOREIGN KEY (`tenant_id`, `farm_id`, `individual_id`) REFERENCES `livestock_individuals` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_weight_logs_user` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_weight_log_target` CHECK ((((`target_type` = _utf8mb4'INDIVIDUAL') and (`individual_id` is not null) and (`group_id` is null)) or ((`target_type` = _utf8mb4'GROUP') and (`group_id` is not null) and (`individual_id` is null)))),
  CONSTRAINT `chk_weight_positive` CHECK ((`weight_kg` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `material_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_categories_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_material_categories_tenant_id` (`tenant_id`,`id`),
  KEY `idx_material_categories_tenant` (`tenant_id`),
  CONSTRAINT `fk_material_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `material_unit_conversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_unit_conversions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `unit_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversion_factor` decimal(12,4) NOT NULL,
  `is_purchase_unit` tinyint(1) NOT NULL DEFAULT '0',
  `is_dispatch_unit` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_unit_name` (`material_id`,`unit_name`),
  UNIQUE KEY `uk_unit_conv_tenant_barcode` (`tenant_id`,`unit_barcode`),
  KEY `fk_unit_conversions_material` (`tenant_id`,`material_id`),
  KEY `idx_unit_conv_tenant` (`tenant_id`),
  CONSTRAINT `fk_unit_conversions_material` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `chk_unit_conv_factor` CHECK ((`conversion_factor` > 0.0000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  `sku_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `standard_unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispatch_strategy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIFO',
  `expiry_alert_days` int NOT NULL DEFAULT '30',
  `min_stock_level` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_stock_level` decimal(12,2) DEFAULT NULL,
  `unit_price_standard` decimal(14,2) NOT NULL DEFAULT '0.00',
  `manufacturer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_ingredient` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_phi_days` int NOT NULL DEFAULT '0',
  `shelf_life_days` int DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_materials_sku` (`tenant_id`,`sku_code`),
  UNIQUE KEY `uk_materials_tenant_id` (`tenant_id`,`id`),
  UNIQUE KEY `uk_materials_tenant_barcode` (`tenant_id`,`barcode`),
  KEY `fk_materials_category_composite` (`tenant_id`,`category_id`),
  KEY `idx_materials_tenant` (`tenant_id`),
  KEY `idx_materials_category` (`category_id`),
  CONSTRAINT `fk_materials_category_composite` FOREIGN KEY (`tenant_id`, `category_id`) REFERENCES `material_categories` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_materials_alert_days` CHECK ((`expiry_alert_days` >= 0)),
  CONSTRAINT `chk_materials_dispatch` CHECK ((`dispatch_strategy` in (_utf8mb4'FIFO',_utf8mb4'FEFO'))),
  CONSTRAINT `chk_materials_max_stock` CHECK (((`max_stock_level` is null) or (`max_stock_level` >= `min_stock_level`))),
  CONSTRAINT `chk_materials_min_stock` CHECK ((`min_stock_level` >= 0.00)),
  CONSTRAINT `chk_materials_phi` CHECK ((`default_phi_days` >= 0)),
  CONSTRAINT `chk_materials_price` CHECK ((`unit_price_standard` >= 0.00)),
  CONSTRAINT `chk_materials_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'DISCONTINUED')))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint DEFAULT NULL,
  `action_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`,`created_at`),
  KEY `idx_notifications_tenant` (`tenant_id`),
  KEY `idx_notifications_reference` (`reference_type`,`reference_id`),
  KEY `idx_notifications_created_at` (`created_at`),
  CONSTRAINT `fk_notifications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_notifications_type` CHECK ((`type` in (_utf8mb4'INFO',_utf8mb4'WARNING',_utf8mb4'ALERT',_utf8mb4'TASK',_utf8mb4'QC',_utf8mb4'SYSTEM')))
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `operational_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operational_cycles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fiscal_year` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PLANNING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_operational_cycles_farm_year_name` (`farm_id`,`fiscal_year`,`name`),
  UNIQUE KEY `uk_operational_cycles_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `idx_operational_cycles_tenant` (`tenant_id`),
  KEY `idx_operational_cycles_farm` (`farm_id`),
  CONSTRAINT `fk_operational_cycles_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_operational_cycles_dates` CHECK ((`end_date` >= `start_date`)),
  CONSTRAINT `chk_operational_cycles_status` CHECK ((`status` in (_utf8mb4'PLANNING',_utf8mb4'ACTIVE',_utf8mb4'CLOSED')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `overtime_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `overtime_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint DEFAULT NULL,
  `ot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_hours` decimal(4,2) NOT NULL,
  `ot_multiplier` decimal(3,2) NOT NULL DEFAULT '1.50',
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approved_by_user_id` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_overtime_requests_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_overtime_requests_employee_composite` (`tenant_id`,`employee_id`),
  KEY `fk_overtime_requests_shift` (`shift_id`),
  KEY `fk_overtime_requests_approved_by` (`approved_by_user_id`),
  KEY `idx_overtime_requests_tenant` (`tenant_id`),
  KEY `idx_overtime_requests_farm` (`farm_id`),
  KEY `idx_overtime_requests_employee` (`employee_id`),
  CONSTRAINT `fk_overtime_requests_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_overtime_requests_employee_composite` FOREIGN KEY (`tenant_id`, `employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_overtime_requests_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_overtime_requests_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_overtime_requests_hours` CHECK (((`total_hours` > 0.00) and (`ot_multiplier` >= 1.00))),
  CONSTRAINT `chk_overtime_requests_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'APPROVED',_utf8mb4'REJECTED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_bin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_rating` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'UNRATED',
  `credit_limit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_term_days` int NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_partners_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_partners_tenant_id` (`tenant_id`,`id`),
  KEY `idx_partners_tenant` (`tenant_id`),
  KEY `fk_partners_farm` (`farm_id`),
  KEY `idx_partners_tenant_farm` (`tenant_id`,`farm_id`),
  CONSTRAINT `fk_partners_farm` FOREIGN KEY (`farm_id`) REFERENCES `farms` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_partners_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_partners_credit` CHECK (((`credit_limit` >= 0.00) and (`payment_term_days` >= 0))),
  CONSTRAINT `chk_partners_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'BLACKLISTED'))),
  CONSTRAINT `chk_partners_type` CHECK ((`partner_type` in (_utf8mb4'SUPPLIER',_utf8mb4'BUYER',_utf8mb4'LOGISTICS',_utf8mb4'AGENT')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `payment_id` bigint NOT NULL,
  `debt_record_id` bigint NOT NULL,
  `allocated_amount` decimal(14,2) NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_allocations_pay_debt` (`payment_id`,`debt_record_id`),
  KEY `fk_payment_alloc_payment_composite` (`tenant_id`,`farm_id`,`payment_id`),
  KEY `fk_payment_alloc_debt_composite` (`tenant_id`,`farm_id`,`debt_record_id`),
  KEY `idx_payment_alloc_tenant` (`tenant_id`),
  KEY `idx_payment_alloc_farm` (`farm_id`),
  KEY `idx_payment_alloc_debt` (`debt_record_id`),
  CONSTRAINT `fk_payment_alloc_debt_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `debt_record_id`) REFERENCES `debt_records` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_alloc_payment_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `payment_id`) REFERENCES `payment_transactions` (`tenant_id`, `farm_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `chk_payment_alloc_amount` CHECK ((`allocated_amount` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `payment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` bigint DEFAULT NULL,
  `sales_order_id` bigint DEFAULT NULL,
  `warehouse_receipt_id` bigint DEFAULT NULL,
  `debt_record_id` bigint DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `allocated_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BANK_TRANSFER',
  `reference_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_transfer_content` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_by_user_id` bigint DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `payment_date` date NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_transactions_code` (`tenant_id`,`farm_id`,`payment_code`),
  UNIQUE KEY `uk_payment_transactions_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_payment_trans_partner_composite` (`tenant_id`,`partner_id`),
  KEY `fk_payment_trans_order_composite` (`tenant_id`,`farm_id`,`sales_order_id`),
  KEY `fk_payment_trans_receipt_composite` (`tenant_id`,`farm_id`,`warehouse_receipt_id`),
  KEY `fk_payment_trans_debt_composite` (`tenant_id`,`farm_id`,`debt_record_id`),
  KEY `idx_payment_trans_tenant` (`tenant_id`),
  KEY `idx_payment_trans_farm` (`farm_id`),
  KEY `idx_payment_trans_partner` (`partner_id`),
  KEY `idx_payment_trans_order` (`sales_order_id`),
  KEY `idx_payment_trans_debt` (`debt_record_id`),
  KEY `idx_payment_trans_date` (`payment_date`),
  KEY `idx_payment_trans_confirmed_by` (`confirmed_by_user_id`),
  CONSTRAINT `fk_payment_trans_confirmed_by` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payment_trans_debt_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `debt_record_id`) REFERENCES `debt_records` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_trans_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_trans_order_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `sales_order_id`) REFERENCES `sales_orders` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_trans_partner_composite` FOREIGN KEY (`tenant_id`, `partner_id`) REFERENCES `partners` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_trans_receipt_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_receipt_id`) REFERENCES `warehouse_receipts` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_payment_trans_alloc` CHECK (((`allocated_amount` >= 0.00) and (`allocated_amount` <= `amount`))),
  CONSTRAINT `chk_payment_trans_amount` CHECK ((`amount` > 0.00)),
  CONSTRAINT `chk_payment_trans_method` CHECK ((`payment_method` in (_utf8mb4'CASH',_utf8mb4'BANK_TRANSFER',_utf8mb4'VIETQR',_utf8mb4'E_WALLET',_utf8mb4'DEBT_OFFSET'))),
  CONSTRAINT `chk_payment_trans_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED'))),
  CONSTRAINT `chk_payment_trans_type` CHECK ((`payment_type` in (_utf8mb4'RECEIPT',_utf8mb4'PAYMENT',_utf8mb4'REFUND')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_batch_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batch_sources` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_batch_id` bigint NOT NULL,
  `source_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `harvest_record_id` bigint DEFAULT NULL,
  `crop_season_id` bigint DEFAULT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `contributed_quantity` decimal(12,2) NOT NULL,
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `harvest_date` date NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_batch_sources_harvest_record` (`harvest_record_id`),
  KEY `fk_batch_sources_season` (`crop_season_id`),
  KEY `fk_batch_sources_group` (`livestock_group_id`),
  KEY `idx_batch_sources_batch` (`product_batch_id`),
  CONSTRAINT `fk_batch_sources_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_batch_sources_group` FOREIGN KEY (`livestock_group_id`) REFERENCES `livestock_groups` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_sources_harvest_record` FOREIGN KEY (`harvest_record_id`) REFERENCES `harvest_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_sources_season` FOREIGN KEY (`crop_season_id`) REFERENCES `crop_seasons` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_source_qty` CHECK ((`contributed_quantity` > 0.00)),
  CONSTRAINT `chk_batch_source_valid` CHECK ((((`source_type` = _utf8mb4'HARVEST_RECORD') and (`harvest_record_id` is not null) and (`crop_season_id` is null) and (`livestock_group_id` is null)) or ((`source_type` = _utf8mb4'CROP_SEASON') and (`crop_season_id` is not null) and (`harvest_record_id` is null) and (`livestock_group_id` is null)) or ((`source_type` = _utf8mb4'LIVESTOCK_GROUP') and (`livestock_group_id` is not null) and (`harvest_record_id` is null) and (`crop_season_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_batch_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batch_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `product_batch_id` bigint NOT NULL,
  `transaction_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` bigint NOT NULL,
  `reference_item_id` bigint DEFAULT NULL,
  `direction` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `balance_before` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_batch_trans_batch_composite` (`tenant_id`,`farm_id`,`product_batch_id`),
  KEY `idx_batch_trans_tenant` (`tenant_id`),
  KEY `idx_batch_trans_farm` (`farm_id`),
  KEY `idx_batch_trans_batch` (`product_batch_id`),
  KEY `idx_batch_trans_date` (`transaction_date`),
  CONSTRAINT `fk_batch_trans_batch_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `product_batch_id`) REFERENCES `product_batches` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_trans_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_trans_balance_math` CHECK ((((`direction` = _utf8mb4'IN') and (`balance_after` = (`balance_before` + `quantity`))) or ((`direction` = _utf8mb4'OUT') and (`balance_after` = (`balance_before` - `quantity`))))),
  CONSTRAINT `chk_batch_trans_balances` CHECK (((`balance_before` >= 0.00) and (`balance_after` >= 0.00))),
  CONSTRAINT `chk_batch_trans_direction` CHECK ((`direction` in (_utf8mb4'IN',_utf8mb4'OUT'))),
  CONSTRAINT `chk_batch_trans_qty` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint DEFAULT NULL,
  `season_id` bigint DEFAULT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `batch_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gtin_barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `traceability_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `harvest_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `storage_conditions` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initial_quantity` decimal(12,2) NOT NULL,
  `remaining_quantity` decimal(12,2) NOT NULL,
  `reserved_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quality_grade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'STANDARD',
  `qr_image_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  `approved_by_user_id` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by_user_id` bigint DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recalled_by_user_id` bigint DEFAULT NULL,
  `recalled_at` timestamp NULL DEFAULT NULL,
  `recall_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_batch_code` (`tenant_id`,`farm_id`,`batch_code`),
  UNIQUE KEY `uk_product_batches_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  UNIQUE KEY `uk_product_batches_tenant_id` (`tenant_id`,`id`),
  UNIQUE KEY `traceability_code` (`traceability_code`),
  KEY `fk_product_batches_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_product_batches_season_composite` (`tenant_id`,`farm_id`,`season_id`),
  KEY `fk_product_batches_livestock_composite` (`tenant_id`,`farm_id`,`livestock_group_id`),
  KEY `fk_product_batches_approved_by` (`approved_by_user_id`),
  KEY `fk_product_batches_rejected_by` (`rejected_by_user_id`),
  KEY `fk_product_batches_recalled_by` (`recalled_by_user_id`),
  KEY `idx_product_batches_tenant` (`tenant_id`),
  KEY `idx_product_batches_farm` (`farm_id`),
  KEY `idx_product_batches_status` (`status`),
  KEY `idx_product_batches_trace_code` (`traceability_code`),
  CONSTRAINT `fk_product_batches_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_batches_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_batches_livestock_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_batches_recalled_by` FOREIGN KEY (`recalled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_batches_rejected_by` FOREIGN KEY (`rejected_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_batches_season_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `season_id`) REFERENCES `crop_seasons` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_batches_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_batches_dates` CHECK (((`expiry_date` is null) or (`expiry_date` >= `harvest_date`))),
  CONSTRAINT `chk_product_batches_quantities` CHECK (((`initial_quantity` > 0.00) and (`remaining_quantity` >= 0.00) and (`remaining_quantity` <= `initial_quantity`) and (`reserved_quantity` >= 0.00) and (`reserved_quantity` <= `remaining_quantity`))),
  CONSTRAINT `chk_product_batches_status` CHECK ((`status` in (_utf8mb4'PENDING_APPROVAL',_utf8mb4'READY_TO_PRINT',_utf8mb4'PRINTED',_utf8mb4'SELLING',_utf8mb4'REJECTED',_utf8mb4'RECALLED')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `production_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_zones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zone_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_m2` decimal(12,2) NOT NULL DEFAULT '0.00',
  `soil_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `water_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `map_layout_json` json DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_zones_farm_code` (`farm_id`,`code`),
  UNIQUE KEY `uk_production_zones_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `idx_production_zones_tenant` (`tenant_id`),
  KEY `idx_production_zones_farm` (`farm_id`),
  CONSTRAINT `fk_production_zones_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_production_zones_area` CHECK ((`area_m2` >= 0.00)),
  CONSTRAINT `chk_production_zones_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'FALLOW',_utf8mb4'QUARANTINE',_utf8mb4'MAINTENANCE'))),
  CONSTRAINT `chk_production_zones_type` CHECK ((`zone_type` in (_utf8mb4'GREENHOUSE',_utf8mb4'OPEN_FIELD',_utf8mb4'BARN',_utf8mb4'STORAGE',_utf8mb4'ISOLATION')))
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `qc_inspection_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qc_inspection_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inspection_id` bigint NOT NULL,
  `parameter_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `standard_threshold` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `measured_value` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_passed` tinyint(1) NOT NULL DEFAULT '1',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qc_items_inspection` (`inspection_id`),
  CONSTRAINT `fk_qc_items_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `qc_inspections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `qc_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qc_inspections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `product_batch_id` bigint NOT NULL,
  `inspection_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspection_date` date NOT NULL,
  `inspector_user_id` bigint DEFAULT NULL,
  `sample_size` decimal(10,2) NOT NULL,
  `sample_unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `overall_result` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_qc_inspections_code` (`tenant_id`,`farm_id`,`inspection_code`),
  UNIQUE KEY `uk_qc_inspections_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_qc_inspections_batch_composite` (`tenant_id`,`farm_id`,`product_batch_id`),
  KEY `fk_qc_inspections_user` (`inspector_user_id`),
  KEY `idx_qc_inspections_tenant` (`tenant_id`),
  KEY `idx_qc_inspections_batch` (`product_batch_id`),
  CONSTRAINT `fk_qc_inspections_batch_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `product_batch_id`) REFERENCES `product_batches` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_qc_inspections_user` FOREIGN KEY (`inspector_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_qc_result` CHECK ((`overall_result` in (_utf8mb4'PENDING',_utf8mb4'PASSED',_utf8mb4'REJECTED',_utf8mb4'CONDITIONAL'))),
  CONSTRAINT `chk_qc_sample_size` CHECK ((`sample_size` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `revoked_at` timestamp NULL DEFAULT NULL,
  `replaced_by_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by_ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_refresh_tokens_user` (`user_id`),
  KEY `idx_refresh_tokens_token` (`token`),
  KEY `idx_refresh_tokens_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=631 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_level` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SYSTEM',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `chk_roles_scope` CHECK ((`scope_level` in (_utf8mb4'SYSTEM',_utf8mb4'TENANT',_utf8mb4'FARM')))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_deliveries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `sales_order_id` bigint NOT NULL,
  `logistics_partner_id` bigint DEFAULT NULL,
  `delivery_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_date` date NOT NULL,
  `driver_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_plate` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_of_delivery_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `delivered_by_user_id` bigint DEFAULT NULL,
  `receiver_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_shipped_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sales_deliveries_code` (`tenant_id`,`farm_id`,`delivery_code`),
  UNIQUE KEY `uk_sales_deliveries_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_sales_deliveries_order_composite` (`tenant_id`,`farm_id`,`sales_order_id`),
  KEY `fk_sales_deliveries_logistics_composite` (`tenant_id`,`logistics_partner_id`),
  KEY `fk_sales_deliveries_user` (`delivered_by_user_id`),
  KEY `idx_sales_deliveries_tenant` (`tenant_id`),
  KEY `idx_sales_deliveries_farm` (`farm_id`),
  KEY `idx_sales_deliveries_order` (`sales_order_id`),
  KEY `idx_sales_deliveries_logistics` (`logistics_partner_id`),
  CONSTRAINT `fk_sales_deliveries_logistics_composite` FOREIGN KEY (`tenant_id`, `logistics_partner_id`) REFERENCES `partners` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sales_deliveries_order_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `sales_order_id`) REFERENCES `sales_orders` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sales_deliveries_user` FOREIGN KEY (`delivered_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_sales_deliveries_amount` CHECK ((`total_shipped_amount` >= 0.00)),
  CONSTRAINT `chk_sales_deliveries_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'DISPATCHED',_utf8mb4'DELIVERED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales_delivery_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_delivery_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `delivery_id` bigint NOT NULL,
  `sales_order_item_id` bigint NOT NULL,
  `product_batch_id` bigint NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_delivery_items_delivery` (`delivery_id`),
  KEY `idx_delivery_items_order_item` (`sales_order_item_id`),
  KEY `idx_delivery_items_batch` (`product_batch_id`),
  CONSTRAINT `fk_delivery_items_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_delivery_items_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `sales_deliveries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delivery_items_order_item` FOREIGN KEY (`sales_order_item_id`) REFERENCES `sales_order_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_delivery_item_cost` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_delivery_item_qty` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sales_order_id` bigint NOT NULL,
  `product_batch_id` bigint DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `shipped_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `vat_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_sales_order_items_batch` (`product_batch_id`),
  KEY `idx_sales_order_items_order` (`sales_order_id`),
  CONSTRAINT `fk_sales_order_items_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sales_order_items_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_sales_order_items_prices` CHECK (((`unit_price` >= 0.00) and (`discount_amount` >= 0.00) and (`vat_amount` >= 0.00) and (`final_amount` >= 0.00))),
  CONSTRAINT `chk_sales_order_items_qty` CHECK ((`quantity` > 0.00)),
  CONSTRAINT `chk_sales_order_items_shipped` CHECK (((`shipped_quantity` >= 0.00) and (`shipped_quantity` <= `quantity`)))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `order_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` bigint NOT NULL,
  `order_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `subtotal_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `vat_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `debt_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sales_orders_code` (`tenant_id`,`farm_id`,`order_code`),
  UNIQUE KEY `uk_sales_orders_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_sales_orders_partner_composite` (`tenant_id`,`partner_id`),
  KEY `idx_sales_orders_tenant` (`tenant_id`),
  KEY `idx_sales_orders_farm` (`farm_id`),
  KEY `idx_sales_orders_partner` (`partner_id`),
  KEY `idx_sales_orders_payment` (`payment_status`),
  KEY `idx_sales_orders_date` (`order_date`),
  CONSTRAINT `fk_sales_orders_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sales_orders_partner_composite` FOREIGN KEY (`tenant_id`, `partner_id`) REFERENCES `partners` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_sales_orders_financials` CHECK (((`subtotal_amount` >= 0.00) and (`discount_amount` >= 0.00) and (`discount_amount` <= `subtotal_amount`) and (`vat_rate` >= 0.00) and (`vat_rate` <= 100.00) and (`vat_amount` >= 0.00) and (`final_amount` >= 0.00) and (`paid_amount` >= 0.00) and (`debt_amount` >= 0.00) and (`paid_amount` <= `final_amount`) and (`final_amount` = ((`subtotal_amount` - `discount_amount`) + `vat_amount`)) and (`debt_amount` = (`final_amount` - `paid_amount`)))),
  CONSTRAINT `chk_sales_orders_payment_status` CHECK ((`payment_status` in (_utf8mb4'UNPAID',_utf8mb4'PARTIALLY_PAID',_utf8mb4'PAID',_utf8mb4'REFUNDED'))),
  CONSTRAINT `chk_sales_orders_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'CONFIRMED',_utf8mb4'DELIVERED',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shift_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_shift_date` (`employee_id`,`work_date`,`shift_id`),
  KEY `fk_shift_assignments_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_shift_assignments_employee_composite` (`tenant_id`,`employee_id`),
  KEY `fk_shift_assignments_shift_composite` (`tenant_id`,`shift_id`),
  KEY `idx_shift_assignments_tenant` (`tenant_id`),
  KEY `idx_shift_assignments_farm` (`farm_id`),
  CONSTRAINT `fk_shift_assignments_employee_composite` FOREIGN KEY (`tenant_id`, `employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_assignments_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_assignments_shift_composite` FOREIGN KEY (`tenant_id`, `shift_id`) REFERENCES `work_shifts` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_shift_assignments_status` CHECK ((`status` in (_utf8mb4'SCHEDULED',_utf8mb4'COMPLETED',_utf8mb4'ABSENT',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stocktake_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stocktake_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_quantity` decimal(12,2) NOT NULL,
  `actual_quantity` decimal(12,2) NOT NULL,
  `difference_quantity` decimal(12,2) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_stocktake_items_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_stocktake_items_stocktake` (`stocktake_id`),
  KEY `idx_stocktake_items_material` (`material_id`),
  CONSTRAINT `fk_stocktake_items_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_stocktake_items_stocktake` FOREIGN KEY (`stocktake_id`) REFERENCES `stocktakes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_stocktake_difference` CHECK ((`difference_quantity` = (`actual_quantity` - `book_quantity`))),
  CONSTRAINT `chk_stocktake_items_quantities` CHECK (((`book_quantity` >= 0.00) and (`actual_quantity` >= 0.00)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stocktakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktakes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `stocktake_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stocktake_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `approved_by` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stocktakes_code` (`tenant_id`,`farm_id`,`stocktake_code`),
  UNIQUE KEY `uk_stocktakes_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  KEY `fk_stocktakes_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `idx_stocktakes_tenant` (`tenant_id`),
  KEY `idx_stocktakes_farm` (`farm_id`),
  KEY `idx_stocktakes_approved_by` (`approved_by`),
  CONSTRAINT `fk_stocktakes_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stocktakes_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_stocktakes_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'IN_PROGRESS',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenant_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `plan_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_farms` int NOT NULL DEFAULT '1',
  `max_users` int NOT NULL DEFAULT '5',
  `valid_from` timestamp NOT NULL,
  `valid_to` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_subscriptions_tenant` (`tenant_id`),
  CONSTRAINT `fk_tenant_subscriptions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_tenant_sub_dates` CHECK ((`valid_to` >= `valid_from`)),
  CONSTRAINT `chk_tenant_sub_limits` CHECK (((`max_farms` > 0) and (`max_users` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subdomain` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscription_plan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FREE',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `subdomain` (`subdomain`),
  CONSTRAINT `chk_tenants_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'SUSPENDED',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `time_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_attendances` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `check_in_time` timestamp NULL DEFAULT NULL,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `gps_latitude` decimal(10,8) DEFAULT NULL,
  `gps_longitude` decimal(11,8) DEFAULT NULL,
  `gps_distance_m` decimal(8,2) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_distance_m` decimal(8,2) DEFAULT NULL,
  `check_in_photo_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `check_out_photo_url` mediumtext COLLATE utf8mb4_unicode_ci,
  `working_hours` decimal(5,2) NOT NULL DEFAULT '0.00',
  `late_minutes` int NOT NULL DEFAULT '0',
  `early_leave_minutes` int NOT NULL DEFAULT '0',
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VALID',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_adjusted` tinyint(1) NOT NULL DEFAULT '0',
  `adjusted_by_user_id` bigint DEFAULT NULL,
  `adjustment_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_check_in` timestamp NULL DEFAULT NULL,
  `original_check_out` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_attendance_date` (`employee_id`,`work_date`,`shift_id`),
  KEY `fk_time_attendances_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `fk_time_attendances_employee_composite` (`tenant_id`,`employee_id`),
  KEY `fk_time_attendances_shift_composite` (`tenant_id`,`shift_id`),
  KEY `fk_time_attendances_adjusted_by` (`adjusted_by_user_id`),
  KEY `idx_time_attendances_tenant` (`tenant_id`),
  KEY `idx_time_attendances_farm` (`farm_id`),
  KEY `idx_time_attendances_employee` (`employee_id`),
  CONSTRAINT `fk_time_attendances_adjusted_by` FOREIGN KEY (`adjusted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_time_attendances_employee_composite` FOREIGN KEY (`tenant_id`, `employee_id`) REFERENCES `employees` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_time_attendances_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_time_attendances_shift_composite` FOREIGN KEY (`tenant_id`, `shift_id`) REFERENCES `work_shifts` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_time_attendances_status` CHECK ((`status` in (_utf8mb4'VALID',_utf8mb4'LATE',_utf8mb4'EARLY_DEPARTURE',_utf8mb4'OUT_OF_RANGE',_utf8mb4'ABSENT'))),
  CONSTRAINT `chk_time_attendances_times` CHECK (((`check_out_time` is null) or (`check_out_time` >= `check_in_time`)))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `traceability_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `traceability_snapshots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `product_batch_id` bigint NOT NULL,
  `enterprise_info_json` json NOT NULL,
  `vietgap_cert_json` json DEFAULT NULL,
  `farming_timeline_json` json NOT NULL,
  `harvest_info_json` json NOT NULL,
  `qc_inspection_json` json DEFAULT NULL,
  `snapshot_hash` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scan_count` bigint NOT NULL DEFAULT '0',
  `last_scanned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_batch_id` (`product_batch_id`),
  KEY `fk_snapshots_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `idx_traceability_snapshots_tenant` (`tenant_id`),
  KEY `idx_traceability_snapshots_farm` (`farm_id`),
  CONSTRAINT `fk_snapshots_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_snapshots_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_farm_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_farm_access` (
  `user_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`,`farm_id`),
  KEY `fk_user_farm_access_user_tenant` (`tenant_id`,`user_id`),
  KEY `fk_user_farm_access_farm_tenant` (`tenant_id`,`farm_id`),
  KEY `idx_user_farm_access_farm` (`farm_id`),
  KEY `idx_user_farm_access_tenant` (`tenant_id`),
  CONSTRAINT `fk_user_farm_access_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_farm_access_user_tenant` FOREIGN KEY (`tenant_id`, `user_id`) REFERENCES `users` (`tenant_id`, `id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `farm_id` bigint DEFAULT NULL,
  `assigned_scope_farm_id` bigint GENERATED ALWAYS AS (coalesce(`farm_id`,0)) VIRTUAL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_roles_scoped` (`user_id`,`role_id`,`assigned_scope_farm_id`),
  KEY `fk_user_roles_role` (`role_id`),
  KEY `fk_user_roles_assigned_by` (`assigned_by`),
  KEY `idx_user_roles_tenant` (`tenant_id`),
  KEY `idx_user_roles_farm` (`farm_id`),
  KEY `fk_user_roles_farm` (`tenant_id`,`farm_id`),
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_roles_farm` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=292 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint DEFAULT NULL,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT '0',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `failed_logins` int NOT NULL DEFAULT '0',
  `lock_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uk_users_tenant_id` (`tenant_id`,`id`),
  KEY `idx_users_tenant` (`tenant_id`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_users_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'LOCKED',_utf8mb4'INACTIVE'))),
  CONSTRAINT `chk_users_super_admin_tenant` CHECK ((((`is_super_admin` = true) and (`tenant_id` is null)) or ((`is_super_admin` = false) and (`tenant_id` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_inventory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `inward_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `quantity_on_hand` decimal(12,2) NOT NULL DEFAULT '0.00',
  `reserved_quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `storage_bin_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `internal_batch_barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_inventory_batch` (`warehouse_id`,`material_id`,`batch_number`),
  KEY `fk_warehouse_inventory_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_warehouse_inventory_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_warehouse_inventory_tenant` (`tenant_id`),
  KEY `idx_warehouse_inventory_farm` (`farm_id`),
  KEY `idx_warehouse_inventory_warehouse` (`warehouse_id`),
  KEY `idx_warehouse_inventory_material` (`material_id`),
  KEY `idx_warehouse_inventory_fifo` (`material_id`,`inward_date`,`expiry_date`),
  KEY `idx_warehouse_inventory_fefo` (`material_id`,`expiry_date`,`inward_date`),
  CONSTRAINT `fk_warehouse_inventory_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_inventory_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_warehouse_inventory_quantity_non_negative` CHECK ((`quantity_on_hand` >= 0.00)),
  CONSTRAINT `chk_warehouse_inventory_reserved_le_on_hand` CHECK ((`reserved_quantity` <= `quantity_on_hand`)),
  CONSTRAINT `chk_warehouse_inventory_reserved_non_negative` CHECK ((`reserved_quantity` >= 0.00)),
  CONSTRAINT `chk_warehouse_inventory_unit_cost` CHECK ((`unit_cost` >= 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_inventory_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_doc_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_doc_id` bigint NOT NULL,
  `reference_item_id` bigint NOT NULL,
  `direction` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balance_before` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inv_trans_item_idempotent` (`reference_doc_type`,`reference_item_id`,`direction`),
  KEY `fk_inv_trans_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_inv_trans_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_inv_trans_tenant` (`tenant_id`),
  KEY `idx_inv_trans_farm` (`farm_id`),
  KEY `idx_inv_trans_warehouse_material` (`warehouse_id`,`material_id`,`batch_number`),
  KEY `idx_inv_trans_doc` (`reference_doc_type`,`reference_doc_id`),
  KEY `idx_inv_trans_date` (`transaction_date`),
  CONSTRAINT `fk_inv_trans_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inv_trans_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inv_trans_amounts` CHECK (((`unit_price` >= 0.00) and (`total_amount` >= 0.00))),
  CONSTRAINT `chk_inv_trans_balance_math` CHECK ((((`direction` = _utf8mb4'IN') and (`balance_after` = (`balance_before` + `quantity`))) or ((`direction` = _utf8mb4'OUT') and (`balance_after` = (`balance_before` - `quantity`))))),
  CONSTRAINT `chk_inv_trans_balances` CHECK (((`balance_before` >= 0.00) and (`balance_after` >= 0.00))),
  CONSTRAINT `chk_inv_trans_direction` CHECK ((`direction` in (_utf8mb4'IN',_utf8mb4'OUT'))),
  CONSTRAINT `chk_inv_trans_qty` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_issue_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_issue_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `issue_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entered_unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entered_quantity` decimal(12,2) DEFAULT NULL,
  `conversion_factor` decimal(12,4) NOT NULL DEFAULT '1.0000',
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_issue_items_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_issue_items_issue` (`issue_id`),
  KEY `idx_issue_items_material` (`material_id`),
  CONSTRAINT `fk_issue_items_issue` FOREIGN KEY (`issue_id`) REFERENCES `warehouse_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_issue_items_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_issue_items_price` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_issue_items_quantity` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_issues` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `issue_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `season_id` bigint DEFAULT NULL,
  `livestock_group_id` bigint DEFAULT NULL,
  `farming_log_id` bigint DEFAULT NULL,
  `livestock_event_id` bigint DEFAULT NULL,
  `is_backflushed` tinyint(1) NOT NULL DEFAULT '0',
  `issue_date` date NOT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `approved_by` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint DEFAULT NULL,
  `cancellation_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_farming_backflush` bigint GENERATED ALWAYS AS ((case when ((`status` <> _utf8mb4'CANCELLED') and (`farming_log_id` is not null)) then `farming_log_id` else NULL end)) VIRTUAL,
  `active_livestock_backflush` bigint GENERATED ALWAYS AS ((case when ((`status` <> _utf8mb4'CANCELLED') and (`livestock_event_id` is not null)) then `livestock_event_id` else NULL end)) VIRTUAL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_issues_code` (`tenant_id`,`farm_id`,`issue_code`),
  UNIQUE KEY `uk_warehouse_issues_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  UNIQUE KEY `uk_warehouse_issues_tenant_id` (`tenant_id`,`id`),
  UNIQUE KEY `uk_wh_issue_farm_log_wh` (`active_farming_backflush`,`warehouse_id`),
  UNIQUE KEY `uk_wh_issue_live_event_wh` (`active_livestock_backflush`,`warehouse_id`),
  KEY `fk_warehouse_issues_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_warehouse_issues_season_composite` (`tenant_id`,`farm_id`,`season_id`),
  KEY `fk_warehouse_issues_farming_log_composite` (`tenant_id`,`farm_id`,`farming_log_id`),
  KEY `fk_warehouse_issues_livestock_event_composite` (`tenant_id`,`farm_id`,`livestock_event_id`),
  KEY `fk_warehouse_issues_cancelled_by` (`cancelled_by`),
  KEY `idx_warehouse_issues_tenant` (`tenant_id`),
  KEY `idx_warehouse_issues_farm` (`farm_id`),
  KEY `idx_warehouse_issues_date` (`issue_date`),
  KEY `idx_warehouse_issues_approved_by` (`approved_by`),
  KEY `fk_warehouse_issues_livestock_group_composite` (`tenant_id`,`farm_id`,`livestock_group_id`),
  KEY `idx_warehouse_issues_livestock_group` (`livestock_group_id`),
  CONSTRAINT `fk_warehouse_issues_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouse_issues_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouse_issues_farming_log_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `farming_log_id`) REFERENCES `farming_logs` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_issues_livestock_event_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_event_id`) REFERENCES `livestock_events` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_issues_livestock_group_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `livestock_group_id`) REFERENCES `livestock_groups` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_issues_season_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `season_id`) REFERENCES `crop_seasons` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_issues_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_warehouse_issues_amount` CHECK ((`total_amount` >= 0.00)),
  CONSTRAINT `chk_warehouse_issues_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'APPROVED',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED'))),
  CONSTRAINT `chk_warehouse_issues_type` CHECK ((`issue_type` in (_utf8mb4'PRODUCTION_BACKFLUSH',_utf8mb4'INTERNAL_USE',_utf8mb4'SALE_FULFILLMENT',_utf8mb4'DAMAGE_DISPOSAL',_utf8mb4'TRANSFER')))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_receipt_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `receipt_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `entered_unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entered_quantity` decimal(12,2) DEFAULT NULL,
  `conversion_factor` decimal(12,4) NOT NULL DEFAULT '1.0000',
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `storage_bin_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipt_items_batch` (`receipt_id`,`material_id`,`batch_number`),
  KEY `fk_receipt_items_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_receipt_items_receipt` (`receipt_id`),
  KEY `idx_receipt_items_material` (`material_id`),
  CONSTRAINT `fk_receipt_items_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `warehouse_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_receipt_items_price` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_receipt_items_quantity` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_receipts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `receipt_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` bigint DEFAULT NULL,
  `receipt_date` date NOT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `approved_by` bigint DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint DEFAULT NULL,
  `cancellation_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_receipts_code` (`tenant_id`,`farm_id`,`receipt_code`),
  UNIQUE KEY `uk_warehouse_receipts_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  UNIQUE KEY `uk_warehouse_receipts_tenant_id` (`tenant_id`,`id`),
  KEY `fk_warehouse_receipts_warehouse_composite` (`tenant_id`,`farm_id`,`warehouse_id`),
  KEY `fk_warehouse_receipts_partner_composite` (`tenant_id`,`partner_id`),
  KEY `fk_warehouse_receipts_cancelled_by` (`cancelled_by`),
  KEY `idx_warehouse_receipts_tenant` (`tenant_id`),
  KEY `idx_warehouse_receipts_farm` (`farm_id`),
  KEY `idx_warehouse_receipts_date` (`receipt_date`),
  KEY `idx_warehouse_receipts_approved_by` (`approved_by`),
  CONSTRAINT `fk_warehouse_receipts_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouse_receipts_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouse_receipts_partner_composite` FOREIGN KEY (`tenant_id`, `partner_id`) REFERENCES `partners` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouse_receipts_warehouse_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_warehouse_receipts_amount` CHECK ((`total_amount` >= 0.00)),
  CONSTRAINT `chk_warehouse_receipts_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'APPROVED',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED'))),
  CONSTRAINT `chk_warehouse_receipts_type` CHECK ((`receipt_type` in (_utf8mb4'PURCHASE',_utf8mb4'HARVEST_RETURN',_utf8mb4'INTERNAL_TRANSFER',_utf8mb4'ADJUSTMENT')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_transfer_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transfer_id` bigint NOT NULL,
  `tenant_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `from_batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_batch_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `from_bin_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_bin_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_transfer_items_material_composite` (`tenant_id`,`material_id`),
  KEY `idx_transfer_items_transfer` (`transfer_id`),
  KEY `idx_transfer_items_material` (`material_id`),
  CONSTRAINT `fk_transfer_items_material_composite` FOREIGN KEY (`tenant_id`, `material_id`) REFERENCES `materials` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_items_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `warehouse_transfers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_transfer_item_price` CHECK (((`unit_price` >= 0.00) and (`total_price` >= 0.00))),
  CONSTRAINT `chk_transfer_item_qty` CHECK ((`quantity` > 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouse_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_transfers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `from_farm_id` bigint NOT NULL,
  `to_farm_id` bigint NOT NULL,
  `from_warehouse_id` bigint NOT NULL,
  `to_warehouse_id` bigint NOT NULL,
  `transfer_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `transferred_by_user_id` bigint DEFAULT NULL,
  `received_by_user_id` bigint DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_transfers_tenant_code` (`tenant_id`,`transfer_code`),
  UNIQUE KEY `uk_warehouse_transfers_tenant_id` (`tenant_id`,`id`),
  KEY `fk_transfers_from_wh` (`tenant_id`,`from_farm_id`,`from_warehouse_id`),
  KEY `fk_transfers_to_wh` (`tenant_id`,`to_farm_id`,`to_warehouse_id`),
  KEY `fk_transfers_dispatched_by` (`transferred_by_user_id`),
  KEY `fk_transfers_received_by` (`received_by_user_id`),
  KEY `idx_warehouse_transfers_tenant` (`tenant_id`),
  KEY `idx_warehouse_transfers_from_farm` (`from_farm_id`),
  KEY `idx_warehouse_transfers_to_farm` (`to_farm_id`),
  CONSTRAINT `fk_transfers_dispatched_by` FOREIGN KEY (`transferred_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfers_from_farm` FOREIGN KEY (`tenant_id`, `from_farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfers_from_wh` FOREIGN KEY (`tenant_id`, `from_farm_id`, `from_warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfers_received_by` FOREIGN KEY (`received_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfers_to_farm` FOREIGN KEY (`tenant_id`, `to_farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfers_to_wh` FOREIGN KEY (`tenant_id`, `to_farm_id`, `to_warehouse_id`) REFERENCES `warehouses` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_warehouse_transfers_diff_wh` CHECK ((`from_warehouse_id` <> `to_warehouse_id`)),
  CONSTRAINT `chk_warehouse_transfers_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'PENDING',_utf8mb4'IN_TRANSIT',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity_m3` decimal(12,2) DEFAULT NULL,
  `floor_area_m2` decimal(12,2) DEFAULT NULL,
  `standard_temp_c` decimal(5,2) DEFAULT NULL,
  `standard_humidity_pct` decimal(5,2) DEFAULT NULL,
  `location_desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_user_id` bigint DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouses_farm_code` (`farm_id`,`code`),
  UNIQUE KEY `uk_warehouses_tenant_farm_id` (`tenant_id`,`farm_id`,`id`),
  UNIQUE KEY `uk_warehouses_tenant_id` (`tenant_id`,`id`),
  KEY `fk_warehouses_manager` (`manager_user_id`),
  KEY `idx_warehouses_tenant` (`tenant_id`),
  KEY `idx_warehouses_farm` (`farm_id`),
  KEY `idx_warehouses_zone` (`zone_id`),
  CONSTRAINT `fk_warehouses_farm_tenant` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_warehouses_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_warehouses_zone` FOREIGN KEY (`zone_id`) REFERENCES `production_zones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_warehouses_specs` CHECK ((((`capacity_m3` is null) or (`capacity_m3` >= 0.00)) and ((`floor_area_m2` is null) or (`floor_area_m2` >= 0.00)) and ((`standard_humidity_pct` is null) or ((`standard_humidity_pct` >= 0.00) and (`standard_humidity_pct` <= 100.00))))),
  CONSTRAINT `chk_warehouses_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'FULL'))),
  CONSTRAINT `chk_warehouses_type` CHECK ((`warehouse_type` in (_utf8mb4'FERTILIZER',_utf8mb4'PESTICIDE',_utf8mb4'ANIMAL_FEED',_utf8mb4'HARVESTED_PRODUCE',_utf8mb4'COLD_STORAGE',_utf8mb4'TOOLS_EQUIPMENT',_utf8mb4'GENERAL')))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_shifts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_minutes` int NOT NULL DEFAULT '60',
  `grace_late_minutes` int NOT NULL DEFAULT '15',
  `is_overnight` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_shifts_code` (`tenant_id`,`shift_code`),
  UNIQUE KEY `uk_work_shifts_tenant_id` (`tenant_id`,`id`),
  KEY `fk_work_shifts_farm_composite` (`tenant_id`,`farm_id`),
  KEY `idx_work_shifts_tenant` (`tenant_id`),
  CONSTRAINT `fk_work_shifts_farm_composite` FOREIGN KEY (`tenant_id`, `farm_id`) REFERENCES `farms` (`tenant_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_work_shifts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_work_shifts_break` CHECK (((`break_minutes` >= 0) and (`grace_late_minutes` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `zone_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zone_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `farm_id` bigint NOT NULL,
  `zone_id` bigint NOT NULL,
  `warehouse_id` bigint DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `area_m2` decimal(12,2) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `version` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_zone_locations_zone_code` (`zone_id`,`code`),
  UNIQUE KEY `uk_zone_locations_composite_id` (`tenant_id`,`farm_id`,`zone_id`,`id`),
  KEY `idx_zone_locations_tenant` (`tenant_id`),
  KEY `idx_zone_locations_farm` (`farm_id`),
  KEY `idx_zone_locations_zone` (`zone_id`),
  KEY `idx_zone_locations_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_zone_locations_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_zone_locations_zone_composite` FOREIGN KEY (`tenant_id`, `farm_id`, `zone_id`) REFERENCES `production_zones` (`tenant_id`, `farm_id`, `id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_zone_locations_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'OCCUPIED',_utf8mb4'EMPTY',_utf8mb4'MAINTENANCE')))
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

