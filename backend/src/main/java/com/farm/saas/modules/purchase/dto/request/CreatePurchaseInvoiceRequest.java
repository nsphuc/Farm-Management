package com.farm.saas.modules.purchase.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseInvoiceRequest {

    private String invoiceNumber;

    @NotNull(message = "Ngày hóa đơn không được để trống")
    private LocalDate invoiceDate;

    private Long supplierId;
    private String supplierName;

    @NotBlank(message = "Loại hóa đơn không được để trống (FEED_MED hoặc BREED)")
    private String invoiceType; // FEED_MED, BREED

    @NotBlank(message = "Nơi tiếp nhận không được để trống (WAREHOUSE hoặc BARN)")
    private String destinationType; // WAREHOUSE, BARN

    private String destinationName;
    private Long warehouseId;
    private Long barnId;
    private Long batchId;
    private Long breedId;
    private Long branchId;

    private BigDecimal discountAmount;
    private BigDecimal paidAmount;
    private String paymentMethod; // BANK_TRANSFER, CASH

    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng không được để trống")
    private List<ItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        private Long materialId;
        private String itemName;
        private String unit;
        private BigDecimal quantity;
        private BigDecimal conversionRate;
        private BigDecimal totalWeightKg;
        private String lotCode;
        private LocalDate expiryDate;
        private BigDecimal unitPrice;
    }
}
