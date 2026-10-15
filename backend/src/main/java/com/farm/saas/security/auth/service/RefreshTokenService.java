package com.farm.saas.security.auth.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.security.entity.RefreshToken;
import com.farm.saas.security.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service quản lý vòng đời Refresh Token: cấp mới, xoay vòng (rotation), thu hồi (revocation)
 * và tạo HttpOnly Cookie an toàn. Tuân thủ DEC-05 (D-12).
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    public static final String REFRESH_TOKEN_COOKIE_NAME = "farm_saas_refresh_token";

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpirationMs;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs, // 7 ngày
            @Value("${app.jwt.cookie.secure:false}") boolean cookieSecure, // false cho local dev HTTP, true cho HTTPS production
            @Value("${app.jwt.cookie.same-site:Lax}") String cookieSameSite
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId, String ipAddress, String userAgent) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(refreshTokenExpirationMs);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .token(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""))
                .expiresAt(expiresAt)
                .revoked(false)
                .createdByIp(ipAddress)
                .userAgent(userAgent)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String tokenString, String ipAddress, String userAgent) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> AppException.unauthorized("Refresh Token khong hop le"));

        // Phát hiện Token Reuse Attack: Nếu token đã bị thu hồi trước đó mà lại được sử dụng tiếp
        if (Boolean.TRUE.equals(token.getRevoked())) {
            log.warn("CANH BAO AN NINH: Phat hien tai su dung Refresh Token da bi thu hoi! UserId: {}. He thong se thu hoi toan bo phien cua nguoi dung.", token.getUserId());
            refreshTokenRepository.revokeAllByUserId(token.getUserId(), Instant.now());
            throw AppException.unauthorized("Phat hien hanh vi tai su dung token bat hop phap. Vui long dang nhap lai!");
        }

        if (token.isExpired()) {
            refreshTokenRepository.revokeToken(token.getToken(), Instant.now());
            throw AppException.unauthorized("Refresh Token da het han. Vui long dang nhap lai!");
        }

        // Tạo refresh token mới thay thế
        RefreshToken newToken = createRefreshToken(token.getUserId(), ipAddress, userAgent);

        // Đánh dấu token cũ là revoked và ghi nhận replacedByToken
        token.setRevoked(true);
        token.setRevokedAt(Instant.now());
        token.setReplacedByToken(newToken.getToken());
        refreshTokenRepository.save(token);

        return newToken;
    }

    @Transactional
    public void revokeToken(String tokenString) {
        if (tokenString != null && !tokenString.isBlank()) {
            refreshTokenRepository.findByToken(tokenString).ifPresent(token -> {
                token.setRevoked(true);
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    public ResponseCookie generateRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .path("/api/v1/auth")
                .maxAge(refreshTokenExpirationMs / 1000)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .build();
    }

    public ResponseCookie generateCleanRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .path("/api/v1/auth")
                .maxAge(0)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .build();
    }
}
