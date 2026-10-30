-- V1_9: Thêm liên kết zone_id (Phân khu mặt bằng) vào bảng warehouses
ALTER TABLE warehouses 
ADD COLUMN zone_id BIGINT NULL AFTER farm_id;

-- Khóa ngoại tham chiếu đến production_zones
ALTER TABLE warehouses 
ADD CONSTRAINT fk_warehouses_zone FOREIGN KEY (zone_id) REFERENCES production_zones(id) ON DELETE SET NULL;

-- Đánh chỉ mục tìm kiếm theo zone_id
ALTER TABLE warehouses 
ADD INDEX idx_warehouses_zone (zone_id);

-- Cập nhật liên kết cho các kho bãi hiện có của Farm 1 vào Phân khu Nhà Kho & Sơ Chế C1 (zone_id = 3)
UPDATE warehouses 
SET zone_id = 3 
WHERE farm_id = 1 AND zone_id IS NULL;

