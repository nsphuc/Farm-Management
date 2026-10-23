package com.farm.saas;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.dto.request.*;
import com.farm.saas.modules.finance.entity.*;
import com.farm.saas.modules.finance.repository.*;
import com.farm.saas.modules.finance.service.DebtAndPaymentService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.notification.entity.Notification;
import com.farm.saas.modules.notification.repository.NotificationRepository;
import com.farm.saas.modules.platform.entity.AuditLog;
import com.farm.saas.modules.platform.entity.Enterprise;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.AuditLogRepository;
import com.farm.saas.modules.platform.repository.EnterpriseRepository;
import com.farm.saas.modules.platform.repository.PartnerRepository;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class FinanceCommercialAndReportsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private DebtAndPaymentService debtAndPaymentService;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private ProductionZoneRepository productionZoneRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private EnterpriseRepository enterpriseRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private ProductBatchTransactionRepository productBatchTransactionRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SalesOrderItemRepository salesOrderItemRepository;

    @Autowired
    private SalesDeliveryRepository salesDeliveryRepository;

    @Autowired
    private DebtRecordRepository debtRecordRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private CostCategoryRepository costCategoryRepository;

    @Autowired
    private FarmExpenseRepository farmExpenseRepository;

    @Autowired
    private CostAllocationRepository costAllocationRepository;

    @Autowired
    private CropSeasonRepository cropSeasonRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Long farmId;
    private Long zoneId;
    private String token;
    private CustomUserDetails ownerUser;
    private final Long tenantId = 1L;

    @BeforeEach
    void setUp() {
        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_FIN_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_FIN_TEST")
                        .name("Nông Trại Tài Chính & Thương Mại Test")
                        .farmType("MIXED")
                        .totalAreaM2(new BigDecimal("50000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.farmId = farm.getId();

        ProductionZone zone = productionZoneRepository.findByFarmIdAndCode(farmId, "ZONE_FIN_01")
                .orElseGet(() -> productionZoneRepository.save(ProductionZone.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("ZONE_FIN_01")
                        .name("Khu Vực Sản Xuất Tài Chính")
                        .zoneType("OPEN_FIELD")
                        .areaM2(new BigDecimal("10000.00"))
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.zoneId = zone.getId();

        // Cập nhật thông tin ngân hàng cho doanh nghiệp tenant 1 để sinh VietQR Napas247 URL
        enterpriseRepository.findByTenantId(tenantId).ifPresentOrElse(ent -> {
            ent.setBankBin("970415");
            ent.setBankAccountNo("1133669988");
            ent.setBankAccountName("CONG TY TNHH FARM SAAS");
            enterpriseRepository.save(ent);
        }, () -> {
            enterpriseRepository.save(Enterprise.builder()
                    .tenantId(tenantId)
                    .taxNumber("0102030405")
                    .legalRepresentative("Nguyen Van A")
                    .bankBin("970415")
                    .bankAccountNo("1133669988")
                    .bankAccountName("CONG TY TNHH FARM SAAS")
                    .build());
        });

        // Đảm bảo có user farm_manager
        Long managerUserId;
        try {
            managerUserId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE username = 'farm_manager'", Long.class);
        } catch (Exception ex) {
            jdbcTemplate.update("INSERT INTO users (tenant_id, is_super_admin, username, email, password_hash, full_name, phone, status, must_change_password) " +
                    "VALUES (?, FALSE, 'farm_manager', 'manager.dalat@greenfarm.vn', '$2a$10$4H94PyL16o.bO1q3iClRA./YtmOjG8kwV3OBy3lKNVUppAaGY1sDu', 'Giám Đốc Trại', '0978901234', 'ACTIVE', FALSE)", tenantId);
            managerUserId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE username = 'farm_manager'", Long.class);
            Long fmRoleId = jdbcTemplate.queryForObject("SELECT id FROM roles WHERE code = 'ROLE_FARM_MANAGER'", Long.class);
            jdbcTemplate.update("INSERT IGNORE INTO user_roles (tenant_id, user_id, role_id, farm_id) VALUES (?, ?, ?, ?)", tenantId, managerUserId, fmRoleId, farmId);
        }
        jdbcTemplate.update("INSERT IGNORE INTO user_farm_access (user_id, farm_id, tenant_id) VALUES (?, ?, ?)", managerUserId, farmId, tenantId);
        jdbcTemplate.update("UPDATE farms SET manager_user_id = ? WHERE id = ?", managerUserId, farmId);

        this.ownerUser = (CustomUserDetails) userDetailsService.loadUserByUsername("farm_manager");
        this.token = jwtTokenProvider.generateAccessToken(ownerUser);
    }

    @Test
    @DisplayName("TC-FIN-001 & TC-FIN-002: Đơn bán sỉ chặn vượt hạn mức -> Giữ chỗ lô 50kg -> Xuất giao 30kg -> Trừ tồn, ghi sổ cái & sinh công nợ phải thu")
    void testWholesaleOrderCreditLimitAndBatchReservationAndMultiStageDelivery() throws Exception {
        // 1. Tạo đối tác BUYER có hạn mức tín dụng 2,000,000 VNĐ
        String buyerCode = "BUYER_TEST_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Partner buyer = partnerRepository.save(Partner.builder()
                .tenantId(tenantId)
                .code(buyerCode)
                .name("Đại Lý Bán Buôn Nông Sản Test")
                .partnerType("BUYER")
                .creditLimit(new BigDecimal("2000000.00"))
                .paymentTermDays(30)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        // 2. Tạo lô thành phẩm 100 kg
        String batchCode = "LOT-PB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ProductBatch batch = productBatchRepository.save(ProductBatch.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .batchCode(batchCode)
                .productName("Dưa Lưới Fuji Nhật Bản")
                .harvestDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusDays(30))
                .initialQuantity(new BigDecimal("100.00"))
                .remainingQuantity(new BigDecimal("100.00"))
                .reservedQuantity(BigDecimal.ZERO)
                .unit("KG")
                .status("SELLING")
                .createdAt(Instant.now())
                .build());

        // 3. Thử tạo đơn bán sỉ vượt hạn mức tín dụng (100 kg * 30,000 = 3,000,000 VNĐ > 2,000,000 VNĐ)
        CreateSalesOrderRequest exceedOrderReq = CreateSalesOrderRequest.builder()
                .partnerId(buyer.getId())
                .orderDate(LocalDate.now())
                .items(List.of(
                        CreateSalesOrderRequest.SalesOrderItemRequest.builder()
                                .productBatchId(batch.getId())
                                .itemName("Dưa Lưới Fuji Nhật Bản")
                                .quantity(new BigDecimal("100.00"))
                                .unit("KG")
                                .unitPrice(new BigDecimal("30000.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exceedOrderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("EXCEED_CREDIT_LIMIT")));

        // 4. Tạo đơn hợp lệ trong hạn mức (50 kg * 30,000 = 1,500,000 VNĐ <= 2,000,000 VNĐ)
        CreateSalesOrderRequest validOrderReq = CreateSalesOrderRequest.builder()
                .partnerId(buyer.getId())
                .orderDate(LocalDate.now())
                .items(List.of(
                        CreateSalesOrderRequest.SalesOrderItemRequest.builder()
                                .productBatchId(batch.getId())
                                .itemName("Dưa Lưới Fuji Nhật Bản")
                                .quantity(new BigDecimal("50.00"))
                                .unit("KG")
                                .unitPrice(new BigDecimal("30000.00"))
                                .build()
                ))
                .build();

        MvcResult createOrderResult = mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validOrderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.finalAmount").value(1500000.00))
                .andExpect(jsonPath("$.debtAmount").value(1500000.00))
                .andExpect(jsonPath("$.vietQrUrl", containsString("img.vietqr.io")))
                .andReturn();

        Long orderId = objectMapper.readTree(createOrderResult.getResponse().getContentAsString()).get("id").asLong();

        // 5. Duyệt đơn (CONFIRMED) -> Giữ chỗ lô reserved_quantity = 50 kg
        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-orders/{id}/confirm", farmId, orderId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        ProductBatch batchAfterConfirm = productBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("100.00").compareTo(batchAfterConfirm.getRemainingQuantity()));
        assertEquals(0, new BigDecimal("50.00").compareTo(batchAfterConfirm.getReservedQuantity()));

        // 6. Lấy ID dòng đơn hàng
        Long orderItemId = salesOrderItemRepository.findBySalesOrderId(orderId).get(0).getId();

        // 7. Thử giao vượt số lượng (60 kg > 50 kg) -> 409 OVER_DELIVERY_PROHIBITED
        CreateSalesDeliveryRequest overDeliveryReq = CreateSalesDeliveryRequest.builder()
                .salesOrderId(orderId)
                .deliveryDate(LocalDate.now())
                .items(List.of(
                        CreateSalesDeliveryRequest.SalesDeliveryItemRequest.builder()
                                .salesOrderItemId(orderItemId)
                                .productBatchId(batch.getId())
                                .quantity(new BigDecimal("60.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-deliveries", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overDeliveryReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("OVER_DELIVERY_PROHIBITED"));

        // 8. Xuất giao hàng đợt 1 (30 kg)
        CreateSalesDeliveryRequest deliveryReq = CreateSalesDeliveryRequest.builder()
                .salesOrderId(orderId)
                .deliveryDate(LocalDate.now())
                .receiverName("Nguyễn Văn Nhận")
                .items(List.of(
                        CreateSalesDeliveryRequest.SalesDeliveryItemRequest.builder()
                                .salesOrderItemId(orderItemId)
                                .productBatchId(batch.getId())
                                .quantity(new BigDecimal("30.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/sales-deliveries", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        // 9. Xác nhận trừ tồn: remaining_quantity = 70 kg, reserved_quantity = 20 kg
        ProductBatch batchAfterDelivery = productBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("70.00").compareTo(batchAfterDelivery.getRemainingQuantity()));
        assertEquals(0, new BigDecimal("20.00").compareTo(batchAfterDelivery.getReservedQuantity()));

        // 10. Xác nhận dòng đơn hàng: shipped_quantity = 30 kg
        assertEquals(0, new BigDecimal("30.00").compareTo(salesOrderItemRepository.findById(orderItemId).orElseThrow().getShippedQuantity()));

        // 11. Xác nhận ghi sổ cái bất biến product_batch_transactions
        List<ProductBatchTransaction> transactions = productBatchTransactionRepository.findByProductBatchIdOrderByCreatedAtDesc(batch.getId());
        assertFalse(transactions.isEmpty());
        ProductBatchTransaction lastTx = transactions.get(0);
        assertEquals("SALE_DISPATCH", lastTx.getTransactionType());
        assertEquals("SALES_DELIVERY", lastTx.getReferenceType());
        assertEquals("OUT", lastTx.getDirection());
        assertEquals(0, new BigDecimal("30.00").compareTo(lastTx.getQuantity()));
        assertEquals(0, new BigDecimal("100.00").compareTo(lastTx.getBalanceBefore()));
        assertEquals(0, new BigDecimal("70.00").compareTo(lastTx.getBalanceAfter()));

        // 12. Xác nhận sinh công nợ phải thu RECEIVABLE
        DebtRecord debt = debtRecordRepository.findBySalesOrderId(orderId).orElseThrow();
        assertEquals("RECEIVABLE", debt.getDebtType());
        assertEquals(buyer.getId(), debt.getPartnerId());
        assertEquals(0, new BigDecimal("1500000.00").compareTo(debt.getTotalDebt()));
        assertEquals(0, new BigDecimal("1500000.00").compareTo(debt.getRemainingDebt()));
        assertEquals("ACTIVE", debt.getStatus());
    }

    @Test
    @DisplayName("TC-FIN-003: Cấn trừ công nợ 2 chiều DEBT_OFFSET giữa Nợ phải thu 50tr và Nợ phải trả 30tr -> Nợ trả SETTLED (0), nợ thu còn 20tr")
    void testTwoWayDebtOffset() throws Exception {
        // Tạo đối tác AGENT
        String agentCode = "AGENT_OFFSET_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Partner agent = partnerRepository.save(Partner.builder()
                .tenantId(tenantId)
                .code(agentCode)
                .name("Đại Lý Phân Phối Đối Tác Cấn Trừ")
                .partnerType("AGENT")
                .creditLimit(new BigDecimal("100000000.00"))
                .paymentTermDays(45)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        // Khoản nợ phải thu: 50,000,000 VNĐ
        DebtRecord receivableDebt = debtRecordRepository.save(DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .partnerId(agent.getId())
                .debtType("RECEIVABLE")
                .totalDebt(new BigDecimal("50000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("50000000.00"))
                .dueDate(LocalDate.now().plusDays(30))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        // Khoản nợ phải trả: 30,000,000 VNĐ
        DebtRecord payableDebt = debtRecordRepository.save(DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .partnerId(agent.getId())
                .debtType("PAYABLE")
                .totalDebt(new BigDecimal("30000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("30000000.00"))
                .dueDate(LocalDate.now().plusDays(15))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        // Gọi API cấn trừ công nợ 2 chiều 30 triệu VNĐ
        DebtOffsetRequest offsetRequest = DebtOffsetRequest.builder()
                .partnerId(agent.getId())
                .receivableDebtId(receivableDebt.getId())
                .payableDebtId(payableDebt.getId())
                .offsetAmount(new BigDecimal("30000000.00"))
                .notes("Cấn trừ công nợ đối ứng đợt thu mua nông sản")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/debts/offset", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offsetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethod").value("DEBT_OFFSET"))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.amount").value(30000000.00));

        // Kiểm tra nợ phải trả: SETTLED, remaining_debt = 0.00
        DebtRecord payableAfter = debtRecordRepository.findById(payableDebt.getId()).orElseThrow();
        assertEquals("SETTLED", payableAfter.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(payableAfter.getRemainingDebt()));
        assertEquals(0, new BigDecimal("30000000.00").compareTo(payableAfter.getPaidAmount()));

        // Kiểm tra nợ phải thu: ACTIVE, remaining_debt = 20,000,000.00
        DebtRecord receivableAfter = debtRecordRepository.findById(receivableDebt.getId()).orElseThrow();
        assertEquals("ACTIVE", receivableAfter.getStatus());
        assertEquals(0, new BigDecimal("20000000.00").compareTo(receivableAfter.getRemainingDebt()));
        assertEquals(0, new BigDecimal("30000000.00").compareTo(receivableAfter.getPaidAmount()));

        // Kiểm tra lưu vết bất biến payment_allocations (#68)
        List<PaymentAllocation> recAllocations = paymentAllocationRepository.findByDebtRecordId(receivableDebt.getId());
        List<PaymentAllocation> payAllocations = paymentAllocationRepository.findByDebtRecordId(payableDebt.getId());
        assertFalse(recAllocations.isEmpty());
        assertFalse(payAllocations.isEmpty());
        assertEquals(0, new BigDecimal("30000000.00").compareTo(recAllocations.get(0).getAllocatedAmount()));
        assertEquals(0, new BigDecimal("30000000.00").compareTo(payAllocations.get(0).getAllocatedAmount()));
    }

    @Test
    @DisplayName("TC-FIN-004: Ghi nhận chi phí tiền điện 10tr -> Phân bổ 5tr vào vụ mùa 5,000kg -> Tính unit-cost chính xác 1,000 VNĐ/kg")
    void testExpenseRecordingAllocationAndUnitCostCalculation() throws Exception {
        // 1. Tạo khoản mục chi phí UTILITY
        String catCode = "CAT_ELEC_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CostCategory category = costCategoryRepository.save(CostCategory.builder()
                .tenantId(tenantId)
                .code(catCode)
                .name("Chi phí điện năng tưới tiêu")
                .costType("INDIRECT_OVERHEAD")
                .createdAt(Instant.now())
                .build());

        // 2. Tạo mùa vụ với sản lượng thu hoạch 5,000 kg
        String seasonCode = "CROP-ELEC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CropSeason season = cropSeasonRepository.save(CropSeason.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .zoneId(zoneId)
                .seasonCode(seasonCode)
                .cropTypeId(1L)
                .startDate(LocalDate.now().minusMonths(3))
                .expectedHarvestDate(LocalDate.now())
                .plantedAreaM2(new BigDecimal("5000.00"))
                .actualYieldKg(new BigDecimal("5000.00"))
                .status("HARVESTING")
                .build());

        // 3. Ghi nhận chi phí hóa đơn điện 10 triệu VNĐ
        CreateFarmExpenseRequest expenseReq = CreateFarmExpenseRequest.builder()
                .costCategoryId(category.getId())
                .expenseSource("UTILITY_BILL")
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("10000000.00"))
                .paymentMethod("BANK_TRANSFER")
                .status("CONFIRMED")
                .notes("Hóa đơn tiền điện trạm bơm tháng này")
                .build();

        MvcResult createExpResult = mockMvc.perform(post("/api/v1/farms/{farmId}/expenses", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expenseReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.amount").value(10000000.00))
                .andReturn();

        Long expenseId = objectMapper.readTree(createExpResult.getResponse().getContentAsString()).get("id").asLong();

        // 4. Thử phân bổ vượt tổng tiền chi phí (11M > 10M) -> Expect 400 Bad Request
        AllocateCostRequest exceedAllocReq = AllocateCostRequest.builder()
                .allocations(List.of(
                        AllocateCostRequest.CostAllocationItemRequest.builder()
                                .targetType("CROP_SEASON")
                                .targetId(season.getId())
                                .allocatedAmount(new BigDecimal("11000000.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/expenses/{id}/allocate", farmId, expenseId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exceedAllocReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ALLOCATED_EXCEEDS_EXPENSE_TOTAL")));

        // 5. Phân bổ hợp lệ 5,000,000 VNĐ cho mùa vụ
        AllocateCostRequest validAllocReq = AllocateCostRequest.builder()
                .allocations(List.of(
                        AllocateCostRequest.CostAllocationItemRequest.builder()
                                .targetType("CROP_SEASON")
                                .targetId(season.getId())
                                .allocatedAmount(new BigDecimal("5000000.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/expenses/{id}/allocate", farmId, expenseId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAllocReq)))
                .andExpect(status().isOk());

        // 6. Gọi API tính giá thành đơn vị: GET /costing/unit-cost -> 5,000,000 / 5,000 = 1,000 VNĐ/kg
        mockMvc.perform(get("/api/v1/farms/{farmId}/costing/unit-cost", farmId)
                        .header("Authorization", "Bearer " + token)
                        .param("targetType", "CROP_SEASON")
                        .param("targetId", String.valueOf(season.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetId").value(season.getId()))
                .andExpect(jsonPath("$.totalCost").value(5000000.00))
                .andExpect(jsonPath("$.totalYieldKg").value(5000.00))
                .andExpect(jsonPath("$.unitCostPerKg").value(1000.00));
    }

    @Test
    @DisplayName("TC-CONC-002: Kiểm thử chịu tải đồng thời 10 Threads phân bổ công nợ (Nợ 20tr, mỗi lệnh 5tr) -> Đúng 4 thành công, 6 bị từ chối, Zero Over-allocation")
    void test10ThreadsConcurrentPaymentAllocation() throws Exception {
        // 1. Tạo 1 đối tác BUYER
        Partner partner = partnerRepository.save(Partner.builder()
                .tenantId(tenantId)
                .code("PARTNER_CONC_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .name("Đối Tác Kiểm Thử Tải Phân Bổ Công Nợ")
                .partnerType("BUYER")
                .creditLimit(new BigDecimal("50000000.00"))
                .paymentTermDays(30)
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        // 2. Tạo 1 khoản nợ 20,000,000 VNĐ
        DebtRecord debt = debtRecordRepository.save(DebtRecord.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .partnerId(partner.getId())
                .debtType("RECEIVABLE")
                .totalDebt(new BigDecimal("20000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingDebt(new BigDecimal("20000000.00"))
                .dueDate(LocalDate.now().plusDays(30))
                .status("ACTIVE")
                .createdAt(Instant.now())
                .build());

        Long debtId = debt.getId();
        int threadCount = 10;
        BigDecimal allocPerThread = new BigDecimal("5000000.00");

        // 3. Tạo 10 giao dịch thanh toán độc lập (mỗi giao dịch 5,000,000 VNĐ)
        List<Long> paymentIds = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            PaymentTransaction pt = paymentTransactionRepository.save(PaymentTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .paymentCode("PAY-CONC-" + i + "-" + (System.currentTimeMillis() % 10000000))
                    .paymentType("RECEIPT")
                    .partnerId(partner.getId())
                    .debtRecordId(debtId)
                    .amount(allocPerThread)
                    .allocatedAmount(BigDecimal.ZERO)
                    .paymentMethod("BANK_TRANSFER")
                    .paymentDate(LocalDate.now())
                    .status("COMPLETED")
                    .createdAt(Instant.now())
                    .build());
            paymentIds.add(pt.getId());
        }

        // 4. Bắn đồng thời 10 threads gọi service allocatePayment
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final Long pId = paymentIds.get(i);
            executor.submit(() -> {
                // Thiết lập security context cho worker thread
                Authentication auth = new UsernamePasswordAuthenticationToken(ownerUser, null, ownerUser.getAuthorities());
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(auth);
                SecurityContextHolder.setContext(context);

                readyLatch.countDown();
                try {
                    startLatch.await();
                    AllocatePaymentRequest req = AllocatePaymentRequest.builder()
                            .debtRecordId(debtId)
                            .allocatedAmount(allocPerThread)
                            .notes("Phân bổ thanh toán concurrent test")
                            .build();

                    debtAndPaymentService.allocatePayment(farmId, pId, req);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                    SecurityContextHolder.clearContext();
                }
            });
        }

        readyLatch.await(10, TimeUnit.SECONDS);
        startLatch.countDown(); // Bắn đồng loạt
        doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        // 5. Xác nhận: Đúng 4 lệnh thành công, 6 lệnh bị từ chối
        assertEquals(4, successCount.get(), "Số giao dịch thành công phải chính xác là 4 (4 * 5tr = 20tr)");
        assertEquals(6, failureCount.get(), "Số giao dịch bị từ chối phải chính xác là 6");

        // 6. Dư nợ cuối cùng phải chính xác bằng 0.00 VNĐ và status = 'SETTLED'
        DebtRecord finalDebt = debtRecordRepository.findById(debtId).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(finalDebt.getRemainingDebt()), "Dư nợ còn lại phải bằng 0.00");
        assertEquals(0, new BigDecimal("20000000.00").compareTo(finalDebt.getPaidAmount()), "Tổng đã trả phải chính xác 20,000,000");
        assertEquals("SETTLED", finalDebt.getStatus(), "Trạng thái khoản nợ phải là SETTLED");

        // Dọn dẹp an toàn dữ liệu test đồng thời chống ô nhiễm DB
        try {
            paymentTransactionRepository.deleteAllById(paymentIds);
            debtRecordRepository.deleteById(debtId);
            partnerRepository.deleteById(partner.getId());
        } catch (Exception ignored) {}
    }

    @Test
    @DisplayName("TC-RPT-001..005 & TC-SYS-001 & TC-SYS-004: Kiểm thử 5 API Báo cáo Điều hành, Cảnh báo 85% Ngân sách & Truy vấn Audit Logs")
    void testFiveExecutiveReportsAndAuditLogsAndNotifications() throws Exception {
        // 1. Kiểm thử 5 Báo cáo điều hành
        // 1.1 Executive Dashboard
        mockMvc.perform(get("/api/v1/farms/{farmId}/reports/executive-dashboard", farmId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossProfit").exists())
                .andExpect(jsonPath("$.totalReceivableDebt").exists());

        // Cấp toàn nền tảng
        mockMvc.perform(get("/api/v1/reports/executive-dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grossProfit").exists());

        // 1.2 Inventory Aging
        mockMvc.perform(get("/api/v1/farms/{farmId}/reports/inventory-aging", farmId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalValuation").exists())
                .andExpect(jsonPath("$.bucket0To30").exists());

        // 1.3 Crop Cost & Profit
        mockMvc.perform(get("/api/v1/farms/{farmId}/reports/crop-cost-profit", farmId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.seasons").isArray());

        // 1.4 Livestock FCR
        mockMvc.perform(get("/api/v1/farms/{farmId}/reports/livestock-fcr", farmId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups").isArray());

        // 1.5 Debt Aging
        mockMvc.perform(get("/api/v1/farms/{farmId}/reports/debt-aging", farmId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receivable.totalDebt").exists())
                .andExpect(jsonPath("$.receivable.currentTerm").exists());

        // 2. Kế hoạch ngân sách & Cảnh báo chi tiêu >= 85%
        String budCatCode = "CAT_BUD_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CostCategory budCategory = costCategoryRepository.save(CostCategory.builder()
                .tenantId(tenantId)
                .code(budCatCode)
                .name("Chi phí Phân bón Dự toán")
                .costType("MATERIALS")
                .createdAt(Instant.now())
                .build());

        String budgetName = "Kế hoạch Ngân sách Phân bón " + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateBudgetRequest budgetReq = CreateBudgetRequest.builder()
                .name(budgetName)
                .fiscalYear(LocalDate.now().getYear())
                .totalBudgetAmount(new BigDecimal("10000000.00"))
                .items(List.of(
                        CreateBudgetRequest.BudgetItemRequest.builder()
                                .costCategoryId(budCategory.getId())
                                .allocatedAmount(new BigDecimal("10000000.00"))
                                .notes("Hạn mức phân bón cả năm")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/budgets", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(budgetReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Ghi nhận chi phí đạt 9,000,000 VNĐ (90% >= 85%) -> Tự động bắn thông báo cảnh báo
        CreateFarmExpenseRequest heavyExpenseReq = CreateFarmExpenseRequest.builder()
                .costCategoryId(budCategory.getId())
                .expenseSource("MANUAL")
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("9000000.00"))
                .paymentMethod("CASH")
                .status("CONFIRMED")
                .notes("Chi tiêu lớn kích hoạt cảnh báo 85% ngân sách")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/expenses", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(heavyExpenseReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Kiểm tra danh sách thông báo
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].type").value("WARNING"))
                .andExpect(jsonPath("$.content[0].referenceType").value("BUDGET"))
                .andExpect(jsonPath("$.content[0].actionUrl", containsString("/app/finance/budgets")));

        // Đánh dấu đọc tất cả thông báo
        mockMvc.perform(put("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // 3. Tra cứu Sổ cái Nhật ký Kiểm toán Bất biến (Audit Logs)
        // Tạo một bản ghi audit log kiểm thử
        auditLogRepository.save(AuditLog.builder()
                .tenantId(tenantId)
                .userId(ownerUser.getId())
                .action("REPORT_QUERY")
                .module("FINANCE")
                .endpoint("/api/v1/reports/executive-dashboard")
                .method("GET")
                .statusCode(200)
                .executionTimeMs(25L)
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(get("/api/v1/system/audit-logs")
                        .header("Authorization", "Bearer " + token)
                        .param("module", "FINANCE")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].module").value("FINANCE"));
    }
}
