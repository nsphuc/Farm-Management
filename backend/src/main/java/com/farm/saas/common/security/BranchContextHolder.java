package com.farm.saas.common.security;

/**
 * ThreadLocal lưu trữ ngữ cảnh Chi nhánh (Branch Context) cho mỗi HTTP Request
 * Hỗ trợ cô lập dữ liệu (Branch Data Isolation) và góc nhìn tổng hợp ('ALL').
 */
public final class BranchContextHolder {

    private static final ThreadLocal<String> CURRENT_BRANCH = new ThreadLocal<>();

    private BranchContextHolder() {
    }

    public static void setBranch(String branch) {
        if (branch != null) {
            CURRENT_BRANCH.set(branch.trim());
        } else {
            CURRENT_BRANCH.remove();
        }
    }

    public static String getBranch() {
        return CURRENT_BRANCH.get();
    }

    /**
     * Trả về ID chi nhánh dạng Long nếu đang chọn một chi nhánh cụ thể.
     * Trả về null nếu đang ở chế độ xem Tổng hợp toàn chuỗi ('ALL') hoặc chưa chọn.
     */
    public static Long getCurrentBranchId() {
        String val = CURRENT_BRANCH.get();
        if (val == null || val.isBlank() || "ALL".equalsIgnoreCase(val) || "null".equalsIgnoreCase(val)) {
            return null;
        }
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Kiểm tra xem có đang ở chế độ xem Tổng hợp toàn chuỗi hay không
     */
    public static boolean isAllBranches() {
        String val = CURRENT_BRANCH.get();
        return val == null || val.isBlank() || "ALL".equalsIgnoreCase(val) || "null".equalsIgnoreCase(val);
    }

    public static void clear() {
        CURRENT_BRANCH.remove();
    }
}
