-- ==============================================================================
-- Migration File: V1_4__standardize_4_tier_rbac_matrix.sql
-- Mục tiêu: Chuẩn hóa toàn bộ 7 Roles & 30 Permissions khớp 100% Ma trận Phân quyền 4 Cấp
-- Cấp 1: ROLE_SUPER_ADMIN     (Scope: SYSTEM - 1 quyền)
-- Cấp 2: ROLE_FARM_OWNER      (Scope: TENANT - 12 quyền)
-- Cấp 3: ROLE_FARM_MANAGER    (Scope: FARM   - 25 quyền)
-- Cấp 4: ROLE_TECHNICAL_STAFF (Scope: FARM   - 11 quyền)
-- Cấp 4: ROLE_WAREHOUSE_STAFF (Scope: FARM   - 10 quyền)
-- Cấp 4: ROLE_ACCOUNTANT      (Scope: FARM   - 8 quyền)
-- Cấp 4: ROLE_FIELD_STAFF     (Scope: FARM   - 6 quyền)
-- ==============================================================================

-- 1. Chuẩn hóa lại danh mục 7 Vai trò (Roles) và Scope Level chuẩn 4 Cấp
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

-- 2. Đảm bảo đủ 30 Mã Quyền (Permissions) chuẩn trong hệ thống
INSERT INTO permissions (code, module, action, resource, description) VALUES
-- 1. SYSTEM
('PERM_TENANT_MANAGE',       'SYSTEM',    'APPROVE', 'TENANT',         '1. Toàn quyền quản trị khách hàng thuê nền tảng'),
-- 2-5. FARM
('PERM_FARM_CREATE',         'FARM',      'CREATE',  'FARM',           '2. Độc quyền tạo mới trang trại (Cấp 2 Owner)'),
('PERM_FARM_VIEW',           'FARM',      'READ',    'FARM',           '3. Xem thông tin trang trại (Đa trại hoặc trại trực thuộc)'),
('PERM_FARM_UPDATE',         'FARM',      'UPDATE',  'FARM',           '4. Cập nhật cấu hình thông tin trang trại'),
('PERM_ZONE_MANAGE',         'FARM',      'CREATE',  'ZONE',           '5. Quản lý phân khu sản xuất, nhà màng, chuồng trại & ô/luống'),
-- 6-8. CROP
('PERM_CROP_VIEW',           'CROP',      'READ',    'CROP_SEASON',    '6. Xem tiến độ mùa vụ và lịch canh tác'),
('PERM_CROP_PLAN',           'CROP',      'CREATE',  'CROP_SEASON',    '7. Lên lịch/Phác đồ vụ mùa (Maker: Technical) & Duyệt vụ mùa (Checker: Farm Manager)'),
('PERM_CROP_LOG',            'CROP',      'CREATE',  'FARMING_LOG',    '8. Nhập nhật ký canh tác (Field) & Kiểm tra nhật ký (Farm Manager)'),
-- 9-11. LIVESTOCK
('PERM_LIVESTOCK_VIEW',      'LIVESTOCK', 'READ',    'LIVESTOCK',      '9. Xem đàn vật nuôi và lịch chăm sóc'),
('PERM_LIVESTOCK_MANAGE',    'LIVESTOCK', 'CREATE',  'LIVESTOCK',      '10. Lập kế hoạch nuôi (Technical) & Duyệt đàn vật nuôi (Farm Manager)'),
('PERM_LIVESTOCK_VET',       'LIVESTOCK', 'CREATE',  'VET_EVENT',      '11. Độc quyền khám bệnh & lên phác đồ điều trị thú y (Technical)'),
-- 12-16. INVENTORY
('PERM_INVENTORY_VIEW',      'INVENTORY', 'READ',    'INVENTORY',      '12. Xem và đối chiếu tồn kho FIFO/FEFO'),
('PERM_INVENTORY_RECEIPT',   'INVENTORY', 'CREATE',  'RECEIPT',        '13. Phiếu nhập kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_ISSUE',     'INVENTORY', 'CREATE',  'ISSUE',          '14. Phiếu xuất kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_TRANSFER',  'INVENTORY', 'CREATE',  'TRANSFER',       '15. Điều chuyển kho (Maker: Warehouse tạo / Checker: Farm Manager duyệt)'),
('PERM_INVENTORY_STOCKTAKE', 'INVENTORY', 'CREATE',  'STOCKTAKE',      '16. Kiểm kê kho (Maker: Warehouse nhập kiểm đếm / Checker: Farm Manager duyệt)'),
-- 17. HARVEST
('PERM_HARVEST_MANAGE',      'HARVEST',   'CREATE',  'HARVEST_RECORD', '17. Ghi sản lượng (Field), Tiếp nhận kho (Warehouse), Đánh giá giống (Tech), Duyệt (FM)'),
-- 18-21. QC
('PERM_QC_INSPECT',          'QC',        'CREATE',  'QC_INSPECTION',  '18. Maker: Lấy mẫu & lập biên bản kiểm định KCS (Độc quyền Technical)'),
('PERM_QC_APPROVE',          'QC',        'APPROVE', 'BATCH',          '19. Checker: Phê duyệt lô thành phẩm & sinh mã QR (Owner & Farm Manager)'),
('PERM_LABEL_PRINT',         'QC',        'EXPORT',  'LABEL',          '20. In tem nhãn nhiệt dán thùng (Độc quyền Warehouse)'),
('PERM_QC_RECALL',           'QC',        'APPROVE', 'RECALL',         '21. Ra lệnh thu hồi lô thành phẩm lỗi (Owner & Farm Manager)'),
-- 22. DELIVERY
('PERM_DELIVERY_MANAGE',     'DELIVERY',  'CREATE',  'DELIVERY',       '22. Xuất hàng lên xe (Warehouse) & Giám sát giao vận (Farm Manager)'),
-- 23-25. HR
('PERM_HR_EMPLOYEE_MANAGE',  'HR',        'CREATE',  'EMPLOYEE',       '23. Tuyển dụng nhân sự (Owner tuyển Cấp 3 / Farm Manager tuyển Cấp 4)'),
('PERM_HR_ATTENDANCE',       'HR',        'READ',    'ATTENDANCE',     '24. Chấm công GPS cá nhân, điểm danh ca, xem tổng hợp & duyệt công tháng'),
('PERM_TASK_ASSIGN',         'HR',        'CREATE',  'TASK',           '25. Giao việc kỹ thuật (Technical) & Giao việc/Nghiệm thu (Farm Manager)'),
-- 26-30. FINANCE
('PERM_FINANCE_EXPENSE',     'FINANCE',   'CREATE',  'EXPENSE',        '26. Chi phí vận hành (Maker: Accountant lập phiếu / Checker: Farm Manager duyệt)'),
('PERM_FINANCE_SALES_ORDER', 'FINANCE',   'CREATE',  'ORDER',          '27. Đơn hàng bán sỉ (Maker: Accountant lên đơn / Checker: Farm Manager duyệt)'),
('PERM_FINANCE_PAYMENT',     'FINANCE',   'CREATE',  'PAYMENT',        '28. Thanh toán thu/chi (Maker: Accountant lập phiếu / Checker: Farm Manager duyệt)'),
('PERM_PAYMENT_ALLOCATE',    'FINANCE',   'UPDATE',  'ALLOCATION',     '29. Phân bổ/Cấn trừ công nợ (Accountant) & Giám sát công nợ (Farm Manager)'),
('PERM_FINANCE_REPORT',      'FINANCE',   'READ',    'REPORT',         '30. Báo cáo tài chính & kết toán (Accountant lập, Farm Manager duyệt trại, Owner toàn công ty)')
ON DUPLICATE KEY UPDATE
    module = VALUES(module),
    description = VALUES(description);

