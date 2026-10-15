package com.farm.saas.security.auth;

import com.farm.saas.config.SecurityConfig;
import com.farm.saas.security.auth.controller.AuthController;
import com.farm.saas.security.auth.dto.LoginRequest;
import com.farm.saas.security.auth.dto.LoginResponse;
import com.farm.saas.security.auth.dto.TokenRefreshResponse;
import com.farm.saas.security.auth.dto.UserInfoDto;
import com.farm.saas.security.auth.service.AuthService;
import com.farm.saas.security.auth.service.RefreshTokenService;
import com.farm.saas.security.jwt.JwtAuthenticationFilter;
import com.farm.saas.security.jwt.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("1. POST /login - Đăng nhập thành công trả về Access Token và Set-Cookie HttpOnly")
    void loginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("Password@123")
                .build();

        UserInfoDto userInfo = UserInfoDto.builder()
                .id(1L)
                .tenantId(10L)
                .isSuperAdmin(false)
                .username("admin")
                .fullName("Farm Manager")
                .roles(Set.of("ROLE_FARM_OWNER"))
                .permissions(Set.of("PERM_FARM_VIEW", "PERM_QC_APPROVE"))
                .farmIds(List.of(100L))
                .build();

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken("mock-valid-access-token")
                .tokenType("Bearer")
                .expiresIn(900L)
                .user(userInfo)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from(RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, "mock-refresh-token")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(604800)
                .build();

        when(authService.login(any(LoginRequest.class), any())).thenReturn(
                new AuthService.AuthResult<>(loginResponse, refreshCookie)
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("farm_saas_refresh_token=mock-refresh-token")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-valid-access-token"))
                .andExpect(jsonPath("$.data.user.tenantId").value(10))
                .andExpect(jsonPath("$.data.user.username").value("admin"));
    }

    @Test
    @DisplayName("2. POST /login - Đăng nhập thất bại (sai mật khẩu) trả về 401 Unauthorized")
    void loginFailure() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("WrongPassword")
                .build();

        when(authService.login(any(LoginRequest.class), any()))
                .thenThrow(com.farm.saas.common.exception.AppException.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Tên đăng nhập hoặc mật khẩu không chính xác"));
    }

    @Test
    @DisplayName("3. POST /refresh - Làm mới token thành công khi gửi HttpOnly Cookie")
    void refreshSuccess() throws Exception {
        TokenRefreshResponse refreshResponse = TokenRefreshResponse.builder()
                .accessToken("mock-new-access-token")
                .tokenType("Bearer")
                .expiresIn(900L)
                .build();

        ResponseCookie newRefreshCookie = ResponseCookie.from(RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, "mock-rotated-refresh-token")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(604800)
                .build();

        when(authService.refreshToken(eq("mock-refresh-token"), any())).thenReturn(
                new AuthService.AuthResult<>(refreshResponse, newRefreshCookie)
        );

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie(RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, "mock-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("farm_saas_refresh_token=mock-rotated-refresh-token")))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock-new-access-token"));
    }

    @Test
    @DisplayName("4. POST /logout - Xóa Refresh Token và hủy cookie Max-Age=0")
    void logoutSuccess() throws Exception {
        ResponseCookie cleanCookie = ResponseCookie.from(RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(0)
                .build();

        when(authService.logout(any())).thenReturn(cleanCookie);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new Cookie(RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, "mock-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("5. GET /me - Yêu cầu chưa đăng nhập (không có Bearer Token) bị chặn với HTTP 401")
    void meEndpointUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Bạn cần đăng nhập để truy cập tài nguyên này"));
    }
}
