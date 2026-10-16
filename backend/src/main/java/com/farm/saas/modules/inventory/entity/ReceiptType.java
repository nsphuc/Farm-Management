package com.farm.saas.modules.inventory.entity;

/**
 * Loại hình nhập kho (Receipt Type).
 * Khớp hoàn toàn với CHECK constraint bảng warehouse_receipts trong V1_0__init_system_core.sql:
 * CHECK (receipt_type IN ('PURCHASE', 'HARVEST_RETURN', 'INTERNAL_TRANSFER', 'ADJUSTMENT'))
 */
public enum ReceiptType {
    PURCHASE,           // Nhập mua từ Nhà cung cấp (Vendor / Supplier)
    HARVEST_RETURN,     // Nông sản thu hoạch từ nông trường nhập về kho
    INTERNAL_TRANSFER,  // Nhập điều chuyển từ kho khác chuyển sang
    ADJUSTMENT          // Nhập điều chỉnh sau kiểm kê thừa
}
