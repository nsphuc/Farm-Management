package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.auth.dto.request.ChangePasswordRequest;
import com.farm.saas.modules.auth.dto.request.LoginRequest;
import com.farm.saas.modules.auth.entity.RefreshToken;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.RefreshTokenRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class SecurityAndTenantIsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Farm farmTenant2;
    private Warehouse warehouseTenant2;

    @BeforeEach
    void setUp() {
        // Đảm bảo có Farm thuộc Tenant 2
        farmTenant2 = farmRepository.findByTenantIdAndCode(2L, "FARM_T2_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(2L)
                        .code("FARM_T2_TEST")
                        .name("Nông Trại Tenant 2")
                        .farmType("CROP")
                        .totalAreaM2(new BigDecimal("20000.00"))
                        .geofenceRadiusM(300)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        warehouseTenant2 = warehouseRepository.findByFarmIdAndCode(farmTenant2.getId(), "WH_T2_TEST")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(2L)
                        .farmId(farmTenant2.getId())
                        .code("WH_T2_TEST")
                        .name("Kho Vật Tư Tenant 2")
                        .warehouseType("GENERAL")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
    }

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    /**
     * TC-SEC-001: User Tenant 1 gọi xem/sửa Kho hoặc Trang trại của Tenant 2 -> Bị chặn 403 Forbidden / 404 Not Found.
     */
    @Test
    @DisplayName("TC-SEC-001: Cross-Tenant Access Barrier (Tenant 1 truy cập tài nguyên Tenant 2 bị chặn)")
    void testCrossTenantAccessBarrier() throws Exception {
        String tokenOwnerT1 = getAccessToken("owner"); // Tenant 1

        // 1. User Tenant 1 cố tình truy cập chi tiết Farm của Tenant 2
        mockMvc.perform(get("/api/v1/farms/{farmId}", farmTenant2.getId())
                        .header("Authorization", "Bearer " + tokenOwnerT1))
                .andExpect(status().isForbidden());

        // 2. User Tenant 1 cố tình xem danh sách Kho của Farm thuộc Tenant 2
        mockMvc.perform(get("/api/v1/farms/{farmId}/warehouses", farmTenant2.getId())
                        .header("Authorization", "Bearer " + tokenOwnerT1))
                .andExpect(status().isForbidden());

        // 3. User Tenant 1 cố tình xem chu kỳ vận hành của Farm thuộc Tenant 2
        mockMvc.perform(get("/api/v1/farms/{farmId}/cycles", farmTenant2.getId())
                        .header("Authorization", "Bearer " + tokenOwnerT1))
                .andExpect(status().isForbidden());
    }

    /**
     * TC-SEC-002: User ROLE_FIELD_STAFF chỉ được cấp quyền Farm 1 cố tình gọi API của Farm 2 -> Bị @farmSecurity chặn 403.
     */
    @Test
    @DisplayName("TC-SEC-002: Farm Barrier Guard (Nhân viên chỉ có quyền Farm 1 gọi API Farm 2 bị chặn 403)")
    void testFarmBarrierGuard() throws Exception {
        String tokenStaffFarm1 = getAccessToken("staff"); // User 3 thuộc Tenant 1, chỉ có access Farm 1

        // Cố tình truy cập Farm 2 (Tenant 2) mà không có trong accessibleFarmIds
        mockMvc.perform(get("/api/v1/farms/{farmId}", farmTenant2.getId())
                        .header("Authorization", "Bearer " + tokenStaffFarm1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        // Cố tình xem phân khu Farm 2
        mockMvc.perform(get("/api/v1/farms/{farmId}/zones", farmTenant2.getId())
                        .header("Authorization", "Bearer " + tokenStaffFarm1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    /**
     * TC-SEC-004:
     * Part 1: User có must_change_password = true bị chặn 403 FORCE_PASSWORD_CHANGE_REQUIRED cho tới khi đổi mật khẩu thành công.
     * Part 2: Xoay vòng Refresh Token & Phát hiện Token Replay Attack.
     */
    @Test
    @DisplayName("TC-SEC-004: Force Password Change Enforcement, Token Rotation & Replay Attack Detection")
    void testForcePasswordChangeAndTokenReplayAttack() throws Exception {
        // --- PART 1: must_change_password enforcement ---
        String testUsername = "user_change_pwd_" + System.currentTimeMillis();
        User testUser = userRepository.save(User.builder()
                .tenantId(1L)
                .username(testUsername)
                .email(testUsername + "@greenfarm.vn")
                .fullName("User Test Change Password")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .isSuperAdmin(false)
                .status("ACTIVE")
                .mustChangePassword(true)
                .failedLogins(0)
                .createdAt(Instant.now())
                .build());

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(testUsername);
        String tokenWithMustChange = jwtTokenProvider.generateAccessToken(userDetails);

        // 1. Gọi API nghiệp vụ (GET /api/v1/farms) -> Bị chặn 403 FORCE_PASSWORD_CHANGE_REQUIRED
        mockMvc.perform(get("/api/v1/farms")
                        .header("Authorization", "Bearer " + tokenWithMustChange))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORCE_PASSWORD_CHANGE_REQUIRED"));

        // 2. Gọi API đổi mật khẩu -> Thành công 200 OK
        ChangePasswordRequest changeReq = ChangePasswordRequest.builder()
                .oldPassword("Password@123")
                .newPassword("Password@2026NewSecure!")
                .build();

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenWithMustChange)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk());

        // Kiểm tra mustChangePassword đã thành false trong DB
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertFalse(updatedUser.getMustChangePassword());

        // --- PART 2: Refresh Token Rotation & Replay Attack Detection ---
        // Đăng nhập lại với mật khẩu mới để lấy token
        LoginRequest loginReq = LoginRequest.builder()
                .username(testUsername)
                .password("Password@2026NewSecure!")
                .build();

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        Cookie refreshCookie1 = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie1);
        String token1 = refreshCookie1.getValue();

        // 1. Xoay vòng Refresh Token hợp lệ lần 1
        var refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", token1)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        Cookie refreshCookie2 = refreshResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie2);
        String token2 = refreshCookie2.getValue();
        assertNotEquals(token1, token2);

        // Xác nhận trong DB: token1 đã bị thu hồi (revoked = true)
        RefreshToken dbToken1 = refreshTokenRepository.findByToken(token1).orElseThrow();
        assertTrue(dbToken1.getRevoked());
        assertEquals(token2, dbToken1.getReplacedByToken());

        // 2. Kẻ tấn công cố tình REPLAY token1 cũ đã bị thu hồi
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", token1)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("REFRESH_TOKEN_REVOKED"));

        // Xác nhận trong DB: TOÀN BỘ refresh token của user đó đã bị khóa lập tức!
        List<RefreshToken> allTokens = refreshTokenRepository.findByUserId(testUser.getId());
        assertFalse(allTokens.isEmpty());
        for (RefreshToken rt : allTokens) {
            assertTrue(rt.getRevoked(), "Tất cả refresh token của user phải bị thu hồi sau Replay Attack!");
        }
    }
}
