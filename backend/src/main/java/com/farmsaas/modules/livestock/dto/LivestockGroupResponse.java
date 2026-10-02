package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockGroupResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private String groupCode;
    private Long breedId;
    private String breedName;
    private LivestockSpecies species;
    private Integer initialQuantity;
    private Integer currentQuantity;
    private LocalDate entryDate;
    private LivestockGroupStatus status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static LivestockGroupResponse fromEntity(LivestockGroup entity) {
        if (entity == null) return null;
        return LivestockGroupResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarm() != null ? entity.getFarm().getName() : null)
                .zoneId(entity.getZoneId())
                .zoneName(entity.getZone() != null ? entity.getZone().getName() : null)
                .groupCode(entity.getGroupCode())
                .breedId(entity.getBreedId())
                .breedName(entity.getBreed() != null ? entity.getBreed().getBreedName() : null)
                .species(entity.getBreed() != null ? entity.getBreed().getSpecies() : null)
                .initialQuantity(entity.getInitialQuantity())
                .currentQuantity(entity.getCurrentQuantity())
                .entryDate(entity.getEntryDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
