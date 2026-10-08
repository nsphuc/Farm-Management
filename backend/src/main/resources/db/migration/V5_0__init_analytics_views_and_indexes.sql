-- =============================================================================
-- SMART FARM MANAGEMENT PLATFORM (SAAS)
-- FLYWAY MIGRATION V5_0: ANALYTICS VIEWS & COMPOSITE PERFORMANCE INDEXES
-- Module: Phase 5 - Báo Cáo, Phân Tích & Tối Ưu Toàn Diện (Analytics & Launch)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COMPOSITE INDEXES CHO TRUY VẤN THỜI GIAN THỰC (REAL-TIME ANALYTICS PERFORMANCE)
-- -----------------------------------------------------------------------------

-- Index tối ưu truy vấn báo cáo doanh thu theo trang trại & thời gian
CREATE INDEX `idx_so_analytics_farm_date` ON `sales_orders` (`tenant_id`, `farm_id`, `order_date`, `payment_status`);

-- Index tối ưu truy vấn chi phí phát sinh theo hạng mục & thời gian
CREATE INDEX `idx_fe_analytics_farm_date` ON `farm_expenses` (`tenant_id`, `farm_id`, `expense_date`, `category_id`);

-- Index tối ưu truy vấn sản lượng & truy xuất nguồn gốc lô nông sản
CREATE INDEX `idx_pb_analytics_harvest` ON `product_batches` (`tenant_id`, `farm_id`, `harvest_date`, `status`);

-- Index tối ưu truy vấn cảnh báo hạn sử dụng & tồn kho an toàn
CREATE INDEX `idx_wi_analytics_expiry` ON `warehouse_inventory` (`warehouse_id`, `expiry_date`, `quantity_on_hand`);

-- Index tối ưu truy vấn cảnh báo công việc trễ hạn
CREATE INDEX `idx_ft_analytics_due` ON `farm_tasks` (`farm_id`, `status`, `due_date`);

-- Index tối ưu truy vấn cảnh báo công nợ quá hạn
CREATE INDEX `idx_dr_analytics_due` ON `debt_records` (`farm_id`, `status`, `due_date`);


-- -----------------------------------------------------------------------------
-- 2. VIEW 1: v_monthly_crop_yields (Thống Kê Sản Lượng & Năng Suất Thu Hoạch Hàng Tháng)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_monthly_crop_yields` AS
SELECT 
    pb.tenant_id,
    pb.farm_id,
    YEAR(pb.harvest_date) AS `harvest_year`,
    MONTH(pb.harvest_date) AS `harvest_month`,
    cs.crop_type_id,
    COALESCE(ct.name, pb.product_name) AS `crop_name`,
    COUNT(pb.id) AS `total_batches`,
    SUM(pb.initial_quantity) AS `total_harvested_quantity`,
    SUM(pb.remaining_quantity) AS `total_remaining_quantity`,
    pb.unit AS `standard_unit`,
    COALESCE(SUM(cs.planted_area_m2), 0) AS `total_planted_area_m2`,
    COALESCE(SUM(cs.actual_yield_kg), 0) AS `total_season_actual_yield_kg`
FROM `product_batches` pb
LEFT JOIN `crop_seasons` cs ON pb.season_id = cs.id
LEFT JOIN `crop_types` ct ON cs.crop_type_id = ct.id
WHERE pb.status != 'REJECTED'
GROUP BY 
    pb.tenant_id,
    pb.farm_id,
    YEAR(pb.harvest_date),
    MONTH(pb.harvest_date),
    cs.crop_type_id,
    COALESCE(ct.name, pb.product_name),
    pb.unit;


-- -----------------------------------------------------------------------------
-- 3. VIEW 2: v_inventory_turnover (Báo Cáo Tồn Kho & Giá Trị Vật Tư Hiện Tại)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_inventory_turnover` AS
SELECT 
    wi.tenant_id,
    w.farm_id,
    wi.warehouse_id,
    w.name AS `warehouse_name`,
    wi.material_id,
    m.name AS `material_name`,
    m.sku_code,
    mc.id AS `category_id`,
    COALESCE(mc.name, 'Chung') AS `category_name`,
    m.standard_unit,
    SUM(wi.quantity_on_hand) AS `total_quantity_on_hand`,
    SUM(wi.reserved_quantity) AS `total_reserved_quantity`,
    m.min_stock_level,
    m.unit_price_standard,
    SUM(wi.quantity_on_hand * m.unit_price_standard) AS `total_inventory_value`,
    MIN(wi.expiry_date) AS `nearest_expiry_date`,
    CASE 
        WHEN SUM(wi.quantity_on_hand) <= m.min_stock_level THEN 1 
        ELSE 0 
    END AS `is_under_min_stock`
FROM `warehouse_inventory` wi
JOIN `warehouses` w ON wi.warehouse_id = w.id
JOIN `materials` m ON wi.material_id = m.id
LEFT JOIN `material_categories` mc ON m.category_id = mc.id
GROUP BY 
    wi.tenant_id,
    w.farm_id,
    wi.warehouse_id,
    w.name,
    wi.material_id,
    m.name,
    m.sku_code,
    mc.id,
    mc.name,
    m.standard_unit,
    m.min_stock_level,
    m.unit_price_standard;


-- -----------------------------------------------------------------------------
-- 4. VIEW 3: v_farm_profit_loss (Báo Cáo Hoạt Động Sản Xuất Kinh Doanh & Lãi Lỗ P&L)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_farm_profit_loss` AS
SELECT 
    sub.tenant_id,
    sub.farm_id,
    sub.period_year,
    sub.period_month,
    SUM(sub.revenue) AS `total_revenue`,
    SUM(sub.expense) AS `total_expense`,
    SUM(sub.revenue) - SUM(sub.expense) AS `net_profit`,
    CASE 
        WHEN SUM(sub.expense) > 0 THEN ROUND(((SUM(sub.revenue) - SUM(sub.expense)) / SUM(sub.expense)) * 100, 2)
        ELSE 0.00
    END AS `roi_percentage`
FROM (
    -- Doanh thu từ đơn hàng bán nông sản
    SELECT 
        so.tenant_id,
        so.farm_id,
        YEAR(so.order_date) AS `period_year`,
        MONTH(so.order_date) AS `period_month`,
        so.final_amount AS `revenue`,
        0.00 AS `expense`
    FROM `sales_orders` so

    UNION ALL

    -- Chi phí hoạt động trang trại
    SELECT 
        fe.tenant_id,
        fe.farm_id,
        YEAR(fe.expense_date) AS `period_year`,
        MONTH(fe.expense_date) AS `period_month`,
        0.00 AS `revenue`,
        fe.amount AS `expense`
    FROM `farm_expenses` fe
) sub
GROUP BY 
    sub.tenant_id,
    sub.farm_id,
    sub.period_year,
    sub.period_month;
