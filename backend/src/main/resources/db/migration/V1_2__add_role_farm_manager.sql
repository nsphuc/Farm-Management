-- 1. Tạo/Cập nhật Role ROLE_FARM_MANAGER cấp FARM
INSERT INTO roles (code, name, scope_level, description)
VALUES ('ROLE_FARM_MANAGER', 'Giám đốc / Quản lý trang trại', 'FARM', 'Điều hành nhân sự, kế hoạch mùa vụ, duyệt KCS và giám sát kho/tài chính tại trang trại phụ trách')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), 
    scope_level = VALUES(scope_level), 
    description = VALUES(description);
-- 2. Chỉ gán ĐÚNG 13 quyền chuẩn theo thiết kế của Giám đốc trang trại (Role 2)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ROLE_FARM_MANAGER' AND p.code IN (
    -- Mặt bằng & Phân khu (WS-A)
    'PERM_FARM_VIEW', 'PERM_FARM_UPDATE', 'PERM_ZONE_MANAGE',
    -- Nhân sự, Chấm công & Giao việc (WS-B & WS-G)
    'PERM_HR_EMPLOYEE_MANAGE', 'PERM_HR_ATTENDANCE', 'PERM_TASK_ASSIGN',
    -- Kho bãi: CHỈ XEM, không thao tác nhập/xuất (WS-C)
    'PERM_INVENTORY_VIEW',
    -- Mùa vụ & Đàn nuôi: Lập kế hoạch & Theo dõi (WS-E)
    'PERM_CROP_VIEW', 'PERM_CROP_PLAN', 'PERM_LIVESTOCK_VIEW', 'PERM_LIVESTOCK_MANAGE',
    -- Chất lượng KCS: Phê duyệt lô & Thu hồi (WS-F)
    'PERM_QC_APPROVE', 'PERM_QC_RECALL',
    -- Tài chính: Giám sát báo cáo & Duyệt kết toán (WS-H1 & WS-H2)
    'PERM_FINANCE_REPORT'
);