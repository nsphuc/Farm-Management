package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class CreateSalesOrderRequest {

    @NotNull(message = "Đối tác không được để trống")
    private Long partnerId;

    @NotNull(message = "Ngày đặt hàng không được để trống")
    private LocalDate orderDate;

    private LocalDate deliveryDate;

    @Builder.Default
    @DecimalMin(value = "0.00", message = "Chiết khấu không được âm")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @DecimalMin(value = "0.00", message = "Thuế suất VAT không được âm")
    private BigDecimal vatRate = BigDecimal.ZERO;

    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng không được để trống")
    @Valid
    private List<SalesOrderItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesOrderItemRequest {

        private Long productBatchId;

        @NotBlank(message = "Tên mặt hàng không được để trống")
        private String itemName;

        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "0.01", message = "Số lượng phải lớn hơn 0")
        private BigDecimal quantity;

        @NotBlank(message = "Đơn vị tính không được để trống")
        private String unit;

        @NotNull(message = "Đơn giá không được để trống")
        @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
        private BigDecimal unitPrice;

        @Builder.Default
        @DecimalMin(value = "0.00", message = "Chiết khấu dòng không được âm")
        private BigDecimal discountAmount = BigDecimal.ZERO;
    }
}
