package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.dto.request.CreateSalesDeliveryRequest;
import com.farm.saas.modules.finance.dto.response.SalesDeliveryDetailResponse;
import com.farm.saas.modules.finance.entity.*;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.finance.service.BudgetService;
import com.farm.saas.modules.finance.service.FarmExpenseService;
import com.farm.saas.modules.finance.service.SalesDeliveryService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.platform.dto.response.PartnerResponse;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import com.farm.saas.modules.platform.service.PartnerService;
import com.farm.saas.modules.quality.entity.ProductBatch;
import com.farm.saas.modules.quality.entity.ProductBatchTransaction;
import com.farm.saas.modules.quality.repository.ProductBatchRepository;
import com.farm.saas.modules.quality.repository.ProductBatchTransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
public class SystemAutoSyncCascadeIntegrationTest {

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
    private BudgetRepository budgetRepository;

    @Autowired
    private BudgetLineItemRepository budgetLineItemRepository;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private FarmExpenseRepository farmExpenseRepository;

    @Autowired
    private FarmExpenseService farmExpenseService;

    @Autowired
    private CostCategoryRepository costCategoryRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private PartnerService partnerService;

    @Autowired
    private DebtRecordRepository debtRecordRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private ProductBatchTransactionRepository productBatchTransactionRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SalesOrderItemRepository salesOrderItemRepository;

    @Autowired
    private SalesDeliveryService salesDeliveryService;

    private Long tenantId;
    private Farm farm;
    private String farmManagerToken;

    @BeforeEach
    void setUp() {
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("farm_manager");
        tenantId = userDetails.getTenantId();

        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        farmManagerToken = "Bearer " + jwtTokenProvider.generateAccessToken(userDetails);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        farm = farmRepository.findByTenantId(tenantId).stream().findFirst().orElseGet(() -> {
            Farm f = Farm.builder()
                    .tenantId(tenantId)
                    .name("Auto-Sync Test Farm " + UUID.randomUUID().toString().substring(0, 4))
                    .code("SYNC-FARM-" + UUID.randomUUID().toString().substring(0, 4))
                    .status("ACTIVE")
                    .farmType("MIXED")
                    .createdAt(Instant.now())
                    .build();
            return farmRepository.save(f);
        });
    }

    @Test
    @DisplayName("GAP-SYNC-07: Auto-Backflushing tự động tiêu hao ngân sách & Hoàn trả chính xác khi hủy chi phí")
    void testBudgetConsumptionAndRevertOnBackflushingAndCancellation() {
        int currentYear = LocalDate.now().getYear();

        // 1. Tạo CostCategory
        CostCategory cat = costCategoryRepository.findByTenantIdAndCostType(tenantId, "MATERIALS").stream().findFirst().orElseGet(() -> {
            CostCategory c = CostCategory.builder()
                    .tenantId(tenantId)
                    .name("Vật tư phân bón kiểm thử")
                    .code("MAT-SYNC-" + UUID.randomUUID().toString().substring(0, 4))
                    .costType("MATERIALS")
                    .createdAt(Instant.now())
                    .build();
            return costCategoryRepository.save(c);
        });

        // 2. Tạo Budget ACTIVE cho trang trại với line item 10,000,000 VNĐ, spent = 0
        Budget budget = Budget.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .fiscalYear(currentYear)
                .name("Ngân sách kiểm thử Auto-Sync " + currentYear)
                .totalBudgetAmount(new BigDecimal("10000000.00"))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        budget = budgetRepository.save(budget);

        BudgetLineItem lineItem = BudgetLineItem.builder()
                .budgetId(budget.getId())
                .costCategoryId(cat.getId())
                .allocatedAmount(new BigDecimal("10000000.00"))
                .spentAmount(BigDecimal.ZERO)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        lineItem = budgetLineItemRepository.save(lineItem);

        // 3. Giả lập một FarmExpense sinh từ Auto-Backflushing (CONFIRMED) với số tiền 2,500,000 VNĐ
        BigDecimal expenseAmount = new BigDecimal("2500000.00");
        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .costCategoryId(cat.getId())
                .expenseCode("EXP-SYNC-" + UUID.randomUUID().toString().substring(0, 6))
                .expenseSource("INVENTORY_BACKFLUSH")
                .expenseDate(LocalDate.now())
                .amount(expenseAmount)
                .unitCostEligible(true)
                .status("CONFIRMED")
                .createdAt(Instant.now())
                .build();
        expense = farmExpenseRepository.save(expense);

        // Kích hoạt consumeBudgetForConfirmedExpense
        budgetService.consumeBudgetForConfirmedExpense(expense);

        // 4. Kiểm chứng: spentAmount của BudgetLineItem phải tự động tăng lên 2,500,000 VNĐ
        BudgetLineItem updatedLineItem = budgetLineItemRepository.findById(lineItem.getId()).orElseThrow();
        assertEquals(0, expenseAmount.compareTo(updatedLineItem.getSpentAmount()),
                "BudgetLineItem.spentAmount phải tăng lên đúng bằng số tiền chi phí backflush 2,500,000 VNĐ");

        // 5. Hủy chi phí và hoàn trả ngân sách (revertBudgetForCancelledExpense)
        expense.setStatus("CANCELLED");
        expense = farmExpenseRepository.save(expense);
        budgetService.revertBudgetForCancelledExpense(expense);

        // 6. Kiểm chứng: spentAmount của BudgetLineItem phải được hoàn trả về 0.00 VNĐ
        BudgetLineItem revertedLineItem = budgetLineItemRepository.findById(lineItem.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(revertedLineItem.getSpentAmount()),
                "BudgetLineItem.spentAmount phải được hoàn trả giảm về 0 sau khi chi phí bị hủy");
    }

