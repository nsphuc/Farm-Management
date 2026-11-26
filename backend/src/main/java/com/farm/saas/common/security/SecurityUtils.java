package com.farm.saas.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Set;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }
        return null;
    }

    public static Long getCurrentUserId() {
        CustomUserDetails user = getCurrentUser();
        return user != null ? user.getId() : null;
    }

    public static Long getCurrentTenantId() {
        CustomUserDetails user = getCurrentUser();
        return user != null ? user.getTenantId() : null;
    }

    public static Long getCurrentFarmId() {
        Set<Long> ids = getCurrentAccessibleFarmIds();
        return (ids != null && !ids.isEmpty()) ? ids.iterator().next() : null;
    }

    public static Set<Long> getCurrentAccessibleFarmIds() {
        CustomUserDetails user = getCurrentUser();
        return user != null ? user.getAccessibleFarmIds() : Collections.emptySet();
    }

    public static boolean isSuperAdmin() {
        CustomUserDetails user = getCurrentUser();
        return user != null && user.isSuperAdmin();
    }

    public static boolean hasRole(String role) {
        CustomUserDetails user = getCurrentUser();
        return user != null && user.hasRole(role);
    }

    public static boolean hasAuthority(String authority) {
        CustomUserDetails user = getCurrentUser();
        return user != null && user.hasAuthority(authority);
    }

    /**
     * Lấy ID chi nhánh hiện tại từ HTTP Context (Header X-Branch-Id hoặc Query Param branchId)
     * Trả về null nếu đang ở chế độ xem Tổng hợp toàn chuỗi ('ALL') hoặc chưa thiết lập.
     */
    public static Long getCurrentBranchId() {
        return BranchContextHolder.getCurrentBranchId();
    }

    /**
     * Kiểm tra xem ngữ cảnh hiện tại có phải là Tổng hợp toàn chuỗi ('ALL') hay không
     */
    public static boolean isAllBranches() {
        return BranchContextHolder.isAllBranches();
    }

    /**
     * Kiểm tra quyền xem trường giá tài chính (Đơn giá, Thành tiền, Giá vốn)
     */
    public static boolean canViewFinancialPrice() {
        CustomUserDetails user = getCurrentUser();
        if (user == null) {
            return false;
        }
        return user.hasRole("ROLE_FARM_OWNER") || user.hasAuthority("financial.price.view");
    }
}
