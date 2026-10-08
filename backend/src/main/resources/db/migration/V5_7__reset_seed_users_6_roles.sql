-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_7: RESET SEED USERS - 6 DEMO ACCOUNTS (ONE PER ROLE)
-- =============================================================================
-- Mô tả: Xóa tài khoản superadmin cũ và tạo 6 tài khoản demo cho 6 nhóm vai trò
--   theo đúng file roles-permissions.md:
--   1. superadmin      / Admin@123       -> ROLE_SUPER_ADMIN
--   2. farm_owner      / FarmOwner@123   -> ROLE_FARM_OWNER
--   3. field_staff     / FieldStaff@123  -> ROLE_FIELD_STAFF
--   4. warehouse_staff / Warehouse@123   -> ROLE_WAREHOUSE_STAFF
--   5. tech_staff      / TechStaff@123   -> ROLE_TECHNICAL_STAFF
--   6. accountant      / Accountant@123  -> ROLE_ACCOUNTANT
--
-- Tenant seed: ID = 1 (HTX Nông nghiệp Xanh Việt)
-- Farm seed:   ID = 1 (Cơ sở Sản xuất Lâm Đồng)
-- =============================================================================

-- BƯỚC 0: Đảm bảo tenant & farm mẫu tồn tại để gán quyền truy cập
INSERT IGNORE INTO `tenants` (`id`, `code`, `name`, `subdomain`, `subscription_plan`, `status`)
VALUES (1, 'HTX-XANH-VIET', 'HTX Nông Nghiệp Xanh Việt', 'xanhviet', 'ENTERPRISE', 'ACTIVE');

-- BƯỚC 1: Xóa toàn bộ user_roles và user_farm_access liên quan đến tài khoản demo cũ
DELETE ur FROM user_roles ur
INNER JOIN users u ON ur.user_id = u.id
WHERE u.username IN ('superadmin', 'farm_owner', 'field_staff', 'warehouse_staff', 'tech_staff', 'accountant', 'admin');

DELETE ufa FROM user_farm_access ufa
INNER JOIN users u ON ufa.user_id = u.id
WHERE u.username IN ('superadmin', 'farm_owner', 'field_staff', 'warehouse_staff', 'tech_staff', 'accountant', 'admin');

-- BƯỚC 2: Xóa user demo cũ (nếu có)
DELETE FROM users WHERE username IN ('superadmin', 'farm_owner', 'field_staff', 'warehouse_staff', 'tech_staff', 'accountant', 'admin');

-- BƯỚC 3: Tạo 6 tài khoản demo (password đã hash BCrypt strength=10)
-- Password mapping:
--   superadmin      : Admin@123
--   farm_owner      : FarmOwner@123
--   field_staff     : FieldStaff@123
--   warehouse_staff : Warehouse@123
--   tech_staff      : TechStaff@123
--   accountant      : Accountant@123

INSERT INTO `users`
    (`tenant_id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `status`, `failed_logins`, `created_by`, `updated_by`)
VALUES
-- 1. Super Admin: Quản trị viên toàn hệ thống
(1, 'superadmin',      'superadmin@xanhviet.vn',      '$2a$10$z/Z3MvEplv9bnMztFDlaH.zesTFhOnHbDjdOH50fv52QAzj4hiUb.', 'Nguyễn Quản Trị Viên',    '0901000001', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM'),
-- 2. Farm Owner: Chủ / Quản lý trang trại
(1, 'farm_owner',      'farmowner@xanhviet.vn',       '$2a$10$PrEbzOzGg73CzSbFMakGPuY6c4.dUEPQSTzR3M3Bd1DdKsNxMUIiu', 'Trần Chủ Trang Trại',     '0901000002', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM'),
-- 3. Field Staff: Nhân viên hiện trường / chấm công GPS
(1, 'field_staff',     'fieldstaff@xanhviet.vn',      '$2a$10$VokhCbDOieUPk0jg6DpNre.4iew6u4whWiPM5c.XRW7q7k145JXG6', 'Lê Nhân Viên Đồng Ruộng', '0901000003', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM'),
-- 4. Warehouse Staff: Thủ kho
(1, 'warehouse_staff', 'warehouse@xanhviet.vn',       '$2a$10$NxQFCk6OTHOzHKXWQY2nne6vMmejKB21gKRkIp7XBz36KeXlvI9tO', 'Phạm Thủ Kho',            '0901000004', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM'),
-- 5. Technical Staff: Kỹ thuật viên / Thú y
(1, 'tech_staff',      'techstaff@xanhviet.vn',       '$2a$10$fnidqwr/KBJZ2FczmV521Oglbqo29HxdYTZa3hRtT.s9O.qlRmzsW', 'Hoàng Kỹ Thuật Viên',    '0901000005', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM'),
-- 6. Accountant: Kế toán viên
(1, 'accountant',      'accountant@xanhviet.vn',      '$2a$10$ot0s6r6iUWCPi4rbVHd9d.2fRk3YuRkq3yZ30txRfR.PKt1ErWUVa', 'Vũ Kế Toán Viên',         '0901000006', 'ACTIVE', 0, 'SYSTEM', 'SYSTEM');

-- BƯỚC 4: Gán Role cho từng user (JOIN theo username và role code)
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'superadmin' AND r.code = 'ROLE_SUPER_ADMIN';

INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'farm_owner' AND r.code = 'ROLE_FARM_OWNER';

INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'field_staff' AND r.code = 'ROLE_FIELD_STAFF';

INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'warehouse_staff' AND r.code = 'ROLE_WAREHOUSE_STAFF';

INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'tech_staff' AND r.code = 'ROLE_TECHNICAL_STAFF';

INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'accountant' AND r.code = 'ROLE_ACCOUNTANT';

-- BƯỚC 5: Gán Farm Access (farm_id = 1) cho tất cả user (trừ superadmin không cần giới hạn farm)
INSERT INTO `user_farm_access` (`user_id`, `farm_id`, `tenant_id`, `granted_by`)
SELECT u.id, 1, 1, 'SYSTEM' FROM users u
WHERE u.username IN ('farm_owner', 'field_staff', 'warehouse_staff', 'tech_staff', 'accountant')
  AND EXISTS (SELECT 1 FROM farms WHERE id = 1 AND tenant_id = 1);

-- BƯỚC 6: Cập nhật manager trang trại 1 về farm_owner (nếu farm tồn tại)
UPDATE farms SET manager_user_id = (SELECT id FROM users WHERE username = 'farm_owner')
WHERE id = 1 AND tenant_id = 1;
