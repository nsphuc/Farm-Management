package com.farm.saas.modules.platform.dto.request;

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
public class UpdateTenantStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "^(ACTIVE|SUSPENDED|INACTIVE)$", message = "Trạng thái phải là ACTIVE, SUSPENDED hoặc INACTIVE")
    private String status;
}
