package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentTransactionRequest {

    private Long partnerId;
    private Long salesOrderId;
    private Long debtRecordId;

    @NotBlank(message = "Loại giao dịch thanh toán không được để trống")
    @Pattern(regexp = "RECEIPT|PAYMENT|REFUND", message = "paymentType phải là RECEIPT, PAYMENT hoặc REFUND")
    private String paymentType;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    @Pattern(regexp = "CASH|BANK_TRANSFER|VIETQR|E_WALLET|DEBT_OFFSET",
            message = "paymentMethod phải là CASH, BANK_TRANSFER, VIETQR, E_WALLET hoặc DEBT_OFFSET")
    private String paymentMethod;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền thanh toán phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Ngày thanh toán không được để trống")
    private LocalDate paymentDate;

    private String referenceCode;
    private String qrTransferContent;
    private String proofImageUrl;
    private String notes;

    @Valid
    private List<PaymentAllocationItemRequest> allocations;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentAllocationItemRequest {

        @NotNull(message = "Khoản nợ không được để trống")
        private Long debtRecordId;

        @NotNull(message = "Số tiền phân bổ không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền phân bổ phải lớn hơn 0")
        private BigDecimal allocatedAmount;

        private String notes;
    }
}
