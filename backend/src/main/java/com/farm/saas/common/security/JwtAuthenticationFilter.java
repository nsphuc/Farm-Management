package com.farm.saas.common.security;

import com.farm.saas.common.exception.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = extractJwtFromRequest(request);
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                CustomUserDetails userDetails = jwtTokenProvider.getUserDetailsFromToken(jwt);

                // Kiểm tra trạng thái Tenant (Chặn nếu Tenant bị SUSPENDED hoặc INACTIVE)
                if (userDetails.getTenantId() != null) {
                    try {
                        String tenantStatus = jdbcTemplate.queryForObject(
                                "SELECT status FROM tenants WHERE id = ?", String.class, userDetails.getTenantId());
                        if (!"ACTIVE".equalsIgnoreCase(tenantStatus)) {
                            log.warn("Blocked request from user {} because tenant {} is {}",
                                    userDetails.getUsername(), userDetails.getTenantId(), tenantStatus);

                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");

                            ApiErrorResponse error = ApiErrorResponse.builder()
                                    .timestamp(Instant.now())
                                    .status(HttpStatus.FORBIDDEN.value())
                                    .error("Forbidden")
                                    .errorCode("TENANT_SUSPENDED")
                                    .message("Tổ chức/Tenant của bạn đang bị tạm ngưng hoặc ngừng hoạt động.")
                                    .path(request.getRequestURI())
                                    .build();

                            response.getWriter().write(objectMapper.writeValueAsString(error));
                            return;
                        }
                    } catch (Exception ex) {
                        log.warn("Could not check tenant status: {}", ex.getMessage());
                    }
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
