package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.masterdata.dto.response.BarcodeLookupResponse;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.MaterialUnitConversionRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class BarcodeLookupIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private MaterialUnitConversionRepository conversionRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    private Long farmId;
    private Long warehouseId;
    private Material testMaterial;
    private MaterialUnitConversion testConversion;
    private final String STD_BARCODE = "8935001234567";
    private final String UNIT_BARCODE = "8935009999999";
    private final String BATCH_BARCODE = "INT-BATCH-004-BC";

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        // 1. Tạo/tìm Farm thuộc Tenant 1
        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_BC_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_BC_TEST")
                        .name("Nông Trại Kiểm Thử Barcode")
                        .farmType("CROP")
                        .totalAreaM2(new BigDecimal("50000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.farmId = farm.getId();

        // 2. Tạo/tìm Warehouse
        Warehouse warehouse = warehouseRepository.findByFarmIdAndCode(farmId, "WH_BC_TEST")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_BC_TEST")
                        .name("Kho Vật Tư Barcode Test")
                        .warehouseType("FERTILIZER")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = warehouse.getId();

        // 3. Tạo/tìm Nhóm vật tư
        MaterialCategory category = categoryRepository.findByTenantIdAndCode(tenantId, "CAT_FERT")
                .orElseGet(() -> categoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code("CAT_FERT")
                        .name("Phân bón vô cơ")
                        .createdAt(Instant.now())
                        .build()));

        // 4. Tạo/tìm Vật tư chuẩn
        testMaterial = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_NPK_TEST")
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(category.getId())
                        .skuCode("MAT_NPK_TEST")
                        .barcode(STD_BARCODE)
                        .name("Phân Bón NPK Đầu Trâu 20-20-15")
                        .standardUnit("KG")
                        .dispatchStrategy("FEFO")
                        .expiryAlertDays(30)
                        .defaultPhiDays(14)
                        .minStockLevel(new BigDecimal("100.00"))
                        .maxStockLevel(new BigDecimal("10000.00"))
                        .unitPriceStandard(new BigDecimal("18500.00"))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        // Đảm bảo barcode luôn khớp
        testMaterial.setBarcode(STD_BARCODE);
        materialRepository.save(testMaterial);

        // 5. Tạo/tìm Đơn vị quy đổi
        testConversion = conversionRepository.findByMaterialIdAndUnitName(testMaterial.getId(), "BAG_50KG")
                .orElseGet(() -> conversionRepository.save(MaterialUnitConversion.builder()
                        .tenantId(tenantId)
                        .materialId(testMaterial.getId())
                        .unitName("BAG_50KG")
                        .unitBarcode(UNIT_BARCODE)
                        .conversionFactor(new BigDecimal("50.0000"))
                        .isPurchaseUnit(true)
                        .isDispatchUnit(true)
                        .createdAt(Instant.now())
                        .build()));

        testConversion.setUnitBarcode(UNIT_BARCODE);
        conversionRepository.save(testConversion);

        // 6. Dọn dẹp và thêm tồn kho mẫu
        inventoryRepository.deleteAll(inventoryRepository.findByFarmIdAndMaterialId(farmId, testMaterial.getId()));

        // Lô 1: Hết hạn sau 6 tháng, tồn 100
        inventoryRepository.save(WarehouseInventory.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouseId)
                .materialId(testMaterial.getId())
                .batchNumber("BATCH-FEFO-01")
                .inwardDate(LocalDate.now().minusDays(10))
                .expiryDate(LocalDate.now().plusMonths(6))
                .unitCost(new BigDecimal("18500.00"))
                .quantityOnHand(new BigDecimal("100.00"))
                .reservedQuantity(BigDecimal.ZERO)
                .storageBinCode("BIN-A1")
                .createdAt(Instant.now())
                .build());

        // Lô 2: Hết hạn sau 2 tháng (sớm hơn Lô 1 -> FEFO ưu tiên), tồn 80, đã giữ 10 -> khả dụng 70
        inventoryRepository.save(WarehouseInventory.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouseId)
                .materialId(testMaterial.getId())
                .batchNumber("BATCH-FEFO-02")
                .inwardDate(LocalDate.now().minusDays(5))
                .expiryDate(LocalDate.now().plusMonths(2))
                .unitCost(new BigDecimal("18500.00"))
                .quantityOnHand(new BigDecimal("80.00"))
                .reservedQuantity(new BigDecimal("10.00"))
                .storageBinCode("BIN-A2")
                .createdAt(Instant.now())
                .build());

        // Lô 3: Tồn 50, nhưng đã giữ 50 -> khả dụng 0 -> KHÔNG được trả về trong suggestedLots!
        inventoryRepository.save(WarehouseInventory.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouseId)
                .materialId(testMaterial.getId())
                .batchNumber("BATCH-EXHAUSTED")
                .inwardDate(LocalDate.now().minusDays(20))
                .expiryDate(LocalDate.now().plusMonths(12))
                .unitCost(new BigDecimal("18500.00"))
                .quantityOnHand(new BigDecimal("50.00"))
                .reservedQuantity(new BigDecimal("50.00"))
                .storageBinCode("BIN-A3")
                .createdAt(Instant.now())
                .build());

        // Lô 4: Có mã vạch lô nội bộ, hết hạn sau 1 tháng (sớm nhất!), tồn 20 -> khả dụng 20
        inventoryRepository.save(WarehouseInventory.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouseId)
                .materialId(testMaterial.getId())
                .batchNumber("BATCH-INTERNAL-04")
                .inwardDate(LocalDate.now().minusDays(2))
                .expiryDate(LocalDate.now().plusMonths(1))
                .unitCost(new BigDecimal("18500.00"))
                .quantityOnHand(new BigDecimal("20.00"))
                .reservedQuantity(BigDecimal.ZERO)
                .storageBinCode("BIN-A4")
                .internalBatchBarcode(BATCH_BARCODE)
                .createdAt(Instant.now())
                .build());
    }

    private String getAccessToken(String username) {
        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        return jwtTokenProvider.generateAccessToken(user);
    }

    /**
     * TC-INV-002: Unified Barcode Scanner & FEFO/FIFO Suggested Lots
     * Tra cứu theo thứ tự:
     * 1. materials.barcode -> matchType = 'STANDARD', conversionFactor = 1.0000
     * 2. material_unit_conversions.unit_barcode -> matchType = 'UNIT_CONVERSION', enteredUnit, conversionFactor
     * 3. warehouse_inventory.internal_batch_barcode -> matchType = 'INTERNAL_BATCH'
     * Trả về danh sách suggestedLots khả dụng > 0 sắp xếp theo FEFO (expiry_date ASC).
     */
    @Test
    @DisplayName("TC-INV-002: Quét mã vạch chuẩn (materials.barcode) -> matchType STANDARD & sắp xếp FEFO")
    void testStandardBarcodeLookup() throws Exception {
        String tokenOwner = getAccessToken("owner");

        var response = mockMvc.perform(get("/api/v1/farms/{farmId}/materials/lookup-barcode", farmId)
                        .param("code", STD_BARCODE)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchType").value("STANDARD"))
                .andExpect(jsonPath("$.skuCode").value("MAT_NPK_TEST"))
                .andExpect(jsonPath("$.standardUnit").value("KG"))
                .andExpect(jsonPath("$.enteredUnit").value("KG"))
                .andExpect(jsonPath("$.conversionFactor").value(1.0))
                .andReturn();

        BarcodeLookupResponse result = objectMapper.readValue(
                response.getResponse().getContentAsString(), BarcodeLookupResponse.class);

        assertNotNull(result.getSuggestedLots());
        // Chỉ có 3 lô còn khả dụng > 0 (BATCH-INTERNAL-04: 20, BATCH-FEFO-02: 70, BATCH-FEFO-01: 100)
        // BATCH-EXHAUSTED có khả dụng = 0 không được có mặt!
        assertEquals(3, result.getSuggestedLots().size());

        // Kiểm tra thứ tự FEFO (hạn sử dụng sớm nhất đứng đầu):
        // 1. BATCH-INTERNAL-04 (hết hạn sau 1 tháng)
        assertEquals("BATCH-INTERNAL-04", result.getSuggestedLots().get(0).getBatchNumber());
        assertEquals(0, new BigDecimal("20.00").compareTo(result.getSuggestedLots().get(0).getAvailableQuantity()));

        // 2. BATCH-FEFO-02 (hết hạn sau 2 tháng)
        assertEquals("BATCH-FEFO-02", result.getSuggestedLots().get(1).getBatchNumber());
        assertEquals(0, new BigDecimal("70.00").compareTo(result.getSuggestedLots().get(1).getAvailableQuantity()));

        // 3. BATCH-FEFO-01 (hết hạn sau 6 tháng)
        assertEquals("BATCH-FEFO-01", result.getSuggestedLots().get(2).getBatchNumber());
        assertEquals(0, new BigDecimal("100.00").compareTo(result.getSuggestedLots().get(2).getAvailableQuantity()));
    }

    @Test
    @DisplayName("TC-INV-002: Quét mã vạch bao bì quy đổi (unit_barcode) -> matchType UNIT_CONVERSION")
    void testUnitConversionBarcodeLookup() throws Exception {
        String tokenOwner = getAccessToken("owner");

        mockMvc.perform(get("/api/v1/farms/{farmId}/materials/lookup-barcode", farmId)
                        .param("code", UNIT_BARCODE)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchType").value("UNIT_CONVERSION"))
                .andExpect(jsonPath("$.skuCode").value("MAT_NPK_TEST"))
                .andExpect(jsonPath("$.standardUnit").value("KG"))
                .andExpect(jsonPath("$.enteredUnit").value("BAG_50KG"))
                .andExpect(jsonPath("$.conversionFactor").value(50.0))
                .andExpect(jsonPath("$.suggestedLots").isArray());
    }

    @Test
    @DisplayName("TC-INV-002: Quét mã vạch lô nội bộ (internal_batch_barcode) -> matchType INTERNAL_BATCH")
    void testInternalBatchBarcodeLookup() throws Exception {
        String tokenOwner = getAccessToken("owner");

        mockMvc.perform(get("/api/v1/farms/{farmId}/materials/lookup-barcode", farmId)
                        .param("code", BATCH_BARCODE)
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchType").value("INTERNAL_BATCH"))
                .andExpect(jsonPath("$.skuCode").value("MAT_NPK_TEST"))
                .andExpect(jsonPath("$.standardUnit").value("KG"))
                .andExpect(jsonPath("$.enteredUnit").value("KG"))
                .andExpect(jsonPath("$.conversionFactor").value(1.0));
    }

    @Test
    @DisplayName("TC-INV-002: Quét mã vạch không tồn tại -> Báo 404 BARCODE_NOT_FOUND")
    void testBarcodeNotFound() throws Exception {
        String tokenOwner = getAccessToken("owner");

        mockMvc.perform(get("/api/v1/farms/{farmId}/materials/lookup-barcode", farmId)
                        .param("code", "UNKNOWN_BARCODE_XYZ_123")
                        .header("Authorization", "Bearer " + tokenOwner))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BARCODE_NOT_FOUND"));
    }
}
