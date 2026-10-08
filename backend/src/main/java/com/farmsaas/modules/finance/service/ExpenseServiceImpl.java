package com.farmsaas.modules.finance.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.crop.repository.CropSeasonRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.finance.dto.ExpenseRequest;
import com.farmsaas.modules.finance.dto.ExpenseResponse;
import com.farmsaas.modules.finance.entity.CostCategory;
import com.farmsaas.modules.finance.entity.FarmExpense;
import com.farmsaas.modules.finance.entity.enums.CostType;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import com.farmsaas.modules.finance.repository.CostCategoryRepository;
import com.farmsaas.modules.finance.repository.FarmExpenseRepository;
import com.farmsaas.modules.inventory.entity.WarehouseIssue;
import com.farmsaas.modules.inventory.repository.WarehouseIssueRepository;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.repository.LivestockGroupRepository;
import com.farmsaas.modules.partner.entity.Partner;
import com.farmsaas.modules.partner.repository.PartnerRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FarmExpenseRepository farmExpenseRepository;
    private final CostCategoryRepository costCategoryRepository;
    private final CropSeasonRepository cropSeasonRepository;
    private final LivestockGroupRepository livestockGroupRepository;
    private final FarmRepository farmRepository;
    private final PartnerRepository partnerRepository;
    private final WarehouseIssueRepository warehouseIssueRepository;

    @Override
    @Transactional
    public ExpenseResponse createExpense(Long farmId, ExpenseRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        CostCategory category = costCategoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + request.getCategoryId()));

        String expenseCode = request.getExpenseCode();
        if (expenseCode == null || expenseCode.isBlank()) {
            expenseCode = generateExpenseCode(tenantId, farmId);
        } else {
            expenseCode = expenseCode.trim().toUpperCase();
            if (farmExpenseRepository.existsByTenantIdAndFarmIdAndExpenseCode(tenantId, farmId, expenseCode)) {
                throw new BusinessException("Mã chi phí '" + expenseCode + "' đã tồn tại trong trang trại.");
            }
        }

        CropSeason season = null;
        if (request.getSeasonId() != null) {
            season = cropSeasonRepository.findByIdAndTenantIdAndFarmId(request.getSeasonId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mùa vụ ID: " + request.getSeasonId()));
        }

        LivestockGroup herd = null;
        if (request.getHerdId() != null) {
            herd = livestockGroupRepository.findByIdAndTenantIdAndFarmId(request.getHerdId(), tenantId, farmId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đàn vật nuôi ID: " + request.getHerdId()));
        }

        Partner partner = null;
        if (request.getRecipientPartnerId() != null) {
            partner = partnerRepository.findById(request.getRecipientPartnerId()).orElse(null);
        }

        WarehouseIssue issue = null;
        if (request.getReferenceIssueId() != null) {
            issue = warehouseIssueRepository.findByIdAndTenantId(request.getReferenceIssueId(), tenantId).orElse(null);
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();

        FarmExpense expense = FarmExpense.builder()
                .farmId(farmId)
                .categoryId(category.getId())
                .category(category)
                .seasonId(request.getSeasonId())
                .season(season)
                .herdId(request.getHerdId())
                .herd(herd)
                .expenseCode(expenseCode)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.TIEN_MAT)
                .expenseDate(request.getExpenseDate())
                .invoiceNumber(request.getInvoiceNumber())
                .recipientPartnerId(request.getRecipientPartnerId())
                .recipientPartner(partner)
                .referenceIssueId(request.getReferenceIssueId())
                .referenceIssue(issue)
                .notes(request.getNotes())
                .createdByUserId(currentUserId)
                .build();
        expense.setTenantId(tenantId);

        FarmExpense saved = farmExpenseRepository.save(expense);
        log.info("Created farm expense: {} with amount: {} for Farm ID: {}", saved.getExpenseCode(), saved.getAmount(), farmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ExpenseResponse updateExpense(Long farmId, Long id, ExpenseRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmExpense expense = farmExpenseRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi phí ID: " + id));

        CostCategory category = costCategoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục chi phí ID: " + request.getCategoryId()));

        expense.setCategoryId(category.getId());
        expense.setCategory(category);
        expense.setAmount(request.getAmount());
        if (request.getPaymentMethod() != null) expense.setPaymentMethod(request.getPaymentMethod());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setInvoiceNumber(request.getInvoiceNumber());
        expense.setSeasonId(request.getSeasonId());
        expense.setHerdId(request.getHerdId());
        expense.setRecipientPartnerId(request.getRecipientPartnerId());
        expense.setNotes(request.getNotes());

        FarmExpense updated = farmExpenseRepository.save(expense);
        log.info("Updated farm expense ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmExpense expense = farmExpenseRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi phí ID: " + id));
        return mapToResponse(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> searchExpenses(Long farmId, Long categoryId, Long seasonId, Long herdId, PaymentMethod paymentMethod, LocalDate fromDate, LocalDate toDate, String keyword, Pageable pageable) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        return farmExpenseRepository.searchExpenses(tenantId, farmId, categoryId, seasonId, herdId, paymentMethod, fromDate, toDate, keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ExpenseResponse recordMaterialBackflushExpense(Long farmId, Long issueId, Long seasonId, Long herdId, BigDecimal totalMaterialCost, String issueCode) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        if (totalMaterialCost == null || totalMaterialCost.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        // Tìm hoặc lấy category TRUC_TIEP_VAT_TU
        List<CostCategory> categories = costCategoryRepository.findByTenantIdAndCostType(tenantId, CostType.TRUC_TIEP_VAT_TU);
        CostCategory category = categories.isEmpty()
                ? costCategoryRepository.findByTenantId(tenantId).stream().findFirst().orElse(null)
                : categories.get(0);

        if (category == null) {
            category = CostCategory.builder()
                    .code("CP-VT-TU-DONG")
                    .name("Chi phí vật tư xuất kho (Tự động)")
                    .costType(CostType.TRUC_TIEP_VAT_TU)
                    .description("Hạch toán tự động từ xuất kho sản xuất")
                    .status("ACTIVE")
                    .build();
            category.setTenantId(tenantId);
            category = costCategoryRepository.save(category);
        }

        String expenseCode = "EXP-ISSUE-" + (issueCode != null ? issueCode : UUID.randomUUID().toString().substring(0, 6).toUpperCase());

        FarmExpense expense = FarmExpense.builder()
                .farmId(farmId)
                .categoryId(category.getId())
                .category(category)
                .seasonId(seasonId)
                .herdId(herdId)
                .expenseCode(expenseCode)
                .amount(totalMaterialCost)
                .paymentMethod(PaymentMethod.TIEN_MAT)
                .expenseDate(LocalDate.now())
                .referenceIssueId(issueId)
                .notes("Hạch toán tự động từ phiếu xuất kho " + issueCode)
                .createdByUserId(SecurityUtils.getCurrentUserId())
                .build();
        expense.setTenantId(tenantId);

        FarmExpense saved = farmExpenseRepository.save(expense);
        log.info("Backflushed material expense ID: {} for issue: {}, amount: {}", saved.getId(), issueCode, totalMaterialCost);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteExpense(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        FarmExpense expense = farmExpenseRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khoản chi phí ID: " + id));

        farmExpenseRepository.delete(expense);
        log.info("Deleted farm expense ID: {} from Farm ID: {}", id, farmId);
    }

    private String generateExpenseCode(Long tenantId, Long farmId) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String code;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = "EXP-" + datePart + "-" + suffix;
        } while (farmExpenseRepository.existsByTenantIdAndFarmIdAndExpenseCode(tenantId, farmId, code));
        return code;
    }

    private ExpenseResponse mapToResponse(FarmExpense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .farmId(e.getFarmId())
                .categoryId(e.getCategoryId())
                .categoryCode(e.getCategory() != null ? e.getCategory().getCode() : null)
                .categoryName(e.getCategory() != null ? e.getCategory().getName() : null)
                .costType(e.getCategory() != null ? e.getCategory().getCostType() : null)
                .seasonId(e.getSeasonId())
                .seasonCode(e.getSeason() != null ? e.getSeason().getSeasonCode() : null)
                .herdId(e.getHerdId())
                .herdCode(e.getHerd() != null ? e.getHerd().getGroupCode() : null)
                .expenseCode(e.getExpenseCode())
                .amount(e.getAmount())
                .paymentMethod(e.getPaymentMethod())
                .expenseDate(e.getExpenseDate())
                .invoiceNumber(e.getInvoiceNumber())
                .recipientPartnerId(e.getRecipientPartnerId())
                .recipientPartnerName(e.getRecipientPartner() != null ? e.getRecipientPartner().getName() : null)
                .referenceIssueId(e.getReferenceIssueId())
                .notes(e.getNotes())
                .createdByUserId(e.getCreatedByUserId())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
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
