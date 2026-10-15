package com.farm.saas.security.auth.controller;

import com.farm.saas.common.response.ApiResponse;
import com.farm.saas.security.auth.CustomUserDetails;
import com.farm.saas.security.auth.dto.LoginRequest;
import com.farm.saas.security.auth.dto.LoginResponse;
import com.farm.saas.security.auth.dto.TokenRefreshResponse;
import com.farm.saas.security.auth.dto.UserInfoDto;
import com.farm.saas.security.auth.service.AuthService;
import com.farm.saas.security.auth.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller tiếp nhận và điều phối các yêu cầu xác thực người dùng (Auth Transport).
 * Quản lý phiên làm việc bằng Access Token (JSON body) và Refresh Token (HttpOnly Cookie).
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & Authorization", description = "Các API phục vụ đăng nhập, cấp mới token và phiên làm việc")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Xác thực danh tính người dùng, trả về Bearer Access JWT và gắn HttpOnly Cookie Refresh Token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthService.AuthResult<LoginResponse> result = authService.login(request, httpRequest);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(ApiResponse.success("Đăng nhập thành công", result.data()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token", description = "Đọc Refresh Token từ HttpOnly Cookie, thực hiện Token Rotation và cấp Access Token mới")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @CookieValue(name = RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest httpRequest
    ) {
        AuthService.AuthResult<TokenRefreshResponse> result = authService.refreshToken(refreshToken, httpRequest);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(ApiResponse.success("Làm mới token thành công", result.data()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất tài khoản", description = "Thu hồi Refresh Token trong cơ sở dữ liệu và xóa HttpOnly Cookie")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = RefreshTokenService.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken
    ) {
        var cleanCookie = authService.logout(refreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .body(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Thông tin tài khoản hiện tại", description = "Lấy hồ sơ người dùng, danh sách vai trò, danh mục quyền và phạm vi trang trại của phiên đăng nhập")
    public ResponseEntity<ApiResponse<UserInfoDto>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserInfoDto userInfo = UserInfoDto.builder()
                .id(userDetails.getUserId())
                .tenantId(userDetails.getTenantId())
                .isSuperAdmin(userDetails.isSuperAdmin())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .fullName(userDetails.getFullName())
                .status(userDetails.getStatus())
                .roles(userDetails.getRoles())
                .permissions(userDetails.getPermissions())
                .farmIds(userDetails.getFarmIds())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", userInfo));
    }
}
