package com.farm.saas.modules.livestock.dto.request;

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
public class SplitBatchRequest {

    @NotNull(message = "Chuồng đích không được để trống")
    private Long targetBarnId;

    @NotNull(message = "Số lượng tách đàn không được để trống")
    @Positive(message = "Số lượng tách đàn phải > 0")
    private Integer splitQuantity;

    private String notes;
}
