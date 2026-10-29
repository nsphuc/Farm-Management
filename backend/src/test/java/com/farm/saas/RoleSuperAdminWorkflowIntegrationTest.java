package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.auth.dto.request.CreateUserRequest;
import com.farm.saas.modules.auth.dto.request.ResetPasswordRequest;
import com.farm.saas.modules.auth.dto.request.UpdateUserStatusRequest;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.farm.saas.modules.platform.dto.request.BroadcastNotificationRequest;
import com.farm.saas.modules.platform.dto.request.CreateSubscriptionRequest;
import com.farm.saas.modules.platform.dto.request.CreateTenantRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Integration Test cho vai trò Quản trị viên Tối cao Toàn Nền tảng (ROLE_SUPER_ADMIN)
 * Kiểm chứng toàn diện vòng đời quản trị và các mã GAP (GAP-SA-01 -> GAP-SA-08):
 * - GAP-SA-01 & GAP-SA-07: Platform Metrics API & Real-time Platform Health
 * - GAP-SA-02 & GAP-SA-04: Tenant Lifecycle, Owner Info enrichment & Subscription Upgrades
 * - GAP-SA-03: Onboarding Khách thuê trọn gói (Tenant + Subscription + Owner)
 * - GAP-SA-05: Quản trị Người dùng Toàn Nền tảng & Hỗ trợ Kỹ thuật Khẩn cấp (Status, Password Reset)
 * - GAP-SA-06: Sổ cái Kiểm toán Toàn cầu (Global Audit Logs)
 * - GAP-SA-08: Hệ thống Phát Thông báo Diện rộng Toàn Nền tảng (Broadcast Notifications)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class RoleSuperAdminWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private NotificationRepository notificationRepository;

    private String getAdminToken() {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername("admin");
        return jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("Kiểm thử trọn vẹn quy trình vận hành và kiểm soát của ROLE_SUPER_ADMIN")
    void testSuperAdminCompleteWorkflow() throws Exception {
        String token = getAdminToken();
        assertNotNull(token, "Admin token phải được tạo thành công");

        // =====================================================================
        // 1. GAP-SA-01 & GAP-SA-07: Platform Metrics & Health Check
        // =====================================================================
        mockMvc.perform(get("/api/v1/platform/metrics")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.databaseStatus", is("UP")))
                .andExpect(jsonPath("$.appliedMigrationsCount", greaterThanOrEqualTo(7)))
                .andExpect(jsonPath("$.totalTenants", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalUsers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.jvmUsedMemoryMb", greaterThan(0)))
                .andExpect(jsonPath("$.uptimeSeconds", greaterThanOrEqualTo(0)));

        // =====================================================================
        // 2. GAP-SA-03: Onboarding Khách thuê trọn gói (Tenant + Sub + Owner)
        // =====================================================================
        long timestamp = System.currentTimeMillis();
        String uniqueCode = "SAAS" + (timestamp % 10000);
        CreateTenantRequest createTenantReq = CreateTenantRequest.builder()
                .code(uniqueCode)
                .name("Doanh Nghiệp Thử Nghiệm " + uniqueCode)
                .subdomain("tenant" + uniqueCode.toLowerCase())
                .planType("PROFESSIONAL")
                .maxFarms(5)
                .maxUsers(20)
                .adminFullName("Chủ Đầu Tư " + uniqueCode)
                .adminEmail("owner_" + uniqueCode.toLowerCase() + "@saasfarm.vn")
                .adminPassword("Owner@123456")
                .validFrom(LocalDate.now())
                .validTo(LocalDate.now().plusMonths(12))
                .build();

        MvcResult createTenantResult = mockMvc.perform(post("/api/v1/platform/tenants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTenantReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is(uniqueCode)))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.ownerFullName", containsString("Chủ Đầu Tư")))
                .andReturn();

        JsonNode createdTenantJson = objectMapper.readTree(createTenantResult.getResponse().getContentAsString());
        Long createdTenantId = createdTenantJson.get("id").asLong();
        assertNotNull(createdTenantId, "Tenant ID mới phải không null");

        // =====================================================================
        // 3. GAP-SA-04: Nâng cấp gói cước và gia hạn hạn mức cho Tenant
        // =====================================================================
        CreateSubscriptionRequest upgradeSubReq = CreateSubscriptionRequest.builder()
                .planType("ENTERPRISE")
                .maxFarms(50)
                .maxUsers(200)
                .validFrom(LocalDate.now())
                .validTo(LocalDate.now().plusMonths(24))
                .build();

        mockMvc.perform(post("/api/v1/platform/tenants/" + createdTenantId + "/subscriptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(upgradeSubReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeSubscription.planType", is("ENTERPRISE")))
                .andExpect(jsonPath("$.activeSubscription.maxFarms", is(50)))
                .andExpect(jsonPath("$.activeSubscription.maxUsers", is(200)));

        // =====================================================================
        // 4. GAP-SA-05: Super Admin tạo bổ sung tài khoản người dùng cho Tenant
        // =====================================================================
        CreateUserRequest createAdditionalUserReq = CreateUserRequest.builder()
                .tenantId(createdTenantId)
                .username("co_owner_" + uniqueCode.toLowerCase())
                .fullName("Đồng Sở Hữu " + uniqueCode)
                .email("co_owner_" + uniqueCode.toLowerCase() + "@saasfarm.vn")
                .phone("0907" + (timestamp % 1000000))
                .password("CoOwner@123456")
                .build();

        MvcResult createUserResult = mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createAdditionalUserReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId", is(createdTenantId.intValue())))
                .andExpect(jsonPath("$.username", is("co_owner_" + uniqueCode.toLowerCase())))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andReturn();

        JsonNode createdUserJson = objectMapper.readTree(createUserResult.getResponse().getContentAsString());
        Long newUserId = createdUserJson.get("id").asLong();
        assertNotNull(newUserId, "User ID mới phải không null");

        // Lọc người dùng theo tenantId vừa tạo
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .param("tenantId", String.valueOf(createdTenantId))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(2))));

        // =====================================================================
        // 5. GAP-SA-05: Hỗ trợ Khẩn Cấp: Khóa/Mở khóa & Đặt lại mật khẩu
        // =====================================================================
        // 5.1 Khóa tài khoản
        UpdateUserStatusRequest lockReq = UpdateUserStatusRequest.builder()
                .status("LOCKED")
                .build();

        mockMvc.perform(put("/api/v1/users/" + newUserId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("LOCKED")));

        // 5.2 Đặt lại mật khẩu khẩn cấp (tự động mở khóa và bật mustChangePassword = true)
        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .newPassword("Emergency@999888")
                .build();

        mockMvc.perform(post("/api/v1/users/" + newUserId + "/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword", is(true)))
                .andExpect(jsonPath("$.tempPassword", is("Emergency@999888")));

        // =====================================================================
        // 6. GAP-SA-08: Phát thông báo hệ thống diện rộng (Broadcast Notification)
        // =====================================================================
        BroadcastNotificationRequest broadcastReq = BroadcastNotificationRequest.builder()
                .title("Thông báo bảo trì máy chủ")
                .message("Hệ thống Agri-ERP sẽ bảo trì trong 15 phút.")
                .type("SYSTEM")
                .targetTenantId(createdTenantId)
                .onlyOwners(true)
                .build();

        mockMvc.perform(post("/api/v1/platform/notifications/broadcast")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(broadcastReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipientCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.type", is("SYSTEM")));

        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> "PLATFORM_BROADCAST".equals(n.getReferenceType()) && createdTenantId.equals(n.getTenantId()))
                .toList();
        assertFalse(notifications.isEmpty(), "Bản ghi Notification diện rộng phải được lưu vào cơ sở dữ liệu");

        // =====================================================================
        // 7. GAP-SA-06: Truy vấn Sổ cái Kiểm toán Toàn cầu (Global Audit Logs)
        // =====================================================================
        mockMvc.perform(get("/api/v1/system/audit-logs")
                        .header("Authorization", "Bearer " + token)
                        .param("module", "PLATFORM")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }
}
