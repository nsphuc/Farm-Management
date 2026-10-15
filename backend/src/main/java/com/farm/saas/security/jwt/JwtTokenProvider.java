package com.farm.saas.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * JWT Token Provider xử lý khởi tạo, trích xuất và kiểm tra tính hợp lệ của Bearer Access JWT.
 * Tuân thủ quyết định DEC-05 (D-12): Bearer Access JWT ngắn hạn (15 phút).
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long accessTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:farm-saas-platform-super-secret-key-that-is-at-least-256-bits-long-2026!}") String secret,
            @Value("${app.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs // 15 phút
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(
            Long userId,
            Long tenantId,
            String username,
            boolean isSuperAdmin,
            List<String> roles,
            List<String> permissions,
            List<Long> farmIds
    ) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("tenantId", tenantId)
                .claim("isSuperAdmin", isSuperAdmin)
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("farmIds", farmIds)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public Long getTenantIdFromToken(String token) {
        Object tenantId = getClaimsFromToken(token).get("tenantId");
        return tenantId != null ? Long.valueOf(tenantId.toString()) : null;
    }

    public Long getUserIdFromToken(String token) {
        Object userId = getClaimsFromToken(token).get("userId");
        return userId != null ? Long.valueOf(userId.toString()) : null;
    }

    public Boolean isSuperAdminFromToken(String token) {
        Object isSuperAdmin = getClaimsFromToken(token).get("isSuperAdmin");
        return isSuperAdmin != null && Boolean.parseBoolean(isSuperAdmin.toString());
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }
}
