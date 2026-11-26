package com.farm.saas.modules.inventory.service.impl;

import com.farm.saas.common.audit.AuditTrailEvent;
import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.CustomUserDetails;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.inventory.dto.request.*;
import com.farm.saas.modules.inventory.dto.response.*;
import com.farm.saas.modules.inventory.entity.*;
import com.farm.saas.modules.inventory.repository.*;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import com.farm.saas.modules.masterdata.entity.Warehouse;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.MaterialUnitConversionRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.workforce.entity.Employee;
import com.farm.saas.modules.workforce.repository.EmployeeRepository;
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
    private final MaterialCategoryRepository materialCategoryRepository;
    private final MaterialUnitConversionRepository materialUnitConversionRepository;
    private final PartnerRepository partnerRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final FarmRepository farmRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final NotificationService notificationService;
    private final ZoneLocationRepository zoneLocationRepository;
    private final EmployeeRepository employeeRepository;

    private void notifyFarmManager(Long farmId, Long tenantId, String title, String message, String refType, Long refId, String actionUrl) {
        if (notificationService == null || farmId == null) return;
        farmRepository.findById(farmId).ifPresent(farm -> {
            Long managerUserId = farm.getManagerUserId();
            Long currentUserId = SecurityUtils.getCurrentUserId();
            if (managerUserId != null && !managerUserId.equals(currentUserId)) {
                notificationService.sendNotification(tenantId, managerUserId, title, message, "SYSTEM", refType, refId, actionUrl);
            }
        });
    }

    private void notifyCreator(Long farmId, Long tenantId, Long createdByUserId, String title, String message, String refType, Long refId, String actionUrl) {
        if (notificationService == null || createdByUserId == null) return;
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!createdByUserId.equals(currentUserId)) {
            notificationService.sendNotification(tenantId, createdByUserId, title, message, "SYSTEM", refType, refId, actionUrl);
        }
    }

    private void validateLocationCapacity(Long warehouseId, Long farmId, Map<String, BigDecimal> binQtyMap, String actionDescription) {
        if (binQtyMap == null || binQtyMap.isEmpty()) return;
        for (Map.Entry<String, BigDecimal> entry : binQtyMap.entrySet()) {
            String binCode = entry.getKey();
            BigDecimal reqQty = entry.getValue();
            if (!StringUtils.hasText(binCode) || reqQty == null || reqQty.compareTo(BigDecimal.ZERO) <= 0) continue;
            Optional<ZoneLocation> locOpt = zoneLocationRepository.findByWarehouseIdAndCode(warehouseId, binCode.trim());
            if (locOpt.isEmpty() && farmId != null) {
                locOpt = zoneLocationRepository.findByFarmIdAndCode(farmId, binCode.trim());
            }
            if (locOpt.isPresent()) {
                ZoneLocation loc = locOpt.get();
                if (loc.getCapacity() != null && reqQty.compareTo(BigDecimal.valueOf(loc.getCapacity())) > 0) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_BIN_CAPACITY",
                            "Ká»‡ [" + binCode + "] khÃ´ng Ä‘á»§ sá»©c chá»©a " + actionDescription + "! Sá»©c chá»©a hiá»‡n táº¡i: "
                                    + loc.getCapacity() + ", sá»‘ lÆ°á»£ng yÃªu cáº§u: " + reqQty.stripTrailingZeros().toPlainString());
                }
            }
        }
    }

    private void deductLocationCapacity(Long warehouseId, Long farmId, String binCode, BigDecimal quantity) {
        if (!StringUtils.hasText(binCode) || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) return;
        Optional<ZoneLocation> locOpt = zoneLocationRepository.findByWarehouseIdAndCode(warehouseId, binCode.trim());
        if (locOpt.isEmpty() && farmId != null) {
            locOpt = zoneLocationRepository.findByFarmIdAndCode(farmId, binCode.trim());
        }
        if (locOpt.isPresent()) {
            ZoneLocation loc = locOpt.get();
            if (loc.getCapacity() != null) {
                int newCap = Math.max(0, loc.getCapacity() - quantity.intValue());
                loc.setCapacity(newCap);
                if (newCap <= 0) {
                    loc.setStatus("OCCUPIED");
                }
                loc.setUpdatedAt(Instant.now());
                loc.setUpdatedBy(SecurityUtils.getCurrentUserId());
                zoneLocationRepository.save(loc);
            }
        }
    }

    private void restoreLocationCapacity(Long warehouseId, Long farmId, String binCode, BigDecimal quantity) {
        if (!StringUtils.hasText(binCode) || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) return;
        Optional<ZoneLocation> locOpt = zoneLocationRepository.findByWarehouseIdAndCode(warehouseId, binCode.trim());
        if (locOpt.isEmpty() && farmId != null) {
            locOpt = zoneLocationRepository.findByFarmIdAndCode(farmId, binCode.trim());
        }
        if (locOpt.isPresent()) {
            ZoneLocation loc = locOpt.get();
            if (loc.getCapacity() != null) {
                int newCap = loc.getCapacity() + quantity.intValue();
                loc.setCapacity(newCap);
                if ("OCCUPIED".equalsIgnoreCase(loc.getStatus())) {
                    loc.setStatus("ACTIVE");
                }
                loc.setUpdatedAt(Instant.now());
                loc.setUpdatedBy(SecurityUtils.getCurrentUserId());
                zoneLocationRepository.save(loc);
            }
        }
    }

    private void applyFarmAccessPredicate(Long farmId, jakarta.persistence.criteria.Root<?> root,
                                          jakarta.persistence.criteria.CriteriaBuilder cb,
                                          List<Predicate> predicates) {
        if (farmId != null && farmId > 0) {
            predicates.add(cb.equal(root.get("farmId"), farmId));
        } else {
            CustomUserDetails user = SecurityUtils.getCurrentUser();
            if (user != null && !user.hasRole("ROLE_FARM_OWNER") && !user.isSuperAdmin()) {
                Set<Long> accessible = SecurityUtils.getCurrentAccessibleFarmIds();
                if (accessible == null || accessible.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("farmId").in(accessible));
                }
            }
        }
    }

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
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
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

        // 1. Tá»“n kho
        Specification<WarehouseInventory> invSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
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

        // 2. Tá»•ng giÃ¡ trá»‹ nháº­p mua (trá»« phiáº¿u CANCELLED)
        Specification<WarehouseReceipt> receiptSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
            }
            predicates.add(cb.notEqual(root.get("status"), "CANCELLED"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<WarehouseReceipt> receipts = receiptRepository.findAll(receiptSpec);
        BigDecimal totalPurchased = receipts.stream()
                .map(r -> r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean canViewPrice = SecurityUtils.canViewFinancialPrice();
        return InventorySummaryResponse.builder()
                .totalInventoryValuation(canViewPrice ? totalValuation : null)
                .totalPurchasedAmount(canViewPrice ? totalPurchased : null)
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
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
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
    // 2. WAREHOUSE RECEIPTS (NHáº¬P KHO & LUá»’NG 2: MUA HÃ€NG + CÃ”NG Ná»¢)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse createReceipt(Long farmId, CreateWarehouseReceiptRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        if ("PURCHASE".equalsIgnoreCase(request.getReceiptType())) {
            if (request.getPartnerId() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_PARTNER", "Phiáº¿u nháº­p mua hÃ ng báº¯t buá»™c pháº£i cÃ³ thÃ´ng tin Ä‘á»‘i tÃ¡c cung cáº¥p.");
            }
            Partner partner = partnerRepository.findByTenantIdAndId(tenantId, request.getPartnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Äá»‘i tÃ¡c", request.getPartnerId()));
            if (!"SUPPLIER".equalsIgnoreCase(partner.getPartnerType()) && !"AGENT".equalsIgnoreCase(partner.getPartnerType())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PARTNER_TYPE", "Äá»‘i tÃ¡c cung cáº¥p pháº£i thuá»™c loáº¡i SUPPLIER hoáº·c AGENT.");
            }
        }

        String code = (request.getReceiptCode() != null && !request.getReceiptCode().isBlank())
                ? request.getReceiptCode().trim().toUpperCase()
                : generateDocCode("RCP");

        if (receiptRepository.existsByTenantIdAndFarmIdAndReceiptCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "RECEIPT_CODE_ALREADY_EXISTS", "MÃ£ phiáº¿u nháº­p kho Ä‘Ã£ tá»“n táº¡i: " + code);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<WarehouseReceiptItem> itemsToSave = new ArrayList<>();
        Map<String, BigDecimal> binQtyMap = new HashMap<>();

        for (CreateWarehouseReceiptRequest.ReceiptItemRequest itemReq : request.getItems()) {
            BigDecimal factor = (itemReq.getConversionFactor() != null && itemReq.getConversionFactor().compareTo(BigDecimal.ZERO) > 0)
                    ? itemReq.getConversionFactor()
                    : BigDecimal.ONE.setScale(4);

            BigDecimal qty = itemReq.getQuantity();
            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                if (itemReq.getEnteredQuantity() != null && itemReq.getEnteredQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    qty = itemReq.getEnteredQuantity().multiply(factor);
                } else {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Sá»‘ lÆ°á»£ng nháº­p kho pháº£i lá»›n hÆ¡n 0.");
                }
            }

            BigDecimal enteredQty = itemReq.getEnteredQuantity() != null ? itemReq.getEnteredQuantity() : qty;
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal totalPrice = itemReq.getTotalPrice();
            if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
                totalPrice = enteredQty.multiply(unitPrice);
            }

            totalAmount = totalAmount.add(totalPrice);

            if (StringUtils.hasText(itemReq.getStorageBinCode())) {
                binQtyMap.merge(itemReq.getStorageBinCode().trim(), qty, BigDecimal::add);
            }

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

        validateLocationCapacity(request.getWarehouseId(), farmId, binQtyMap, "Ä‘á»ƒ láº­p phiáº¿u nháº­p kho");

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

        notifyFarmManager(farmId, tenantId, "Phiáº¿u nháº­p kho má»›i",
                "Thá»§ kho vá»«a láº­p Phiáº¿u nháº­p kho [" + receipt.getReceiptCode() + "] Ä‘ang chá» phÃª duyá»‡t.",
                "WAREHOUSE_RECEIPT", receipt.getId(), "/app/inventory?tab=RECEIPT&id=" + receipt.getId());

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
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
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
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u nháº­p kho", id));
        return enrichReceiptDetail(receipt);
    }

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse completeReceipt(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseReceipt receipt = receiptRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u nháº­p kho", id));

        if (!"DRAFT".equals(receipt.getStatus()) && !"APPROVED".equals(receipt.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ hoÃ n táº¥t phiáº¿u nháº­p khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c APPROVED. Hiá»‡n táº¡i: " + receipt.getStatus());
        }

        List<WarehouseReceiptItem> items = receiptItemRepository.findByReceiptId(receipt.getId());
        // KhÃ³a cÃ¡c lÃ´ theo thá»© tá»± nháº¥t quÃ¡n Ä‘á»ƒ trÃ¡nh deadlock
        items.sort(Comparator.comparing(WarehouseReceiptItem::getMaterialId)
                .thenComparing(WarehouseReceiptItem::getBatchNumber));

        Map<String, BigDecimal> receiptBinQtyMap = new HashMap<>();
        for (WarehouseReceiptItem item : items) {
            if (StringUtils.hasText(item.getStorageBinCode())) {
                receiptBinQtyMap.merge(item.getStorageBinCode().trim(), item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO, BigDecimal::add);
            }
        }
        validateLocationCapacity(receipt.getWarehouseId(), farmId, receiptBinQtyMap, "Ä‘á»ƒ hoÃ n táº¥t nháº­p kho");

        for (WarehouseReceiptItem item : items) {
            // KhÃ³a bi quan dÃ²ng warehouse_inventory
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

            // Ghi sá»• cÃ¡i báº¥t biáº¿n (#38)
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
                    .notes("Nháº­p kho theo phiáº¿u " + receipt.getReceiptCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);

            // Cáº­p nháº­t giáº£m sá»©c chá»©a cá»§a vá»‹ trÃ­ ká»‡
            deductLocationCapacity(receipt.getWarehouseId(), farmId, item.getStorageBinCode(), item.getQuantity());
        }

        // Luá»“ng 2: Náº¿u lÃ  nháº­p mua PURCHASE -> tá»± Ä‘á»™ng sinh cÃ´ng ná»£ pháº£i tráº£ trong debt_records (#66)
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

        notifyCreator(farmId, tenantId, receipt.getCreatedBy(), "Phiáº¿u nháº­p kho Ä‘Ã£ hoÃ n táº¥t",
                "GiÃ¡m Ä‘á»‘c trang tráº¡i Ä‘Ã£ phÃª duyá»‡t hoÃ n táº¥t Phiáº¿u nháº­p kho [" + receipt.getReceiptCode() + "]. HÃ ng Ä‘Ã£ nháº­p kho.",
                "WAREHOUSE_RECEIPT", receipt.getId(), "/app/inventory?tab=RECEIPT&id=" + receipt.getId());

        return enrichReceiptDetail(receipt);
    }

    @Override
    @Transactional
    public WarehouseReceiptDetailResponse cancelReceipt(Long farmId, Long id, CancelWarehouseReceiptRequest request) {
        WarehouseReceipt receipt = receiptRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u nháº­p kho", id));

        if (!"DRAFT".equals(receipt.getStatus()) && !"APPROVED".equals(receipt.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ há»§y phiáº¿u nháº­p khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c APPROVED.");
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

        notifyCreator(farmId, receipt.getTenantId(), receipt.getCreatedBy(), "Phiáº¿u nháº­p kho Ä‘Ã£ bá»‹ há»§y",
                "Phiáº¿u nháº­p kho [" + receipt.getReceiptCode() + "] Ä‘Ã£ bá»‹ há»§y. LÃ½ do: " + (request != null ? request.getCancellationReason() : ""),
                "WAREHOUSE_RECEIPT", receipt.getId(), "/app/inventory?tab=RECEIPT&id=" + receipt.getId());

        return enrichReceiptDetail(receipt);
    }

    // =========================================================================
    // 3. WAREHOUSE ISSUES (XUáº¤T KHO THá»¦ CÃ”NG)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseIssueDetailResponse createIssue(Long farmId, CreateWarehouseIssueRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        String code = (request.getIssueCode() != null && !request.getIssueCode().isBlank())
                ? request.getIssueCode().trim().toUpperCase()
                : generateDocCode("ISS");

        if (issueRepository.existsByTenantIdAndFarmIdAndIssueCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "ISSUE_CODE_ALREADY_EXISTS", "MÃ£ phiáº¿u xuáº¥t kho Ä‘Ã£ tá»“n táº¡i: " + code);
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
                    throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Sá»‘ lÆ°á»£ng xuáº¥t kho pháº£i lá»›n hÆ¡n 0.");
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
                .livestockGroupId(request.getLivestockGroupId())
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

        notifyFarmManager(farmId, tenantId, "Phiáº¿u xuáº¥t kho má»›i",
                "Thá»§ kho vá»«a láº­p Phiáº¿u xuáº¥t kho [" + issue.getIssueCode() + "] Ä‘ang chá» phÃª duyá»‡t.",
                "WAREHOUSE_ISSUE", issue.getId(), "/app/inventory?tab=ISSUE&id=" + issue.getId());

        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional
    public WarehouseIssueDetailResponse autoCreateIssueDraftForTask(Long farmId, Long taskId, Long currentUserId) {
        return null;
    }
    public void cancelIssueForTask(Long farmId, Long taskId, String reason) {
        if (farmId == null || taskId == null) return;
        List<WarehouseIssue> issues = issueRepository.findByTaskId(taskId);
        for (WarehouseIssue issue : issues) {
            if ("DRAFT".equals(issue.getStatus())) {
                CancelWarehouseIssueRequest cancelReq = new CancelWarehouseIssueRequest();
                cancelReq.setCancellationReason(reason != null ? reason : "CÃ´ng viá»‡c bá»‹ há»§y/thay Ä‘á»•i");
                cancelIssue(farmId, issue.getId(), cancelReq);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseIssueDetailResponse> getIssues(
            Long farmId, Long warehouseId, String status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<WarehouseIssue> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            applyFarmAccessPredicate(farmId, root, cb, predicates);
            if (tenantId != null && !SecurityUtils.isSuperAdmin()) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            Long currentBranchId = SecurityUtils.getCurrentBranchId();
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            } else if (currentBranchId != null) {
                List<Long> branchWhIds = (farmId != null)
                        ? warehouseRepository.findByFarmIdAndBranchId(farmId, currentBranchId).stream().map(Warehouse::getId).collect(Collectors.toList())
                        : warehouseRepository.findAll().stream().filter(w -> currentBranchId.equals(w.getBranchId())).map(Warehouse::getId).collect(Collectors.toList());
                if (branchWhIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("warehouseId").in(branchWhIds));
                }
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
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u xuáº¥t kho", id));
        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional
    public WarehouseIssueDetailResponse completeIssue(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseIssue issue = issueRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u xuáº¥t kho", id));

        if (!"DRAFT".equals(issue.getStatus()) && !"APPROVED".equals(issue.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ hoÃ n táº¥t phiáº¿u xuáº¥t khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c APPROVED.");
        }

        List<WarehouseIssueItem> items = issueItemRepository.findByIssueId(issue.getId());
        items.sort(Comparator.comparing(WarehouseIssueItem::getMaterialId)
                .thenComparing(WarehouseIssueItem::getBatchNumber));

        for (WarehouseIssueItem item : items) {
            // KhÃ³a bi quan dÃ²ng warehouse_inventory
            WarehouseInventory inventory = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            issue.getWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                    .orElseThrow(() -> new InsufficientStockException("KhÃ´ng tÃ¬m tháº¥y lÃ´ váº­t tÆ° trong kho: " + item.getBatchNumber()));

            BigDecimal reservedByOthers = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity() : BigDecimal.ZERO;
            if (issue.getTaskId() != null) {
                reservedByOthers = reservedByOthers.subtract(item.getQuantity());
                if (reservedByOthers.compareTo(BigDecimal.ZERO) < 0) reservedByOthers = BigDecimal.ZERO;
            }

            BigDecimal available = inventory.getQuantityOnHand().subtract(reservedByOthers);
            if (available.compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException(item.getBatchNumber(), item.getQuantity(), available);
            }

            BigDecimal balanceBefore = inventory.getQuantityOnHand();
            BigDecimal balanceAfter = balanceBefore.subtract(item.getQuantity());
            inventory.setQuantityOnHand(balanceAfter);
            inventory.setReservedQuantity(reservedByOthers);
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
                    .notes("Xuáº¥t kho theo phiáº¿u " + issue.getIssueCode())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);

            // Phá»¥c há»“i láº¡i sá»©c chá»©a vá»‹ trÃ­ ká»‡ tÆ°Æ¡ng á»©ng khi xuáº¥t kho
            restoreLocationCapacity(issue.getWarehouseId(), farmId, inventory.getStorageBinCode(), item.getQuantity());
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



        // Náº¿u xuáº¥t sá»­ dá»¥ng ná»™i bá»™ (INTERNAL_USE / TASK_DISPATCH) vÃ  cÃ³ gáº¯n vá»¥ mÃ¹a hoáº·c Ä‘Ã n nuÃ´i -> Tá»± Ä‘á»™ng sinh FarmExpense
        if (("INTERNAL_USE".equalsIgnoreCase(issue.getIssueType()) || "TASK_DISPATCH".equalsIgnoreCase(issue.getIssueType())) && (issue.getSeasonId() != null || issue.getLivestockGroupId() != null)) {
            CostCategory costCategory = costCategoryRepository.findByTenantIdAndCostType(tenantId, "MATERIALS")
                    .stream().findFirst()
                    .orElseGet(() -> {
                        CostCategory newCat = CostCategory.builder()
                                .tenantId(tenantId)
                                .name("Chi phÃ­ Váº­t tÆ° Xuáº¥t dÃ¹ng")
                                .code("MAT-EXP")
                                .costType("MATERIALS")
                                .createdAt(Instant.now())
                                .createdBy(SecurityUtils.getCurrentUserId())
                                .build();
                        return costCategoryRepository.save(newCat);
                    });

            String expCode = "EXP-ISS-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            FarmExpense expense = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(farmId)
                    .costCategoryId(costCategory.getId())
                    .expenseCode(expCode)
                    .expenseSource("INVENTORY_BACKFLUSH")
                    .referenceId(issue.getId())
                    .seasonId(issue.getSeasonId())
                    .livestockGroupId(issue.getLivestockGroupId())
                    .expenseDate(issue.getIssueDate())
                    .amount(issue.getTotalAmount())
                    .unitCostEligible(true)
                    .status("CONFIRMED")
                    .notes("Chi phÃ­ váº­t tÆ° xuáº¥t kho ná»™i bá»™ theo phiáº¿u #" + issue.getIssueCode() +
                            (StringUtils.hasText(issue.getNotes()) ? " (" + issue.getNotes().trim() + ")" : ""))
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            expense = farmExpenseRepository.save(expense);
            // budget consumed
            log.info("Auto-generated FarmExpense {} for completed internal issue {}", expCode, issue.getIssueCode());
        }

        notifyCreator(farmId, tenantId, issue.getCreatedBy(), "Phiáº¿u xuáº¥t kho Ä‘Ã£ hoÃ n táº¥t",
                "GiÃ¡m Ä‘á»‘c trang tráº¡i Ä‘Ã£ phÃª duyá»‡t hoÃ n táº¥t Phiáº¿u xuáº¥t kho [" + issue.getIssueCode() + "]. HÃ ng Ä‘Ã£ xuáº¥t kho.",
                "WAREHOUSE_ISSUE", issue.getId(), "/app/inventory?tab=ISSUE&id=" + issue.getId());

        return enrichIssueDetail(issue);
    }

    @Override
    @Transactional
    public WarehouseIssueDetailResponse cancelIssue(Long farmId, Long id, CancelWarehouseIssueRequest request) {
        WarehouseIssue issue = issueRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u xuáº¥t kho", id));

        if (!"DRAFT".equals(issue.getStatus()) && !"APPROVED".equals(issue.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ há»§y phiáº¿u xuáº¥t khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c APPROVED.");
        }

        issue.setStatus("CANCELLED");
        issue.setCancelledBy(SecurityUtils.getCurrentUserId());
        issue.setCancelledAt(Instant.now());
        issue.setCancellationReason(request.getCancellationReason());
        issue.setUpdatedAt(Instant.now());
        issue.setUpdatedBy(SecurityUtils.getCurrentUserId());
        issue = issueRepository.save(issue);

        // Giáº£i phÃ³ng tá»“n kho táº¡m giá»¯ (reservedQuantity) náº¿u há»§y phiáº¿u xuáº¥t theo nhiá»‡m vá»¥
        if (issue.getTaskId() != null) {
            List<WarehouseIssueItem> items = issueItemRepository.findByIssueId(issue.getId());
            for (WarehouseIssueItem item : items) {
                inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                        issue.getWarehouseId(), item.getMaterialId(), item.getBatchNumber())
                        .ifPresent(inventory -> {
                            BigDecimal curReserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity() : BigDecimal.ZERO;
                            BigDecimal newReserved = curReserved.subtract(item.getQuantity());
                            inventory.setReservedQuantity(newReserved.compareTo(BigDecimal.ZERO) > 0 ? newReserved : BigDecimal.ZERO);
                            inventory.setUpdatedAt(Instant.now());
                            inventory.setUpdatedBy(SecurityUtils.getCurrentUserId());
                            inventoryRepository.save(inventory);
                        });
            }
        }

        eventPublisher.publishEvent(AuditTrailEvent.builder()
                .tenantId(issue.getTenantId())
                .userId(SecurityUtils.getCurrentUserId())
                .action("CANCEL_WAREHOUSE_ISSUE")
                .module("INVENTORY")
                .endpoint("/api/v1/farms/" + farmId + "/inventory/issues/" + id + "/cancel")
                .method("POST")
                .newValue("Cancelled issue: " + issue.getIssueCode() + ", Reason: " + request.getCancellationReason())
                .build());

        // Náº¿u phiáº¿u xuáº¥t trÆ°á»›c Ä‘Ã³ cÃ³ sinh chi phÃ­ FarmExpense, há»§y bá» chi phÃ­ tÆ°Æ¡ng á»©ng vÃ  hoÃ n tráº£ ngÃ¢n sÃ¡ch (GAP-SYNC-07)
        final Long issueTenantId = issue.getTenantId();
        final Long issueId = issue.getId();
        final String issueCode = issue.getIssueCode();
        farmExpenseRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("tenantId"), issueTenantId),
                cb.equal(root.get("farmId"), farmId),
                cb.equal(root.get("referenceId"), issueId),
                cb.equal(root.get("expenseSource"), "INVENTORY_BACKFLUSH")
        )).forEach(fe -> {
            boolean wasConfirmed = "CONFIRMED".equalsIgnoreCase(fe.getStatus());
            fe.setStatus("CANCELLED");
            fe.setNotes((fe.getNotes() != null ? fe.getNotes() : "") + " [Há»¦Y THEO PHIáº¾U XUáº¤T " + issueCode + "]");
            fe.setUpdatedAt(Instant.now());
            fe.setUpdatedBy(SecurityUtils.getCurrentUserId());
            FarmExpense savedFe = farmExpenseRepository.save(fe);
            if (wasConfirmed) {
                // budget reverted
            }
        });

        notifyCreator(farmId, issue.getTenantId(), issue.getCreatedBy(), "Phiáº¿u xuáº¥t kho Ä‘Ã£ bá»‹ há»§y",
                "Phiáº¿u xuáº¥t kho [" + issue.getIssueCode() + "] Ä‘Ã£ bá»‹ há»§y. LÃ½ do: " + (request != null ? request.getCancellationReason() : ""),
                "WAREHOUSE_ISSUE", issue.getId(), "/app/inventory?tab=ISSUE&id=" + issue.getId());

        return enrichIssueDetail(issue);
    }

    // =========================================================================
    // 4. WAREHOUSE TRANSFERS (ÄIá»€U CHUYá»‚N KHO 2 BÆ¯á»šC)
    // =========================================================================

    @Override
    @Transactional
    public WarehouseTransferDetailResponse createTransfer(Long farmId, CreateWarehouseTransferRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        if (request.getFromWarehouseId().equals(request.getToWarehouseId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_WAREHOUSE_TRANSFER", "Kho xuáº¥t vÃ  kho nháº­n khÃ´ng Ä‘Æ°á»£c trÃ¹ng nhau.");
        }

        Long targetFarmId = request.getToFarmId() != null ? request.getToFarmId() : farmId;

        String code = (request.getTransferCode() != null && !request.getTransferCode().isBlank())
                ? request.getTransferCode().trim().toUpperCase()
                : generateDocCode("TRF");

        if (transferRepository.existsByTenantIdAndTransferCode(tenantId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "TRANSFER_CODE_ALREADY_EXISTS", "MÃ£ phiáº¿u Ä‘iá»u chuyá»ƒn Ä‘Ã£ tá»“n táº¡i: " + code);
        }

        Map<String, BigDecimal> toBinQtyMap = new HashMap<>();
        for (CreateWarehouseTransferRequest.TransferItemRequest itReq : request.getItems()) {
            if (StringUtils.hasText(itReq.getToBinCode())) {
                toBinQtyMap.merge(itReq.getToBinCode().trim(), itReq.getQuantity() != null ? itReq.getQuantity() : BigDecimal.ZERO, BigDecimal::add);
            }
        }
        validateLocationCapacity(request.getToWarehouseId(), targetFarmId, toBinQtyMap, "Ä‘á»ƒ Ä‘iá»u chuyá»ƒn Ä‘áº¿n");

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

        notifyFarmManager(farmId, tenantId, "Lá»‡nh Ä‘iá»u chuyá»ƒn kho má»›i",
                "Thá»§ kho vá»«a táº¡o Lá»‡nh Ä‘iá»u chuyá»ƒn kho [" + transfer.getTransferCode() + "] Ä‘ang chá» phÃª duyá»‡t.",
                "WAREHOUSE_TRANSFER", transfer.getId(), "/app/inventory?tab=TRANSFER&id=" + transfer.getId());

        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseTransferDetailResponse> getTransfers(Long farmId, Pageable pageable) {
        return getTransfers(farmId, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseTransferDetailResponse> getTransfers(Long farmId, Long branchId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        Page<WarehouseTransfer> page;
        if (farmId != null && farmId > 0) {
            page = transferRepository.findByFarmId(tenantId, farmId, pageable);
        } else if (user != null && (user.hasRole("ROLE_FARM_OWNER") || user.isSuperAdmin())) {
            page = transferRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        } else {
            Set<Long> accessible = SecurityUtils.getCurrentAccessibleFarmIds();
            if (accessible == null || accessible.isEmpty()) {
                return Page.empty(pageable);
            }
            page = transferRepository.findByFarmIds(tenantId, accessible, pageable);
        }

        Long effectiveBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();
        if (effectiveBranchId != null) {
            Set<Long> branchWhIds = ((farmId != null && farmId > 0)
                    ? warehouseRepository.findByFarmIdAndBranchId(farmId, effectiveBranchId)
                    : warehouseRepository.findAll().stream().filter(w -> effectiveBranchId.equals(w.getBranchId())).collect(Collectors.toList()))
                    .stream().map(Warehouse::getId).collect(Collectors.toSet());
            List<WarehouseTransferDetailResponse> filtered = page.getContent().stream()
                    .filter(t -> (t.getFromWarehouseId() != null && branchWhIds.contains(t.getFromWarehouseId()))
                            || (t.getToWarehouseId() != null && branchWhIds.contains(t.getToWarehouseId())))
                    .map(this::enrichTransferDetail)
                    .collect(Collectors.toList());
            return new PageImpl<>(filtered, pageable, filtered.size());
        }

        return page.map(this::enrichTransferDetail);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseTransferDetailResponse getTransferById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u Ä‘iá»u chuyá»ƒn", id));
        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional
    public WarehouseTransferDetailResponse dispatchTransfer(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u Ä‘iá»u chuyá»ƒn", id));

        if (!"DRAFT".equals(transfer.getStatus()) && !"PENDING".equals(transfer.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ xuáº¥t kho Ä‘iá»u chuyá»ƒn khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c PENDING.");
        }

        List<WarehouseTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        items.sort(Comparator.comparing(WarehouseTransferItem::getMaterialId)
                .thenComparing(WarehouseTransferItem::getFromBatchNumber));

        for (WarehouseTransferItem item : items) {
            // KhÃ³a vÃ  trá»« kho nguá»“n
            WarehouseInventory fromInv = inventoryRepository
                    .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            transfer.getFromWarehouseId(), item.getMaterialId(), item.getFromBatchNumber())
                    .orElseThrow(() -> new InsufficientStockException("KhÃ´ng tÃ¬m tháº¥y lÃ´ nguá»“n trong kho xuáº¥t: " + item.getFromBatchNumber()));

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

            // Ghi sá»• cÃ¡i TRANSFER_OUT
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
                    .notes("Xuáº¥t Ä‘iá»u chuyá»ƒn tá»›i kho #" + transfer.getToWarehouseId())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);

            // Phá»¥c há»“i sá»©c chá»©a vá»‹ trÃ­ ká»‡ táº¡i kho xuáº¥t
            restoreLocationCapacity(transfer.getFromWarehouseId(), transfer.getFromFarmId(), fromInv.getStorageBinCode(), item.getQuantity());
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

        notifyCreator(farmId, tenantId, transfer.getCreatedBy(), "Lá»‡nh Ä‘iá»u chuyá»ƒn Ä‘Ã£ xuáº¥t kho",
                "Lá»‡nh Ä‘iá»u chuyá»ƒn kho [" + transfer.getTransferCode() + "] Ä‘Ã£ xuáº¥t hÃ ng, Ä‘ang trÃªn Ä‘Æ°á»ng váº­n chuyá»ƒn.",
                "WAREHOUSE_TRANSFER", transfer.getId(), "/app/inventory?tab=TRANSFER&id=" + transfer.getId());

        return enrichTransferDetail(transfer);
    }

    @Override
    @Transactional
    public WarehouseTransferDetailResponse receiveTransfer(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        WarehouseTransfer transfer = transferRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Phiáº¿u Ä‘iá»u chuyá»ƒn", id));

        if (!"IN_TRANSIT".equals(transfer.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ nháº­p kho Ä‘iá»u chuyá»ƒn khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i IN_TRANSIT.");
        }

        List<WarehouseTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        items.sort(Comparator.comparing(WarehouseTransferItem::getMaterialId)
                .thenComparing(WarehouseTransferItem::getToBatchNumber));

        Map<String, BigDecimal> toBinQtyMap = new HashMap<>();
        for (WarehouseTransferItem item : items) {
            if (StringUtils.hasText(item.getToBinCode())) {
                toBinQtyMap.merge(item.getToBinCode().trim(), item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO, BigDecimal::add);
            }
        }
        validateLocationCapacity(transfer.getToWarehouseId(), transfer.getToFarmId(), toBinQtyMap, "Ä‘á»ƒ nháº­n chuyá»ƒn kho");

        for (WarehouseTransferItem item : items) {
            // KhÃ³a hoáº·c táº¡o má»›i táº¡i kho Ä‘Ã­ch
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

            // Ghi sá»• cÃ¡i TRANSFER_IN
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
                    .notes("Nháº­p Ä‘iá»u chuyá»ƒn tá»« kho #" + transfer.getFromWarehouseId())
                    .createdAt(Instant.now())
                    .createdBy(SecurityUtils.getCurrentUserId())
                    .build();
            transactionRepository.save(transaction);

            // Cáº­p nháº­t giáº£m sá»©c chá»©a cá»§a vá»‹ trÃ­ ká»‡ táº¡i kho Ä‘Ã­ch
            deductLocationCapacity(transfer.getToWarehouseId(), transfer.getToFarmId(), item.getToBinCode(), item.getQuantity());
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

        notifyCreator(farmId, tenantId, transfer.getCreatedBy(), "Lá»‡nh Ä‘iá»u chuyá»ƒn hoÃ n táº¥t",
                "Lá»‡nh Ä‘iá»u chuyá»ƒn kho [" + transfer.getTransferCode() + "] Ä‘Ã£ Ä‘Æ°á»£c kho nháº­n nháº­p kho thÃ nh cÃ´ng.",
                "WAREHOUSE_TRANSFER", transfer.getId(), "/app/inventory?tab=TRANSFER&id=" + transfer.getId());

        return enrichTransferDetail(transfer);
    }

    // =========================================================================
    // 5. STOCKTAKES (KIá»‚M KÃŠ KHO & CÃ‚N Báº°NG Tá»° Äá»˜NG)
    // =========================================================================

    @Override
    @Transactional
    public StocktakeDetailResponse createStocktake(Long farmId, CreateStocktakeRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        String code = (request.getStocktakeCode() != null && !request.getStocktakeCode().isBlank())
                ? request.getStocktakeCode().trim().toUpperCase()
                : generateDocCode("STK");

        if (stocktakeRepository.existsByTenantIdAndFarmIdAndStocktakeCode(tenantId, farmId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCKTAKE_CODE_ALREADY_EXISTS", "MÃ£ Ä‘á»£t kiá»ƒm kÃª Ä‘Ã£ tá»“n táº¡i: " + code);
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
        return getStocktakes(farmId, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StocktakeDetailResponse> getStocktakes(Long farmId, Long branchId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        CustomUserDetails user = SecurityUtils.getCurrentUser();
        Page<Stocktake> page;
        if (farmId != null && farmId > 0) {
            page = stocktakeRepository.findByTenantIdAndFarmIdOrderByCreatedAtDesc(tenantId, farmId, pageable);
        } else if (user != null && (user.hasRole("ROLE_FARM_OWNER") || user.isSuperAdmin())) {
            page = stocktakeRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        } else {
            Set<Long> accessible = SecurityUtils.getCurrentAccessibleFarmIds();
            if (accessible == null || accessible.isEmpty()) {
                return Page.empty(pageable);
            }
            page = stocktakeRepository.findByTenantIdAndFarmIdInOrderByCreatedAtDesc(tenantId, accessible, pageable);
        }

        Long effectiveBranchId = branchId != null ? branchId : SecurityUtils.getCurrentBranchId();
        if (effectiveBranchId != null) {
            Set<Long> branchWhIds = ((farmId != null && farmId > 0)
                    ? warehouseRepository.findByFarmIdAndBranchId(farmId, effectiveBranchId)
                    : warehouseRepository.findAll().stream().filter(w -> effectiveBranchId.equals(w.getBranchId())).collect(Collectors.toList()))
                    .stream().map(Warehouse::getId).collect(Collectors.toSet());
            List<StocktakeDetailResponse> filtered = page.getContent().stream()
                    .filter(s -> s.getWarehouseId() != null && branchWhIds.contains(s.getWarehouseId()))
                    .map(this::enrichStocktakeDetail)
                    .collect(Collectors.toList());
            return new PageImpl<>(filtered, pageable, filtered.size());
        }

        return page.map(this::enrichStocktakeDetail);
    }

    @Override
    @Transactional(readOnly = true)
    public StocktakeDetailResponse getStocktakeById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Stocktake stocktake = (farmId != null && farmId > 0)
                ? stocktakeRepository.findByFarmIdAndId(farmId, id)
                        .orElseThrow(() -> new ResourceNotFoundException("Äá»£t kiá»ƒm kÃª", id))
                : stocktakeRepository.findById(id)
                        .filter(s -> s.getTenantId().equals(tenantId))
                        .orElseThrow(() -> new ResourceNotFoundException("Äá»£t kiá»ƒm kÃª", id));
        return enrichStocktakeDetail(stocktake);
    }

    @Override
    @Transactional
    public StocktakeDetailResponse recordStocktakeCount(Long farmId, Long id, RecordStocktakeCountRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Stocktake stocktake = stocktakeRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Äá»£t kiá»ƒm kÃª", id));

        if (!"DRAFT".equals(stocktake.getStatus()) && !"IN_PROGRESS".equals(stocktake.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ ghi nháº­n kiá»ƒm Ä‘áº¿m khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i DRAFT hoáº·c IN_PROGRESS.");
        }

        // XÃ³a cÃ¡c chi tiáº¿t cÅ© náº¿u ghi nháº­n láº¡i
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

        notifyFarmManager(farmId, tenantId, "Kiá»ƒm Ä‘áº¿m thá»±c táº¿ kho",
                "Thá»§ kho vá»«a cáº­p nháº­t sá»‘ liá»‡u kiá»ƒm Ä‘áº¿m thá»±c táº¿ cho Phiáº¿u kiá»ƒm kÃª [" + stocktake.getStocktakeCode() + "].",
                "STOCKTAKE", stocktake.getId(), "/app/inventory?tab=STOCKTAKE&id=" + stocktake.getId());

        return enrichStocktakeDetail(stocktake);
    }

    @Override
    @Transactional
    public StocktakeDetailResponse adjustStocktake(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Stocktake stocktake = stocktakeRepository.findByFarmIdAndId(farmId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Äá»£t kiá»ƒm kÃª", id));

        if (!"IN_PROGRESS".equals(stocktake.getStatus()) && !"DRAFT".equals(stocktake.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS_TRANSITION",
                    "Chá»‰ cÃ³ thá»ƒ chá»‘t cÃ¢n báº±ng kiá»ƒm kÃª khi Ä‘ang á»Ÿ tráº¡ng thÃ¡i IN_PROGRESS hoáº·c DRAFT.");
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
                // Thá»«a kiá»ƒm kÃª -> STOCKTAKE_ADJUST_IN
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
                        .notes("CÃ¢n báº±ng thá»«a kiá»ƒm kÃª " + stocktake.getStocktakeCode())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                transactionRepository.save(transaction);
            } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                // Thiáº¿u kiá»ƒm kÃª -> STOCKTAKE_ADJUST_OUT
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
                        .notes("CÃ¢n báº±ng thiáº¿u kiá»ƒm kÃª " + stocktake.getStocktakeCode())
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

        notifyCreator(farmId, tenantId, stocktake.getCreatedBy(), "Kiá»ƒm kÃª kho Ä‘Ã£ chá»‘t cÃ¢n báº±ng",
                "Äá»£t kiá»ƒm kÃª kho [" + stocktake.getStocktakeCode() + "] Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t vÃ  hoÃ n táº¥t cÃ¢n báº±ng tá»“n kho.",
                "STOCKTAKE", stocktake.getId(), "/app/inventory?tab=STOCKTAKE&id=" + stocktake.getId());

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

        boolean canViewPrice = SecurityUtils.canViewFinancialPrice();

        String categoryCode = null;
        String categoryName = null;
        String packUnit = material != null ? material.getStandardUnit() : null;
        String baseUnit = material != null ? material.getStandardUnit() : null;
        BigDecimal conversionFactor = BigDecimal.ONE;

        if (material != null) {
            MaterialCategory cat = materialCategoryRepository.findById(material.getCategoryId()).orElse(null);
            if (cat != null) {
                categoryCode = cat.getCode();
                categoryName = cat.getName();
            }
            List<MaterialUnitConversion> conversions = materialUnitConversionRepository.findByMaterialId(material.getId());
            Optional<MaterialUnitConversion> purchaseConv = conversions.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsPurchaseUnit()) && c.getConversionFactor() != null && c.getConversionFactor().compareTo(BigDecimal.ZERO) > 0)
                    .findFirst();
            if (purchaseConv.isPresent()) {
                packUnit = purchaseConv.get().getUnitName();
                conversionFactor = purchaseConv.get().getConversionFactor();
            } else if (!conversions.isEmpty() && conversions.get(0).getConversionFactor() != null && conversions.get(0).getConversionFactor().compareTo(BigDecimal.ZERO) > 0) {
                packUnit = conversions.get(0).getUnitName();
                conversionFactor = conversions.get(0).getConversionFactor();
            }
        }

        return InventoryItemResponse.builder()
                .id(inv.getId())
                .warehouseId(inv.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "Kho #" + inv.getWarehouseId())
                .materialId(inv.getMaterialId())
                .skuCode(material != null ? material.getSkuCode() : null)
                .materialName(material != null ? material.getName() : null)
                .materialCategoryCode(categoryCode)
                .materialCategoryName(categoryName)
                .standardUnit(material != null ? material.getStandardUnit() : null)
                .packUnit(packUnit)
                .baseUnit(baseUnit)
                .conversionFactor(conversionFactor)
                .minStockLevel(material != null ? material.getMinStockLevel() : null)
                .defaultPhiDays(material != null ? material.getDefaultPhiDays() : 0)
                .batchNumber(inv.getBatchNumber())
                .manufactureDate(inv.getManufactureDate())
                .inwardDate(inv.getInwardDate())
                .expiryDate(inv.getExpiryDate())
                .unitCost(canViewPrice ? inv.getUnitCost() : null)
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
        boolean canViewPrice = SecurityUtils.canViewFinancialPrice();
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
                    .unitPrice(canViewPrice ? it.getUnitPrice() : null)
                    .totalPrice(canViewPrice ? it.getTotalPrice() : null)
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
                .totalAmount(canViewPrice ? r.getTotalAmount() : null)
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

        String taskTitle = null;
        if (i.getTaskId() != null) {
            taskTitle = "Nhiệm vụ #" + i.getTaskId();
        }

        List<WarehouseIssueDetailResponse.IssueItemDto> itemDtos = items.stream().map(it -> {
            Material material = materialRepository.findById(it.getMaterialId()).orElse(null);
            WarehouseInventory inv = inventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumber(
                    i.getWarehouseId(), it.getMaterialId(), it.getBatchNumber()).orElse(null);

            String storageBinCode = inv != null ? inv.getStorageBinCode() : null;
            LocalDate expiryDate = inv != null ? inv.getExpiryDate() : null;
            BigDecimal available = inv != null ? inv.getQuantityOnHand().subtract(inv.getReservedQuantity() != null ? inv.getReservedQuantity() : BigDecimal.ZERO) : BigDecimal.ZERO;

            return WarehouseIssueDetailResponse.IssueItemDto.builder()
                    .id(it.getId())
                    .materialId(it.getMaterialId())
                    .skuCode(material != null ? material.getSkuCode() : null)
                    .materialName(material != null ? material.getName() : null)
                    .standardUnit(material != null ? material.getStandardUnit() : null)
                    .batchNumber(it.getBatchNumber())
                    .storageBinCode(storageBinCode)
                    .expiryDate(expiryDate)
                    .availableQuantity(available)
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
                .taskId(i.getTaskId())
                .taskTitle(taskTitle)
                .receiverName(i.getReceiverName())
                .seasonId(i.getSeasonId())
                .livestockGroupId(i.getLivestockGroupId())
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
