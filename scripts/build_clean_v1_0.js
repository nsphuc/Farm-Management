const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve('current_schema.sql');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Remove flyway_schema_history
content = content.replace(/DROP TABLE IF EXISTS `flyway_schema_history`;[\s\S]*?;\n\/\*!40101 SET character_set_client = @saved_cs_client \*\/;/gi, '');

// 2. Remove AUTO_INCREMENT=\d+
content = content.replace(/\s+AUTO_INCREMENT=\d+/g, '');

// 3. Remove mysqldump specific comments and locks
content = content.replace(/\/\*!50003[\s\S]*?\*\/;/g, '');

// 4. Prepare RBAC Seed Data (Roles, Permissions, Role-Permissions, Super Admin ONLY)
const rbacBootstrap = `
-- ==============================================================================
-- SYSTEM CORE BOOTSTRAP (ROLES, PERMISSIONS & SUPER ADMIN)
-- ==============================================================================

-- 1. Chuẩn hóa danh mục 7 Vai trò chuẩn 4 Cấp
INSERT INTO roles (code, name, scope_level, description) VALUES
('ROLE_SUPER_ADMIN',     'Cấp 1: Quản trị viên nền tảng',            'SYSTEM', 'Quản lý khách hàng thuê bao (Tenant), gói cước và toàn nền tảng SaaS'),
('ROLE_FARM_OWNER',      'Cấp 2: Chủ đầu tư / Chủ chuỗi trang trại', 'TENANT', 'Tạo trang trại, bổ nhiệm Giám đốc trại, duyệt cấp cao và giám sát toàn chuỗi'),
('ROLE_FARM_MANAGER',    'Cấp 3: Giám đốc / Quản lý trang trại',     'FARM',   'Điều hành trực tiếp trang trại, tuyển Cấp 4 và đóng vai trò Checker phê duyệt tại trại'),
('ROLE_TECHNICAL_STAFF', 'Cấp 4: Kỹ thuật / Trưởng phân khu / KCS',  'FARM',   'Lên lịch mùa vụ, phác đồ thú y, lấy mẫu KCS (Maker) và giao việc kỹ thuật'),
('ROLE_WAREHOUSE_STAFF', 'Cấp 4: Thủ kho vật tư & Thành phẩm',       'FARM',   'Quản lý tồn kho, lập phiếu nhập/xuất/chuyển/kiểm kê (Maker), in tem QR và xuất xe'),
('ROLE_ACCOUNTANT',      'Cấp 4: Kế toán trang trại',                'FARM',   'Lập phiếu chi, đơn bán sỉ, phiếu thanh toán VietQR, phân bổ công nợ và báo cáo trại'),
('ROLE_FIELD_STAFF',     'Cấp 4: Nhân viên hiện trường',             'FARM',   'Nhận việc hàng ngày, ghi nhật ký canh tác, ghi sản lượng thu hoạch và chấm công')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    scope_level = VALUES(scope_level),
    description = VALUES(description);

-- 2. Đầy đủ 30 Mã Quyền (Permissions) chuẩn trong hệ thống
INSERT INTO permissions (code, module, action, resource, description) VALUES
('PERM_TENANT_MANAGE',       'SYSTEM',    'APPROVE', 'TENANT',         '1. Toàn quyền quản trị khách hàng thuê nền tảng'),
('PERM_FARM_CREATE',         'FARM',      'CREATE',  'FARM',           '2. Độc quyền tạo mới trang trại (Cấp 2 Owner)'),
('PERM_FARM_VIEW',           'FARM',      'READ',    'FARM',           '3. Xem thông tin trang trại (Đa trại hoặc trại trực thuộc)'),
('PERM_FARM_UPDATE',         'FARM',      'UPDATE',  'FARM',           '4. Cập nhật cấu hình thông tin trang trại'),
('PERM_ZONE_MANAGE',         'FARM',      'CREATE',  'ZONE',           '5. Quản lý phân khu sản xuất, nhà màng, chuồng trại & ô/luống'),
('PERM_CROP_VIEW',           'CROP',      'READ',    'CROP_SEASON',    '6. Xem tiến độ mùa vụ và lịch canh tác'),
('PERM_CROP_PLAN',           'CROP',      'CREATE',  'CROP_SEASON',    '7. Lên lịch/Phác đồ vụ mùa (Maker: Technical) & Duyệt vụ mùa (Checker: Farm Manager)'),
('PERM_CROP_LOG',            'CROP',      'CREATE',  'FARMING_LOG',    '8. Nhập nhật ký canh tác (Field) & Kiểm tra nhật ký (Farm Manager)'),
('PERM_LIVESTOCK_VIEW',      'LIVESTOCK', 'READ',    'LIVESTOCK',      '9. Xem đàn vật nuôi và lịch chăm sóc'),
('PERM_LIVESTOCK_MANAGE',    'LIVESTOCK', 'CREATE',  'LIVESTOCK',      '10. Lập kế hoạch nuôi (Technical) & Duyệt đàn vật nuôi (Farm Manager)'),
('PERM_LIVESTOCK_VET',       'LIVESTOCK', 'CREATE',  'VET_EVENT',      '11. Độc quyền khám bệnh & lên phác đồ điều trị thú y (Technical)'),
('PERM_INVENTORY_VIEW',      'INVENTORY', 'READ',    'INVENTORY',      '12. Xem và đối chiếu tồn kho FIFO/FEFO'),
('PERM_INVENTORY_RECEIPT',   'INVENTORY', 'CREATE',  'RECEIPT',        '13. Phiếu nhập kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_ISSUE',     'INVENTORY', 'CREATE',  'ISSUE',          '14. Phiếu xuất kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_TRANSFER',  'INVENTORY', 'CREATE',  'TRANSFER',       '15. Điều chuyển kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_STOCKTAKE', 'INVENTORY', 'CREATE',  'STOCKTAKE',      '16. Kiểm kê kho (Maker: Warehouse nhập kiểm đếm / Checker: Farm Manager duyệt)'),
('PERM_HARVEST_MANAGE',      'HARVEST',   'CREATE',  'HARVEST_RECORD', '17. Ghi sản lượng (Field), Tiếp nhận kho (Warehouse), Đánh giá giống (Tech), Duyệt (FM)'),
('PERM_QC_INSPECT',          'QC',        'CREATE',  'QC_INSPECTION',  '18. Maker: Lấy mẫu & lập biên bản kiểm định KCS (Độc quyền Technical)'),
('PERM_QC_APPROVE',          'QC',        'APPROVE', 'BATCH',          '19. Checker: Phê duyệt lô thành phẩm & sinh mã QR (Owner & Farm Manager)'),
('PERM_LABEL_PRINT',         'QC',        'EXPORT',  'LABEL',          '20. In tem nhãn nhiệt dán thùng (Độc quyền Warehouse)'),
('PERM_QC_RECALL',           'QC',        'APPROVE', 'RECALL',         '21. Ra lệnh thu hồi lô thành phẩm lỗi (Owner & Farm Manager)'),
('PERM_DELIVERY_MANAGE',     'DELIVERY',  'CREATE',  'DELIVERY',       '22. Xuất hàng lên xe (Warehouse) & Giám sát giao vận (Farm Manager)'),
('PERM_HR_EMPLOYEE_MANAGE',  'HR',        'CREATE',  'EMPLOYEE',       '23. Tuyển dụng nhân sự (Owner tuyển Cấp 3 / Farm Manager tuyển Cấp 4)'),
('PERM_HR_ATTENDANCE',       'HR',        'READ',    'ATTENDANCE',     '24. Chấm công GPS cá nhân, điểm danh ca, xem tổng hợp & duyệt công tháng'),
('PERM_TASK_ASSIGN',         'HR',        'CREATE',  'TASK',           '25. Giao việc kỹ thuật (Technical) & Giao việc/Nghiệm thu (Farm Manager)'),
('PERM_FINANCE_EXPENSE',     'FINANCE',   'CREATE',  'EXPENSE',        '26. Chi phí vận hành (Maker: Accountant lập phiếu / Checker: Farm Manager duyệt)'),
('PERM_FINANCE_SALES_ORDER', 'FINANCE',   'CREATE',  'ORDER',          '27. Đơn hàng bán sỉ (Maker: Accountant lên đơn / Checker: Farm Manager duyệt)'),
('PERM_FINANCE_PAYMENT',     'FINANCE',   'CREATE',  'PAYMENT',        '28. Thanh toán thu/chi (Maker: Accountant lập phiếu / Checker: Farm Manager duyệt)'),
('PERM_PAYMENT_ALLOCATE',    'FINANCE',   'UPDATE',  'ALLOCATION',     '29. Phân bổ/Cấn trừ công nợ (Accountant) & Giám sát công nợ (Farm Manager)'),
('PERM_FINANCE_REPORT',      'FINANCE',   'READ',    'REPORT',         '30. Báo cáo tài chính & kết toán (Accountant lập, Farm Manager duyệt trại, Owner toàn công ty)')
ON DUPLICATE KEY UPDATE
    module = VALUES(module),
    description = VALUES(description);

-- 3. Gán quyền chuẩn cho từng vai trò
DELETE FROM role_permissions;

-- 3.1. CẤP 1: ROLE_SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_SUPER_ADMIN' AND p.code IN (
    'PERM_TENANT_MANAGE'
);

-- 3.2. CẤP 2: ROLE_FARM_OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_OWNER' AND p.code IN (
    'PERM_FARM_CREATE', 'PERM_FARM_VIEW', 'PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE',
    'PERM_CROP_VIEW', 'PERM_LIVESTOCK_VIEW', 'PERM_INVENTORY_VIEW',
    'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_HR_EMPLOYEE_MANAGE',
    'PERM_HR_ATTENDANCE', 'PERM_FINANCE_REPORT'
);

-- 3.3. CẤP 3: ROLE_FARM_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_MANAGER' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE', 'PERM_CROP_VIEW',
    'PERM_CROP_PLAN', 'PERM_CROP_LOG', 'PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE',
    'PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE',
    'PERM_INVENTORY_TRANSFER', 'PERM_INVENTORY_STOCKTAKE', 'PERM_HARVEST_MANAGE',
    'PERM_QC_APPROVE', 'PERM_QC_RECALL', 'PERM_DELIVERY_MANAGE', 'PERM_HR_EMPLOYEE_MANAGE',
    'PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_SALES_ORDER',
    'PERM_FINANCE_PAYMENT', 'PERM_PAYMENT_ALLOCATE', 'PERM_FINANCE_REPORT'
);

-- 3.4. CẤP 4: ROLE_TECHNICAL_STAFF
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_TECHNICAL_STAFF' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_VIEW',
    'PERM_LIVESTOCK_MANAGE', 'PERM_LIVESTOCK_VET', 'PERM_INVENTORY_VIEW',
    'PERM_HARVEST_MANAGE', 'PERM_QC_INSPECT', 'PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN'
);

-- 3.5. CẤP 4: ROLE_WAREHOUSE_STAFF
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_WAREHOUSE_STAFF' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_INVENTORY_VIEW', 'PERM_INVENTORY_RECEIPT', 'PERM_INVENTORY_ISSUE',
    'PERM_INVENTORY_TRANSFER', 'PERM_INVENTORY_STOCKTAKE', 'PERM_HARVEST_MANAGE',
    'PERM_LABEL_PRINT', 'PERM_DELIVERY_MANAGE', 'PERM_HR_ATTENDANCE'
);

-- 3.6. CẤP 4: ROLE_ACCOUNTANT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_ACCOUNTANT' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_INVENTORY_VIEW', 'PERM_HR_ATTENDANCE', 'PERM_FINANCE_EXPENSE',
    'PERM_FINANCE_SALES_ORDER', 'PERM_FINANCE_PAYMENT', 'PERM_PAYMENT_ALLOCATE', 'PERM_FINANCE_REPORT'
);

-- 3.7. CẤP 4: ROLE_FIELD_STAFF
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FIELD_STAFF' AND p.code IN (
    'PERM_FARM_VIEW', 'PERM_CROP_VIEW', 'PERM_CROP_LOG', 'PERM_LIVESTOCK_VIEW',
    'PERM_HARVEST_MANAGE', 'PERM_HR_ATTENDANCE'
);

-- 4. KHỞI TẠO DUY NHẤT 1 TÀI KHOẢN SUPERADMIN
-- Mật khẩu mặc định: Password@123
INSERT INTO users (id, tenant_id, is_super_admin, username, email, password_hash, full_name, phone, status, must_change_password)
VALUES 
    (1, NULL, TRUE, 'admin', 'admin@farm.saas', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Quản Trị Viên Hệ Thống', '0901234567', 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name);

-- Phân quyền ROLE_SUPER_ADMIN cho tài khoản admin
DELETE FROM user_roles WHERE user_id = 1;
INSERT INTO user_roles (tenant_id, user_id, role_id, farm_id)
SELECT NULL, 1, id, NULL FROM roles WHERE code = 'ROLE_SUPER_ADMIN';
`;

const finalSql = `-- ==============================================================================
-- FARM SAAS - CONSOLIDATED DATABASE INITIALIZATION CORE (V1_0)
-- Multi-Tenant Cloud Architecture, 4-Tier RBAC, Production-Ready DDL
-- Single Master Account: admin / Password@123
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

${content.trim()}

${rbacBootstrap.trim()}

SET FOREIGN_KEY_CHECKS = 1;
`;

const targetFile = path.resolve('backend/src/main/resources/db/migration/V1_0__init_system_core.sql');
fs.writeFileSync(targetFile, finalSql, 'utf8');
console.log('Successfully written consolidated V1_0__init_system_core.sql! File size:', finalSql.length);

