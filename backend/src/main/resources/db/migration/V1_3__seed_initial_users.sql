-- ==============================================================================
-- FARM SAAS PLATFORM - FLYWAY MIGRATION V1.3
-- MỤC ĐÍCH: KHỞI TẠO TÀI KHOẢN MẪU VÀ DOANH NGHIỆP BAN ĐẦU CHO MÔI TRƯỜNG DEV/TEST
-- ==============================================================================

-- 1. Khởi tạo Tenant mẫu (Hợp Tác Xã Nông Trại Xanh)
INSERT INTO tenants (id, code, name, subdomain, subscription_plan, status)
VALUES (1, 'TNT_GREENFARM', 'Hợp Tác Xã Nông Trại Xanh', 'greenfarm', 'ENTERPRISE', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Khởi tạo Trang trại mẫu (Trang Trại Đà Lạt 01)
INSERT INTO farms (id, tenant_id, code, name, farm_type, total_area_m2, status)
VALUES (1, 1, 'FARM_DALAT_01', 'Trang Trại Đà Lạt 01', 'CROP', 50000.00, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Khởi tạo Người dùng ban đầu (Mật khẩu mặc định: Password@123)
-- BCrypt: $2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu
INSERT INTO users (id, tenant_id, is_super_admin, username, email, password_hash, full_name, phone, status)
VALUES 
    -- Super Admin (tenant_id = NULL)
    (1, NULL, TRUE, 'admin', 'admin@farm.saas', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Quản Trị Viên Hệ Thống', '0901234567', 'ACTIVE'),
    -- Farm Owner
    (2, 1, FALSE, 'owner', 'owner@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Trần Văn Chủ', '0912345678', 'ACTIVE'),
    -- Field Staff
    (3, 1, FALSE, 'staff', 'staff@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Nguyễn Văn Nông Vụ', '0923456789', 'ACTIVE'),
    -- Warehouse Staff
    (4, 1, FALSE, 'warehouse', 'warehouse@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Lê Thị Thủ Kho', '0934567890', 'ACTIVE'),
    -- Technical Staff
    (5, 1, FALSE, 'tech', 'tech@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Phạm Văn Kỹ Thuật', '0945678901', 'ACTIVE'),
    -- Accountant
    (6, 1, FALSE, 'accountant', 'accountant@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Hoàng Thị Kế Toán', '0956789012', 'ACTIVE')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name);

-- Gán Quản lý cho Farm 1
UPDATE farms SET manager_user_id = 2 WHERE id = 1;

-- 4. Phân vai trò cho người dùng (user_roles)
INSERT INTO user_roles (tenant_id, user_id, role_id, farm_id)
VALUES 
    (NULL, 1, 1, NULL), -- admin: ROLE_SUPER_ADMIN
    (1, 2, 2, NULL),    -- owner: ROLE_FARM_OWNER
    (1, 3, 3, 1),       -- staff: ROLE_FIELD_STAFF (Farm 1)
    (1, 4, 4, 1),       -- warehouse: ROLE_WAREHOUSE_STAFF (Farm 1)
    (1, 5, 5, 1),       -- tech: ROLE_TECHNICAL_STAFF (Farm 1)
    (1, 6, 6, NULL)     -- accountant: ROLE_ACCOUNTANT
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 5. Cấp quyền truy cập Farm (user_farm_access)
INSERT INTO user_farm_access (user_id, farm_id, tenant_id)
VALUES 
    (2, 1, 1),
    (3, 1, 1),
    (4, 1, 1),
    (5, 1, 1),
    (6, 1, 1)
ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id);
