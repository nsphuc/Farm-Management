package com.farm.saas.modules.masterdata.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class CreateMaterialRequest {

    @NotNull(message = "Nhóm vật tư không được để trống")
    private Long categoryId;

    @NotBlank(message = "Mã SKU không được để trống")
    private String skuCode;

    private String barcode;

    @NotBlank(message = "Tên vật tư không được để trống")
    private String name;

    @NotBlank(message = "Đơn vị chuẩn không được để trống")
    private String standardUnit;

    @NotBlank(message = "Chiến lược xuất kho không được để trống")
    private String dispatchStrategy; // 'FEFO', 'FIFO'

    @NotNull(message = "Số ngày cảnh báo hạn sử dụng không được để trống")
    @Min(value = 0, message = "Số ngày cảnh báo hạn sử dụng phải lớn hơn hoặc bằng 0")
    private Integer expiryAlertDays;

    @NotNull(message = "Định mức tồn tối thiểu không được để trống")
    @DecimalMin(value = "0.00", message = "Tồn tối thiểu phải lớn hơn hoặc bằng 0")
    private BigDecimal minStockLevel;

    private BigDecimal maxStockLevel;

    @NotNull(message = "Đơn giá tiêu chuẩn không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá tiêu chuẩn phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPriceStandard;

    private String manufacturerName;
    private String activeIngredient;

    @NotNull(message = "Thời gian cách ly mặc định không được để trống")
    @Min(value = 0, message = "Thời gian cách ly phải lớn hơn hoặc bằng 0")
    private Integer defaultPhiDays;

    private Integer shelfLifeDays;
    private String description;

    @Valid
    private List<ConversionItemRequest> conversions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversionItemRequest {
        @NotBlank(message = "Tên đơn vị quy đổi không được để trống")
        private String unitName;

        private String unitBarcode;

        @NotNull(message = "Hệ số quy đổi không được để trống")
        @DecimalMin(value = "0.0001", message = "Hệ số quy đổi phải lớn hơn 0")
        private BigDecimal conversionFactor;

        @Builder.Default
        private Boolean isPurchaseUnit = true;

        @Builder.Default
        private Boolean isDispatchUnit = false;
    }
}
