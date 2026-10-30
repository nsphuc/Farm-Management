-- V1_10: Thêm liên kết warehouse_id vào bảng zone_locations (Kệ trực thuộc Kho bãi)
ALTER TABLE zone_locations 
ADD COLUMN warehouse_id BIGINT NULL AFTER zone_id;

-- Ràng buộc khóa ngoại tham chiếu đến warehouses
ALTER TABLE zone_locations 
ADD CONSTRAINT fk_zone_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;

-- Đánh chỉ mục tìm kiếm theo warehouse_id
ALTER TABLE zone_locations 
ADD INDEX idx_zone_locations_warehouse (warehouse_id);

-- Cập nhật dữ liệu mẫu cho Farm 1: Gán các vị trí kệ hiện có vào đúng kho bãi
-- KE-01 (Dãy Kệ K01 - Kho Phân Bón) -> Kho 1 (Kho Vật Tư Nông Nghiệp & Phân Bón)
UPDATE zone_locations 
SET warehouse_id = 1 
WHERE farm_id = 1 AND code = 'KE-01';

-- KE-02 (Dãy Kệ K02 - Kho Thùng & Tem QR) -> Kho 2 (Kho Thành Phẩm Nông Sản Đóng Gói)
UPDATE zone_locations 
SET warehouse_id = 2 
WHERE farm_id = 1 AND code = 'KE-02';

-- BAN-01 (Khu Vực Bàn Sơ Chế & Đóng Gói) -> Kho 2 (Kho Thành Phẩm Nông Sản Đóng Gói)
UPDATE zone_locations 
SET warehouse_id = 2 
WHERE farm_id = 1 AND code = 'BAN-01';

