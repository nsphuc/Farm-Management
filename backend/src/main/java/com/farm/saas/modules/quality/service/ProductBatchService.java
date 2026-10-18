package com.farm.saas.modules.quality.service;

import com.farm.saas.modules.quality.dto.request.*;
import com.farm.saas.modules.quality.dto.response.ProductBatchDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductBatchService {
    ProductBatchDetailResponse createProductBatch(Long farmId, CreateProductBatchRequest request);
    Page<ProductBatchDetailResponse> getProductBatches(Long farmId, Pageable pageable);
    ProductBatchDetailResponse getProductBatchById(Long farmId, Long id);
    ProductBatchDetailResponse approveBatch(Long farmId, Long id, ApproveProductBatchRequest request);
    ProductBatchDetailResponse rejectBatch(Long farmId, Long id, RejectProductBatchRequest request);
    ProductBatchDetailResponse recallBatch(Long farmId, Long id, RecallProductBatchRequest request);
    ProductBatchDetailResponse printLabel(Long farmId, Long id, PrintLabelRequest request);
}
