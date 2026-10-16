package com.farm.saas.modules.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.modules.inventory.dto.request.InventoryIssueCreateRequest;
import com.farm.saas.modules.inventory.dto.request.InventoryIssueItemRequest;
import com.farm.saas.modules.inventory.dto.request.InventoryReceiptCreateRequest;
import com.farm.saas.modules.inventory.dto.request.InventoryReceiptItemRequest;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.repository.InventoryBalanceRepository;
import com.farm.saas.modules.inventory.repository.InventoryReceiptRepository;
import com.farm.saas.modules.inventory.repository.MaterialCategoryRepository;
import com.farm.saas.modules.inventory.repository.MaterialRepository;
import com.farm.saas.modules.inventory.repository.WarehouseRepository;
import com.farm.saas.security.jwt.JwtTokenProvider;
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
import java.util.Optional;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm thử tự động tích hợp (Integration Test) cho Phân hệ Giao dịch Kho:
 * 1. InventoryReceipt & InventoryReceiptDetail (3.3 Nhập kho)
 * 2. InventoryIssue & InventoryIssueDetail (3.4 Xuất kho)
 * 3. InventoryBalance (3.7 Theo dõi tồn kho hiện tại)
 * 
 * Kiểm tra đầy đủ 5 ca kiểm thử bắt buộc:
 * 1. testCreateReceipt_Success_Returns201
 * 2. testCreateIssue_InsufficientBalance_Returns400
 * 3. testValidationFail_NegativeQuantity_Returns400
 * 4. testAccess_WithoutPermission_Returns403
 * 5. testAccess_CrossTenantWarehouse_Returns404or403
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InventoryTransactionApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private InventoryBalanceRepository balanceRepository;

    @Autowired
    private InventoryReceiptRepository receiptRepository;

    private String tokenWarehouseStaff;
    private String tokenViewOnly;
    private String tokenOtherTenant;

    private Warehouse testWarehouseTenant1;
    private Material testMaterialTenant1;

    private static final Long TENANT_1 = 1L;
    private static final Long TENANT_2 = 2L;
    private static final Long FARM_1 = 1L;

    @BeforeEach
    void setUp() {
        // 1. Tạo JWT Token cho Thủ kho (Tenant 1, Farm 1, full quyền Inventory)
        tokenWarehouseStaff = "Bearer " + jwtTokenProvider.generateAccessToken(
                4L,
                TENANT_1,
                "warehouse_staff",
                false,
                List.of("ROLE_WAREHOUSE_STAFF"),
                List.of("PERM_INVENTORY_VIEW", "PERM_INVENTORY_MANAGE", "PERM_INVENTORY_RECEIPT", "PERM_INVENTORY_ISSUE"),
                List.of(FARM_1)
        );

        // 2. Tạo JWT Token cho User chỉ có quyền VIEW (không có quyền RECEIPT / ISSUE / MANAGE)
        tokenViewOnly = "Bearer " + jwtTokenProvider.generateAccessToken(
                10L,
                TENANT_1,
                "view_only_user",
                false,
                List.of("ROLE_VIEWER"),
                List.of("PERM_INVENTORY_VIEW"),
                List.of(FARM_1)
        );

        // 3. Tạo JWT Token cho User thuộc Tenant khác (Tenant 2)
        tokenOtherTenant = "Bearer " + jwtTokenProvider.generateAccessToken(
                20L,
                TENANT_2,
                "other_tenant_user",
                false,
                List.of("ROLE_WAREHOUSE_STAFF"),
                List.of("PERM_INVENTORY_VIEW", "PERM_INVENTORY_MANAGE", "PERM_INVENTORY_RECEIPT", "PERM_INVENTORY_ISSUE"),
                List.of(99L)
        );

        // Khởi tạo hoặc lấy Kho bãi của Tenant 1, Farm 1
        testWarehouseTenant1 = warehouseRepository.findAllByTenantIdAndFarmId(TENANT_1, FARM_1)
                .stream().findFirst().orElseGet(() -> {
                    Warehouse wh = Warehouse.builder()
                            .tenantId(TENANT_1)
                            .farmId(FARM_1)
                            .code("WH_TEST_" + System.currentTimeMillis())
                            .name("Kho Thí Nghiệm 01")
                            .warehouseType(WarehouseType.GENERAL)
                            .status(WarehouseStatus.ACTIVE)
                            .build();
                    return warehouseRepository.save(wh);
                });

        // Khởi tạo hoặc lấy Nhóm vật tư của Tenant 1
        MaterialCategory testCategory = categoryRepository.findAllByTenantId(TENANT_1)
                .stream().findFirst().orElseGet(() -> {
                    MaterialCategory cat = MaterialCategory.builder()
                            .tenantId(TENANT_1)
                            .code("CAT_TEST_" + System.currentTimeMillis())
                            .name("Nhóm Vật Tư Kiểm Thử")
                            .build();
                    return categoryRepository.save(cat);
                });

        // Khởi tạo hoặc lấy Vật tư của Tenant 1
        testMaterialTenant1 = materialRepository.findAllByTenantId(TENANT_1)
                .stream().findFirst().orElseGet(() -> {
                    Material mat = Material.builder()
                            .tenantId(TENANT_1)
                            .categoryId(testCategory.getId())
                            .skuCode("SKU-TEST-" + System.currentTimeMillis())
                            .name("Vật tư Kiểm Thử NPK")
                            .standardUnit(StandardUnit.KG)
                            .dispatchStrategy(DispatchStrategy.FIFO)
                            .unitPriceStandard(new BigDecimal("25000.00"))
                            .build();
                    return materialRepository.save(mat);
                });
    }

    /**
     * Ca kiểm thử 1: Gửi payload nhập kho hợp lệ, verify HTTP 201 và kiểm tra InventoryBalance được cộng thêm.
     */
    @Test
    @DisplayName("1. testCreateReceipt_Success_Returns201: Nhập kho hợp lệ trả về 201 và cộng số dư tồn kho")
    void testCreateReceipt_Success_Returns201() throws Exception {
        String batchNumber = "LOT-TEST-REC-" + System.currentTimeMillis();
        BigDecimal inwardQty = new BigDecimal("100.00");
        BigDecimal unitPrice = new BigDecimal("25000.00");

        // Lấy số dư tồn kho trước khi nhập (nếu có)
        BigDecimal beforeQty = balanceRepository
                .findByWarehouseIdAndMaterialIdAndBatchNumber(testWarehouseTenant1.getId(), testMaterialTenant1.getId(), batchNumber)
                .map(InventoryBalance::getQuantityOnHand)
                .orElse(BigDecimal.ZERO);

        InventoryReceiptItemRequest item = InventoryReceiptItemRequest.builder()
                .materialId(testMaterialTenant1.getId())
                .batchNumber(batchNumber)
                .expiryDate(LocalDate.now().plusYears(1))
                .quantity(inwardQty)
                .unitPrice(unitPrice)
                .storageBinCode("BIN-A1")
                .build();

        InventoryReceiptCreateRequest request = InventoryReceiptCreateRequest.builder()
                .warehouseId(testWarehouseTenant1.getId())
                .receiptType(ReceiptType.PURCHASE)
                .receiptDate(LocalDate.now())
                .notes("Kiểm thử nhập kho tự động")
                .items(List.of(item))
                .build();

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .header("Authorization", tokenWarehouseStaff)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.warehouseId").value(testWarehouseTenant1.getId()))
                .andExpect(jsonPath("$.data.totalAmount").value(2500000.00))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Kiểm chứng tính toàn vẹn dữ liệu: InventoryBalance phải được cộng thêm chính xác 100.00
        Optional<InventoryBalance> balanceOpt = balanceRepository
                .findByWarehouseIdAndMaterialIdAndBatchNumber(testWarehouseTenant1.getId(), testMaterialTenant1.getId(), batchNumber);

        assertTrue(balanceOpt.isPresent(), "Bản ghi tồn kho của lô hàng phải tồn tại sau khi nhập kho");
        BigDecimal expectedQty = beforeQty.add(inwardQty);
        assertEquals(0, expectedQty.compareTo(balanceOpt.get().getQuantityOnHand()),
                "Số lượng tồn kho trên thẻ kho phải bằng số dư ban đầu cộng số lượng vừa nhập");
    }

    /**
     * Ca kiểm thử 2: Cố tình xuất kho với số lượng lớn hơn tồn tại có trong db, verify HTTP 400 Bad Request.
     */
    @Test
    @DisplayName("2. testCreateIssue_InsufficientBalance_Returns400: Xuất vượt tồn kho trả về HTTP 400 InsufficientInventoryException")
    void testCreateIssue_InsufficientBalance_Returns400() throws Exception {
        String batchNumber = "LOT-TEST-DEFICIT-" + System.currentTimeMillis();
        BigDecimal availableQty = new BigDecimal("5.00");
        BigDecimal requestedQty = new BigDecimal("500.00"); // Yêu cầu 500 > 5 có sẵn

        // Tạo sẵn số dư tồn kho là 5.00
        InventoryBalance balance = InventoryBalance.builder()
                .tenantId(TENANT_1)
                .farmId(FARM_1)
                .warehouseId(testWarehouseTenant1.getId())
                .materialId(testMaterialTenant1.getId())
                .batchNumber(batchNumber)
                .inwardDate(LocalDate.now())
                .unitCost(new BigDecimal("20000.00"))
                .quantityOnHand(availableQty)
                .reservedQuantity(BigDecimal.ZERO)
                .build();
        balanceRepository.save(balance);

        InventoryIssueItemRequest issueItem = InventoryIssueItemRequest.builder()
                .materialId(testMaterialTenant1.getId())
                .batchNumber(batchNumber)
                .quantity(requestedQty)
                .build();

        InventoryIssueCreateRequest request = InventoryIssueCreateRequest.builder()
                .warehouseId(testWarehouseTenant1.getId())
                .issueType(IssueType.INTERNAL_USE)
                .receiverName("Nguyễn Văn A")
                .issueDate(LocalDate.now())
                .items(List.of(issueItem))
                .build();

        mockMvc.perform(post("/api/v1/inventory/issues")
                        .header("Authorization", tokenWarehouseStaff)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_INVENTORY"))
                .andExpect(jsonPath("$.message").exists());
    }

    /**
     * Ca kiểm thử 3: Gửi payload với quantity = -5, verify HTTP 400 Validation Error.
     */
    @Test
    @DisplayName("3. testValidationFail_NegativeQuantity_Returns400: Số lượng âm (-5) bị chặn bởi Validation và trả về HTTP 400")
    void testValidationFail_NegativeQuantity_Returns400() throws Exception {
        InventoryReceiptItemRequest item = InventoryReceiptItemRequest.builder()
                .materialId(testMaterialTenant1.getId())
                .batchNumber("LOT-INVALID-QTY")
                .quantity(new BigDecimal("-5.00")) // Số lượng âm không hợp lệ
                .unitPrice(new BigDecimal("20000.00"))
                .build();

        InventoryReceiptCreateRequest request = InventoryReceiptCreateRequest.builder()
                .warehouseId(testWarehouseTenant1.getId())
                .receiptType(ReceiptType.PURCHASE)
                .receiptDate(LocalDate.now())
                .items(List.of(item))
                .build();

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .header("Authorization", tokenWarehouseStaff)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Ca kiểm thử 4: Giả lập user chỉ có quyền VIEW cố tình gọi API POST, verify HTTP 403 Forbidden.
     */
    @Test
    @DisplayName("4. testAccess_WithoutPermission_Returns403: User chỉ có quyền VIEW bị chặn HTTP 403 khi gọi API POST tạo phiếu")
    void testAccess_WithoutPermission_Returns403() throws Exception {
        InventoryReceiptItemRequest item = InventoryReceiptItemRequest.builder()
                .materialId(testMaterialTenant1.getId())
                .batchNumber("LOT-NO-PERM")
                .quantity(new BigDecimal("10.00"))
                .unitPrice(new BigDecimal("15000.00"))
                .build();

        InventoryReceiptCreateRequest request = InventoryReceiptCreateRequest.builder()
                .warehouseId(testWarehouseTenant1.getId())
                .receiptType(ReceiptType.PURCHASE)
                .receiptDate(LocalDate.now())
                .items(List.of(item))
                .build();

        // Gửi request với token chỉ có quyền PERM_INVENTORY_VIEW (thiếu PERM_INVENTORY_MANAGE / PERM_INVENTORY_RECEIPT)
        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .header("Authorization", tokenViewOnly)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    /**
     * Ca kiểm thử 5: Giả lập gửi request nhập kho vào warehouse_id của Tenant khác, verify hệ thống chặn lại (404 hoặc 403).
     */
    @Test
    @DisplayName("5. testAccess_CrossTenantWarehouse_Returns404or403: Cố tình truy cập kho bãi của Tenant khác bị chặn 404 hoặc 403")
    void testAccess_CrossTenantWarehouse_Returns404or403() throws Exception {
        InventoryReceiptItemRequest item = InventoryReceiptItemRequest.builder()
                .materialId(testMaterialTenant1.getId())
                .batchNumber("LOT-CROSS-TENANT")
                .quantity(new BigDecimal("20.00"))
                .unitPrice(new BigDecimal("10000.00"))
                .build();

        // Kịch bản A: User Tenant 1 cố ý lập phiếu nhập kho vào Kho bãi không thuộc Tenant 1 (ID: 999999)
        InventoryReceiptCreateRequest crossTenantRequest = InventoryReceiptCreateRequest.builder()
                .warehouseId(999999L)
                .receiptType(ReceiptType.PURCHASE)
                .receiptDate(LocalDate.now())
                .items(List.of(item))
                .build();

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .header("Authorization", tokenWarehouseStaff) // Token của Tenant 1
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossTenantRequest)))
                .andExpect(status().is(anyOf(is(404), is(403))));

        // Kịch bản B: User Tenant 2 cố ý lập phiếu nhập kho vào Kho bãi của Tenant 1
        InventoryReceiptCreateRequest attackTenant1Warehouse = InventoryReceiptCreateRequest.builder()
                .warehouseId(testWarehouseTenant1.getId())
                .receiptType(ReceiptType.PURCHASE)
                .receiptDate(LocalDate.now())
                .items(List.of(item))
                .build();

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .header("Authorization", tokenOtherTenant) // Token của Tenant 2
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(attackTenant1Warehouse)))
                .andExpect(status().is(anyOf(is(404), is(403))));
    }
}
