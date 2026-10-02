package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.LivestockEvent;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockEventResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private TargetType targetType;
    private Long targetId;
    private LivestockEventType eventType;
    private Instant eventDate;
    private String detailsJson;
    private Long veterinarianUserId;
    private String veterinarianUserName;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static LivestockEventResponse fromEntity(LivestockEvent entity) {
        if (entity == null) return null;
        return LivestockEventResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .eventType(entity.getEventType())
                .eventDate(entity.getEventDate())
                .detailsJson(entity.getDetailsJson())
                .veterinarianUserId(entity.getVeterinarianUserId())
                .veterinarianUserName(entity.getVeterinarianUser() != null ? entity.getVeterinarianUser().getFullName() : null)
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
