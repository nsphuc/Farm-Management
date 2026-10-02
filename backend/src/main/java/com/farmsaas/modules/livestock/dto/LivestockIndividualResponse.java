package com.farmsaas.modules.livestock.dto;

import com.farmsaas.modules.livestock.entity.LivestockIndividual;
import com.farmsaas.modules.livestock.entity.enums.Gender;
import com.farmsaas.modules.livestock.entity.enums.HealthStatus;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockIndividualResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private String rfidTagCode;
    private Long groupId;
    private String groupCode;
    private LivestockSpecies species;
    private Gender gender;
    private LocalDate birthDate;
    private String motherTagCode;
    private String fatherTagCode;
    private BigDecimal currentWeightKg;
    private HealthStatus healthStatus;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static LivestockIndividualResponse fromEntity(LivestockIndividual entity) {
        if (entity == null) return null;
        LivestockSpecies spec = null;
        if (entity.getGroup() != null && entity.getGroup().getBreed() != null) {
            spec = entity.getGroup().getBreed().getSpecies();
        }

        return LivestockIndividualResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarm() != null ? entity.getFarm().getName() : null)
                .zoneId(entity.getZoneId())
                .zoneName(entity.getZone() != null ? entity.getZone().getName() : null)
                .rfidTagCode(entity.getRfidTagCode())
                .groupId(entity.getGroupId())
                .groupCode(entity.getGroup() != null ? entity.getGroup().getGroupCode() : null)
                .species(spec)
                .gender(entity.getGender())
                .birthDate(entity.getBirthDate())
                .motherTagCode(entity.getMotherTagCode())
                .fatherTagCode(entity.getFatherTagCode())
                .currentWeightKg(entity.getCurrentWeightKg())
                .healthStatus(entity.getHealthStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
