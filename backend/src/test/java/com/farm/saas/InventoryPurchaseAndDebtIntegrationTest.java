package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.common.security.JwtTokenProvider;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseReceiptRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseReceiptDetailResponse;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.repository.WarehouseReceiptRepository;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class InventoryPurchaseAndDebtIntegrationTest {

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
    private PartnerRepository partnerRepository;

    @Autowired
    private WarehouseReceiptRepository receiptRepository;

    @Autowired
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private WarehouseInventoryTransactionRepository transactionRepository;

    @Autowired
    private DebtRecordRepository debtRecordRepository;

    private Long farmId;
    private Long warehouseId;
    private Material testMaterial;
    private Partner testSupplier;
    private String token;

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_INV_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_INV_TEST")
                        .name("Nông Trại Kho Vận Test")
                        .farmType("MIXED")
                        .totalAreaM2(new BigDecimal("30000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.farmId = farm.getId();

        Warehouse warehouse = warehouseRepository.findByFarmIdAndCode(farmId, "WH_INV_TEST")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_INV_TEST")
                        .name("Kho Tổng Kiểm Thử")
                        .warehouseType("GENERAL")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = warehouse.getId();

        MaterialCategory category = categoryRepository.findByTenantIdAndCode(tenantId, "CAT_GEN_INV")
                .orElseGet(() -> categoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code("CAT_GEN_INV")
                        .name("Vật tư kho tổng")
                        .createdAt(Instant.now())
                        .build()));

        testMaterial = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_FERT_25KG")
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(category.getId())
                        .skuCode("MAT_FERT_25KG")
                        .name("Phân Hạt NPK 25kg")
                        .standardUnit("KG")
                        .dispatchStrategy("FIFO")
                        .expiryAlertDays(30)
                        .minStockLevel(BigDecimal.ZERO)
                        .unitPriceStandard(new BigDecimal("20000.00"))
                        .defaultPhiDays(7)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        testSupplier = partnerRepository.findByTenantIdAndCode(tenantId, "SUP_AGRI_CHEM")
                .orElseGet(() -> partnerRepository.save(Partner.builder()
                        .tenantId(tenantId)
                        .code("SUP_AGRI_CHEM")
                        .name("Công Ty Cung Ứng Hóa Chất Nông Nghiệp")
                        .partnerType("SUPPLIER")
                        .creditLimit(new BigDecimal("500000000.00"))
                        .paymentTermDays(30)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        CustomUserDetails user = (CustomUserDetails) userDetailsService.loadUserByUsername("owner");
        this.token = jwtTokenProvider.generateAccessToken(user);
    }

    @Test
    @DisplayName("TC-INV-001: Nhập kho mua hàng PURCHASE -> Hoàn tất -> Tăng tồn kho, ghi sổ cái INWARD & Sinh công nợ PAYABLE")
    void testPurchaseReceiptCompletionAndPayableDebtGeneration() throws Exception {
        String batchNumber = "LOT-PUR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDate receiptDate = LocalDate.now();

        // 1. Tạo phiếu nhập mua DRAFT với đơn vị quy đổi BAG (4 bao = 100 kg)
        CreateWarehouseReceiptRequest createRequest = CreateWarehouseReceiptRequest.builder()
                .warehouseId(warehouseId)
                .receiptType("PURCHASE")
                .partnerId(testSupplier.getId())
                .receiptDate(receiptDate)
                .notes("Nhập mua phân bón đầu vụ")
                .items(List.of(
                        CreateWarehouseReceiptRequest.ReceiptItemRequest.builder()
                                .materialId(testMaterial.getId())
                                .batchNumber(batchNumber)
                                .enteredUnit("BAG")
                                .enteredQuantity(new BigDecimal("4.00"))
                                .conversionFactor(new BigDecimal("25.0000"))
                                .unitPrice(new BigDecimal("20000.00"))
                                .expiryDate(receiptDate.plusMonths(12))
                                .storageBinCode("A-01")
                                .build()
                ))
                .build();

        var createResult = mockMvc.perform(post("/api/v1/farms/{farmId}/inventory/receipts", farmId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.totalAmount").value(80000.0))
                .andReturn();

        WarehouseReceiptDetailResponse receipt = objectMapper.readValue(
                createResult.getResponse().getContentAsString(), WarehouseReceiptDetailResponse.class);
        Long receiptId = receipt.getId();

        // 2. Gọi API /complete
        mockMvc.perform(post("/api/v1/farms/{farmId}/inventory/receipts/{id}/complete", farmId, receiptId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.approvedBy").isNotEmpty());

        // 3. Xác minh tồn kho trong warehouse_inventory
        WarehouseInventory inventory = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                warehouseId, testMaterial.getId(), batchNumber).orElseThrow();
        assertEquals(0, new BigDecimal("100.00").compareTo(inventory.getQuantityOnHand()),
                "Số lượng tồn kho phải là 100.00 kg (4 bao * 25kg)");

        // 4. Xác minh sổ cái bất biến warehouse_inventory_transactions
        List<WarehouseInventoryTransaction> transactions = transactionRepository.findAll().stream()
                .filter(t -> receiptId.equals(t.getReferenceDocId()) && "WAREHOUSE_RECEIPT".equals(t.getReferenceDocType()))
                .toList();
        assertFalse(transactions.isEmpty(), "Phải có bút toán thẻ kho được ghi nhận");
        WarehouseInventoryTransaction tx = transactions.get(0);
        assertEquals("INWARD", tx.getTransactionType());
        assertEquals("IN", tx.getDirection());
        assertEquals(0, new BigDecimal("100.00").compareTo(tx.getQuantity()));
        assertEquals(0, BigDecimal.ZERO.compareTo(tx.getBalanceBefore()));
        assertEquals(0, new BigDecimal("100.00").compareTo(tx.getBalanceAfter()));

        // 5. Xác minh tự động sinh công nợ debt_records
        DebtRecord debt = debtRecordRepository.findByWarehouseReceiptId(receiptId).orElseThrow(
                () -> new AssertionError("Bắt buộc phải tự động sinh bản ghi công nợ cho phiếu nhập PURCHASE!"));
        assertEquals("PAYABLE", debt.getDebtType());
        assertEquals(testSupplier.getId(), debt.getPartnerId());
        assertEquals(0, new BigDecimal("80000.00").compareTo(debt.getTotalDebt()));
        assertEquals(0, new BigDecimal("80000.00").compareTo(debt.getRemainingDebt()));
        assertEquals(0, BigDecimal.ZERO.compareTo(debt.getPaidAmount()));
        assertEquals("ACTIVE", debt.getStatus());
        assertEquals(receiptDate.plusDays(30), debt.getDueDate(), "Hạn thanh toán phải khớp paymentTermDays (30 ngày)");
    }
}
