-- ======================================================================================
-- V1_6: Link livestock groups to warehouse issues for livestock feed/medicine expense tracking
-- ======================================================================================

ALTER TABLE warehouse_issues
ADD COLUMN livestock_group_id BIGINT NULL AFTER season_id,
ADD CONSTRAINT fk_warehouse_issues_livestock_group_composite FOREIGN KEY (tenant_id, farm_id, livestock_group_id) REFERENCES livestock_groups(tenant_id, farm_id, id) ON DELETE RESTRICT,
ADD INDEX idx_warehouse_issues_livestock_group (livestock_group_id);
