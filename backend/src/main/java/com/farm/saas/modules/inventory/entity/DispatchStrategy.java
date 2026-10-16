package com.farm.saas.modules.inventory.entity;

/**
 * Chiến lược xuất kho vật tư:
 * - FIFO: First In First Out (Nhập trước xuất trước - áp dụng cho phân bón, công cụ, vật tư không có hạn dùng gấp).
 * - FEFO: First Expired First Out (Hết hạn trước xuất trước - áp dụng cho giống cây, vaccine, thuốc BVTV, thức ăn).
 */
public enum DispatchStrategy {
    FIFO,
    FEFO
}
