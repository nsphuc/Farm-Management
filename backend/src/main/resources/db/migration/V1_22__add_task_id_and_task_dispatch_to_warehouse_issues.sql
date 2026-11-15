-- V1_22: Bổ sung liên kết task_id và loại xuất kho TASK_DISPATCH cho quy trình tự động xuất kho theo nhiệm vụ
ALTER TABLE warehouse_issues ADD COLUMN task_id BIGINT NULL AFTER livestock_event_id;
ALTER TABLE warehouse_issues ADD CONSTRAINT fk_warehouse_issues_task FOREIGN KEY (task_id) REFERENCES farm_tasks(id) ON DELETE SET NULL;
CREATE INDEX idx_warehouse_issues_task ON warehouse_issues(task_id);

ALTER TABLE warehouse_issues DROP CHECK chk_warehouse_issues_type;
ALTER TABLE warehouse_issues ADD CONSTRAINT chk_warehouse_issues_type CHECK (issue_type IN ('PRODUCTION_BACKFLUSH', 'INTERNAL_USE', 'SALE_FULFILLMENT', 'DAMAGE_DISPOSAL', 'TRANSFER', 'TASK_DISPATCH'));

