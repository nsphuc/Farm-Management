package com.farm.saas.audit.aspect;

import com.farm.saas.audit.annotation.Auditable;
import com.farm.saas.audit.service.AuditService;
import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.security.auth.CustomUserDetails;
import com.farm.saas.security.auth.dto.LoginResponse;
import com.farm.saas.security.auth.dto.TokenRefreshResponse;
import com.farm.saas.security.auth.dto.UserInfoDto;
import com.farm.saas.security.jwt.JwtTokenProvider;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.annotation.Annotation;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock
    private AuditService auditService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private ProceedingJoinPoint joinPoint;

    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        auditAspect = new AuditAspect(auditService, jwtTokenProvider);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    private Auditable createAuditable(String action, String module) {
        return new Auditable() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return Auditable.class;
            }

            @Override
            public String action() {
                return action;
            }

            @Override
            public String module() {
                return module;
            }
        };
    }

    @Test
    @DisplayName("1. Audit Log: API LOGIN trích xuất đúng user_id và tenant_id từ LoginResponse trả về")
    void testAuditLoginExtractsUserAndTenantId() throws Throwable {
        Auditable auditable = createAuditable("LOGIN", "AUTH");

        UserInfoDto userInfo = UserInfoDto.builder()
                .id(6L)
                .tenantId(1L)
                .username("accountant")
                .build();

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken("mock-jwt-token")
                .user(userInfo)
                .build();

        ResponseEntity<ApiResponse<LoginResponse>> responseEntity =
                ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", loginResponse));

        when(joinPoint.proceed()).thenReturn(responseEntity);

        Object result = auditAspect.auditMethod(joinPoint, auditable);

        assertThat(result).isEqualTo(responseEntity);

        ArgumentCaptor<Long> tenantIdCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Long> userIdCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Integer> statusCodeCaptor = ArgumentCaptor.forClass(Integer.class);

        verify(auditService).recordAudit(
                tenantIdCaptor.capture(),
                userIdCaptor.capture(),
                eq("LOGIN"),
                eq("AUTH"),
                any(),
                any(),
                any(),
                any(),
                statusCodeCaptor.capture(),
                any(),
                any(),
                any(),
                any()
        );

        assertThat(tenantIdCaptor.getValue()).isEqualTo(1L);
        assertThat(userIdCaptor.getValue()).isEqualTo(6L);
        assertThat(statusCodeCaptor.getValue()).isEqualTo(200);
    }

    @Test
    @DisplayName("2. Audit Log: API REFRESH_TOKEN trích xuất đúng user_id và tenant_id từ JWT token mới")
    void testAuditRefreshTokenExtractsFromToken() throws Throwable {
        Auditable auditable = createAuditable("REFRESH_TOKEN", "AUTH");

        TokenRefreshResponse refreshResponse = TokenRefreshResponse.builder()
                .accessToken("mock-refreshed-jwt")
                .build();

        ResponseEntity<ApiResponse<TokenRefreshResponse>> responseEntity =
                ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", refreshResponse));

        when(joinPoint.proceed()).thenReturn(responseEntity);
        when(jwtTokenProvider.validateToken("mock-refreshed-jwt")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("mock-refreshed-jwt")).thenReturn(6L);
        when(jwtTokenProvider.getTenantIdFromToken("mock-refreshed-jwt")).thenReturn(1L);

        Object result = auditAspect.auditMethod(joinPoint, auditable);

        assertThat(result).isEqualTo(responseEntity);

        verify(auditService).recordAudit(
                eq(1L),
                eq(6L),
                eq("REFRESH_TOKEN"),
                eq("AUTH"),
                any(),
                any(),
                any(),
                any(),
                eq(200),
                any(),
                any(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("3. Audit Log: API nghiệp vụ có token trích xuất user_id và tenant_id từ SecurityContextHolder")
    void testAuditBusinessApiExtractsFromSecurityContext() throws Throwable {
        Auditable auditable = createAuditable("CREATE_FARM", "FARM");

        CustomUserDetails userDetails = CustomUserDetails.builder()
                .userId(2L)
                .tenantId(10L)
                .username("owner")
                .roles(Set.of("ROLE_FARM_OWNER"))
                .permissions(Set.of("PERM_FARM_CREATE"))
                .farmIds(List.of(100L))
                .build();

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        when(joinPoint.proceed()).thenReturn("OK");

        Object result = auditAspect.auditMethod(joinPoint, auditable);

        assertThat(result).isEqualTo("OK");

        verify(auditService).recordAudit(
                eq(10L),
                eq(2L),
                eq("CREATE_FARM"),
                eq("FARM"),
                any(),
                any(),
                any(),
                any(),
                eq(200),
                any(),
                any(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("4. Audit Log: Khi xảy ra AccessDeniedException, ghi nhận statusCode = 403 thay vì 500")
    void testAuditAccessDeniedRecords403() throws Throwable {
        Auditable auditable = createAuditable("CREATE_FARM", "FARM");

        when(joinPoint.proceed()).thenThrow(new AccessDeniedException("Access Denied"));

        assertThatThrownBy(() -> auditAspect.auditMethod(joinPoint, auditable))
                .isInstanceOf(AccessDeniedException.class);

        verify(auditService).recordAudit(
                any(),
                any(),
                eq("CREATE_FARM"),
                eq("FARM"),
                any(),
                any(),
                any(),
                any(),
                eq(403),
                any(),
                any(),
                any(),
                contains("Access Denied")
        );
    }

    @Test
    @DisplayName("5. Audit Log: Khi principal là anonymousUser không bị lỗi unbox hoặc NPE")
    void testAuditAnonymousUserHandledGracefully() throws Throwable {
        Auditable auditable = createAuditable("PUBLIC_ACTION", "PUBLIC");

        AnonymousAuthenticationToken anonymous = new AnonymousAuthenticationToken(
                "key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
        );
        SecurityContextHolder.getContext().setAuthentication(anonymous);

        when(joinPoint.proceed()).thenReturn("PUBLIC_RESULT");

        Object result = auditAspect.auditMethod(joinPoint, auditable);

        assertThat(result).isEqualTo("PUBLIC_RESULT");

        verify(auditService).recordAudit(
                isNull(),
                isNull(),
                eq("PUBLIC_ACTION"),
                eq("PUBLIC"),
                any(),
                any(),
                any(),
                any(),
                eq(200),
                any(),
                any(),
                any(),
                any()
        );
    }
}
