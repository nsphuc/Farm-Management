-- V1_18: Bổ sung crop_category cho crop_types, seed_unit & estimated_yield_unit cho crop_seasons, crop_type_id cho materials
UPDATE crop_types SET crop_category = 'PERENNIAL' WHERE variety_code IN ('VAR-004', 'VAR-005') OR name LIKE '%Sầu Riêng%' OR name LIKE '%Bưởi%';
