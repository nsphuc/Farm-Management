package com.farm.saas.modules.livestock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogResponse {

    private Long id;
    private Long farmId;
    private Long barnId;
    private String barnName;
    private Long batchId;
    private String batchCode;
    private LocalDate logDate;
    private String entryType; // FEED, MEDICINE, MORTALITY, SAMPLE_ENV
    private String description;
    private String detailsJson;
    private Boolean isAlert;
    private String alertReason;
    private Instant createdAt;
    private String createdByFullName;
}
