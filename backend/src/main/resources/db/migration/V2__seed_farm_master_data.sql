-- ==============================================================================
-- FARMGO SAAS PLATFORM - PRODUCTION-READY MASTER DATA SEED (V2.0)
-- Migration File: V2__seed_farm_master_data.sql
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. SEED PERMISSIONS
INSERT INTO permissions (id, code, module, action, resource, description) VALUES
    (1, 'financial.price.view', 'FINANCE', 'READ', 'FINANCIAL_PRICE', 'Xem giá vốn, đơn giá nhập và giá bán nhạy cảm'),
    (2, 'workforce.salary.view', 'WORKFORCE', 'READ', 'SALARY', 'Xem mức lương và chi tiết thu nhập nhân sự'),
    (3, 'barns.view', 'BARN', 'READ', 'BARN', 'Xem danh sách chuồng trại và quy mô đàn nuôi'),
    (4, 'barns.manage', 'BARN', 'MANAGE', 'BARN', 'Khởi tạo, sửa đổi và quản lý chuồng trại'),
    (5, 'daily_logs.view', 'DAILY_LOG', 'READ', 'DAILY_LOG', 'Xem nhật ký chăn nuôi, cho ăn và tiêm vắc-xin'),
    (6, 'daily_logs.manage', 'DAILY_LOG', 'MANAGE', 'DAILY_LOG', 'Ghi nhật ký chăm sóc, cập nhật hao hụt và cân nặng'),
    (7, 'inventory.view', 'INVENTORY', 'READ', 'INVENTORY', 'Xem tồn kho cám, thuốc thú y và vật tư tiêu hao'),
    (8, 'inventory.manage', 'INVENTORY', 'MANAGE', 'INVENTORY', 'Quản lý xuất nhập chuyển kho và kiểm kê vật tư'),
    (9, 'purchase_invoices.view', 'PURCHASE', 'READ', 'PURCHASE_INVOICE', 'Xem danh sách hóa đơn nhập mua cám và thuốc'),
    (10, 'purchase_invoices.manage', 'PURCHASE', 'MANAGE', 'PURCHASE_INVOICE', 'Lập và duyệt phiếu nhập kho vật tư'),
    (11, 'sales.view', 'SALES', 'READ', 'SALES_ORDER', 'Xem đơn bán lợn, gà thịt và phụ phẩm'),
    (12, 'sales.manage', 'SALES', 'MANAGE', 'SALES_ORDER', 'Lập đơn bán hàng, lập phiếu cân và xuất bán'),
    (13, 'cashbook.view', 'CASHBOOK', 'READ', 'CASHBOOK', 'Xem sổ quỹ thu chi và đối soát công nợ'),
    (14, 'cashbook.manage', 'CASHBOOK', 'MANAGE', 'CASHBOOK', 'Lập phiếu thu chi tiền mặt và ngân hàng'),
    (15, 'workforce.view', 'WORKFORCE', 'READ', 'EMPLOYEE', 'Xem danh sách nhân sự trang trại'),
    (16, 'workforce.manage', 'WORKFORCE', 'MANAGE', 'EMPLOYEE', 'Quản lý thông tin hồ sơ và tài khoản nhân viên'),
    (17, 'livestock_settings.view', 'SETTINGS', 'READ', 'LIVESTOCK_BREED', 'Xem danh mục giống và định mức thức ăn'),
    (18, 'livestock_settings.manage', 'SETTINGS', 'MANAGE', 'LIVESTOCK_BREED', 'Cài đặt giống, chương trình cám và lịch phòng bệnh'),
    (19, 'general_settings.view', 'SETTINGS', 'READ', 'FARM_SETTINGS', 'Xem cấu hình trang trại và quy tắc dữ liệu'),
    (20, 'general_settings.manage', 'SETTINGS', 'MANAGE', 'FARM_SETTINGS', 'Cấu hình tài chính VietQR và bật tắt dịch vụ'),
    (21, 'branches.view', 'ADDON_BRANCHES', 'READ', 'BRANCH', 'Xem danh sách đa chi nhánh trang trại'),
    (22, 'branches.manage', 'ADDON_BRANCHES', 'MANAGE', 'BRANCH', 'Thêm, sửa, cấu hình chi nhánh trang trại'),
    (23, 'payroll.view', 'ADDON_PAYROLL', 'READ', 'PAYROLL', 'Xem bảng tính lương nhân sự'),
    (24, 'payroll.manage', 'ADDON_PAYROLL', 'MANAGE', 'PAYROLL', 'Chấm công KPI và duyệt bảng chi lương'),
    (25, 'roles.view', 'ADDON_ROLES', 'READ', 'ROLE', 'Xem danh sách vai trò mở rộng'),
    (26, 'roles.manage', 'ADDON_ROLES', 'MANAGE', 'ROLE', 'Tạo vai trò tùy biến và phân quyền chi tiết')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. SEED 6 VAI TRÒ CHUẨN (STANDARD ROLES)
