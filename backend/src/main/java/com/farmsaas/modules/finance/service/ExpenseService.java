package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.ExpenseRequest;
import com.farmsaas.modules.finance.dto.ExpenseResponse;
import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ExpenseService {

    ExpenseResponse createExpense(Long farmId, ExpenseRequest request);

    ExpenseResponse updateExpense(Long farmId, Long id, ExpenseRequest request);

    ExpenseResponse getExpenseById(Long farmId, Long id);

    Page<ExpenseResponse> searchExpenses(Long farmId, Long categoryId, Long seasonId, Long herdId, PaymentMethod paymentMethod, LocalDate fromDate, LocalDate toDate, String keyword, Pageable pageable);

    ExpenseResponse recordMaterialBackflushExpense(Long farmId, Long issueId, Long seasonId, Long herdId, BigDecimal totalMaterialCost, String issueCode);

    void deleteExpense(Long farmId, Long id);
}
