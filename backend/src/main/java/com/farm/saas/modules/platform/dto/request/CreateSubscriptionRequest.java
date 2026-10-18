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
public class CreateSubscriptionRequest {

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
}
