package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.livestock.dto.request.CreateLivestockEventRequest;
import com.farm.saas.modules.livestock.dto.request.WeighInRequest;
import com.farm.saas.modules.livestock.dto.response.LivestockEventDetailResponse;
import com.farm.saas.modules.livestock.dto.response.WeightLogDetailResponse;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.entity.LivestockIndividual;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.livestock.repository.LivestockIndividualRepository;
import com.farm.saas.modules.livestock.repository.LivestockWeightLogRepository;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.crop.dto.request.CreateCropSeasonRequest;
import com.farm.saas.modules.crop.service.CropSeasonService;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.livestock.dto.request.CreateLivestockGroupRequest;
import com.farm.saas.modules.livestock.dto.request.UpdateLivestockGroupRequest;
import com.farm.saas.modules.livestock.service.LivestockService;
import com.farm.saas.modules.masterdata.entity.CropType;
import com.farm.saas.modules.masterdata.repository.CropTypeRepository;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
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

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class LivestockAdgAndVetBackflushingIntegrationTest {

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
    private LivestockBreedRepository breedRepository;

    @Autowired
    private LivestockGroupRepository groupRepository;

    @Autowired
    private LivestockIndividualRepository individualRepository;

    @Autowired
    private LivestockWeightLogRepository weightLogRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private ZoneLocationRepository zoneLocationRepository;

    @Autowired
    private LivestockService livestockService;

    @Autowired
    private CropSeasonService cropSeasonService;

    @Autowired
    private CropTypeRepository cropTypeRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Long farmId;
    private Long warehouseId;
    private LivestockGroup testGroup;
    private LivestockIndividual testIndividual;
    private Material testVaccine;
    private String token;
    private final String VACCINE_BATCH = "LOT-VAC-50DOSE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_LIVE_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_LIVE_TEST")
                        .name("Nông Trại Chăn Nuôi Test")
                        .farmType("LIVESTOCK")
                        .totalAreaM2(new BigDecimal("40000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        farm.setManagerUserId(8L);
        farmRepository.save(farm);
        this.farmId = farm.getId();
        jdbcTemplate.update("INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES (5, ?, 1), (8, ?, 1)", farmId, farmId);

        ProductionZone zone = zoneRepository.findByFarmIdAndCode(farmId, "BARN_PIG_01")
                .orElseGet(() -> zoneRepository.save(ProductionZone.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("BARN_PIG_01")
                        .name("Chuồng Heo Thịt 01")
                        .zoneType("BARN")
                        .areaM2(new BigDecimal("2000.00"))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        LivestockBreed breed = breedRepository.findByTenantIdAndSpecies(tenantId, "SWINE").stream().findFirst()
                .orElseGet(() -> breedRepository.save(LivestockBreed.builder()
                        .tenantId(tenantId)
                        .species("SWINE")
                        .breedName("Heo Duroc Cao Sản")
                        .standardGrowthDays(180)
                        .targetWeightKg(new BigDecimal("110.00"))
                        .createdAt(Instant.now())
                        .build()));

        testGroup = groupRepository.findByTenantIdAndFarmIdAndGroupCode(tenantId, farmId, "LG-PIG-TEST-01")
                .orElseGet(() -> groupRepository.save(LivestockGroup.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .zoneId(zone.getId())
                        .groupCode("LG-PIG-TEST-01")
                        .breedId(breed.getId())
                        .initialQuantity(50)
                        .currentQuantity(50)
                        .entryDate(LocalDate.now().minusMonths(2))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        String rfidTag = "RFID-PIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        testIndividual = individualRepository.save(LivestockIndividual.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(zone.getId())
                .groupId(testGroup.getId())
                .rfidTagCode(rfidTag)
                .gender("MALE")
                .birthDate(LocalDate.now().minusMonths(3))
                .currentWeightKg(new BigDecimal("40.00"))
                .healthStatus("HEALTHY")
                .createdAt(Instant.now())
                .build());

        Warehouse warehouse = warehouseRepository.findByFarmIdAndCode(farmId, "WH_VET_MED")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_VET_MED")
                        .name("Kho Thuốc Thú Y")
                        .warehouseType("COLD_STORAGE")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = warehouse.getId();

        MaterialCategory category = categoryRepository.findByTenantIdAndCode(tenantId, "CAT_VACCINE")
                .orElseGet(() -> categoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code("CAT_VACCINE")
                        .name("Vắc xin thú y")
                        .createdAt(Instant.now())
                        .build()));

        testVaccine = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_VAC_PRRS")
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(category.getId())
                        .skuCode("MAT_VAC_PRRS")
                        .name("Vắc xin PRRS Tai Xanh")
                        .standardUnit("DOSE")
                        .dispatchStrategy("FEFO")
                        .expiryAlertDays(60)
                        .minStockLevel(BigDecimal.ZERO)
                        .unitPriceStandard(new BigDecimal("35000.00"))
                        .defaultPhiDays(21)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        // Khởi tạo lô vắc xin 50 liều
        inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(warehouseId, testVaccine.getId(), VACCINE_BATCH)
                .ifPresentOrElse(
                        inv -> {
                            inv.setQuantityOnHand(new BigDecimal("50.00"));
                            inv.setReservedQuantity(BigDecimal.ZERO);
                            inventoryRepository.save(inv);
                        },
                        () -> inventoryRepository.save(WarehouseInventory.builder()
                                .tenantId(tenantId)
                                .farmId(farmId)
                                .warehouseId(warehouseId)
                                .materialId(testVaccine.getId())
                                .batchNumber(VACCINE_BATCH)
                                .inwardDate(LocalDate.now().minusDays(10))
                                .expiryDate(LocalDate.now().plusMonths(6))
                                .unitCost(new BigDecimal("35000.00"))
                                .quantityOnHand(new BigDecimal("50.00"))
                                .reservedQuantity(BigDecimal.ZERO)
                                .storageBinCode("FRIDGE-01")
                                .createdAt(Instant.now())
                                .build())
                );

        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername("tech");
        this.token = jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("TC-LIVE-001: Tính tốc độ tăng trọng ADG (40kg -> 50kg trong 10 ngày = 1.00 kg/ngày) & Sự kiện tiêm vắc xin Auto-Backflushing")
    void testAdgCalculationAndVeterinaryEventBackflushing() throws Exception {
        LocalDate baseDate = LocalDate.now().minusDays(10);

        // 1. Ghi lần cân 1 (ngày T0 = 40.00 kg)
        WeighInRequest weigh1 = WeighInRequest.builder()
                .targetType("INDIVIDUAL")
                .individualId(testIndividual.getId())
                .recordDate(baseDate)
                .weightKg(new BigDecimal("40.00"))
                .notes("Cân kiểm tra đầu kỳ")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/livestock/weigh-in", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weigh1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.weightKg").value(40.0));

        // 2. Ghi lần cân 2 (ngày T0 + 10 = 50.00 kg)
        WeighInRequest weigh2 = WeighInRequest.builder()
                .targetType("INDIVIDUAL")
                .individualId(testIndividual.getId())
                .recordDate(LocalDate.now())
                .weightKg(new BigDecimal("50.00"))
                .notes("Cân kiểm tra sau 10 ngày")
                .build();

        var weighResult = mockMvc.perform(post("/api/v1/farms/{farmId}/livestock/weigh-in", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weigh2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.previousWeightKg").value(40.0))
                .andExpect(jsonPath("$.daysBetween").value(10))
                .andExpect(jsonPath("$.adgKgPerDay").value(1.0))
                .andReturn();

        WeightLogDetailResponse weighResponse = objectMapper.readValue(
                weighResult.getResponse().getContentAsString(), WeightLogDetailResponse.class);
        assertEquals(0, new BigDecimal("1.00").compareTo(weighResponse.getAdgKgPerDay()),
                "ADG phải là 1.00 kg/ngày ((50 - 40) / 10)");

        // 3. Sự kiện VACCINATION có withdrawal_days = 21 và tiêu hao 5 liều vắc-xin
        LocalDate eventDate = LocalDate.now();
        CreateLivestockEventRequest eventRequest = CreateLivestockEventRequest.builder()
                .targetType("GROUP")
                .livestockGroupId(testGroup.getId())
                .eventType("VACCINATION")
                .eventDate(eventDate)
                .withdrawalDays(21)
                .isQuarantined(false)
                .supplies(List.of(
                        CreateLivestockEventRequest.LivestockEventSupplyRequest.builder()
                                .warehouseId(warehouseId)
                                .materialId(testVaccine.getId())
                                .batchNumber(VACCINE_BATCH)
                                .actualQuantity(new BigDecimal("5.00"))
                                .unit("DOSE")
                                .notes("Tiêm phòng vắc-xin đợt 1")
                                .build()
                ))
                .build();

        var eventResult = mockMvc.perform(post("/api/v1/farms/{farmId}/livestock-groups/{id}/events", farmId, testGroup.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(eventRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isInventoryBackflushed").value(true))
                .andExpect(jsonPath("$.withdrawalDays").value(21))
                .andExpect(jsonPath("$.withdrawalEndDate").value(eventDate.plusDays(21).toString()))
                .andReturn();

        LivestockEventDetailResponse eventResponse = objectMapper.readValue(
                eventResult.getResponse().getContentAsString(), LivestockEventDetailResponse.class);
        assertEquals(eventDate.plusDays(21), eventResponse.getWithdrawalEndDate(),
                "Hạn cách ly thuốc withdrawalEndDate phải là eventDate + 21 ngày!");

        // Kiểm tra tồn kho vắc-xin tự động giảm còn 45 liều
        WarehouseInventory vaccineInv = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                warehouseId, testVaccine.getId(), VACCINE_BATCH).orElseThrow();
        assertEquals(0, new BigDecimal("45.00").compareTo(vaccineInv.getQuantityOnHand()),
                "Tồn kho vắc-xin phải giảm từ 50 xuống 45 liều!");
    }

    @Test
    @DisplayName("GAP-TECH-09: Tự động đồng bộ trạng thái Ô chuồng / Vị trí OCCUPIED khi tạo Mùa vụ / Đàn nuôi và giải phóng về EMPTY khi kết thúc")
    void testZoneLocationOccupancyAndReleaseSync() {
        Long tenantId = 1L;

        // --- 1. TEST CHĂN NUÔI: ĐÀN NUÔI (WS-E <-> WS-A) ---
        ProductionZone isolatedBarn = zoneRepository.save(ProductionZone.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .code("ZONE-PEN-ISO-" + UUID.randomUUID().toString().substring(0, 5))
                .name("Khu Chuồng Cách Ly Test Sync")
                .zoneType("BARN")
                .areaM2(new BigDecimal("1500.00"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        ZoneLocation penLocation = zoneLocationRepository.save(ZoneLocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(isolatedBarn.getId())
                .code("PEN-01-" + UUID.randomUUID().toString().substring(0, 5))
                .name("Ô Chuồng Nuôi 01")
                .status("EMPTY")
                .createdAt(Instant.now())
                .build());

        assertEquals("EMPTY", penLocation.getStatus(), "Ban đầu ô chuồng phải ở trạng thái EMPTY");

        // Khởi tạo đàn nuôi gắn với ô chuồng này
        CreateLivestockGroupRequest createGroupReq = CreateLivestockGroupRequest.builder()
                .groupCode("GRP-ISO-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .breedId(testGroup.getBreedId())
                .zoneId(isolatedBarn.getId())
                .locationId(penLocation.getId())
                .initialQuantity(20)
                .entryDate(LocalDate.now())
                .build();

        var createdGroup = livestockService.createGroup(farmId, createGroupReq);
        assertNotNull(createdGroup.getId());

        // Kiểm tra vị trí ô chuồng đã tự động chuyển sang OCCUPIED
        ZoneLocation occupiedPen = zoneLocationRepository.findById(penLocation.getId()).orElseThrow();
        assertEquals("OCCUPIED", occupiedPen.getStatus(), "Sau khi tạo đàn nuôi gán vị trí, ô chuồng phải tự động là OCCUPIED!");

        // Xuất bán / đóng đàn nuôi
        livestockService.updateGroup(farmId, createdGroup.getId(), UpdateLivestockGroupRequest.builder()
                .status("SOLD")
                .build());

        // Kiểm tra vị trí ô chuồng đã tự động giải phóng về EMPTY
        ZoneLocation releasedPen = zoneLocationRepository.findById(penLocation.getId()).orElseThrow();
        assertEquals("EMPTY", releasedPen.getStatus(), "Sau khi đàn nuôi SOLD/CLOSED và không còn đàn nào khác, ô chuồng phải giải phóng về EMPTY!");

        // --- 2. TEST TRỒNG TRỌT: MÙA VỤ CANH TÁC (WS-E <-> WS-A) ---
        ProductionZone isolatedField = zoneRepository.save(ProductionZone.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .code("ZONE-PLOT-ISO-" + UUID.randomUUID().toString().substring(0, 5))
                .name("Khu Vực Đồng Ruộng Test Sync")
                .zoneType("OPEN_FIELD")
                .areaM2(new BigDecimal("5000.00"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        ZoneLocation plotLocation = zoneLocationRepository.save(ZoneLocation.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(isolatedField.getId())
                .code("PLOT-01-" + UUID.randomUUID().toString().substring(0, 5))
                .name("Luống Canh Tác 01")
                .status("EMPTY")
                .createdAt(Instant.now())
                .build());

        assertEquals("EMPTY", plotLocation.getStatus(), "Ban đầu luống canh tác phải ở trạng thái EMPTY");

        CropType cropType = cropTypeRepository.save(CropType.builder()
                .tenantId(tenantId)
                .name("Lúa Nếp Thơm Test")
                .varietyCode("VAR-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .growthDaysStandard(90)
                .build());

        // Khởi tạo mùa vụ gắn với luống này
        CreateCropSeasonRequest createSeasonReq = CreateCropSeasonRequest.builder()
                .seasonCode("SSN-ISO-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .cropTypeId(cropType.getId())
                .zoneId(isolatedField.getId())
                .locationId(plotLocation.getId())
                .startDate(LocalDate.now())
                .plantedAreaM2(new BigDecimal("1000.00"))
                .build();

        var createdSeason = cropSeasonService.createSeason(farmId, createSeasonReq);
        assertNotNull(createdSeason.getId());

        // Kiểm tra luống đã tự động chuyển sang OCCUPIED
        ZoneLocation occupiedPlot = zoneLocationRepository.findById(plotLocation.getId()).orElseThrow();
        assertEquals("OCCUPIED", occupiedPlot.getStatus(), "Sau khi tạo mùa vụ gán vị trí, luống phải tự động là OCCUPIED!");

        // Đóng mùa vụ
        cropSeasonService.closeSeason(farmId, createdSeason.getId());

        // Kiểm tra luống đã tự động giải phóng về EMPTY
        ZoneLocation releasedPlot = zoneLocationRepository.findById(plotLocation.getId()).orElseThrow();
        assertEquals("EMPTY", releasedPlot.getStatus(), "Sau khi mùa vụ đóng (CLOSED) và không còn vụ nào khác, luống phải giải phóng về EMPTY!");
    }
}
