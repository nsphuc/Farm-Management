package com.farm.saas.modules.inventory.entity;

/**
 * Trạng thái phiếu nhập kho (Receipt Status).
 * Khớp hoàn toàn với CHECK constraint bảng warehouse_receipts trong V1_0__init_system_core.sql:
 * CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'))
 */
public enum ReceiptStatus {
    DRAFT,      // Bản nháp, chưa ảnh hưởng tồn kho
    APPROVED,   // Đã duyệt, chờ nhập thực tế
    COMPLETED,  // Đã nhập kho hoàn tất, đã cộng tồn kho
    CANCELLED   // Đã hủy phiếu (Soft-cancel, không xóa vật lý)
}
