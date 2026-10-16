package com.farm.saas.modules.inventory.entity;

/**
 * Loại hình xuất kho (Issue Type).
 * Khớp hoàn toàn với CHECK constraint bảng warehouse_issues trong V1_0__init_system_core.sql:
 * CHECK (issue_type IN ('PRODUCTION_BACKFLUSH', 'INTERNAL_USE', 'SALE_FULFILLMENT', 'DAMAGE_DISPOSAL', 'TRANSFER'))
 */
public enum IssueType {
    PRODUCTION_BACKFLUSH, // Xuất tự động trừ hao vật tư cho sản xuất (Backflush)
    INTERNAL_USE,         // Xuất sử dụng nội bộ (Vật tư chăm sóc, bảo dưỡng máy móc)
    SALE_FULFILLMENT,     // Xuất bán giao hàng cho khách hàng
    DAMAGE_DISPOSAL,      // Xuất hủy do hỏng hóc, quá hạn sử dụng
    TRANSFER              // Xuất điều chuyển sang kho khác
}
