package com.farm.saas.modules.purchase.service.impl;

import com.farm.saas.common.exception.ApiException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.entity.DebtRecord;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.DebtRecordRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.geography.entity.Branch;
import com.farm.saas.modules.geography.entity.ProductionZone;
import com.farm.saas.modules.geography.entity.ZoneLocation;
import com.farm.saas.modules.geography.repository.BranchRepository;
import com.farm.saas.modules.geography.repository.ProductionZoneRepository;
import com.farm.saas.modules.geography.repository.ZoneLocationRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import com.farm.saas.modules.masterdata.repository.LivestockBreedRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.MaterialUnitConversionRepository;
import com.farm.saas.modules.purchase.dto.request.CreatePurchaseInvoiceRequest;
import com.farm.saas.modules.purchase.dto.request.PayDebtRequest;
import com.farm.saas.modules.purchase.dto.response.PurchaseInvoiceDetailResponse;
import com.farm.saas.modules.purchase.entity.PurchaseInvoice;
import com.farm.saas.modules.purchase.entity.PurchaseInvoiceItem;
import com.farm.saas.modules.purchase.repository.PurchaseInvoiceRepository;
import com.farm.saas.modules.purchase.service.PurchaseInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseInvoiceServiceImpl implements PurchaseInvoiceService {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseInventoryTransactionRepository inventoryTransactionRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final ZoneLocationRepository zoneLocationRepository;
    private final ProductionZoneRepository productionZoneRepository;
    private final BranchRepository branchRepository;
    private final LivestockBreedRepository livestockBreedRepository;
    private final MaterialRepository materialRepository;
    private final MaterialUnitConversionRepository materialUnitConversionRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseInvoiceDetailResponse> getInvoices(Long farmId, Long branchId, Long supplierId, String invoiceType, String paymentStatus, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        String type = (StringUtils.hasText(invoiceType) && !"ALL".equalsIgnoreCase(invoiceType)) ? invoiceType.trim() : null;
        String status = (StringUtils.hasText(paymentStatus) && !"ALL".equalsIgnoreCase(paymentStatus)) ? paymentStatus.trim() : null;
        return purchaseInvoiceRepository.findFiltered(tenantId, farmId, branchId, supplierId, type, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseInvoiceDetailResponse getInvoiceById(Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        PurchaseInvoice invoice = purchaseInvoiceRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn nhập hàng", id));
        return mapToResponse(invoice);
    }

    @Override
    @Transactional
    public PurchaseInvoiceDetailResponse createInvoice(Long farmId, CreatePurchaseInvoiceRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;

        String invCode = StringUtils.hasText(request.getInvoiceNumber())
                ? request.getInvoiceNumber().trim().toUpperCase()
                : "PN-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        BigDecimal goodsTotal = BigDecimal.ZERO;
        if (request.getItems() != null) {
            for (CreatePurchaseInvoiceRequest.ItemRequest itemReq : request.getItems()) {
                BigDecimal qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ZERO;
                BigDecimal price = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
                goodsTotal = goodsTotal.add(qty.multiply(price));
            }
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalPayment = goodsTotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal debt = finalPayment.subtract(paid).max(BigDecimal.ZERO);

        String paymentStatus = "PAID";
        if (debt.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = paid.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "UNPAID";
        }

        String creator = SecurityUtils.getCurrentUser() != null && StringUtils.hasText(SecurityUtils.getCurrentUser().getUsername())
                ? SecurityUtils.getCurrentUser().getUsername() : "Người dùng hệ thống";

        PurchaseInvoice invoice = PurchaseInvoice.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .branchId(request.getBranchId())
                .invoiceNumber(invCode)
                .invoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now())
                .supplierId(request.getSupplierId())
                .supplierName(request.getSupplierName())
                .invoiceType(request.getInvoiceType())
                .destinationType(request.getDestinationType())
                .destinationName(request.getDestinationName())
                .warehouseId(request.getWarehouseId())
                .barnId(request.getBarnId())
                .batchId(request.getBatchId())
                .totalGoodsAmount(goodsTotal)
                .discountAmount(discount)
                .totalPaymentAmount(finalPayment)
                .paidAmount(paid)
                .remainingDebt(debt)
                .paymentStatus(paymentStatus)
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "BANK_TRANSFER")
                .creatorName(creator)
                .approverName("Kế toán kho")
                .notes(request.getNotes())
                .createdBy(SecurityUtils.getCurrentUserId())
                .createdAt(Instant.now())
                .build();

        List<PurchaseInvoiceItem> items = new ArrayList<>();
        List<CreatePurchaseInvoiceRequest.ItemRequest> itemReqs = request.getItems() != null ? request.getItems() : List.of();
        for (int idx = 0; idx < itemReqs.size(); idx++) {
            CreatePurchaseInvoiceRequest.ItemRequest itemReq = itemReqs.get(idx);
            BigDecimal qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ZERO;
            BigDecimal price = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = qty.multiply(price);

            String defaultLot = String.format("LOT-%s-%02d",
                    LocalDate.now().toString().replace("-", ""),
                    idx + 1);

            PurchaseInvoiceItem item = PurchaseInvoiceItem.builder()
                    .invoice(invoice)
                    .materialId(itemReq.getMaterialId())
                    .itemName(itemReq.getItemName())
                    .unit(itemReq.getUnit())
                    .quantity(qty)
                    .lotCode(StringUtils.hasText(itemReq.getLotCode()) ? itemReq.getLotCode().trim() : defaultLot)
                    .expiryDate(itemReq.getExpiryDate() != null ? itemReq.getExpiryDate() : LocalDate.now().plusMonths(6))
                    .unitPrice(price)
                    .amount(lineTotal)
                    .build();
            items.add(item);
        }

        invoice.setItems(items);
        invoice = purchaseInvoiceRepository.save(invoice);

        // 1. Nếu là nhập Cám/Thuốc/Vật tư vào Kho -> Quy đổi đơn vị gốc & Cộng tồn kho FEFO
        if ("WAREHOUSE".equalsIgnoreCase(invoice.getDestinationType()) && invoice.getWarehouseId() != null) {
            for (int idx = 0; idx < items.size(); idx++) {
                PurchaseInvoiceItem item = items.get(idx);
                CreatePurchaseInvoiceRequest.ItemRequest itemReq = idx < itemReqs.size() ? itemReqs.get(idx) : null;

                if (item.getMaterialId() == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_MATERIAL_ID",
                            "Vui lòng chọn mặt hàng từ danh mục cho dòng: " + (item.getItemName() != null ? item.getItemName() : ("#" + (idx + 1))));
                }
                Long matId = item.getMaterialId();
                Material material = materialRepository.findById(matId).orElse(null);

                // Xác định hệ số quy đổi (conversion_rate) sang đơn vị gốc (Kg / Ml / ...)
                BigDecimal conversionFactor = BigDecimal.ONE;
                if (itemReq != null && itemReq.getConversionRate() != null && itemReq.getConversionRate().compareTo(BigDecimal.ZERO) > 0) {
                    conversionFactor = itemReq.getConversionRate();
                } else if (material != null && StringUtils.hasText(item.getUnit())) {
                    String itemUnit = item.getUnit().trim();
                    String stdUnit = material.getStandardUnit() != null ? material.getStandardUnit().trim() : "";
                    if (!itemUnit.equalsIgnoreCase(stdUnit)) {
                        List<MaterialUnitConversion> conversions = materialUnitConversionRepository.findByMaterialId(matId);
                        Optional<MaterialUnitConversion> matched = conversions.stream()
                                .filter(c -> c.getUnitName() != null && c.getUnitName().trim().equalsIgnoreCase(itemUnit))
                                .findFirst();
                        if (matched.isPresent() && matched.get().getConversionFactor() != null
                                && matched.get().getConversionFactor().compareTo(BigDecimal.ZERO) > 0) {
                            conversionFactor = matched.get().getConversionFactor();
                        }
                    }
                }

                BigDecimal baseQuantity = item.getQuantity().multiply(conversionFactor).setScale(2, RoundingMode.HALF_UP);
                BigDecimal baseUnitCost = conversionFactor.compareTo(BigDecimal.ZERO) > 0
                        ? item.getUnitPrice().divide(conversionFactor, 2, RoundingMode.HALF_UP)
                        : item.getUnitPrice();

                Optional<WarehouseInventory> invOpt = warehouseInventoryRepository
                        .findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                                invoice.getWarehouseId(), matId, item.getLotCode());

                WarehouseInventory inventory;
                BigDecimal balanceBefore;
                BigDecimal balanceAfter;
                if (invOpt.isPresent()) {
                    inventory = invOpt.get();
                    balanceBefore = inventory.getQuantityOnHand() != null ? inventory.getQuantityOnHand() : BigDecimal.ZERO;
                    balanceAfter = balanceBefore.add(baseQuantity);
                    inventory.setQuantityOnHand(balanceAfter);
                    if (baseUnitCost.compareTo(BigDecimal.ZERO) > 0) {
                        inventory.setUnitCost(baseUnitCost);
                    }
                    if (item.getExpiryDate() != null) {
                        inventory.setExpiryDate(item.getExpiryDate());
                    }
                    inventory.setUpdatedAt(Instant.now());
                    inventory.setUpdatedBy(SecurityUtils.getCurrentUserId());
                } else {
                    balanceBefore = BigDecimal.ZERO;
                    balanceAfter = baseQuantity;
                    inventory = WarehouseInventory.builder()
                            .tenantId(tenantId)
                            .farmId(targetFarmId)
                            .warehouseId(invoice.getWarehouseId())
                            .materialId(matId)
                            .batchNumber(item.getLotCode())
                            .quantityOnHand(balanceAfter)
                            .reservedQuantity(BigDecimal.ZERO)
                            .unitCost(baseUnitCost)
                            .inwardDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate() : LocalDate.now())
                            .expiryDate(item.getExpiryDate())
                            .manufactureDate(invoice.getInvoiceDate())
                            .storageBinCode("BIN-MAIN")
                            .createdAt(Instant.now())
                            .createdBy(SecurityUtils.getCurrentUserId())
                            .build();
                }
                warehouseInventoryRepository.save(inventory);

                // Ghi nhận thẻ kho (giao dịch nhập kho)
                WarehouseInventoryTransaction tx = WarehouseInventoryTransaction.builder()
                        .tenantId(tenantId)
                        .farmId(targetFarmId)
                        .warehouseId(invoice.getWarehouseId())
                        .materialId(matId)
                        .batchNumber(item.getLotCode())
                        .transactionType("PURCHASE_RECEIPT")
                        .direction("IN")
                        .quantity(baseQuantity)
                        .unitPrice(baseUnitCost)
                        .totalAmount(item.getAmount())
                        .balanceBefore(balanceBefore)
                        .balanceAfter(balanceAfter)
                        .transactionDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate() : LocalDate.now())
                        .referenceDocType("PURCHASE_INVOICE")
                        .referenceDocId(invoice.getId())
                        .referenceItemId(item.getId())
                        .notes("Nhập kho theo hóa đơn #" + invoice.getInvoiceNumber()
                                + (conversionFactor.compareTo(BigDecimal.ONE) != 0
                                ? String.format(" (%s %s x %s)", item.getQuantity(), item.getUnit(), conversionFactor)
                                : ""))
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                inventoryTransactionRepository.save(tx);
            }
        }

        // 2. Nếu là nhập Con giống -> Đẩy thẳng số lượng đầu con và giá vốn vào Chuồng/Lứa nuôi (tự động mở lứa mới nếu Chuồng Trống)
        if ("BREED".equalsIgnoreCase(invoice.getInvoiceType()) && invoice.getBarnId() != null) {
            ZoneLocation barn = zoneLocationRepository.findById(invoice.getBarnId()).orElse(null);
            BigDecimal totalHeads = items.stream().map(PurchaseInvoiceItem::getQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalWeight = itemReqs.stream()
                    .map(r -> r.getTotalWeightKg() != null ? r.getTotalWeightKg() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LivestockGroup targetGroup = null;
            if (invoice.getBatchId() != null) {
                targetGroup = livestockGroupRepository.findById(invoice.getBatchId()).orElse(null);
            } else if (barn != null) {
                List<LivestockGroup> activeGroups = livestockGroupRepository.findByLocationIdAndStatus(barn.getId(), "ACTIVE");
                if (!activeGroups.isEmpty()) {
                    targetGroup = activeGroups.get(0);
                }
            }

            if (targetGroup != null) {
                int currentQty = targetGroup.getCurrentQuantity() != null ? targetGroup.getCurrentQuantity() : 0;
                BigDecimal currentCost = targetGroup.getTotalCost() != null ? targetGroup.getTotalCost() : BigDecimal.ZERO;
                targetGroup.setCurrentQuantity(currentQty + totalHeads.intValue());
                targetGroup.setTotalCost(currentCost.add(invoice.getTotalPaymentAmount()));
                livestockGroupRepository.save(targetGroup);
                if (invoice.getBatchId() == null) {
                    invoice.setBatchId(targetGroup.getId());
                    purchaseInvoiceRepository.save(invoice);
                }
            } else if (barn != null) {
                // Chuồng trống -> Tự động mở lứa nuôi mới
                ProductionZone zone = barn.getZoneId() != null ? productionZoneRepository.findById(barn.getZoneId()).orElse(null) : null;
                Long resolvedBranchId = invoice.getBranchId() != null ? invoice.getBranchId() : (zone != null ? zone.getBranchId() : null);

                Long resolvedBreedId = request.getBreedId();
                if (resolvedBreedId == null) {
                    List<LivestockBreed> breeds = livestockBreedRepository.findByTenantId(tenantId);
                    if (breeds.isEmpty()) {
                        breeds = livestockBreedRepository.findAll();
                    }
                    String branchType = "";
                    if (resolvedBranchId != null) {
                        Branch br = branchRepository.findById(resolvedBranchId).orElse(null);
                        if (br != null) {
                            branchType = ((br.getLivestockType() != null ? br.getLivestockType() : "") + " " + (br.getName() != null ? br.getName() : "")).toUpperCase();
                        }
                    }
                    final boolean isSwineBranch = branchType.contains("SWINE") || branchType.contains("PIG") || branchType.contains("HEO") || branchType.contains("LIVESTOCK");
                    final boolean isPoultryBranch = branchType.contains("POULTRY") || branchType.contains("CHICKEN") || branchType.contains("GÀ");
                    resolvedBreedId = breeds.stream()
                            .filter(b -> {
                                String sp = (b.getSpecies() != null ? b.getSpecies() : "").toUpperCase();
                                if (isSwineBranch) return sp.contains("SWINE") || sp.contains("PIG");
                                if (isPoultryBranch) return sp.contains("POULTRY") || sp.contains("CHICKEN") || sp.contains("DUCK");
                                return true;
                            })
                            .map(LivestockBreed::getId)
                            .findFirst()
                            .orElse(breeds.isEmpty() ? 1L : breeds.get(0).getId());
                }

                BigDecimal avgWeight = (totalHeads.compareTo(BigDecimal.ZERO) > 0 && totalWeight.compareTo(BigDecimal.ZERO) > 0)
                        ? totalWeight.divide(totalHeads, 3, RoundingMode.HALF_UP)
                        : BigDecimal.valueOf(0.045);
                BigDecimal unitPricePerHead = totalHeads.compareTo(BigDecimal.ZERO) > 0
                        ? invoice.getTotalPaymentAmount().divide(totalHeads, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                String newBatchCode = "LUA-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                LivestockGroup newGroup = LivestockGroup.builder()
                        .tenantId(tenantId)
                        .farmId(targetFarmId)
                        .branchId(resolvedBranchId)
                        .zoneId(barn.getZoneId())
                        .locationId(barn.getId())
                        .breedId(resolvedBreedId)
                        .partnerId(invoice.getSupplierId())
                        .groupCode(newBatchCode)
                        .initialQuantity(totalHeads.intValue())
                        .currentQuantity(totalHeads.intValue())
                        .unitPrice(unitPricePerHead)
                        .totalCost(invoice.getTotalPaymentAmount())
                        .avgInitialWeightKg(avgWeight)
                        .entryDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate() : LocalDate.now())
                        .status("ACTIVE")
                        .managementType("GROUP")
                        .notes("Tự động mở lứa từ hóa đơn nhập giống #" + invoice.getInvoiceNumber())
                        .createdAt(Instant.now())
                        .createdBy(SecurityUtils.getCurrentUserId())
                        .build();
                newGroup = livestockGroupRepository.save(newGroup);
                invoice.setBatchId(newGroup.getId());
                purchaseInvoiceRepository.save(invoice);
            }

            if (barn != null) {
                barn.setStatus("ACTIVE");
                barn.setUpdatedAt(Instant.now());
                zoneLocationRepository.save(barn);
            }
        }

        // 3. Xử lý dòng tiền thanh toán
        // Nếu đã thanh toán ngay > 0 -> tự động sinh Phiếu Chi trên Sổ quỹ
        if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            String category = "BREED".equalsIgnoreCase(invoice.getInvoiceType()) ? "Chi nhập con giống" : "Chi nhập cám thức ăn";
            FarmExpense expense = FarmExpense.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .costCategoryId(1L)
                    .expenseCode("PC-INV-" + invoice.getId())
                    .expenseSource("PURCHASE_INVOICE")
                    .referenceId(invoice.getId())
                    .expenseDate(invoice.getInvoiceDate())
                    .amount(invoice.getPaidAmount())
                    .unitCostEligible(true)
                    .paymentMethod(invoice.getPaymentMethod())
                    .recipientName(invoice.getSupplierName())
                    .notes("Chi trả hóa đơn nhập hàng #" + invoice.getInvoiceNumber() + " cho " + invoice.getSupplierName())
                    .status("CONFIRMED")
                    .build();
            farmExpenseRepository.save(expense);
        }

        // Nếu còn thiếu nợ (mua gối đầu) -> tự động sinh Công nợ phải trả NCC
        if (invoice.getRemainingDebt().compareTo(BigDecimal.ZERO) > 0 && invoice.getSupplierId() != null) {
            DebtRecord debtRecord = DebtRecord.builder()
                    .tenantId(tenantId)
                    .farmId(targetFarmId)
                    .partnerId(invoice.getSupplierId())
                    .debtType("PAYABLE")
                    .totalDebt(invoice.getTotalPaymentAmount())
                    .paidAmount(invoice.getPaidAmount())
                    .remainingDebt(invoice.getRemainingDebt())
                    .dueDate(invoice.getInvoiceDate().plusDays(30))
                    .notes("Công nợ mua gối đầu từ hóa đơn nhập hàng #" + invoice.getInvoiceNumber())
                    .status("ACTIVE")
                    .build();
            debtRecordRepository.save(debtRecord);
        }

        return mapToResponse(invoice);
    }

    @Override
    @Transactional
    public PurchaseInvoiceDetailResponse payDebt(Long id, PayDebtRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        PurchaseInvoice invoice = purchaseInvoiceRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Hóa đơn nhập hàng", id));

        BigDecimal payAmount = request.getAmount();
        BigDecimal newPaid = invoice.getPaidAmount().add(payAmount);
        invoice.setPaidAmount(newPaid);
        BigDecimal newRemaining = invoice.getTotalPaymentAmount().subtract(newPaid);

        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setRemainingDebt(BigDecimal.ZERO);
            invoice.setPaymentStatus("PAID");
        } else {
            invoice.setRemainingDebt(newRemaining);
            invoice.setPaymentStatus("PARTIAL");
        }

        invoice = purchaseInvoiceRepository.save(invoice);

        // Sinh Phiếu Chi trên Sổ quỹ
        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(invoice.getFarmId())
                .costCategoryId(1L)
                .expenseCode("PC-PAY-" + invoice.getId() + "-" + System.currentTimeMillis() % 10000)
                .expenseSource("DEBT_PAYMENT")
                .referenceId(invoice.getId())
                .expenseDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .amount(payAmount)
                .unitCostEligible(false)
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "BANK_TRANSFER")
                .recipientName(invoice.getSupplierName())
                .notes("Chi trả nợ NCC gối đầu cho hóa đơn #" + invoice.getInvoiceNumber() + ". " + (request.getNotes() != null ? request.getNotes() : ""))
                .status("CONFIRMED")
                .build();
        farmExpenseRepository.save(expense);

        return mapToResponse(invoice);
    }

    private PurchaseInvoiceDetailResponse mapToResponse(PurchaseInvoice invoice) {
        List<PurchaseInvoiceDetailResponse.ItemResponse> itemResponses = invoice.getItems().stream()
                .map(it -> PurchaseInvoiceDetailResponse.ItemResponse.builder()
                        .id(it.getId())
                        .materialId(it.getMaterialId())
                        .name(it.getItemName())
                        .unit(it.getUnit())
                        .quantity(it.getQuantity())
                        .lotCode(it.getLotCode())
                        .expiryDate(it.getExpiryDate())
                        .unitPrice(it.getUnitPrice())
                        .amount(it.getAmount())
                        .build())
                .collect(Collectors.toList());

        return PurchaseInvoiceDetailResponse.builder()
                .id(invoice.getId())
                .farmId(invoice.getFarmId())
                .branchId(invoice.getBranchId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .supplierId(invoice.getSupplierId())
                .supplierName(invoice.getSupplierName())
                .invoiceType(invoice.getInvoiceType())
                .destinationType(invoice.getDestinationType())
                .destinationName(invoice.getDestinationName())
                .warehouseId(invoice.getWarehouseId())
                .barnId(invoice.getBarnId())
                .batchId(invoice.getBatchId())
                .totalGoodsAmount(invoice.getTotalGoodsAmount())
                .discountAmount(invoice.getDiscountAmount())
                .totalPaymentAmount(invoice.getTotalPaymentAmount())
                .paidAmount(invoice.getPaidAmount())
                .remainingDebt(invoice.getRemainingDebt())
                .paymentStatus(invoice.getPaymentStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .creatorName(invoice.getCreatorName())
                .approverName(invoice.getApproverName())
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
