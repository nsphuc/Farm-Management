package com.farm.saas.security.authorization;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.security.auth.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Tiện ích truy xuất thông tin ngữ cảnh bảo mật và kiểm tra quyền của Principal hiện tại.
 * Đóng vai trò là thành phần hỗ trợ cốt lõi cho The Farm Barrier Guard và Tenant Isolation.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<CustomUserDetails> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return Optional.of(userDetails);
        }

        return Optional.empty();
    }

    public static CustomUserDetails getRequiredCurrentUser() {
        return getCurrentUser().orElseThrow(() -> AppException.unauthorized("Yêu cầu xác thực để thực hiện hành động này"));
    }

    public static Optional<Long> getCurrentUserId() {
        return getCurrentUser().map(CustomUserDetails::getUserId);
    }

    public static Optional<Long> getCurrentTenantId() {
        return getCurrentUser().map(CustomUserDetails::getTenantId);
    }

    public static boolean isSuperAdmin() {
        return getCurrentUser().map(CustomUserDetails::isSuperAdmin).orElse(false);
    }

    public static List<Long> getCurrentFarmIds() {
        return getCurrentUser().map(CustomUserDetails::getFarmIds).orElse(Collections.emptyList());
    }

    public static boolean hasPermission(String permissionCode) {
        if (permissionCode == null || permissionCode.isBlank()) {
            return false;
        }
        return getCurrentUser()
                .map(user -> user.getPermissions() != null && user.getPermissions().contains(permissionCode.trim()))
                .orElse(false);
    }

    public static boolean hasRole(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return false;
        }
        return getCurrentUser()
                .map(user -> user.getRoles() != null && user.getRoles().contains(roleCode.trim()))
                .orElse(false);
    }

    public static boolean canAccessFarm(Long farmId) {
        if (farmId == null) {
            return false;
        }
        Optional<CustomUserDetails> currentUserOpt = getCurrentUser();
        if (currentUserOpt.isEmpty()) {
            return false;
        }
        CustomUserDetails user = currentUserOpt.get();

        // 1. Super Admin nền tảng cần tuân thủ quy tắc riêng, nhưng theo chính sách nội bộ được phép nếu có scope
        if (user.isSuperAdmin()) {
            return true;
        }

        // 2. Chủ trang trại (ROLE_FARM_OWNER) có quyền truy cập toàn bộ farm trong tenant của mình
        if (user.getRoles() != null && user.getRoles().contains("ROLE_FARM_OWNER")) {
            return true;
        }

        // 3. Nhân sự cấp trang trại (ROLE_FIELD_STAFF, ROLE_WAREHOUSE_STAFF, ROLE_TECHNICAL_STAFF)
        // bắt buộc farmId phải nằm trong danh sách farmIds đã được phân công
        return user.getFarmIds() != null && user.getFarmIds().contains(farmId);
    }

    public static void validateTenantAccess(Long requestedTenantId) {
        if (requestedTenantId == null) {
            return;
        }
        CustomUserDetails user = getRequiredCurrentUser();

        // Nếu là Super Admin quản trị hệ thống
        if (user.isSuperAdmin()) {
            return;
        }

        Long userTenantId = user.getTenantId();
        if (userTenantId == null || !userTenantId.equals(requestedTenantId)) {
            throw AppException.forbidden("The Farm Barrier Guard: Từ chối truy cập ngoài phạm vi Tenant của người dùng!");
        }
    }

    public static void validateFarmAccess(Long requestedFarmId) {
        if (requestedFarmId == null) {
            return;
        }
        if (!canAccessFarm(requestedFarmId)) {
            throw AppException.forbidden("The Farm Barrier Guard: Người dùng không được cấp quyền truy cập vào trang trại này (Farm ID: " + requestedFarmId + ")!");
        }
    }
}
