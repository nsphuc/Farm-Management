package com.farmsaas.modules.inventory.dto;

import com.farmsaas.modules.inventory.entity.enums.ReceiptType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseReceiptRequest {

    @NotNull(message = "Kho nhận không được để trống.")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu nhập tối đa 50 ký tự.")
    private String receiptCode; // nếu null, hệ thống tự sinh PNK-yyyyMMdd-XXXX

    @NotNull(message = "Loại nhập kho không được để trống.")
    private ReceiptType receiptType;

    private Long partnerId;

    private Instant receiptDate;

    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng nhập kho không được để trống.")
    @Valid
    private List<ReceiptItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItemRequest {

        @NotNull(message = "Vật tư không được để trống.")
        private Long materialId;

        @Builder.Default
        private String batchNumber = "DEFAULT";

        private LocalDate expiryDate;

        @NotNull(message = "Số lượng nhập không được để trống.")
        @Positive(message = "Số lượng nhập phải lớn hơn 0.")
        private BigDecimal quantity;

        @Builder.Default
        private BigDecimal unitPrice = BigDecimal.ZERO;

        private String storageBinCode;
    }
}
