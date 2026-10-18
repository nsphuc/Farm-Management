package com.farm.saas.common.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Slf4j
@Component("farmSecurity")
@RequiredArgsConstructor
public class FarmSecurityEvaluator {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Checks if current authenticated user has access to specified farm.
     *
     * @param farmId Target farm ID
     * @return true if authorized, false otherwise
     */
    public boolean canAccessFarm(Long farmId) {
        if (farmId == null) {
            return false;
        }

        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }

        // 1. Super Admin can access all
        if (user.isSuperAdmin()) {
            return true;
        }

        // 2. Validate tenant isolation
        Long farmTenantId = resolveFarmTenantId(farmId);
        if (farmTenantId == null || !farmTenantId.equals(user.getTenantId())) {
            log.warn("User {} attempted to access farm {} belonging to tenant {} (user tenant: {})",
                    user.getUsername(), farmId, farmTenantId, user.getTenantId());
            return false;
        }

        // 3. Farm Owner and Accountant have tenant-wide scope
        if (user.hasAnyRole("ROLE_FARM_OWNER", "ROLE_ACCOUNTANT")) {
            return true;
        }

        // 4. Farm-level staff must have explicit access in user_farm_access
        return user.getAccessibleFarmIds() != null && user.getAccessibleFarmIds().contains(farmId);
    }

    /**
     * Enforces Maker-Checker principle for batch approval.
     * An inspector is forbidden from approving their own inspection results.
     *
     * @param farmId  Target farm ID
     * @param batchId Target product batch ID
     * @return true if allowed
     * @throws AccessDeniedException if Maker-Checker rule is violated
     */
    public boolean canApproveBatch(Long farmId, Long batchId) {
        if (!canAccessFarm(farmId)) {
            return false;
        }

        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }

        Long inspectorUserId = resolveBatchInspectorId(batchId);
        if (inspectorUserId != null && user.getId().equals(inspectorUserId)) {
            log.warn("Maker-checker violation: User {} (ID: {}) attempted to approve batch {} inspected by themselves",
                    user.getUsername(), user.getId(), batchId);
            throw new AccessDeniedException("Luật Maker-Checker: Người kiểm định không được tự phê duyệt kết quả của chính mình");
        }

        return true;
    }

    public Long resolveFarmTenantId(Long farmId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT tenant_id FROM farms WHERE id = ?", Long.class, farmId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        } catch (Exception ex) {
            log.error("Error resolving tenant for farm {}: {}", farmId, ex.getMessage());
            return null;
        }
    }

    public Long resolveBatchInspectorId(Long batchId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT inspector_user_id FROM qc_inspections " +
                            "WHERE product_batch_id = ? " +
                            "ORDER BY id DESC LIMIT 1",
                    Long.class, batchId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        } catch (Exception ex) {
            log.warn("Error resolving inspector for batch {}: {}", batchId, ex.getMessage());
            return null;
        }
    }
}
