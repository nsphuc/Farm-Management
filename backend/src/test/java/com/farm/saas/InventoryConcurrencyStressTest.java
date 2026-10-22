package com.farm.saas;

import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.CustomUserDetailsService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.inventory.dto.request.CreateWarehouseIssueRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseIssueDetailResponse;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.service.InventoryService;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class InventoryConcurrencyStressTest {

    @Autowired
    private InventoryService inventoryService;

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
    private WarehouseInventoryRepository inventoryRepository;

    @Autowired
    private WarehouseInventoryTransactionRepository transactionRepository;

    @Autowired
    private com.farm.saas.modules.inventory.repository.WarehouseIssueRepository issueRepository;

    @Autowired
    private com.farm.saas.modules.inventory.repository.WarehouseIssueItemRepository issueItemRepository;

    private Long farmId;
    private Long warehouseId;
    private Material testMaterial;
    private CustomUserDetails ownerUser;
    private final String CONC_BATCH = "LOT-CONC-50TH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    @BeforeEach
    void setUp() {
        Long tenantId = 1L;

        Farm farm = farmRepository.findByTenantIdAndCode(tenantId, "FARM_CONC_TEST")
                .orElseGet(() -> farmRepository.save(Farm.builder()
                        .tenantId(tenantId)
                        .code("FARM_CONC_TEST")
                        .name("Nông Trại Kiểm Thử Chịu Tải")
                        .farmType("MIXED")
                        .totalAreaM2(new BigDecimal("50000.00"))
                        .geofenceRadiusM(500)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.farmId = farm.getId();

        Warehouse warehouse = warehouseRepository.findByFarmIdAndCode(farmId, "WH_CONC_TEST")
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .code("WH_CONC_TEST")
                        .name("Kho Thí Nghiệm Chịu Tải")
                        .warehouseType("GENERAL")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));
        this.warehouseId = warehouse.getId();

        MaterialCategory category = categoryRepository.findByTenantIdAndCode(tenantId, "CAT_CONC")
                .orElseGet(() -> categoryRepository.save(MaterialCategory.builder()
                        .tenantId(tenantId)
                        .code("CAT_CONC")
                        .name("Vật tư thí nghiệm concurrency")
                        .createdAt(Instant.now())
                        .build()));

        testMaterial = materialRepository.findByTenantIdAndSkuCode(tenantId, "MAT_CONC_SUGAR")
                .orElseGet(() -> materialRepository.save(Material.builder()
                        .tenantId(tenantId)
                        .categoryId(category.getId())
                        .skuCode("MAT_CONC_SUGAR")
                        .name("Đường cát công nghiệp")
                        .standardUnit("KG")
                        .dispatchStrategy("FIFO")
                        .expiryAlertDays(30)
                        .minStockLevel(BigDecimal.ZERO)
                        .unitPriceStandard(new BigDecimal("15000.00"))
                        .defaultPhiDays(0)
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()));

        // Khởi tạo lô vật tư có số lượng tồn kho chính xác là 10.00 kg
        WarehouseInventory inventory = WarehouseInventory.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(warehouseId)
                .materialId(testMaterial.getId())
                .batchNumber(CONC_BATCH)
                .inwardDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusMonths(12))
                .unitCost(new BigDecimal("15000.00"))
                .quantityOnHand(new BigDecimal("10.00"))
                .reservedQuantity(BigDecimal.ZERO)
                .storageBinCode("BIN-CONC-01")
                .createdAt(Instant.now())
                .build();
        inventoryRepository.save(inventory);

        this.ownerUser = (CustomUserDetails) userDetailsService.loadUserByUsername("owner");
    }

    @Test
    @DisplayName("TC-CONC-001: 50 Threads xuất kho đồng thời (10kg tồn kho, mỗi thread xuất 1kg) -> Đúng 10 thành công, 40 bị từ chối, Zero Negative Stock")
    void test50ThreadsConcurrentStockOutZeroNegativeStock() throws Exception {
        int threadCount = 50;

        // Thiết lập security context cho thread hiện tại để tạo 50 phiếu xuất DRAFT
        Authentication auth = new UsernamePasswordAuthenticationToken(ownerUser, null, ownerUser.getAuthorities());
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(auth);
        SecurityContextHolder.setContext(securityContext);

        List<Long> issueIds = new ArrayList<>();
        try {
            for (int i = 0; i < threadCount; i++) {
                CreateWarehouseIssueRequest issueReq = CreateWarehouseIssueRequest.builder()
                        .warehouseId(warehouseId)
                        .issueType("INTERNAL_USE")
                        .receiverName("Công nhân kiểm thử #" + i)
                        .issueDate(LocalDate.now())
                        .notes("Thí nghiệm xuất kho đồng thời thread #" + i)
                        .items(List.of(
                                CreateWarehouseIssueRequest.IssueItemRequest.builder()
                                        .materialId(testMaterial.getId())
                                        .batchNumber(CONC_BATCH)
                                        .enteredUnit("KG")
                                        .enteredQuantity(new BigDecimal("1.00"))
                                        .conversionFactor(BigDecimal.ONE)
                                        .quantity(new BigDecimal("1.00"))
                                        .unitPrice(new BigDecimal("15000.00"))
                                        .build()
                        ))
                        .build();

                WarehouseIssueDetailResponse created = inventoryService.createIssue(farmId, issueReq);
                issueIds.add(created.getId());
            }
        } finally {
            SecurityContextHolder.clearContext();
        }

        assertEquals(threadCount, issueIds.size(), "Phải tạo thành công 50 phiếu xuất DRAFT trước khi kích hoạt");

        // Bắt đầu 50 Threads đồng thời xuất kho
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final Long issueId = issueIds.get(i);
            executor.submit(() -> {
                try {
                    // Thiết lập ngữ cảnh bảo mật cho thread con
                    SecurityContext childContext = SecurityContextHolder.createEmptyContext();
                    childContext.setAuthentication(auth);
                    SecurityContextHolder.setContext(childContext);

                    // Chờ tín hiệu đồng loạt phát lệnh
                    startLatch.await();

                    // Thực thi hoàn tất xuất kho với khóa bi quan PESSIMISTIC_WRITE
                    inventoryService.completeIssue(farmId, issueId);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    SecurityContextHolder.clearContext();
                    doneLatch.countDown();
                }
            });
        }

        // Bắn tín hiệu cho 50 threads chạy đồng thời
        startLatch.countDown();

        boolean finishedInTime = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finishedInTime, "50 luồng xuất kho phải hoàn thành xử lý trong 30 giây");

        // 1. Kiểm tra số lượng thành công và thất bại
        assertEquals(10, successCount.get(), "Chính xác 10 lệnh xuất kho phải thành công (10kg / 1kg = 10)");
        assertEquals(40, failureCount.get(), "Chính xác 40 lệnh xuất kho phải bị từ chối do thiếu tồn kho");

        // 2. Kiểm tra đẳng thức tồn kho Zero Negative Stock
        WarehouseInventory inventoryAfter = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                warehouseId, testMaterial.getId(), CONC_BATCH).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(inventoryAfter.getQuantityOnHand()),
                "Số dư tồn kho cuối cùng phải là chính xác 0.00 kg (Zero Negative Stock)!");
        assertTrue(inventoryAfter.getQuantityOnHand().compareTo(BigDecimal.ZERO) >= 0,
                "Tồn kho tuyệt đối không được âm!");

        // 3. Kiểm tra số bút toán OUTWARD trong sổ cái bất biến
        List<WarehouseInventoryTransaction> txs = transactionRepository.findAll().stream()
                .filter(t -> testMaterial.getId().equals(t.getMaterialId()) && CONC_BATCH.equals(t.getBatchNumber()) && "OUT".equals(t.getDirection()))
                .toList();
        assertEquals(10, txs.size(), "Số lượng giao dịch OUTWARD trong sổ cái thẻ kho bất biến phải đúng bằng 10!");

        // Dọn dẹp an toàn chống ô nhiễm DB dev
        try {
            transactionRepository.deleteAll(txs);
            inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(warehouseId, testMaterial.getId(), CONC_BATCH)
                    .ifPresent(inventoryRepository::delete);
            for (Long iId : issueIds) {
                try {
                    issueItemRepository.deleteAll(issueItemRepository.findByIssueId(iId));
                    issueRepository.deleteById(iId);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }
}
