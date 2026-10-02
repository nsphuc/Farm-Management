package com.farmsaas.modules.farm.dto;

import com.farmsaas.modules.farm.entity.FarmAssignment;
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
public class AssignmentResponse {

    private Long id;
    private Long farmId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String roleInFarm;
    private LocalDate assignedFrom;
    private LocalDate assignedTo;
    private Boolean isActive;
    private Instant createdAt;

    public static AssignmentResponse fromEntity(FarmAssignment entity) {
        if (entity == null) return null;
        return AssignmentResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .userId(entity.getUserId())
                .userName(entity.getUser() != null ? entity.getUser().getFullName() : null)
                .userEmail(entity.getUser() != null ? entity.getUser().getEmail() : null)
                .userPhone(entity.getUser() != null ? entity.getUser().getPhone() : null)
                .roleInFarm(entity.getRoleInFarm())
                .assignedFrom(entity.getAssignedFrom())
                .assignedTo(entity.getAssignedTo())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
