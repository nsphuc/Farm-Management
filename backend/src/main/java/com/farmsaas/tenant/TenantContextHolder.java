package com.farmsaas.tenant;

import lombok.extern.slf4j.Slf4j;

/**
 * ThreadLocal storage for the current request's Tenant ID.
 * Ensures strict multi-tenant data isolation per thread.
 */
@Slf4j
public final class TenantContextHolder {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContextHolder() {
        // Private constructor for utility class
    }

    public static void setTenantId(Long tenantId) {
        if (tenantId != null) {
            log.trace("Gán Tenant ID: {} vào ThreadContext", tenantId);
            CURRENT_TENANT.set(tenantId);
        } else {
            CURRENT_TENANT.remove();
        }
    }

    public static Long getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        log.trace("Xóa Tenant ID khỏi ThreadContext");
        CURRENT_TENANT.remove();
    }
}
