package com.farm.saas.modules.organization.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO yêu cầu tạo mới Trang trại.
 * TUYỆT ĐỐI KHÔNG nhận tenantId hay status từ client để đảm bảo tính an toàn và cô lập Tenant.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmCreateRequest {

    @NotBlank(message = "Mã trang trại không được để trống")
    @Size(max = 50, message = "Mã trang trại không vượt quá 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_\\-]+$", message = "Mã trang trại chỉ bao gồm chữ cái, số, dấu gạch nối và gạch dưới")
    private String code;

    @NotBlank(message = "Tên trang trại không được để trống")
    @Size(max = 255, message = "Tên trang trại không vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Loại hình trang trại không được để trống")
    @Pattern(regexp = "CROP|LIVESTOCK|MIXED|AQUACULTURE", message = "Loại hình trang trại phải là một trong các giá trị: CROP, LIVESTOCK, MIXED, AQUACULTURE")
    private String farmType;

    @NotNull(message = "Tổng diện tích không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Tổng diện tích phải lớn hơn hoặc bằng 0")
    private BigDecimal totalAreaM2;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90.0 đến 90.0")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90.0 đến 90.0")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180.0 đến 180.0")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180.0 đến 180.0")
    private BigDecimal longitude;

    @Size(max = 500, message = "Địa chỉ không vượt quá 500 ký tự")
    private String address;

    private Long managerUserId;
}
