package com.farmsaas.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Internal result carrying AuthResponse (JSON body) and RefreshToken (HttpOnly cookie).
 */
@Getter
@AllArgsConstructor
public class AuthResult {
    private final AuthResponse authResponse;
    private final String refreshToken;
}
