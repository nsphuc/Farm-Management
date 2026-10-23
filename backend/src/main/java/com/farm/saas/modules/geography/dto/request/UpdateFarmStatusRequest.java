package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFarmStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(?i)(ACTIVE|INACTIVE|MAINTENANCE)$", message = "Trạng thái trang trại phải là ACTIVE, INACTIVE hoặc MAINTENANCE")
    private String status;
}
