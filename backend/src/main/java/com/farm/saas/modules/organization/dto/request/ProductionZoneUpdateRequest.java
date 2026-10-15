package com.farm.saas.modules.organization.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO yêu cầu cập nhật Phân khu sản xuất.
 * TUYỆT ĐỐI KHÔNG nhận tenantId hay status từ client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionZoneUpdateRequest {

    @NotBlank(message = "Tên phân khu không được để trống")
    @Size(max = 255, message = "Tên phân khu không vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Loại phân khu không được để trống")
    @Pattern(regexp = "GREENHOUSE|OPEN_FIELD|BARN|POND|STORAGE|ISOLATION", message = "Loại phân khu phải là một trong các giá trị: GREENHOUSE, OPEN_FIELD, BARN, POND, STORAGE, ISOLATION")
    private String zoneType;

    @NotNull(message = "Diện tích phân khu không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Diện tích phân khu phải lớn hơn hoặc bằng 0")
    private BigDecimal areaM2;

    @Size(max = 100, message = "Loại đất không vượt quá 100 ký tự")
    private String soilType;

    @Size(max = 100, message = "Nguồn nước không vượt quá 100 ký tự")
    private String waterSource;
}
