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

    public static Long getRequiredTenantId() {
        Long tenantId = getTenantId();
        if (tenantId == null) {
            tenantId = com.farmsaas.security.util.SecurityUtils.getCurrentUserPrincipal()
                    .map(com.farmsaas.security.service.UserPrincipal::getTenantId)
                    .orElse(null);
            if (tenantId != null) {
                setTenantId(tenantId);
            }
        }
        if (tenantId == null) {
            throw new com.farmsaas.common.exception.BusinessException("Vui lòng chọn tổ chức/trang trại trước khi thao tác.");
        }
        return tenantId;
    }

    public static void clear() {
        log.trace("Xóa Tenant ID khỏi ThreadContext");
        CURRENT_TENANT.remove();
    }
}
