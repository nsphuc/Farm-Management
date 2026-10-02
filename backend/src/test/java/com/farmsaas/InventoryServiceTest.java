package com.farmsaas;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.modules.farm.dto.CreateFarmRequest;
import com.farmsaas.modules.farm.dto.FarmResponse;
import com.farmsaas.modules.farm.service.FarmService;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class InventoryServiceTest {

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private MaterialService materialService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private FarmService farmService;

    private Long tenantId = 1L;
    private Long farmId;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(tenantId);

        // Tạo hoặc lấy farm test
        String farmCode = "FARM-INV-" + System.currentTimeMillis();
        CreateFarmRequest farmReq = CreateFarmRequest.builder()
                .code(farmCode)
                .name("Trang Trại Kiểm Thử Kho")
                .farmType("TRONG_TROT")
                .totalAreaM2(new BigDecimal("10000"))
                .address("Khu Công Nghệ Cao")
                .build();
        FarmResponse farm = farmService.createFarm(farmReq);
        farmId = farm.getId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @Transactional
    @DisplayName("Kiểm thử toàn diện: Nhập kho, xuất kho FIFO, chặn âm kho và cảnh báo tồn kho")
    void testInventoryFlow_Receipt_FifoIssue_AndNoNegativeStock() {
        // 1. Tạo kho
        WarehouseRequest whReq = WarehouseRequest.builder()
                .code("KHO-TEST-01")
                .name("Kho Phân Bón Test")
                .warehouseType(WarehouseType.KHO_PHAN_BON)
                .locationDesc("Khu A")
                .build();
        WarehouseResponse warehouse = warehouseService.createWarehouse(farmId, whReq);
        assertNotNull(warehouse.getId());

        // 2. Tạo nhóm vật tư & vật tư
        String catCode = "CAT-" + System.currentTimeMillis();
        MaterialCategoryResponse category = materialService.createCategory(MaterialCategoryRequest.builder()
                .code(catCode)
                .name("Phân Hóa Học")
                .build());

        String skuCode = "SKU-NPK-" + System.currentTimeMillis();
        MaterialResponse material = materialService.createMaterial(MaterialRequest.builder()
                .categoryId(category.getId())
                .skuCode(skuCode)
                .name("Phân bón NPK 20-20-15")
                .standardUnit(StandardUnit.KG)
                .minStockLevel(new BigDecimal("20.00"))
                .unitPriceStandard(new BigDecimal("15000.00"))
                .build());
        assertNotNull(material.getId());

        // 3. Nhập kho Lô 1: 50kg, HSD sau 10 ngày
        WarehouseReceiptRequest receiptReq1 = WarehouseReceiptRequest.builder()
                .warehouseId(warehouse.getId())
                .receiptType(ReceiptType.PURCHASE)
                .items(List.of(
                        WarehouseReceiptRequest.ReceiptItemRequest.builder()
                                .materialId(material.getId())
                                .batchNumber("BATCH-EARLY")
                                .expiryDate(LocalDate.now().plusDays(10))
                                .quantity(new BigDecimal("50.00"))
                                .unitPrice(new BigDecimal("15000.00"))
                                .build()
                ))
                .build();
        inventoryService.createReceipt(farmId, receiptReq1);

        // Nhập kho Lô 2: 50kg, HSD sau 100 ngày
        WarehouseReceiptRequest receiptReq2 = WarehouseReceiptRequest.builder()
                .warehouseId(warehouse.getId())
                .receiptType(ReceiptType.PURCHASE)
                .items(List.of(
                        WarehouseReceiptRequest.ReceiptItemRequest.builder()
                                .materialId(material.getId())
                                .batchNumber("BATCH-LATE")
                                .expiryDate(LocalDate.now().plusDays(100))
                                .quantity(new BigDecimal("50.00"))
                                .unitPrice(new BigDecimal("16000.00"))
                                .build()
                ))
                .build();
        inventoryService.createReceipt(farmId, receiptReq2);

        // Kiểm tra tồn kho sau 2 lần nhập = 100kg
        List<InventoryStockResponse> stocks = inventoryService.getInventoryByWarehouse(farmId, warehouse.getId());
        assertEquals(2, stocks.size());
        BigDecimal totalQty = stocks.stream()
                .map(InventoryStockResponse::getQuantityOnHand)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("100.00"), totalQty);

        // 4. Xuất kho FIFO 60kg (Hệ thống phải tự động trừ hết 50kg Lô BATCH-EARLY và 10kg Lô BATCH-LATE)
        WarehouseIssueRequest fifoIssueReq = WarehouseIssueRequest.builder()
                .warehouseId(warehouse.getId())
                .items(List.of(
                        WarehouseIssueRequest.IssueItemRequest.builder()
                                .materialId(material.getId())
                                .batchNumber(null) // Không chỉ định lô -> FIFO
                                .quantity(new BigDecimal("60.00"))
                                .build()
                ))
                .build();
        WarehouseIssueResponse issueRes = inventoryService.createIssue(farmId, fifoIssueReq);
        assertEquals(2, issueRes.getItems().size()); // 2 dòng xuất trừ từ 2 lô khác nhau

        // Kiểm tra lại tồn kho còn đúng 40kg (ở lô BATCH-LATE)
        List<InventoryStockResponse> remainingStocks = inventoryService.getInventoryByWarehouse(farmId, warehouse.getId());
        BigDecimal remainingTotal = remainingStocks.stream()
                .map(InventoryStockResponse::getQuantityOnHand)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("40.00"), remainingTotal);

        // 5. Thử xuất 50kg (trong khi chỉ còn 40kg) -> Phải ném BusinessException và CHẶN ÂM KHO
        WarehouseIssueRequest overIssueReq = WarehouseIssueRequest.builder()
                .warehouseId(warehouse.getId())
                .items(List.of(
                        WarehouseIssueRequest.IssueItemRequest.builder()
                                .materialId(material.getId())
                                .quantity(new BigDecimal("50.00"))
                                .build()
                ))
                .build();

        assertThrows(BusinessException.class, () -> {
            inventoryService.createIssue(farmId, overIssueReq);
        }, "Hệ thống phải chặn không cho xuất kho vượt quá số lượng tồn khả dụng!");
    }
}
