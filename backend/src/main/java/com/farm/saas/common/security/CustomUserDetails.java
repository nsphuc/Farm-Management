package com.farm.saas.common.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private Long id;
    private Long tenantId;
    private String username;
    @JsonIgnore
    private String passwordHash;
    private boolean isSuperAdmin;
    private boolean mustChangePassword;

    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @Builder.Default
    private Set<String> permissions = new HashSet<>();

    @Builder.Default
    private Set<Long> accessibleFarmIds = new HashSet<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (roles != null) {
            for (String role : roles) {
                authorities.add(new SimpleGrantedAuthority(role));
            }
        }
        if (permissions != null) {
            for (String perm : permissions) {
                authorities.add(new SimpleGrantedAuthority(perm));
            }
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
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
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    public boolean hasAnyRole(String... checkRoles) {
        if (roles == null) return false;
        for (String r : checkRoles) {
            if (roles.contains(r)) {
                return true;
            }
        }
        return false;
    }

    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
}
