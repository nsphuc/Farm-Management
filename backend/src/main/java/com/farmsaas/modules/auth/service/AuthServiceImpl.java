package com.farmsaas.modules.auth.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.modules.auth.dto.AuthResponse;
import com.farmsaas.modules.auth.dto.AuthResult;
import com.farmsaas.modules.auth.dto.LoginRequest;
import com.farmsaas.modules.user.entity.User;
import com.farmsaas.modules.user.repository.UserRepository;
import com.farmsaas.security.jwt.JwtService;
import com.farmsaas.security.service.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final int MAX_FAILED_LOGINS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    @Override
    @Transactional
    public AuthResult login(LoginRequest request) {
        String loginId = request.getLoginId().trim();

        User user = userRepository.findByUsernameOrEmailWithRoles(loginId)
                .orElseThrow(() -> new BusinessException(
                        "INVALID_CREDENTIALS",
                        "Tên đăng nhập hoặc mật khẩu không chính xác.",
                        HttpStatus.UNAUTHORIZED
                ));

        // 1. Kiểm tra trạng thái khóa tạm thời do nhập sai quá nhiều lần
        if (user.getLockUntil() != null) {
            if (user.getLockUntil().isAfter(Instant.now())) {
                long minutesLeft = ChronoUnit.MINUTES.between(Instant.now(), user.getLockUntil()) + 1;
                throw new BusinessException(
                        "ACCOUNT_LOCKED",
                        String.format("Tài khoản đã bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau %d phút.", minutesLeft),
                        HttpStatus.FORBIDDEN
                );
            } else {
                // Đã hết thời gian khóa, mở khóa tự động
                user.setLockUntil(null);
                user.setFailedLogins(0);
            }
        }

        // 2. Kiểm tra trạng thái tài khoản
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BusinessException(
                    "ACCOUNT_INACTIVE",
                    "Tài khoản chưa được kích hoạt hoặc đã bị tạm ngưng.",
                    HttpStatus.FORBIDDEN
            );
        }

        // 3. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int currentFails = user.getFailedLogins() + 1;
            user.setFailedLogins(currentFails);

            if (currentFails >= MAX_FAILED_LOGINS) {
                user.setLockUntil(Instant.now().plus(LOCK_DURATION_MINUTES, ChronoUnit.MINUTES));
                userRepository.save(user);
                log.warn("Tài khoản {} đã bị tạm khóa {} phút do đăng nhập sai {} lần liên tiếp", 
                        loginId, LOCK_DURATION_MINUTES, currentFails);
                throw new BusinessException(
                        "ACCOUNT_LOCKED",
                        String.format("Bạn đã nhập sai %d lần liên tiếp. Tài khoản bị tạm khóa %d phút.", MAX_FAILED_LOGINS, LOCK_DURATION_MINUTES),
                        HttpStatus.FORBIDDEN
                );
            }

            userRepository.save(user);
            int remainingAttempts = MAX_FAILED_LOGINS - currentFails;
            throw new BusinessException(
                    "INVALID_CREDENTIALS",
                    String.format("Tên đăng nhập hoặc mật khẩu không chính xác. Bạn còn %d lần thử.", remainingAttempts),
                    HttpStatus.UNAUTHORIZED
            );
        }

        // 4. Đăng nhập thành công -> Reset số lần đăng nhập sai
        if (user.getFailedLogins() > 0 || user.getLockUntil() != null) {
            user.setFailedLogins(0);
            user.setLockUntil(null);
            userRepository.save(user);
        }

        // 5. Khởi tạo Principal và cấp phát Token
        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        List<String> roleCodes = user.getRoles().stream()
                .map(r -> r.getCode())
                .toList();

        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .expiresIn(jwtService.getAccessTokenExpirationMs() / 1000)
                .tokenType("Bearer")
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleCodes)
                .build();

        log.info("Người dùng '{}' [Tenant: {}] đăng nhập thành công", user.getUsername(), user.getTenantId());
        return new AuthResult(response, refreshToken);
    }
}
