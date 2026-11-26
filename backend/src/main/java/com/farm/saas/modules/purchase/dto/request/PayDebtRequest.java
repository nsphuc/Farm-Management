package com.farm.saas.modules.purchase.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayDebtRequest {

    @NotNull(message = "Số tiền trả nợ không được để trống")
    @DecimalMin(value = "1.00", message = "Số tiền trả nợ phải lớn hơn 0")
    private BigDecimal amount;

    private LocalDate paymentDate;
    private String paymentMethod; // BANK_TRANSFER, CASH
    private String notes;
}
