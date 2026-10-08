-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_8: WIPE ALL DATA FROM ALL APPLICATION TABLES
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `budget_line_items`;
TRUNCATE TABLE `budgets`;
TRUNCATE TABLE `consumption_quotas`;
TRUNCATE TABLE `cost_allocations`;
TRUNCATE TABLE `cost_categories`;
TRUNCATE TABLE `crop_seasons`;
TRUNCATE TABLE `crop_types`;
TRUNCATE TABLE `debt_records`;
TRUNCATE TABLE `employees`;
TRUNCATE TABLE `enterprises`;
TRUNCATE TABLE `farm_assignments`;
TRUNCATE TABLE `farm_expenses`;
TRUNCATE TABLE `farm_operational_settings`;
TRUNCATE TABLE `farm_tasks`;
TRUNCATE TABLE `farming_logs`;
TRUNCATE TABLE `farms`;
TRUNCATE TABLE `label_print_logs`;
TRUNCATE TABLE `leave_requests`;
TRUNCATE TABLE `livestock_breeds`;
TRUNCATE TABLE `livestock_events`;
TRUNCATE TABLE `livestock_groups`;
TRUNCATE TABLE `livestock_individuals`;
TRUNCATE TABLE `material_categories`;
TRUNCATE TABLE `materials`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `operational_cycles`;
TRUNCATE TABLE `overtime_requests`;
TRUNCATE TABLE `partners`;
TRUNCATE TABLE `permissions`;
TRUNCATE TABLE `product_batches`;
TRUNCATE TABLE `production_zones`;
TRUNCATE TABLE `role_permissions`;
TRUNCATE TABLE `roles`;
TRUNCATE TABLE `sales_order_items`;
TRUNCATE TABLE `sales_orders`;
TRUNCATE TABLE `shift_assignments`;
TRUNCATE TABLE `stocktake_items`;
TRUNCATE TABLE `stocktakes`;
TRUNCATE TABLE `tenant_subscriptions`;
TRUNCATE TABLE `tenants`;
TRUNCATE TABLE `time_attendances`;
TRUNCATE TABLE `traceability_snapshots`;
TRUNCATE TABLE `user_farm_access`;
TRUNCATE TABLE `user_roles`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `warehouse_inventory`;
TRUNCATE TABLE `warehouse_issue_items`;
TRUNCATE TABLE `warehouse_issues`;
TRUNCATE TABLE `warehouse_receipt_items`;
TRUNCATE TABLE `warehouse_receipts`;
TRUNCATE TABLE `warehouse_transfer_items`;
TRUNCATE TABLE `warehouse_transfers`;
TRUNCATE TABLE `warehouses`;
TRUNCATE TABLE `work_shifts`;
TRUNCATE TABLE `zone_locations`;

SET FOREIGN_KEY_CHECKS = 1;
