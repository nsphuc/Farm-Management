-- ======================================================================================
-- V1_5: Migrate legacy AQUACULTURE, POND and AQUA to standard production types
-- Standard 3 Farm Types: 'CROP', 'LIVESTOCK', 'MIXED'
-- Standard 5 Zone Types: 'GREENHOUSE', 'OPEN_FIELD', 'BARN', 'STORAGE', 'ISOLATION'
-- Standard 5 Livestock Species: 'CATTLE', 'SWINE', 'POULTRY', 'GOAT', 'SHEEP'
-- ======================================================================================

-- 1. Migrate legacy data
UPDATE farms 
SET farm_type = 'MIXED' 
WHERE farm_type = 'AQUACULTURE';

UPDATE production_zones 
SET zone_type = 'OPEN_FIELD' 
WHERE zone_type = 'POND';

UPDATE livestock_breeds 
SET species = 'POULTRY' 
WHERE species = 'AQUA';

-- 2. Update CHECK constraints for 3 standardized domains
ALTER TABLE farms DROP CHECK chk_farms_type;
ALTER TABLE farms ADD CONSTRAINT chk_farms_type CHECK (farm_type IN ('CROP', 'LIVESTOCK', 'MIXED'));

ALTER TABLE production_zones DROP CHECK chk_production_zones_type;
ALTER TABLE production_zones ADD CONSTRAINT chk_production_zones_type CHECK (zone_type IN ('GREENHOUSE', 'OPEN_FIELD', 'BARN', 'STORAGE', 'ISOLATION'));

ALTER TABLE livestock_breeds DROP CHECK chk_livestock_breeds_species;
ALTER TABLE livestock_breeds ADD CONSTRAINT chk_livestock_breeds_species CHECK (species IN ('CATTLE', 'SWINE', 'POULTRY', 'GOAT', 'SHEEP'));
