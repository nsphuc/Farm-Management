package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.DebtStatus;
import com.farmsaas.modules.finance.entity.enums.DebtType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtRecordRequest {

    @NotNull(message = "Đối tác không được để trống")
    private Long partnerId;

    private Long orderId;

    @NotNull(message = "Loại công nợ không được để trống")
    private DebtType debtType;

    @NotNull(message = "Số tiền gốc không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal originalAmount;

    private BigDecimal paidAmount;

    @NotNull(message = "Hạn thanh toán không được để trống")
    private LocalDate dueDate;

    private DebtStatus status;
    private String notes;
}
