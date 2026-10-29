package com.farm.saas.modules.hr.dto.request;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShiftAssignmentRequest {

    private Long employeeId;
    private Long shiftId;
    private LocalDate workDate;
    private String status; // 'SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED'
}
