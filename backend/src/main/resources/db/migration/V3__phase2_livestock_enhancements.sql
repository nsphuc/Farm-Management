-- ==============================================================================
-- FARMGO SAAS PLATFORM - PHASE 2 LIVESTOCK ENHANCEMENTS (V3.0)
-- Migration File: V3__phase2_livestock_enhancements.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Mở rộng enum/check constraint cho livestock_events để hỗ trợ FEED, MORTALITY, CULLING, ENVIRONMENT, SAMPLE_ENV, DAILY_LOG
ALTER TABLE `livestock_events` DROP CHECK `chk_livestock_events_type`;
ALTER TABLE `livestock_events` ADD CONSTRAINT `chk_livestock_events_type` 
    CHECK (`event_type` IN ('VACCINATION','WEIGHT_CHECK','BREEDING','BIRTH','MEDICAL_TREATMENT','TRANSFER','SLAUGHTER','FEED','MORTALITY','CULLING','ENVIRONMENT','SAMPLE_ENV','DAILY_LOG'));

-- 2. Cho phép consumption_quotas lưu mốc ngày tuổi, thức ăn chuẩn và lịch vắc-xin chi tiết
ALTER TABLE `consumption_quotas`
    ADD COLUMN `day_age_from` INT DEFAULT 1,
    ADD COLUMN `day_age_to` INT DEFAULT 1,
    ADD COLUMN `standard_weight_kg` DECIMAL(8,3) DEFAULT NULL,
    ADD COLUMN `feed_amount_g` DECIMAL(8,2) DEFAULT NULL,
    ADD COLUMN `feed_type` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN `vaccine_name` VARCHAR(255) DEFAULT NULL,
    ADD COLUMN `dose` VARCHAR(100) DEFAULT NULL,
    ADD COLUMN `route` VARCHAR(100) DEFAULT NULL,
    ADD COLUMN `quota_type` VARCHAR(50) DEFAULT 'FEED',
    ADD COLUMN `notes` VARCHAR(500) DEFAULT NULL,
    MODIFY COLUMN `material_id` BIGINT DEFAULT NULL;

-- Cho phép standard_quantity = 0 hoặc linh hoạt cho vắc-xin
ALTER TABLE `consumption_quotas` DROP CHECK `chk_consumption_quotas_qty`;
ALTER TABLE `consumption_quotas` ADD CONSTRAINT `chk_consumption_quotas_qty` CHECK (`standard_quantity` >= 0.00);

-- 3. Bổ sung cấu hình KPI và Chỉ số môi trường trong farm_data_rules
ALTER TABLE `farm_data_rules`
    ADD COLUMN `kpi_targets_json` JSON DEFAULT NULL,
    ADD COLUMN `env_metrics_json` JSON DEFAULT NULL;

-- 4. Bổ sung thông tin mô tả, FCR, ADG cho giống nuôi / chương trình nuôi trong livestock_breeds
ALTER TABLE `livestock_breeds`
    ADD COLUMN `fcr_target` DECIMAL(5,2) DEFAULT 1.65,
    ADD COLUMN `adg_target` DECIMAL(8,2) DEFAULT 60.00,
    ADD COLUMN `description` TEXT DEFAULT NULL;

-- 5. Seed dữ liệu mẫu cho Chương trình nuôi, mốc ngày tuổi, vắc-xin và ngưỡng môi trường cho Farm 1
UPDATE `livestock_breeds`
SET `fcr_target` = 2.40, `adg_target` = 780.00, `description` = 'Quy trình heo thịt 120 ngày từ cai sữa đến xuất chuồng đạt 115kg nạc cao.'
WHERE `id` = 1;

UPDATE `livestock_breeds`
SET `fcr_target` = 1.65, `adg_target` = 62.00, `description` = 'Quy trình nuôi công nghiệp chuồng lạnh khép kín, kiểm soát tối ưu nhiệt độ, ẩm độ và dinh dưỡng tăng trọng nhanh.'
WHERE `id` = 2;

