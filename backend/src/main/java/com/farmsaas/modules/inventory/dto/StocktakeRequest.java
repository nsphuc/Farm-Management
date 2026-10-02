package com.farmsaas.modules.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeRequest {

    @NotNull(message = "Kho kiểm kê không được để trống.")
    private Long warehouseId;

    @Size(max = 50, message = "Mã phiếu kiểm kê tối đa 50 ký tự.")
    private String stocktakeCode;

    private Instant stocktakeDate;
    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng kiểm kê không được để trống.")
    @Valid
    private List<StocktakeItemRequest> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StocktakeItemRequest {
        @NotNull(message = "Vật tư không được để trống.")
        private Long materialId;

        @Builder.Default
        private String batchNumber = "DEFAULT";

        @NotNull(message = "Số lượng thực tế không được để trống.")
        @PositiveOrZero(message = "Số lượng thực tế phải >= 0.")
        private BigDecimal actualQuantity;

        private String reason;
    }
}
