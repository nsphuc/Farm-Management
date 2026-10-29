package com.farm.saas.modules.geography.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateZoneLocationRequest {

    @NotBlank(message = "Tên vị trí / lô không được để trống")
    private String name;

    private String description;
    private String status;
    private BigDecimal areaM2;
    private Integer capacity;
}
