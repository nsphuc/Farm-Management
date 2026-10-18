package com.farm.saas.modules.hr.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDetailResponse {
    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long userId;
    private String username;
    private String employeeCode;
    private String fullName;
    private String phone;
    private String email;
    private String idCardNumber;
    private LocalDate dateOfBirth;
    private String position;
    private String department;
    private LocalDate joinedDate;
    private BigDecimal baseSalary;
    private BigDecimal hourlyRate;
    private String contractType;
    private BigDecimal annualLeaveQuota;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
