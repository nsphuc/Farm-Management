-- Thêm cột area_m2 và capacity cho bảng zone_locations (Idempotent)
SET @col_exists_area = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'zone_locations' 
      AND COLUMN_NAME = 'area_m2'
);

SET @stmt_area = IF(
    @col_exists_area = 0,
    'ALTER TABLE zone_locations ADD COLUMN area_m2 DECIMAL(12, 2) NULL DEFAULT NULL AFTER status',
    'SELECT 1'
);

PREPARE ddl_stmt_area FROM @stmt_area;
EXECUTE ddl_stmt_area;
DEALLOCATE PREPARE ddl_stmt_area;

SET @col_exists_cap = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'zone_locations' 
      AND COLUMN_NAME = 'capacity'
);

SET @stmt_cap = IF(
    @col_exists_cap = 0,
    'ALTER TABLE zone_locations ADD COLUMN capacity INT NULL DEFAULT NULL AFTER area_m2',
    'SELECT 1'
);

PREPARE ddl_stmt_cap FROM @stmt_cap;
EXECUTE ddl_stmt_cap;
DEALLOCATE PREPARE ddl_stmt_cap;

