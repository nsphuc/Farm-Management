-- ==============================================================================
-- FARM SAAS PLATFORM - DATABASE MIGRATION V1.1
-- Migration File: V1_1__init_system_core.sql
-- Database Engine: MySQL 8.x (InnoDB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Target:
--   A. Module Notifications (Phase 1 MVP Scope - DEC-04)
--   B. RBAC Patch (DEC-01, DEC-02, DEC-03)
-- ==============================================================================

-- ==============================================================================
-- PHẦN A: MODULE NOTIFICATIONS (PHASE 1 MVP SCOPE)
-- ==============================================================================
-- Thiết kế bảng notifications hỗ trợ thông báo đa cấp (Platform / Tenant / Farm / User)
-- Liên kết khóa ngoại tới bảng users và tenants, quản lý trạng thái đọc và đường dẫn thao tác (action_url).

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NULL,                                 -- NULL nếu thông báo cấp hệ thống toàn nền tảng, có giá trị nếu theo tenant
    user_id BIGINT NOT NULL,                                -- Người dùng nhận thông báo
    title VARCHAR(255) NOT NULL,                           -- Tiêu đề ngắn gọn của thông báo
    message TEXT NOT NULL,                                 -- Nội dung chi tiết thông báo
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',              -- INFO, WARNING, ALERT, TASK, QC, SYSTEM
    is_read BOOLEAN NOT NULL DEFAULT FALSE,                -- Trạng thái đã đọc (TRUE/FALSE)
    read_at TIMESTAMP NULL,                                -- Thời điểm người dùng đánh dấu đã đọc
    reference_type VARCHAR(50) NULL,                       -- Loại đối tượng liên kết: CROP_SEASON, HARVEST, QC_INSPECTION, TASK, INVENTORY, DELIVERY, ORDER, SYSTEM
    reference_id BIGINT NULL,                              -- ID đối tượng liên kết
    action_url VARCHAR(500) NULL,                          -- Đường dẫn chuyển hướng khi click thông báo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN ('INFO', 'WARNING', 'ALERT', 'TASK', 'QC', 'SYSTEM')),
    INDEX idx_notifications_user_read (user_id, is_read, created_at),
    INDEX idx_notifications_tenant (tenant_id),
    INDEX idx_notifications_reference (reference_type, reference_id),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- PHẦN B: CẬP NHẬT PHÂN QUYỀN (RBAC PATCH)
-- ==============================================================================

-- 1. DEC-01 (D-01): Gán quyền PERM_TENANT_MANAGE cho ROLE_SUPER_ADMIN
-- ROLE_SUPER_ADMIN quản trị nền tảng SaaS, phân quyền chính thức qua RBAC
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'PERM_TENANT_MANAGE'
WHERE r.code = 'ROLE_SUPER_ADMIN';

-- 2. DEC-02 (D-03): Gỡ PERM_QC_APPROVE và PERM_QC_RECALL khỏi ROLE_TECHNICAL_STAFF
-- Áp dụng nguyên tắc Maker-Checker: Kỹ thuật viên chỉ kiểm định (Maker), không tự phê duyệt hoặc thu hồi
DELETE rp FROM role_permissions rp
INNER JOIN roles r ON rp.role_id = r.id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'ROLE_TECHNICAL_STAFF'
  AND p.code IN ('PERM_QC_APPROVE', 'PERM_QC_RECALL');

-- 3. DEC-02 (D-03): Đảm bảo gán PERM_QC_APPROVE và PERM_QC_RECALL cho ROLE_FARM_OWNER
-- Áp dụng nguyên tắc Maker-Checker: Chủ trang trại / Giám đốc HTX là người phê duyệt QC và thu hồi lô (Checker)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN ('PERM_QC_APPROVE', 'PERM_QC_RECALL')
WHERE r.code = 'ROLE_FARM_OWNER';

-- 4. DEC-03: Gỡ PERM_HR_ATTENDANCE khỏi ROLE_WAREHOUSE_STAFF và ROLE_ACCOUNTANT
-- Dữ liệu chấm công GPS/ảnh check-in là dữ liệu nhân sự nhạy cảm, chỉ nhân sự và cấp quản lý được ủy quyền mới xem
DELETE rp FROM role_permissions rp
INNER JOIN roles r ON rp.role_id = r.id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('ROLE_WAREHOUSE_STAFF', 'ROLE_ACCOUNTANT')
  AND p.code = 'PERM_HR_ATTENDANCE';
