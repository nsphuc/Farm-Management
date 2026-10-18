package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeighInRequest {

    @NotBlank(message = "Loại đối tượng cân không được để trống")
    @Pattern(regexp = "^(GROUP|INDIVIDUAL)$", message = "Loại đối tượng cân phải là GROUP hoặc INDIVIDUAL")
    private String targetType;

    private Long individualId;

    private Long groupId;

    @NotNull(message = "Ngày ghi nhận cân không được để trống")
    private LocalDate recordDate;

    @NotNull(message = "Cân nặng không được để trống")
    @Positive(message = "Cân nặng phải lớn hơn 0")
    private BigDecimal weightKg;

    private Long recordedByUserId;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String notes;
}
