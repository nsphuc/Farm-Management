package com.farmsaas.modules.finance.service;

import com.farmsaas.modules.finance.dto.DebtAgingReportDto;
import com.farmsaas.modules.finance.dto.DebtPaymentRequest;
import com.farmsaas.modules.finance.dto.DebtRecordRequest;
import com.farmsaas.modules.finance.dto.DebtRecordResponse;
import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DebtService {

    DebtRecordResponse createDebt(Long farmId, DebtRecordRequest request);

    DebtRecordResponse recordPayment(Long farmId, Long debtId, DebtPaymentRequest request);

    DebtRecordResponse getDebtById(Long farmId, Long id);

    Page<DebtRecordResponse> searchDebts(Long farmId, Long partnerId, DebtType debtType, DebtStatus status, Pageable pageable);

    DebtAgingReportDto getAgingReport(Long farmId);

    void deleteDebt(Long farmId, Long id);
}
