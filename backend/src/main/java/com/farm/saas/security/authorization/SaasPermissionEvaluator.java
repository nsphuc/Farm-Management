package com.farm.saas.security.authorization;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Custom Permission Evaluator hỗ trợ biểu thức SpEL hasPermission(target, permission)
 * trong các annotation @PreAuthorize.
 * Kết hợp kiểm tra quyền (Permission Code) và phạm vi đối tượng (Farm Scope / Tenant Scope).
 */
@Component
public class SaasPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated() || permission == null) {
            return false;
        }

        try {
            String permissionCode = permission.toString().trim();
            if (authentication.getAuthorities() == null) {
                return false;
            }

            boolean hasAuthority = authentication.getAuthorities().stream()
                    .filter(java.util.Objects::nonNull)
                    .map(GrantedAuthority::getAuthority)
                    .filter(java.util.Objects::nonNull)
                    .anyMatch(auth -> auth.equalsIgnoreCase(permissionCode));

            if (!hasAuthority) {
                return false;
            }

            if (targetDomainObject instanceof Number farmId) {
                return SecurityUtils.canAccessFarm(farmId.longValue());
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated() || permission == null) {
            return false;
        }

        try {
            String permissionCode = permission.toString().trim();
            if (authentication.getAuthorities() == null) {
                return false;
            }

            boolean hasAuthority = authentication.getAuthorities().stream()
                    .filter(java.util.Objects::nonNull)
                    .map(GrantedAuthority::getAuthority)
                    .filter(java.util.Objects::nonNull)
                    .anyMatch(auth -> auth.equalsIgnoreCase(permissionCode));

            if (!hasAuthority) {
                return false;
            }

            if (targetId instanceof Number id && targetType != null) {
                if ("FARM".equalsIgnoreCase(targetType)) {
                    return SecurityUtils.canAccessFarm(id.longValue());
                }
                if ("TENANT".equalsIgnoreCase(targetType)) {
                    try {
                        SecurityUtils.validateTenantAccess(id.longValue());
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
