package com.farm.saas.modules.platform.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantRequest {

    @NotBlank(message = "Mã khách thuê không được để trống")
    @Size(max = 50, message = "Mã khách thuê tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên khách thuê không được để trống")
    @Size(max = 150, message = "Tên khách thuê tối đa 150 ký tự")
    private String name;

    @NotBlank(message = "Subdomain không được để trống")
    @Size(max = 50, message = "Subdomain tối đa 50 ký tự")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang")
    private String subdomain;

    @NotBlank(message = "Gói thuê bao không được để trống")
    @Pattern(regexp = "^(FREE|STARTER|PROFESSIONAL|ENTERPRISE)$", message = "Gói thuê bao phải là FREE, STARTER, PROFESSIONAL hoặc ENTERPRISE")
    private String planType;

    @NotNull(message = "Giới hạn số trang trại không được để trống")
    @Min(value = 1, message = "Giới hạn số trang trại phải lớn hơn 0")
    private Integer maxFarms;

    @NotNull(message = "Giới hạn số người dùng không được để trống")
    @Min(value = 1, message = "Giới hạn số người dùng phải lớn hơn 0")
    private Integer maxUsers;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate validFrom;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate validTo;

    @NotBlank(message = "Email quản trị viên không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String adminEmail;

    @NotBlank(message = "Họ tên quản trị viên không được để trống")
    private String adminFullName;

    private String adminPassword;
}
