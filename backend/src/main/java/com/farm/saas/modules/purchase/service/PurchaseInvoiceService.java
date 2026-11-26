package com.farm.saas.modules.purchase.service;

import com.farm.saas.modules.purchase.dto.request.CreatePurchaseInvoiceRequest;
import com.farm.saas.modules.purchase.dto.request.PayDebtRequest;
import com.farm.saas.modules.purchase.dto.response.PurchaseInvoiceDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PurchaseInvoiceService {

    Page<PurchaseInvoiceDetailResponse> getInvoices(Long farmId, Long branchId, Long supplierId, String invoiceType, String paymentStatus, Pageable pageable);

    PurchaseInvoiceDetailResponse getInvoiceById(Long id);

    PurchaseInvoiceDetailResponse createInvoice(Long farmId, CreatePurchaseInvoiceRequest request);

    PurchaseInvoiceDetailResponse payDebt(Long id, PayDebtRequest request);
}
