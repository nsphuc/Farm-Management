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
public class CreateZoneLocationRequest {

    @NotBlank(message = "Mã vị trí / ô không được để trống")
    @Size(max = 50, message = "Mã vị trí tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên vị trí / ô không được để trống")
    @Size(max = 255, message = "Tên vị trí tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại vị trí không được để trống")
    private String locationType; // O_DAT, LUONG_RAU, CHUONG_NUOI, DAY_CHUONG, NGAN_KHO

    private BigDecimal areaM2;
    private Integer capacity;
    private String status; // EMPTY, OCCUPIED, MAINTENANCE
}
