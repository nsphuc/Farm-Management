package com.farm.saas.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseTransferDetailResponse {
    private Long id;
    private Long fromFarmId;
    private Long toFarmId;
    private Long fromWarehouseId;
    private String fromWarehouseName;
    private Long toWarehouseId;
    private String toWarehouseName;
    private String transferCode;
    private LocalDate transferDate;
    private String status;
    private Long transferredByUserId;
    private Long receivedByUserId;
    private Instant dispatchedAt;
    private Instant receivedAt;
    private String notes;
    private List<TransferItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferItemDto {
        private Long id;
        private Long materialId;
        private String skuCode;
        private String materialName;
        private String standardUnit;
        private String fromBatchNumber;
        private String toBatchNumber;
        private LocalDate expiryDate;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
        private String fromBinCode;
        private String toBinCode;
    }
}
