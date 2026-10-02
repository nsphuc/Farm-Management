package com.farmsaas.modules.crop.dto;

import com.farmsaas.modules.crop.entity.FarmingLog;
import com.farmsaas.modules.crop.entity.enums.ActivityType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmingLogResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long seasonId;
    private Instant logDate;
    private String stage;
    private ActivityType activityType;
    private String suppliesUsedJson;
    private String weatherNotes;
    private String notes;
    private Long performedByUserId;
    private String performedByUserName;
    private String imageUrlsJson;
    private Instant createdAt;
    private Instant updatedAt;

    public static FarmingLogResponse fromEntity(FarmingLog entity) {
        if (entity == null) return null;
        return FarmingLogResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .seasonId(entity.getSeasonId())
                .logDate(entity.getLogDate())
                .stage(entity.getStage())
                .activityType(entity.getActivityType())
                .suppliesUsedJson(entity.getSuppliesUsedJson())
                .weatherNotes(entity.getWeatherNotes())
                .notes(entity.getNotes())
                .performedByUserId(entity.getPerformedByUserId())
                .performedByUserName(entity.getPerformedByUser() != null ? entity.getPerformedByUser().getFullName() : null)
                .imageUrlsJson(entity.getImageUrlsJson())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
