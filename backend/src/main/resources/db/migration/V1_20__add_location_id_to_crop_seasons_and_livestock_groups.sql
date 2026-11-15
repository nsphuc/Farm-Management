-- V1_20: Add location_id to crop_seasons and livestock_groups for precise lot/pen tracking
ALTER TABLE crop_seasons ADD COLUMN location_id BIGINT NULL AFTER zone_id;
ALTER TABLE livestock_groups ADD COLUMN location_id BIGINT NULL AFTER zone_id;

CREATE INDEX idx_crop_seasons_location ON crop_seasons(location_id);
CREATE INDEX idx_livestock_groups_location ON livestock_groups(location_id);

-- Cập nhật liên kết lô đất thực tế cho các vụ mùa hiện có
UPDATE crop_seasons SET location_id = 1 WHERE farm_id = 3 AND season_code = 'SSN-001';
UPDATE crop_seasons SET location_id = 3 WHERE farm_id = 3 AND season_code = 'SSN-002';
UPDATE crop_seasons SET location_id = 5 WHERE farm_id = 3 AND season_code = 'SSN-003';

-- Cập nhật liên kết ô chuồng thực tế cho các đàn vật nuôi hiện có
UPDATE livestock_groups SET location_id = 7 WHERE farm_id = 3 AND group_code = 'GRP-001';
UPDATE livestock_groups SET location_id = 9 WHERE farm_id = 3 AND group_code = 'GRP-002';

