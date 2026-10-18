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

    public static Set<Long> getCurrentAccessibleFarmIds() {
        CustomUserDetails user = getCurrentUser();
        return user != null ? user.getAccessibleFarmIds() : Collections.emptySet();
    }

    public static boolean isSuperAdmin() {
        CustomUserDetails user = getCurrentUser();
        return user != null && user.isSuperAdmin();
    }
}
