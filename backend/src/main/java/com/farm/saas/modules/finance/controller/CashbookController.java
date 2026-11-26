package com.farm.saas.modules.finance.controller;

import com.farm.saas.common.exception.BusinessException;
import com.farm.saas.common.security.FarmSecurityEvaluator;
import com.farm.saas.common.security.SecurityUtils;
import com.farm.saas.modules.finance.entity.FarmExpense;
import com.farm.saas.modules.finance.repository.FarmExpenseRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/cashbook", "/api/v1/farms/{farmId}/cashbook"})
@RequiredArgsConstructor
@Tag(name = "Cashbook", description = "Quản lý dòng tiền Sổ quỹ, tổng hợp phiếu thu chi và phân bổ chi phí lứa nuôi")
public class CashbookController {

    private final FarmExpenseRepository farmExpenseRepository;
    private final FarmSecurityEvaluator farmSecurity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CashbookEntryRequest {
        private String slipCode;
        private String type; // INCOME, EXPENSE
        private LocalDate date;
        private String category;
        private BigDecimal amount;
        private String paymentMethod; // TIEN_MAT, CHUYEN_KHOAN, BANK_TRANSFER, CASH
        private String targetPerson;
        private Long allocatedCycleId;
        private String notes;
        private Long branchId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CashbookEntryResponse {
        private Long id;
        private String slipCode;
        private String type; // INCOME, EXPENSE
        private LocalDate date;
        private String category;
        private BigDecimal amount;
        private String paymentMethod;
        private String targetPerson;
        private Long allocatedCycleId;
        private String barnName;
        private String batchName;
        private Boolean isLocked;
        private String notes;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CashbookSummaryResponse {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal netCashflow;
        private BigDecimal cashBalance;
        private BigDecimal bankBalance;
        private Page<CashbookEntryResponse> entries;
    }

    @GetMapping
    @PreAuthorize("(hasAnyAuthority('cashbook.view', 'PERM_FINANCE_EXPENSE', 'PERM_FINANCE_REPORT') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Lấy dữ liệu sổ quỹ dòng tiền, phân trang và tổng hợp số dư")
    public ResponseEntity<CashbookSummaryResponse> getCashbook(
            @PathVariable(required = false) Long farmId,
            @RequestParam(required = false) Long filterFarmId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String type,
            @PageableDefault(sort = "expenseDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : (filterFarmId != null ? filterFarmId : 1L);
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, branchId);

        List<FarmExpense> allExpenses = farmExpenseRepository.findByFarmId(targetFarmId);
        if (effectiveBranchId != null) {
            allExpenses = allExpenses.stream()
                    .filter(e -> {
                        Long expBranchId = e.getBranchId() != null ? e.getBranchId() : 1L;
                        return effectiveBranchId.equals(expBranchId);
                    })
                    .collect(Collectors.toList());
        }

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        boolean includeBaseline = Long.valueOf(1L).equals(targetFarmId)
                && (effectiveBranchId == null || Long.valueOf(1L).equals(effectiveBranchId));
        BigDecimal cashBal = includeBaseline ? new BigDecimal("45000000") : BigDecimal.ZERO;
        BigDecimal bankBal = includeBaseline ? new BigDecimal("185000000") : BigDecimal.ZERO;

        List<CashbookEntryResponse> mappedList = new ArrayList<>();

        for (FarmExpense exp : allExpenses) {
            String src = exp.getExpenseSource() != null ? exp.getExpenseSource().toUpperCase() : "";
            boolean isIncome = "INCOME".equals(src) ||
                               "SALES_HARVEST".equals(src) ||
                               (src.isEmpty() && exp.getExpenseCode() != null && exp.getExpenseCode().toUpperCase().startsWith("PT-"));
            BigDecimal amt = exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO;

            if (isIncome) {
                totalIncome = totalIncome.add(amt);
                if ("TIEN_MAT".equalsIgnoreCase(exp.getPaymentMethod()) || "CASH".equalsIgnoreCase(exp.getPaymentMethod())) {
                    cashBal = cashBal.add(amt);
                } else {
                    bankBal = bankBal.add(amt);
                }
            } else {
                totalExpense = totalExpense.add(amt);
                if ("TIEN_MAT".equalsIgnoreCase(exp.getPaymentMethod()) || "CASH".equalsIgnoreCase(exp.getPaymentMethod())) {
                    cashBal = cashBal.subtract(amt);
                } else {
                    bankBal = bankBal.subtract(amt);
                }
            }

            if (type == null || (isIncome && "INCOME".equalsIgnoreCase(type)) || (!isIncome && "EXPENSE".equalsIgnoreCase(type))) {
                mappedList.add(CashbookEntryResponse.builder()
                        .id(exp.getId())
                        .slipCode(StringUtils.hasText(exp.getExpenseCode()) ? exp.getExpenseCode() : (isIncome ? "PT-" : "PC-") + exp.getId())
                        .type(isIncome ? "INCOME" : "EXPENSE")
                        .date(exp.getExpenseDate())
                        .category(exp.getNotes() != null && exp.getNotes().length() > 30 ? exp.getNotes().substring(0, 30) : (isIncome ? "Thu bán hàng" : "Chi vận hành"))
                        .amount(amt)
                        .paymentMethod(StringUtils.hasText(exp.getPaymentMethod()) ? exp.getPaymentMethod() : "CHUYEN_KHOAN")
                        .targetPerson(exp.getRecipientName() != null ? exp.getRecipientName() : "Đối tác giao dịch")
                        .allocatedCycleId(exp.getLivestockGroupId())
                        .isLocked(exp.getReferenceId() != null || "SALES_HARVEST".equalsIgnoreCase(exp.getExpenseSource()) || "PURCHASE_INVOICE".equalsIgnoreCase(exp.getExpenseSource()))
                        .notes(exp.getNotes())
                        .createdAt(exp.getCreatedAt())
                        .build());
            }
        }

        mappedList.sort((a, b) -> {
            if (b.getDate() == null && a.getDate() == null) return Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L);
            if (b.getDate() == null) return -1;
            if (a.getDate() == null) return 1;
            int dateCmp = b.getDate().compareTo(a.getDate());
            if (dateCmp != 0) return dateCmp;
            return Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L);
        });

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), mappedList.size());
        List<CashbookEntryResponse> pageContent = (start <= end) ? mappedList.subList(start, end) : Collections.emptyList();
        Page<CashbookEntryResponse> page = new PageImpl<>(pageContent, pageable, mappedList.size());

        BigDecimal netCashflow = totalIncome.subtract(totalExpense);

        CashbookSummaryResponse summary = CashbookSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netCashflow(netCashflow)
                .cashBalance(cashBal)
                .bankBalance(bankBal)
                .entries(page)
                .build();

        return ResponseEntity.ok(summary);
    }

    @PostMapping
    @Transactional
    @PreAuthorize("(hasAnyAuthority('cashbook.create', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')) and (#farmId == null or @farmSecurity.canAccessFarm(#farmId))")
    @Operation(summary = "Tạo phiếu thu / chi thủ công trên sổ quỹ, cho phép phân bổ chi phí vào lứa nuôi")
    public ResponseEntity<CashbookEntryResponse> createEntry(
            @PathVariable(required = false) Long farmId,
            @RequestBody CashbookEntryRequest request) {

        Long tenantId = SecurityUtils.getCurrentTenantId() != null ? SecurityUtils.getCurrentTenantId() : 1L;
        Long targetFarmId = (farmId != null && farmId > 0) ? farmId : 1L;
        Long effectiveBranchId = farmSecurity.resolveEffectiveBranchId(targetFarmId, request.getBranchId());

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Số tiền phiếu thu/chi phải lớn hơn 0");
        }

        boolean isIncome = "INCOME".equalsIgnoreCase(request.getType());
        String defaultCode = (isIncome ? "PT-" : "PC-") + LocalDate.now().toString().replace("-", "") + "-" + (System.currentTimeMillis() % 10000);
        String code = StringUtils.hasText(request.getSlipCode()) ? request.getSlipCode().trim().toUpperCase() : defaultCode;

        FarmExpense expense = FarmExpense.builder()
                .tenantId(tenantId)
                .farmId(targetFarmId)
                .branchId(effectiveBranchId != null ? effectiveBranchId : 1L)
                .costCategoryId(1L)
                .expenseCode(code)
                .expenseSource(isIncome ? "INCOME" : "MANUAL_EXPENSE")
                .livestockGroupId(request.getAllocatedCycleId())
                .expenseDate(request.getDate() != null ? request.getDate() : LocalDate.now())
                .amount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                .unitCostEligible(request.getAllocatedCycleId() != null)
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "TIEN_MAT")
                .recipientName(request.getTargetPerson())
                .notes(request.getNotes())
                .status("CONFIRMED")
                .createdAt(Instant.now())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        expense = farmExpenseRepository.save(expense);

        CashbookEntryResponse response = CashbookEntryResponse.builder()
                .id(expense.getId())
                .slipCode(expense.getExpenseCode())
                .type(isIncome ? "INCOME" : "EXPENSE")
                .date(expense.getExpenseDate())
                .category(request.getCategory() != null ? request.getCategory() : (isIncome ? "Thu nội bộ" : "Chi vận hành"))
                .amount(expense.getAmount())
                .paymentMethod(expense.getPaymentMethod())
                .targetPerson(expense.getRecipientName())
                .allocatedCycleId(expense.getLivestockGroupId())
                .isLocked(false)
                .notes(expense.getNotes())
                .createdAt(expense.getCreatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyAuthority('cashbook.create', 'PERM_FINANCE_EXPENSE') or hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_FARM_OWNER', 'ROLE_ACCOUNTANT')")
    @Operation(summary = "Xóa phiếu thu chi thủ công (khóa không cho xóa phiếu tự động sinh từ hệ thống)")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        FarmExpense exp = farmExpenseRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Không tìm thấy phiếu #" + id));

        // Khóa xóa phiếu tự động sinh từ Hóa đơn mua hoặc Đơn bán hàng
        if (exp.getReferenceId() != null || "SALES_HARVEST".equalsIgnoreCase(exp.getExpenseSource()) || "PURCHASE_INVOICE".equalsIgnoreCase(exp.getExpenseSource())) {
            throw new BusinessException("LOCKED_RECORD", "Phiếu này được sinh tự động từ phân hệ Mua hàng / Bán hàng. Bạn không thể xóa trực tiếp trên Sổ quỹ!");
        }

        farmExpenseRepository.delete(exp);
        return ResponseEntity.noContent().build();
    }
}
