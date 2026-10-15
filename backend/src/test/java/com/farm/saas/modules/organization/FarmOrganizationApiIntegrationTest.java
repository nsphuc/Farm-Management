package com.farm.saas.modules.organization;

import com.farm.saas.modules.organization.dto.request.FarmCreateRequest;
import com.farm.saas.modules.organization.dto.request.FarmUpdateRequest;
import com.farm.saas.modules.organization.dto.request.ProductionZoneCreateRequest;
import com.farm.saas.modules.organization.dto.request.ZoneLocationCreateRequest;
import com.farm.saas.modules.organization.entity.Farm;
import com.farm.saas.modules.organization.entity.ProductionZone;
import com.farm.saas.modules.organization.entity.ZoneLocation;
import com.farm.saas.modules.organization.repository.FarmRepository;
import com.farm.saas.modules.organization.repository.ProductionZoneRepository;
import com.farm.saas.modules.organization.repository.ZoneLocationRepository;
import com.farm.saas.security.jwt.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FarmOrganizationApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private ProductionZoneRepository productionZoneRepository;

    @Autowired
    private ZoneLocationRepository zoneLocationRepository;

    private String ownerToken;       // Tenant 1, có đầy đủ PERM_FARM_*, PERM_ZONE_MANAGE
    private String accountantToken;  // Tenant 1, có PERM_FINANCE_*, không có PERM_FARM_CREATE, PERM_ZONE_MANAGE
    private String staffFarm1Token;   // Tenant 1, Field Staff chỉ được vào Farm 1
    private String otherTenantToken; // Tenant 99, hoàn toàn cách ly với Tenant 1

    private Farm testFarm;
    private ProductionZone testZone;

    @BeforeEach
    void setUp() {
        // 1. Tạo JWT tokens cho các vai trò kiểm thử
        ownerToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                2L, 1L, "owner", false,
                List.of("ROLE_FARM_OWNER"),
                List.of("PERM_FARM_VIEW", "PERM_FARM_CREATE", "PERM_FARM_UPDATE", "PERM_ZONE_MANAGE"),
                List.of(1L)
        );

        accountantToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                6L, 1L, "accountant", false,
                List.of("ROLE_ACCOUNTANT"),
                List.of("PERM_FARM_VIEW", "PERM_FINANCE_REPORT"),
                List.of(1L)
        );

        staffFarm1Token = "Bearer " + jwtTokenProvider.generateAccessToken(
                3L, 1L, "staff", false,
                List.of("ROLE_FIELD_STAFF"),
                List.of("PERM_FARM_VIEW", "PERM_CROP_LOG"),
                List.of(1L) // Chỉ có quyền Farm 1
        );

        otherTenantToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                999L, 99L, "other_owner", false,
                List.of("ROLE_FARM_OWNER"),
                List.of("PERM_FARM_VIEW", "PERM_FARM_CREATE", "PERM_FARM_UPDATE", "PERM_ZONE_MANAGE"),
                List.of(999L)
        );

        // 2. Chuẩn bị dữ liệu mẫu trong DB
        testFarm = farmRepository.save(Farm.builder()
                .tenantId(1L)
                .code("FARM_TEST_AUTO_01")
                .name("Trang Trại Test Tự Động 01")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("10000.00"))
                .status("ACTIVE")
                .build());

        testZone = productionZoneRepository.save(ProductionZone.builder()
                .tenantId(1L)
                .farmId(testFarm.getId())
                .code("ZONE_TEST_01")
                .name("Khu Nhà Màng 01")
                .zoneType("GREENHOUSE")
                .areaM2(new BigDecimal("2500.00"))
                .status("ACTIVE")
                .build());
    }

    // =========================================================================
    // 1. FARM CONTROLLER TESTS
    // =========================================================================

    @Test
    @DisplayName("1.1 Kế toán thiếu PERM_FARM_CREATE gọi POST /api/v1/farms bị từ chối 403 Forbidden")
    void accountantCreatingFarmReturns403() throws Exception {
        FarmCreateRequest req = FarmCreateRequest.builder()
                .code("FARM_NEW_01")
                .name("Trang Trại Rau Củ Mới")
                .farmType("CROP")
                .totalAreaM2(new BigDecimal("5000.00"))
                .build();

        mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", accountantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }

    @Test
    @DisplayName("1.2 Chủ trang trại có PERM_FARM_CREATE tạo trang trại thành công (201 Created)")
    void ownerCreatingFarmReturns201() throws Exception {
        FarmCreateRequest req = FarmCreateRequest.builder()
                .code("FARM_NEW_UNIQUE_02")
                .name("Trang Trại Bò Sữa")
                .farmType("LIVESTOCK")
                .totalAreaM2(new BigDecimal("20000.00"))
                .build();

        mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("FARM_NEW_UNIQUE_02"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.tenantId").value(1));
    }

    @Test
    @DisplayName("1.3 Trùng mã code trang trại trong cùng một Tenant trả về 409 Conflict")
    void duplicateFarmCodeReturns409() throws Exception {
        FarmCreateRequest req = FarmCreateRequest.builder()
                .code("FARM_TEST_AUTO_01") // Đã tồn tại trong setUp
                .name("Trang Trại Trùng Mã")
                .farmType("MIXED")
                .totalAreaM2(new BigDecimal("1000.00"))
                .build();

        mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.code").value("DATA_CONFLICT"));
    }

    @Test
    @DisplayName("1.4 Tenant Isolation: Người dùng Tenant 99 không thể đọc Farm của Tenant 1 (404 Not Found)")
    void tenantIsolationPreventsAccessToOtherTenantFarm() throws Exception {
        mockMvc.perform(get("/api/v1/farms/" + testFarm.getId())
                        .header("Authorization", otherTenantToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("1.5 Cập nhật trang trại thành công và không bị ghi đè tenantId (200 OK)")
    void updateFarmSuccess() throws Exception {
        FarmUpdateRequest req = FarmUpdateRequest.builder()
                .name("Trang Trại Đã Đổi Tên")
                .farmType("MIXED")
                .totalAreaM2(new BigDecimal("12000.00"))
                .address("Đà Lạt, Lâm Đồng")
                .build();

        mockMvc.perform(put("/api/v1/farms/" + testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Trang Trại Đã Đổi Tên"))
                .andExpect(jsonPath("$.data.farmType").value("MIXED"));
    }

    @Test
    @DisplayName("1.6 Xóa trang trại thực hiện Soft-delete chuyển status sang INACTIVE (Không xóa vật lý)")
    void softDeleteFarmUpdatesStatusToInactive() throws Exception {
        mockMvc.perform(delete("/api/v1/farms/" + testFarm.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Farm reloaded = farmRepository.findById(testFarm.getId()).orElseThrow();
        assertEquals("INACTIVE", reloaded.getStatus(), "Trang trại phải chuyển sang trạng thái INACTIVE");
    }

    // =========================================================================
    // 2. PRODUCTION ZONE CONTROLLER TESTS (THE FARM BARRIER GUARD)
    // =========================================================================

    @Test
    @DisplayName("2.1 Nhân viên chỉ gán Farm 1 bị chặn 403 khi truy cập Farm 999 (The Farm Barrier Guard)")
    void staffAccessingUnauthorizedFarmIsBlockedByBarrierGuard() throws Exception {
        mockMvc.perform(get("/api/v1/farms/999/zones")
                        .header("Authorization", staffFarm1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }

    @Test
    @DisplayName("2.2 Tạo phân khu sản xuất thành công với The Farm Barrier Guard (201 Created)")
    void createProductionZoneSuccess() throws Exception {
        ProductionZoneCreateRequest req = ProductionZoneCreateRequest.builder()
                .code("ZONE_NEW_BARN_02")
                .name("Khu Chuồng Bò 02")
                .zoneType("BARN")
                .areaM2(new BigDecimal("3000.00"))
                .soilType("Đất đỏ bazan")
                .waterSource("Giếng khoan")
                .build();

        mockMvc.perform(post("/api/v1/farms/" + testFarm.getId() + "/zones")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("ZONE_NEW_BARN_02"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.farmId").value(testFarm.getId()));
    }

    @Test
    @DisplayName("2.3 Trùng mã code phân khu trong cùng trang trại trả về 409 Conflict")
    void duplicateZoneCodeInFarmReturns409() throws Exception {
        ProductionZoneCreateRequest req = ProductionZoneCreateRequest.builder()
                .code("ZONE_TEST_01") // Đã tồn tại trong setUp
                .name("Khu Trùng Mã")
                .zoneType("OPEN_FIELD")
                .areaM2(new BigDecimal("1000.00"))
                .build();

        mockMvc.perform(post("/api/v1/farms/" + testFarm.getId() + "/zones")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DATA_CONFLICT"));
    }

    @Test
    @DisplayName("2.4 Xóa phân khu sản xuất thực hiện Soft-delete chuyển status sang MAINTENANCE")
    void softDeleteZoneUpdatesStatusToMaintenance() throws Exception {
        mockMvc.perform(delete("/api/v1/farms/" + testFarm.getId() + "/zones/" + testZone.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        ProductionZone reloaded = productionZoneRepository.findById(testZone.getId()).orElseThrow();
        assertEquals("MAINTENANCE", reloaded.getStatus(), "Phân khu phải chuyển sang trạng thái MAINTENANCE");
    }

    // =========================================================================
    // 3. ZONE LOCATION CONTROLLER TESTS
    // =========================================================================

    @Test
    @DisplayName("3.1 Tạo vị trí chi tiết (Luống/Ô đất) trong phân khu thành công (201 Created)")
    void createZoneLocationSuccess() throws Exception {
        ZoneLocationCreateRequest req = ZoneLocationCreateRequest.builder()
                .code("LOC_BED_01")
                .name("Luống Cải Xanh 01")
                .description("Luống số 1 phía đông nhà màng")
                .build();

        mockMvc.perform(post("/api/v1/farms/" + testFarm.getId() + "/zones/" + testZone.getId() + "/locations")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("LOC_BED_01"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.zoneId").value(testZone.getId()));
    }

    @Test
    @DisplayName("3.2 Xóa vị trí chi tiết chuyển status sang MAINTENANCE (Không xóa vật lý)")
    void softDeleteLocationUpdatesStatusToMaintenance() throws Exception {
        ZoneLocation loc = zoneLocationRepository.save(ZoneLocation.builder()
                .tenantId(1L)
                .farmId(testFarm.getId())
                .zoneId(testZone.getId())
                .code("LOC_TEMP_01")
                .name("Vị trí tạm thời")
                .status("ACTIVE")
                .build());

        mockMvc.perform(delete("/api/v1/farms/" + testFarm.getId() + "/zones/" + testZone.getId() + "/locations/" + loc.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        ZoneLocation reloaded = zoneLocationRepository.findById(loc.getId()).orElseThrow();
        assertEquals("MAINTENANCE", reloaded.getStatus(), "Vị trí phải chuyển sang trạng thái MAINTENANCE");
    }
}
