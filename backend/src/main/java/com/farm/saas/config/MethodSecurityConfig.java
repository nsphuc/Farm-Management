package com.farm.saas.config;

import com.farm.saas.security.authorization.SaasPermissionEvaluator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Cấu hình Method Security cho phép kiểm tra quyền bằng SpEL:
 * @PreAuthorize("hasAuthority('PERM_FARM_VIEW')")
 * hoặc @PreAuthorize("hasPermission(#farmId, 'FARM', 'PERM_FARM_VIEW')")
 */
@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {

    private final SaasPermissionEvaluator saasPermissionEvaluator;

    public MethodSecurityConfig(SaasPermissionEvaluator saasPermissionEvaluator) {
        this.saasPermissionEvaluator = saasPermissionEvaluator;
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(saasPermissionEvaluator);
        return handler;
    }
}
