package com.farm.saas.config;

import com.farm.saas.common.exception.ErrorResponse;
import com.farm.saas.security.jwt.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.Instant;

/**
 * Spring Security 6.x Configuration cho Farm SaaS Modular Monolith.
 * Cấu hình bảo mật stateless JWT REST API, tắt form login mặc định,
 * phân quyền phương thức (@EnableMethodSecurity) và trả về lỗi chuẩn ErrorResponse.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints: Swagger / OpenAPI docs
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // Public endpoints: Health check & System status
                        .requestMatchers(
                                "/actuator/health",
                                "/api/v1/system/**",
                                "/error"
                        ).permitAll()
                        // Public authentication endpoints: login, refresh, logout
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/logout"
                        ).permitAll()
                        // Phân quyền tầng Web Filter: Chặn sớm các hành động Create/Update/Delete Danh mục & Vật tư
                        // Kế toán (ROLE_ACCOUNTANT), Nhân sự hiện trường chỉ được quyền xem (GET), không được phép Tạo/Sửa/Xóa (POST/PUT/DELETE)
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/v1/material-categories/**",
                                "/api/v1/materials/**",
                                "/api/v1/partners/**",
                                "/api/v1/warehouses/**",
                                "/api/v1/farms/*/warehouses/**",
                                "/api/v1/farms/*/cycles/**",
                                "/api/v1/farms/*/operational-cycles/**",
                                "/api/v1/cycles/**",
                                "/api/v1/operational-cycles/**"
                        ).hasAnyAuthority("ROLE_FARM_OWNER", "ROLE_TENANT_ADMIN", "PERM_FARM_UPDATE")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                "/api/v1/material-categories/**",
                                "/api/v1/materials/**",
                                "/api/v1/partners/**",
                                "/api/v1/warehouses/**",
                                "/api/v1/farms/*/warehouses/**",
                                "/api/v1/farms/*/cycles/**",
                                "/api/v1/farms/*/operational-cycles/**",
                                "/api/v1/cycles/**",
                                "/api/v1/operational-cycles/**"
                        ).hasAnyAuthority("ROLE_FARM_OWNER", "ROLE_TENANT_ADMIN", "PERM_FARM_UPDATE")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                "/api/v1/material-categories/**",
                                "/api/v1/materials/**",
                                "/api/v1/partners/**",
                                "/api/v1/warehouses/**",
                                "/api/v1/farms/*/warehouses/**",
                                "/api/v1/farms/*/cycles/**",
                                "/api/v1/farms/*/operational-cycles/**",
                                "/api/v1/cycles/**",
                                "/api/v1/operational-cycles/**"
                        ).hasAnyAuthority("ROLE_FARM_OWNER", "ROLE_TENANT_ADMIN", "PERM_FARM_UPDATE")
                        // Mọi endpoint nghiệp vụ khác bắt buộc đã xác thực
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            String correlationId = MDC.get("correlationId");
            if (correlationId == null) {
                correlationId = request.getHeader("X-Correlation-ID");
            }
            ErrorResponse errorResponse = ErrorResponse.builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                    .code("UNAUTHORIZED")
                    .message("Bạn cần đăng nhập để truy cập tài nguyên này")
                    .timestamp(Instant.now())
                    .correlationId(correlationId)
                    .build();
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            response.getWriter().flush();
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            String correlationId = MDC.get("correlationId");
            if (correlationId == null) {
                correlationId = request.getHeader("X-Correlation-ID");
            }
            ErrorResponse errorResponse = ErrorResponse.builder()
                    .status(HttpStatus.FORBIDDEN.value())
                    .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                    .code("INSUFFICIENT_PERMISSIONS")
                    .message("Bạn không có quyền thực hiện thao tác này")
                    .timestamp(Instant.now())
                    .correlationId(correlationId)
                    .build();
            response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
            response.getWriter().flush();
        };
    }
}
