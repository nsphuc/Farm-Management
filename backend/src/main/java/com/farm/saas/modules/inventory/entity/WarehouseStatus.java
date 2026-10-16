package com.farm.saas.modules.inventory.entity;

/**
 * Trạng thái hoạt động của kho:
 * - ACTIVE: Đang hoạt động bình thường, cho phép nhập xuất và kiểm kê.
 * - INACTIVE: Tạm ngừng hoạt động (Soft-delete).
 * - FULL: Kho đã đầy sức chứa, tạm dừng nhận thêm hàng nhập mới.
 */
public enum WarehouseStatus {
    ACTIVE,
    INACTIVE,
    FULL
}
