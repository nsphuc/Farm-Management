package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.PaymentMethod;
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
public class ExpenseRequest {

    @NotNull(message = "Danh mục chi phí không được để trống")
    private Long categoryId;

    private Long seasonId;
    private Long herdId;
    private String expenseCode;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền chi phí phải lớn hơn 0")
    private BigDecimal amount;

    private PaymentMethod paymentMethod;

    @NotNull(message = "Ngày phát sinh chi phí không được để trống")
    private LocalDate expenseDate;

    private String invoiceNumber;
    private Long recipientPartnerId;
    private Long referenceIssueId;
    private String notes;
}
