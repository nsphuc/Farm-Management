package com.farm.saas.security.auth;

import com.farm.saas.security.entity.User;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Custom UserDetails cài đặt Principal cho Spring Security.
 * Chứa đầy đủ user_id, tenant_id, is_super_admin, roles, farm_ids
 * và GrantedAuthorities là danh sách Permission Codes (tuân thủ DEC-01, roles-permissions.md).
 */
@Getter
@Builder
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final Long tenantId;
    private final boolean isSuperAdmin;
    private final String username;
    private final String password;
    private final String fullName;
    private final String email;
    private final String status;
    private final Set<String> roles;
    private final Set<String> permissions;
    private final List<Long> farmIds;
    private final boolean accountNonLocked;
    private final boolean enabled;

    public static CustomUserDetails fromUser(
            User user,
            Set<String> roles,
            Set<String> permissions,
            List<Long> farmIds
    ) {
        return CustomUserDetails.builder()
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .isSuperAdmin(Boolean.TRUE.equals(user.getIsSuperAdmin()))
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .status(user.getStatus())
                .roles(roles)
                .permissions(permissions)
                .farmIds(farmIds)
                .accountNonLocked(!user.isAccountLocked())
                .enabled(user.isActive())
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // GrantedAuthorities là các Permission Code (ví dụ PERM_FARM_VIEW, PERM_QC_APPROVE)
        return permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
