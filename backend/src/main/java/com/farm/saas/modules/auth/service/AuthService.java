package com.farm.saas.modules.auth.service;

import com.farm.saas.modules.auth.dto.request.ChangePasswordRequest;
import com.farm.saas.modules.auth.dto.request.LoginRequest;
import com.farm.saas.modules.auth.dto.response.AuthResponse;
import com.farm.saas.modules.auth.dto.response.UserInfoDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

public interface AuthService {
    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    AuthResponse refreshToken(String refreshToken, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    AuthResponse changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);
    void changePassword(ChangePasswordRequest request);
    void logout(String refreshToken, HttpServletResponse httpResponse);
    UserInfoDto getMe();
    List<String> getMyPermissions();
}
