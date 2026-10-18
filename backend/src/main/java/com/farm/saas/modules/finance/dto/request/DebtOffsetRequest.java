package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtOffsetRequest {

    @NotNull(message = "Đối tác không được để trống")
    private Long partnerId;

    @NotNull(message = "Khoản nợ phải thu không được để trống")
    private Long receivableDebtId;

    @NotNull(message = "Khoản nợ phải trả không được để trống")
    private Long payableDebtId;

    @NotNull(message = "Số tiền cấn trừ không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền cấn trừ phải lớn hơn 0")
    private BigDecimal offsetAmount;

    private String notes;
}
