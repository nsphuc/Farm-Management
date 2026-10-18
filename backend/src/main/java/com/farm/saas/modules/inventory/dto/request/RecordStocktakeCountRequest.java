package com.farm.saas.modules.inventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordStocktakeCountRequest {

    @NotEmpty(message = "Danh sách kiểm đếm thực tế không được để trống")
    @Valid
    private List<StocktakeCountItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StocktakeCountItemRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotBlank(message = "Số lô không được để trống")
        private String batchNumber;

        @NotNull(message = "Số lượng thực tế không được để trống")
        @DecimalMin(value = "0.00", message = "Số lượng thực tế không được âm")
        private BigDecimal actualQuantity;

        private String reason;
    }
}
