package com.farm.saas.audit.aspect;

import com.farm.saas.audit.annotation.Auditable;
import com.farm.saas.audit.service.AuditService;
import com.farm.saas.common.exception.AppException;
import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.security.auth.CustomUserDetails;
import com.farm.saas.security.auth.dto.LoginResponse;
import com.farm.saas.security.auth.dto.TokenRefreshResponse;
import com.farm.saas.security.auth.dto.UserInfoDto;
import com.farm.saas.security.auth.service.AuthService;
import com.farm.saas.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Aspect tự động chặn và ghi nhận nhật ký Audit Log cho các phương thức được gắn @Auditable.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditService auditService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuditAspect(AuditService auditService, JwtTokenProvider jwtTokenProvider) {
        this.auditService = auditService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Around("@annotation(auditable)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        long startTime = System.currentTimeMillis();
        int statusCode = 200;
        Throwable errorThrown = null;
        Object result = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (AppException e) {
            statusCode = e.getStatus().value();
            errorThrown = e;
            throw e;
        } catch (AccessDeniedException e) {
            statusCode = 403;
            errorThrown = e;
            throw e;
        } catch (AuthenticationException e) {
            statusCode = 401;
            errorThrown = e;
            throw e;
        } catch (Throwable e) {
            statusCode = 500;
            errorThrown = e;
            throw e;
        } finally {
            long executionTimeMs = System.currentTimeMillis() - startTime;
            recordLog(auditable, statusCode, executionTimeMs, errorThrown, result);
        }
    }

    private void recordLog(Auditable auditable, int statusCode, long executionTimeMs, Throwable error, Object result) {
        try {
            HttpServletRequest request = null;
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                request = attributes.getRequest();
            }

            String endpoint = request != null ? request.getRequestURI() : "UNKNOWN";
            String method = request != null ? request.getMethod() : "UNKNOWN";
            String ipAddress = extractClientIp(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "UNKNOWN";
            String traceId = MDC.get("correlationId");

            // 1. Trích xuất user_id và tenant_id từ SecurityContextHolder (CustomUserDetails)
            Long userId = null;
            Long tenantId = null;

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof CustomUserDetails userDetails) {
                    userId = userDetails.getUserId();
                    tenantId = userDetails.getTenantId();
                }
            }

            // 2. Với LOGIN hoặc REFRESH_TOKEN (user chưa có trong SecurityContext), trích xuất từ kết quả trả về
            if (userId == null || tenantId == null) {
                ExtractedAuthInfo authInfo = extractAuthInfoFromResult(result);
                if (userId == null) {
                    userId = authInfo.userId();
                }
                if (tenantId == null) {
                    tenantId = authInfo.tenantId();
                }
            }

            // 3. Fallback: Nếu request có header Authorization Bearer token thì trích xuất từ token
            if ((userId == null || tenantId == null) && request != null) {
                String authHeader = request.getHeader("Authorization");
                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        if (jwtTokenProvider.validateToken(token)) {
                            if (userId == null) userId = jwtTokenProvider.getUserIdFromToken(token);
                            if (tenantId == null) tenantId = jwtTokenProvider.getTenantIdFromToken(token);
                        }
                    } catch (Exception ignored) {
                    }
                }
            }

            String errorMessage = error != null ? error.getMessage() : null;
            String newValueJson = errorMessage != null ? "{\"error\": \"" + errorMessage.replace("\"", "'") + "\"}" : null;

            auditService.recordAudit(
                    tenantId,
                    userId,
                    auditable.action(),
                    auditable.module(),
                    endpoint,
                    method,
                    ipAddress,
                    userAgent,
                    statusCode,
                    executionTimeMs,
                    traceId,
                    null,
                    newValueJson
            );
        } catch (Exception ignored) {
            // Đảm bảo không bao giờ gây gián đoạn luồng nghiệp vụ nếu AOP audit gặp sự cố
        }
    }

    private ExtractedAuthInfo extractAuthInfoFromResult(Object result) {
        if (result == null) {
            return new ExtractedAuthInfo(null, null);
        }

        Object payload = result;
        if (payload instanceof ResponseEntity<?> responseEntity) {
            payload = responseEntity.getBody();
        }
        if (payload instanceof ApiResponse<?> apiResponse) {
            payload = apiResponse.getData();
        }
        if (payload instanceof AuthService.AuthResult<?> authResult) {
            payload = authResult.data();
        }

        if (payload instanceof LoginResponse loginResponse) {
            Long userId = null;
            Long tenantId = null;
            if (loginResponse.getUser() != null) {
                userId = loginResponse.getUser().getId();
                tenantId = loginResponse.getUser().getTenantId();
            }
            if ((userId == null || tenantId == null) && StringUtils.hasText(loginResponse.getAccessToken())) {
                try {
                    String token = loginResponse.getAccessToken();
                    if (jwtTokenProvider.validateToken(token)) {
                        if (userId == null) userId = jwtTokenProvider.getUserIdFromToken(token);
                        if (tenantId == null) tenantId = jwtTokenProvider.getTenantIdFromToken(token);
                    }
                } catch (Exception ignored) {
                }
            }
            return new ExtractedAuthInfo(userId, tenantId);
        }

        if (payload instanceof TokenRefreshResponse refreshResponse) {
            Long userId = null;
            Long tenantId = null;
            if (StringUtils.hasText(refreshResponse.getAccessToken())) {
                try {
                    String token = refreshResponse.getAccessToken();
                    if (jwtTokenProvider.validateToken(token)) {
                        userId = jwtTokenProvider.getUserIdFromToken(token);
                        tenantId = jwtTokenProvider.getTenantIdFromToken(token);
                    }
                } catch (Exception ignored) {
                }
            }
            return new ExtractedAuthInfo(userId, tenantId);
        }

        if (payload instanceof UserInfoDto userInfo) {
            return new ExtractedAuthInfo(userInfo.getId(), userInfo.getTenantId());
        }

        return new ExtractedAuthInfo(null, null);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private record ExtractedAuthInfo(Long userId, Long tenantId) {}
}
