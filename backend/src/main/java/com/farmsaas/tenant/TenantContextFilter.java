package com.farmsaas.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter responsible for extracting X-Tenant-ID header and setting TenantContextHolder.
 * Guarantees TenantContextHolder.clear() is invoked in finally block to prevent memory leaks.
 */
@Slf4j
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    public static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String tenantHeaderValue = request.getHeader(TENANT_HEADER);

        try {
            if (StringUtils.hasText(tenantHeaderValue)) {
                try {
                    Long tenantId = Long.parseLong(tenantHeaderValue.trim());
                    TenantContextHolder.setTenantId(tenantId);
                } catch (NumberFormatException e) {
                    log.warn("Header X-Tenant-ID không hợp lệ: {}", tenantHeaderValue);
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            // Quy tắc bắt buộc: Phải xóa ThreadLocal ở khối finally
            TenantContextHolder.clear();
        }
    }
}
