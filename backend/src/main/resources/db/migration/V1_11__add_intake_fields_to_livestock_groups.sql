-- Migration V1_11: Add purchase & intake fields to livestock_groups and seed categories for seeds

-- Safely add columns if they do not exist
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'livestock_groups' AND COLUMN_NAME = 'partner_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE livestock_groups ADD COLUMN partner_id BIGINT NULL AFTER breed_id, ADD COLUMN unit_price DECIMAL(14, 2) NULL AFTER initial_quantity, ADD COLUMN total_cost DECIMAL(14, 2) NULL AFTER unit_price, ADD COLUMN avg_initial_weight_kg DECIMAL(8, 2) NULL AFTER total_cost, ADD COLUMN health_certificate VARCHAR(100) NULL AFTER avg_initial_weight_kg, ADD COLUMN origin VARCHAR(255) NULL AFTER health_certificate, ADD COLUMN notes TEXT NULL AFTER origin', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure category for SEEDS exists for tenant 1
INSERT INTO material_categories (tenant_id, name, code, description, created_at)
SELECT 1, 'Hạt Giống & Cây Giống', 'CAT-SEEDS', 'Các loại hạt giống đóng gói và khay cây giống ươm sẵn', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM material_categories WHERE code = 'CAT-SEEDS'
);

-- Ensure sample seed materials exist
INSERT INTO materials (tenant_id, category_id, sku_code, name, standard_unit, dispatch_strategy, expiry_alert_days, min_stock_level, max_stock_level, unit_price_standard, status, created_at)
SELECT 1, id, 'MAT-SEED-TOMATO', 'Hạt Giống Cà Chua Beef Hà Lan (Gói 1000 hạt)', 'Gói', 'FIFO', 30, 5.00, 200.00, 150000.00, 'ACTIVE', NOW()
FROM material_categories WHERE code = 'CAT-SEEDS'
AND NOT EXISTS (SELECT 1 FROM materials WHERE sku_code = 'MAT-SEED-TOMATO');

INSERT INTO materials (tenant_id, category_id, sku_code, name, standard_unit, dispatch_strategy, expiry_alert_days, min_stock_level, max_stock_level, unit_price_standard, status, created_at)
SELECT 1, id, 'MAT-SEED-MELON', 'Hạt Giống Dưa Lưới Huỳnh Long F1 (Gói 500 hạt)', 'Gói', 'FIFO', 30, 5.00, 200.00, 220000.00, 'ACTIVE', NOW()
FROM material_categories WHERE code = 'CAT-SEEDS'
AND NOT EXISTS (SELECT 1 FROM materials WHERE sku_code = 'MAT-SEED-MELON');

INSERT INTO materials (tenant_id, category_id, sku_code, name, standard_unit, dispatch_strategy, expiry_alert_days, min_stock_level, max_stock_level, unit_price_standard, status, created_at)
SELECT 1, id, 'MAT-SEEDLING-MELON', 'Khay Cây Giống Dưa Lưới Ươm Sẵn (Khay 84 cây)', 'Khay', 'FIFO', 7, 10.00, 500.00, 85000.00, 'ACTIVE', NOW()
FROM material_categories WHERE code = 'CAT-SEEDS'
AND NOT EXISTS (SELECT 1 FROM materials WHERE sku_code = 'MAT-SEEDLING-MELON');

-- Ensure cost category for Con Giống exists
INSERT INTO cost_categories (tenant_id, name, code, cost_type, created_at)
SELECT 1, 'Chi phí Mua Con giống', 'BREED_COST', 'MATERIALS', NOW()
WHERE NOT EXISTS (SELECT 1 FROM cost_categories WHERE code = 'BREED_COST');

-- Ensure sample Supplier for Con Giống exists
INSERT INTO partners (tenant_id, code, name, partner_type, contact_person, phone, email, address, created_at)
SELECT 1, 'SUP-BREED-01', 'Trại Giống Gia Súc Gia Cầm Quốc Gia CP', 'SUPPLIER', 'Nguyễn Văn Giống', '0912345678', 'giong@cp.com.vn', 'Đồng Nai', NOW()
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE code = 'SUP-BREED-01');

INSERT INTO partners (tenant_id, code, name, partner_type, contact_person, phone, email, address, created_at)
SELECT 1, 'SUP-SEED-01', 'Công Ty Giống Cây Trồng Miền Nam', 'SUPPLIER', 'Trần Thị Mầm', '0988776655', 'giong@namseed.vn', 'TP. Hồ Chí Minh', NOW()
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE code = 'SUP-SEED-01');
