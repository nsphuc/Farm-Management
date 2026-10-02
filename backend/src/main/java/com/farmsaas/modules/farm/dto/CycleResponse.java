package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.OperationalCycle;
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
public class CycleResponse {

    private Long id;
    private Long farmId;
    private Long tenantId;
    private String name;
    private Integer fiscalYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static CycleResponse fromEntity(OperationalCycle entity) {
        if (entity == null) return null;
        return CycleResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .fiscalYear(entity.getFiscalYear())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
