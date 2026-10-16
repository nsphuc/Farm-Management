package com.farm.saas.modules.inventory.entity;

/**
 * Phân loại kho lưu trữ trong trang trại:
 * - FERTILIZER: Kho phân bón (hóa học, hữu cơ, vi sinh).
 * - PESTICIDE: Kho thuốc bảo vệ thực vật & hóa chất nông nghiệp.
 * - ANIMAL_FEED: Kho thức ăn chăn nuôi & phụ gia dinh dưỡng.
 * - HARVESTED_PRODUCE: Kho nông sản sau thu hoạch / sơ chế bảo quản lạnh.
 * - TOOLS_EQUIPMENT: Kho công cụ, dụng cụ và vật tư cơ giới.
 * - GENERAL: Kho tổng hợp / vật tư phụ trợ khác.
 */
public enum WarehouseType {
    FERTILIZER,
    PESTICIDE,
    ANIMAL_FEED,
    HARVESTED_PRODUCE,
    TOOLS_EQUIPMENT,
    GENERAL
}
