package com.farm.saas.modules.quality.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicTraceabilityResponse {
    private String traceabilityCode;
    private String productName;
    private String qualityGrade;
    private String batchCode;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private String storageConditions;
    private String batchStatus;
    @JsonProperty("isRecalled")
    private boolean isRecalled;
    private String recallReason;
    private Instant recalledAt;
    private Long scanCount;
    private Instant lastScannedAt;

    private Object enterprise;
    private Object certifications;
    private Object farmingTimeline;
    private Object harvestInfo;
    private Object qcInspection;
}
