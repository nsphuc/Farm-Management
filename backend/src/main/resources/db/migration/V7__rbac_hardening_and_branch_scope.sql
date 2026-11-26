-- V7: Chuẩn hóa phân quyền RBAC (4 vai trò nhân viên) & Phạm vi Chi nhánh (Branch Scope)

-- 1. Bổ sung cột branch_id vào bảng farm_members (NULL = Toàn chuỗi cho Chủ trại, giá trị cụ thể = Khóa 1 chi nhánh cho nhân viên)
ALTER TABLE farm_members
    ADD COLUMN branch_id BIGINT NULL AFTER role_id,
    ADD KEY idx_farm_members_branch (branch_id),
    ADD CONSTRAINT fk_farm_members_branch FOREIGN KEY (branch_id) REFERENCES farm_branches (id) ON DELETE SET NULL;

-- Gán Chi nhánh 1 (id = 1) cho toàn bộ nhân viên không phải Chủ trại (ROLE_FARM_OWNER)
UPDATE farm_members fm
JOIN roles r ON fm.role_id = r.id
SET fm.branch_id = 1
WHERE r.code <> 'ROLE_FARM_OWNER'
  AND EXISTS (SELECT 1 FROM farm_branches fb WHERE fb.id = 1);

-- Đảm bảo Chủ trại có branch_id = NULL (xem toàn bộ 2 chi nhánh)
UPDATE farm_members fm
JOIN roles r ON fm.role_id = r.id
SET fm.branch_id = NULL
WHERE r.code = 'ROLE_FARM_OWNER';

-- 2. Thu hẹp quyền ROLE_FARM_MANAGER: gỡ 10 quyền tài chính / quản trị chủ trại
--    (Giữ lại purchase_invoices.view/manage & sales.view/manage ở chế độ kiểm đếm SL / cân xe, ẩn giá tiền)
DELETE rp FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'ROLE_FARM_MANAGER'
  AND p.code IN (
    'cashbook.view',
    'cashbook.manage',
    'financial.price.view',
    'general_settings.view',
    'general_settings.manage',
    'branches.view',
    'branches.manage',
    'payroll.view',
    'payroll.manage',
    'roles.view'
  );

-- 3. Gỡ inventory.view khỏi ROLE_BARN_WORKER để đồng bộ Sidebar & chặn API kho
DELETE rp FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'ROLE_BARN_WORKER'
  AND p.code = 'inventory.view';

-- 4. Bổ sung workforce.salary.view cho ROLE_ACCOUNTANT để xem cột lương/tạm ứng
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'workforce.salary.view'
WHERE r.code = 'ROLE_ACCOUNTANT';

-- 5. Đảm bảo 5 danh mục cost_categories chuẩn tồn tại cho tenant 1
INSERT IGNORE INTO cost_categories (id, tenant_id, farm_id, name, code, cost_type, description)
VALUES
  (1, 1, 1, 'Vật tư & Thức ăn chăn nuôi', 'MATERIALS', 'MATERIALS', 'Chi phí nhập cám, con giống, thuốc thú y và vật tư'),
  (2, 1, 1, 'Chi phí vận hành chung', 'OPERATING', 'INDIRECT_OVERHEAD', 'Điện, nước, sửa chữa và chi phí vận hành chung'),
  (3, 1, 1, 'Nhiên liệu & Máy móc', 'FUEL', 'MACHINERY_FUEL', 'Xăng dầu, máy phát điện, thiết bị chuồng trại'),
  (4, 1, 1, 'Khấu hao tài sản', 'DEPRECIATION', 'DEPRECIATION', 'Khấu hao chuồng trại và trang thiết bị'),
  (5, 1, 1, 'Nhân công & Lương', 'LABOR', 'DIRECT_LABOR', 'Lương cứng, tạm ứng lương, thưởng KPI và công khoán');
