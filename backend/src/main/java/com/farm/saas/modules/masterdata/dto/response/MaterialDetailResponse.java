package com.farm.saas.modules.masterdata.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialDetailResponse {

    private Long id;
    private Long tenantId;
    private String skuCode;
    private String barcode;
    private String name;
    private Long categoryId;
    private String categoryName;
    private String standardUnit;
    private String dispatchStrategy;
    private Integer expiryAlertDays;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private BigDecimal unitPriceStandard;
    private String manufacturerName;
    private String activeIngredient;
    private Integer defaultPhiDays;
    private Integer shelfLifeDays;
    private String description;
    private String status;
    private List<ConversionDto> conversions;
    private BigDecimal totalAvailableStock;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversionDto {
        private Long id;
        private String unitName;
        private String unitBarcode;
        private BigDecimal conversionFactor;
        private Boolean isPurchaseUnit;
        private Boolean isDispatchUnit;
    }
}
