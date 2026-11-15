-- V1_19: Nâng cấp thông tin công việc cố định (Ca làm việc, Tần suất lặp lại, Phân công nhân sự theo ca, Kho & Vật tư tiêu hao, Vụ mùa / Đàn nuôi)
ALTER TABLE farm_tasks
    ADD COLUMN shift_id BIGINT NULL,
    ADD COLUMN recurrence_days VARCHAR(100) NULL DEFAULT 'ALL',
    ADD COLUMN assignment_mode VARCHAR(50) NULL DEFAULT 'FIXED',
    ADD COLUMN warehouse_id BIGINT NULL,
    ADD COLUMN material_id BIGINT NULL,
    ADD COLUMN standard_quantity DECIMAL(12,2) NULL,
    ADD COLUMN actual_quantity DECIMAL(12,2) NULL,
    ADD COLUMN crop_season_id BIGINT NULL,
    ADD COLUMN livestock_group_id BIGINT NULL;

ALTER TABLE farm_tasks
    ADD CONSTRAINT fk_farm_tasks_shift FOREIGN KEY (shift_id) REFERENCES work_shifts(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_farm_tasks_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_farm_tasks_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_farm_tasks_crop_season FOREIGN KEY (crop_season_id) REFERENCES crop_seasons(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_farm_tasks_livestock_group FOREIGN KEY (livestock_group_id) REFERENCES livestock_groups(id) ON DELETE SET NULL;

