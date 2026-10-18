package com.farm.saas.modules.finance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
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
public class CreateSalesDeliveryRequest {

    @NotNull(message = "Đơn hàng bán không được để trống")
    private Long salesOrderId;

    private String deliveryCode;

    @NotNull(message = "Ngày giao hàng không được để trống")
    private LocalDate deliveryDate;

    private Long logisticsPartnerId;
    private String driverName;
    private String vehiclePlate;
    private String receiverName;
    private String shippingAddress;
    private String notes;

    @NotEmpty(message = "Danh sách xuất giao không được để trống")
    @Valid
    private List<SalesDeliveryItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesDeliveryItemRequest {

        @NotNull(message = "Dòng đơn hàng không được để trống")
        private Long salesOrderItemId;

        @NotNull(message = "Lô thành phẩm không được để trống")
        private Long productBatchId;

        @NotNull(message = "Số lượng xuất giao không được để trống")
        @DecimalMin(value = "0.01", message = "Số lượng xuất giao phải lớn hơn 0")
        private BigDecimal quantity;

        private String notes;
    }
}