-- 3. Làm sạch toàn bộ bảng ánh xạ role_permissions cũ để gán lại chính xác 100% theo Ma trận
DELETE FROM role_permissions;

-- 3.1. CẤP 1: ROLE_SUPER_ADMIN (Đúng 1 quyền: #1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_SUPER_ADMIN' AND p.code IN (
    'PERM_TENANT_MANAGE'
);

-- 3.2. CẤP 2: ROLE_FARM_OWNER (Đúng 11 quyền: #2, #3, #4, #5, #6, #9, #12, #19, #21, #23, #24, #30 -> 12 mã bao gồm Attendance xem tổng hợp)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_OWNER' AND p.code IN (
    'PERM_FARM_CREATE',         -- #2: Độc quyền tạo trang trại
    'PERM_FARM_VIEW',           -- #3: Xem đa trại
    'PERM_FARM_UPDATE',         -- #4: Cập nhật trại
    'PERM_ZONE_MANAGE',         -- #5: Tạo/Duyệt phân khu
    'PERM_CROP_VIEW',           -- #6: Xem tiến độ mùa vụ
    'PERM_LIVESTOCK_VIEW',      -- #9: Xem đàn vật nuôi
    'PERM_INVENTORY_VIEW',      -- #12: Xem tồn kho
    'PERM_QC_APPROVE',          -- #19: Duyệt lô thành phẩm
    'PERM_QC_RECALL',           -- #21: Ra lệnh thu hồi
    'PERM_HR_EMPLOYEE_MANAGE',  -- #23: Tuyển Cấp 3 (Farm Manager)
    'PERM_HR_ATTENDANCE',       -- #24: Xem tổng hợp chuyên cần (Không tự chấm công)
    'PERM_FINANCE_REPORT'       -- #30: Báo cáo tài chính toàn công ty
);

