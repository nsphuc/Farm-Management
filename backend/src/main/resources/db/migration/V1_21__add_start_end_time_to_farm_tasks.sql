-- V1_21: Add start_time and end_time to farm_tasks for precise intra-day task scheduling
ALTER TABLE farm_tasks ADD COLUMN start_time TIME NULL AFTER shift_id;
ALTER TABLE farm_tasks ADD COLUMN end_time TIME NULL AFTER start_time;

