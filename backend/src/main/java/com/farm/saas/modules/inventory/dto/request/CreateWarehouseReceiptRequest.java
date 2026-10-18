package com.farm.saas.modules.inventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseReceiptRequest {

    @NotNull(message = "Kho nhận hàng không được để trống")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu tối đa 50 ký tự")
    private String receiptCode;

    @NotBlank(message = "Loại phiếu nhập không được để trống")
    @Pattern(regexp = "^(PURCHASE|HARVEST_RETURN|INTERNAL_TRANSFER|ADJUSTMENT)$",
            message = "Loại phiếu nhập phải là PURCHASE, HARVEST_RETURN, INTERNAL_TRANSFER hoặc ADJUSTMENT")
    private String receiptType;

    private Long partnerId;

    @NotNull(message = "Ngày nhập kho không được để trống")
    private LocalDate receiptDate;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String notes;

    @NotEmpty(message = "Danh sách chi tiết nhập kho không được để trống")
    @Valid
    private List<ReceiptItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItemRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotBlank(message = "Số lô không được để trống")
        @Size(max = 50, message = "Số lô tối đa 50 ký tự")
        private String batchNumber;

        private LocalDate expiryDate;

        private String enteredUnit;

        @Positive(message = "Số lượng nhập phải lớn hơn 0")
        private BigDecimal enteredQuantity;

        private BigDecimal conversionFactor;

        @Positive(message = "Số lượng quy chuẩn phải lớn hơn 0")
        private BigDecimal quantity;

        @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
        private BigDecimal unitPrice;

        private BigDecimal totalPrice;

        private String storageBinCode;
    }
}
