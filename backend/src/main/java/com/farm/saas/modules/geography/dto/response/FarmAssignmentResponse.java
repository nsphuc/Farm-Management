package com.farm.saas.modules.geography.dto.response;

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
public class FarmAssignmentResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private Long userId;
    private Long employeeId;
    private String username;
    private String userFullName;
    private String department;
    private String position;
    private String employeeCode;
    private String roleInFarm;
    private LocalDate assignedFrom;
    private LocalDate assignedTo;
    private Boolean isActive;
    private Instant createdAt;
}
