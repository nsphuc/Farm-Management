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

        // 2. Query permissions
        List<String> permissionCodes = jdbcTemplate.query(
                "SELECT DISTINCT p.code FROM user_roles ur " +
                        "JOIN role_permissions rp ON ur.role_id = rp.role_id " +
                        "JOIN permissions p ON rp.permission_id = p.id " +
                        "WHERE ur.user_id = ?",
                (rs, rowNum) -> rs.getString("code"),
                user.getId()
        );
        Set<String> permissions = new HashSet<>(permissionCodes);

        // 3. Query accessible farm IDs
        List<Long> farmIds = jdbcTemplate.query(
                "SELECT farm_id FROM user_farm_access WHERE user_id = ?",
                (rs, rowNum) -> rs.getLong("farm_id"),
                user.getId()
        );
        Set<Long> accessibleFarmIds = new HashSet<>(farmIds);

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
                .build();
    }
}
