-- V1_3: Đồng bộ vai trò ROLE_FARM_MANAGER cho các tài khoản đang phụ trách Giám đốc trang trại
-- 1. Cập nhật các user đang giữ vai trò FARM_MANAGER trong farm_assignments
UPDATE user_roles ur
JOIN farm_assignments fa ON ur.user_id = fa.user_id
JOIN roles r_fm ON r_fm.code = 'ROLE_FARM_MANAGER'
JOIN roles r_curr ON ur.role_id = r_curr.id
SET ur.role_id = r_fm.id
WHERE fa.role_in_farm = 'FARM_MANAGER'
  AND fa.is_active = TRUE
  AND r_curr.code = 'ROLE_TECHNICAL_STAFF';

-- 2. Đồng bộ các user là manager_user_id trong bảng farms
UPDATE user_roles ur
JOIN farms f ON ur.user_id = f.manager_user_id
JOIN roles r_fm ON r_fm.code = 'ROLE_FARM_MANAGER'
JOIN roles r_curr ON ur.role_id = r_curr.id
SET ur.role_id = r_fm.id
WHERE r_curr.code = 'ROLE_TECHNICAL_STAFF';
