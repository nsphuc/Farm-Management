package com.farm.saas.modules.organization.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO yêu cầu cập nhật Vị trí chi tiết trong phân khu.
 * TUYỆT ĐỐI KHÔNG nhận tenantId hay status từ client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneLocationUpdateRequest {

    @NotBlank(message = "Tên vị trí không được để trống")
    @Size(max = 150, message = "Tên vị trí không vượt quá 150 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự")
    private String description;
}
