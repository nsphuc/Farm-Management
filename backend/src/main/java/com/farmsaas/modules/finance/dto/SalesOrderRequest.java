package com.farmsaas.modules.finance.dto;

import com.farmsaas.modules.finance.entity.enums.DeliveryStatus;
import com.farmsaas.modules.finance.entity.enums.PaymentStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderRequest {

    private String orderCode;

    @NotNull(message = "Đối tác khách hàng không được để trống")
    private Long partnerId;

    @NotNull(message = "Ngày đặt hàng không được để trống")
    private LocalDate orderDate;

    private BigDecimal discountAmount;
    private BigDecimal vatAmount;
    private BigDecimal paidAmount;
    private PaymentStatus paymentStatus;
    private DeliveryStatus deliveryStatus;
    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng không được để trống")
    private List<SalesOrderItemDto> items;
}
