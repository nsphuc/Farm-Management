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
                .roles(roles != null ? roles : java.util.Collections.emptySet())
                .permissions(permissions != null ? permissions : java.util.Collections.emptySet())
                .farmIds(farmIds != null ? farmIds : java.util.Collections.emptyList())
                .accountNonLocked(!user.isAccountLocked())
                .enabled(user.isActive())
                .build();
    }

    public Set<String> getRoles() {
        return roles != null ? roles : java.util.Collections.emptySet();
    }

    public Set<String> getPermissions() {
        return permissions != null ? permissions : java.util.Collections.emptySet();
    }

    public List<Long> getFarmIds() {
        return farmIds != null ? farmIds : java.util.Collections.emptyList();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new java.util.HashSet<>();
        if (permissions != null) {
            permissions.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(String::trim)
                    .filter(p -> !p.isBlank())
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        }
        if (roles != null) {
            roles.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(String::trim)
                    .filter(r -> !r.isBlank())
                    .forEach(r -> {
                        String roleWithPrefix = r.startsWith("ROLE_") ? r : "ROLE_" + r;
                        authorities.add(new SimpleGrantedAuthority(roleWithPrefix));
                        authorities.add(new SimpleGrantedAuthority(r));
                    });
        }
        return authorities;
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
