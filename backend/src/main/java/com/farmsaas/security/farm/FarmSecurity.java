package com.farmsaas.security.farm;

import com.farmsaas.security.service.UserPrincipal;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Custom Spring Security Component for enforcing "The Farm Barrier".
 * Used in @PreAuthorize("@farmSecurity.hasAccessToFarm(#farmId)") annotations.
 */
@Slf4j
@Component("farmSecurity")
@RequiredArgsConstructor
public class FarmSecurity {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Checks whether the currently authenticated user has permission to access the specified farm.
     *
     * Rules:
     * 1. ROLE_SUPER_ADMIN has universal access (Scope Override).
     * 2. The farm must belong to the active Tenant.
     * 3. For other roles, the user must be assigned to the farm via user_farm_access,
     *    or farm_assignments, or be the designated manager of the farm.
     *
     * @param farmId the ID of the farm to access
     * @return true if access is permitted; false otherwise
     */
    public boolean hasAccessToFarm(Long farmId) {
        if (farmId == null) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        // 1. Super Admin Scope Override: Universal access
        boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority()));
        if (isSuperAdmin) {
            return true;
        }

        // 2. Resolve current user ID and tenant ID
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long currentTenantId = TenantContextHolder.getTenantId();

        if (currentUserId == null || currentTenantId == null) {
            return false;
        }

        // 3. Verify that the farm belongs to the current tenant
        Integer farmTenantMatches = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM farms WHERE id = ? AND tenant_id = ?",
                Integer.class,
                farmId,
                currentTenantId
        );
        if (farmTenantMatches == null || farmTenantMatches == 0) {
            log.warn("Access denied: Farm {} does not belong to Tenant {}", farmId, currentTenantId);
            return false;
        }

        // 4. Check if user is the direct manager of the farm
        Integer isManager = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM farms WHERE id = ? AND manager_user_id = ?",
                Integer.class,
                farmId,
                currentUserId
        );
        if (isManager != null && isManager > 0) {
            return true;
        }

        // 5. Check user_farm_access table
        Integer hasUserFarmAccess = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM user_farm_access WHERE user_id = ? AND farm_id = ? AND tenant_id = ?",
                Integer.class,
                currentUserId,
                farmId,
                currentTenantId
        );
        if (hasUserFarmAccess != null && hasUserFarmAccess > 0) {
            return true;
        }

        // 6. Check farm_assignments table (active assignments)
        Integer hasAssignment = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM farm_assignments WHERE user_id = ? AND farm_id = ? AND is_active = TRUE",
                Integer.class,
                currentUserId,
                farmId
        );
        if (hasAssignment != null && hasAssignment > 0) {
            return true;
        }

        log.warn("Farm Barrier: User {} denied access to Farm {}", currentUserId, farmId);
        return false;
    }
}
