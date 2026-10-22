package com.farm.saas.modules.auth.controller;

import com.farm.saas.modules.auth.dto.request.ChangePasswordRequest;
import com.farm.saas.modules.auth.dto.request.LoginRequest;
import com.farm.saas.modules.auth.dto.response.AuthResponse;
import com.farm.saas.modules.auth.dto.response.UserInfoDto;
import com.farm.saas.modules.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.ok(authService.login(request, httpRequest, httpResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestParam(name = "refreshToken", required = false) String paramRefreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String token = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : paramRefreshToken;

        if (token == null && httpRequest.getCookies() != null) {
            token = Arrays.stream(httpRequest.getCookies())
                    .filter(c -> "refreshToken".equals(c.getName()) || "refresh_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        return ResponseEntity.ok(authService.refreshToken(token, httpRequest, httpResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestParam(name = "refreshToken", required = false) String paramRefreshToken,
            HttpServletResponse httpResponse) {
        String token = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : paramRefreshToken;
        authService.logout(token, httpResponse);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.ok(authService.changePassword(request, httpRequest, httpResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoDto> getMe() {
        return ResponseEntity.ok(authService.getMe());
    }

    @GetMapping("/me/permissions")
    public ResponseEntity<List<String>> getMyPermissions() {
        return ResponseEntity.ok(authService.getMyPermissions());
    }
}
