package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchTargetsRequest {

    @DecimalMin(value = "0.5", message = "FCR mục tiêu không hợp lệ")
    private BigDecimal fcrTarget;

    @DecimalMin(value = "0", message = "Chi phí/kg mục tiêu không âm")
    private BigDecimal costPerKgTarget;

    @DecimalMin(value = "0", message = "Tỷ lệ hao hụt tối đa không âm")
    private BigDecimal maxMortalityPct;

    @DecimalMin(value = "0", message = "Trọng lượng xuất chuồng kỳ vọng không âm")
    private BigDecimal expectedHarvestWeightKg;
}
