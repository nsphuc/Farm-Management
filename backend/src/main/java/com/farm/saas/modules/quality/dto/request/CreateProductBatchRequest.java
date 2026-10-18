package com.farm.saas.modules.quality.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductBatchRequest {

    @NotBlank(message = "Mã lô thành phẩm không được để trống")
    private String batchCode;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    private Long warehouseId;

    private Long seasonId;

    private Long livestockGroupId;

    private String gtinBarcode;

    @NotNull(message = "Ngày thu hoạch/đóng gói không được để trống")
    private LocalDate harvestDate;

    private LocalDate expiryDate;

    private String storageConditions;

    @NotNull(message = "Số lượng ban đầu không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng ban đầu phải lớn hơn 0")
    private BigDecimal initialQuantity;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @Pattern(regexp = "GRADE_A|GRADE_B|EXPORT|STANDARD", message = "qualityGrade phải là GRADE_A, GRADE_B, EXPORT hoặc STANDARD")
    private String qualityGrade;

    private List<Long> sourceHarvestRecordIds;

    @Valid
    private List<ProductBatchSourceItemRequest> sources;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductBatchSourceItemRequest {
        @NotBlank(message = "sourceType nguồn thành phẩm không được để trống")
        @Pattern(regexp = "HARVEST_RECORD|CROP_SEASON|LIVESTOCK_GROUP", message = "sourceType phải là HARVEST_RECORD, CROP_SEASON hoặc LIVESTOCK_GROUP")
        private String sourceType;

        private Long harvestRecordId;
        private Long cropSeasonId;
        private Long livestockGroupId;

        @NotNull(message = "Số lượng đóng góp không được để trống")
        @DecimalMin(value = "0.01", message = "Số lượng đóng góp phải lớn hơn 0")
        private BigDecimal contributedQuantity;

        @NotBlank(message = "Đơn vị tính không được để trống")
        private String unit;

        private LocalDate harvestDate;
        private String notes;
    }
}
