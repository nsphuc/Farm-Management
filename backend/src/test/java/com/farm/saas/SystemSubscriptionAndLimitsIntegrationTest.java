package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.auth.dto.request.CreateUserRequest;
import com.farm.saas.modules.auth.dto.request.LoginRequest;
import com.farm.saas.modules.auth.entity.RefreshToken;
import com.farm.saas.modules.auth.entity.Role;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.RefreshTokenRepository;
import com.farm.saas.modules.auth.repository.RoleRepository;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.geography.dto.request.CreateFarmRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.farm.saas.modules.platform.dto.request.UpdateTenantStatusRequest;
import com.farm.saas.modules.platform.dto.response.TenantDetailResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class SystemSubscriptionAndLimitsIntegrationTest {

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
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private EntityManager entityManager;

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    /**
     * TC-SYS-002: Hạn mức Gói thuê bao (Subscription Quota Enforcement)
     * - Super Admin tạo Tenant mới với gói STARTER (max_farms = 1, max_users = 2).
     * - Tạo Farm 1 thành công; tạo Farm 2 bị chặn 403 SUBSCRIPTION_FARM_LIMIT_EXCEEDED.
     * - User Owner tạo User 1 thành công; tạo User 2 bị chặn 403 SUBSCRIPTION_USER_LIMIT_EXCEEDED.
     */
    @Test
    @DisplayName("TC-SYS-002: Subscription Limits Enforcement (max_farms & max_users)")
    void testSubscriptionLimitsEnforcement() throws Exception {
        String tokenSuperAdmin = getAccessToken("admin");
        long timestamp = System.currentTimeMillis();
        String tenantCode = "TNT_" + timestamp;
        String subdomain = "sub-" + timestamp;
        String ownerEmail = "owner_" + timestamp + "@starterfarm.vn";

        // 1. Super Admin tạo Tenant với max_farms = 1 và max_users = 2
        CreateTenantRequest createTenantReq = CreateTenantRequest.builder()
                .code(tenantCode)
                .name("Tenant Test Limits " + timestamp)
                .subdomain(subdomain)
                .planType("STARTER")
                .maxFarms(1)
                .maxUsers(2)
                .validFrom(LocalDate.now())
                .validTo(LocalDate.now().plusYears(1))
                .adminEmail(ownerEmail)
                .adminFullName("Tenant Owner " + timestamp)
                .adminPassword("Password@2026")
                .build();

        var tenantResult = mockMvc.perform(post("/api/v1/platform/tenants")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTenantReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(tenantCode))
                .andReturn();

        TenantDetailResponse createdTenant = objectMapper.readValue(
                tenantResult.getResponse().getContentAsString(), TenantDetailResponse.class);
        Long tenantId = createdTenant.getId();

        // 2. Tắt cờ mustChangePassword để cho phép Owner gọi API nghiệp vụ
        User ownerUser = userRepository.findByEmail(ownerEmail).orElseThrow();
        ownerUser.setMustChangePassword(false);
        userRepository.save(ownerUser);

        // 3. Lấy Access Token của Owner vừa được tạo
        String tokenOwner = getAccessToken(ownerEmail);

        // 3. Owner tạo Farm 1 -> Thành công (1/1)
        CreateFarmRequest farm1Req = CreateFarmRequest.builder()
                .code("FARM_LIMIT_01")
                .name("Trang Trại Số 1")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("15000.00"))
                .geofenceRadiusM(250)
                .address("Đà Lạt, Lâm Đồng")
                .build();

        var farm1Result = mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farm1Req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("FARM_LIMIT_01"))
                .andReturn();
        JsonNode farm1Node = objectMapper.readTree(farm1Result.getResponse().getContentAsString());
        Long farm1Id = farm1Node.get("id").asLong();

        // 4. Owner cố tình tạo Farm 2 -> Bị chặn 403 SUBSCRIPTION_FARM_LIMIT_EXCEEDED
        CreateFarmRequest farm2Req = CreateFarmRequest.builder()
                .code("FARM_LIMIT_02")
                .name("Trang Trại Số 2 (Vượt hạn mức)")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("10000.00"))
                .geofenceRadiusM(200)
                .address("Lâm Đồng")
                .build();

        mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farm2Req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("SUBSCRIPTION_FARM_LIMIT_EXCEEDED"));

        // 5. Kiểm tra hạn mức User (Hiện tại đã có 1 user là Owner, max_users = 2)
        Role techRole = roleRepository.findAll().stream()
                .filter(r -> "ROLE_ACCOUNTANT".equals(r.getCode()))
                .findFirst()
                .orElseThrow();

        // Tạo User thứ 2 -> Thành công (2/2)
        CreateUserRequest user2Req = CreateUserRequest.builder()
                .username("user_limit_2_" + timestamp)
                .email("user2_" + timestamp + "@starterfarm.vn")
                .fullName("Nhân Viên 2")
                .password("Password@2026")
                .roleIds(List.of(techRole.getId()))
                .assignedFarmIds(List.of(farm1Id))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user2Req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("user_limit_2_" + timestamp));

        // Tạo User thứ 3 -> Bị chặn 403 SUBSCRIPTION_USER_LIMIT_EXCEEDED
        CreateUserRequest user3Req = CreateUserRequest.builder()
                .username("user_limit_3_" + timestamp)
                .email("user3_" + timestamp + "@starterfarm.vn")
                .fullName("Nhân Viên 3 (Vượt hạn mức)")
                .password("Password@2026")
                .roleIds(List.of(techRole.getId()))
                .assignedFarmIds(List.of(farm1Id))
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user3Req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("SUBSCRIPTION_USER_LIMIT_EXCEEDED"));
    }

    /**
     * TC-SYS-003: Khóa Tenant (Suspended Tenant Immediate Rejection & Token Revocation)
     * - Khi Super Admin chuyển trạng thái Tenant sang SUSPENDED:
     *   1. JWT hiện tại của user thuộc Tenant đó lập tức bị từ chối 403 TENANT_SUSPENDED.
     *   2. Toàn bộ refresh_tokens của Tenant đó bị thu hồi (revoked = true).
     *   3. Thao tác gọi /api/v1/auth/refresh cũng bị từ chối 403 TENANT_SUSPENDED.
     */
    @Test
    @DisplayName("TC-SYS-003: Suspended Tenant Immediate Rejection & Token Revocation")
    void testSuspendedTenantRejection() throws Exception {
        String tokenSuperAdmin = getAccessToken("admin");
        long timestamp = System.currentTimeMillis();
        String tenantCode = "TNT_SUSP_" + timestamp;
        String subdomain = "susp-" + timestamp;
        String ownerEmail = "owner_susp_" + timestamp + "@greenfarm.vn";

        // 1. Tạo Tenant mới
        CreateTenantRequest createTenantReq = CreateTenantRequest.builder()
                .code(tenantCode)
                .name("Tenant To Suspend " + timestamp)
                .subdomain(subdomain)
                .planType("FREE")
                .maxFarms(2)
                .maxUsers(5)
                .validFrom(LocalDate.now())
                .validTo(LocalDate.now().plusYears(1))
                .adminEmail(ownerEmail)
                .adminFullName("Tenant Owner Suspended")
                .adminPassword("Password@2026")
                .build();

        var tenantResult = mockMvc.perform(post("/api/v1/platform/tenants")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTenantReq)))
                .andExpect(status().isCreated())
                .andReturn();

        TenantDetailResponse createdTenant = objectMapper.readValue(
                tenantResult.getResponse().getContentAsString(), TenantDetailResponse.class);
        Long tenantId = createdTenant.getId();

        // 2. Tắt mustChangePassword cho owner
        User user = userRepository.findByUsername(ownerEmail).orElseThrow();
        user.setMustChangePassword(false);
        userRepository.save(user);

        // 3. User đăng nhập để tạo Refresh Token & Access Token
        LoginRequest loginReq = LoginRequest.builder()
                .username(ownerEmail)
                .password("Password@2026")
                .build();

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie);
        String refreshTokenVal = refreshCookie.getValue();

        String userAccessToken = jwtTokenProvider.generateAccessToken(
                (CustomUserDetails) userDetailsService.loadUserByUsername(ownerEmail));

        // 4. Trước khi khóa: user gọi API GET /api/v1/farms thành công (200 OK)
        mockMvc.perform(get("/api/v1/farms")
                        .header("Authorization", "Bearer " + userAccessToken))
                .andExpect(status().isOk());

        // 4. Super Admin cập nhật trạng thái Tenant sang SUSPENDED
        UpdateTenantStatusRequest statusReq = UpdateTenantStatusRequest.builder()
                .status("SUSPENDED")
                .build();

        mockMvc.perform(put("/api/v1/platform/tenants/{id}/status", tenantId)
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // 5. Kiểm tra JWT hiện tại của User lập tức bị chặn 403 TENANT_SUSPENDED
        mockMvc.perform(get("/api/v1/farms")
                        .header("Authorization", "Bearer " + userAccessToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("TENANT_SUSPENDED"));

        // 6. Kiểm tra trong DB: Toàn bộ refresh_tokens của user thuộc Tenant đó đã bị thu hồi
        entityManager.clear();
        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(user.getId());
        assertFalse(tokens.isEmpty());
        for (RefreshToken rt : tokens) {
            assertTrue(rt.getRevoked(), "Tất cả refresh token của user thuộc suspended tenant phải bị thu hồi!");
        }

        // 7. Cố tình gọi refresh token với token đã bị thu hồi do khóa tenant -> Bị từ chối 401 REFRESH_TOKEN_REVOKED
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", refreshTokenVal)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("REFRESH_TOKEN_REVOKED"));
    }
}
