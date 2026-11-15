SET NAMES utf8mb4;

-- 1. Cập nhật tên danh mục giống chuẩn
UPDATE cost_categories SET name = 'Chi phí Cây giống & Con giống vật nuôi' WHERE id = 2;

-- 2. Thêm danh mục chi phí thẻ tai nếu chưa có
INSERT INTO cost_categories (tenant_id, farm_id, code, name, cost_type, description)
SELECT 1, 3, 'TAG_COST', 'Chi phí Thẻ tai RFID & Vật tư định danh', 'MATERIALS', 'Chi phí thẻ tai điện tử thông minh và vật tư bấm tai định danh gia súc'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM cost_categories WHERE code = 'TAG_COST' AND tenant_id = 1);

-- 3. Cập nhật chuẩn xác khoản mục chi phí cho các chứng từ chi phí thực tế
UPDATE farm_expenses SET cost_category_id = 2 WHERE id IN (1, 2);
UPDATE farm_expenses SET cost_category_id = (SELECT id FROM cost_categories WHERE code = 'TAG_COST' AND tenant_id = 1 LIMIT 1) WHERE id = 3;

