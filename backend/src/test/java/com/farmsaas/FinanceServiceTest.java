package com.farmsaas;

import com.farmsaas.modules.crop.dto.CropSeasonRequest;
import com.farmsaas.modules.crop.dto.CropSeasonResponse;
import com.farmsaas.modules.crop.dto.CropTypeRequest;
import com.farmsaas.modules.crop.dto.CropTypeResponse;
import com.farmsaas.modules.crop.service.CropSeasonService;
import com.farmsaas.modules.crop.service.CropTypeService;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.CreateZoneRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.dto.ZoneResponse;
import com.farmsaas.modules.farm.service.FarmService;
import com.farmsaas.modules.farm.service.ZoneService;
import com.farmsaas.modules.finance.dto.*;
import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import com.farmsaas.modules.finance.service.*;
import com.farmsaas.modules.partner.dto.PartnerRequest;
import com.farmsaas.modules.partner.dto.PartnerResponse;
import com.farmsaas.modules.partner.service.PartnerService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class FinanceServiceTest {

    @Autowired
    private FarmService farmService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private CropTypeService cropTypeService;

    @Autowired
    private CropSeasonService cropSeasonService;

    @Autowired
    private PartnerService partnerService;

    @Autowired
    private CostCategoryService costCategoryService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private CostCalculationService costCalculationService;

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private DebtService debtService;

    private Long testTenantId;
    private Long testFarmId;
    private Long testZoneId;
    private Long testSeasonId;
    private Long testPartnerId;
    private Long testCategoryId;

    @BeforeEach
    void setUp() {
        testTenantId = 1L;
        TenantContextHolder.setTenantId(testTenantId);

        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        CreateFarmRequest farmReq = CreateFarmRequest.builder()
                .code("FARM-FIN-" + unique)
                .name("Trang Trại Finance Test " + unique)
                .farmType("TRONG_TROT")
                .address("Lâm Đồng")
                .totalAreaM2(new BigDecimal("30000.00"))
                .build();
        FarmResponse farmRes = farmService.createFarm(farmReq);
        testFarmId = farmRes.getId();

        CreateZoneRequest zoneReq = CreateZoneRequest.builder()
                .code("ZONE-FIN-" + unique)
                .name("Khu Vực A " + unique)
                .areaM2(new BigDecimal("10000.00"))
                .zoneType("OUTDOOR")
                .build();
        ZoneResponse zoneRes = zoneService.createZone(testFarmId, zoneReq);
        testZoneId = zoneRes.getId();

        CropTypeRequest cropReq = CropTypeRequest.builder()
                .name("Cà chua Cherry " + unique)
                .varietyCode("CHERRY-" + unique)
                .growthDaysStandard(75)
                .build();
        CropTypeResponse cropRes = cropTypeService.createCropType(cropReq);

        CropSeasonRequest seasonReq = CropSeasonRequest.builder()
                .seasonCode("VU-FIN-" + unique)
                .zoneId(testZoneId)
                .cropTypeId(cropRes.getId())
                .startDate(LocalDate.now().minusDays(60))
                .expectedHarvestDate(LocalDate.now().plusDays(15))
                .plantedAreaM2(new BigDecimal("5000.00"))
                .estimatedYieldKg(new BigDecimal("10000.00"))
                .build();
        CropSeasonResponse seasonRes = cropSeasonService.createSeason(testFarmId, seasonReq);
        testSeasonId = seasonRes.getId();

        PartnerRequest partnerReq = PartnerRequest.builder()
                .code("PARTNER-" + unique)
                .name("Công ty Nông Sản Sạch " + unique)
                .partnerType("DISTRIBUTOR")
                .phone("0988776655")
                .email("partner" + unique + "@cleanfarm.com")
                .address("Hà Nội")
                .build();
        PartnerResponse partnerRes = partnerService.createPartner(partnerReq);
        testPartnerId = partnerRes.getId();

        CostCategoryRequest catReq = CostCategoryRequest.builder()
                .code("CAT-VT-" + unique)
                .name("Hạt giống & Phân bón")
                .costType(CostType.TRUC_TIEP_VAT_TU)
                .build();
        CostCategoryResponse catRes = costCategoryService.createCategory(catReq);
        testCategoryId = catRes.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Ghi nhận chi phí và tính toán giá thành 1 kg rau thành công")
    void testExpenseAndCostCalculation() {
        // Ghi nhận chi phí 20,000,000 VNĐ cho vụ mùa (sản lượng dự kiến 10,000 kg -> giá thành = 2,000 đ/kg)
        ExpenseRequest expReq = ExpenseRequest.builder()
                .categoryId(testCategoryId)
                .seasonId(testSeasonId)
                .amount(new BigDecimal("20000000.00"))
                .expenseDate(LocalDate.now())
                .notes("Mua phân bón hữu cơ cho vụ cà chua")
                .build();

        ExpenseResponse expRes = expenseService.createExpense(testFarmId, expReq);
        assertNotNull(expRes);
        assertEquals(new BigDecimal("20000000.00"), expRes.getAmount());

        UnitCostCalculationResponse costRes = costCalculationService.calculateSeasonUnitCost(testFarmId, testSeasonId);
        assertNotNull(costRes);
        assertEquals(new BigDecimal("20000000.00"), costRes.getTotalProductionCost());
        assertEquals(new BigDecimal("2000.00"), costRes.getUnitCostPerKg());
    }

    @Test
    @Transactional
    @DisplayName("Tạo đơn hàng bán xuất phát sinh công nợ phải thu tự động và cập nhật Aging Report")
    void testSalesOrderAndDebtGeneration() {
        SalesOrderItemDto itemDto = SalesOrderItemDto.builder()
                .seasonId(testSeasonId)
                .productName("Cà chua Cherry VietGAP")
                .quantityKg(new BigDecimal("1000.00"))
                .unitPrice(new BigDecimal("25000.00")) // 1000 kg x 25,000 đ = 25,000,000 đ
                .build();

        // Khách trả trước 10,000,000 VNĐ -> Còn nợ 15,000,000 VNĐ
        SalesOrderRequest orderReq = SalesOrderRequest.builder()
                .partnerId(testPartnerId)
                .orderDate(LocalDate.now())
                .paidAmount(new BigDecimal("10000000.00"))
                .items(List.of(itemDto))
                .notes("Đơn hàng bán buôn siêu thị")
                .build();

        SalesOrderResponse orderRes = salesOrderService.createOrder(testFarmId, orderReq);
        assertNotNull(orderRes);
        assertEquals(new BigDecimal("25000000.00"), orderRes.getFinalAmount());
        assertEquals(new BigDecimal("15000000.00"), orderRes.getRemainingAmount());

        DebtAgingReportDto aging = debtService.getAgingReport(testFarmId);
        assertNotNull(aging);
        assertTrue(aging.getTotalReceivable().compareTo(new BigDecimal("15000000.00")) >= 0);
    }
}
