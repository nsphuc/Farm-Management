package com.farmsaas;

import com.farmsaas.modules.crop.dto.*;
import com.farmsaas.modules.crop.entity.enums.ActivityType;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import com.farmsaas.modules.crop.service.CropSeasonService;
import com.farmsaas.modules.crop.service.CropTypeService;
import com.farmsaas.modules.crop.service.FarmingLogService;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.CreateZoneRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.ZoneResponse;
import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.modules.farm.service.ZoneService;
import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.entity.enums.ReceiptType;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import com.farmsaas.modules.inventory.entity.enums.WarehouseType;
import com.farmsaas.modules.inventory.service.InventoryService;
import com.farmsaas.modules.inventory.service.MaterialService;
import com.farmsaas.modules.inventory.service.WarehouseService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class CropSeasonServiceTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private CropTypeService cropTypeService;

    @Autowired
    private CropSeasonService cropSeasonService;

    @Autowired
    private FarmingLogService farmingLogService;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private MaterialService materialService;

    @Autowired
    private InventoryService inventoryService;

    private Long tenantId = 1L;
    private Long farmId;
    private Long zoneId;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(tenantId);

        // 1. Tạo farm kiểm thử
        String farmCode = "FARM-CROP-" + System.currentTimeMillis();
        CreateFarmRequest farmReq = CreateFarmRequest.builder()
                .code(farmCode)
                .name("Trang Trại Trồng Trọt Test")
                .farmType("TRONG_TROT")
                .totalAreaM2(new BigDecimal("20000"))
                .address("Đà Lạt, Lâm Đồng")
                .build();
        FarmResponse farm = farmService.createFarm(farmReq);
        farmId = farm.getId();

        // 2. Tạo phân khu nhà màng
        String zoneCode = "ZONE-GH-" + System.currentTimeMillis();
        CreateZoneRequest zoneReq = CreateZoneRequest.builder()
                .code(zoneCode)
                .name("Nhà màng công nghệ cao A1")
                .zoneType("NHA_MANG")
                .areaM2(new BigDecimal("1500.00"))
                .status("ACTIVE")
                .build();
        ZoneResponse zone = zoneService.createZone(farmId, zoneReq);
        zoneId = zone.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Kiểm thử trọn vẹn: Tạo giống, khởi tạo vụ mùa, ghi nhật ký canh tác kích hoạt trừ kho ngầm (Backflushing), và thu hoạch đóng vụ")
    void testCropLifecycle_AndInventoryBackflushing() {
        // 1. Tạo giống cây trồng
        String varietyCode = "VAR-MELON-" + System.currentTimeMillis();
        CropTypeResponse cropType = cropTypeService.createCropType(CropTypeRequest.builder()
                .name("Dưa lưới mật Inthanon RZ")
                .varietyCode(varietyCode)
                .growthDaysStandard(75)
                .waterNeedM3Day(new BigDecimal("3.50"))
                .optimalTempMin(new BigDecimal("22.00"))
                .optimalTempMax(new BigDecimal("32.00"))
                .build());
        assertNotNull(cropType.getId());

        // 2. Khởi tạo vụ mùa
        CropSeasonRequest seasonReq = CropSeasonRequest.builder()
                .zoneId(zoneId)
                .cropTypeId(cropType.getId())
                .startDate(LocalDate.now())
                .expectedHarvestDate(LocalDate.now().plusDays(75))
                .plantedAreaM2(new BigDecimal("1000.00"))
                .seedQuantity(new BigDecimal("2500.00"))
                .estimatedYieldKg(new BigDecimal("3000.00"))
                .status(SeasonStatus.LAM_DAT)
                .build();
        CropSeasonResponse season = cropSeasonService.createSeason(farmId, seasonReq);
        assertNotNull(season.getId());
        assertNotNull(season.getSeasonCode());
        assertTrue(season.getSeasonCode().startsWith("VU-"));
        assertEquals(SeasonStatus.LAM_DAT, season.getStatus());

        // 3. Chuẩn bị kho vật tư & nhập 100 lít Phân bón lá
        WarehouseResponse warehouse = warehouseService.createWarehouse(farmId, WarehouseRequest.builder()
                .code("KHO-VT-" + System.currentTimeMillis())
                .name("Kho vật tư nông nghiệp trung tâm")
                .warehouseType(WarehouseType.KHO_PHAN_BON)
                .locationDesc("Khu kỹ thuật")
                .build());

        MaterialCategoryResponse cat = materialService.createCategory(MaterialCategoryRequest.builder()
                .code("CAT-FERT-" + System.currentTimeMillis())
                .name("Phân bón sinh học")
                .build());

        MaterialResponse material = materialService.createMaterial(MaterialRequest.builder()
                .categoryId(cat.getId())
                .skuCode("FERT-BIO-" + System.currentTimeMillis())
                .name("Phân bón lá rong biển Seaweed")
                .standardUnit(StandardUnit.LIT)
                .minStockLevel(new BigDecimal("10.00"))
                .unitPriceStandard(new BigDecimal("120000.00"))
                .build());

        // Nhập kho 100 Lít
        inventoryService.createReceipt(farmId, WarehouseReceiptRequest.builder()
                .warehouseId(warehouse.getId())
                .receiptType(ReceiptType.PURCHASE)
                .items(List.of(
                        WarehouseReceiptRequest.ReceiptItemRequest.builder()
                                .materialId(material.getId())
                                .batchNumber("BATCH-SEA-01")
                                .quantity(new BigDecimal("100.00"))
                                .unitPrice(new BigDecimal("120000.00"))
                                .expiryDate(LocalDate.now().plusYears(1))
                                .build()
                ))
                .build());

        // Kiểm tra tồn kho trước khi ghi nhật ký canh tác = 100 Lít
        List<InventoryStockResponse> beforeStocks = inventoryService.getInventoryByWarehouse(farmId, warehouse.getId());
        assertEquals(new BigDecimal("100.00"), beforeStocks.get(0).getQuantityOnHand());

        // 4. Ghi nhật ký canh tác bón phân: dùng 25 Lít phân bón -> Kích hoạt INVENTORY BACKFLUSHING
        FarmingLogRequest logReq = FarmingLogRequest.builder()
                .stage("Giai đoạn nuôi trái non (ngày thứ 30)")
                .activityType(ActivityType.BON_PHAN)
                .warehouseId(warehouse.getId())
                .suppliesUsed(List.of(
                        FarmingLogRequest.SuppliesUsedItem.builder()
                                .materialId(material.getId())
                                .batchNumber("BATCH-SEA-01")
                                .quantity(new BigDecimal("25.00"))
                                .unit("LIT")
                                .build()
                ))
                .weatherNotes("Trời nắng ráo, nhiệt độ 28°C")
                .notes("Hòa loãng phân bón lá tưới nhỏ giọt theo tỷ lệ 1:1000")
                .build();

        FarmingLogResponse logResponse = farmingLogService.createLog(farmId, season.getId(), logReq);
        assertNotNull(logResponse.getId());
        assertEquals(ActivityType.BON_PHAN, logResponse.getActivityType());

        // Kiểm tra TỒN KHO TỰ ĐỘNG BỊ TRỪ: 100 - 25 = 75 Lít
        List<InventoryStockResponse> afterStocks = inventoryService.getInventoryByWarehouse(farmId, warehouse.getId());
        assertEquals(new BigDecimal("75.00"), afterStocks.get(0).getQuantityOnHand(),
                "Inventory Backflushing phải tự động trừ kho 25 lít vật tư khi ghi nhật ký!");

        // 5. Kiểm tra danh sách nhật ký vụ mùa
        Page<FarmingLogResponse> logsPage = farmingLogService.getLogsBySeason(farmId, season.getId(), PageRequest.of(0, 10));
        assertEquals(1, logsPage.getTotalElements());

        // 6. Ghi nhận thu hoạch và đóng vụ mùa (HarvestSeasonRequest)
        HarvestSeasonRequest harvestReq = HarvestSeasonRequest.builder()
                .actualHarvestDate(LocalDate.now().plusDays(75))
                .actualYieldKg(new BigDecimal("2850.00"))
                .closeSeason(true)
                .build();

        CropSeasonResponse harvestedSeason = cropSeasonService.harvestSeason(farmId, season.getId(), harvestReq);
        assertEquals(SeasonStatus.DONG_VU, harvestedSeason.getStatus());
        assertEquals(new BigDecimal("2850.00"), harvestedSeason.getActualYieldKg());
        assertEquals(new BigDecimal("2.85"), harvestedSeason.getActualYieldPerM2()); // 2850kg / 1000m2 = 2.85
        assertEquals(new BigDecimal("95.00"), harvestedSeason.getYieldAchievementRate()); // 2850 / 3000 * 100 = 95%
    }
}
