package com.farm.saas.modules.finance.service.impl;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.dto.request.CreateBudgetRequest;
import com.farm.saas.modules.finance.dto.response.BudgetDetailResponse;
import com.farm.saas.modules.finance.entity.Budget;
import com.farm.saas.modules.finance.entity.BudgetLineItem;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.BudgetLineItemRepository;
import com.farm.saas.modules.finance.repository.BudgetRepository;
import com.farm.saas.modules.finance.service.BudgetService;
import com.farm.saas.modules.geography.entity.Farm;
import com.farm.saas.modules.geography.repository.FarmRepository;
import com.farm.saas.modules.auth.entity.User;
import com.farm.saas.modules.auth.repository.UserRepository;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import com.farm.saas.modules.masterdata.entity.CostCategory;
import com.farm.saas.modules.masterdata.repository.CostCategoryRepository;
import com.farm.saas.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
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
    private final FarmExpenseRepository farmExpenseRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final FarmSecurityEvaluator farmSecurityEvaluator;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Page<BudgetDetailResponse> getBudgets(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Page<Budget> page;
        if (farmId != null && farmId > 0) {
            Farm farm = validateFarm(farmId);
            Long effectiveTenantId = tenantId != null ? tenantId : farm.getTenantId();
            if (effectiveTenantId != null) {
                page = budgetRepository.findByTenantIdAndFarmId(effectiveTenantId, farmId, pageable);
            } else {
                page = budgetRepository.findByFarmId(farmId, pageable);
            }
        } else {
            page = (tenantId != null)
                    ? budgetRepository.findByTenantId(tenantId, pageable)
                    : budgetRepository.findAll(pageable);
        }
        return page.map(this::toDetailResponse);
    }

    @Override
    @Transactional
    public BudgetDetailResponse getBudgetById(Long farmId, Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Budget not found: " + id));
        if (farmId != null && farmId > 0 && !budget.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Budget does not belong to specified farm");
        }
        if (tenantId != null && !budget.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to budget forbidden");
        }
        return toDetailResponse(budget);
    }

    @Override
    @Transactional
    public BudgetDetailResponse createBudget(Long farmId, CreateBudgetRequest request) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : request.getFarmId();
        if (targetFarmId == null) {
            throw new BusinessException("BAD_REQUEST", "Trang trại (farmId) không được để trống khi khởi tạo ngân sách");
        }
        validateFarm(targetFarmId);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        boolean isOwner = currentUser != null && (
                currentUser.isSuperAdmin() ||
                currentUser.hasRole("ROLE_FARM_OWNER")
        );

        // Chuẩn Maker-Checker Phương án A:
        // - Duy nhất Chủ đầu tư (ROLE_FARM_OWNER / SUPER_ADMIN) mới có quyền cấp vốn -> ACTIVE ngay
        // - Giám đốc trang trại (ROLE_FARM_MANAGER) hoặc Kế toán (ROLE_ACCOUNTANT) lập đề xuất -> DRAFT (chờ Owner duyệt)
        String initialStatus = isOwner ? "ACTIVE" : "DRAFT";

        Budget budget = Budget.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .operationalCycleId(request.getOperationalCycleId())
                .name(request.getName())
                .fiscalYear(request.getFiscalYear())
                .totalBudgetAmount(request.getTotalBudgetAmount())
                .status(initialStatus)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        budget = budgetRepository.save(budget);

        LocalDate startDate = LocalDate.of(budget.getFiscalYear(), 1, 1);
        LocalDate endDate = LocalDate.of(budget.getFiscalYear(), 12, 31);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (CreateBudgetRequest.BudgetItemRequest item : request.getItems()) {
                BigDecimal existingSpent = farmExpenseRepository.sumConfirmedExpensesByFarmAndCategoryAndDateRange(
                        targetFarmId,
                        item.getCostCategoryId(),
                        startDate,
                        endDate
                );
                BigDecimal initialSpent = (existingSpent != null && existingSpent.compareTo(BigDecimal.ZERO) > 0)
                        ? existingSpent
                        : BigDecimal.ZERO;

                BudgetLineItem lineItem = BudgetLineItem.builder()
                        .budgetId(budget.getId())
                        .costCategoryId(item.getCostCategoryId())
                        .allocatedAmount(item.getAllocatedAmount())
                        .spentAmount(initialSpent)
                        .notes(item.getNotes())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .createdBy(currentUserId)
                        .updatedBy(currentUserId)
                        .build();
                budgetLineItemRepository.save(lineItem);
            }
        }

        // Maker-Checker: Khi Farm Manager hoặc Kế toán tạo dự toán DRAFT -> gửi thông báo tới Chủ đầu tư (Owner)
        if ("DRAFT".equals(budget.getStatus())) {
            Long ownerUserId = userRepository.findByUsername("owner")
                    .map(User::getId)
                    .orElseGet(() -> userRepository.findAll().stream()
                            .filter(u -> tenantId == null || tenantId.equals(u.getTenantId()))
                            .map(User::getId)
                            .findFirst()
                            .orElse(null));
            sendNotificationQuietly(
                    tenantId,
                    ownerUserId,
                    "Đề xuất dự toán ngân sách mới chờ phê duyệt: " + budget.getName(),
                    "Trang trại vừa lập đề xuất dự toán ngân sách [" + budget.getName() + "] cho năm tài chính " + budget.getFiscalYear() + " đang chờ Chủ đầu tư thẩm định và cấp vốn.",
                    "SYSTEM",
                    "BUDGET",
                    budget.getId(),
                    "/app/cost-accounting"
            );
        }

        return toDetailResponse(budget);
    }

    @Override
    @Transactional
    public BudgetDetailResponse updateBudgetStatus(Long farmId, Long id, String status) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Budget not found: " + id));
        if (farmId != null && farmId > 0 && !budget.getFarmId().equals(farmId)) {
            throw new BusinessException("BAD_REQUEST", "Budget does not belong to specified farm");
        }
        if (tenantId != null && !budget.getTenantId().equals(tenantId)) {
            throw new BusinessException("FORBIDDEN", "Access to budget forbidden");
        }

        // Kiểm tra quyền phê duyệt/thay đổi trạng thái: Đặc quyền của Chủ sở hữu (Owner) hoặc Super Admin
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        boolean isOwner = currentUser != null && (
                currentUser.isSuperAdmin() ||
                currentUser.hasRole("ROLE_FARM_OWNER")
        );
        if (!isOwner) {
            throw new BusinessException("FORBIDDEN", "Chỉ Chủ sở hữu trang trại (Owner) mới có quyền phê duyệt cấp vốn hoặc thay đổi trạng thái ngân sách");
        }

        budget.setStatus(status);
        budget.setUpdatedAt(Instant.now());
        budget.setUpdatedBy(currentUserId);
        budget = budgetRepository.save(budget);

        // GAP-ACC-08: Notify creator (accountant) on budget status change
        Long creatorId = budget.getCreatedBy();
        if (creatorId == null) {
            creatorId = userRepository.findByUsername("accountant").map(User::getId).orElse(null);
        }
        sendNotificationQuietly(
                tenantId,
                creatorId,
                "Dự toán ngân sách đã được cập nhật: " + budget.getName(),
                "Dự toán ngân sách [" + budget.getName() + "] đã được cập nhật sang trạng thái " + status + ".",
                "SYSTEM",
                "BUDGET",
                budget.getId(),
                "/app/cost-accounting"
        );

        return toDetailResponse(budget);
    }

    private void sendNotificationQuietly(Long tenantId, Long recipientUserId, String title, String message, String type, String refType, Long refId, String actionUrl) {
        if (recipientUserId == null) return;
        try {
            notificationService.sendNotification(tenantId, recipientUserId, title, message, type, refType, refId, actionUrl);
        } catch (Exception ex) {
            log.warn("Failed to send budget notification to user id={}: {}", recipientUserId, ex.getMessage());
        }
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

        LocalDate startDate = LocalDate.of(budget.getFiscalYear(), 1, 1);
        LocalDate endDate = LocalDate.of(budget.getFiscalYear(), 12, 31);

        for (BudgetLineItem bi : items) {
            BigDecimal actualSpent = farmExpenseRepository.sumConfirmedExpensesByFarmAndCategoryAndDateRange(
                    budget.getFarmId(),
                    bi.getCostCategoryId(),
                    startDate,
                    endDate
            );
            BigDecimal effectiveSpent = (actualSpent != null && actualSpent.compareTo(BigDecimal.ZERO) > 0)
                    ? actualSpent
                    : (bi.getSpentAmount() != null ? bi.getSpentAmount() : BigDecimal.ZERO);

            if (bi.getSpentAmount() == null || bi.getSpentAmount().compareTo(effectiveSpent) != 0) {
                bi.setSpentAmount(effectiveSpent);
                budgetLineItemRepository.save(bi);
            }

            totalSpent = totalSpent.add(effectiveSpent);

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
            if (bi.getAllocatedAmount() != null && bi.getAllocatedAmount().compareTo(BigDecimal.ZERO) > 0) {
                usagePct = effectiveSpent.multiply(new BigDecimal("100"))
                        .divide(bi.getAllocatedAmount(), 2, RoundingMode.HALF_UP).doubleValue();
            }

            itemDtos.add(BudgetDetailResponse.BudgetLineItemDto.builder()
                    .id(bi.getId())
                    .costCategoryId(bi.getCostCategoryId())
                    .costCategoryName(catName)
                    .costCategoryCode(catCode)
                    .costType(costType)
                    .allocatedAmount(bi.getAllocatedAmount())
                    .spentAmount(effectiveSpent)
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

    @Override
    @Transactional
    public void consumeBudgetForConfirmedExpense(FarmExpense expense) {
        if (expense == null || expense.getAmount() == null || expense.getAmount().compareTo(BigDecimal.ZERO) <= 0 || expense.getCostCategoryId() == null) {
            return;
        }
        if (!"CONFIRMED".equalsIgnoreCase(expense.getStatus())) {
            return;
        }
        Long farmId = expense.getFarmId();
        Long tenantId = expense.getTenantId();
        int fiscalYear = (expense.getExpenseDate() != null) ? expense.getExpenseDate().getYear() : java.time.LocalDate.now().getYear();

        List<Budget> activeBudgets = budgetRepository.findByFarmIdAndFiscalYearAndStatus(farmId, fiscalYear, "ACTIVE");
        for (Budget budget : activeBudgets) {
            java.util.Optional<BudgetLineItem> lineItemOpt = budgetLineItemRepository.findByBudgetIdAndCostCategoryId(budget.getId(), expense.getCostCategoryId());
            if (lineItemOpt.isPresent()) {
                BudgetLineItem lineItem = lineItemOpt.get();
                BigDecimal currentSpent = lineItem.getSpentAmount() != null ? lineItem.getSpentAmount() : BigDecimal.ZERO;
                BigDecimal newSpent = currentSpent.add(expense.getAmount());
                lineItem.setSpentAmount(newSpent);
                lineItem.setUpdatedAt(Instant.now());
                lineItem.setUpdatedBy(expense.getUpdatedBy() != null ? expense.getUpdatedBy() : expense.getCreatedBy());
                budgetLineItemRepository.save(lineItem);

                // GAP-SYNC-07: Check 85% threshold warning
                if (lineItem.getAllocatedAmount() != null && lineItem.getAllocatedAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal warningThreshold = lineItem.getAllocatedAmount().multiply(new BigDecimal("0.85"));
                    if (newSpent.compareTo(warningThreshold) >= 0) {
                        String catName = costCategoryRepository.findById(expense.getCostCategoryId())
                                .map(CostCategory::getName).orElse("Hạng mục chi phí");
                        Long notifyUserId = lineItem.getUpdatedBy();
                        if (notifyUserId == null) notifyUserId = budget.getCreatedBy();
                        if (notifyUserId != null) {
                            try {
                                notificationService.sendNotification(
                                        tenantId,
                                        notifyUserId,
                                        "Cảnh báo vượt hạn mức ngân sách",
                                        String.format("Hạng mục chi phí '%s' đã chi tiêu %s / %s (đạt hoặc vượt 85%% hạn mức dự toán ngân sách %d)",
                                                catName, newSpent, lineItem.getAllocatedAmount(), fiscalYear),
                                        "WARNING",
                                        "BUDGET",
                                        budget.getId(),
                                        "/app/finance/budgets?id=" + budget.getId()
                                );
                            } catch (Exception e) {
                                log.warn("Failed to send budget warning notification: {}", e.getMessage());
                            }
                        }
                    }
                }
                break;
            }
        }
    }

    @Override
    @Transactional
    public void revertBudgetForCancelledExpense(FarmExpense expense) {
        if (expense == null || expense.getAmount() == null || expense.getAmount().compareTo(BigDecimal.ZERO) <= 0 || expense.getCostCategoryId() == null) {
            return;
        }
        Long farmId = expense.getFarmId();
        int fiscalYear = (expense.getExpenseDate() != null) ? expense.getExpenseDate().getYear() : java.time.LocalDate.now().getYear();

        List<Budget> activeBudgets = budgetRepository.findByFarmIdAndFiscalYearAndStatus(farmId, fiscalYear, "ACTIVE");
        for (Budget budget : activeBudgets) {
            java.util.Optional<BudgetLineItem> lineItemOpt = budgetLineItemRepository.findByBudgetIdAndCostCategoryId(budget.getId(), expense.getCostCategoryId());
            if (lineItemOpt.isPresent()) {
                BudgetLineItem lineItem = lineItemOpt.get();
                BigDecimal currentSpent = lineItem.getSpentAmount() != null ? lineItem.getSpentAmount() : BigDecimal.ZERO;
                BigDecimal newSpent = currentSpent.subtract(expense.getAmount());
                if (newSpent.compareTo(BigDecimal.ZERO) < 0) {
                    newSpent = BigDecimal.ZERO;
                }
                lineItem.setSpentAmount(newSpent);
                lineItem.setUpdatedAt(Instant.now());
                lineItem.setUpdatedBy(expense.getUpdatedBy() != null ? expense.getUpdatedBy() : SecurityUtils.getCurrentUserId());
                budgetLineItemRepository.save(lineItem);
                break;
            }
        }
    }
}
