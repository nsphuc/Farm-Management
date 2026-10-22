-- Add farm_id to partners table to tie partners to specific farms (Idempotent)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'partners' 
      AND COLUMN_NAME = 'farm_id'
);

SET @stmt = IF(
    @col_exists = 0,
    'ALTER TABLE partners ADD COLUMN farm_id BIGINT NULL AFTER tenant_id, ADD CONSTRAINT fk_partners_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE RESTRICT, ADD INDEX idx_partners_tenant_farm (tenant_id, farm_id)',
    'SELECT 1'
);

PREPARE ddl_stmt FROM @stmt;
EXECUTE ddl_stmt;
DEALLOCATE PREPARE ddl_stmt;
