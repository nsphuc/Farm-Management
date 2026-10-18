package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.finance.dto.response.BudgetDetailResponse;
import com.farm.saas.modules.finance.entity.Budget;
import com.farm.saas.modules.finance.entity.BudgetLineItem;
import com.farm.saas.modules.finance.repository.BudgetLineItemRepository;
import com.farm.saas.modules.finance.repository.BudgetRepository;
import com.farm.saas.modules.finance.service.BudgetService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetLineItemRepository budgetLineItemRepository;
    private final FarmRepository farmRepository;
    private final CostCategoryRepository costCategoryRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<BudgetDetailResponse> getBudgets(Long farmId, Pageable pageable) {
        validateFarm(farmId);
        Page<Budget> page = budgetRepository.findByFarmId(farmId, pageable);
        return page.map(this::toDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetDetailResponse getBudgetById(Long farmId, Long id) {
        validateFarm(farmId);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Budget not found: " + id));
        if (!budget.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Budget does not belong to specified farm");
        }
        return toDetailResponse(budget);
    }

    @Override
    @Transactional
    public BudgetDetailResponse createBudget(Long farmId, CreateBudgetRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        validateFarm(farmId);

        Budget budget = Budget.builder()
                .tenantId(tenantId)
                .farmId(farmId)
                .operationalCycleId(request.getOperationalCycleId())
                .name(request.getName())
                .fiscalYear(request.getFiscalYear())
                .totalBudgetAmount(request.getTotalBudgetAmount())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        budget = budgetRepository.save(budget);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (CreateBudgetRequest.BudgetItemRequest item : request.getItems()) {
                BudgetLineItem lineItem = BudgetLineItem.builder()
                        .budgetId(budget.getId())
                        .costCategoryId(item.getCostCategoryId())
                        .allocatedAmount(item.getAllocatedAmount())
                        .spentAmount(BigDecimal.ZERO)
                        .notes(item.getNotes())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .createdBy(currentUserId)
                        .updatedBy(currentUserId)
                        .build();
                budgetLineItemRepository.save(lineItem);
            }
        }

        return toDetailResponse(budget);
    }

    @Override
    @Transactional
    public BudgetDetailResponse updateBudgetStatus(Long farmId, Long id, String status) {
        validateFarm(farmId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Budget not found: " + id));
        if (!budget.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Budget does not belong to specified farm");
        }

        budget.setStatus(status);
        budget.setUpdatedAt(Instant.now());
        budget.setUpdatedBy(currentUserId);
        budget = budgetRepository.save(budget);

        return toDetailResponse(budget);
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

    private BudgetDetailResponse toDetailResponse(Budget budget) {
        String farmName = farmRepository.findById(budget.getFarmId()).map(Farm::getName).orElse(null);
        List<BudgetLineItem> items = budgetLineItemRepository.findByBudgetId(budget.getId());

        BigDecimal totalSpent = BigDecimal.ZERO;
        List<BudgetDetailResponse.BudgetLineItemDto> itemDtos = new ArrayList<>();

        for (BudgetLineItem bi : items) {
            totalSpent = totalSpent.add(bi.getSpentAmount());
            String catName = null;
            String catCode = null;
            String costType = null;
            CostCategory cat = costCategoryRepository.findById(bi.getCostCategoryId()).orElse(null);
            if (cat != null) {
                catName = cat.getName();
                catCode = cat.getCode();
                costType = cat.getCostType();
            }

            double usagePct = 0.0;
            if (bi.getAllocatedAmount().compareTo(BigDecimal.ZERO) > 0) {
                usagePct = bi.getSpentAmount().multiply(new BigDecimal("100"))
                        .divide(bi.getAllocatedAmount(), 2, RoundingMode.HALF_UP).doubleValue();
            }

            itemDtos.add(BudgetDetailResponse.BudgetLineItemDto.builder()
                    .id(bi.getId())
                    .costCategoryId(bi.getCostCategoryId())
                    .costCategoryName(catName)
                    .costCategoryCode(catCode)
                    .costType(costType)
                    .allocatedAmount(bi.getAllocatedAmount())
                    .spentAmount(bi.getSpentAmount())
                    .usagePercentage(usagePct)
                    .notes(bi.getNotes())
                    .build());
        }

        return BudgetDetailResponse.builder()
                .id(budget.getId())
                .farmId(budget.getFarmId())
                .farmName(farmName)
                .operationalCycleId(budget.getOperationalCycleId())
                .name(budget.getName())
                .fiscalYear(budget.getFiscalYear())
                .totalBudgetAmount(budget.getTotalBudgetAmount())
                .totalSpentAmount(totalSpent)
                .status(budget.getStatus())
                .lineItems(itemDtos)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }
}
