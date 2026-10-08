package com.farmsaas.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderItemDto {

    private Long id;
    private Long batchId;
    private Long seasonId;
    private Long herdId;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    @NotNull(message = "Số lượng kg không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng phải > 0")
    private BigDecimal quantityKg;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
    private BigDecimal unitPrice;

    private BigDecimal subtotal;
}
