package com.farm.saas.common.security;

import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với tài khoản/email: " + username));

        // 1. Query roles
        List<String> roleCodes = jdbcTemplate.query(
                "SELECT r.code FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?",
                (rs, rowNum) -> rs.getString("code"),
                user.getId()
        );
        Set<String> roles = new HashSet<>(roleCodes);

        // 2. Query permissions (Super Admin automatically gets all permissions)
        List<String> permissionCodes;
        if (Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.contains("ROLE_SUPER_ADMIN")) {
            permissionCodes = jdbcTemplate.query(
                    "SELECT code FROM permissions",
                    (rs, rowNum) -> rs.getString("code")
            );
        } else {
            permissionCodes = jdbcTemplate.query(
                    "SELECT DISTINCT p.code FROM user_roles ur " +
                            "JOIN role_permissions rp ON ur.role_id = rp.role_id " +
                            "JOIN permissions p ON rp.permission_id = p.id " +
                            "WHERE ur.user_id = ?",
                    (rs, rowNum) -> rs.getString("code"),
                    user.getId()
            );
        }
        Set<String> permissions = new HashSet<>(permissionCodes);

        // Dynamic Field Leadership Promotion: If user holds active ZONE_MANAGER assignment, grant PERM_TASK_ASSIGN
        try {
            Integer zoneManagerCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM farm_assignments WHERE user_id = ? AND role_in_farm = 'ZONE_MANAGER' AND is_active = TRUE",
                    Integer.class, user.getId());
            if (zoneManagerCount != null && zoneManagerCount > 0) {
                permissions.add("PERM_TASK_ASSIGN");
            }
        } catch (Exception ex) {
            log.warn("Error checking ZONE_MANAGER promotion for user {}: {}", user.getId(), ex.getMessage());
        }

        // 3. Determine tier level
        int tierLevel;
        if (Boolean.TRUE.equals(user.getIsSuperAdmin()) || roles.contains("ROLE_SUPER_ADMIN")) {
            tierLevel = 1;
        } else if (roles.contains("ROLE_FARM_OWNER")) {
            tierLevel = 2;
        } else if (roles.contains("ROLE_FARM_MANAGER")) {
            tierLevel = 3;
        } else {
            tierLevel = 4;
        }

        // 4. Query accessible farm IDs:
        // Only ROLE_FARM_OWNER (Cấp 2) automatically loads all farmIds belonging to Tenant.
        // For ROLE_FARM_MANAGER (Cấp 3) and Tier 4 roles (including ROLE_ACCOUNTANT), accessibleFarmIds is only taken
        // from user_farm_access, user_roles.farm_id, farms.manager_user_id, and farm_assignments of that user.
        Set<Long> accessibleFarmIds = new HashSet<>();
        if (tierLevel == 2 && user.getTenantId() != null) {
            List<Long> tenantFarmIds = jdbcTemplate.query(
                    "SELECT id FROM farms WHERE tenant_id = ? AND status != 'DELETED'",
                    (rs, rowNum) -> rs.getLong(1),
                    user.getTenantId()
            );
            accessibleFarmIds.addAll(tenantFarmIds);
        } else {
            List<Long> farmIds = jdbcTemplate.query(
                    "SELECT farm_id FROM user_farm_access WHERE user_id = ? AND farm_id IS NOT NULL " +
                            "UNION SELECT farm_id FROM user_roles WHERE user_id = ? AND farm_id IS NOT NULL " +
                            "UNION SELECT id AS farm_id FROM farms WHERE manager_user_id = ? AND status != 'DELETED' " +
                            "UNION SELECT farm_id FROM farm_assignments WHERE user_id = ? AND is_active = TRUE",
                    (rs, rowNum) -> rs.getLong(1),
                    user.getId(), user.getId(), user.getId(), user.getId()
            );
            accessibleFarmIds.addAll(farmIds);
        }

        return CustomUserDetails.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .passwordHash(user.getPasswordHash())
                .isSuperAdmin(Boolean.TRUE.equals(user.getIsSuperAdmin()))
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .roles(roles)
                .permissions(permissions)
                .accessibleFarmIds(accessibleFarmIds)
                .tierLevel(tierLevel)
                .build();
    }
}
