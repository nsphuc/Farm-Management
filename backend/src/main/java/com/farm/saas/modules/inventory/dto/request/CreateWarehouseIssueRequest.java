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
public class CreateWarehouseIssueRequest {

    @NotNull(message = "Kho xuất không được để trống")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu tối đa 50 ký tự")
    private String issueCode;

    @NotBlank(message = "Loại phiếu xuất không được để trống")
    @Pattern(regexp = "^(PRODUCTION_BACKFLUSH|INTERNAL_USE|SALE_FULFILLMENT|DAMAGE_DISPOSAL|TRANSFER)$",
            message = "Loại phiếu xuất phải là PRODUCTION_BACKFLUSH, INTERNAL_USE, SALE_FULFILLMENT, DAMAGE_DISPOSAL hoặc TRANSFER")
    private String issueType;

    @Size(max = 150, message = "Tên người nhận tối đa 150 ký tự")
    private String receiverName;

    private Long seasonId;

    @NotNull(message = "Ngày xuất kho không được để trống")
    private LocalDate issueDate;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String notes;

    @NotEmpty(message = "Danh sách chi tiết xuất kho không được để trống")
    @Valid
    private List<IssueItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueItemRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotBlank(message = "Số lô không được để trống")
        @Size(max = 50, message = "Số lô tối đa 50 ký tự")
        private String batchNumber;

        private String enteredUnit;

        private BigDecimal enteredQuantity;

        private BigDecimal conversionFactor;

        @NotNull(message = "Số lượng xuất không được để trống")
        @Positive(message = "Số lượng xuất phải lớn hơn 0")
        private BigDecimal quantity;

        @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
        private BigDecimal unitPrice;

        private BigDecimal totalPrice;
    }
}
