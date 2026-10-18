package com.farm.saas.modules.masterdata.dto.response;

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
public class BarcodeLookupResponse {

    private String matchType; // 'STANDARD', 'UNIT_CONVERSION', 'INTERNAL_BATCH'
    private Long materialId;
    private String skuCode;
    private String materialName;
    private String standardUnit;
    private String enteredUnit;
    private BigDecimal conversionFactor;
    private Boolean isPurchaseUnit;
    private Boolean isDispatchUnit;
    private Integer defaultPhiDays;
    private List<SuggestedLotDto> suggestedLots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedLotDto {
        private String batchNumber;
        private Long warehouseId;
        private String warehouseName;
        private String storageBinCode;
        private BigDecimal availableQuantity;
        private LocalDate expiryDate;
    }
}
