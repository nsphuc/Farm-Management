package com.farmsaas.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateZoneLocationRequest {

    @NotBlank(message = "Tên vị trí / ô không được để trống")
    @Size(max = 255, message = "Tên vị trí tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại vị trí không được để trống")
    private String locationType;

    private BigDecimal areaM2;
    private Integer capacity;
    private String status;
}
