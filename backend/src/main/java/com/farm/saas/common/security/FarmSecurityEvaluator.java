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
     * Checks if current user can access a specific barn / zone based on farm_members data scope.
     * If user has all_barns = true (or is Super Admin, Farm Owner, Farm Manager, barns.manage authority), returns true.
     * If user has all_barns = false, checks if barnId is included in member's barn_ids JSON array.
     */
    public boolean canAccessBarn(Long farmId, Long barnId) {
        if (!canAccessFarm(farmId)) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        if (user.isSuperAdmin() || user.hasRole("ROLE_FARM_OWNER") || user.hasAuthority("barns.manage")) {
            return true;
        }
        try {
            java.util.List<java.util.Map<String, Object>> members = jdbcTemplate.queryForList(
                    "SELECT all_barns, barn_ids FROM farm_members WHERE user_id = ? AND farm_id = ?",
                    user.getId(), farmId);
            if (members.isEmpty()) {
                return true;
            }
            java.util.Map<String, Object> member = members.get(0);
            Object allBarnsObj = member.get("all_barns");
            boolean allBarns = allBarnsObj == null || Boolean.TRUE.equals(allBarnsObj) || "1".equals(String.valueOf(allBarnsObj));
            if (allBarns || barnId == null) {
                return true;
            }
            String barnIdsJson = member.get("barn_ids") != null ? member.get("barn_ids").toString() : "";
            return java.util.regex.Pattern.compile("(?<!\\d)" + barnId + "(?!\\d)").matcher(barnIdsJson).find();
        } catch (Exception ex) {
            log.warn("Error checking barn access for user {} at farm {} barn {}: {}", user.getId(), farmId, barnId, ex.getMessage());
            return true;
        }
    }

    /**
     * Lấy branch_id cố định được Chủ trại phân công cho nhân viên (NULL đối với Super Admin / Farm Owner).
     */
    public Long getAssignedBranchId(Long farmId) {
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null || user.isSuperAdmin() || user.hasRole("ROLE_FARM_OWNER")) {
            return null;
        }
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
        try {
            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT branch_id FROM farm_members WHERE user_id = ? AND farm_id = ?",
                    user.getId(), targetFarmId);
            if (!rows.isEmpty() && rows.get(0).get("branch_id") != null) {
                return ((Number) rows.get(0).get("branch_id")).longValue();
            }
            return null;
        } catch (Exception ex) {
            log.warn("Error resolving assigned branchId for user {} at farm {}: {}", user.getId(), targetFarmId, ex.getMessage());
            return null;
        }
    }

    /**
     * Kiểm tra quyền truy cập trang trại (ném 403 AccessDeniedException nếu không hợp lệ).
     */
    public void assertFarmAccess(Long farmId) {
        if (farmId != null && farmId > 0 && !canAccessFarm(farmId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập trang trại #" + farmId);
        }
    }

    /**
     * Khóa cứng phạm vi chi nhánh (ISO-01):
     * - Super Admin / Farm Owner: trả về requestedBranchId (cho phép null = Toàn chuỗi ALL).
     * - Nhân sự được gán 1 chi nhánh: nếu cố tình truyền branchId khác -> ném 403 AccessDeniedException;
     *   nếu bỏ trống branchId -> tự động ép về assignedBranchId.
     */
    public Long resolveEffectiveBranchId(Long farmId, Long requestedBranchId) {
        assertFarmAccess(farmId);
        Long assignedBranchId = getAssignedBranchId(farmId);
        if (assignedBranchId != null) {
            if (requestedBranchId != null && requestedBranchId > 0 && !assignedBranchId.equals(requestedBranchId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu của chi nhánh #" + requestedBranchId);
            }
            return assignedBranchId;
        }
        return (requestedBranchId != null && requestedBranchId > 0) ? requestedBranchId : null;
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
        return isFarmManagerOrOwner(farmId);
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
        if (user.isSuperAdmin() || user.hasRole("ROLE_FARM_OWNER") || user.hasRole("ROLE_FARM_MANAGER")) {
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
     * Checks if current user is an active Zone Manager at the specified farmId.
     */
    public boolean isZoneManager(Long farmId) {
        if (farmId == null || !canAccessFarm(farmId)) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farm_assignments " +
                            "WHERE user_id = ? AND farm_id = ? AND role_in_farm = 'ZONE_MANAGER' AND is_active = TRUE",
                    Integer.class, user.getId(), farmId);
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Lấy danh sách ID các phân khu mà user đang phụ trách làm Tổ trưởng phân khu (ZONE_MANAGER / TECHNICAL_LEAD).
     */
    public java.util.Set<Long> getManagedZoneIds(Long farmId) {
        if (farmId == null || !canAccessFarm(farmId)) {
            return java.util.Collections.emptySet();
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return java.util.Collections.emptySet();
        }
        try {
            java.util.List<Long> zoneIds = jdbcTemplate.query(
                    "SELECT DISTINCT zone_id FROM farm_assignments " +
                            "WHERE user_id = ? AND farm_id = ? AND role_in_farm IN ('ZONE_MANAGER', 'TECHNICAL_LEAD') AND zone_id IS NOT NULL AND is_active = TRUE",
                    (rs, rowNum) -> rs.getLong(1),
                    user.getId(), farmId);
            return new java.util.HashSet<>(zoneIds);
        } catch (Exception ex) {
            log.warn("Error querying managed zones for user {} at farm {}: {}", user.getId(), farmId, ex.getMessage());
            return java.util.Collections.emptySet();
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

    /**
     * Quy tắc 2: Kiểm tra quyền xem thông tin tài chính nhạy cảm (Đơn giá, Giá vốn, Thành tiền).
     * Chỉ có Chủ trại (ROLE_FARM_OWNER), Kế toán (financial.price.view) mới có quyền này.
     */
    public boolean canViewFinancialPrice() {
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        return user.hasRole("ROLE_FARM_OWNER") || user.hasAuthority("financial.price.view");
    }

    /**
     * Quy tắc 1: Kiểm tra dịch vụ mở rộng (Add-on) có đang ACTIVE tại trang trại hay không.
     */
    public boolean hasAddon(Long farmId, String addonCode) {
        if (farmId == null || addonCode == null) {
            return false;
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farm_add_on_subscriptions WHERE farm_id = ? AND addon_code = ? AND status = 'ACTIVE'",
                    Integer.class, farmId, addonCode);
            return count != null && count > 0;
        } catch (Exception ex) {
            log.warn("Error checking add-on {} for farm {}: {}", addonCode, farmId, ex.getMessage());
            return false;
        }
    }

    /**
     * Quy tắc 1: Điều kiện hiển thị kép (Addon Enabled AND User Permission).
     */
    public boolean canAccessAddon(Long farmId, String addonCode, String permissionCode) {
        if (!hasAddon(farmId, addonCode)) {
            return false;
        }
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        if (user == null) {
            return false;
        }
        if (user.hasRole("ROLE_FARM_OWNER")) {
            return true;
        }
        return permissionCode == null || user.hasAuthority(permissionCode);
    }
}
