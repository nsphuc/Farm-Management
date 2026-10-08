package com.farmsaas.modules.finance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAllocationRequest {

    @NotNull(message = "Khoản chi phí gốc không được để trống")
    private Long expenseId;

    private Long zoneId;
    private Long seasonId;

    @NotNull(message = "Tỷ lệ phân bổ không được để trống")
    @DecimalMin(value = "0.0001", message = "Tỷ lệ phân bổ phải > 0")
    @DecimalMax(value = "1.0000", message = "Tỷ lệ phân bổ không được vượt quá 100%")
    private BigDecimal allocationRatio;

    private BigDecimal allocatedAmount;
    private String notes;
}
