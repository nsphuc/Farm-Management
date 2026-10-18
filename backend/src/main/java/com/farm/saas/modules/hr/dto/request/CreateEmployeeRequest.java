package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeRequest {

    private Long farmId;

    @NotBlank(message = "Mã nhân viên không được để trống")
    private String employeeCode;

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    private String fullName;

    private String phone;
    private String email;
    private String idCardNumber;
    private LocalDate dateOfBirth;
    private String position;
    private String department;

    @NotNull(message = "Ngày gia nhập không được để trống")
    private LocalDate joinedDate;

    @DecimalMin(value = "0.00", message = "Lương cơ bản không được âm")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.00", message = "Lương theo giờ không được âm")
    private BigDecimal hourlyRate;

    @NotBlank(message = "Loại hợp đồng không được để trống")
    @Pattern(regexp = "FULL_TIME|PART_TIME|SEASONAL|INTERN", message = "contractType phải là FULL_TIME, PART_TIME, SEASONAL hoặc INTERN")
    private String contractType;

    @DecimalMin(value = "0.0", message = "Quỹ phép năm không được âm")
    private BigDecimal annualLeaveQuota;
}
