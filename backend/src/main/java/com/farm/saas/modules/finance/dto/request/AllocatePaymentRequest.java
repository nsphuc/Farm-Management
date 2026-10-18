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
public class AllocatePaymentRequest {

    @NotNull(message = "Khoản nợ không được để trống")
    private Long debtRecordId;

    @NotNull(message = "Số tiền phân bổ không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phân bổ phải lớn hơn 0")
    private BigDecimal allocatedAmount;

    private String notes;
}
