package com.farm.saas.modules.finance.service;

import com.farm.saas.modules.finance.dto.request.AllocatePaymentRequest;
import com.farm.saas.modules.finance.dto.request.CreatePaymentTransactionRequest;
import com.farm.saas.modules.finance.dto.request.DebtOffsetRequest;
import com.farm.saas.modules.finance.dto.response.DebtRecordDetailResponse;
import com.farm.saas.modules.finance.dto.response.PaymentAllocationResponse;
import com.farm.saas.modules.finance.dto.response.PaymentTransactionDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DebtAndPaymentService {

    Page<DebtRecordDetailResponse> getDebts(Long farmId, Long partnerId, String debtType, String status, Pageable pageable);

    DebtRecordDetailResponse getDebtById(Long farmId, Long id);

    PaymentTransactionDetailResponse createPayment(Long farmId, CreatePaymentTransactionRequest request);

    PaymentTransactionDetailResponse confirmPayment(Long farmId, Long paymentId);

    PaymentTransactionDetailResponse cancelPayment(Long farmId, Long paymentId, String reason);

    PaymentAllocationResponse allocatePayment(Long farmId, Long paymentId, AllocatePaymentRequest request);

    PaymentTransactionDetailResponse offsetDebts(Long farmId, DebtOffsetRequest request);
}