-- Thêm chương trình Vịt siêu thịt
INSERT INTO `livestock_breeds` (`id`, `tenant_id`, `species`, `breed_name`, `standard_growth_days`, `target_weight_kg`, `management_type`, `fcr_target`, `adg_target`, `description`)
VALUES (3, 1, 'POULTRY', 'Vịt siêu thịt Cherry Valley (48 ngày)', 48, 3.40, 'GROUP', 2.15, 70.00, 'Quy trình nuôi vịt thịt cao sản chuồng sàn lạnh khép kín, thịt chắc nạc, lớn nhanh.')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Cập nhật mốc định mức cám cho Giống 2 (Gà Ross 308)
INSERT INTO `consumption_quotas` (`tenant_id`, `farm_id`, `livestock_breed_id`, `material_id`, `standard_quantity`, `unit_of_measure`, `stage`, `day_age_from`, `day_age_to`, `standard_weight_kg`, `feed_amount_g`, `feed_type`, `quota_type`)
VALUES
    (1, 1, 2, 3, 0.015, 'g/con', 'Úm', 1, 3, 0.045, 15.00, 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.035, 'g/con', 'Úm', 4, 7, 0.180, 35.00, 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.065, 'g/con', 'Úm', 8, 14, 0.450, 65.00, 'Cám Gà Con Giai Đoạn 1 (0-14 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.105, 'g/con', 'Tăng trưởng', 15, 21, 0.920, 105.00, 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.145, 'g/con', 'Tăng trưởng', 22, 28, 1.520, 145.00, 'Cám Gà Thịt Giai Đoạn 2 (15-28 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.180, 'g/con', 'Vỗ béo', 29, 35, 2.150, 180.00, 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.205, 'g/con', 'Vỗ béo', 36, 42, 2.650, 205.00, 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', 'FEED'),
    (1, 1, 2, 3, 0.215, 'g/con', 'Vỗ béo', 43, 45, 2.800, 215.00, 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', 'FEED')
ON DUPLICATE KEY UPDATE `feed_amount_g` = VALUES(`feed_amount_g`);

-- Cập nhật lịch vắc-xin cho Giống 2 (Gà Ross 308)
INSERT INTO `consumption_quotas` (`tenant_id`, `farm_id`, `livestock_breed_id`, `material_id`, `standard_quantity`, `unit_of_measure`, `stage`, `day_age_from`, `day_age_to`, `vaccine_name`, `dose`, `route`, `notes`, `quota_type`)
VALUES
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 1, 1, 'Vắc-xin Marek (Đông khô)', '1 liều/con (0.2ml)', 'Tiêm dưới da cổ', 'Tiêm phòng tại lò ấp ngay khi nở, sát trùng kim tiêm', 'VACCINE'),
    (1, 1, 2, 5, 1.00, 'liều/con', 'Úm', 4, 4, 'ND - IB lần 1 (Clon 30 + H120)', '1 liều/con', 'Nhỏ mắt / Nhỏ mũi', 'Mỗi con 1 giọt vào mắt hoặc mũi, chờ nhấp nháy mắt mới thả', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 10, 10, 'Gumboro lần 1 (Chủng D78)', '1 liều/con', 'Pha nước uống', 'Cắt nước 1.5 - 2h trước khi uống, pha cùng sữa gầy bảo vệ', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 14, 14, 'Đậu gà (Fowl Pox Vaccine)', '1 liều/con', 'Châm cánh', 'Dùng kim đôi châm xuyên màng cánh, tránh chạm mạch máu', 'VACCINE'),
    (1, 1, 2, 5, 1.00, 'liều/con', 'Tăng trưởng', 21, 21, 'ND - IB lần 2 (Lasota tái chủng)', '1 liều/con', 'Pha nước uống', 'Cho uống trong vòng 2 giờ, tránh ánh nắng trực tiếp', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Tăng trưởng', 28, 28, 'Gumboro lần 2', '1 liều/con', 'Pha nước uống', 'Tái chủng nhắc lại để củng cố miễn dịch bảo hộ đàn', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Vỗ béo', 35, 35, 'Cúm gia cầm H5N1 / H5N6', '0.5 ml/con', 'Tiêm bắp ức', 'Tiêm bắp ức hoặc dưới da gáy, ngừng thuốc trước xuất chuồng 14 ngày', 'VACCINE')
ON DUPLICATE KEY UPDATE `vaccine_name` = VALUES(`vaccine_name`);

-- Khởi tạo mặc định KPI và Chỉ số môi trường cho Farm 1
UPDATE `farm_data_rules`
SET `kpi_targets_json` = '{"targetFcr": 1.65, "maxMortalityRate": 3.5, "cullingReasons": ["Tiêu chảy / E.coli", "Viêm phổi / Khẹc thở", "Bại liệt / Chấn thương", "Còi cọc không lớn", "Chết nóng / Ngạt khí", "Khác"]}',
    `env_metrics_json` = '[{"id": "ENV_TEMP", "name": "Nhiệt độ chuồng", "code": "TEMP", "unit": "°C", "minVal": 24.0, "maxVal": 32.5, "frequency": "3 lần / ngày (Sáng, Trưa, Tối)", "description": "Nhiệt độ môi trường bên trong chuồng nuôi, ảnh hưởng trực tiếp đến sức ăn và hô hấp."}, {"id": "ENV_HUMID", "name": "Độ ẩm không khí", "code": "HUMID", "unit": "%", "minVal": 55.0, "maxVal": 75.0, "frequency": "2 lần / ngày", "description": "Độ ẩm tương đối trong chuồng, độ ẩm cao kết hợp nhiệt độ cao gây stress nhiệt."}, {"id": "ENV_NH3", "name": "Nồng độ khí NH3", "code": "NH3", "unit": "ppm", "minVal": 0.0, "maxVal": 20.0, "frequency": "1 lần / ngày", "description": "Khí độc sinh ra từ chất thải và đệm lót sinh học, nồng độ vượt 20ppm gây viêm kết mạc và suy hô hấp."}, {"id": "ENV_CO2", "name": "Nồng độ khí CO2", "code": "CO2", "unit": "ppm", "minVal": 0.0, "maxVal": 1500.0, "frequency": "1 lần / ngày", "description": "Đo hiệu quả lưu thông thông gió trong chuồng trại khép kín."}]'
WHERE `farm_id` = 1;

SET FOREIGN_KEY_CHECKS = 1;
