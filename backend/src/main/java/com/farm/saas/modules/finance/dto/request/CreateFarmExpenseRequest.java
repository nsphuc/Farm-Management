package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFarmExpenseRequest {

    @NotNull(message = "Khoản mục chi phí không được để trống")
    private Long costCategoryId;

    private String expenseCode;

    @Pattern(regexp = "MANUAL|INVENTORY_BACKFLUSH|PAYROLL_ALLOCATION|UTILITY_BILL",
            message = "expenseSource phải là MANUAL, INVENTORY_BACKFLUSH, PAYROLL_ALLOCATION hoặc UTILITY_BILL")
    private String expenseSource;

    private Long referenceId;

    private Long seasonId;

    private Long livestockGroupId;

    @NotNull(message = "Ngày phát sinh chi phí không được để trống")
    private LocalDate expenseDate;

    @NotNull(message = "Số tiền chi phí không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền chi phí phải lớn hơn 0")
    private BigDecimal amount;

    @Builder.Default
    private Boolean unitCostEligible = true;

    @Pattern(regexp = "CASH|BANK_TRANSFER|TRADE_CREDIT",
            message = "paymentMethod phải là CASH, BANK_TRANSFER hoặc TRADE_CREDIT")
    private String paymentMethod;

    private String recipientName;

    private String receiptPhotoUrl;

    private String notes;

    @Pattern(regexp = "DRAFT|CONFIRMED|CANCELLED",
            message = "status phải là DRAFT, CONFIRMED hoặc CANCELLED")
    private String status;
}
