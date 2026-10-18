package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.crop.entity.CropSeason;
import com.farm.saas.modules.crop.repository.CropSeasonRepository;
import com.farm.saas.modules.finance.dto.request.AllocateCostRequest;
import com.farm.saas.modules.finance.dto.request.CreateFarmExpenseRequest;
import com.farm.saas.modules.finance.dto.response.FarmExpenseDetailResponse;
import com.farm.saas.modules.finance.dto.response.UnitCostReportResponse;
import com.farm.saas.modules.finance.entity.Budget;
import com.farm.saas.modules.finance.entity.BudgetLineItem;
import com.farm.saas.modules.finance.entity.CostAllocation;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.BudgetLineItemRepository;
import com.farm.saas.modules.finance.repository.BudgetRepository;
import com.farm.saas.modules.finance.repository.CostAllocationRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.finance.service.FarmExpenseService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.quality.repository.HarvestRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmExpenseServiceImpl implements FarmExpenseService {

    private final FarmExpenseRepository farmExpenseRepository;
    private final CostAllocationRepository costAllocationRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetLineItemRepository budgetLineItemRepository;
    private final FarmRepository farmRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final HarvestRecordRepository harvestRecordRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<FarmExpenseDetailResponse> getExpenses(Long farmId, Pageable pageable) {
        validateFarm(farmId);
        Page<FarmExpense> page = farmExpenseRepository.findByFarmId(farmId, pageable);
        return page.map(this::toDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmExpenseDetailResponse getExpenseById(Long farmId, Long id) {
        validateFarm(farmId);
        FarmExpense expense = farmExpenseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Expense not found: " + id));
        if (!expense.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Expense does not belong to specified farm");
        }
        return toDetailResponse(expense);
    }

    @Override
    @Transactional
    public FarmExpenseDetailResponse createExpense(Long farmId, CreateFarmExpenseRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Farm farm = validateFarm(farmId);

        CostCategory costCategory = costCategoryRepository.findByTenantIdAndId(tenantId, request.getCostCategoryId())
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Cost category not found: " + request.getCostCategoryId()));

        String expenseCode = request.getExpenseCode();
        if (expenseCode == null || expenseCode.isBlank()) {
            expenseCode = "EXP-" + farmId + "-" + (System.currentTimeMillis() % 10000000);
        } else if (farmExpenseRepository.existsByTenantIdAndFarmIdAndExpenseCode(tenantId, farmId, expenseCode)) {
            throw new BusinessException("DUPLICATE_RESOURCE", "Expense code already exists: " + expenseCode);
        }

        String status = request.getStatus() != null ? request.getStatus() : "DRAFT";
        String expenseSource = request.getExpenseSource() != null ? request.getExpenseSource() : "MANUAL";
        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH";

        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .costCategoryId(costCategory.getId())
                .expenseCode(expenseCode)
                .expenseSource(expenseSource)
                .referenceId(request.getReferenceId())
                .seasonId(request.getSeasonId())
                .livestockGroupId(request.getLivestockGroupId())
                .expenseDate(request.getExpenseDate())
                .amount(request.getAmount())
                .unitCostEligible(Boolean.TRUE.equals(request.getUnitCostEligible()))
                .paymentMethod(paymentMethod)
                .recipientName(request.getRecipientName())
                .receiptPhotoUrl(request.getReceiptPhotoUrl())
                .notes(request.getNotes())
                .status(status)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        expense = farmExpenseRepository.save(expense);

        // Budget consumption on CONFIRMED
        if ("CONFIRMED".equals(status)) {
            consumeBudget(farmId, tenantId, currentUserId, expense, costCategory);
        }

        return toDetailResponse(expense);
    }

    private void consumeBudget(Long farmId, Long tenantId, Long currentUserId, FarmExpense expense, CostCategory costCategory) {
        int fiscalYear = expense.getExpenseDate().getYear();
        List<Budget> activeBudgets = budgetRepository.findByFarmIdAndFiscalYearAndStatus(farmId, fiscalYear, "ACTIVE");
        for (Budget budget : activeBudgets) {
            Optional<BudgetLineItem> lineItemOpt = budgetLineItemRepository.findByBudgetIdAndCostCategoryId(budget.getId(), costCategory.getId());
            if (lineItemOpt.isPresent()) {
                BudgetLineItem lineItem = lineItemOpt.get();
                BigDecimal newSpent = lineItem.getSpentAmount().add(expense.getAmount());
                lineItem.setSpentAmount(newSpent);
                lineItem.setUpdatedAt(Instant.now());
                lineItem.setUpdatedBy(currentUserId);
                budgetLineItemRepository.save(lineItem);

                // Check 85% threshold
                BigDecimal warningThreshold = lineItem.getAllocatedAmount().multiply(new BigDecimal("0.85"));
                if (newSpent.compareTo(warningThreshold) >= 0) {
                    notificationService.sendNotification(
                            tenantId,
                            currentUserId,
                            "Cảnh báo vượt hạn mức ngân sách",
                            String.format("Hạng mục chi phí '%s' đã chi tiêu %s / %s (đạt hoặc vượt 85%% hạn mức dự toán ngân sách %d)",
                                    costCategory.getName(), newSpent, lineItem.getAllocatedAmount(), fiscalYear),
                            "WARNING",
                            "BUDGET",
                            budget.getId(),
                            "/app/finance/budgets?id=" + budget.getId()
                    );
                }
                break;
            }
        }
    }

    @Override
    @Transactional
    public FarmExpenseDetailResponse allocateCost(Long farmId, Long expenseId, AllocateCostRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        FarmExpense expense = farmExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Expense not found: " + expenseId));
        if (!expense.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Expense does not belong to specified farm");
        }

        BigDecimal existingAllocated = costAllocationRepository.sumAllocatedAmountByExpenseId(expenseId);
        BigDecimal newAllocationsTotal = request.getAllocations().stream()
                .map(AllocateCostRequest.CostAllocationItemRequest::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Mathematical Guard: sum(allocations) <= expense.amount
        if (existingAllocated.add(newAllocationsTotal).compareTo(expense.getAmount()) > 0) {
            throw new BusinessException("BAD_REQUEST",
                    "ALLOCATED_EXCEEDS_EXPENSE_TOTAL: Tổng số tiền phân bổ vượt quá số tiền chi phí");
        }

        for (AllocateCostRequest.CostAllocationItemRequest item : request.getAllocations()) {
            CostAllocation ca = CostAllocation.builder()
                    .expenseId(expenseId)
                    .targetType(item.getTargetType())
                    .targetId(item.getTargetId())
                    .allocatedAmount(item.getAllocatedAmount())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .createdBy(currentUserId)
                    .updatedBy(currentUserId)
                    .build();
            costAllocationRepository.save(ca);
        }

        return toDetailResponse(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public UnitCostReportResponse calculateUnitCost(Long farmId, String targetType, Long targetId) {
        validateFarm(farmId);
        String targetCode = "";
        String targetName = "";
        BigDecimal totalYieldKg = BigDecimal.ZERO;
        BigDecimal directCost = BigDecimal.ZERO;
        Map<String, BigDecimal> costBreakdownMap = new HashMap<>();

        if ("CROP_SEASON".equalsIgnoreCase(targetType)) {
            CropSeason season = cropSeasonRepository.findById(targetId)
                    .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Crop season not found: " + targetId));
            targetCode = season.getSeasonCode();
            targetName = season.getSeasonCode();

            // Direct expenses
            List<FarmExpense> directExpenses = farmExpenseRepository.findBySeasonIdAndStatusAndUnitCostEligibleTrue(targetId, "CONFIRMED");
            for (FarmExpense fe : directExpenses) {
                directCost = directCost.add(fe.getAmount());
                costCategoryRepository.findById(fe.getCostCategoryId()).ifPresent(cat -> {
                    String ct = cat.getCostType() != null ? cat.getCostType() : "OTHER";
                    costBreakdownMap.merge(ct, fe.getAmount(), BigDecimal::add);
                });
            }

            // Yield
            totalYieldKg = harvestRecordRepository.sumQuantityBySeasonId(targetId);
            if (totalYieldKg.compareTo(BigDecimal.ZERO) == 0 && season.getActualYieldKg() != null) {
                totalYieldKg = season.getActualYieldKg();
            }
        } else if ("LIVESTOCK_GROUP".equalsIgnoreCase(targetType)) {
            LivestockGroup group = livestockGroupRepository.findById(targetId)
                    .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Livestock group not found: " + targetId));
            targetCode = group.getGroupCode();
            targetName = group.getGroupCode();

            List<FarmExpense> directExpenses = farmExpenseRepository.findByLivestockGroupIdAndStatusAndUnitCostEligibleTrue(targetId, "CONFIRMED");
            for (FarmExpense fe : directExpenses) {
                directCost = directCost.add(fe.getAmount());
                costCategoryRepository.findById(fe.getCostCategoryId()).ifPresent(cat -> {
                    String ct = cat.getCostType() != null ? cat.getCostType() : "OTHER";
                    costBreakdownMap.merge(ct, fe.getAmount(), BigDecimal::add);
                });
            }

            totalYieldKg = harvestRecordRepository.sumQuantityByLivestockGroupId(targetId);
        } else {
            throw new BusinessException("BAD_REQUEST", "Unsupported targetType for unit costing: " + targetType);
        }

        // Indirect allocated expenses
        List<CostAllocation> allocations = costAllocationRepository.findByTargetTypeAndTargetId(targetType.toUpperCase(), targetId);
        BigDecimal allocatedCost = allocations.stream()
                .map(CostAllocation::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Add allocated costs to breakdown
        for (CostAllocation ca : allocations) {
            farmExpenseRepository.findById(ca.getExpenseId()).ifPresent(fe -> {
                costCategoryRepository.findById(fe.getCostCategoryId()).ifPresent(cat -> {
                    String ct = cat.getCostType() != null ? cat.getCostType() : "OTHER";
                    costBreakdownMap.merge(ct, ca.getAllocatedAmount(), BigDecimal::add);
                });
            });
        }

        BigDecimal totalCost = directCost.add(allocatedCost);
        BigDecimal unitCostPerKg = BigDecimal.ZERO;
        if (totalYieldKg.compareTo(BigDecimal.ZERO) > 0) {
            unitCostPerKg = totalCost.divide(totalYieldKg, 2, RoundingMode.HALF_UP);
        }

        List<UnitCostReportResponse.CostBreakdownDto> breakdownList = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : costBreakdownMap.entrySet()) {
            double pct = totalCost.compareTo(BigDecimal.ZERO) > 0
                    ? entry.getValue().multiply(new BigDecimal("100")).divide(totalCost, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            breakdownList.add(UnitCostReportResponse.CostBreakdownDto.builder()
                    .costType(entry.getKey())
                    .costTypeName(entry.getKey())
                    .amount(entry.getValue())
                    .percentage(pct)
                    .build());
        }

        return UnitCostReportResponse.builder()
                .targetType(targetType.toUpperCase())
                .targetId(targetId)
                .targetCode(targetCode)
                .targetName(targetName)
                .totalYieldKg(totalYieldKg)
                .directCost(directCost)
                .allocatedCost(allocatedCost)
                .totalCost(totalCost)
                .unitCostPerKg(unitCostPerKg)
                .costBreakdown(breakdownList)
                .build();
    }

    private Farm validateFarm(Long farmId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Farm not found: " + farmId));
        if (tenantId != null && !farm.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to farm forbidden");
        }
        return farm;
    }

    private FarmExpenseDetailResponse toDetailResponse(FarmExpense expense) {
        String costCatName = null;
        String costCatCode = null;
        String costType = null;
        Optional<CostCategory> catOpt = costCategoryRepository.findById(expense.getCostCategoryId());
        if (catOpt.isPresent()) {
            costCatName = catOpt.get().getName();
            costCatCode = catOpt.get().getCode();
            costType = catOpt.get().getCostType();
        }

        String farmName = farmRepository.findById(expense.getFarmId()).map(Farm::getName).orElse(null);
        String seasonCode = expense.getSeasonId() != null
                ? cropSeasonRepository.findById(expense.getSeasonId()).map(CropSeason::getSeasonCode).orElse(null)
                : null;
        String groupCode = expense.getLivestockGroupId() != null
                ? livestockGroupRepository.findById(expense.getLivestockGroupId()).map(LivestockGroup::getGroupCode).orElse(null)
                : null;

        List<CostAllocation> allocations = costAllocationRepository.findByExpenseId(expense.getId());
        BigDecimal totalAllocated = allocations.stream()
                .map(CostAllocation::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FarmExpenseDetailResponse.CostAllocationDto> allocationDtos = allocations.stream().map(a -> {
            String targetName = a.getTargetType();
            if ("CROP_SEASON".equalsIgnoreCase(a.getTargetType())) {
                targetName = cropSeasonRepository.findById(a.getTargetId()).map(CropSeason::getSeasonCode).orElse(a.getTargetType());
            } else if ("LIVESTOCK_GROUP".equalsIgnoreCase(a.getTargetType())) {
                targetName = livestockGroupRepository.findById(a.getTargetId()).map(LivestockGroup::getGroupCode).orElse(a.getTargetType());
            }
            return FarmExpenseDetailResponse.CostAllocationDto.builder()
                    .id(a.getId())
                    .targetType(a.getTargetType())
                    .targetId(a.getTargetId())
                    .targetName(targetName)
                    .allocatedAmount(a.getAllocatedAmount())
                    .build();
        }).collect(Collectors.toList());

        return FarmExpenseDetailResponse.builder()
                .id(expense.getId())
                .farmId(expense.getFarmId())
                .farmName(farmName)
                .costCategoryId(expense.getCostCategoryId())
                .costCategoryName(costCatName)
                .costCategoryCode(costCatCode)
                .costType(costType)
                .expenseCode(expense.getExpenseCode())
                .expenseSource(expense.getExpenseSource())
                .referenceId(expense.getReferenceId())
                .seasonId(expense.getSeasonId())
                .seasonCode(seasonCode)
                .livestockGroupId(expense.getLivestockGroupId())
                .groupCode(groupCode)
                .expenseDate(expense.getExpenseDate())
                .amount(expense.getAmount())
                .unitCostEligible(expense.getUnitCostEligible())
                .paymentMethod(expense.getPaymentMethod())
                .recipientName(expense.getRecipientName())
                .receiptPhotoUrl(expense.getReceiptPhotoUrl())
                .notes(expense.getNotes())
                .status(expense.getStatus())
                .totalAllocatedAmount(totalAllocated)
                .allocations(allocationDtos)
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
