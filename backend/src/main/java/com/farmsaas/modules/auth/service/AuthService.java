package com.farmsaas.modules.auth.service;

import com.farmsaas.modules.auth.dto.AuthResult;
import com.farmsaas.modules.auth.dto.LoginRequest;

public interface AuthService {

    AuthResult login(LoginRequest request);
}