    @Test
    @DisplayName("GAP-SYNC-08: Hủy chuyến giao hàng (cancelDelivery) hoàn trả số lượng tồn kho và giữ chỗ ProductBatch")
    void testCancelSalesDeliveryRestoresInventoryAndLedger() {
        // 1. Tạo đối tác khách hàng
        Partner customer = Partner.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .code("CUST-SYNC-" + UUID.randomUUID().toString().substring(0, 4))
                .name("Khách Hàng Kiểm Thử Sync")
                .partnerType("BUYER")
                .status("ACTIVE")
                .paymentTermDays(30)
                .createdAt(Instant.now())
                .build();
        customer = partnerRepository.save(customer);

        // 2. Tạo lô thành phẩm với tồn kho 100, giữ chỗ 50
        ProductBatch batch = ProductBatch.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .batchCode("BATCH-SYNC-" + UUID.randomUUID().toString().substring(0, 4))
                .productName("Dưa Lưới Fuji Xuất Khẩu")
                .harvestDate(LocalDate.now())
                .initialQuantity(new BigDecimal("100.00"))
                .remainingQuantity(new BigDecimal("100.00"))
                .reservedQuantity(new BigDecimal("50.00"))
                .unit("KG")
                .status("SELLING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        batch = productBatchRepository.save(batch);

        // 3. Tạo đơn bán sỉ CONFIRMED
        SalesOrder order = SalesOrder.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .partnerId(customer.getId())
                .orderCode("SO-SYNC-" + UUID.randomUUID().toString().substring(0, 4))
                .orderDate(LocalDate.now())
                .subtotalAmount(new BigDecimal("5000000.00"))
                .discountAmount(BigDecimal.ZERO)
                .vatRate(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("5000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .debtAmount(new BigDecimal("5000000.00"))
                .paymentStatus("UNPAID")
                .status("CONFIRMED")
                .createdAt(Instant.now())
                .build();
        order = salesOrderRepository.save(order);

        SalesOrderItem orderItem = SalesOrderItem.builder()
                .salesOrderId(order.getId())
                .productBatchId(batch.getId())
                .itemName("Dưa Lưới Fuji")
                .quantity(new BigDecimal("50.00"))
                .unit("KG")
                .unitPrice(new BigDecimal("100000.00"))
                .discountAmount(BigDecimal.ZERO)
                .vatAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("5000000.00"))
                .shippedQuantity(BigDecimal.ZERO)
                .createdAt(Instant.now())
                .build();
        orderItem = salesOrderItemRepository.save(orderItem);

        // 4. Tạo phiếu xuất giao hàng 20 KG -> trừ tồn kho còn 80, giải phóng giữ chỗ còn 30
        BigDecimal deliveryQty = new BigDecimal("20.00");
        CreateSalesDeliveryRequest deliveryReq = CreateSalesDeliveryRequest.builder()
                .salesOrderId(order.getId())
                .deliveryDate(LocalDate.now())
                .vehiclePlate("59B-123.45")
                .driverName("Nguyễn Văn Tài Xế")
                .receiverName("Kho Metro Quận 2")
                .shippingAddress("Xa Lộ Hà Nội, TP Thủ Đức")
                .status("DISPATCHED")
                .notes("Giao đợt 1")
                .items(List.of(
                        CreateSalesDeliveryRequest.SalesDeliveryItemRequest.builder()
                                .salesOrderItemId(orderItem.getId())
                                .productBatchId(batch.getId())
                                .quantity(deliveryQty)
                                .notes("Thùng 20kg")
                                .build()
                ))
                .build();

        SalesDeliveryDetailResponse createdDelivery = salesDeliveryService.createDelivery(farm.getId(), deliveryReq);
        assertNotNull(createdDelivery);
        assertEquals("DISPATCHED", createdDelivery.getStatus());

        // Kiểm tra tồn kho sau khi tạo giao hàng: remaining = 80, reserved = 30
        ProductBatch batchAfterDelivery = productBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("80.00").compareTo(batchAfterDelivery.getRemainingQuantity()));
        assertEquals(0, new BigDecimal("30.00").compareTo(batchAfterDelivery.getReservedQuantity()));

        // 5. Thực hiện HỦY CHUYẾN GIAO HÀNG qua API POST /api/v1/farms/{farmId}/sales-deliveries/{id}/cancel
        salesDeliveryService.cancelDelivery(farm.getId(), createdDelivery.getId(), "Đối tác dời lịch nhận hàng");

        // 6. Kiểm chứng:
        // - Trạng thái của chuyến giao hàng phải là CANCELLED
        SalesDeliveryDetailResponse cancelledDelivery = salesDeliveryService.getDeliveryById(farm.getId(), createdDelivery.getId());
        assertEquals("CANCELLED", cancelledDelivery.getStatus());

        // - Tồn kho ProductBatch phải được hoàn trả chính xác về 100.00, và reservedQuantity được khôi phục về 50.00
        ProductBatch restoredBatch = productBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("100.00").compareTo(restoredBatch.getRemainingQuantity()),
                "ProductBatch.remainingQuantity phải được hoàn trả về 100.00");
        assertEquals(0, new BigDecimal("50.00").compareTo(restoredBatch.getReservedQuantity()),
                "ProductBatch.reservedQuantity phải được khôi phục về 50.00");

        // - Sổ cái bất biến ProductBatchTransaction phải có bản ghi DELIVERY_CANCEL loại IN
        List<ProductBatchTransaction> txList = productBatchTransactionRepository.findByProductBatchIdOrderByCreatedAtDesc(batch.getId());
        boolean hasCancelTx = txList.stream().anyMatch(t ->
                "DELIVERY_CANCEL".equals(t.getTransactionType()) && "IN".equals(t.getDirection()) &&
                deliveryQty.compareTo(t.getQuantity()) == 0);
        assertTrue(hasCancelTx, "Phải ghi sổ cái ProductBatchTransaction loại DELIVERY_CANCEL hướng IN với số lượng 20");
    }

