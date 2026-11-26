package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineTimelineRequest {

    @NotNull(message = "Ngày tuổi không được để trống")
    @Positive(message = "Ngày tuổi phải > 0")
    private Integer dayAge;

    @NotBlank(message = "Tên vắc-xin / thuốc không được để trống")
    private String vaccineName;

    private String dose;
    private String route;
    private String notes;
    private Long materialId;
}
