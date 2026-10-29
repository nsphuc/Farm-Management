package com.farm.saas.modules.crop.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateFarmingLogRequest {

    @NotNull(message = "Vụ mùa không được để trống")
    @JsonAlias({"cropSeasonId", "seasonId"})
    private Long seasonId;

    @NotNull(message = "Ngày ghi nhật ký không được để trống")
    private LocalDate logDate;

    @Size(max = 50, message = "Giai đoạn sinh trưởng tối đa 50 ký tự")
    @JsonAlias({"growthStage", "stage"})
    private String stage;

    @NotBlank(message = "Loại hoạt động canh tác không được để trống")
    @Pattern(regexp = "^(SOIL_TILLAGE|IRRIGATION|FERTILIZATION|PESTICIDE_APPLICATION|PRUNING|WEEDING|HARVESTING)$",
            message = "Loại hoạt động canh tác không hợp lệ")
    private String activityType;

    @Min(value = 0, message = "Số ngày cách ly PHI không được âm")
    private Integer phiDays;

    @Size(max = 500, message = "Ghi chú thời tiết tối đa 500 ký tự")
    private String weatherNotes;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String notes;

    private Long performedByUserId;

    @JsonAlias({"photosJson", "imageUrls"})
    private List<String> imageUrls;

    @Valid
    private List<FarmingSupplyRequest> supplies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FarmingSupplyRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotNull(message = "Kho xuất không được để trống")
        private Long warehouseId;

        @NotBlank(message = "Số lô không được để trống")
        private String batchNumber;

        @NotNull(message = "Số lượng tiêu hao không được để trống")
        @DecimalMin(value = "0.01", message = "Số lượng tiêu hao phải lớn hơn 0")
        @JsonAlias({"quantity", "usedQuantity", "actualQuantity"})
        private BigDecimal actualQuantity;

        private BigDecimal suggestedQuantity;

        private Long quotaId;

        private String varianceReason;

        private String unit;

        private String notes;
    }
}

