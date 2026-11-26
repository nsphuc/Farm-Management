-- Fix UTF-8 encoding for Phase 2 data
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Cập nhật livestock_breeds
UPDATE `livestock_breeds`
SET `breed_name` = 'Heo thịt 3 máu ngoại Duroc x (Landrace x Yorkshire)',
    `fcr_target` = 2.40,
    `adg_target` = 780.00,
    `description` = 'Quy trình heo thịt 120 ngày từ cai sữa đến xuất chuồng đạt 115kg nạc cao.'
WHERE `id` = 1;

UPDATE `livestock_breeds`
SET `breed_name` = 'Gà thịt trắng công nghiệp Ross 308',
    `fcr_target` = 1.65,
    `adg_target` = 62.00,
    `description` = 'Quy trình nuôi công nghiệp chuồng lạnh khép kín, kiểm soát tối ưu nhiệt độ, ẩm độ và dinh dưỡng tăng trọng nhanh.'
WHERE `id` = 2;

UPDATE `livestock_breeds`
SET `breed_name` = 'Vịt siêu thịt Cherry Valley (48 ngày)',
    `fcr_target` = 2.15,
    `adg_target` = 70.00,
    `description` = 'Quy trình nuôi vịt thịt cao sản chuồng sàn lạnh khép kín, thịt chắc nạc, lớn nhanh.'
WHERE `id` = 3;

-- 2. Xóa và nạp lại consumption_quotas từ id >= 4
DELETE FROM `consumption_quotas` WHERE `id` >= 4;

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
    (1, 1, 2, 3, 0.215, 'g/con', 'Vỗ béo', 43, 45, 2.800, 215.00, 'Cám Vỗ Béo Xuất Chuồng (29-45 ngày)', 'FEED');

-- Cập nhật lịch vắc-xin cho Giống 2 (Gà Ross 308)
INSERT INTO `consumption_quotas` (`tenant_id`, `farm_id`, `livestock_breed_id`, `material_id`, `standard_quantity`, `unit_of_measure`, `stage`, `day_age_from`, `day_age_to`, `vaccine_name`, `dose`, `route`, `notes`, `quota_type`)
VALUES
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 1, 1, 'Vắc-xin Marek (Đông khô)', '1 liều/con (0.2ml)', 'Tiêm dưới da cổ', 'Tiêm phòng tại lò ấp ngay khi nở, sát trùng kim tiêm', 'VACCINE'),
    (1, 1, 2, 5, 1.00, 'liều/con', 'Úm', 4, 4, 'ND - IB lần 1 (Clon 30 + H120)', '1 liều/con', 'Nhỏ mắt / Nhỏ mũi', 'Mỗi con 1 giọt vào mắt hoặc mũi, chờ nhấp nháy mắt mới thả', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 10, 10, 'Gumboro lần 1 (Chủng D78)', '1 liều/con', 'Pha nước uống', 'Cắt nước 1.5 - 2h trước khi uống, pha cùng sữa gầy bảo vệ', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Úm', 14, 14, 'Đậu gà (Fowl Pox Vaccine)', '1 liều/con', 'Châm cánh', 'Dùng kim đôi châm xuyên màng cánh, tránh chạm mạch máu', 'VACCINE'),
    (1, 1, 2, 5, 1.00, 'liều/con', 'Tăng trưởng', 21, 21, 'ND - IB lần 2 (Lasota tái chủng)', '1 liều/con', 'Pha nước uống', 'Cho uống trong vòng 2 giờ, tránh ánh nắng trực tiếp', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Tăng trưởng', 28, 28, 'Gumboro lần 2', '1 liều/con', 'Pha nước uống', 'Tái chủng nhắc lại để củng cố miễn dịch bảo hộ đàn', 'VACCINE'),
    (1, 1, 2, NULL, 1.00, 'liều/con', 'Vỗ béo', 35, 35, 'Cúm gia cầm H5N1 / H5N6', '0.5 ml/con', 'Tiêm bắp ức', 'Tiêm bắp ức hoặc dưới da gáy, ngừng thuốc trước xuất chuồng 14 ngày', 'VACCINE');

-- 3. Khởi tạo mặc định KPI và Chỉ số môi trường cho Farm 1
UPDATE `farm_data_rules`
SET `kpi_targets_json` = '{"targetFcr": 1.65, "maxMortalityRate": 3.5, "cullingReasons": ["Tiêu chảy / E.coli", "Viêm phổi / Khẹc thở", "Bại liệt / Chấn thương", "Còi cọc không lớn", "Chết nóng / Ngạt khí", "Khác"]}',
    `env_metrics_json` = '[{"id": "ENV_TEMP", "name": "Nhiệt độ chuồng", "code": "TEMP", "unit": "°C", "minVal": 24.0, "maxVal": 32.5, "frequency": "3 lần / ngày (Sáng, Trưa, Tối)", "description": "Nhiệt độ môi trường bên trong chuồng nuôi, ảnh hưởng trực tiếp đến sức ăn và hô hấp."}, {"id": "ENV_HUMID", "name": "Độ ẩm không khí", "code": "HUMID", "unit": "%", "minVal": 55.0, "maxVal": 75.0, "frequency": "2 lần / ngày", "description": "Độ ẩm tương đối trong chuồng, độ ẩm cao kết hợp nhiệt độ cao gây stress nhiệt."}, {"id": "ENV_NH3", "name": "Nồng độ khí NH3", "code": "NH3", "unit": "ppm", "minVal": 0.0, "maxVal": 20.0, "frequency": "1 lần / ngày", "description": "Khí độc sinh ra từ chất thải và đệm lót sinh học, nồng độ vượt 20ppm gây viêm kết mạc và suy hô hấp."}, {"id": "ENV_CO2", "name": "Nồng độ khí CO2", "code": "CO2", "unit": "ppm", "minVal": 0.0, "maxVal": 1500.0, "frequency": "1 lần / ngày", "description": "Đo hiệu quả lưu thông thông gió trong chuồng trại khép kín."}]'
WHERE `farm_id` = 1;
