package com.farmsaas.modules.traceability.dto;

import com.farmsaas.modules.traceability.entity.LabelPrintLog;
import com.farmsaas.modules.traceability.entity.enums.LabelSize;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelPrintLogResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long productBatchId;
    private String batchCode;
    private Long printedByUserId;
    private String printedByUserName;
    private LabelSize labelSize;
    private Integer printQuantity;
    private Instant printedAt;
    private String printerModel;

    public static LabelPrintLogResponse fromEntity(LabelPrintLog entity) {
        if (entity == null) return null;
        return LabelPrintLogResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .productBatchId(entity.getProductBatchId())
                .batchCode(entity.getProductBatch() != null ? entity.getProductBatch().getBatchCode() : null)
                .printedByUserId(entity.getPrintedByUserId())
                .printedByUserName(entity.getPrintedByUser() != null ? entity.getPrintedByUser().getFullName() : null)
                .labelSize(entity.getLabelSize())
                .printQuantity(entity.getPrintQuantity())
                .printedAt(entity.getPrintedAt())
                .printerModel(entity.getPrinterModel())
                .build();
    }
}
