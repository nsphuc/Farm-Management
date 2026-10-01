package com.farmsaas.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Authentication response containing in-memory Access Token and user profile details.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private long expiresIn;
    
    @Builder.Default
    private String tokenType = "Bearer";

    private Long userId;
    private Long tenantId;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
}
