-- ==============================================================================
-- FARMGO SAAS PLATFORM - PHASE 4 SETTINGS, ROLES, MULTI-BRANCH & PLATFORM (V5.0)
-- Migration File: V5__phase4_settings_and_platform.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. BỔ SUNG CÁC CỘT HỒ SƠ CHO BẢNG FARMS VÀ SALES_ORDERS
ALTER TABLE `farms`
    ADD COLUMN `phone` VARCHAR(50) DEFAULT NULL,
    ADD COLUMN `veterinary_code` VARCHAR(100) DEFAULT NULL,
    ADD COLUMN `manager_name` VARCHAR(150) DEFAULT NULL;

ALTER TABLE `sales_orders`
    ADD COLUMN `branch_id` BIGINT DEFAULT NULL;

-- 2. BẢNG GÓI CƯỚC & DỊCH VỤ MỞ RỘNG NỀN TẢNG (PLATFORM_PACKAGES)
CREATE TABLE IF NOT EXISTS `platform_packages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `package_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'CORE',
    `half_year_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `yearly_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `description` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_pkg_code` (`package_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed dữ liệu 7 gói cước & Add-ons niêm yết
INSERT INTO `platform_packages` (`package_code`, `name`, `category`, `half_year_price`, `yearly_price`, `description`, `is_active`) VALUES
('CORE', 'Gói Cá nhân Tiêu chuẩn (Starter)', 'Gói Cốt Lõi', 300000.00, 500000.00, 'Bao gồm toàn bộ 10 phân hệ nghiệp vụ chăn nuôi cốt lõi, không giới hạn lứa nuôi, hỗ trợ 1 trang trại độc lập.', 1),
('BRANCHES', 'Quản lý Đa Chi Nhánh', 'Vận hành mở rộng', 2800000.00, 5000000.00, 'Mở khóa phân hệ Chi nhánh, cho phép tạo và quản lý không giới hạn số lượng trang trại/chi nhánh độc lập.', 1),
('CUSTOM_ROLES', 'Phân quyền Động (Custom Roles)', 'Bảo mật & Nhân sự', 1400000.00, 2500000.00, 'Tùy biến ma trận quyền SCRUD không giới hạn, tạo các nhóm vai trò riêng biệt cho nhân công, kỹ thuật và quản lý kho.', 1),
('PAYROLL', 'Sổ Lương & Công Khoán Chuyên Sâu', 'Tài chính & Lao động', 2000000.00, 3500000.00, 'Chấm công tự động, tính lương khoán theo lứa nuôi, lập phiếu tạm ứng và chi lương tự động đồng bộ vào Sổ quỹ.', 1),
('BREEDING', 'Quản lý Heo Giống & Phối Tinh', 'Nghiệp vụ chuyên sâu', 3500000.00, 6000000.00, 'Theo dõi chu kỳ sinh sản heo nái, lịch phối giống, quản lý heo đực giống và chỉ số cai sữa heo con.', 1),
('POULTRY_HATCHERY', 'Ấp Nở Gia Cầm Cao Sản', 'Nghiệp vụ chuyên sâu', 3500000.00, 6000000.00, 'Theo dõi máy ấp trứng tự động, tỷ lệ soi phôi trứng có cồ, tỷ lệ nở và tiêm phòng vắc-xin tại trạm ấp.', 1),
('FEED_MILL', 'Nhà Máy Trộn Thức Ăn Nội Bộ', 'Vận hành mở rộng', 2600000.00, 4500000.00, 'Lập công thức phối trộn cám tự chế biến, trừ nguyên liệu thô (ngô, đậu, premix) và tự động nhập kho cám thành phẩm.', 1)
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `half_year_price` = VALUES(`half_year_price`),
    `yearly_price` = VALUES(`yearly_price`),
    `description` = VALUES(`description`);

-- 3. BẢO ĐẢM CÓ DỮ LIỆU ĐƠN HÀNG VÀ ADDON ACTIVE CHO DEMO
INSERT INTO `farm_add_on_subscriptions` (`tenant_id`, `farm_id`, `addon_code`, `status`, `expires_at`) VALUES
(1, 1, 'BRANCHES', 'ACTIVE', DATE_ADD(NOW(), INTERVAL 180 DAY)),
(1, 1, 'CUSTOM_ROLES', 'ACTIVE', DATE_ADD(NOW(), INTERVAL 180 DAY)),
(1, 1, 'PAYROLL', 'ACTIVE', DATE_ADD(NOW(), INTERVAL 180 DAY))
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE';

SET FOREIGN_KEY_CHECKS = 1;
