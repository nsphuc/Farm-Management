-- =============================================================================
-- Migration: V1_0__init_system_core.sql
-- Description: Khởi tạo hệ thống cốt lõi (Tenants, RBAC 6 Roles, Auditing, Notifications)
-- Author: Senior Backend Developer
-- Database: MySQL 8.x (InnoDB, utf8mb4)
-- =============================================================================

-- 1. BẢNG TENANTS (Khách hàng tổ chức / Hợp tác xã / Doanh nghiệp nông nghiệp)
CREATE TABLE IF NOT EXISTS `tenants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `subdomain` VARCHAR(100) NOT NULL,
    `subscription_plan` VARCHAR(50) NOT NULL DEFAULT 'STARTER',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_tenants_code` UNIQUE (`code`),
    CONSTRAINT `uk_tenants_subdomain` UNIQUE (`subdomain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG TENANT_SUBSCRIPTIONS (Quản lý thời hạn & gói cước Tenant)
CREATE TABLE IF NOT EXISTS `tenant_subscriptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `plan_type` VARCHAR(50) NOT NULL,
    `max_farms` INT NOT NULL DEFAULT 1,
    `max_users` INT NOT NULL DEFAULT 5,
    `valid_from` DATETIME(6) NOT NULL,
    `valid_to` DATETIME(6) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_tenant_subscriptions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    INDEX `idx_tenant_subscriptions_tenant` (`tenant_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG USERS (Tài khoản người dùng trong hệ thống)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `failed_logins` INT NOT NULL DEFAULT 0,
    `lock_until` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` VARCHAR(50) NULL,
    `updated_by` VARCHAR(50) NULL,
    `version` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_users_username` UNIQUE (`username`),
    CONSTRAINT `uk_users_email` UNIQUE (`email`),
    CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    INDEX `idx_users_tenant_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ROLES (6 Vai trò chuẩn hóa toàn hệ thống)
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `scope_level` VARCHAR(50) NOT NULL DEFAULT 'FARM',
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_roles_code` UNIQUE (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED 6 ROLES CHUẨN (Super Admin, Farm Owner, Field Staff, Warehouse Staff, Technical Staff, Accountant)
INSERT INTO `roles` (`code`, `name`, `scope_level`, `description`) VALUES
('ROLE_SUPER_ADMIN', 'Super Admin', 'SYSTEM', 'Quản trị viên toàn hệ thống SaaS, không bị giới hạn farmId'),
('ROLE_FARM_OWNER', 'Farm Owner', 'FARM', 'Chủ/Quản lý trang trại: Lập kế hoạch, giao việc, duyệt xuất bán và ngân sách'),
('ROLE_FIELD_STAFF', 'Field Staff', 'TASK', 'Nhân viên hiện trường: Chấm công GPS, ghi nhật ký chăm sóc kích hoạt trừ kho ngầm'),
('ROLE_WAREHOUSE_STAFF', 'Warehouse Staff', 'FARM', 'Thủ kho: Nhập kho, kiểm kê, điều chuyển kho và giám sát xuất ngầm'),
('ROLE_TECHNICAL_STAFF', 'Technical Staff', 'FARM', 'Kỹ thuật / Thú y: Phác đồ điều trị, kê toa vật tư, định mức kỹ thuật'),
('ROLE_ACCOUNTANT', 'Accountant', 'FARM', 'Kế toán: Hạch toán chi phí vật tư tự động, công nợ, tính giá thành đơn vị (Cost/Kg)')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. BẢNG PERMISSIONS (Quyền hạn chi tiết theo Module & Action)
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(30) NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_permissions_code` UNIQUE (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG USER_ROLES (Liên kết N-N giữa User và Role)
CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG ROLE_PERMISSIONS (Liên kết N-N giữa Role và Permission)
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG USER_FARM_ACCESS (Phạm vi truy cập cơ sở trang trại - Data Scope)
CREATE TABLE IF NOT EXISTS `user_farm_access` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `farm_id` BIGINT UNSIGNED NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `granted_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `granted_by` VARCHAR(50) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_user_farm_access` UNIQUE (`user_id`, `farm_id`),
    CONSTRAINT `fk_user_farm_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_farm_access_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    INDEX `idx_user_farm_access_farm` (`farm_id`, `tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG AUDIT_LOGS (Nhật ký truy vết & giám sát hệ thống)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(50) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `status_code` INT NOT NULL,
    `execution_time_ms` BIGINT NOT NULL,
    `trace_id` VARCHAR(64) NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_audit_logs_tenant_created` (`tenant_id`, `created_at`),
    INDEX `idx_audit_logs_user` (`user_id`),
    INDEX `idx_audit_logs_trace` (`trace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG NOTIFICATIONS (Quản lý thông báo trong ứng dụng)
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `recipient_id` BIGINT UNSIGNED NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data_json` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_notifications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_notifications_recipient_read` (`recipient_id`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