-- 3.3. CẤP 3: ROLE_FARM_MANAGER (Đúng 25 quyền: Toàn bộ trừ #1, #2, #11, #18, #20)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_MANAGER' AND p.code IN (
    'PERM_FARM_VIEW',           -- #3: Xem trại
    'PERM_FARM_UPDATE',         -- #4: Cấu hình trại
    'PERM_ZONE_MANAGE',         -- #5: Khu & Ô/Luống
    'PERM_CROP_VIEW',           -- #6: Giám sát mùa vụ
    'PERM_CROP_PLAN',           -- #7: Duyệt vụ mùa
    'PERM_CROP_LOG',            -- #8: Xem/Kiểm tra nhật ký
    'PERM_LIVESTOCK_VIEW',      -- #9: Giám sát đàn
    'PERM_LIVESTOCK_MANAGE',    -- #10: Duyệt đàn
    'PERM_INVENTORY_VIEW',      -- #12: Giám sát tồn kho
    'PERM_INVENTORY_RECEIPT',   -- #13: Checker: Xem/Duyệt phiếu nhập
    'PERM_INVENTORY_ISSUE',     -- #14: Checker: Xem/Duyệt phiếu xuất
    'PERM_INVENTORY_TRANSFER',  -- #15: Checker: Duyệt lệnh chuyển kho
    'PERM_INVENTORY_STOCKTAKE', -- #16: Checker: Duyệt kiểm kê
    'PERM_HARVEST_MANAGE',      -- #17: Giám sát/Duyệt thu hoạch
    'PERM_QC_APPROVE',          -- #19: Checker: Duyệt lô KCS
    'PERM_QC_RECALL',           -- #21: Ra lệnh thu hồi
    'PERM_DELIVERY_MANAGE',     -- #22: Giám sát giao hàng
    'PERM_HR_EMPLOYEE_MANAGE',  -- #23: Tuyển Cấp 4 cho trại
    'PERM_HR_ATTENDANCE',       -- #24: Tự chấm công & Duyệt công tháng
    'PERM_TASK_ASSIGN',         -- #25: Giao việc & Nghiệm thu
    'PERM_FINANCE_EXPENSE',     -- #26: Checker: Duyệt chi
    'PERM_FINANCE_SALES_ORDER', -- #27: Checker: Duyệt đơn bán
    'PERM_FINANCE_PAYMENT',     -- #28: Checker: Duyệt thanh toán
    'PERM_PAYMENT_ALLOCATE',    -- #29: Giám sát công nợ
    'PERM_FINANCE_REPORT'       -- #30: Báo cáo trại
);