INSERT INTO roles (id, code, name, scope_level, farm_id, is_system, description) VALUES
    (1, 'ROLE_SUPER_ADMIN', 'Quản trị viên Hệ thống', 'PLATFORM', NULL, 1, 'Toàn quyền quản trị nền tảng SaaS, đối soát thanh toán và quản lý các trang trại thuê bao'),
    (2, 'ROLE_FARM_OWNER', 'Chủ trang trại', 'FARM', NULL, 1, 'Toàn quyền điều hành cơ sở chăn nuôi, xem giá vốn, tiền lương và quản trị dịch vụ mở rộng'),
    (3, 'ROLE_BARN_WORKER', 'Công nhân chuồng trại', 'BARN', NULL, 1, 'Chuyên trách ghi nhật ký cho ăn, tiêm vắc-xin và theo dõi sức khỏe đàn trong phạm vi chuồng phụ trách'),
    (4, 'ROLE_TECHNICAL_STAFF', 'Kỹ thuật viên / Thú y', 'FARM', NULL, 1, 'Chuyên trách phác đồ điều trị, lịch tiêm phòng, định mức cám và quản lý giống vật nuôi'),
    (5, 'ROLE_ACCOUNTANT', 'Kế toán kho & Sổ quỹ', 'FARM', NULL, 1, 'Quản lý xuất nhập tồn kho, hóa đơn mua bán, thu chi sổ quỹ và đối soát công nợ thương lái'),
    (6, 'ROLE_FARM_MANAGER', 'Quản lý trại / Trại trưởng', 'FARM', NULL, 1, 'Điều hành sản xuất tổng thể chuồng trại, phân công nhân sự và giám sát kho (không thấy lương nhạy cảm)')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- 3. GÁN PHÂN QUYỀN VAI TRÒ (ROLE_PERMISSIONS)
-- Farm Owner: Full quyền (1..26)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions;

-- Farm Manager: Tất cả quyền trừ tiền lương nhạy cảm và sửa phân quyền
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE code NOT IN ('workforce.salary.view', 'roles.manage');

-- Technical Staff: Chuồng, nhật ký, kho xem, giống & định mức
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE code IN (
    'barns.view', 'barns.manage', 'daily_logs.view', 'daily_logs.manage',
    'inventory.view', 'livestock_settings.view', 'livestock_settings.manage'
);

-- Accountant: Kho, Hóa đơn nhập, Bán hàng, Sổ quỹ, Nhân sự xem, Giá vốn
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE code IN (
    'inventory.view', 'inventory.manage', 'purchase_invoices.view', 'purchase_invoices.manage',
    'sales.view', 'sales.manage', 'cashbook.view', 'cashbook.manage',
    'workforce.view', 'financial.price.view'
);

-- Barn Worker: Xem chuồng, ghi nhật ký, xem tồn kho cám
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE code IN (
    'barns.view', 'daily_logs.view', 'daily_logs.manage', 'inventory.view'
);

