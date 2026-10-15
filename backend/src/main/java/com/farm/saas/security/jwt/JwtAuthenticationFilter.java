package com.farm.saas.security.jwt;

import com.farm.saas.security.auth.CustomUserDetails;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Filter chặn mọi HTTP request để kiểm tra Bearer Access Token trong header Authorization.
 * Trích xuất đầy đủ thông tin Principal (CustomUserDetails) gồm tenantId, roles, permissions, farmIds.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            Claims claims = jwtTokenProvider.getClaimsFromToken(token);
            String username = claims.getSubject();

            Object userIdObj = claims.get("userId");
            Long userId = userIdObj != null ? Long.valueOf(userIdObj.toString()) : null;

            Object tenantIdObj = claims.get("tenantId");
            Long tenantId = tenantIdObj != null ? Long.valueOf(tenantIdObj.toString()) : null;

            Object isSuperAdminObj = claims.get("isSuperAdmin");
            boolean isSuperAdmin = isSuperAdminObj != null && Boolean.parseBoolean(isSuperAdminObj.toString());

            @SuppressWarnings("unchecked")
            List<String> rolesList = claims.get("roles", List.class);
            Set<String> roles = rolesList != null ? new HashSet<>(rolesList) : Set.of();

            @SuppressWarnings("unchecked")
            List<String> permissionsList = claims.get("permissions", List.class);
            Set<String> permissions = permissionsList != null ? new HashSet<>(permissionsList) : Set.of();

            @SuppressWarnings("unchecked")
            List<Object> farmIdsObjList = claims.get("farmIds", List.class);
            List<Long> farmIds = farmIdsObjList != null
                    ? farmIdsObjList.stream().map(o -> Long.valueOf(o.toString())).toList()
                    : List.of();

            // Khởi tạo CustomUserDetails Principal hoàn chỉnh từ claims
            CustomUserDetails principal = CustomUserDetails.builder()
                    .userId(userId)
                    .tenantId(tenantId)
                    .isSuperAdmin(isSuperAdmin)
                    .username(username)
                    .password("") // Token stateless không cần lưu password hash
                    .fullName(username)
                    .email("")
                    .status("ACTIVE")
                    .roles(roles)
                    .permissions(permissions)
                    .farmIds(farmIds)
                    .accountNonLocked(true)
                    .enabled(true)
                    .build();

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities() // GrantedAuthority chứa các Permission Codes (ví dụ PERM_FARM_VIEW)
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