-- 3.4. CẤP 4: ROLE_TECHNICAL_STAFF (Đúng 11 quyền: #3, #6, #7, #9, #10, #11, #12, #17, #18, #24, #25)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_TECHNICAL_STAFF' AND p.code IN (
    'PERM_FARM_VIEW',           -- #3: Xem thông tin trại
    'PERM_CROP_VIEW',           -- #6: Theo dõi mùa vụ
    'PERM_CROP_PLAN',           -- #7: Lên lịch/Phác đồ trồng trọt
    'PERM_LIVESTOCK_VIEW',      -- #9: Theo dõi đàn
    'PERM_LIVESTOCK_MANAGE',    -- #10: Kế hoạch nuôi
    'PERM_LIVESTOCK_VET',       -- #11: Khám & Phác đồ thú y
    'PERM_INVENTORY_VIEW',      -- #12: Xem vật tư trong kho
    'PERM_HARVEST_MANAGE',      -- #17: Xem đánh giá giống
    'PERM_QC_INSPECT',          -- #18: Maker: Lấy mẫu KCS (Cấm tự duyệt #19)
    'PERM_HR_ATTENDANCE',       -- #24: Tự chấm công & Điểm danh tổ
    'PERM_TASK_ASSIGN'          -- #25: Giao việc kỹ thuật
);

-- 3.5. CẤP 4: ROLE_WAREHOUSE_STAFF (Đúng 10 quyền: #3, #12, #13, #14, #15, #16, #17, #20, #22, #24)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_WAREHOUSE_STAFF' AND p.code IN (
    'PERM_FARM_VIEW',           -- #3: Xem thông tin trại
    'PERM_INVENTORY_VIEW',      -- #12: Quản lý tồn kho
    'PERM_INVENTORY_RECEIPT',   -- #13: Maker: Tạo phiếu nhập kho
    'PERM_INVENTORY_ISSUE',     -- #14: Maker: Tạo phiếu xuất kho
    'PERM_INVENTORY_TRANSFER',  -- #15: Maker: Tạo yêu cầu điều chuyển
    'PERM_INVENTORY_STOCKTAKE', -- #16: Maker: Nhập kiểm đếm kho
    'PERM_HARVEST_MANAGE',      -- #17: Tiếp nhận nông sản nhập kho
    'PERM_LABEL_PRINT',         -- #20: In tem dán thùng
    'PERM_DELIVERY_MANAGE',     -- #22: Xuất hàng lên xe
    'PERM_HR_ATTENDANCE'        -- #24: Tự chấm công & Điểm danh kho
);

-- 3.6. CẤP 4: ROLE_ACCOUNTANT (Đúng 8 quyền: #3, #12, #24, #26, #27, #28, #29, #30)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_ACCOUNTANT' AND p.code IN (
    'PERM_FARM_VIEW',           -- #3: Xem thông tin trại
    'PERM_INVENTORY_VIEW',      -- #12: Đối chiếu sổ tồn kho
    'PERM_HR_ATTENDANCE',       -- #24: Tự chấm công + Xem công chốt để tính lương
    'PERM_FINANCE_EXPENSE',     -- #26: Maker: Lập phiếu chi
    'PERM_FINANCE_SALES_ORDER', -- #27: Maker: Lên đơn bán sỉ
    'PERM_FINANCE_PAYMENT',     -- #28: Maker: Lập phiếu thanh toán
    'PERM_PAYMENT_ALLOCATE',    -- #29: Phân bổ/Cấn trừ công nợ
    'PERM_FINANCE_REPORT'       -- #30: Lập báo cáo tài chính trại
);

