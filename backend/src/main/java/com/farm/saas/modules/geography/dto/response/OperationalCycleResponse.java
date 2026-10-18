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
public class OperationalCycleResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private String name;
    private Integer fiscalYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Instant createdAt;
}
