package com.farm.saas.modules.organization.entity;

/**
 * Trạng thái chu kỳ canh tác / năm tài chính:
 * - PLANNING: Đang lập kế hoạch, dự toán ngân sách và định mức.
 * - ACTIVE: Đang trong chu kỳ vận hành (cho phép ghi nhận nhật ký, chi phí, vật tư).
 * - CLOSED: Đã đóng kỳ (không cho phép sửa đổi hay phát sinh thêm dữ liệu nếu không có quy trình mở lại).
 */
public enum OperationalCycleStatus {
    PLANNING,
    ACTIVE,
    CLOSED
}
