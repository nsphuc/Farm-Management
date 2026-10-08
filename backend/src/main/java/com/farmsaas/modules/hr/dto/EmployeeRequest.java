package com.farmsaas.modules.hr.dto;

import com.farmsaas.modules.hr.entity.enums.ContractType;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {

    private Long userId;

    @NotBlank(message = "Mã nhân viên không được để trống")
    private String employeeCode;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private LocalDate dateOfBirth;
    private String gender;
    private String nationalId;
    private String phone;
    private String email;
    private String address;
    private String department;
    private String position;

    @NotNull(message = "Loại hợp đồng không được để trống")
    private ContractType contractType;

    private BigDecimal basicSalary;
    private BigDecimal dailyAllowance;

    @NotNull(message = "Ngày vào làm không được để trống")
    private LocalDate joinDate;

    private LocalDate terminationDate;
    private EmployeeStatus status;
    private String bankAccount;
    private String bankName;
    private String emergencyContactName;
    private String emergencyContactPhone;
}
