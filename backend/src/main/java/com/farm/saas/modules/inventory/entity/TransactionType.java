package com.farm.saas.modules.inventory.entity;

/**
 * Loại biến động tồn kho (Transaction Type).
 * Khớp hoàn toàn với CHECK constraint bảng warehouse_inventory_transactions:
 * INWARD, OUTWARD, TRANSFER_OUT, TRANSFER_IN, STOCKTAKE_ADJUST_IN, STOCKTAKE_ADJUST_OUT, DAMAGE_DISPOSAL, CANCELLATION_REVERSAL
 */
public enum TransactionType {
    INWARD,                 // Nhập kho
    OUTWARD,                // Xuất kho
    TRANSFER_OUT,           // Xuất chuyển kho
    TRANSFER_IN,            // Nhập chuyển kho
    STOCKTAKE_ADJUST_IN,    // Điều chỉnh tăng sau kiểm kê
    STOCKTAKE_ADJUST_OUT,   // Điều chỉnh giảm sau kiểm kê
    DAMAGE_DISPOSAL,        // Xuất hủy hàng hỏng
    CANCELLATION_REVERSAL   // Đảo bút toán khi hủy phiếu
}
