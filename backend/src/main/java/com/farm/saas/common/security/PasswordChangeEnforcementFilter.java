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
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordChangeEnforcementFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    private static final Set<String> ALLOWED_PATHS = Set.of(
            "/api/v1/auth/change-password",
            "/api/v1/auth/logout",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh"
    );

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof CustomUserDetails user) {
            if (user.isMustChangePassword()) {
                String path = request.getRequestURI();
                boolean isAllowed = ALLOWED_PATHS.stream().anyMatch(path::startsWith)
                        || path.startsWith("/actuator/health")
                        || path.startsWith("/v3/api-docs")
                        || path.startsWith("/swagger-ui");

                if (!isAllowed) {
                    log.warn("Blocked request to {} because user {} must change password", path, user.getUsername());
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");

                    ApiErrorResponse error = ApiErrorResponse.builder()
                            .timestamp(Instant.now())
                            .status(HttpStatus.FORBIDDEN.value())
                            .error("Forbidden")
                            .errorCode("FORCE_PASSWORD_CHANGE_REQUIRED")
                            .message("Tài khoản bắt buộc phải đổi mật khẩu trước khi tiếp tục thao tác trên hệ thống.")
                            .path(path)
                            .build();

                    response.getWriter().write(objectMapper.writeValueAsString(error));
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