-- 3.7. CẤP 4: ROLE_FIELD_STAFF (Đúng 6 quyền: #3, #6, #8, #9, #17, #24)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FIELD_STAFF' AND p.code IN (
    'PERM_FARM_VIEW',           -- #3: Xem sơ đồ trại
    'PERM_CROP_VIEW',           -- #6: Xem lịch canh tác
    'PERM_CROP_LOG',            -- #8: Nhập nhật ký canh tác hàng ngày
    'PERM_LIVESTOCK_VIEW',      -- #9: Xem lịch chăm sóc vật nuôi
    'PERM_HARVEST_MANAGE',      -- #17: Ghi sản lượng thu hoạch thực tế
    'PERM_HR_ATTENDANCE'        -- #24: Xem công / Tự chấm công GPS
);

-- 4. Mở rộng CHECK constraint của bảng farm_assignments (#15) để hỗ trợ thêm vị trí ACCOUNTANT tại trại
ALTER TABLE farm_assignments DROP CHECK chk_farm_assignments_role;
ALTER TABLE farm_assignments ADD CONSTRAINT chk_farm_assignments_role
    CHECK (role_in_farm IN ('FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD', 'AGRONOMIST', 'VETERINARIAN', 'WAREHOUSE_KEEPER', 'ACCOUNTANT', 'FIELD_WORKER'));

-- 5. Đồng bộ lại dữ liệu Seed: Gán ROLE_ACCOUNTANT (user_id = 6) về đúng phạm vi Farm 1 (thay vì NULL cấp Tenant)
UPDATE user_roles ur
JOIN roles r ON ur.role_id = r.id
SET ur.farm_id = 1
WHERE r.code = 'ROLE_ACCOUNTANT' AND ur.tenant_id = 1 AND ur.farm_id IS NULL;

-- 6. Thêm tài khoản mẫu Giám đốc trang trại (Cấp 3 - ROLE_FARM_MANAGER) cho Farm 1 để test đủ 4 cấp
INSERT INTO users (id, tenant_id, is_super_admin, username, email, password_hash, full_name, phone, status, must_change_password)
VALUES (8, 1, FALSE, 'farm_manager', 'manager.dalat@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Đỗ Văn Giám Đốc Trại', '0978901234', 'ACTIVE', FALSE)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Gán user_id = 8 làm Giám đốc Farm 1 (thay cho Owner user_id = 2)
UPDATE farms SET manager_user_id = 8 WHERE id = 1;

INSERT INTO user_roles (tenant_id, user_id, role_id, farm_id)
SELECT 1, 8, r.id, 1 FROM roles r WHERE r.code = 'ROLE_FARM_MANAGER'
ON DUPLICATE KEY UPDATE farm_id = 1;

INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES (8, 1, 1);

-- 7. Đồng bộ bản ghi farm_assignments cho Farm Manager (user_id = 8) và Kế toán (user_id = 6)
INSERT INTO farm_assignments (tenant_id, farm_id, user_id, role_in_farm, assigned_from, is_active)
SELECT 1, 1, 8, 'FARM_MANAGER', CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM farm_assignments WHERE tenant_id = 1 AND farm_id = 1 AND user_id = 8 AND is_active = TRUE);

INSERT INTO farm_assignments (tenant_id, farm_id, user_id, role_in_farm, assigned_from, is_active)
SELECT 1, 1, 6, 'ACCOUNTANT', CURRENT_DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM farm_assignments WHERE tenant_id = 1 AND farm_id = 1 AND user_id = 6 AND is_active = TRUE);
