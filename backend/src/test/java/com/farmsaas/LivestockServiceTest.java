package com.farmsaas;

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
import com.farmsaas.modules.crop.dto.FarmingLogRequest.SuppliesUsedItem;
import com.farmsaas.modules.livestock.dto.*;
import com.farmsaas.modules.livestock.entity.enums.*;
import com.farmsaas.modules.livestock.service.LivestockBreedService;
import com.farmsaas.modules.livestock.service.LivestockEventService;
import com.farmsaas.modules.livestock.service.LivestockGroupService;
import com.farmsaas.modules.livestock.service.LivestockIndividualService;
import com.farmsaas.tenant.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class LivestockServiceTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private LivestockBreedService breedService;

    @Autowired
    private LivestockGroupService groupService;

    @Autowired
    private LivestockIndividualService individualService;

    @Autowired
    private LivestockEventService eventService;

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

        // 1. Tạo farm chăn nuôi
        String farmCode = "FARM-LIVE-" + System.currentTimeMillis();
        FarmResponse farm = farmService.createFarm(CreateFarmRequest.builder()
                .code(farmCode)
                .name("Trang Trại Chăn Nuôi Bò Sữa Công Nghệ Cao")
                .farmType("CHAN_NUOI")
                .totalAreaM2(new BigDecimal("50000"))
                .address("Mộc Châu, Sơn La")
                .build());
        farmId = farm.getId();

        // 2. Tạo phân khu chuồng trại
        String zoneCode = "ZONE-BARN-" + System.currentTimeMillis();
        ZoneResponse zone = zoneService.createZone(farmId, CreateZoneRequest.builder()
                .code(zoneCode)
                .name("Chuồng nuôi bò sữa sinh sản số 1")
                .zoneType("CHUONG_TRAI")
                .areaM2(new BigDecimal("3500.00"))
                .status("ACTIVE")
                .build());
        zoneId = zone.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Kiểm thử trọn vẹn Chăn nuôi: Lập chỉ mục RFID tự động, Hồ sơ cá thể, Sự kiện tiêm vắc-xin tự trừ kho ngầm (Backflushing)")
    void testLivestockFullLifecycle() {
        // 1. Tạo giống vật nuôi (Bò sữa HF)
        LivestockBreedResponse breed = breedService.createBreed(LivestockBreedRequest.builder()
                .species(LivestockSpecies.BO)
                .breedName("Bò sữa thuần chủng Holstein Friesian (HF)")
                .standardGrowthDays(450)
                .targetWeightKg(new BigDecimal("550.00"))
                .build());
        assertNotNull(breed.getId());
        assertEquals(LivestockSpecies.BO, breed.getSpecies());

        // 2. Tạo đàn vật nuôi (Đàn bò tơ 2026)
        LivestockGroupResponse group = groupService.createGroup(farmId, LivestockGroupRequest.builder()
                .zoneId(zoneId)
                .breedId(breed.getId())
                .initialQuantity(20)
                .entryDate(LocalDate.now())
                .notes("Nhập đàn bò giống F1")
                .build());
        assertNotNull(group.getId());
        assertTrue(group.getGroupCode().startsWith("DAN-"));
        assertEquals(20, group.getCurrentQuantity());

        // 3. Đăng ký cá thể số 1 - KHÔNG truyền rfidTagCode -> Kiểm tra thuật toán tự động sinh [SPECIES]-[YEAR]-[SEQUENCE]
        LivestockIndividualResponse ind1 = individualService.createIndividual(farmId, LivestockIndividualRequest.builder()
                .zoneId(zoneId)
                .species(LivestockSpecies.BO)
                .groupId(group.getId())
                .gender(Gender.CAI)
                .birthDate(LocalDate.now().minusDays(300))
                .motherTagCode("BO-2024-00088")
                .fatherTagCode("BO-2023-00012")
                .currentWeightKg(new BigDecimal("320.50"))
                .healthStatus(HealthStatus.KHOE_MANH)
                .notes("Bò cái tơ phát triển tốt")
                .build());

        assertNotNull(ind1.getId());
        int currentYear = LocalDate.now().getYear();
        String expectedPrefix = "BO-" + currentYear + "-";
        assertTrue(ind1.getRfidTagCode().startsWith(expectedPrefix),
                "Mã RFID phải có tiền tố " + expectedPrefix + " nhưng nhận được: " + ind1.getRfidTagCode());

        // Đăng ký cá thể số 2 -> Kiểm tra mã tăng tuần tự không trùng lặp
        LivestockIndividualResponse ind2 = individualService.createIndividual(farmId, LivestockIndividualRequest.builder()
                .zoneId(zoneId)
                .species(LivestockSpecies.BO)
                .groupId(group.getId())
                .gender(Gender.DUC)
                .birthDate(LocalDate.now().minusDays(200))
                .currentWeightKg(new BigDecimal("280.00"))
                .build());

        assertNotEquals(ind1.getRfidTagCode(), ind2.getRfidTagCode(), "Mã RFID giữa 2 cá thể phải hoàn toàn duy nhất!");

        // 4. Tra cứu lý lịch cá thể theo mã RFID
        LivestockIndividualResponse foundByRfid = individualService.getIndividualByRfid(ind1.getRfidTagCode());
        assertEquals(ind1.getId(), foundByRfid.getId());
        assertEquals("BO-2024-00088", foundByRfid.getMotherTagCode());

        // 5. Chuẩn bị kho thuốc thú y & vắc-xin: nhập 50 lọ Vắc-xin LMLM
        WarehouseResponse vetWarehouse = warehouseService.createWarehouse(farmId, WarehouseRequest.builder()
                .code("KHO-THUOC-" + System.currentTimeMillis())
                .name("Kho thuốc thú y & vắc-xin trung tâm")
                .warehouseType(WarehouseType.KHO_THUOC_BVTV)
                .locationDesc("Phòng y tế trang trại")
                .build());

        MaterialCategoryResponse medCat = materialService.createCategory(MaterialCategoryRequest.builder()
                .code("CAT-VET-" + System.currentTimeMillis())
                .name("Thuốc thú y & Vắc-xin")
                .build());

        MaterialResponse vaccine = materialService.createMaterial(MaterialRequest.builder()
                .categoryId(medCat.getId())
                .skuCode("VAC-LMLM-" + System.currentTimeMillis())
                .name("Vắc-xin Lở mồm long móng AFTOPOR")
                .standardUnit(StandardUnit.CHAI)
                .minStockLevel(new BigDecimal("5.00"))
                .unitPriceStandard(new BigDecimal("85000.00"))
                .build());

        // Nhập kho 50 lọ vắc-xin
        inventoryService.createReceipt(farmId, WarehouseReceiptRequest.builder()
                .warehouseId(vetWarehouse.getId())
                .receiptType(ReceiptType.PURCHASE)
                .items(List.of(
                        WarehouseReceiptRequest.ReceiptItemRequest.builder()
                                .materialId(vaccine.getId())
                                .batchNumber("BATCH-VAC-99")
                                .quantity(new BigDecimal("50.00"))
                                .unitPrice(new BigDecimal("85000.00"))
                                .expiryDate(LocalDate.now().plusMonths(6))
                                .build()
                ))
                .build());

        // 6. Ghi nhận sự kiện TIÊM PHÒNG cho cá thể ind1, sử dụng 2 lọ vắc-xin -> KÍCH HOẠT INVENTORY BACKFLUSHING
        LivestockEventResponse eventRes = eventService.recordEvent(farmId, LivestockEventRequest.builder()
                .targetType(TargetType.INDIVIDUAL)
                .targetId(ind1.getId())
                .eventType(LivestockEventType.TIEM_PHONG)
                .warehouseId(vetWarehouse.getId())
                .suppliesUsed(List.of(
                        SuppliesUsedItem.builder()
                                .materialId(vaccine.getId())
                                .batchNumber("BATCH-VAC-99")
                                .quantity(new BigDecimal("2.00"))
                                .unit("CHAI")
                                .build()
                ))
                .notes("Tiêm mũi nhắc lại vắc-xin LMLM định kỳ 6 tháng")
                .build());

        assertNotNull(eventRes.getId());
        assertEquals(LivestockEventType.TIEM_PHONG, eventRes.getEventType());

        // Kiểm tra TỒN KHO VẮC-XIN ĐƯỢC TỰ ĐỘNG TRỪ: 50 - 2 = 48 lọ
        List<InventoryStockResponse> remainingVaccine = inventoryService.getInventoryByWarehouse(farmId, vetWarehouse.getId());
        assertEquals(new BigDecimal("48.00"), remainingVaccine.get(0).getQuantityOnHand(),
                "Inventory Backflushing phải tự động trừ kho 2 lọ vắc-xin khi ghi nhận sự kiện tiêm phòng!");

        // 7. Ghi nhận sự kiện ĐO TRỌNG LƯỢNG (cân nặng tăng lên 355.20 kg)
        eventService.recordEvent(farmId, LivestockEventRequest.builder()
                .targetType(TargetType.INDIVIDUAL)
                .targetId(ind1.getId())
                .eventType(LivestockEventType.DO_TRONG_LUONG)
                .detailsJson("{\"weightKg\": \"355.20\"}")
                .notes("Đo trọng lượng định kỳ tháng thứ 11")
                .build());

        // Kiểm tra cân nặng của cá thể đã được tự động cập nhật
        LivestockIndividualResponse updatedInd1 = individualService.getIndividualById(farmId, ind1.getId());
        assertEquals(new BigDecimal("355.20"), updatedInd1.getCurrentWeightKg(),
                "Cân nặng của cá thể phải được tự động cập nhật sau sự kiện DO_TRONG_LUONG!");
    }
}
