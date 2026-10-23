package com.farm.saas.modules.inventory.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.inventory.dto.request.*;
import com.farm.saas.modules.inventory.dto.response.*;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.repository.*;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.platform.entity.Partner;
import com.farm.saas.modules.platform.repository.PartnerRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements com.farm.saas.modules.inventory.service.InventoryService {

    private final WarehouseInventoryRepository inventoryRepository;
    private final WarehouseInventoryTransactionRepository transactionRepository;
    private final WarehouseReceiptRepository receiptRepository;
    private final WarehouseReceiptItemRepository receiptItemRepository;
    private final WarehouseIssueRepository issueRepository;
    private final WarehouseIssueItemRepository issueItemRepository;
    private final WarehouseTransferRepository transferRepository;
    private final WarehouseTransferItemRepository transferItemRepository;
    private final StocktakeRepository stocktakeRepository;
    private final StocktakeItemRepository stocktakeItemRepository;
    private final WarehouseRepository warehouseRepository;
    private final MaterialRepository materialRepository;
    private final PartnerRepository partnerRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final ApplicationEventPublisher eventPublisher;

    // =========================================================================
    // 1. QUERY INVENTORY & LEDGER
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryItemResponse> getInventory(
            Long farmId, Long warehouseId, Long materialId, String batchNumber,
            Boolean lowStock, Boolean nearExpiry, Pageable pageable) {

        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<WarehouseInventory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            if (materialId != null) {
                predicates.add(cb.equal(root.get("materialId"), materialId));
            }
            if (batchNumber != null && !batchNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("batchNumber")), "%" + batchNumber.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<WarehouseInventory> page = inventoryRepository.findAll(spec, pageable);
        List<InventoryItemResponse> responses = page.getContent().stream()
                .map(this::enrichInventoryItem)
                .filter(item -> {
                    if (Boolean.TRUE.equals(lowStock) && !Boolean.TRUE.equals(item.getIsLowStock())) return false;
                    if (Boolean.TRUE.equals(nearExpiry) && !Boolean.TRUE.equals(item.getIsNearExpiry())) return false;
                    return true;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary(Long farmId, Long warehouseId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        // 1. Tồn kho
        Specification<WarehouseInventory> invSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<WarehouseInventory> inventories = inventoryRepository.findAll(invSpec);

        BigDecimal totalValuation = BigDecimal.ZERO;
        long nearExpiryCount = 0;
        long lowStockCount = 0;

        for (WarehouseInventory inv : inventories) {
            BigDecimal qty = inv.getQuantityOnHand() != null ? inv.getQuantityOnHand() : BigDecimal.ZERO;
            BigDecimal cost = inv.getUnitCost() != null ? inv.getUnitCost() : BigDecimal.ZERO;
            totalValuation = totalValuation.add(qty.multiply(cost));

            InventoryItemResponse itemDto = enrichInventoryItem(inv);
            if (Boolean.TRUE.equals(itemDto.getIsNearExpiry())) {
                nearExpiryCount++;
            }
            if (Boolean.TRUE.equals(itemDto.getIsLowStock())) {
                lowStockCount++;
            }
        }

        // 2. Tổng giá trị nhập mua (trừ phiếu CANCELLED)
        Specification<WarehouseReceipt> receiptSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            predicates.add(cb.notEqual(root.get("status"), "CANCELLED"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<WarehouseReceipt> receipts = receiptRepository.findAll(receiptSpec);
        BigDecimal totalPurchased = receipts.stream()
                .map(r -> r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return InventorySummaryResponse.builder()
                .totalInventoryValuation(totalValuation)
                .totalPurchasedAmount(totalPurchased)
                .nearExpiryCount(nearExpiryCount)
                .lowStockCount(lowStockCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactions(
            Long farmId, Long warehouseId, Long materialId, String batchNumber,
            String transactionType, LocalDate fromDate, LocalDate toDate, Pageable pageable) {

        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<WarehouseInventoryTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            if (materialId != null) {
                predicates.add(cb.equal(root.get("materialId"), materialId));
            }
            if (batchNumber != null && !batchNumber.isBlank()) {
                predicates.add(cb.equal(root.get("batchNumber"), batchNumber));
            }
            if (transactionType != null && !transactionType.isBlank()) {
                predicates.add(cb.equal(root.get("transactionType"), transactionType.toUpperCase()));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<WarehouseInventoryTransaction> page = transactionRepository.findAll(spec, pageable);
        List<InventoryTransactionResponse> responses = page.getContent().stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    // =========================================================================
    // 2. WAREHOUSE RECEIPTS (NHẬP KHO & LUỒNG 2: MUA HÀNG + CÔNG NỢ)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse createReceipt(Long farmId, CreateWarehouseReceiptRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        if ("PURCHASE".equalsIgnoreCase(request.getReceiptType())) {
            if (request.getPartnerId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_PARTNER", "Phiếu nhập mua hàng bắt buộc phải có thông tin đối tác cung cấp.");
            }
            Partner partner = partnerRepository.findByTenantIdAndId(tenantId, request.getPartnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Đối tác", request.getPartnerId()));
            if (!"SUPPLIER".equalsIgnoreCase(partner.getPartnerType()) && !"AGENT".equalsIgnoreCase(partner.getPartnerType())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PARTNER_TYPE", "Đối tác cung cấp phải thuộc loại SUPPLIER hoặc AGENT.");
            }
        }

        String code = (request.getReceiptCode() != null && !request.getReceiptCode().isBlank())
                ? request.getReceiptCode().trim().toUpperCase()
                : generateDocCode("RCP");

        if (receiptRepository.existsByTenantIdAndFarmIdAndReceiptCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "RECEIPT_CODE_ALREADY_EXISTS", "Mã phiếu nhập kho đã tồn tại: " + code);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<WarehouseReceiptItem> itemsToSave = new ArrayList<>();

        for (CreateWarehouseReceiptRequest.ReceiptItemRequest itemReq : request.getItems()) {
            BigDecimal factor = (itemReq.getConversionFactor() != null && itemReq.getConversionFactor().compareTo(BigDecimal.ZERO) > 0)
                    ? itemReq.getConversionFactor()
                    : BigDecimal.ONE.setScale(4);

            BigDecimal qty = itemReq.getQuantity();
            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                if (itemReq.getEnteredQuantity() != null && itemReq.getEnteredQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    qty = itemReq.getEnteredQuantity().multiply(factor);
                } else {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Số lượng nhập kho phải lớn hơn 0.");
                }
            }

            BigDecimal enteredQty = itemReq.getEnteredQuantity() != null ? itemReq.getEnteredQuantity() : qty;
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal totalPrice = itemReq.getTotalPrice();
            if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
                totalPrice = enteredQty.multiply(unitPrice);
            }

            totalAmount = totalAmount.add(totalPrice);

            WarehouseReceiptItem item = WarehouseReceiptItem.builder()
                    .tenantId(tenantId)
                    .materialId(itemReq.getMaterialId())
                    .batchNumber(itemReq.getBatchNumber().trim())
                    .expiryDate(itemReq.getExpiryDate())
                    .enteredUnit(itemReq.getEnteredUnit())
                    .enteredQuantity(enteredQty)
                    .conversionFactor(factor)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .totalPrice(totalPrice)
                    .storageBinCode(itemReq.getStorageBinCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            itemsToSave.add(item);
        }

        WarehouseReceipt receipt = WarehouseReceipt.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(request.getWarehouseId())
                .receiptCode(code)
                .receiptType(request.getReceiptType().toUpperCase())
                .partnerId(request.getPartnerId())
                .receiptDate(request.getReceiptDate())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .status("DRAFT")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        receipt = receiptRepository.save(receipt);

        for (WarehouseReceiptItem it : itemsToSave) {
            it.setReceiptId(receipt.getId());
            receiptItemRepository.save(it);
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_WAREHOUSE_RECEIPT")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/receipts")
                .method("POST")
                .newValue("Receipt: " + receipt.getReceiptCode() + ", Amount: " + receipt.getTotalAmount())
                .build());

        return enrichReceiptDetail(receipt);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseReceiptDetailResponse> getReceipts(
            Long farmId, Long warehouseId, Long partnerId, String status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<WarehouseReceipt> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            if (partnerId != null) {
                predicates.add(cb.equal(root.get("partnerId"), partnerId));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("receiptDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("receiptDate"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<WarehouseReceipt> page = receiptRepository.findAll(spec, pageable);
        List<WarehouseReceiptDetailResponse> list = page.getContent().stream()
                .map(this::enrichReceiptDetail)
                .collect(Collectors.toList());

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseReceiptDetailResponse getReceiptById(Long farmId, Long id) {
        WarehouseReceipt receipt = receiptRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập kho", id));
        return enrichReceiptDetail(receipt);
    }

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse completeReceipt(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseReceipt receipt = receiptRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập kho", id));

        if (!"DRAFT".equals(receipt.getStatus()) && !"APPROVED".equals(receipt.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể hoàn tất phiếu nhập khi đang ở trạng thái DRAFT hoặc APPROVED. Hiện tại: " + receipt.getStatus());
        }

        List<WarehouseReceiptItem> items = receiptItemRepository.findByReceiptId(receipt.getId());
        // Khóa các lô theo thứ tự nhất quán để tránh deadlock
        items.sort(Comparator.comparing(WarehouseReceiptItem::getMaterialId)
                .thenComparing(WarehouseReceiptItem::getBatchNumber));

        for (WarehouseReceiptItem item : items) {
            // Khóa bi quan dòng warehouse_inventory
            Optional<WarehouseInventory> invOpt = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            receipt.getWarehouseId(), item.getMaterialId(), item.getBatchNumber());

            WarehouseInventory inventory;
            BigDecimal balanceBefore;
            BigDecimal balanceAfter;

            if (invOpt.isPresent()) {
                inventory = invOpt.get();
                balanceBefore = inventory.getQuantityOnHand();
                balanceAfter = balanceBefore.add(item.getQuantity());
                inventory.setQuantityOnHand(balanceAfter);
                if (item.getExpiryDate() != null) {
                    inventory.setExpiryDate(item.getExpiryDate());
                }
                if (item.getUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
                    inventory.setUnitCost(item.getUnitPrice());
                }
                inventory.setUpdatedAt(Instant.now());
                inventory.setUpdatedBy(SecurityUtils.getCurrentUserId());
            } else {
                balanceBefore = BigDecimal.ZERO;
                balanceAfter = item.getQuantity();
                inventory = WarehouseInventory.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(receipt.getWarehouseId())
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getBatchNumber())
                        .inwardDate(receipt.getReceiptDate())
                        .expiryDate(item.getExpiryDate())
                        .unitCost(item.getUnitPrice())
                        .quantityOnHand(balanceAfter)
                        .reservedQuantity(BigDecimal.ZERO)
                        .storageBinCode(item.getStorageBinCode())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
            }
            inventoryRepository.save(inventory);

            // Ghi sổ cái bất biến (#38)
            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(receipt.getWarehouseId())
                    .materialId(item.getMaterialId())
                    .batchNumber(item.getBatchNumber())
                    .transactionType("INWARD")
                    .referenceDocType("WAREHOUSE_RECEIPT")
                    .referenceDocId(receipt.getId())
                    .referenceItemId(item.getId())
                    .direction("IN")
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalAmount(item.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(receipt.getReceiptDate())
                    .notes("Nhập kho theo phiếu " + receipt.getReceiptCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);
        }

        // Luồng 2: Nếu là nhập mua PURCHASE -> tự động sinh công nợ phải trả trong debt_records (#66)
        if ("PURCHASE".equalsIgnoreCase(receipt.getReceiptType()) && receipt.getPartnerId() != null) {
            Partner partner = partnerRepository.findByTenantIdAndId(tenantId, receipt.getPartnerId())
                    .orElse(null);
            int paymentTerm = (partner != null && partner.getPaymentTermDays() != null) ? partner.getPaymentTermDays() : 30;
            LocalDate dueDate = receipt.getReceiptDate().plusDays(paymentTerm);

            DebtRecord debtRecord = DebtRecord.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .partnerId(receipt.getPartnerId())
                    .warehouseReceiptId(receipt.getId())
                    .salesOrderId(null)
                    .debtType("PAYABLE")
                    .totalDebt(receipt.getTotalAmount())
                    .paidAmount(BigDecimal.ZERO)
                    .remainingDebt(receipt.getTotalAmount())
                    .dueDate(dueDate)
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            debtRecordRepository.save(debtRecord);
            log.info("Auto-generated debt record for purchase receipt {}", receipt.getReceiptCode());
        }

        receipt.setStatus("COMPLETED");
        receipt.setApprovedBy(SecurityUtils.getCurrentUserId());
        receipt.setApprovedAt(Instant.now());
        receipt.setUpdatedAt(Instant.now());
        receipt.setUpdatedBy(SecurityUtils.getCurrentUserId());
        receipt = receiptRepository.save(receipt);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("COMPLETE_WAREHOUSE_RECEIPT")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/receipts/" + id + "/complete")
                .method("POST")
                .newValue("Completed receipt: " + receipt.getReceiptCode())
                .build());

        return enrichReceiptDetail(receipt);
    }

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse cancelReceipt(Long farmId, Long id, CancelWarehouseReceiptRequest request) {
        WarehouseReceipt receipt = receiptRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập kho", id));

        if (!"DRAFT".equals(receipt.getStatus()) && !"APPROVED".equals(receipt.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể hủy phiếu nhập khi đang ở trạng thái DRAFT hoặc APPROVED.");
        }

        receipt.setStatus("CANCELLED");
        receipt.setCancelledBy(SecurityUtils.getCurrentUserId());
        receipt.setCancelledAt(Instant.now());
        receipt.setCancellationReason(request.getCancellationReason());
        receipt.setUpdatedAt(Instant.now());
        receipt.setUpdatedBy(SecurityUtils.getCurrentUserId());
        receipt = receiptRepository.save(receipt);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(receipt.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CANCEL_WAREHOUSE_RECEIPT")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/receipts/" + id + "/cancel")
                .method("POST")
                .newValue("Cancelled receipt: " + receipt.getReceiptCode() + ", Reason: " + request.getCancellationReason())
                .build());

        return enrichReceiptDetail(receipt);
    }

    // =========================================================================
    // 3. WAREHOUSE ISSUES (XUẤT KHO THỦ CÔNG)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseIssueDetailResponse createIssue(Long farmId, CreateWarehouseIssueRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        String code = (request.getIssueCode() != null && !request.getIssueCode().isBlank())
                ? request.getIssueCode().trim().toUpperCase()
                : generateDocCode("ISS");

        if (issueRepository.existsByTenantIdAndFarmIdAndIssueCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "ISSUE_CODE_ALREADY_EXISTS", "Mã phiếu xuất kho đã tồn tại: " + code);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<WarehouseIssueItem> itemsToSave = new ArrayList<>();

        for (CreateWarehouseIssueRequest.IssueItemRequest itemReq : request.getItems()) {
            BigDecimal factor = (itemReq.getConversionFactor() != null && itemReq.getConversionFactor().compareTo(BigDecimal.ZERO) > 0)
                    ? itemReq.getConversionFactor()
                    : BigDecimal.ONE.setScale(4);

            BigDecimal qty = itemReq.getQuantity();
            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                if (itemReq.getEnteredQuantity() != null && itemReq.getEnteredQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    qty = itemReq.getEnteredQuantity().multiply(factor);
                } else {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Số lượng xuất kho phải lớn hơn 0.");
                }
            }

            BigDecimal enteredQty = itemReq.getEnteredQuantity() != null ? itemReq.getEnteredQuantity() : qty;
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal totalPrice = itemReq.getTotalPrice();
            if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
                totalPrice = qty.multiply(unitPrice);
            }

            totalAmount = totalAmount.add(totalPrice);

            WarehouseIssueItem item = WarehouseIssueItem.builder()
                    .tenantId(tenantId)
                    .materialId(itemReq.getMaterialId())
                    .batchNumber(itemReq.getBatchNumber().trim())
                    .enteredUnit(itemReq.getEnteredUnit())
                    .enteredQuantity(enteredQty)
                    .conversionFactor(factor)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .totalPrice(totalPrice)
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            itemsToSave.add(item);
        }

        WarehouseIssue issue = WarehouseIssue.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(request.getWarehouseId())
                .issueCode(code)
                .issueType(request.getIssueType().toUpperCase())
                .receiverName(request.getReceiverName())
                .seasonId(request.getSeasonId())
                .isBackflushed(false)
                .issueDate(request.getIssueDate())
                .totalAmount(totalAmount)
                .notes(request.getNotes())
                .status("DRAFT")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        issue = issueRepository.save(issue);

        for (WarehouseIssueItem it : itemsToSave) {
            it.setIssueId(issue.getId());
            issueItemRepository.save(it);
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_WAREHOUSE_ISSUE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/issues")
                .method("POST")
                .newValue("Issue: " + issue.getIssueCode() + ", Amount: " + issue.getTotalAmount())
                .build());

        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseIssueDetailResponse> getIssues(
            Long farmId, Long warehouseId, String status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<WarehouseIssue> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (farmId != null) {
                predicates.add(cb.equal(root.get("farmId"), farmId));
            }
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("issueDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("issueDate"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<WarehouseIssue> page = issueRepository.findAll(spec, pageable);
        List<WarehouseIssueDetailResponse> list = page.getContent().stream()
                .map(this::enrichIssueDetail)
                .collect(Collectors.toList());

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseIssueDetailResponse getIssueById(Long farmId, Long id) {
        WarehouseIssue issue = issueRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu xuất kho", id));
        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional
    public WarehouseIssueDetailResponse completeIssue(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseIssue issue = issueRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu xuất kho", id));

        if (!"DRAFT".equals(issue.getStatus()) && !"APPROVED".equals(issue.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể hoàn tất phiếu xuất khi đang ở trạng thái DRAFT hoặc APPROVED.");
        }

        List<WarehouseIssueItem> items = issueItemRepository.findByIssueId(issue.getId());
        items.sort(Comparator.comparing(WarehouseIssueItem::getMaterialId)
                .thenComparing(WarehouseIssueItem::getBatchNumber));

        for (WarehouseIssueItem item : items) {
            // Khóa bi quan dòng warehouse_inventory
            WarehouseInventory inventory = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            issue.getWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                    .orElseThrow(() -> new InsufficientStockException("Không tìm thấy lô vật tư trong kho: " + item.getBatchNumber()));

            BigDecimal available = inventory.getQuantityOnHand().subtract(inventory.getReservedQuantity());
            if (available.compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException(item.getBatchNumber(), item.getQuantity(), available);
            }

            BigDecimal balanceBefore = inventory.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(item.getQuantity());
            inventory.setQuantityOnHand(balanceAfter);
            inventory.setUpdatedAt(Instant.now());
            inventory.setUpdatedBy(SecurityUtils.getCurrentUserId());
            inventoryRepository.save(inventory);

            String transType = "DAMAGE_DISPOSAL".equals(issue.getIssueType()) ? "DAMAGE_DISPOSAL" : "OUTWARD";

            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .warehouseId(issue.getWarehouseId())
                    .materialId(item.getMaterialId())
                    .batchNumber(item.getBatchNumber())
                    .transactionType(transType)
                    .referenceDocType("WAREHOUSE_ISSUE")
                    .referenceDocId(issue.getId())
                    .referenceItemId(item.getId())
                    .direction("OUT")
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalAmount(item.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(issue.getIssueDate())
                    .notes("Xuất kho theo phiếu " + issue.getIssueCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);
        }

        issue.setStatus("COMPLETED");
        issue.setApprovedBy(SecurityUtils.getCurrentUserId());
        issue.setApprovedAt(Instant.now());
        issue.setUpdatedAt(Instant.now());
        issue.setUpdatedBy(SecurityUtils.getCurrentUserId());
        issue = issueRepository.save(issue);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("COMPLETE_WAREHOUSE_ISSUE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/issues/" + id + "/complete")
                .method("POST")
                .newValue("Completed issue: " + issue.getIssueCode())
                .build());

        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional
    public WarehouseIssueDetailResponse cancelIssue(Long farmId, Long id, CancelWarehouseIssueRequest request) {
        WarehouseIssue issue = issueRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu xuất kho", id));

        if (!"DRAFT".equals(issue.getStatus()) && !"APPROVED".equals(issue.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể hủy phiếu xuất khi đang ở trạng thái DRAFT hoặc APPROVED.");
        }

        issue.setStatus("CANCELLED");
        issue.setCancelledBy(SecurityUtils.getCurrentUserId());
        issue.setCancelledAt(Instant.now());
        issue.setCancellationReason(request.getCancellationReason());
        issue.setUpdatedAt(Instant.now());
        issue.setUpdatedBy(SecurityUtils.getCurrentUserId());
        issue = issueRepository.save(issue);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(issue.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CANCEL_WAREHOUSE_ISSUE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/issues/" + id + "/cancel")
                .method("POST")
                .newValue("Cancelled issue: " + issue.getIssueCode() + ", Reason: " + request.getCancellationReason())
                .build());

        return enrichIssueDetail(issue);
    }

    // =========================================================================
    // 4. WAREHOUSE TRANSFERS (ĐIỀU CHUYỂN KHO 2 BƯỚC)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseTransferDetailResponse createTransfer(Long farmId, CreateWarehouseTransferRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        if (request.getFromWarehouseId().equals(request.getToWarehouseId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_WAREHOUSE_TRANSFER", "Kho xuất và kho nhận không được trùng nhau.");
        }

        Long targetFarmId = request.getToFarmId() != null ? request.getToFarmId() : farmId;

        String code = (request.getTransferCode() != null && !request.getTransferCode().isBlank())
                ? request.getTransferCode().trim().toUpperCase()
                : generateDocCode("TRF");

        if (transferRepository.existsByTenantIdAndTransferCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "TRANSFER_CODE_ALREADY_EXISTS", "Mã phiếu điều chuyển đã tồn tại: " + code);
        }

        WarehouseTransfer transfer = WarehouseTransfer.builder()
                .tenantId(tenantId)
                .fromFarmId(farmId)
                .toFarmId(targetFarmId)
                .fromWarehouseId(request.getFromWarehouseId())
                .toWarehouseId(request.getToWarehouseId())
                .transferCode(code)
                .transferDate(request.getTransferDate())
                .notes(request.getNotes())
                .status("DRAFT")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        transfer = transferRepository.save(transfer);

        for (CreateWarehouseTransferRequest.TransferItemRequest itReq : request.getItems()) {
            String toBatch = (itReq.getToBatchNumber() != null && !itReq.getToBatchNumber().isBlank())
                    ? itReq.getToBatchNumber().trim()
                    : itReq.getFromBatchNumber().trim();

            BigDecimal unitPrice = itReq.getUnitPrice() != null ? itReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal totalAmount = itReq.getTotalPrice() != null ? itReq.getTotalPrice() : itReq.getQuantity().multiply(unitPrice);

            WarehouseTransferItem item = WarehouseTransferItem.builder()
                    .tenantId(tenantId)
                    .transferId(transfer.getId())
                    .materialId(itReq.getMaterialId())
                    .fromBatchNumber(itReq.getFromBatchNumber().trim())
                    .toBatchNumber(toBatch)
                    .expiryDate(itReq.getExpiryDate())
                    .quantity(itReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(totalAmount)
                    .fromBinCode(itReq.getFromBinCode())
                    .toBinCode(itReq.getToBinCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transferItemRepository.save(item);
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_WAREHOUSE_TRANSFER")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/transfers")
                .method("POST")
                .newValue("Transfer: " + transfer.getTransferCode())
                .build());

        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseTransferDetailResponse> getTransfers(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return transferRepository.findByFarmId(tenantId, farmId, pageable)
                .map(this::enrichTransferDetail);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseTransferDetailResponse getTransferById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu điều chuyển", id));
        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional
    public WarehouseTransferDetailResponse dispatchTransfer(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu điều chuyển", id));

        if (!"DRAFT".equals(transfer.getStatus()) && !"PENDING".equals(transfer.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể xuất kho điều chuyển khi đang ở trạng thái DRAFT hoặc PENDING.");
        }

        List<WarehouseTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        items.sort(Comparator.comparing(WarehouseTransferItem::getMaterialId)
                .thenComparing(WarehouseTransferItem::getFromBatchNumber));

        for (WarehouseTransferItem item : items) {
            // Khóa và trừ kho nguồn
            WarehouseInventory fromInv = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            transfer.getFromWarehouseId(), item.getMaterialId(), item.getFromBatchNumber())
                    .orElseThrow(() -> new InsufficientStockException("Không tìm thấy lô nguồn trong kho xuất: " + item.getFromBatchNumber()));

            BigDecimal available = fromInv.getQuantityOnHand().subtract(fromInv.getReservedQuantity());
            if (available.compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException(item.getFromBatchNumber(), item.getQuantity(), available);
            }

            BigDecimal balanceBefore = fromInv.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(item.getQuantity());
            fromInv.setQuantityOnHand(balanceAfter);
            fromInv.setUpdatedAt(Instant.now());
            fromInv.setUpdatedBy(SecurityUtils.getCurrentUserId());
            inventoryRepository.save(fromInv);

            // Ghi sổ cái TRANSFER_OUT
            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(transfer.getFromFarmId())
                    .warehouseId(transfer.getFromWarehouseId())
                    .materialId(item.getMaterialId())
                    .batchNumber(item.getFromBatchNumber())
                    .transactionType("TRANSFER_OUT")
                    .referenceDocType("WAREHOUSE_TRANSFER")
                    .referenceDocId(transfer.getId())
                    .referenceItemId(item.getId())
                    .direction("OUT")
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalAmount(item.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(transfer.getTransferDate())
                    .notes("Xuất điều chuyển tới kho #" + transfer.getToWarehouseId())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);
        }

        transfer.setStatus("IN_TRANSIT");
        transfer.setTransferredByUserId(SecurityUtils.getCurrentUserId());
        transfer.setDispatchedAt(Instant.now());
        transfer.setUpdatedAt(Instant.now());
        transfer.setUpdatedBy(SecurityUtils.getCurrentUserId());
        transfer = transferRepository.save(transfer);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("DISPATCH_WAREHOUSE_TRANSFER")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/transfers/" + id + "/dispatch")
                .method("POST")
                .newValue("Dispatched transfer: " + transfer.getTransferCode())
                .build());

        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional
    public WarehouseTransferDetailResponse receiveTransfer(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu điều chuyển", id));

        if (!"IN_TRANSIT".equals(transfer.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể nhập kho điều chuyển khi đang ở trạng thái IN_TRANSIT.");
        }

        List<WarehouseTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        items.sort(Comparator.comparing(WarehouseTransferItem::getMaterialId)
                .thenComparing(WarehouseTransferItem::getToBatchNumber));

        for (WarehouseTransferItem item : items) {
            // Khóa hoặc tạo mới tại kho đích
            Optional<WarehouseInventory> toInvOpt = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            transfer.getToWarehouseId(), item.getMaterialId(), item.getToBatchNumber());

            WarehouseInventory toInv;
            BigDecimal balanceBefore;
            BigDecimal balanceAfter;

            if (toInvOpt.isPresent()) {
                toInv = toInvOpt.get();
                balanceBefore = toInv.getQuantityOnHand();
                balanceAfter = balanceBefore.add(item.getQuantity());
                toInv.setQuantityOnHand(balanceAfter);
                toInv.setUpdatedAt(Instant.now());
                toInv.setUpdatedBy(SecurityUtils.getCurrentUserId());
            } else {
                balanceBefore = BigDecimal.ZERO;
                balanceAfter = item.getQuantity();
                toInv = WarehouseInventory.builder()
                        .tenantId(tenantId)
                        .farmId(transfer.getToFarmId())
                        .warehouseId(transfer.getToWarehouseId())
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getToBatchNumber())
                        .inwardDate(LocalDate.now())
                        .expiryDate(item.getExpiryDate())
                        .unitCost(item.getUnitPrice())
                        .quantityOnHand(balanceAfter)
                        .reservedQuantity(BigDecimal.ZERO)
                        .storageBinCode(item.getToBinCode())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
            }
            inventoryRepository.save(toInv);

            // Ghi sổ cái TRANSFER_IN
            WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                    .tenantId(tenantId)
                    .farmId(transfer.getToFarmId())
                    .warehouseId(transfer.getToWarehouseId())
                    .materialId(item.getMaterialId())
                    .batchNumber(item.getToBatchNumber())
                    .transactionType("TRANSFER_IN")
                    .referenceDocType("WAREHOUSE_TRANSFER")
                    .referenceDocId(transfer.getId())
                    .referenceItemId(item.getId())
                    .direction("IN")
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalAmount(item.getTotalPrice())
                    .balanceBefore(balanceBefore)
                    .balanceAfter(balanceAfter)
                    .transactionDate(LocalDate.now())
                    .notes("Nhập điều chuyển từ kho #" + transfer.getFromWarehouseId())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);
        }

        transfer.setStatus("COMPLETED");
        transfer.setReceivedByUserId(SecurityUtils.getCurrentUserId());
        transfer.setReceivedAt(Instant.now());
        transfer.setUpdatedAt(Instant.now());
        transfer.setUpdatedBy(SecurityUtils.getCurrentUserId());
        transfer = transferRepository.save(transfer);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("RECEIVE_WAREHOUSE_TRANSFER")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/transfers/" + id + "/receive")
                .method("POST")
                .newValue("Received transfer: " + transfer.getTransferCode())
                .build());

        return enrichTransferDetail(transfer);
    }

    // =========================================================================
    // 5. STOCKTAKES (KIỂM KÊ KHO & CÂN BẰNG TỰ ĐỘNG)
    // =========================================================================

    @Override
    @Transactional
    public StocktakeDetailResponse createStocktake(Long farmId, CreateStocktakeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        String code = (request.getStocktakeCode() != null && !request.getStocktakeCode().isBlank())
                ? request.getStocktakeCode().trim().toUpperCase()
                : generateDocCode("STK");

        if (stocktakeRepository.existsByTenantIdAndFarmIdAndStocktakeCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCKTAKE_CODE_ALREADY_EXISTS", "Mã đợt kiểm kê đã tồn tại: " + code);
        }

        Stocktake stocktake = Stocktake.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .warehouseId(request.getWarehouseId())
                .stocktakeCode(code)
                .stocktakeDate(request.getStocktakeDate())
                .notes(request.getNotes())
                .status("DRAFT")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        stocktake = stocktakeRepository.save(stocktake);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("CREATE_STOCKTAKE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/stocktakes")
                .method("POST")
                .newValue("Stocktake: " + stocktake.getStocktakeCode())
                .build());

        return enrichStocktakeDetail(stocktake);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StocktakeDetailResponse> getStocktakes(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return stocktakeRepository.findByTenantIdAndFarmIdOrderByCreatedAtDesc(tenantId, farmId, pageable)
                .map(this::enrichStocktakeDetail);
    }

    @Override
    @Transactional(readOnly = true)
    public StocktakeDetailResponse getStocktakeById(Long farmId, Long id) {
        Stocktake stocktake = stocktakeRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt kiểm kê", id));
        return enrichStocktakeDetail(stocktake);
    }

    @Override
    @Transactional
    public StocktakeDetailResponse recordStocktakeCount(Long farmId, Long id, RecordStocktakeCountRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Stocktake stocktake = stocktakeRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt kiểm kê", id));

        if (!"DRAFT".equals(stocktake.getStatus()) && !"IN_PROGRESS".equals(stocktake.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể ghi nhận kiểm đếm khi đang ở trạng thái DRAFT hoặc IN_PROGRESS.");
        }

        // Xóa các chi tiết cũ nếu ghi nhận lại
        List<StocktakeItem> existingItems = stocktakeItemRepository.findByStocktakeId(stocktake.getId());
        stocktakeItemRepository.deleteAll(existingItems);

        for (RecordStocktakeCountRequest.StocktakeCountItemRequest itemReq : request.getItems()) {
            Optional<WarehouseInventory> invOpt = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumber(
                            stocktake.getWarehouseId(), itemReq.getMaterialId(), itemReq.getBatchNumber().trim());

            BigDecimal bookQty = invOpt.map(WarehouseInventory::getQuantityOnHand).orElse(BigDecimal.ZERO);
            BigDecimal diffQty = itemReq.getActualQuantity().subtract(bookQty);

            StocktakeItem item = StocktakeItem.builder()
                    .tenantId(tenantId)
                    .stocktakeId(stocktake.getId())
                    .materialId(itemReq.getMaterialId())
                    .batchNumber(itemReq.getBatchNumber().trim())
                    .bookQuantity(bookQty)
                    .actualQuantity(itemReq.getActualQuantity())
                    .differenceQuantity(diffQty)
                    .reason(itemReq.getReason())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            stocktakeItemRepository.save(item);
        }

        stocktake.setStatus("IN_PROGRESS");
        stocktake.setUpdatedAt(Instant.now());
        stocktake.setUpdatedBy(SecurityUtils.getCurrentUserId());
        stocktake = stocktakeRepository.save(stocktake);

        return enrichStocktakeDetail(stocktake);
    }

    @Override
    @Transactional
    public StocktakeDetailResponse adjustStocktake(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Stocktake stocktake = stocktakeRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt kiểm kê", id));

        if (!"IN_PROGRESS".equals(stocktake.getStatus()) && !"DRAFT".equals(stocktake.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chỉ có thể chốt cân bằng kiểm kê khi đang ở trạng thái IN_PROGRESS hoặc DRAFT.");
        }

        List<StocktakeItem> items = stocktakeItemRepository.findByStocktakeId(stocktake.getId());
        items.sort(Comparator.comparing(StocktakeItem::getMaterialId)
                .thenComparing(StocktakeItem::getBatchNumber));

        for (StocktakeItem item : items) {
            Optional<WarehouseInventory> invOpt = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            stocktake.getWarehouseId(), item.getMaterialId(), item.getBatchNumber());

            WarehouseInventory inventory;
            BigDecimal balanceBefore;

            if (invOpt.isPresent()) {
                inventory = invOpt.get();
                balanceBefore = inventory.getQuantityOnHand();
            } else {
                balanceBefore = BigDecimal.ZERO;
                inventory = WarehouseInventory.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(stocktake.getWarehouseId())
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getBatchNumber())
                        .inwardDate(stocktake.getStocktakeDate())
                        .unitCost(BigDecimal.ZERO)
                        .reservedQuantity(BigDecimal.ZERO)
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
            }

            BigDecimal balanceAfter = item.getActualQuantity();
            inventory.setQuantityOnHand(balanceAfter);
            inventory.setUpdatedAt(Instant.now());
            inventory.setUpdatedBy(SecurityUtils.getCurrentUserId());
            inventoryRepository.save(inventory);

            BigDecimal diff = item.getDifferenceQuantity();

            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                // Thừa kiểm kê -> STOCKTAKE_ADJUST_IN
                WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(stocktake.getWarehouseId())
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getBatchNumber())
                        .transactionType("STOCKTAKE_ADJUST_IN")
                        .referenceDocType("STOCKTAKE")
                        .referenceDocId(stocktake.getId())
                        .referenceItemId(item.getId())
                        .direction("IN")
                        .quantity(diff)
                        .unitPrice(inventory.getUnitCost())
                        .totalAmount(diff.multiply(inventory.getUnitCost()))
                        .balanceBefore(balanceBefore)
                        .balanceAfter(balanceAfter)
                        .transactionDate(stocktake.getStocktakeDate())
                        .notes("Cân bằng thừa kiểm kê " + stocktake.getStocktakeCode())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                transactionRepository.save(transaction);
            } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                // Thiếu kiểm kê -> STOCKTAKE_ADJUST_OUT
                BigDecimal absDiff = diff.abs();
                WarehouseInventoryTransaction transaction = WarehouseInventoryTransaction.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(stocktake.getWarehouseId())
                        .materialId(item.getMaterialId())
                        .batchNumber(item.getBatchNumber())
                        .transactionType("STOCKTAKE_ADJUST_OUT")
                        .referenceDocType("STOCKTAKE")
                        .referenceDocId(stocktake.getId())
                        .referenceItemId(item.getId())
                        .direction("OUT")
                        .quantity(absDiff)
                        .unitPrice(inventory.getUnitCost())
                        .totalAmount(absDiff.multiply(inventory.getUnitCost()))
                        .balanceBefore(balanceBefore)
                        .balanceAfter(balanceAfter)
                        .transactionDate(stocktake.getStocktakeDate())
                        .notes("Cân bằng thiếu kiểm kê " + stocktake.getStocktakeCode())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                transactionRepository.save(transaction);
            }
        }

        stocktake.setStatus("COMPLETED");
        stocktake.setApprovedBy(SecurityUtils.getCurrentUserId());
        stocktake.setApprovedAt(Instant.now());
        stocktake.setUpdatedAt(Instant.now());
        stocktake.setUpdatedBy(SecurityUtils.getCurrentUserId());
        stocktake = stocktakeRepository.save(stocktake);

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(tenantId)
                .userId(SecurityUtils.getCurrentUserId())
                .action("ADJUST_STOCKTAKE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/stocktakes/" + id + "/adjust")
                .method("POST")
                .newValue("Adjusted stocktake: " + stocktake.getStocktakeCode())
                .build());

        return enrichStocktakeDetail(stocktake);
    }

    // =========================================================================
    // ENRICHMENT HELPERS (NO ENTITY LEAKAGE)
    // =========================================================================

    private InventoryItemResponse enrichInventoryItem(WarehouseInventory inv) {
        Warehouse warehouse = warehouseRepository.findById(inv.getWarehouseId()).orElse(null);
        Material material = materialRepository.findById(inv.getMaterialId()).orElse(null);

        BigDecimal onHand = inv.getQuantityOnHand() != null ? inv.getQuantityOnHand() : BigDecimal.ZERO;
        BigDecimal reserved = inv.getReservedQuantity() != null ? inv.getReservedQuantity() : BigDecimal.ZERO;
        BigDecimal available = onHand.subtract(reserved);

        boolean isLowStock = false;
        boolean isNearExpiry = false;
        Long daysUntilExpiry = null;

        if (material != null) {
            if (material.getMinStockLevel() != null && onHand.compareTo(material.getMinStockLevel()) < 0) {
                isLowStock = true;
            }
            if (inv.getExpiryDate() != null) {
                daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), inv.getExpiryDate());
                int alertDays = material.getExpiryAlertDays() != null ? material.getExpiryAlertDays() : 30;
                if (daysUntilExpiry <= alertDays) {
                    isNearExpiry = true;
                }
            }
        }

        return InventoryItemResponse.builder()
                .id(inv.getId())
                .warehouseId(inv.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + inv.getWarehouseId())
                .materialId(inv.getMaterialId())
                .skuCode(material != null ? material.getSkuCode() : null)
                .materialName(material != null ? material.getName() : null)
                .standardUnit(material != null ? material.getStandardUnit() : null)
                .batchNumber(inv.getBatchNumber())
                .manufactureDate(inv.getManufactureDate())
                .inwardDate(inv.getInwardDate())
                .expiryDate(inv.getExpiryDate())
                .unitCost(inv.getUnitCost())
                .quantityOnHand(onHand)
                .reservedQuantity(reserved)
                .availableQuantity(available)
                .storageBinCode(inv.getStorageBinCode())
                .internalBatchBarcode(inv.getInternalBatchBarcode())
                .isLowStock(isLowStock)
                .isNearExpiry(isNearExpiry)
                .daysUntilExpiry(daysUntilExpiry)
                .build();
    }

    private InventoryTransactionResponse toTransactionResponse(WarehouseInventoryTransaction t) {
        Warehouse warehouse = warehouseRepository.findById(t.getWarehouseId()).orElse(null);
        Material material = materialRepository.findById(t.getMaterialId()).orElse(null);

        return InventoryTransactionResponse.builder()
                .id(t.getId())
                .farmId(t.getFarmId())
                .warehouseId(t.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + t.getWarehouseId())
                .materialId(t.getMaterialId())
                .skuCode(material != null ? material.getSkuCode() : null)
                .materialName(material != null ? material.getName() : null)
                .batchNumber(t.getBatchNumber())
                .transactionType(t.getTransactionType())
                .referenceDocType(t.getReferenceDocType())
                .referenceDocId(t.getReferenceDocId())
                .referenceItemId(t.getReferenceItemId())
                .direction(t.getDirection())
                .quantity(t.getQuantity())
                .unitPrice(t.getUnitPrice())
                .totalAmount(t.getTotalAmount())
                .balanceBefore(t.getBalanceBefore())
                .balanceAfter(t.getBalanceAfter())
                .transactionDate(t.getTransactionDate())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .createdBy(t.getCreatedBy())
                .build();
    }

    private WarehouseReceiptDetailResponse enrichReceiptDetail(WarehouseReceipt r) {
        Warehouse warehouse = warehouseRepository.findById(r.getWarehouseId()).orElse(null);
        Partner partner = r.getPartnerId() != null ? partnerRepository.findById(r.getPartnerId()).orElse(null) : null;
        List<WarehouseReceiptItem> items = receiptItemRepository.findByReceiptId(r.getId());

        List<WarehouseReceiptDetailResponse.ReceiptItemDto> itemDtos = items.stream().map(it -> {
            Material material = materialRepository.findById(it.getMaterialId()).orElse(null);
            return WarehouseReceiptDetailResponse.ReceiptItemDto.builder()
                    .id(it.getId())
                    .materialId(it.getMaterialId())
                    .skuCode(material != null ? material.getSkuCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .standardUnit(material != null ? material.getStandardUnit() : null)
                    .batchNumber(it.getBatchNumber())
                    .expiryDate(it.getExpiryDate())
                    .enteredUnit(it.getEnteredUnit())
                    .enteredQuantity(it.getEnteredQuantity())
                    .conversionFactor(it.getConversionFactor())
                    .quantity(it.getQuantity())
                    .unitPrice(it.getUnitPrice())
                    .totalPrice(it.getTotalPrice())
                    .storageBinCode(it.getStorageBinCode())
                    .build();
        }).collect(Collectors.toList());

        return WarehouseReceiptDetailResponse.builder()
                .id(r.getId())
                .farmId(r.getFarmId())
                .warehouseId(r.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + r.getWarehouseId())
                .receiptCode(r.getReceiptCode())
                .receiptType(r.getReceiptType())
                .partnerId(r.getPartnerId())
                .partnerName(partner != null ? partner.getName() : null)
                .receiptDate(r.getReceiptDate())
                .totalAmount(r.getTotalAmount())
                .notes(r.getNotes())
                .status(r.getStatus())
                .approvedBy(r.getApprovedBy())
                .approvedAt(r.getApprovedAt())
                .cancelledBy(r.getCancelledBy())
                .cancelledAt(r.getCancelledAt())
                .cancellationReason(r.getCancellationReason())
                .items(itemDtos)
                .build();
    }

    private WarehouseIssueDetailResponse enrichIssueDetail(WarehouseIssue i) {
        Warehouse warehouse = warehouseRepository.findById(i.getWarehouseId()).orElse(null);
        List<WarehouseIssueItem> items = issueItemRepository.findByIssueId(i.getId());

        List<WarehouseIssueDetailResponse.IssueItemDto> itemDtos = items.stream().map(it -> {
            Material material = materialRepository.findById(it.getMaterialId()).orElse(null);
            return WarehouseIssueDetailResponse.IssueItemDto.builder()
                    .id(it.getId())
                    .materialId(it.getMaterialId())
                    .skuCode(material != null ? material.getSkuCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .standardUnit(material != null ? material.getStandardUnit() : null)
                    .batchNumber(it.getBatchNumber())
                    .enteredUnit(it.getEnteredUnit())
                    .enteredQuantity(it.getEnteredQuantity())
                    .conversionFactor(it.getConversionFactor())
                    .quantity(it.getQuantity())
                    .unitPrice(it.getUnitPrice())
                    .totalPrice(it.getTotalPrice())
                    .build();
        }).collect(Collectors.toList());

        return WarehouseIssueDetailResponse.builder()
                .id(i.getId())
                .farmId(i.getFarmId())
                .warehouseId(i.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + i.getWarehouseId())
                .issueCode(i.getIssueCode())
                .issueType(i.getIssueType())
                .receiverName(i.getReceiverName())
                .seasonId(i.getSeasonId())
                .farmingLogId(i.getFarmingLogId())
                .livestockEventId(i.getLivestockEventId())
                .isBackflushed(i.getIsBackflushed())
                .issueDate(i.getIssueDate())
                .totalAmount(i.getTotalAmount())
                .notes(i.getNotes())
                .status(i.getStatus())
                .approvedBy(i.getApprovedBy())
                .approvedAt(i.getApprovedAt())
                .cancelledBy(i.getCancelledBy())
                .cancelledAt(i.getCancelledAt())
                .cancellationReason(i.getCancellationReason())
                .items(itemDtos)
                .build();
    }

    private WarehouseTransferDetailResponse enrichTransferDetail(WarehouseTransfer t) {
        Warehouse fromWh = warehouseRepository.findById(t.getFromWarehouseId()).orElse(null);
        Warehouse toWh = warehouseRepository.findById(t.getToWarehouseId()).orElse(null);
        List<WarehouseTransferItem> items = transferItemRepository.findByTransferId(t.getId());

        List<WarehouseTransferDetailResponse.TransferItemDto> itemDtos = items.stream().map(it -> {
            Material material = materialRepository.findById(it.getMaterialId()).orElse(null);
            return WarehouseTransferDetailResponse.TransferItemDto.builder()
                    .id(it.getId())
                    .materialId(it.getMaterialId())
                    .skuCode(material != null ? material.getSkuCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .standardUnit(material != null ? material.getStandardUnit() : null)
                    .fromBatchNumber(it.getFromBatchNumber())
                    .toBatchNumber(it.getToBatchNumber())
                    .expiryDate(it.getExpiryDate())
                    .quantity(it.getQuantity())
                    .unitPrice(it.getUnitPrice())
                    .totalAmount(it.getTotalPrice())
                    .fromBinCode(it.getFromBinCode())
                    .toBinCode(it.getToBinCode())
                    .build();
        }).collect(Collectors.toList());

        return WarehouseTransferDetailResponse.builder()
                .id(t.getId())
                .fromFarmId(t.getFromFarmId())
                .toFarmId(t.getToFarmId())
                .fromWarehouseId(t.getFromWarehouseId())
                .fromWarehouseName(fromWh != null ? fromWh.getName() : "Kho #" + t.getFromWarehouseId())
                .toWarehouseId(t.getToWarehouseId())
                .toWarehouseName(toWh != null ? toWh.getName() : "Kho #" + t.getToWarehouseId())
                .transferCode(t.getTransferCode())
                .transferDate(t.getTransferDate())
                .status(t.getStatus())
                .transferredByUserId(t.getTransferredByUserId())
                .receivedByUserId(t.getReceivedByUserId())
                .dispatchedAt(t.getDispatchedAt())
                .receivedAt(t.getReceivedAt())
                .notes(t.getNotes())
                .items(itemDtos)
                .build();
    }

    private StocktakeDetailResponse enrichStocktakeDetail(Stocktake s) {
        Warehouse warehouse = warehouseRepository.findById(s.getWarehouseId()).orElse(null);
        List<StocktakeItem> items = stocktakeItemRepository.findByStocktakeId(s.getId());

        List<StocktakeDetailResponse.StocktakeItemDto> itemDtos = items.stream().map(it -> {
            Material material = materialRepository.findById(it.getMaterialId()).orElse(null);
            return StocktakeDetailResponse.StocktakeItemDto.builder()
                    .id(it.getId())
                    .materialId(it.getMaterialId())
                    .skuCode(material != null ? material.getSkuCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .standardUnit(material != null ? material.getStandardUnit() : null)
                    .batchNumber(it.getBatchNumber())
                    .bookQuantity(it.getBookQuantity())
                    .actualQuantity(it.getActualQuantity())
                    .differenceQuantity(it.getDifferenceQuantity())
                    .reason(it.getReason())
                    .build();
        }).collect(Collectors.toList());

        return StocktakeDetailResponse.builder()
                .id(s.getId())
                .farmId(s.getFarmId())
                .warehouseId(s.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + s.getWarehouseId())
                .stocktakeCode(s.getStocktakeCode())
                .stocktakeDate(s.getStocktakeDate())
                .status(s.getStatus())
                .approvedBy(s.getApprovedBy())
                .approvedAt(s.getApprovedAt())
                .notes(s.getNotes())
                .items(itemDtos)
                .build();
    }

    private String generateDocCode(String prefix) {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomPart = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return prefix + "-" + datePart + "-" + randomPart;
    }
}
