package com.farm.saas.modules.organization;

import com.farm.saas.modules.inventory.dto.request.MaterialCategoryCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialCreateRequest;
import com.farm.saas.modules.inventory.dto.request.WarehouseCreateRequest;
import com.farm.saas.modules.inventory.entity.DispatchStrategy;
import com.farm.saas.modules.inventory.entity.StandardUnit;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import com.farm.saas.modules.organization.dto.request.OperationalCycleCreateRequest;
import com.farm.saas.modules.organization.dto.request.OperationalCycleUpdateRequest;
import com.farm.saas.modules.organization.dto.request.PartnerCreateRequest;
import com.farm.saas.modules.organization.entity.Farm;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import com.farm.saas.modules.organization.entity.PartnerType;
import com.farm.saas.modules.organization.repository.FarmRepository;
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
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MasterDataApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private FarmRepository farmRepository;

    private String ownerToken;         // Tenant 1: ROLE_FARM_OWNER, full permissions
    private String accountantToken;    // Tenant 1: ROLE_ACCOUNTANT, PERM_FINANCE_REPORT
    private String warehouseStaffToken;// Tenant 1: ROLE_WAREHOUSE_STAFF, PERM_INVENTORY_VIEW
    private String fieldStaffToken;    // Tenant 1: ROLE_FIELD_STAFF, no inventory view, farmId=1
    private String otherTenantToken;   // Tenant 99: Isolated

    private Farm testFarm;

    @BeforeEach
    void setUp() {
        testFarm = farmRepository.save(Farm.builder()
                .tenantId(1L)
                .code("FARM_MASTER_TEST_01")
                .name("Trang Trại Thử Nghiệm Master Data")
                .farmType("MIXED")
                .totalAreaM2(new BigDecimal("50000.00"))
                .status("ACTIVE")
                .build());

        ownerToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                2L, 1L, "owner", false,
                List.of("ROLE_FARM_OWNER"),
                List.of("PERM_FARM_VIEW", "PERM_FARM_CREATE", "PERM_FARM_UPDATE", "PERM_ZONE_MANAGE",
                        "PERM_INVENTORY_VIEW", "PERM_FINANCE_REPORT"),
                List.of(testFarm.getId())
        );

        accountantToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                6L, 1L, "accountant", false,
                List.of("ROLE_ACCOUNTANT"),
                List.of("PERM_FARM_VIEW", "PERM_FINANCE_REPORT"),
                List.of(testFarm.getId())
        );

        warehouseStaffToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                4L, 1L, "warehouse_staff", false,
                List.of("ROLE_WAREHOUSE_STAFF"),
                List.of("PERM_FARM_VIEW", "PERM_INVENTORY_VIEW"),
                List.of(testFarm.getId())
        );

        fieldStaffToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                3L, 1L, "field_staff", false,
                List.of("ROLE_FIELD_STAFF"),
                List.of("PERM_FARM_VIEW", "PERM_CROP_LOG"),
                List.of(testFarm.getId())
        );

        otherTenantToken = "Bearer " + jwtTokenProvider.generateAccessToken(
                999L, 99L, "other_owner", false,
                List.of("ROLE_FARM_OWNER"),
                List.of("PERM_FARM_VIEW", "PERM_INVENTORY_VIEW", "PERM_FINANCE_REPORT"),
                List.of(999L)
        );
    }

    // =========================================================================
    // 1. KIỂM THỬ ĐỐI TÁC (PARTNERS)
    // =========================================================================

    @Test
    @DisplayName("1.1. Chủ trang trại tạo mới Nhà cung cấp thành công (201 Created)")
    void testCreatePartner_Success() throws Exception {
        PartnerCreateRequest request = PartnerCreateRequest.builder()
                .code("NCC-VINASEED-TEST")
                .name("Công ty CP Giống Cây Trồng Miền Nam")
                .partnerType(PartnerType.SUPPLIER)
                .taxCode("0301234567")
                .phone("0908123456")
                .email("ncc@vinaseed.test")
                .creditRating("A")
                .build();

        mockMvc.perform(post("/api/v1/partners")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("NCC-VINASEED-TEST"))
                .andExpect(jsonPath("$.data.partnerType").value("SUPPLIER"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("1.2. Nhân viên nông vụ không có quyền quản lý tạo đối tác -> 403 Forbidden")
    void testCreatePartner_Forbidden() throws Exception {
        PartnerCreateRequest request = PartnerCreateRequest.builder()
                .code("NCC-INVALID")
                .name("Công ty TNHH Bất Hợp Pháp")
                .partnerType(PartnerType.SUPPLIER)
                .build();

        mockMvc.perform(post("/api/v1/partners")
                        .header("Authorization", fieldStaffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("1.3. Kế toán xem danh sách đối tác thành công (200 OK)")
    void testGetPartners_Accountant_Success() throws Exception {
        mockMvc.perform(get("/api/v1/partners")
                        .header("Authorization", accountantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // 2. KIỂM THỬ CHU KỲ VẬN HÀNH (OPERATIONAL CYCLES)
    // =========================================================================

    @Test
    @DisplayName("2.1. Tạo mới Chu kỳ vận hành thành công (201 Created)")
    void testCreateOperationalCycle_Success() throws Exception {
        OperationalCycleCreateRequest request = OperationalCycleCreateRequest.builder()
                .name("Vụ Đông Xuân 2026")
                .fiscalYear(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 5, 31))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/cycles", testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Vụ Đông Xuân 2026"))
                .andExpect(jsonPath("$.data.status").value("PLANNING"));
    }

    @Test
    @DisplayName("2.2. Validate ngày kết thúc < ngày bắt đầu -> 400 Bad Request trên POST /api/v1/farms/{farmId}/cycles")
    void testCreateOperationalCycle_InvalidDateRange() throws Exception {
        OperationalCycleCreateRequest request = OperationalCycleCreateRequest.builder()
                .name("Vụ Hè Thu Lỗi Ngày")
                .fiscalYear(2026)
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 5, 1)) // Lỗi: kết thúc trước bắt đầu
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/cycles", testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("2.2b. Kế toán gọi POST /api/v1/farms/{farmId}/cycles -> 403 Forbidden")
    void testCreateOperationalCycle_AccountantForbidden() throws Exception {
        OperationalCycleCreateRequest request = OperationalCycleCreateRequest.builder()
                .name("Vụ Kế Toán Tạo Thử")
                .fiscalYear(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/cycles", testFarm.getId())
                        .header("Authorization", accountantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }

    @Test
    @DisplayName("2.3. Chặn sửa chu kỳ vận hành đã đóng (CLOSED) -> 400 Bad Request")
    void testUpdateClosedCycle_Rejected() throws Exception {
        // Tạo chu kỳ
        OperationalCycleCreateRequest createReq = OperationalCycleCreateRequest.builder()
                .name("Vụ Khép Kín 2026")
                .fiscalYear(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .build();

        String response = mockMvc.perform(post("/api/v1/farms/{farmId}/operational-cycles", testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long cycleId = objectMapper.readTree(response).path("data").path("id").asLong();

        // Đóng chu kỳ
        mockMvc.perform(post("/api/v1/farms/{farmId}/operational-cycles/{id}/close", testFarm.getId(), cycleId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));

        // Thử cập nhật chu kỳ đã đóng -> Phải bị từ chối
        OperationalCycleUpdateRequest updateReq = OperationalCycleUpdateRequest.builder()
                .name("Vụ Khép Kín 2026 Đã Đổi Tên")
                .fiscalYear(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .status(OperationalCycleStatus.CLOSED)
                .build();

        mockMvc.perform(put("/api/v1/farms/{farmId}/operational-cycles/{id}", testFarm.getId(), cycleId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CYCLE_ALREADY_CLOSED"));
    }

    // =========================================================================
    // 3. KIỂM THỬ KHO BÃI (WAREHOUSES)
    // =========================================================================

    @Test
    @DisplayName("3.1. Chủ trang trại tạo mới Kho phân bón thành công (201 Created)")
    void testCreateWarehouse_Success() throws Exception {
        WarehouseCreateRequest request = WarehouseCreateRequest.builder()
                .code("KHO-PB-TEST-01")
                .name("Kho Phân Bón Số 1")
                .warehouseType(WarehouseType.FERTILIZER)
                .locationDesc("Khu A - Sau nhà lưới")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/warehouses", testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("KHO-PB-TEST-01"))
                .andExpect(jsonPath("$.data.warehouseType").value("FERTILIZER"));
    }

    @Test
    @DisplayName("3.2. Thủ kho có PERM_INVENTORY_VIEW xem danh sách kho thành công (200 OK)")
    void testGetWarehouses_WarehouseStaff_Success() throws Exception {
        mockMvc.perform(get("/api/v1/farms/{farmId}/warehouses", testFarm.getId())
                        .header("Authorization", warehouseStaffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("3.3. Nhân viên nông vụ không có PERM_INVENTORY_VIEW xem kho -> 403 Forbidden")
    void testGetWarehouses_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/farms/{farmId}/warehouses", testFarm.getId())
                        .header("Authorization", fieldStaffToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. KIỂM THỬ NHÓM VẬT TƯ & MẶT HÀNG VẬT TƯ (MATERIAL CATEGORIES & MATERIALS)
    // =========================================================================

    @Test
    @DisplayName("4.1. Tạo mới Nhóm vật tư và Vật tư thành công (201 Created)")
    void testCreateMaterialCategoryAndMaterial_Success() throws Exception {
        // 1. Tạo nhóm vật tư
        MaterialCategoryCreateRequest catReq = MaterialCategoryCreateRequest.builder()
                .code("PB_HUU_CO")
                .name("Phân bón hữu cơ sinh học")
                .build();

        String catResp = mockMvc.perform(post("/api/v1/material-categories")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long categoryId = objectMapper.readTree(catResp).path("data").path("id").asLong();

        // 2. Tạo vật tư trực thuộc nhóm
        MaterialCreateRequest matReq = MaterialCreateRequest.builder()
                .categoryId(categoryId)
                .skuCode("SKU-PB-HC-QUEN")
                .name("Phân Hữu Cơ Quế Lâm 01")
                .standardUnit(StandardUnit.BAG)
                .dispatchStrategy(DispatchStrategy.FIFO)
                .expiryAlertDays(45)
                .minStockLevel(new BigDecimal("10.00"))
                .maxStockLevel(new BigDecimal("200.00"))
                .unitPriceStandard(new BigDecimal("185000.00"))
                .build();

        mockMvc.perform(post("/api/v1/materials")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(matReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skuCode").value("SKU-PB-HC-QUEN"))
                .andExpect(jsonPath("$.data.standardUnit").value("BAG"))
                .andExpect(jsonPath("$.data.dispatchStrategy").value("FIFO"));

        // 3. Kiểm tra chặn xóa nhóm khi còn vật tư con -> Phải trả về 409 Conflict
        mockMvc.perform(delete("/api/v1/material-categories/{id}", categoryId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DATA_CONFLICT"));
    }

    @Test
    @DisplayName("4.2. Validate đơn giá âm hoặc tồn kho âm -> 400 Bad Request")
    void testCreateMaterial_ValidationFailure() throws Exception {
        MaterialCreateRequest matReq = MaterialCreateRequest.builder()
                .categoryId(1L)
                .skuCode("SKU-INVALID")
                .name("Vật tư giá âm")
                .standardUnit(StandardUnit.KG)
                .dispatchStrategy(DispatchStrategy.FIFO)
                .expiryAlertDays(30)
                .minStockLevel(new BigDecimal("-5.00")) // Lỗi âm
                .unitPriceStandard(new BigDecimal("-1000.00")) // Lỗi âm
                .build();

        mockMvc.perform(post("/api/v1/materials")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(matReq)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 5. KIỂM THỬ 3 LỖI DO USER PHÁT HIỆN
    // =========================================================================

    @Test
    @DisplayName("5.1. BUG 1: Gửi partnerType='HACKER_TYPE' không tồn tại trong Enum -> Phải trả về HTTP 400 Bad Request kèm danh sách Enum hợp lệ")
    void testCreatePartner_InvalidPartnerType_Returns400() throws Exception {
        String invalidJson = """
                {
                    "code": "NCC-HACKER",
                    "name": "Nhà cung cấp giả mạo",
                    "partnerType": "HACKER_TYPE"
                }
                """;

        mockMvc.perform(post("/api/v1/partners")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_BODY"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("partnerType")));
    }

    @Test
    @DisplayName("5.2. BUG 2: Ngày kết thúc chu kỳ nhỏ hơn ngày bắt đầu -> Phải trả về HTTP 400 Bad Request kèm thông báo Validate")
    void testCreateOperationalCycle_EndDateBeforeStartDate_Returns400() throws Exception {
        String invalidDateJson = """
                {
                    "farmId": %d,
                    "name": "Vụ Thử Nghiệm Ngày Sai",
                    "fiscalYear": 2026,
                    "startDate": "2026-06-01",
                    "endDate": "2026-05-01"
                }
                """.formatted(testFarm.getId());

        // 1. Thử qua endpoint phân cấp /api/v1/farms/{farmId}/operational-cycles
        mockMvc.perform(post("/api/v1/farms/{farmId}/operational-cycles", testFarm.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidDateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu")));

        // 2. Thử qua endpoint trực tiếp /api/v1/operational-cycles
        mockMvc.perform(post("/api/v1/operational-cycles")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidDateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu")));
    }

    @Test
    @DisplayName("5.3. BUG 3: Kế toán tạo danh mục vật tư -> Bị chặn với HTTP 403 Forbidden (ngay cả khi payload rỗng hoặc hợp lệ)")
    void testAccountant_CreateMaterialCategory_Returns403() throws Exception {
        // Kế toán gửi payload đầy đủ hợp lệ
        String validJson = """
                {
                    "code": "PB_TEST_KETOAN",
                    "name": "Nhóm phân bón do kế toán tạo"
                }
                """;

        mockMvc.perform(post("/api/v1/material-categories")
                        .header("Authorization", accountantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));

        // Kế toán gửi payload rỗng {} -> Vẫn phải bị chặn 403 Forbidden tại Filter tầng Security trước khi vào Validator
        mockMvc.perform(post("/api/v1/material-categories")
                        .header("Authorization", accountantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }
}
