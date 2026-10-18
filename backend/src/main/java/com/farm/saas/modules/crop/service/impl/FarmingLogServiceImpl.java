package com.farm.saas.modules.crop.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.exception.InsufficientStockException;
import com.farm.saas.common.exception.ResourceNotFoundException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.crop.dto.request.CreateFarmingLogRequest;
import com.farm.saas.modules.crop.dto.response.FarmingLogDetailResponse;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.entity.FarmingLog;
import com.farm.saas.modules.crop.entity.FarmingLogSupply;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.crop.repository.FarmingLogRepository;
import com.farm.saas.modules.crop.repository.FarmingLogSupplyRepository;
import com.farm.saas.modules.crop.service.FarmingLogService;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.inventory.entity.WarehouseInventory;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import com.farm.saas.modules.inventory.entity.WarehouseIssue;
import com.farm.saas.modules.inventory.entity.WarehouseIssueItem;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryRepository;
import com.farm.saas.modules.inventory.repository.WarehouseInventoryTransactionRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueItemRepository;
import com.farm.saas.modules.inventory.repository.WarehouseIssueRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.entity.Material;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.masterdata.repository.MaterialRepository;
import com.farm.saas.modules.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmingLogServiceImpl implements FarmingLogService {

    private final FarmingLogRepository farmingLogRepository;
    private final FarmingLogSupplyRepository farmingLogSupplyRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final MaterialRepository materialRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;
    private final WarehouseIssueItemRepository warehouseIssueItemRepository;
    private final WarehouseInventoryTransactionRepository warehouseInventoryTransactionRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<FarmingLogDetailResponse> getFarmingLogs(Long farmId, Long seasonId, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        Specification<FarmingLog> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates = cb.and(predicates, cb.equal(root.get("farmId"), farmId));
            predicates = cb.and(predicates, cb.equal(root.get("tenantId"), tenantId));

            if (seasonId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("seasonId"), seasonId));
            }
            if (fromDate != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("logDate"), fromDate));
            }
            if (toDate != null) {
                predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("logDate"), toDate));
            }
            return predicates;
        };

        return farmingLogRepository.findAll(spec, pageable).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmingLogDetailResponse getFarmingLogById(Long farmId, Long id) {
        FarmingLog logEntry = findFarmingLogOrThrow(farmId, id);
        return mapToDetailResponse(logEntry);
    }

    @Override
    @Transactional
    public FarmingLogDetailResponse createFarmingLog(Long farmId, CreateFarmingLogRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Check season status
        CropSeason season = cropSeasonRepository.findByFarmIdAndId(farmId, request.getSeasonId())
                .filter(s -> tenantId == null || tenantId.equals(s.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("CropSeason", request.getSeasonId()));

        if ("CLOSED".equals(season.getStatus()) || "CANCELLED".equals(season.getStatus())) {
            throw new BusinessException("SEASON_CLOSED", "Không thể ghi nhật ký cho vụ mùa đã kết thúc: " + season.getStatus());
        }

        // 2. Determine PHI days
        int maxPhiDays = request.getPhiDays() != null ? request.getPhiDays() : 0;
        if (request.getSupplies() != null && !request.getSupplies().isEmpty()) {
            for (var supply : request.getSupplies()) {
                Material mat = materialRepository.findById(supply.getMaterialId()).orElse(null);
                if (mat != null && mat.getDefaultPhiDays() != null && mat.getDefaultPhiDays() > maxPhiDays) {
                    maxPhiDays = mat.getDefaultPhiDays();
                }
            }
        }

        LocalDate phiEndDate = maxPhiDays > 0 ? request.getLogDate().plusDays(maxPhiDays) : null;

        String imageUrlsJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize imageUrls", e);
            }
        }

        FarmingLog farmingLog = FarmingLog.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .seasonId(season.getId())
                .logDate(request.getLogDate())
                .stage(request.getStage())
                .activityType(request.getActivityType())
                .phiDays(maxPhiDays)
                .phiEndDate(phiEndDate)
                .weatherNotes(request.getWeatherNotes())
                .performedByUserId(request.getPerformedByUserId() != null ? request.getPerformedByUserId() : currentUserId)
                .imageUrlsJson(imageUrlsJson)
                .isInventoryBackflushed(false)
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .build();

        farmingLog = farmingLogRepository.save(farmingLog);

        // 3. Auto-Backflushing Flow 3
        if (request.getSupplies() != null && !request.getSupplies().isEmpty()) {
            // Group supplies by warehouse_id
            Map<Long, List<CreateFarmingLogRequest.FarmingSupplyRequest>> byWarehouse = request.getSupplies().stream()
                    .collect(Collectors.groupingBy(CreateFarmingLogRequest.FarmingSupplyRequest::getWarehouseId));

            List<Map<String, Object>> snapshotList = new ArrayList<>();

            for (Map.Entry<Long, List<CreateFarmingLogRequest.FarmingSupplyRequest>> entry : byWarehouse.entrySet()) {
                Long warehouseId = entry.getKey();
                List<CreateFarmingLogRequest.FarmingSupplyRequest> supplyList = entry.getValue();

                // Sort supplies deterministically to avoid deadlocks: (warehouseId, materialId, batchNumber)
                supplyList.sort(Comparator.comparing(CreateFarmingLogRequest.FarmingSupplyRequest::getMaterialId)
                        .thenComparing(CreateFarmingLogRequest.FarmingSupplyRequest::getBatchNumber));

                // Create WarehouseIssue
                String issueCode = "ISS-BF-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                WarehouseIssue issue = WarehouseIssue.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .warehouseId(warehouseId)
                        .issueCode(issueCode)
                        .issueType("PRODUCTION_BACKFLUSH")
                        .farmingLogId(farmingLog.getId())
                        .seasonId(season.getId())
                        .isBackflushed(true)
                        .issueDate(request.getLogDate())
                        .totalAmount(BigDecimal.ZERO)
                        .status("COMPLETED")
                        .approvedBy(currentUserId)
                        .approvedAt(Instant.now())
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                issue = warehouseIssueRepository.save(issue);
                BigDecimal totalIssueAmount = BigDecimal.ZERO;

                for (var sReq : supplyList) {
                    // Lock inventory row PESSIMISTIC_WRITE
                    WarehouseInventory inv = warehouseInventoryRepository.findByWarehouseIdAndMaterialIdAndBatchNumberForUpdate(
                            warehouseId, sReq.getMaterialId(), sReq.getBatchNumber())
                            .orElseThrow(() -> new InsufficientStockException(
                                    "Vật tư #" + sReq.getMaterialId() + " lô " + sReq.getBatchNumber() + " không có tồn kho trong kho #" + warehouseId));

                    BigDecimal available = inv.getQuantityOnHand().subtract(inv.getReservedQuantity());
                    if (available.compareTo(sReq.getActualQuantity()) < 0) {
                        throw new InsufficientStockException(
                                "Không đủ tồn kho khả dụng cho vật tư #" + sReq.getMaterialId() + " lô " + sReq.getBatchNumber() + ". Cần: " + sReq.getActualQuantity() + ", Khả dụng: " + available);
                    }

                    BigDecimal unitPrice = inv.getUnitCost() != null ? inv.getUnitCost() : BigDecimal.ZERO;
                    BigDecimal lineTotal = sReq.getActualQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
                    totalIssueAmount = totalIssueAmount.add(lineTotal);

                    // Deduct stock
                    BigDecimal balanceBefore = inv.getQuantityOnHand();
                    BigDecimal balanceAfter = balanceBefore.subtract(sReq.getActualQuantity());
                    inv.setQuantityOnHand(balanceAfter);
                    warehouseInventoryRepository.save(inv);

                    // Create issue item
                    WarehouseIssueItem issueItem = WarehouseIssueItem.builder()
                            .issueId(issue.getId())
                            .tenantId(tenantId)
                            .materialId(sReq.getMaterialId())
                            .batchNumber(sReq.getBatchNumber())
                            .enteredUnit(sReq.getUnit())
                            .enteredQuantity(sReq.getActualQuantity())
                            .conversionFactor(BigDecimal.ONE)
                            .quantity(sReq.getActualQuantity())
                            .unitPrice(unitPrice)
                            .totalPrice(lineTotal)
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    issueItem = warehouseIssueItemRepository.save(issueItem);

                    // Append-only ledger transaction
                    WarehouseInventoryTransaction trans = WarehouseInventoryTransaction.builder()
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .warehouseId(warehouseId)
                            .materialId(sReq.getMaterialId())
                            .batchNumber(sReq.getBatchNumber())
                            .transactionType("OUTWARD")
                            .referenceDocType("WAREHOUSE_ISSUE")
                            .referenceDocId(issue.getId())
                            .referenceItemId(issueItem.getId())
                            .direction("OUT")
                            .quantity(sReq.getActualQuantity())
                            .unitPrice(unitPrice)
                            .totalAmount(lineTotal)
                            .balanceBefore(balanceBefore)
                            .balanceAfter(balanceAfter)
                            .transactionDate(request.getLogDate())
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    warehouseInventoryTransactionRepository.save(trans);

                    // Save FarmingLogSupply
                    FarmingLogSupply supplyEntity = FarmingLogSupply.builder()
                            .farmingLogId(farmingLog.getId())
                            .tenantId(tenantId)
                            .farmId(farmId)
                            .materialId(sReq.getMaterialId())
                            .warehouseId(warehouseId)
                            .batchNumber(sReq.getBatchNumber())
                            .actualQuantity(sReq.getActualQuantity())
                            .unit(sReq.getUnit())
                            .unitPrice(unitPrice)
                            .totalPrice(lineTotal)
                            .warehouseIssueItemId(issueItem.getId())
                            .notes(sReq.getNotes())
                            .createdAt(Instant.now())
                            .createdBy(currentUserId)
                            .build();

                    farmingLogSupplyRepository.save(supplyEntity);

                    // Add to snapshot
                    Material mat = materialRepository.findById(sReq.getMaterialId()).orElse(null);
                    Map<String, Object> itemSnapshot = new LinkedHashMap<>();
                    itemSnapshot.put("material_id", sReq.getMaterialId());
                    itemSnapshot.put("material_name", mat != null ? mat.getName() : "");
                    itemSnapshot.put("sku_code", mat != null ? mat.getSkuCode() : "");
                    itemSnapshot.put("warehouse_id", warehouseId);
                    itemSnapshot.put("batch_number", sReq.getBatchNumber());
                    itemSnapshot.put("quantity", sReq.getActualQuantity());
                    itemSnapshot.put("unit", sReq.getUnit());
                    itemSnapshot.put("unit_price", unitPrice);
                    itemSnapshot.put("total_price", lineTotal);
                    snapshotList.add(itemSnapshot);
                }

                issue.setTotalAmount(totalIssueAmount);
                warehouseIssueRepository.save(issue);

                // Auto-create FarmExpense (#60)
                CostCategory costCategory = costCategoryRepository.findByTenantIdAndCostType(tenantId, "MATERIALS")
                        .stream().findFirst()
                        .orElseGet(() -> {
                            CostCategory newCat = CostCategory.builder()
                                    .tenantId(tenantId)
                                    .name("Chi phí Vật tư Nông nghiệp")
                                    .code("MAT-DEFAULT")
                                    .costType("MATERIALS")
                                    .createdAt(Instant.now())
                                    .createdBy(currentUserId)
                                    .build();
                            return costCategoryRepository.save(newCat);
                        });

                String expCode = "EXP-BF-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                FarmExpense expense = FarmExpense.builder()
                        .tenantId(tenantId)
                        .farmId(farmId)
                        .costCategoryId(costCategory.getId())
                        .expenseCode(expCode)
                        .expenseSource("INVENTORY_BACKFLUSH")
                        .referenceId(issue.getId())
                        .seasonId(season.getId())
                        .expenseDate(request.getLogDate())
                        .amount(totalIssueAmount)
                        .unitCostEligible(true)
                        .status("CONFIRMED")
                        .notes("Chi phí vật tư tự động xuất từ nhật ký canh tác #" + farmingLog.getId())
                        .createdAt(Instant.now())
                        .createdBy(currentUserId)
                        .build();

                farmExpenseRepository.save(expense);
            }

            farmingLog.setIsInventoryBackflushed(true);
            try {
                farmingLog.setSuppliesUsedJson(objectMapper.writeValueAsString(snapshotList));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize suppliesUsedJson", e);
            }
            farmingLog = farmingLogRepository.save(farmingLog);
        }

        log.info("Created farming log id={} on seasonId={} farmId={}", farmingLog.getId(), season.getId(), farmId);
        return mapToDetailResponse(farmingLog);
    }

    private FarmingLog findFarmingLogOrThrow(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return farmingLogRepository.findByFarmIdAndId(farmId, id)
                .filter(l -> tenantId == null || tenantId.equals(l.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("FarmingLog", id));
    }

    private FarmingLogDetailResponse mapToDetailResponse(FarmingLog logEntry) {
        String seasonCode = cropSeasonRepository.findById(logEntry.getSeasonId())
                .map(CropSeason::getSeasonCode)
                .orElse(null);

        String performedByUserName = null;
        if (logEntry.getPerformedByUserId() != null) {
            performedByUserName = userRepository.findById(logEntry.getPerformedByUserId())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .orElse(null);
        }

        List<FarmingLogSupply> supplyEntities = farmingLogSupplyRepository.findByFarmingLogId(logEntry.getId());
        List<FarmingLogDetailResponse.FarmingSupplyDto> supplies = supplyEntities.stream().map(s -> {
            Material m = materialRepository.findById(s.getMaterialId()).orElse(null);
            String whName = warehouseRepository.findById(s.getWarehouseId()).map(w -> w.getName()).orElse(null);
            return FarmingLogDetailResponse.FarmingSupplyDto.builder()
                    .id(s.getId())
                    .materialId(s.getMaterialId())
                    .skuCode(m != null ? m.getSkuCode() : null)
                    .materialName(m != null ? m.getName() : null)
                    .warehouseId(s.getWarehouseId())
                    .warehouseName(whName)
                    .batchNumber(s.getBatchNumber())
                    .actualQuantity(s.getActualQuantity())
                    .unit(s.getUnit())
                    .unitPrice(s.getUnitPrice())
                    .totalPrice(s.getTotalPrice())
                    .warehouseIssueItemId(s.getWarehouseIssueItemId())
                    .notes(s.getNotes())
                    .build();
        }).collect(Collectors.toList());

        return FarmingLogDetailResponse.builder()
                .id(logEntry.getId())
                .farmId(logEntry.getFarmId())
                .seasonId(logEntry.getSeasonId())
                .seasonCode(seasonCode)
                .logDate(logEntry.getLogDate())
                .stage(logEntry.getStage())
                .activityType(logEntry.getActivityType())
                .phiDays(logEntry.getPhiDays())
                .phiEndDate(logEntry.getPhiEndDate())
                .weatherNotes(logEntry.getWeatherNotes())
                .performedByUserId(logEntry.getPerformedByUserId())
                .performedByUserName(performedByUserName)
                .isInventoryBackflushed(logEntry.getIsInventoryBackflushed())
                .supplies(supplies)
                .createdAt(logEntry.getCreatedAt())
                .build();
    }
}
