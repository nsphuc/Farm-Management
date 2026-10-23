package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.crop.dto.request.CreateFarmingLogRequest;
import com.farm.saas.modules.crop.dto.response.FarmingLogDetailResponse;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.entity.FarmingLog;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.entity.WarehouseIssue;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueRepository;
import com.farm.saas.modules.masterdata.entity.CropType;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class CropFarmingLogAutoBackflushingIntegrationTest {

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
    private ProductionZoneRepository zoneRepository;

    @Autowired
    private CropTypeRepository cropTypeRepository;

    @Autowired
    private CropSeasonRepository seasonRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private WarehouseIssueRepository issueRepository;

    @Autowired
    private WarehouseInventoryTransactionRepository transactionRepository;

    @Autowired
    private FarmExpenseRepository farmExpenseRepository;

    @Autowired
    private FarmingLogRepository farmingLogRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Long farmId;
    private Long warehouseId;
    private CropSeason testSeason;
    private Material testPesticide;
    private String token;
    private final String BATCH_100KG = "LOT-CROP-100KG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_CROP_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_CROP_TEST")
                        .name("Nông Trại Trồng Trọt Test")
                        .farmType("CROP")
                        .totalAreaM2(new BigDecimal("80000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        farm.setManagerUserId(8L);
        farmRepository.save(farm);
        this.farmId = farm.getId();
        jdbcTemplate.update("INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES (3, ?, 1), (8, ?, 1)", farmId, farmId);

        ProductionZone zone = zoneRepository.findByFarmIdAndCode(farmId, "ZONE_CROP_A")
                .orElseGet(() -> zoneRepository.save(ProductionZone.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("ZONE_CROP_A")
                        .name("Khu Vực Trồng Rau A")
                        .zoneType("OPEN_FIELD")
                        .areaM2(new BigDecimal("10000.00"))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        CropType cropType = cropTypeRepository.findByTenantIdAndVarietyCode(tenantId, "CROP_TOMATO_01")
                .orElseGet(() -> cropTypeRepository.save(CropType.builder()
                        .tenantId(tenantId)
                        .varietyCode("CROP_TOMATO_01")
                        .name("Cà Chua Cherry")
                        .growthDaysStandard(90)
                        .createdAt(Instant.now())
                        .build()));

        testSeason = seasonRepository.findByTenantIdAndFarmIdAndSeasonCode(tenantId, farmId, "CS-CROP-TEST-01")
                .orElseGet(() -> seasonRepository.save(CropSeason.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone.getId())
                        .cropTypeId(cropType.getId())
                        .seasonCode("CS-CROP-TEST-01")
                        .startDate(LocalDate.now().minusDays(30))
                        .plantedAreaM2(new BigDecimal("5000.00"))
                        .status("GROWING")
                        .createdAt(Instant.now())
                        .build()));

        Warehouse warehouse = warehouseRepository.findByFarmIdAndCode(farmId, "WH_CROP_SUPPLIES")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_CROP_SUPPLIES")
                        .name("Kho Vật Tư Thuốc Trồng Trọt")
                        .warehouseType("PESTICIDE")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = warehouse.getId();

        MaterialCategory category = categoryRepository.findByTenantIdAndCode(tenantId, "CAT_PEST_BIO")
                .orElseGet(() -> categoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code("CAT_PEST_BIO")
                        .name("Thuốc trừ sâu sinh học")
                        .createdAt(Instant.now())
                        .build()));

        testPesticide = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_BIO_PEST_01")
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(category.getId())
                        .skuCode("MAT_BIO_PEST_01")
                        .name("Thuốc Trừ Sâu Sinh Học Neem")
                        .standardUnit("KG")
                        .dispatchStrategy("FIFO")
                        .expiryAlertDays(30)
                        .minStockLevel(BigDecimal.ZERO)
                        .unitPriceStandard(new BigDecimal("50000.00"))
                        .defaultPhiDays(14)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        // Khởi tạo lô tồn kho 100.00 kg
        inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(warehouseId, testPesticide.getId(), BATCH_100KG)
                .ifPresentOrElse(
                        inv -> {
                            inv.setQuantityOnHand(new BigDecimal("100.00"));
                            inv.setReservedQuantity(BigDecimal.ZERO);
                            inventoryRepository.save(inv);
                        },
                        () -> inventoryRepository.save(WarehouseInventory.builder()
                                .tenantId(tenantId)
                                .farmId(farmId)
                                .warehouseId(warehouseId)
                                .materialId(testPesticide.getId())
                                .batchNumber(BATCH_100KG)
                                .inwardDate(LocalDate.now().minusDays(5))
                                .unitCost(new BigDecimal("50000.00"))
                                .quantityOnHand(new BigDecimal("100.00"))
                                .reservedQuantity(BigDecimal.ZERO)
                                .storageBinCode("BIN-P1")
                                .createdAt(Instant.now())
                                .build())
                );

        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername("staff");
        this.token = jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("TC-CROP-001: Nhật ký canh tác Auto-Backflushing (Xuất 30kg từ 100kg) & Rollback khi thiếu hàng (150kg)")
    void testFarmingLogAutoBackflushingAndRollback() throws Exception {
        LocalDate logDate = LocalDate.now();

        // 1. KỊCH BẢN THÀNH CÔNG: Tiêu hao 30 kg từ lô 100 kg
        CreateFarmingLogRequest successRequest = CreateFarmingLogRequest.builder()
                .seasonId(testSeason.getId())
                .logDate(logDate)
                .stage("GROWING")
                .activityType("PESTICIDE_APPLICATION")
                .weatherNotes("Trời nắng ráo, phun phòng trừ sâu tơ")
                .supplies(List.of(
                        CreateFarmingLogRequest.FarmingSupplyRequest.builder()
                                .warehouseId(warehouseId)
                                .materialId(testPesticide.getId())
                                .batchNumber(BATCH_100KG)
                                .actualQuantity(new BigDecimal("30.00"))
                                .unit("KG")
                                .notes("Phun đợt 1")
                                .build()
                ))
                .build();

        var mvcResult = mockMvc.perform(post("/api/v1/farms/{farmId}/farming-logs", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isInventoryBackflushed").value(true))
                .andExpect(jsonPath("$.phiDays").value(14))
                .andExpect(jsonPath("$.phiEndDate").value(logDate.plusDays(14).toString()))
                .andReturn();

        FarmingLogDetailResponse logResponse = objectMapper.readValue(
                mvcResult.getResponse().getContentAsString(), FarmingLogDetailResponse.class);
        Long farmingLogId = logResponse.getId();

        // Kiểm tra tồn kho giảm còn 70 kg
        WarehouseInventory inventoryAfter = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                warehouseId, testPesticide.getId(), BATCH_100KG).orElseThrow();
        assertEquals(0, new BigDecimal("70.00").compareTo(inventoryAfter.getQuantityOnHand()),
                "Số lượng tồn kho còn lại phải là 70.00 kg!");

        // Kiểm tra phiếu xuất kho tự động sinh
        List<WarehouseIssue> issues = issueRepository.findAll().stream()
                .filter(i -> farmingLogId.equals(i.getFarmingLogId()) && Boolean.TRUE.equals(i.getIsBackflushed()))
                .toList();
        assertFalse(issues.isEmpty(), "Bắt buộc phải tự sinh WarehouseIssue với isBackflushed = true");
        WarehouseIssue issue = issues.get(0);
        assertEquals("PRODUCTION_BACKFLUSH", issue.getIssueType());
        assertEquals("COMPLETED", issue.getStatus());
        assertEquals(0, new BigDecimal("1500000.00").compareTo(issue.getTotalAmount()), "30kg * 50,000 = 1,500,000 VND");

        // Kiểm tra bút toán sổ cái OUTWARD
        List<WarehouseInventoryTransaction> txs = transactionRepository.findAll().stream()
                .filter(t -> issue.getId().equals(t.getReferenceDocId()) && "WAREHOUSE_ISSUE".equals(t.getReferenceDocType()))
                .toList();
        assertFalse(txs.isEmpty());
        WarehouseInventoryTransaction tx = txs.get(0);
        assertEquals("OUTWARD", tx.getTransactionType());
        assertEquals("OUT", tx.getDirection());
        assertEquals(0, new BigDecimal("30.00").compareTo(tx.getQuantity()));
        assertEquals(0, new BigDecimal("100.00").compareTo(tx.getBalanceBefore()));
        assertEquals(0, new BigDecimal("70.00").compareTo(tx.getBalanceAfter()));

        // Kiểm tra tự động sinh chi phí FarmExpense
        List<FarmExpense> expenses = farmExpenseRepository.findAll().stream()
                .filter(e -> issue.getId().equals(e.getReferenceId()) && "INVENTORY_BACKFLUSH".equals(e.getExpenseSource()))
                .toList();
        assertFalse(expenses.isEmpty(), "Bắt buộc phải sinh FarmExpense");
        FarmExpense exp = expenses.get(0);
        assertEquals(testSeason.getId(), exp.getSeasonId());
        assertEquals("CONFIRMED", exp.getStatus());
        assertEquals(0, new BigDecimal("1500000.00").compareTo(exp.getAmount()));

        // 2. KỊCH BẢN ROLLBACK: Yêu cầu xuất 150 kg (vượt tồn 70 kg còn lại)
        long logCountBefore = farmingLogRepository.count();

        CreateFarmingLogRequest failedRequest = CreateFarmingLogRequest.builder()
                .seasonId(testSeason.getId())
                .logDate(logDate)
                .stage("GROWING")
                .activityType("PESTICIDE_APPLICATION")
                .weatherNotes("Cố tình xuất vượt tồn kho")
                .supplies(List.of(
                        CreateFarmingLogRequest.FarmingSupplyRequest.builder()
                                .warehouseId(warehouseId)
                                .materialId(testPesticide.getId())
                                .batchNumber(BATCH_100KG)
                                .actualQuantity(new BigDecimal("150.00"))
                                .unit("KG")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/farming-logs", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failedRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INSUFFICIENT_STOCK"));

        // Xác nhận transaction bị ROLLBACK hoàn toàn
        long logCountAfter = farmingLogRepository.count();
        assertEquals(logCountBefore, logCountAfter, "Nhật ký canh tác không được lưu khi thiếu tồn kho!");

        WarehouseInventory inventoryFinal = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                warehouseId, testPesticide.getId(), BATCH_100KG).orElseThrow();
        assertEquals(0, new BigDecimal("70.00").compareTo(inventoryFinal.getQuantityOnHand()),
                "Tồn kho phải được giữ nguyên 70.00 kg sau khi rollback!");
    }
}
