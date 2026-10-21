package com.farm.saas.modules.hr.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {
    private Long farmId;

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$", message = "Số điện thoại di động Việt Nam không hợp lệ")
    private String phone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số CMND/CCCD không được để trống")
    @Pattern(regexp = "^([0-9]{9}|[0-9]{12})$", message = "Số CMND phải gồm 9 số hoặc CCCD gồm 12 chữ số")
    private String idCardNumber;

    private LocalDate dateOfBirth;
    private LocalDate joinedDate;

    @NotBlank(message = "Chức vụ không được để trống")
    private String position;

    // Không bắt buộc @NotBlank, tự động suy diễn ngầm từ position
    private String department;

    @DecimalMin(value = "0.00", message = "Lương cơ bản không được âm")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.00", message = "Lương theo giờ không được âm")
    private BigDecimal hourlyRate;

    @NotBlank(message = "Loại hợp đồng không được để trống")
    @Pattern(regexp = "FULL_TIME|PART_TIME|SEASONAL|INTERN", message = "contractType phải là FULL_TIME, PART_TIME, SEASONAL hoặc INTERN")
    private String contractType;

    @Pattern(regexp = "ACTIVE|ON_LEAVE|RESIGNED|TERMINATED", message = "status phải là ACTIVE, ON_LEAVE, RESIGNED hoặc TERMINATED")
    private String status;

    @DecimalMin(value = "0.0", message = "Quỹ phép năm không được âm")
    private BigDecimal annualLeaveQuota;
}
