package com.farmsaas;

import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@SpringBootTest
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
public class FarmServiceTest {

    @Autowired
    private org.springframework.test.web.servlet.MockMvc mockMvc;

    @Autowired
    private com.farmsaas.security.jwt.JwtService jwtService;

    @Autowired
    private com.farmsaas.modules.user.repository.UserRepository userRepo;

    @Test
    void testEndpointsWithMockMvc() throws Exception {
        var user = userRepo.findByUsernameOrEmailWithRoles("phuc").orElseThrow();
        var principal = com.farmsaas.security.service.UserPrincipal.create(user);
        String token = jwtService.generateAccessToken(principal);

        // 1. Kiểm tra /api/v1/farms/my-accessible khi KHÔNG có header X-Tenant-ID (fallback JWT claim)
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/farms/my-accessible")
                        .header("Authorization", "Bearer " + token)
        ).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

        // 2. Kiểm tra /api/v1/farms?page=0&size=9 khi CÓ header X-Tenant-ID
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/farms")
                        .param("page", "0")
                        .param("size", "9")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Tenant-ID", "1")
        ).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    }
}
