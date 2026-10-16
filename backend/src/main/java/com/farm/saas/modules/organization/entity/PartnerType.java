package com.farm.saas.modules.organization.entity;

/**
 * Loại đối tác trong chuỗi cung ứng của trang trại:
 * - SUPPLIER: Nhà cung cấp giống, thức ăn, phân bón, thuốc bảo vệ thực vật, máy móc.
 * - BUYER: Khách hàng mua sỉ/lẻ, đại lý bao tiêu, siêu thị, nhà hàng.
 * - LOGISTICS: Đơn vị vận chuyển hàng hóa, đối tác giao nhận.
 * - AGENT: Đại lý cấp 1/cấp 2, kênh phân phối trung gian.
 */
public enum PartnerType {
    SUPPLIER,
    BUYER,
    LOGISTICS,
    AGENT
}
