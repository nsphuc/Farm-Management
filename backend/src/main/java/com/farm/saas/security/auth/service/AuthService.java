package com.farm.saas.security.auth.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.security.auth.CustomUserDetails;
import com.farm.saas.security.auth.CustomUserDetailsService;
import com.farm.saas.security.auth.dto.LoginRequest;
import com.farm.saas.security.auth.dto.LoginResponse;
import com.farm.saas.security.auth.dto.TokenRefreshResponse;
import com.farm.saas.security.auth.dto.UserInfoDto;
import com.farm.saas.security.entity.RefreshToken;
import com.farm.saas.security.entity.User;
import com.farm.saas.security.jwt.JwtTokenProvider;
import com.farm.saas.security.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Service xử lý toàn bộ nghiệp vụ xác thực người dùng: Đăng nhập, Làm mới token và Đăng xuất.
 * Tuân thủ các nguyên tắc bảo mật D-12 (Bearer Access JWT + HttpOnly Cookie Refresh Token).
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final int MAX_FAILED_LOGINS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            CustomUserDetailsService customUserDetailsService,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.customUserDetailsService = customUserDetailsService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResult<LoginResponse> login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String userAgent = extractUserAgent(httpRequest);

        // 1. Tìm user theo username hoặc email (bảo mật: không tiết lộ username/email có tồn tại hay không)
        User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getUsername())
                .orElseThrow(() -> AppException.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác"));

        // 2. Kiểm tra trạng thái tài khoản
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw AppException.unauthorized("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        if (user.isAccountLocked()) {
            throw AppException.unauthorized("Tài khoản đang tạm khóa do vượt quá số lần đăng nhập sai. Vui lòng thử lại sau.");
        }

        // 3. Đối chiếu mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw AppException.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        // 4. Mật khẩu đúng -> Reset số lần đăng nhập sai
        userRepository.resetFailedLogins(user.getId());

        // 5. Tải UserDetails đầy đủ roles, permissions, farm scopes
        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(user.getUsername());

        // 6. Sinh Bearer Access JWT
        List<String> rolesList = new ArrayList<>(userDetails.getRoles());
        List<String> permissionsList = new ArrayList<>(userDetails.getPermissions());
        List<Long> farmIdsList = userDetails.getFarmIds() != null ? userDetails.getFarmIds() : List.of();

        String accessToken = jwtTokenProvider.generateAccessToken(
                userDetails.getUserId(),
                userDetails.getTenantId(),
                userDetails.getUsername(),
                userDetails.isSuperAdmin(),
                rolesList,
                permissionsList,
                farmIdsList
        );

        // 7. Sinh Refresh Token và HttpOnly Cookie
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), clientIp, userAgent);
        ResponseCookie refreshCookie = refreshTokenService.generateRefreshTokenCookie(refreshToken.getToken());

        UserInfoDto userInfo = UserInfoDto.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .isSuperAdmin(user.getIsSuperAdmin())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roles(userDetails.getRoles())
                .permissions(userDetails.getPermissions())
                .farmIds(userDetails.getFarmIds())
                .build();

        LoginResponse responseBody = LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(userInfo)
                .build();

        log.info("Nguoi dung '{}' (ID: {}) dang nhap thanh cong tu IP: {}", user.getUsername(), user.getId(), clientIp);

        return new AuthResult<>(responseBody, refreshCookie);
    }

    @Transactional
    public AuthResult<TokenRefreshResponse> refreshToken(String refreshTokenStr, HttpServletRequest httpRequest) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw AppException.unauthorized("Yêu cầu không chứa Refresh Token hợp lệ");
        }

        String clientIp = extractClientIp(httpRequest);
        String userAgent = extractUserAgent(httpRequest);

        // 1. Xoay vòng Refresh Token (hỗ trợ phát hiện Token Reuse)
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenStr, clientIp, userAgent);

        // 2. Tải thông tin người dùng
        User user = userRepository.findById(newRefreshToken.getUserId())
                .orElseThrow(() -> AppException.unauthorized("Người dùng không còn tồn tại trong hệ thống"));

        if (!user.isActive()) {
            throw AppException.unauthorized("Tài khoản không còn hiệu lực để làm mới phiên làm việc");
        }

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(user.getUsername());

        // 3. Sinh Access Token mới
        List<String> rolesList = new ArrayList<>(userDetails.getRoles());
        List<String> permissionsList = new ArrayList<>(userDetails.getPermissions());
        List<Long> farmIdsList = userDetails.getFarmIds() != null ? userDetails.getFarmIds() : List.of();

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                userDetails.getUserId(),
                userDetails.getTenantId(),
                userDetails.getUsername(),
                userDetails.isSuperAdmin(),
                rolesList,
                permissionsList,
                farmIdsList
        );

        // 4. Sinh HttpOnly Cookie mới
        ResponseCookie newRefreshCookie = refreshTokenService.generateRefreshTokenCookie(newRefreshToken.getToken());

        TokenRefreshResponse responseBody = TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .build();

        return new AuthResult<>(responseBody, newRefreshCookie);
    }

    @Transactional
    public ResponseCookie logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenService.revokeToken(refreshTokenStr);
        }
        return refreshTokenService.generateCleanRefreshTokenCookie();
    }

    private void handleFailedLogin(User user) {
        int currentFailed = (user.getFailedLogins() != null ? user.getFailedLogins() : 0) + 1;
        if (currentFailed >= MAX_FAILED_LOGINS) {
            Instant lockUntil = Instant.now().plus(LOCK_DURATION);
            userRepository.lockUserAccount(user.getId(), lockUntil);
            log.warn("Tai khoan user ID {} bi tam khoa den {} do dang nhap sai {} lan", user.getId(), lockUntil, currentFailed);
        } else {
            userRepository.incrementFailedLogins(user.getId());
            log.warn("Nguoi dung ID {} dang nhap sai lan thu {}", user.getId(), currentFailed);
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String ua = request.getHeader("User-Agent");
        return ua != null ? ua : "UNKNOWN";
    }

    public record AuthResult<T>(T data, ResponseCookie cookie) {}
}
