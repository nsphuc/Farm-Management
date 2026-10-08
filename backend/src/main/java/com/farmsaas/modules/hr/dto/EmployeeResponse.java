package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.ContractType;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private Long userId;
    private String userEmail;
    private String employeeCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String nationalId;
    private String phone;
    private String email;
    private String address;
    private String department;
    private String position;
    private ContractType contractType;
    private BigDecimal basicSalary;
    private BigDecimal dailyAllowance;
    private LocalDate joinDate;
    private LocalDate terminationDate;
    private EmployeeStatus status;
    private String bankAccount;
    private String bankName;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private java.time.Instant createdAt;
    private java.time.Instant updatedAt;
}
