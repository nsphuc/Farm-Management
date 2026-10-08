package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.finance.dto.BudgetLineItemDto;
import com.farmsaas.modules.finance.dto.BudgetRequest;
import com.farmsaas.modules.finance.dto.BudgetResponse;
import com.farmsaas.modules.finance.dto.BudgetVsActualResponse;
import com.farmsaas.modules.finance.entity.Budget;
import com.farmsaas.modules.finance.entity.BudgetLineItem;
import com.farmsaas.modules.finance.entity.CostCategory;
import com.farmsaas.modules.finance.entity.FarmExpense;
import com.farmsaas.modules.finance.repository.BudgetLineItemRepository;
import com.farmsaas.modules.finance.repository.BudgetRepository;
import com.farmsaas.modules.finance.repository.CostCategoryRepository;
import com.farmsaas.modules.finance.repository.FarmExpenseRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetLineItemRepository budgetLineItemRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final FarmExpenseRepository farmExpenseRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public BudgetResponse createBudget(Long farmId, BudgetRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        String budgetCode = request.getBudgetCode();
        if (budgetCode == null || budgetCode.isBlank()) {
            budgetCode = generateBudgetCode(tenantId, farmId);
        } else {
            budgetCode = budgetCode.trim().toUpperCase();
            if (budgetRepository.existsByTenantIdAndFarmIdAndBudgetCode(tenantId, farmId, budgetCode)) {
                throw new BusinessException("Mã ngân sách '" + budgetCode + "' đã tồn tại trong trang trại.");
            }
        }

        CropSeason season = null;
        if (request.getSeasonId() != null) {
            season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(request.getSeasonId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + request.getSeasonId()));
        }

        BigDecimal totalBudget = BigDecimal.ZERO;
        List<BudgetLineItem> itemsToSave = new ArrayList<>();

        for (BudgetLineItemDto itemDto : request.getItems()) {
            CostCategory category = costCategoryRepository.findByIdAndTenantId(itemDto.getCategoryId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + itemDto.getCategoryId()));

            BigDecimal planned = itemDto.getPlannedAmount() != null ? itemDto.getPlannedAmount() : BigDecimal.ZERO;
            totalBudget = totalBudget.add(planned);

            BudgetLineItem item = BudgetLineItem.builder()
                    .categoryId(category.getId())
                    .category(category)
                    .plannedAmount(planned)
                    .notes(itemDto.getNotes())
                    .build();
            itemsToSave.add(item);
        }

        Budget budget = Budget.builder()
                .farmId(farmId)
                .seasonId(request.getSeasonId())
                .season(season)
                .budgetCode(budgetCode)
                .title(request.getTitle().trim())
                .totalBudget(totalBudget)
                .status(request.getStatus() != null ? request.getStatus() : "DANG_AP_DUNG")
                .notes(request.getNotes())
                .build();
        budget.setTenantId(tenantId);

        Budget saved = budgetRepository.save(budget);

        for (BudgetLineItem item : itemsToSave) {
            item.setBudgetId(saved.getId());
            item.setBudget(saved);
            budgetLineItemRepository.save(item);
        }
        saved.setItems(itemsToSave);

        log.info("Created budget code: {} with total: {}", saved.getBudgetCode(), totalBudget);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(Long farmId, Long id, BudgetRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Budget budget = budgetRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ngân sách ID: " + id));

        budget.setTitle(request.getTitle().trim());
        if (request.getStatus() != null) budget.setStatus(request.getStatus());
        if (request.getNotes() != null) budget.setNotes(request.getNotes());

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            budgetLineItemRepository.deleteByBudgetId(id);

            BigDecimal totalBudget = BigDecimal.ZERO;
            List<BudgetLineItem> itemsToSave = new ArrayList<>();
            for (BudgetLineItemDto itemDto : request.getItems()) {
                CostCategory category = costCategoryRepository.findByIdAndTenantId(itemDto.getCategoryId(), tenantId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + itemDto.getCategoryId()));

                BigDecimal planned = itemDto.getPlannedAmount() != null ? itemDto.getPlannedAmount() : BigDecimal.ZERO;
                totalBudget = totalBudget.add(planned);

                BudgetLineItem item = BudgetLineItem.builder()
                        .budgetId(id)
                        .budget(budget)
                        .categoryId(category.getId())
                        .category(category)
                        .plannedAmount(planned)
                        .notes(itemDto.getNotes())
                        .build();
                itemsToSave.add(budgetLineItemRepository.save(item));
            }
            budget.setTotalBudget(totalBudget);
            budget.setItems(itemsToSave);
        }

        Budget updated = budgetRepository.save(budget);
        log.info("Updated budget ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getBudgetById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Budget budget = budgetRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ngân sách ID: " + id));
        return mapToResponse(budget);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BudgetResponse> searchBudgets(Long farmId, Long seasonId, String keyword, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return budgetRepository.searchBudgets(tenantId, farmId, seasonId, keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetVsActualResponse getBudgetVsActual(Long farmId, Long seasonId) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CropSeason season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(seasonId, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vụ mùa ID: " + seasonId));

        Budget budget = budgetRepository.findByTenantIdAndFarmIdAndSeasonId(tenantId, farmId, seasonId)
                .orElseThrow(() -> new EntityNotFoundException("Chưa thiết lập dự toán ngân sách cho vụ mùa " + season.getSeasonCode()));

        // Lấy toàn bộ chi phí thực tế phát sinh của vụ mùa
        List<FarmExpense> expenses = farmExpenseRepository.findByTenantIdAndFarmIdAndSeasonId(tenantId, farmId, seasonId);

        // Gom nhóm chi phí thực tế theo categoryId
        Map<Long, BigDecimal> actualMap = new HashMap<>();
        for (FarmExpense exp : expenses) {
            Long catId = exp.getCategoryId();
            BigDecimal amount = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;
            actualMap.put(catId, actualMap.getOrDefault(catId, BigDecimal.ZERO).add(amount));
        }

        List<BudgetVsActualResponse.BudgetLineComparisonDto> comparisons = new ArrayList<>();
        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;

        for (BudgetLineItem item : budget.getItems()) {
            Long catId = item.getCategoryId();
            BigDecimal planned = item.getPlannedAmount() != null ? item.getPlannedAmount() : BigDecimal.ZERO;
            BigDecimal actual = actualMap.getOrDefault(catId, BigDecimal.ZERO);
            BigDecimal variance = planned.subtract(actual);

            BigDecimal variancePercent = BigDecimal.ZERO;
            if (planned.compareTo(BigDecimal.ZERO) > 0) {
                variancePercent = actual.multiply(BigDecimal.valueOf(100)).divide(planned, 1, RoundingMode.HALF_UP);
            }

            String status = "ON_TRACK";
            if (actual.compareTo(planned) > 0) {
                status = "OVER_BUDGET";
            } else if (actual.compareTo(planned) < 0) {
                status = "UNDER_BUDGET";
            }

            totalPlanned = totalPlanned.add(planned);
            totalActual = totalActual.add(actual);

            comparisons.add(BudgetVsActualResponse.BudgetLineComparisonDto.builder()
                    .categoryId(catId)
                    .categoryCode(item.getCategory() != null ? item.getCategory().getCode() : null)
                    .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
                    .plannedAmount(planned)
                    .actualAmount(actual)
                    .variance(variance)
                    .variancePercent(variancePercent)
                    .status(status)
                    .build());
        }

        BigDecimal totalVariance = totalPlanned.subtract(totalActual);
        BigDecimal totalVariancePercent = BigDecimal.ZERO;
        if (totalPlanned.compareTo(BigDecimal.ZERO) > 0) {
            totalVariancePercent = totalActual.multiply(BigDecimal.valueOf(100)).divide(totalPlanned, 1, RoundingMode.HALF_UP);
        }

        return BudgetVsActualResponse.builder()
                .farmId(farmId)
                .seasonId(seasonId)
                .seasonCode(season.getSeasonCode())
                .budgetId(budget.getId())
                .budgetTitle(budget.getTitle())
                .totalBudget(totalPlanned)
                .totalActual(totalActual)
                .totalVariance(totalVariance)
                .variancePercent(totalVariancePercent)
                .comparisons(comparisons)
                .build();
    }

    @Override
    @Transactional
    public void deleteBudget(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        Budget budget = budgetRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ngân sách ID: " + id));

        budgetRepository.delete(budget);
        log.info("Deleted budget ID: {} from Farm ID: {}", id, farmId);
    }

    private String generateBudgetCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "BGT-" + datePart + "-" + suffix;
        } while (budgetRepository.existsByTenantIdAndFarmIdAndBudgetCode(tenantId, farmId, code));
        return code;
    }

    private BudgetResponse mapToResponse(Budget b) {
        List<BudgetLineItemDto> itemDtos = b.getItems() != null
                ? b.getItems().stream().map(i -> BudgetLineItemDto.builder()
                .id(i.getId())
                .categoryId(i.getCategoryId())
                .categoryCode(i.getCategory() != null ? i.getCategory().getCode() : null)
                .categoryName(i.getCategory() != null ? i.getCategory().getName() : null)
                .plannedAmount(i.getPlannedAmount())
                .notes(i.getNotes())
                .build()).collect(Collectors.toList())
                : List.of();

        return BudgetResponse.builder()
                .id(b.getId())
                .tenantId(b.getTenantId())
                .farmId(b.getFarmId())
                .seasonId(b.getSeasonId())
                .seasonCode(b.getSeason() != null ? b.getSeason().getSeasonCode() : null)
                .budgetCode(b.getBudgetCode())
                .title(b.getTitle())
                .totalBudget(b.getTotalBudget())
                .status(b.getStatus())
                .notes(b.getNotes())
                .items(itemDtos)
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
