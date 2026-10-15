package com.farm.saas.security.authorization;

import com.farm.saas.config.MethodSecurityConfig;
import com.farm.saas.config.SecurityConfig;
import com.farm.saas.security.jwt.JwtAuthenticationFilter;
import com.farm.saas.security.jwt.JwtTokenProvider;
import com.farm.saas.security.scope.FarmBarrierGuardAspect;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TestFarmSecurityController.class)
@Import({
        SecurityConfig.class,
        MethodSecurityConfig.class,
        SaasPermissionEvaluator.class,
        JwtAuthenticationFilter.class,
        JwtTokenProvider.class,
        FarmBarrierGuardAspect.class
})
@EnableAspectJAutoProxy
class RbacSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String tokenWithoutFarmCreate;
    private String tokenWithFarmCreate;

    @BeforeEach
    void setUp() {
        // User A (Thợ làm vườn / Field Staff): Chỉ có PERM_FARM_VIEW, chỉ được vào Farm 100
        tokenWithoutFarmCreate = "Bearer " + jwtTokenProvider.generateAccessToken(
                1L,
                10L, // Tenant 10
                "field_worker",
                false,
                List.of("ROLE_FIELD_STAFF"),
                List.of("PERM_FARM_VIEW", "PERM_CROP_LOG"),
                List.of(100L) // Farm 100
        );

        // User B (Chủ trang trại / Farm Owner): Có PERM_FARM_CREATE, PERM_FARM_VIEW
        tokenWithFarmCreate = "Bearer " + jwtTokenProvider.generateAccessToken(
                2L,
                10L, // Tenant 10
                "farm_boss",
                false,
                List.of("ROLE_FARM_OWNER"),
                List.of("PERM_FARM_CREATE", "PERM_FARM_VIEW", "PERM_QC_APPROVE"),
                List.of(100L, 101L)
        );
    }

    @Test
    @DisplayName("1. User dang nhap thanh cong nhung thieu PERM_FARM_CREATE bi chan HTTP 403 Forbidden (/api/test/farms)")
    void missingPermissionReturns403() throws Exception {
        mockMvc.perform(post("/api/test/farms")
                        .header("Authorization", tokenWithoutFarmCreate))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này"));
    }

    @Test
    @DisplayName("1b. Kế toán có PERM_FINANCE_REPORT nhưng thiếu PERM_FARM_CREATE gọi POST /api/v1/farms bị chặn HTTP 403 Forbidden")
    void accountantMissingFarmCreateReturns403OnV1() throws Exception {
        String accountantToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                6L,
                1L,
                "accountant",
                false,
                List.of("ROLE_ACCOUNTANT"),
                List.of("PERM_FARM_VIEW", "PERM_INVENTORY_VIEW", "PERM_FINANCE_EXPENSE", "PERM_FINANCE_SALES_ORDER", "PERM_FINANCE_PAYMENT", "PERM_PAYMENT_ALLOCATE", "PERM_FINANCE_REPORT"),
                List.of(1L)
        );

        mockMvc.perform(post("/api/test/farms")
                        .header("Authorization", accountantToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thực hiện thao tác này"));
    }

    @Test
    @DisplayName("2. User co PERM_FARM_CREATE duoc phep tao trang trai (HTTP 200 OK)")
    void hasPermissionReturns200() throws Exception {
        mockMvc.perform(post("/api/test/farms")
                        .header("Authorization", tokenWithFarmCreate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("FARM_CREATED"));
    }

    @Test
    @DisplayName("3. Xac minh Principal chua dung tenant_id tu token")
    void verifyPrincipalTenantId() throws Exception {
        mockMvc.perform(get("/api/test/whoami")
                        .header("Authorization", tokenWithoutFarmCreate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(10));
    }

    @Test
    @DisplayName("4. The Farm Barrier Guard: Chan truy cap trai phep vao farm_id khong duoc phan cong (HTTP 403)")
    void barrierGuardBlocksUnauthorizedFarm() throws Exception {
        // User A chỉ được phân công Farm 100, cố truy cập Farm 200
        mockMvc.perform(get("/api/test/farms/200")
                        .header("Authorization", tokenWithoutFarmCreate))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("The Farm Barrier Guard")));
    }

    @Test
    @DisplayName("5. The Farm Barrier Guard: Cho phep truy cap khi farm_id nam trong danh sach phan cong (HTTP 200)")
    void barrierGuardAllowsAuthorizedFarm() throws Exception {
        // User A truy cập Farm 100 (hợp lệ)
        mockMvc.perform(get("/api/test/farms/100")
                        .header("Authorization", tokenWithoutFarmCreate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("FARM_DETAILS_100"));
    }

    @Test
    @DisplayName("6. Tenant Isolation: Chan truy cap trai phep vao Tenant khac (HTTP 403)")
    void barrierGuardBlocksCrossTenantAccess() throws Exception {
        // User A thuộc Tenant 10, cố truy cập dữ liệu của Tenant 99
        mockMvc.perform(get("/api/test/tenants/99/data")
                        .header("Authorization", tokenWithoutFarmCreate))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("The Farm Barrier Guard")));
    }
}
