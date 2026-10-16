package com.farm.saas.modules.organization.entity;

/**
 * Trạng thái hợp tác với đối tác:
 * - ACTIVE: Đang hoạt động, được phép phát sinh giao dịch mua bán, nhập xuất.
 * - INACTIVE: Tạm ngừng hợp tác / vô hiệu hóa (Soft-delete).
 * - BLACKLISTED: Đưa vào danh sách đen do vi phạm hợp đồng, gian lận chất lượng hoặc nợ khó đòi.
 */
public enum PartnerStatus {
    ACTIVE,
    INACTIVE,
    BLACKLISTED
}
