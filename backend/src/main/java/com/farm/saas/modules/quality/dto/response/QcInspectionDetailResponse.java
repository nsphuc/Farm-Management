package com.farm.saas.modules.quality.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QcInspectionDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long productBatchId;
    private String batchCode;
    private String productName;
    private String inspectionCode;
    private LocalDate inspectionDate;
    private Long inspectorUserId;
    private String inspectorName;
    private BigDecimal sampleSize;
    private String sampleUnit;
    private String overallResult;
    private String notes;
    private List<QcInspectionItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QcInspectionItemResponse {
        private Long id;
        private String parameterName;
        private String standardThreshold;
        private String measuredValue;
        private Boolean isPassed;
        private String notes;
    }
}