-- 4. SEED TÀI KHOẢN MẪU (USERS)
-- Password mặc định cho tất cả: 123456 (BCrypt: $2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO)
INSERT INTO users (id, tenant_id, is_super_admin, username, email, password_hash, full_name, phone, status, must_change_password, failed_logins, created_at) VALUES
    (1, NULL, 1, 'superadmin', 'admin@gmail.com', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Super Admin FarmGo', '0988000001', 'ACTIVE', 0, 0, NOW()),
    (2, 1, 0, 'owner_hoabinh', 'owner@hoabinh.farmgo.vn', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Nguyễn Văn An', '0988123456', 'ACTIVE', 0, 0, NOW()),
    (3, 1, 0, 'manager_hoabinh', 'manager@hoabinh.farmgo.vn', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Trần Văn Bình (Trại trưởng)', '0977111222', 'ACTIVE', 0, 0, NOW()),
    (4, 1, 0, 'tech_hoabinh', 'tech@hoabinh.farmgo.vn', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Lê Kỹ Thuật (Bác sĩ Thú y)', '0966333444', 'ACTIVE', 0, 0, NOW()),
    (5, 1, 0, 'accountant_hoabinh', 'ketoan@hoabinh.farmgo.vn', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Phạm Kế Toán (Thủ kho & Quỹ)', '0955444555', 'ACTIVE', 0, 0, NOW()),
    (6, 1, 0, 'worker_hoabinh', 'worker@hoabinh.farmgo.vn', '$2a$10$zhZ.yzE0BxzDNoCUA3WJ.uCXzpudv7oYDVGTyNtWiCfPzV7J.i2cO', 'Hoàng Văn Công (Công nhân chuồng)', '0944555666', 'ACTIVE', 0, 0, NOW())
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash);

-- Gán vai trò User-Role tương thích ngược
INSERT IGNORE INTO user_roles (user_id, role_id, farm_id) VALUES
    (1, 1, NULL),
    (2, 2, 1),
    (3, 6, 1),
    (4, 4, 1),
    (5, 5, 1),
    (6, 3, 1);

-- 5. SEED KHÁCH THUÊ & TRANG TRẠI MẪU (TENANTS & FARMS)
INSERT INTO tenants (id, code, name, subdomain, subscription_plan, status) VALUES
    (1, 'TNT-001', 'Hộ kinh doanh Nguyễn Văn An', 'hoabinh', 'PROFESSIONAL', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO tenant_subscriptions (id, tenant_id, plan_type, max_farms, max_users, valid_from, valid_to, is_active) VALUES
    (1, 1, 'PROFESSIONAL', 5, 20, '2024-01-01 00:00:00', '2027-12-31 23:59:59', 1)
ON DUPLICATE KEY UPDATE is_active=VALUES(is_active);

INSERT INTO enterprises (id, tenant_id, tax_number, legal_representative, headquarter_address, contact_phone, contact_email) VALUES
    (1, 1, '0109887766', 'Nguyễn Văn An', 'Thôn Hòa Bình, Xã Phú Lương, Huyện Phú Lương, Thái Nguyên', '0988123456', 'owner@hoabinh.farmgo.vn')
ON DUPLICATE KEY UPDATE legal_representative=VALUES(legal_representative);

INSERT INTO farms (id, tenant_id, code, name, farm_type, facility_type, business_name, tax_code, management_domain, livestock_sector, livestock_type, province, ward, subscription_tier, manager_accounts_count, subscription_duration_years, is_demo, total_area_m2, latitude, longitude, geofence_radius_m, address, manager_user_id, status) VALUES
    (1, 1, 'FARM-001', 'Trang trại Hòa Bình', 'INDIVIDUAL', 'HOG', 'Hộ kinh doanh Nguyễn Văn An', '0109887766', 'hoabinh.farmgo.vn', 'PIG', 'PIG_MEAT', 'Thái Nguyên', 'Phú Lương', 'STANDARD', 5, 2, 0, 12000.00, 21.65830000, 105.78910000, 500, 'Thôn Hòa Bình, Xã Phú Lương, Thái Nguyên', 2, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. GẮN THÀNH VIÊN VÀO TRANG TRẠI (FARM_MEMBERS)
INSERT INTO farm_members (id, tenant_id, farm_id, user_id, role_id, all_barns, barn_ids) VALUES
    (1, 1, 1, 2, 2, 1, NULL),
    (2, 1, 1, 3, 6, 1, NULL),
    (3, 1, 1, 4, 4, 1, NULL),
    (4, 1, 1, 5, 5, 1, NULL),
    (5, 1, 1, 6, 3, 0, '[1, 2]')
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES
    (2, 1, 1),
    (3, 1, 1),
    (4, 1, 1),
    (5, 1, 1),
    (6, 1, 1);

-- 7. KÍCH HOẠT DỊCH VỤ MỞ RỘNG (FARM_ADD_ON_SUBSCRIPTIONS)
INSERT INTO farm_add_on_subscriptions (tenant_id, farm_id, addon_code, status, expires_at) VALUES
    (1, 1, 'BRANCHES', 'ACTIVE', '2026-12-31 23:59:59'),
    (1, 1, 'PAYROLL', 'ACTIVE', '2026-12-31 23:59:59'),
    (1, 1, 'CUSTOM_ROLES', 'ACTIVE', '2026-12-31 23:59:59'),
    (1, 1, 'BREEDING', 'ACTIVE', '2026-12-31 23:59:59'),
    (1, 1, 'POULTRY_HATCHERY', 'ACTIVE', '2026-12-31 23:59:59'),
    (1, 1, 'FEED_MILL', 'ACTIVE', '2026-12-31 23:59:59')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 8. CẤU HÌNH TÀI CHÍNH & QUY TẮC DỮ LIỆU TRANG TRẠI
INSERT INTO farm_data_rules (farm_id, manage_by_batch, enforce_expiry_date, max_edit_log_days, auto_deduct_inventory) VALUES
    (1, 1, 1, 3, 1)
ON DUPLICATE KEY UPDATE manage_by_batch=VALUES(manage_by_batch);

INSERT INTO farm_financial_settings (farm_id, bank_bin, bank_name, bank_account_no, bank_account_name, default_expense_reasons, default_income_reasons) VALUES
    (1, '970436', 'Vietcombank', '1026790945', 'NGUYEN SI PHUC', '["Nhập cám thức ăn", "Mua thuốc thú y & vắc-xin", "Tiền điện nước trang trại", "Lương công nhân", "Bảo trì quạt thông gió & giàn lạnh"]', '["Bán lợn thịt thương phẩm", "Bán gà thịt xuất chuồng", "Bán phân chuồng vi sinh"]')
ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name);

-- 9. CHI NHÁNH TRANG TRẠI (FARM_BRANCHES)
INSERT INTO farm_branches (id, farm_id, code, name, livestock_type, address, phone, is_default, status) VALUES
    (1, 1, 'CHI-001', 'Chi nhánh 1 — Phân khu Trại Heo', 'LIVESTOCK_MEAT', 'Khu A, Thôn Hòa Bình, Xã Phú Lương, Thái Nguyên', '0988123456', 1, 'ACTIVE'),
    (2, 1, 'CHI-002', 'Chi nhánh 2 — Phân khu Trại Gà', 'POULTRY_MEAT', 'Khu B, Thôn Hòa Bình, Xã Phú Lương, Thái Nguyên', '0977111222', 0, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 10. KHU NUÔI (PRODUCTION_ZONES)
INSERT INTO production_zones (id, tenant_id, farm_id, branch_id, code, name, zone_type, area_m2, soil_type, water_source, status) VALUES
    (1, 1, 1, 1, 'KHU-HEO-01', 'Khu Chăn Nuôi Heo Thịt Khép Kín', 'LIVESTOCK', 3500.00, 'Bê tông chống trượt', 'Giếng khoan công nghiệp', 'ACTIVE'),
    (2, 1, 1, 2, 'KHU-GA-01', 'Khu Chăn Nuôi Gà Thịt Chuồng Lạnh', 'LIVESTOCK', 2500.00, 'Nền đệm lót sinh học', 'Nước máy lọc RO', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 11. CHUỒNG NUÔI (ZONE_LOCATIONS / BARNS)
INSERT INTO zone_locations (id, tenant_id, farm_id, zone_id, code, name, description, status, area_m2, capacity, capacity_unit) VALUES
    (1, 1, 1, 1, 'CHUONG-H01', 'Chuồng Heo Thịt 01 (Dãy Đông)', 'Hệ thống quạt làm mát công suất lớn, núm uống tự động', 'ACTIVE', 600.00, 120, 'con'),
    (2, 1, 1, 1, 'CHUONG-H02', 'Chuồng Heo Thịt 02 (Dãy Tây)', 'Hệ thống thông gió giàn lạnh cooling pad', 'ACTIVE', 600.00, 120, 'con'),
    (3, 1, 1, 2, 'CHUONG-G01', 'Chuồng Gà Thịt 01 (Chuồng Kín)', 'Hệ thống cấp thức ăn và nước uống tự động bằng máng xoay', 'ACTIVE', 800.00, 1000, 'con')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 12. CHU KỲ VẬN HÀNH (OPERATIONAL_CYCLES)
INSERT INTO operational_cycles (id, tenant_id, farm_id, name, fiscal_year, start_date, end_date, status) VALUES
    (1, 1, 1, 'Vụ Nuôi Heo Thịt Đầu Năm 2026', 2026, '2026-01-10', '2026-05-30', 'ACTIVE'),
    (2, 1, 1, 'Lứa Gà Thịt Thương Phẩm Đợt 1', 2026, '2026-02-01', '2026-03-25', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 13. GIỐNG VẬT NUÔI (LIVESTOCK_BREEDS)
INSERT INTO livestock_breeds (id, tenant_id, species, breed_name, standard_growth_days, target_weight_kg, management_type) VALUES
    (1, 1, 'PIG', 'Heo thịt 3 máu ngoại Duroc x (Landrace x Yorkshire)', 135, 110.00, 'GROUP'),
    (2, 1, 'POULTRY', 'Gà thịt trắng công nghiệp Ross 308', 42, 2.60, 'GROUP')
ON DUPLICATE KEY UPDATE breed_name=VALUES(breed_name);

-- 14. ĐÀN VẬT NUÔI ĐANG HOẠT ĐỘNG (LIVESTOCK_GROUPS)
INSERT INTO livestock_groups (id, tenant_id, farm_id, branch_id, zone_id, location_id, operational_cycle_id, breed_id, group_code, entry_date, initial_quantity, current_quantity, avg_initial_weight_kg, notes, status) VALUES
    (1, 1, 1, 1, 1, 1, 1, 1, 'DAN-HEO-26A', '2026-01-10', 100, 98, 65.50, 'Đàn Heo Thịt Chuồng 01 (Nhập tháng 1/2026)', 'ACTIVE'),
    (2, 1, 1, 2, 2, 3, 2, 2, 'DAN-GA-26B', '2026-02-01', 800, 785, 1.85, 'Đàn Gà Thịt Ross 308 Chuồng 01', 'ACTIVE')
ON DUPLICATE KEY UPDATE notes=VALUES(notes);

-- 15. KHO VẬT TƯ (WAREHOUSES)
INSERT INTO warehouses (id, tenant_id, farm_id, branch_id, zone_id, code, name, warehouse_type, capacity_m3, floor_area_m2, standard_temp_c, standard_humidity_pct, location_desc, manager_user_id, status) VALUES
    (1, 1, 1, 1, 1, 'KHO-CAM-HEO', 'Kho Cám & Dinh Dưỡng Trại Heo', 'FEED', 800.00, 250.00, 25.00, 65.00, 'Cạnh cổng phụ Chi nhánh 1', 5, 'ACTIVE'),
    (2, 1, 1, 1, 1, 'KHO-THUOC-HEO', 'Kho Thuốc Thú Y & Vắc-xin Trại Heo', 'MEDICINE', 150.00, 60.00, 6.00, 50.00, 'Tủ mát chuyên dụng phòng kỹ thuật Trại Heo', 4, 'ACTIVE'),
    (3, 1, 1, 2, 2, 'KHO-CAM-GA', 'Kho Cám Trại Gà', 'FEED', 600.00, 200.00, 26.00, 65.00, 'Đầu dãy chuồng gà Chi nhánh 2', 5, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 16. DANH MỤC VẬT TƯ & VẬT TƯ (MATERIAL_CATEGORIES & MATERIALS)
INSERT INTO material_categories (id, tenant_id, name, code, description) VALUES
    (1, 1, 'Thức ăn hỗn hợp hoàn chỉnh', 'FEED', 'Các loại cám viên công nghiệp theo giai đoạn phát triển'),
    (2, 1, 'Thuốc thú y & Vắc-xin', 'MEDICINE', 'Vắc-xin phòng bệnh và kháng sinh điều trị vật nuôi'),
    (3, 1, 'Vật tư tiêu hao & Sát trùng', 'SUPPLIES', 'Vôi bột, thuốc sát trùng chuồng trại và bảo hộ lao động')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO materials (id, tenant_id, category_id, sku_code, name, standard_unit, dispatch_strategy, expiry_alert_days, min_stock_level, max_stock_level, unit_price_standard, manufacturer_name, active_ingredient, default_phi_days, status) VALUES
    (1, 1, 1, 'CAM-HEO-C280', 'Cám Heo Con Starter C280 (15 - 30kg)', 'bao', 'FEFO', 30, 20.00, 200.00, 360000.00, 'CP Group Việt Nam', 'Protein thô 19%', 0, 'ACTIVE'),
    (2, 1, 1, 'CAM-HEO-C380', 'Cám Heo Thịt Grower C380 (30 - 60kg)', 'bao', 'FEFO', 30, 30.00, 300.00, 325000.00, 'CP Group Việt Nam', 'Protein thô 17%', 0, 'ACTIVE'),
    (3, 1, 1, 'CAM-GA-G101', 'Cám Gà Thịt Giai Đoạn Vỗ Béo (22 ngày - xuất)', 'bao', 'FEFO', 30, 25.00, 250.00, 340000.00, 'De Heus', 'Protein thô 20%', 0, 'ACTIVE'),
    (4, 1, 2, 'VAC-PRRS-HEO', 'Vắc-xin Tai Xanh PRRS Nhược Độc (Heo)', 'lọ', 'FEFO', 15, 10.00, 100.00, 480000.00, 'Boehringer Ingelheim', 'PRRS modified live virus', 21, 'ACTIVE'),
    (5, 1, 2, 'VAC-NEWCASTLE', 'Vắc-xin Newcastle Lasota Chủng M (Gà)', 'lọ', 'FEFO', 15, 15.00, 150.00, 65000.00, 'Navetco', 'Newcastle disease virus strain Lasota', 14, 'ACTIVE'),
    (6, 1, 3, 'SAT-TRUNG-IODINE', 'Thuốc Sát Trùng Chuồng Trại Iodine Complex', 'lít', 'FEFO', 60, 10.00, 100.00, 185000.00, 'Bayer Animal Health', 'PVP Iodine 10%', 0, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Quy đổi đơn vị (1 bao = 25 kg)
INSERT INTO material_unit_conversions (id, tenant_id, material_id, unit_name, unit_barcode, conversion_factor, is_purchase_unit, is_dispatch_unit) VALUES
    (1, 1, 1, 'kg', '8936000101', 0.0400, 0, 1),
    (2, 1, 2, 'kg', '8936000102', 0.0400, 0, 1),
    (3, 1, 3, 'kg', '8936000103', 0.0400, 0, 1)
ON DUPLICATE KEY UPDATE conversion_factor=VALUES(conversion_factor);

-- 17. TỒN KHO THỰC TẾ (WAREHOUSE_INVENTORY)
INSERT INTO warehouse_inventory (id, tenant_id, farm_id, warehouse_id, material_id, batch_number, manufacture_date, inward_date, expiry_date, unit_cost, quantity_on_hand, reserved_quantity, storage_bin_code) VALUES
    (1, 1, 1, 1, 1, 'LO-C280-2601', '2026-01-05', '2026-01-08', '2026-04-05', 360000.00, 85.00, 0.00, 'KE-A1'),
    (2, 1, 1, 1, 2, 'LO-C380-2601', '2026-01-10', '2026-01-12', '2026-04-10', 325000.00, 120.00, 0.00, 'KE-A2'),
    (3, 1, 1, 2, 4, 'LO-PRRS-2512', '2025-12-01', '2025-12-15', '2026-11-30', 480000.00, 35.00, 0.00, 'TU-MAT-01'),
    (4, 1, 1, 3, 3, 'LO-G101-2601', '2026-01-15', '2026-01-18', '2026-04-15', 340000.00, 95.00, 0.00, 'KE-B1')
ON DUPLICATE KEY UPDATE quantity_on_hand=VALUES(quantity_on_hand);

-- 18. ĐỊNH MỨC TIÊU THỤ (CONSUMPTION_QUOTAS)
INSERT INTO consumption_quotas (id, tenant_id, farm_id, livestock_breed_id, material_id, standard_quantity, unit_of_measure, stage) VALUES
    (1, 1, 1, 1, 1, 1.20, 'kg/con/ngày', 'Giai đoạn tập ăn & heo con (15-30kg)'),
    (2, 1, 1, 1, 2, 2.30, 'kg/con/ngày', 'Giai đoạn vỗ béo heo thịt (30-100kg)'),
    (3, 1, 1, 2, 3, 0.15, 'kg/con/ngày', 'Giai đoạn gà thịt vỗ béo (22-42 ngày)')
ON DUPLICATE KEY UPDATE standard_quantity=VALUES(standard_quantity);

-- 19. HỒ SƠ NHÂN SỰ MẪU (EMPLOYEES)
INSERT INTO employees (id, tenant_id, farm_id, user_id, employee_code, full_name, phone, email, id_card_number, date_of_birth, position, department, joined_date, base_salary, hourly_rate, contract_type, annual_leave_quota, status) VALUES
    (1, 1, 1, 3, 'NV-001', 'Trần Văn Bình', '0977111222', 'manager@hoabinh.farmgo.vn', '019088001122', '1988-06-15', 'Trại trưởng', 'Ban Giám đốc Kỹ thuật', '2023-01-01', 16000000.00, 75000.00, 'FULL_TIME', 14.0, 'ACTIVE'),
    (2, 1, 1, 4, 'NV-002', 'Lê Kỹ Thuật', '0966333444', 'tech@hoabinh.farmgo.vn', '019090003344', '1992-09-20', 'Bác sĩ Thú y', 'Kỹ thuật & Thú y', '2023-06-15', 13500000.00, 65000.00, 'FULL_TIME', 12.0, 'ACTIVE'),
    (3, 1, 1, 5, 'NV-003', 'Phạm Kế Toán', '0955444555', 'ketoan@hoabinh.farmgo.vn', '019095005566', '1995-12-10', 'Thủ kho kiêm Kế toán', 'Hành chính Kế toán', '2024-01-10', 11000000.00, 55000.00, 'FULL_TIME', 12.0, 'ACTIVE'),
    (4, 1, 1, 6, 'NV-004', 'Hoàng Văn Công', '0944555666', 'worker@hoabinh.farmgo.vn', '019098007788', '1998-03-25', 'Công nhân chăn nuôi', 'Tổ Chăn nuôi Chuồng 01', '2024-03-01', 8500000.00, 42000.00, 'FULL_TIME', 12.0, 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), base_salary=VALUES(base_salary);

-- 20. ĐỐI TÁC THƯƠNG MẠI & KHÁCH HÀNG (PARTNERS)
INSERT INTO partners (id, tenant_id, farm_id, code, name, partner_type, tax_code, contact_person, phone, email, address, bank_name, bank_account_no, bank_account_name, status, credit_limit, payment_term_days) VALUES
    (1, 1, 1, 'DT-CP-01', 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam', 'SUPPLIER', '0100779922', 'Nguyễn Thị Hương', '02438889999', 'contact@cp.com.vn', 'KCN Biên Hòa 2, Đồng Nai', 'Vietcombank', '0071001234567', 'CP VIETNAM CORP', 'ACTIVE', 500000000.00, 30),
    (2, 1, 1, 'DT-THUONG-LAI-01', 'Hợp tác xã Thu mua & Cung ứng Thịt sạch Phát Đạt', 'BUYER', '0108877665', 'Vũ Phát Đạt', '0912888777', 'phatdat@phatdatmeat.vn', 'Chợ đầu mối gia súc Hà Nam', 'Agribank', '2601205123456', 'VU PHAT DAT', 'ACTIVE', 300000000.00, 15)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 21. GIAO DỊCH SỔ QUÝ MẪU (PAYMENT_TRANSACTIONS)
INSERT INTO payment_transactions (id, tenant_id, farm_id, payment_code, payment_type, partner_id, amount, allocated_amount, payment_method, reference_code, qr_transfer_content, payment_date, notes, status, created_at) VALUES
    (1, 1, 1, 'PT-2601-001', 'EXPENSE', 1, 30600000.00, 30600000.00, 'BANK_TRANSFER', 'UNC-VCB-8871', 'FARM001 THANH TOAN CAM HEO CP', '2026-01-10', 'Thanh toán tiền nhập 85 bao cám heo Starter C280', 'CONFIRMED', NOW()),
    (2, 1, 1, 'PT-2601-002', 'INCOME', 2, 75000000.00, 75000000.00, 'BANK_TRANSFER', 'FT2601558912', 'FARM001 DAT COC HEO THIT PHAT DAT', '2026-01-20', 'Tiền đặt cọc thu mua 50 con heo thịt đợt 1', 'CONFIRMED', NOW())
ON DUPLICATE KEY UPDATE notes=VALUES(notes);

SET FOREIGN_KEY_CHECKS = 1;
