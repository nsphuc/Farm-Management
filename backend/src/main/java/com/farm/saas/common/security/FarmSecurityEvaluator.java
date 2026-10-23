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

        // 3. Farm Owner has tenant-wide scope (ROLE_ACCOUNTANT is now FARM scope)
        if (user.hasRole("ROLE_FARM_OWNER")) {
            return true;
        }

        // 4. Farm-level staff (Farm Manager, Tech, Warehouse, Accountant, Field) must have explicit access in user_farm_access
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
        if (!isFarmManagerOrOwner(farmId)) {
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

    /**
     * Checks if current user is the Farm Manager of the specified farm.
     */
    public boolean isFarmManager(Long farmId) {
        if (farmId == null || !canAccessFarm(farmId)) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        if (user.hasRole("ROLE_FARM_MANAGER")) {
            return true;
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farm_assignments " +
                            "WHERE user_id = ? AND farm_id = ? AND role_in_farm = 'FARM_MANAGER' AND is_active = TRUE",
                    Integer.class, user.getId(), farmId);
            if (count != null && count > 0) {
                return true;
            }
            Integer managerCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farms WHERE id = ? AND manager_user_id = ?",
                    Integer.class, farmId, user.getId());
            return managerCount != null && managerCount > 0;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Checks if current user is either Farm Manager or Farm Owner (Checker role for approving receipts, issues, stocktake, expenses, payments, orders).
     */
    public boolean isFarmManagerOrOwner(Long farmId) {
        if (farmId == null) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        if (user.isSuperAdmin()) {
            return true;
        }
        if (!canAccessFarm(farmId)) {
            return false;
        }
        if (user.hasRole("ROLE_FARM_OWNER")) {
            return true;
        }
        return isFarmManager(farmId);
    }

    /**
     * Checks if current user can perform batch roll call attendance at farmId.
     * Allowed for Farm Manager, Technical Staff, or staff holding ZONE_MANAGER / TECHNICAL_LEAD in farm_assignments.
     */
    public boolean canPerformBatchRollCall(Long farmId) {
        if (farmId == null || !canAccessFarm(farmId)) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        if (user.isSuperAdmin() || user.hasRole("ROLE_FARM_MANAGER") || user.hasRole("ROLE_TECHNICAL_STAFF")) {
            return true;
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farm_assignments " +
                            "WHERE user_id = ? AND farm_id = ? AND role_in_farm IN ('FARM_MANAGER', 'ZONE_MANAGER', 'TECHNICAL_LEAD') AND is_active = TRUE",
                    Integer.class, user.getId(), farmId);
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Enforces cascading hierarchy for role assignment.
     * Cấp 1 (Super Admin): Chỉ gán ROLE_FARM_OWNER
     * Cấp 2 (Farm Owner): Gán ROLE_FARM_MANAGER hoặc Cấp 4 trong Tenant; Cấm gán SUPER_ADMIN hoặc FARM_OWNER
     * Cấp 3 (Farm Manager): Chỉ gán 4 role Cấp 4 trong farm của mình; Cấm gán FARM_OWNER hoặc FARM_MANAGER
     */
    public boolean canAssignRole(String targetRoleCode, Long targetFarmId) {
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Người dùng chưa đăng nhập");
        }

        // 1. Cấp 1: Super Admin
        if (user.isSuperAdmin() || user.hasRole("ROLE_SUPER_ADMIN")) {
            if ("ROLE_FARM_OWNER".equalsIgnoreCase(targetRoleCode)) {
                return true;
            }
            throw new AccessDeniedException("Vi phạm phân cấp: Super Admin chỉ được phép gán vai trò Chủ trang trại (ROLE_FARM_OWNER)");
        }

        // 2. Cấp 2: Farm Owner
        if (user.hasRole("ROLE_FARM_OWNER")) {
            if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(targetRoleCode) || "ROLE_FARM_OWNER".equalsIgnoreCase(targetRoleCode)) {
                throw new AccessDeniedException("Vi phạm phân cấp: Chủ trang trại không được phép bổ nhiệm Super Admin hoặc Farm Owner khác");
            }
            if (targetFarmId != null) {
                Long farmTenantId = resolveFarmTenantId(targetFarmId);
                if (farmTenantId == null || !farmTenantId.equals(user.getTenantId())) {
                    throw new AccessDeniedException("Trang trại mục tiêu không thuộc quyền quản lý của Tenant");
                }
            }
            return true;
        }

        // 3. Cấp 3: Farm Manager
        if (user.hasRole("ROLE_FARM_MANAGER") || (targetFarmId != null && isFarmManager(targetFarmId))) {
            if (targetFarmId == null || !canAccessFarm(targetFarmId)) {
                throw new AccessDeniedException("Vi phạm phân cấp: Bạn không có quyền quản lý trang trại này");
            }
            java.util.Set<String> tier4Roles = java.util.Set.of(
                    "ROLE_TECHNICAL_STAFF",
                    "ROLE_WAREHOUSE_STAFF",
                    "ROLE_ACCOUNTANT",
                    "ROLE_FIELD_STAFF"
            );
            if (!tier4Roles.contains(targetRoleCode)) {
                throw new AccessDeniedException("Vi phạm phân cấp: Giám đốc trang trại chỉ được phép bổ nhiệm nhân sự Cấp 4 thuộc trang trại của mình");
            }
            return true;
        }

        throw new AccessDeniedException("Bạn không có quyền bổ nhiệm hoặc cấp tài khoản");
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
