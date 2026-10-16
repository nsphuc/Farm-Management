package com.farm.saas.modules.inventory.entity;

/**
 * Trạng thái phiếu xuất kho (Issue Status).
 * Khớp hoàn toàn với CHECK constraint bảng warehouse_issues trong V1_0__init_system_core.sql:
 * CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'))
 */
public enum IssueStatus {
    DRAFT,      // Bản nháp, chưa trừ tồn kho
    APPROVED,   // Đã duyệt lệnh xuất kho
    COMPLETED,  // Đã xuất kho thành công, đã trừ tồn kho
    CANCELLED   // Đã hủy phiếu (Soft-cancel, không xóa vật lý)
}
