package com.farmsaas.modules.traceability.service;

import com.farmsaas.modules.traceability.dto.*;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductBatchService {

    ProductBatchResponse createHarvestBatch(Long farmId, HarvestBatchRequest request);

    ProductBatchResponse approveBatch(Long farmId, Long batchId);

    ProductBatchResponse rejectBatch(Long farmId, Long batchId, RejectBatchRequest request);

    ProductBatchResponse recallBatch(Long farmId, Long batchId, RecallBatchRequest request);

    LabelPrintLogResponse recordPrintLog(Long farmId, Long batchId, PrintLabelRequest request);

    ProductBatchResponse getBatchById(Long farmId, Long batchId);

    Page<ProductBatchResponse> searchBatches(
            Long farmId,
            ProductBatchStatus status,
            Long seasonId,
            Long livestockGroupId,
            String keyword,
            Pageable pageable
    );

    Page<LabelPrintLogResponse> getPrintLogs(Long farmId, Long batchId, Pageable pageable);
}
