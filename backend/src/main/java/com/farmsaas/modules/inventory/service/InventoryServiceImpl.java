package com.farmsaas.modules.inventory.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.inventory.dto.*;
import com.farmsaas.modules.inventory.entity.*;
import com.farmsaas.modules.inventory.entity.enums.IssueType;
import com.farmsaas.modules.inventory.entity.enums.ReceiptType;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import com.farmsaas.modules.inventory.repository.*;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.security.service.UserPrincipal;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final WarehouseRepository warehouseRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final WarehouseReceiptRepository receiptRepository;
    private final WarehouseIssueRepository issueRepository;
    private final WarehouseTransferRepository transferRepository;
    private final StocktakeRepository stocktakeRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getInventory(Long farmId, Long warehouseId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        List<WarehouseInventory> entities;
        if (warehouseId != null) {
            validateWarehouse(tenantId, farmId, warehouseId);
            entities = inventoryRepository.findInventoryByWarehouseWithMaterial(tenantId, warehouseId);
        } else {
            entities = inventoryRepository.findInventoryByFarmWithMaterial(tenantId, farmId);
        }

        return entities.stream()
                .map(InventoryStockResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getInventoryByWarehouse(Long farmId, Long warehouseId) {
        return getInventory(farmId, warehouseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getExpiringBatches(Integer days) {
        Long tenantId = getRequiredTenantId();
        int daysThreshold = (days != null && days > 0) ? days : 30;
        LocalDate targetDate = LocalDate.now().plusDays(daysThreshold);

        return inventoryRepository.findExpiringBatches(tenantId, targetDate).stream()
                .map(InventoryStockResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WarehouseReceiptResponse createReceipt(Long farmId, WarehouseReceiptRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);
        Warehouse warehouse = validateWarehouse(tenantId, farmId, request.getWarehouseId());

        String receiptCode = request.getReceiptCode();
        if (receiptCode == null || receiptCode.trim().isEmpty()) {
            receiptCode = generateTransactionCode("PNK");
        } else {
            receiptCode = receiptCode.trim().toUpperCase();
            if (receiptRepository.existsByTenantIdAndReceiptCode(tenantId, receiptCode)) {
                throw new BusinessException("Mã phiếu nhập kho '" + receiptCode + "' đã tồn tại.");
            }
        }

        Long currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);

        WarehouseReceipt receipt = WarehouseReceipt.builder()
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .receiptCode(receiptCode)
                .receiptType(request.getReceiptType() != null ? request.getReceiptType() : ReceiptType.PURCHASE)
                .partnerId(request.getPartnerId())
                .receiptDate(request.getReceiptDate() != null ? request.getReceiptDate() : Instant.now())
                .notes(request.getNotes())
                .createdByUserId(currentUserId)
                .status("COMPLETED")
                .items(new ArrayList<>())
                .build();
        receipt.setTenantId(tenantId);

        BigDecimal grandTotal = BigDecimal.ZERO;

        for (WarehouseReceiptRequest.ReceiptItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findByIdAndTenantId(itemReq.getMaterialId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + itemReq.getMaterialId()));

            String batch = (itemReq.getBatchNumber() != null && !itemReq.getBatchNumber().trim().isEmpty())
                    ? itemReq.getBatchNumber().trim() : "DEFAULT";

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : material.getUnitPriceStandard();
            BigDecimal subtotal = unitPrice.multiply(itemReq.getQuantity());
            grandTotal = grandTotal.add(subtotal);

            // Update inventory
            WarehouseInventory inventory = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(warehouse.getId(), material.getId(), batch)
                    .orElseGet(() -> {
                        WarehouseInventory wi = WarehouseInventory.builder()
                                .tenantId(tenantId)
                                .warehouseId(warehouse.getId())
                                .materialId(material.getId())
                                .batchNumber(batch)
                                .expiryDate(itemReq.getExpiryDate())
                                .quantityOnHand(BigDecimal.ZERO)
                                .reservedQuantity(BigDecimal.ZERO)
                                .storageBinCode(itemReq.getStorageBinCode())
                                .build();
                        return wi;
                    });

            inventory.setQuantityOnHand(inventory.getQuantityOnHand().add(itemReq.getQuantity()));
            if (itemReq.getExpiryDate() != null) {
                inventory.setExpiryDate(itemReq.getExpiryDate());
            }
            if (itemReq.getStorageBinCode() != null) {
                inventory.setStorageBinCode(itemReq.getStorageBinCode());
            }
            inventoryRepository.save(inventory);

            WarehouseReceiptItem receiptItem = WarehouseReceiptItem.builder()
                    .receipt(receipt)
                    .materialId(material.getId())
                    .batchNumber(batch)
                    .expiryDate(itemReq.getExpiryDate())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .storageBinCode(itemReq.getStorageBinCode())
                    .build();

            receipt.getItems().add(receiptItem);
        }

        receipt.setTotalAmount(grandTotal);
        WarehouseReceipt saved = receiptRepository.save(receipt);
        log.info("Created Warehouse Receipt '{}' with {} items for Farm ID: {}", saved.getReceiptCode(), saved.getItems().size(), farmId);
        return WarehouseReceiptResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public WarehouseIssueResponse createIssue(Long farmId, WarehouseIssueRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);
        Warehouse warehouse = validateWarehouse(tenantId, farmId, request.getWarehouseId());

        String issueCode = request.getIssueCode();
        if (issueCode == null || issueCode.trim().isEmpty()) {
            issueCode = generateTransactionCode("PXK");
        } else {
            issueCode = issueCode.trim().toUpperCase();
            if (issueRepository.existsByTenantIdAndIssueCode(tenantId, issueCode)) {
                throw new BusinessException("Mã phiếu xuất kho '" + issueCode + "' đã tồn tại.");
            }
        }

        Long currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);

        WarehouseIssue issue = WarehouseIssue.builder()
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .issueCode(issueCode)
                .issueType(request.getIssueType() != null ? request.getIssueType() : IssueType.PRODUCTION_ISSUE)
                .referenceLogId(request.getReferenceLogId())
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .issueDate(request.getIssueDate() != null ? request.getIssueDate() : Instant.now())
                .notes(request.getNotes())
                .issuedByUserId(currentUserId)
                .status("ISSUED")
                .items(new ArrayList<>())
                .build();
        issue.setTenantId(tenantId);

        BigDecimal grandTotal = BigDecimal.ZERO;

        for (WarehouseIssueRequest.IssueItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findByIdAndTenantId(itemReq.getMaterialId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + itemReq.getMaterialId()));

            BigDecimal requestedQty = itemReq.getQuantity();

            if (itemReq.getBatchNumber() != null && !itemReq.getBatchNumber().trim().isEmpty()) {
                // Xuất theo Lô chỉ định (do quét mã QR / Barcode)
                String batch = itemReq.getBatchNumber().trim();
                WarehouseInventory inventory = inventoryRepository.findWithLock(warehouse.getId(), material.getId(), batch)
                        .orElseThrow(() -> new BusinessException("Không tìm thấy lô '" + batch + "' của vật tư '" + material.getName() + "' trong kho."));

                if (inventory.getAvailableQuantity().compareTo(requestedQty) < 0) {
                    throw new BusinessException(String.format("Không đủ tồn kho khả dụng cho vật tư '%s' (Lô: %s). Tồn: %.2f %s, yêu cầu: %.2f %s.",
                            material.getName(), batch, inventory.getAvailableQuantity(), material.getStandardUnit(), requestedQty, material.getStandardUnit()));
                }

                inventory.setQuantityOnHand(inventory.getQuantityOnHand().subtract(requestedQty));
                inventoryRepository.save(inventory);

                BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : material.getUnitPriceStandard();
                BigDecimal subtotal = unitPrice.multiply(requestedQty);
                grandTotal = grandTotal.add(subtotal);

                WarehouseIssueItem issueItem = WarehouseIssueItem.builder()
                        .issue(issue)
                        .materialId(material.getId())
                        .batchNumber(batch)
                        .quantity(requestedQty)
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build();
                issue.getItems().add(issueItem);

            } else {
                // Nhập thủ công không quét mã: TỰ ĐỘNG TRỪ THEO FIFO
                List<WarehouseInventory> availableBatches = inventoryRepository.findAvailableForFifoWithLock(warehouse.getId(), material.getId());
                BigDecimal totalAvailable = availableBatches.stream()
                        .map(WarehouseInventory::getAvailableQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalAvailable.compareTo(requestedQty) < 0) {
                    throw new BusinessException(String.format("Trong kho chỉ còn %.2f %s vật tư '%s', không đủ %.2f %s để hoàn tất xuất kho.",
                            totalAvailable, material.getStandardUnit(), material.getName(), requestedQty, material.getStandardUnit()));
                }

                BigDecimal remainingToDeduct = requestedQty;

                for (WarehouseInventory batchInv : availableBatches) {
                    if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;

                    BigDecimal batchAvail = batchInv.getAvailableQuantity();
                    if (batchAvail.compareTo(BigDecimal.ZERO) <= 0) continue;

                    BigDecimal deductFromThisBatch = batchAvail.min(remainingToDeduct);
                    batchInv.setQuantityOnHand(batchInv.getQuantityOnHand().subtract(deductFromThisBatch));
                    inventoryRepository.save(batchInv);

                    BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : material.getUnitPriceStandard();
                    BigDecimal subtotal = unitPrice.multiply(deductFromThisBatch);
                    grandTotal = grandTotal.add(subtotal);

                    WarehouseIssueItem issueItem = WarehouseIssueItem.builder()
                            .issue(issue)
                            .materialId(material.getId())
                            .batchNumber(batchInv.getBatchNumber())
                            .quantity(deductFromThisBatch)
                            .unitPrice(unitPrice)
                            .subtotal(subtotal)
                            .build();
                    issue.getItems().add(issueItem);

                    remainingToDeduct = remainingToDeduct.subtract(deductFromThisBatch);
                }
            }
        }

        issue.setTotalAmount(grandTotal);
        WarehouseIssue saved = issueRepository.save(issue);
        log.info("Created Warehouse Issue '{}' with {} items for Farm ID: {}", saved.getIssueCode(), saved.getItems().size(), farmId);
        return WarehouseIssueResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public WarehouseIssueResponse backflushConsumption(
            Long farmId,
            Long warehouseId,
            Long seasonId,
            Long livestockGroupId,
            Long referenceLogId,
            List<InventoryBackflushRequest> items
    ) {
        if (items == null || items.isEmpty()) {
            return null;
        }

        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        // Chuyển đổi sang WarehouseIssueRequest với type = AUTO_CONSUMPTION_LOG
        List<WarehouseIssueRequest.IssueItemRequest> issueItems = items.stream()
                .map(item -> WarehouseIssueRequest.IssueItemRequest.builder()
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getBatchNumber())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        WarehouseIssueRequest issueRequest = WarehouseIssueRequest.builder()
                .warehouseId(warehouseId)
                .issueType(IssueType.AUTO_CONSUMPTION_LOG)
                .referenceLogId(referenceLogId)
                .seasonId(seasonId)
                .livestockGroupId(livestockGroupId)
                .notes("Hệ thống tự động trừ kho vật tư (Inventory Backflushing) từ nhật ký chăm sóc #" + referenceLogId)
                .items(issueItems)
                .build();

        return createIssue(farmId, issueRequest);
    }

    @Override
    @Transactional
    public WarehouseTransferResponse createTransfer(WarehouseTransferRequest request) {
        Long tenantId = getRequiredTenantId();
        Warehouse fromWarehouse = warehouseRepository.findByIdAndTenantId(request.getFromWarehouseId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kho xuất ID: " + request.getFromWarehouseId()));
        Warehouse toWarehouse = warehouseRepository.findByIdAndTenantId(request.getToWarehouseId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kho nhập ID: " + request.getToWarehouseId()));

        if (fromWarehouse.getId().equals(toWarehouse.getId())) {
            throw new BusinessException("Kho xuất và kho nhập không được trùng nhau.");
        }

        String transferCode = request.getTransferCode();
        if (transferCode == null || transferCode.trim().isEmpty()) {
            transferCode = generateTransactionCode("DCK");
        } else {
            transferCode = transferCode.trim().toUpperCase();
            if (transferRepository.existsByTenantIdAndTransferCode(tenantId, transferCode)) {
                throw new BusinessException("Mã phiếu điều chuyển '" + transferCode + "' đã tồn tại.");
            }
        }

        Long currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);

        WarehouseTransfer transfer = WarehouseTransfer.builder()
                .transferCode(transferCode)
                .fromWarehouseId(fromWarehouse.getId())
                .toWarehouseId(toWarehouse.getId())
                .transferDate(request.getTransferDate() != null ? request.getTransferDate() : Instant.now())
                .status(TransferStatus.PENDING)
                .notes(request.getNotes())
                .requestedByUserId(currentUserId)
                .items(new ArrayList<>())
                .build();
        transfer.setTenantId(tenantId);

        for (WarehouseTransferRequest.TransferItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findByIdAndTenantId(itemReq.getMaterialId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + itemReq.getMaterialId()));

            WarehouseTransferItem transferItem = WarehouseTransferItem.builder()
                    .transfer(transfer)
                    .materialId(material.getId())
                    .batchNumber(itemReq.getBatchNumber() != null ? itemReq.getBatchNumber() : "DEFAULT")
                    .quantity(itemReq.getQuantity())
                    .build();
            transfer.getItems().add(transferItem);
        }

        WarehouseTransfer saved = transferRepository.save(transfer);
        log.info("Created Warehouse Transfer '{}' from Warehouse {} to {}", saved.getTransferCode(), fromWarehouse.getName(), toWarehouse.getName());
        return WarehouseTransferResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public WarehouseTransferResponse dispatchTransfer(Long transferId) {
        Long tenantId = getRequiredTenantId();
        WarehouseTransfer transfer = transferRepository.findByIdAndTenantId(transferId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phiếu điều chuyển ID: " + transferId));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new BusinessException("Chỉ có thể xuất kho cho phiếu điều chuyển đang ở trạng thái PENDING.");
        }

        // Khóa và trừ tồn kho tại kho xuất, đưa vào trạng thái IN_TRANSIT
        for (WarehouseTransferItem item : transfer.getItems()) {
            WarehouseInventory fromInv = inventoryRepository.findWithLock(transfer.getFromWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                    .orElseThrow(() -> new BusinessException("Không tìm thấy tồn kho cho lô '" + item.getBatchNumber() + "' tại kho xuất."));

            if (fromInv.getAvailableQuantity().compareTo(item.getQuantity()) < 0) {
                throw new BusinessException(String.format("Kho xuất không đủ tồn kho khả dụng cho vật tư ID %d (Lô: %s).",
                        item.getMaterialId(), item.getBatchNumber()));
            }

            fromInv.setQuantityOnHand(fromInv.getQuantityOnHand().subtract(item.getQuantity()));
            inventoryRepository.save(fromInv);
        }

        transfer.setStatus(TransferStatus.IN_TRANSIT);
        transfer.setDispatchedAt(Instant.now());
        WarehouseTransfer updated = transferRepository.save(transfer);
        log.info("Dispatched Warehouse Transfer ID: {} -> status IN_TRANSIT", transferId);
        return WarehouseTransferResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public WarehouseTransferResponse receiveTransfer(Long transferId) {
        Long tenantId = getRequiredTenantId();
        WarehouseTransfer transfer = transferRepository.findByIdAndTenantId(transferId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phiếu điều chuyển ID: " + transferId));

        if (transfer.getStatus() != TransferStatus.IN_TRANSIT) {
            throw new BusinessException("Chỉ có thể nhận hàng cho phiếu điều chuyển đang ở trạng thái IN_TRANSIT.");
        }

        // Tăng tồn kho tại kho nhận
        for (WarehouseTransferItem item : transfer.getItems()) {
            WarehouseInventory toInv = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                    transfer.getToWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                    .orElseGet(() -> WarehouseInventory.builder()
                            .tenantId(tenantId)
                            .warehouseId(transfer.getToWarehouseId())
                            .materialId(item.getMaterialId())
                            .batchNumber(item.getBatchNumber())
                            .quantityOnHand(BigDecimal.ZERO)
                            .reservedQuantity(BigDecimal.ZERO)
                            .build());

            toInv.setQuantityOnHand(toInv.getQuantityOnHand().add(item.getQuantity()));
            inventoryRepository.save(toInv);
        }

        transfer.setStatus(TransferStatus.COMPLETED);
        transfer.setReceivedAt(Instant.now());
        WarehouseTransfer updated = transferRepository.save(transfer);
        log.info("Received Warehouse Transfer ID: {} -> status COMPLETED", transferId);
        return WarehouseTransferResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public WarehouseTransferResponse cancelTransfer(Long transferId) {
        Long tenantId = getRequiredTenantId();
        WarehouseTransfer transfer = transferRepository.findByIdAndTenantId(transferId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phiếu điều chuyển ID: " + transferId));

        if (transfer.getStatus() == TransferStatus.COMPLETED) {
            throw new BusinessException("Không thể hủy phiếu điều chuyển đã hoàn tất nhận hàng.");
        }

        // Nếu đã xuất hàng (IN_TRANSIT) mà hủy thì hoàn trả lại kho xuất
        if (transfer.getStatus() == TransferStatus.IN_TRANSIT) {
            for (WarehouseTransferItem item : transfer.getItems()) {
                WarehouseInventory fromInv = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                        transfer.getFromWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                        .orElseGet(() -> WarehouseInventory.builder()
                                .tenantId(tenantId)
                                .warehouseId(transfer.getFromWarehouseId())
                                .materialId(item.getMaterialId())
                                .batchNumber(item.getBatchNumber())
                                .quantityOnHand(BigDecimal.ZERO)
                                .reservedQuantity(BigDecimal.ZERO)
                                .build());

                fromInv.setQuantityOnHand(fromInv.getQuantityOnHand().add(item.getQuantity()));
                inventoryRepository.save(fromInv);
            }
        }

        transfer.setStatus(TransferStatus.CANCELLED);
        WarehouseTransfer updated = transferRepository.save(transfer);
        log.info("Cancelled Warehouse Transfer ID: {}", transferId);
        return WarehouseTransferResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public StocktakeResponse createStocktake(Long farmId, StocktakeRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);
        Warehouse warehouse = validateWarehouse(tenantId, farmId, request.getWarehouseId());

        String stocktakeCode = request.getStocktakeCode();
        if (stocktakeCode == null || stocktakeCode.trim().isEmpty()) {
            stocktakeCode = generateTransactionCode("KKK");
        } else {
            stocktakeCode = stocktakeCode.trim().toUpperCase();
            if (stocktakeRepository.existsByTenantIdAndStocktakeCode(tenantId, stocktakeCode)) {
                throw new BusinessException("Mã phiếu kiểm kê '" + stocktakeCode + "' đã tồn tại.");
            }
        }

        Long currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);

        Stocktake stocktake = Stocktake.builder()
                .farmId(farmId)
                .warehouseId(warehouse.getId())
                .stocktakeCode(stocktakeCode)
                .stocktakeDate(request.getStocktakeDate() != null ? request.getStocktakeDate() : Instant.now())
                .status(StocktakeStatus.DRAFT)
                .notes(request.getNotes())
                .createdByUserId(currentUserId)
                .items(new ArrayList<>())
                .build();
        stocktake.setTenantId(tenantId);

        for (StocktakeRequest.StocktakeItemRequest itemReq : request.getItems()) {
            Material material = materialRepository.findByIdAndTenantId(itemReq.getMaterialId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vật tư ID: " + itemReq.getMaterialId()));

            String batch = itemReq.getBatchNumber() != null ? itemReq.getBatchNumber().trim() : "DEFAULT";

            BigDecimal systemQty = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(warehouse.getId(), material.getId(), batch)
                    .map(WarehouseInventory::getQuantityOnHand)
                    .orElse(BigDecimal.ZERO);

            BigDecimal actualQty = itemReq.getActualQuantity();
            BigDecimal discrepancy = actualQty.subtract(systemQty);

            StocktakeItem item = StocktakeItem.builder()
                    .stocktake(stocktake)
                    .materialId(material.getId())
                    .batchNumber(batch)
                    .systemQuantity(systemQty)
                    .actualQuantity(actualQty)
                    .discrepancyQuantity(discrepancy)
                    .reason(itemReq.getReason())
                    .build();
            stocktake.getItems().add(item);
        }

        Stocktake saved = stocktakeRepository.save(stocktake);
        log.info("Created Stocktake '{}' with {} items for Farm ID: {}", saved.getStocktakeCode(), saved.getItems().size(), farmId);
        return StocktakeResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public StocktakeResponse reconcileStocktake(Long farmId, Long stocktakeId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Stocktake stocktake = stocktakeRepository.findByIdAndTenantId(stocktakeId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phiếu kiểm kê ID: " + stocktakeId));

        if (stocktake.getStatus() == StocktakeStatus.RECONCILED) {
            throw new BusinessException("Phiếu kiểm kê này đã được cân bằng kho trước đó.");
        }

        Long currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);

        // Áp dụng cân bằng số dư tồn kho sang số thực tế
        for (StocktakeItem item : stocktake.getItems()) {
            WarehouseInventory inventory = inventoryRepository.findWithLock(stocktake.getWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                    .orElseGet(() -> WarehouseInventory.builder()
                            .tenantId(tenantId)
                            .warehouseId(stocktake.getWarehouseId())
                            .materialId(item.getMaterialId())
                            .batchNumber(item.getBatchNumber())
                            .reservedQuantity(BigDecimal.ZERO)
                            .build());

            inventory.setQuantityOnHand(item.getActualQuantity());
            inventoryRepository.save(inventory);
        }

        stocktake.setStatus(StocktakeStatus.RECONCILED);
        stocktake.setReconciledByUserId(currentUserId);
        stocktake.setReconciledAt(Instant.now());

        Stocktake updated = stocktakeRepository.save(stocktake);
        log.info("Reconciled Stocktake ID: {} by User ID: {}", stocktakeId, currentUserId);
        return StocktakeResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseReceiptResponse> searchReceipts(Long farmId, Long warehouseId, String status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        return receiptRepository.searchReceipts(tenantId, farmId, warehouseId, status, pageable)
                .map(WarehouseReceiptResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseIssueResponse> searchIssues(Long farmId, Long warehouseId, String issueType, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        return issueRepository.searchIssues(tenantId, farmId, warehouseId, issueType, pageable)
                .map(WarehouseIssueResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseTransferResponse> searchTransfers(Long fromWarehouseId, Long toWarehouseId, TransferStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        return transferRepository.searchTransfers(tenantId, fromWarehouseId, toWarehouseId, status, pageable)
                .map(WarehouseTransferResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StocktakeResponse> searchStocktakes(Long farmId, Long warehouseId, StocktakeStatus status, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        return stocktakeRepository.searchStocktakes(tenantId, farmId, warehouseId, status, pageable)
                .map(StocktakeResponse::fromEntity);
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Warehouse validateWarehouse(Long tenantId, Long farmId, Long warehouseId) {
        return warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kho hàng ID: " + warehouseId + " trong trang trại ID: " + farmId));
    }

    private String generateTransactionCode(String prefix) {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomNum = 1000 + new Random().nextInt(9000);
        return String.format("%s-%s-%04d", prefix, dateStr, randomNum);
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
