package com.farm.saas.modules.organization.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO yêu cầu tạo mới Vị trí chi tiết trong phân khu (ZoneLocation: Luống, Ô đất, Dãy chuồng).
 * TUYỆT ĐỐI KHÔNG nhận tenantId hay status từ client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneLocationCreateRequest {

    @NotBlank(message = "Mã vị trí không được để trống")
    @Size(max = 50, message = "Mã vị trí không vượt quá 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_\\-]+$", message = "Mã vị trí chỉ bao gồm chữ cái, số, dấu gạch nối và gạch dưới")
    private String code;

    @NotBlank(message = "Tên vị trí không được để trống")
    @Size(max = 150, message = "Tên vị trí không vượt quá 150 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự")
    private String description;
}