    @Test
    @DisplayName("GAP-SYNC-08: Tính công nợ đối tác loại trừ chuẩn xác các trạng thái SETTLED và BAD_DEBT")
    void testPartnerDebtCalculationExcludesSettledAndBadDebt() {
        Partner supplier = Partner.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .code("SUPP-SYNC-" + UUID.randomUUID().toString().substring(0, 4))
                .name("Nhà Cung Cấp Phân Bón Sync")
                .partnerType("SUPPLIER")
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build();
        supplier = partnerRepository.save(supplier);

        // Khoản nợ 1: ACTIVE (remaining: 5,000,000) -> Phải được tính
        DebtRecord debtActive = DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .partnerId(supplier.getId())
                .debtType("PAYABLE")
                .totalDebt(new BigDecimal("5000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("5000000.00"))
                .dueDate(LocalDate.now().plusDays(30))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build();
        debtRecordRepository.save(debtActive);

        // Khoản nợ 2: SETTLED (remaining: 0.00) -> Không được tính
        DebtRecord debtSettled = DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .partnerId(supplier.getId())
                .debtType("PAYABLE")
                .totalDebt(new BigDecimal("3000000.00"))
                .paidAmount(new BigDecimal("3000000.00"))
                .remainingDebt(BigDecimal.ZERO)
                .dueDate(LocalDate.now().minusDays(10))
                .status("SETTLED")
                .createdAt(Instant.now())
                .build();
        debtRecordRepository.save(debtSettled);

        // Khoản nợ 3: BAD_DEBT (nợ xấu đã xóa sổ) -> Không được tính
        DebtRecord debtBad = DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farm.getId())
                .partnerId(supplier.getId())
                .debtType("PAYABLE")
                .totalDebt(new BigDecimal("2000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("2000000.00"))
                .dueDate(LocalDate.now().minusDays(60))
                .status("BAD_DEBT")
                .createdAt(Instant.now())
                .build();
        debtRecordRepository.save(debtBad);

        // Truy vấn đối tác qua PartnerService
        PartnerResponse response = partnerService.getPartnerById(supplier.getId());
        assertNotNull(response);

        // Kiểm chứng: currentPayableDebt chỉ bằng 5,000,000 (khoản ACTIVE), loại trừ hoàn toàn SETTLED và BAD_DEBT
        assertEquals(0, new BigDecimal("5000000.00").compareTo(response.getCurrentPayableDebt()),
                "Tổng nợ phải trả của đối tác phải là 5,000,000 VNĐ (chỉ tính ACTIVE, loại trừ SETTLED và BAD_DEBT)");
    }
}
