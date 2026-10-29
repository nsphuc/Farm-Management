package com.farm.saas.modules.hr.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateEmployeeRequest {
    private Long farmId;
    private Long assignedZoneId;
    private Long zoneId;
    private String roleInFarm;

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    private String fullName;

    @Pattern(regexp = "^$|^(0|\\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$", message = "Số điện thoại di động Việt Nam không hợp lệ")
    private String phone;

    @Email(message = "Địa chỉ email không đúng định dạng")
    private String email;

    @Pattern(regexp = "^$|^([0-9]{9}|[0-9]{12})$", message = "Số CMND phải gồm 9 số hoặc CCCD gồm 12 chữ số")
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

    @Pattern(regexp = "^$|ACTIVE|ON_LEAVE|RESIGNED|TERMINATED", message = "status phải là ACTIVE, ON_LEAVE, RESIGNED hoặc TERMINATED")
    private String status;

    @DecimalMin(value = "0.0", message = "Quỹ phép năm không được âm")
    private BigDecimal annualLeaveQuota;

    public Long getAssignedZoneId() {
        return assignedZoneId != null ? assignedZoneId : zoneId;
    }

    public void setZoneId(Long zoneId) {
        this.zoneId = zoneId;
        if (this.assignedZoneId == null) {
            this.assignedZoneId = zoneId;
        }
    }

    public void setPhone(String phone) {
        this.phone = (phone != null && !phone.trim().isEmpty()) ? phone.trim() : null;
    }

    public void setEmail(String email) {
        this.email = (email != null && !email.trim().isEmpty()) ? email.trim() : null;
    }

    public void setIdCardNumber(String idCardNumber) {
        this.idCardNumber = (idCardNumber != null && !idCardNumber.trim().isEmpty()) ? idCardNumber.trim() : null;
    }
}
