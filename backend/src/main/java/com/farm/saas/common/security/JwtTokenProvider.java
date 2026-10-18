package com.farm.saas.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenValidityMs;

    public JwtTokenProvider(
            @Value("${security.jwt.secret:dGhpc19pc19hX3NlY3VyZV9mYXJtX3NhYXNfMjU2Yml0X2tleV9mb3Jfand0X3NpZ25pbmc=}") String secret,
            @Value("${security.jwt.access-token-validity-ms:1800000}") long accessTokenValidityMs) { // 30 mins
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidityMs = accessTokenValidityMs;
    }

    public String generateAccessToken(CustomUserDetails user) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidityMs);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("username", user.getUsername())
                .claim("tenantId", user.getTenantId())
                .claim("isSuperAdmin", user.isSuperAdmin())
                .claim("mustChangePassword", user.isMustChangePassword())
                .claim("roles", user.getRoles())
                .claim("permissions", user.getPermissions())
                .claim("accessibleFarmIds", user.getAccessibleFarmIds())
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SignatureException ex) {
            log.warn("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    public CustomUserDetails getUserDetailsFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long id = Long.parseLong(claims.getSubject());
        String username = claims.get("username", String.class);
        Number tenantIdNum = claims.get("tenantId", Number.class);
        Long tenantId = tenantIdNum != null ? tenantIdNum.longValue() : null;
        Boolean isSuperAdmin = claims.get("isSuperAdmin", Boolean.class);
        Boolean mustChangePassword = claims.get("mustChangePassword", Boolean.class);

        List<String> rolesList = claims.get("roles", List.class);
        Set<String> roles = rolesList != null ? new HashSet<>(rolesList) : new HashSet<>();

        List<String> permissionsList = claims.get("permissions", List.class);
        Set<String> permissions = permissionsList != null ? new HashSet<>(permissionsList) : new HashSet<>();

        List<Number> farmIdsList = claims.get("accessibleFarmIds", List.class);
        Set<Long> accessibleFarmIds = farmIdsList != null
                ? farmIdsList.stream().map(Number::longValue).collect(Collectors.toSet())
                : new HashSet<>();

        return CustomUserDetails.builder()
                .id(id)
                .username(username)
                .tenantId(tenantId)
                .isSuperAdmin(Boolean.TRUE.equals(isSuperAdmin))
                .mustChangePassword(Boolean.TRUE.equals(mustChangePassword))
                .roles(roles)
                .permissions(permissions)
                .accessibleFarmIds(accessibleFarmIds)
                .build();
    }
}
