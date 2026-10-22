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
import com.farm.saas.modules.finance.dto.response.MultiFarmExpenseSummaryResponse;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.entity.OperationalCycle;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.geography.repository.OperationalCycleRepository;
import com.farm.saas.modules.livestock.entity.LivestockGroup;
import com.farm.saas.modules.livestock.repository.LivestockGroupRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import com.farm.saas.modules.quality.repository.HarvestRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
    private final OperationalCycleRepository operationalCycleRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final HarvestRecordRepository harvestRecordRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<FarmExpenseDetailResponse> getExpenses(Long farmId, Pageable pageable) {
        return getExpenses(farmId, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmExpenseDetailResponse> getExpenses(Long farmId, Long operationalCycleId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<FarmExpense> allExpenses;
        if (farmId != null && farmId > 0) {
            validateFarm(farmId);
            allExpenses = farmExpenseRepository.findByTenantIdAndFarmId(tenantId, farmId);
        } else {
            allExpenses = farmExpenseRepository.findByTenantId(tenantId);
        }

        if (operationalCycleId != null && operationalCycleId > 0) {
            OperationalCycle cycle = operationalCycleRepository.findById(operationalCycleId).orElse(null);
            if (cycle != null) {
                Set<Long> cycleSeasonIds = cropSeasonRepository.findByTenantId(tenantId).stream()
                        .filter(s -> operationalCycleId.equals(s.getOperationalCycleId()))
                        .map(CropSeason::getId)
                        .collect(Collectors.toSet());
                Set<Long> cycleGroupIds = livestockGroupRepository.findByTenantId(tenantId).stream()
                        .filter(g -> operationalCycleId.equals(g.getOperationalCycleId()))
                        .map(LivestockGroup::getId)
                        .collect(Collectors.toSet());

                allExpenses = allExpenses.stream().filter(e -> {
                    if (e.getSeasonId() != null && cycleSeasonIds.contains(e.getSeasonId())) return true;
                    if (e.getLivestockGroupId() != null && cycleGroupIds.contains(e.getLivestockGroupId())) return true;
                    if (e.getExpenseDate() != null) {
                        return !e.getExpenseDate().isBefore(cycle.getStartDate()) && !e.getExpenseDate().isAfter(cycle.getEndDate());
                    }
                    return false;
                }).toList();
            }
        }

        List<FarmExpense> sorted = allExpenses.stream()
                .sorted(Comparator.comparing(FarmExpense::getExpenseDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(FarmExpense::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), sorted.size());
        List<FarmExpenseDetailResponse> content = (start <= end && start < sorted.size())
                ? sorted.subList(start, end).stream().map(this::toDetailResponse).toList()
                : Collections.emptyList();

        return new PageImpl<>(content, pageable, sorted.size());
    }

    @Override
    @Transactional(readOnly = true)
    public MultiFarmExpenseSummaryResponse getMultiFarmExpenseSummary(Long farmId, Long operationalCycleId) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        List<Farm> targetFarms;
        if (farmId != null && farmId > 0) {
            Farm farm = validateFarm(farmId);
            targetFarms = List.of(farm);
        } else {
            targetFarms = farmRepository.findByTenantId(tenantId);
        }

        List<MultiFarmExpenseSummaryResponse.FarmExpenseSummaryItem> items = new ArrayList<>();
        BigDecimal grandTotalMaterials = BigDecimal.ZERO;
        BigDecimal grandTotalLabor = BigDecimal.ZERO;
        BigDecimal grandTotalOverhead = BigDecimal.ZERO;
        BigDecimal grandTotal = BigDecimal.ZERO;
        BigDecimal grandTotalYield = BigDecimal.ZERO;

        Map<Long, CostCategory> categoryMap = costCategoryRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(CostCategory::getId, c -> c, (a, b) -> a));

        for (Farm f : targetFarms) {
            List<OperationalCycle> farmCycles = operationalCycleRepository.findByFarmId(f.getId());
            if (operationalCycleId != null && operationalCycleId > 0) {
                farmCycles = farmCycles.stream().filter(c -> c.getId().equals(operationalCycleId)).toList();
            }

            if (farmCycles.isEmpty()) {
                List<FarmExpense> expenses = farmExpenseRepository.findByTenantIdAndFarmId(tenantId, f.getId());
                MultiFarmExpenseSummaryResponse.FarmExpenseSummaryItem item = calculateSummaryItem(
                        f, null, expenses, categoryMap);
                items.add(item);

                grandTotalMaterials = grandTotalMaterials.add(item.getMaterialExpense());
                grandTotalLabor = grandTotalLabor.add(item.getLaborExpense());
                grandTotalOverhead = grandTotalOverhead.add(item.getOverheadExpense());
                grandTotal = grandTotal.add(item.getTotalExpense());
                grandTotalYield = grandTotalYield.add(item.getTotalYieldKg());
            } else {
                for (OperationalCycle cycle : farmCycles) {
                    List<FarmExpense> allFarmExpenses = farmExpenseRepository.findByTenantIdAndFarmId(tenantId, f.getId());
                    Set<Long> cycleSeasonIds = cropSeasonRepository.findByFarmId(f.getId()).stream()
                            .filter(s -> cycle.getId().equals(s.getOperationalCycleId()))
                            .map(CropSeason::getId)
                            .collect(Collectors.toSet());
                    Set<Long> cycleGroupIds = livestockGroupRepository.findByFarmId(f.getId()).stream()
                            .filter(g -> cycle.getId().equals(g.getOperationalCycleId()))
                            .map(LivestockGroup::getId)
                            .collect(Collectors.toSet());

                    List<FarmExpense> cycleExpenses = allFarmExpenses.stream().filter(e -> {
                        if (e.getSeasonId() != null && cycleSeasonIds.contains(e.getSeasonId())) return true;
                        if (e.getLivestockGroupId() != null && cycleGroupIds.contains(e.getLivestockGroupId())) return true;
                        if (e.getExpenseDate() != null) {
                            return !e.getExpenseDate().isBefore(cycle.getStartDate()) && !e.getExpenseDate().isAfter(cycle.getEndDate());
                        }
                        return false;
                    }).toList();

                    MultiFarmExpenseSummaryResponse.FarmExpenseSummaryItem item = calculateSummaryItem(
                            f, cycle, cycleExpenses, categoryMap);
                    items.add(item);

                    grandTotalMaterials = grandTotalMaterials.add(item.getMaterialExpense());
                    grandTotalLabor = grandTotalLabor.add(item.getLaborExpense());
                    grandTotalOverhead = grandTotalOverhead.add(item.getOverheadExpense());
                    grandTotal = grandTotal.add(item.getTotalExpense());
                    grandTotalYield = grandTotalYield.add(item.getTotalYieldKg());
                }
            }
        }

        BigDecimal overallAvgUnitCost = BigDecimal.ZERO;
        if (grandTotalYield.compareTo(BigDecimal.ZERO) > 0) {
            overallAvgUnitCost = grandTotal.divide(grandTotalYield, 2, RoundingMode.HALF_UP);
        }

        return MultiFarmExpenseSummaryResponse.builder()
                .items(items)
                .totalMaterialsExpense(grandTotalMaterials)
                .totalLaborExpense(grandTotalLabor)
                .totalOverheadExpense(grandTotalOverhead)
                .grandTotalExpense(grandTotal)
                .overallAvgUnitCost(overallAvgUnitCost)
                .build();
    }

    private MultiFarmExpenseSummaryResponse.FarmExpenseSummaryItem calculateSummaryItem(
            Farm farm,
            OperationalCycle cycle,
            List<FarmExpense> expenses,
            Map<Long, CostCategory> categoryMap) {

        BigDecimal material = BigDecimal.ZERO;
        BigDecimal labor = BigDecimal.ZERO;
        BigDecimal overhead = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal unitCostEligibleTotal = BigDecimal.ZERO;

        for (FarmExpense e : expenses) {
            BigDecimal amt = e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO;
            total = total.add(amt);
            if (Boolean.TRUE.equals(e.getUnitCostEligible())) {
                unitCostEligibleTotal = unitCostEligibleTotal.add(amt);
            }

            CostCategory cat = categoryMap.get(e.getCostCategoryId());
            String costType = cat != null ? cat.getCostType() : "";
            String source = e.getExpenseSource() != null ? e.getExpenseSource() : "";

            if ("MATERIALS".equalsIgnoreCase(costType) || "INVENTORY_BACKFLUSH".equalsIgnoreCase(source)) {
                material = material.add(amt);
            } else if ("DIRECT_LABOR".equalsIgnoreCase(costType) || "PAYROLL_ALLOCATION".equalsIgnoreCase(source)) {
                labor = labor.add(amt);
            } else {
                overhead = overhead.add(amt);
            }
        }

        BigDecimal yieldKg = BigDecimal.ZERO;
        if (cycle != null) {
            List<CropSeason> seasons = cropSeasonRepository.findByFarmId(farm.getId()).stream()
                    .filter(s -> cycle.getId().equals(s.getOperationalCycleId()))
                    .toList();
            for (CropSeason s : seasons) {
                yieldKg = yieldKg.add(harvestRecordRepository.sumQuantityBySeasonId(s.getId()));
            }
            List<LivestockGroup> groups = livestockGroupRepository.findByFarmId(farm.getId()).stream()
                    .filter(g -> cycle.getId().equals(g.getOperationalCycleId()))
                    .toList();
            for (LivestockGroup g : groups) {
                yieldKg = yieldKg.add(harvestRecordRepository.sumQuantityByLivestockGroupId(g.getId()));
            }
        } else {
            yieldKg = harvestRecordRepository.sumQuantityByFarmId(farm.getId());
        }

        BigDecimal avgUnitCost = BigDecimal.ZERO;
        if (yieldKg.compareTo(BigDecimal.ZERO) > 0) {
            avgUnitCost = unitCostEligibleTotal.divide(yieldKg, 2, RoundingMode.HALF_UP);
        }

        return MultiFarmExpenseSummaryResponse.FarmExpenseSummaryItem.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .operationalCycleId(cycle != null ? cycle.getId() : null)
                .operationalCycleName(cycle != null ? cycle.getName() : "Toàn bộ chu kỳ")
                .materialExpense(material)
                .laborExpense(labor)
                .overheadExpense(overhead)
                .totalExpense(total)
                .totalYieldKg(yieldKg)
                .avgUnitCost(avgUnitCost)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FarmExpenseDetailResponse getExpenseById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        FarmExpense expense = farmExpenseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Expense not found: " + id));
        if (farmId != null && farmId > 0 && !expense.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Expense does not belong to specified farm");
        }
        if (tenantId != null && !expense.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to expense forbidden");
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
