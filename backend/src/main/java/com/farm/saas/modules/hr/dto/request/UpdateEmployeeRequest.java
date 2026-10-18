package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {
    private Long farmId;
    private String fullName;
    private String phone;
    private String email;
    private String idCardNumber;
    private String position;
    private String department;

    @DecimalMin(value = "0.00", message = "Lương cơ bản không được âm")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.00", message = "Lương theo giờ không được âm")
    private BigDecimal hourlyRate;

    @Pattern(regexp = "FULL_TIME|PART_TIME|SEASONAL|INTERN", message = "contractType phải là FULL_TIME, PART_TIME, SEASONAL hoặc INTERN")
    private String contractType;

    @Pattern(regexp = "ACTIVE|ON_LEAVE|RESIGNED|TERMINATED", message = "status phải là ACTIVE, ON_LEAVE, RESIGNED hoặc TERMINATED")
    private String status;

    @DecimalMin(value = "0.0", message = "Quỹ phép năm không được âm")
    private BigDecimal annualLeaveQuota;
}
