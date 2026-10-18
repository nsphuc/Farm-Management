package com.farm.saas.modules.quality.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestRecordDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private String harvestCode;
    private LocalDate harvestDate;
    private String sourceType;
    private Long seasonId;
    private String seasonCode;
    private String cropTypeName;
    private Long livestockGroupId;
    private String groupCode;
    private BigDecimal quantity;
    private String unit;
    private String qualityGrade;
    private Long harvestedByUserId;
    private String harvestedByName;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
