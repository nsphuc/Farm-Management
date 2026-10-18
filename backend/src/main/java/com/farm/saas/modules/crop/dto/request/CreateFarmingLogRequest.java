package com.farm.saas.modules.crop.dto.request;

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
public class CreateFarmingLogRequest {

    @NotNull(message = "Vụ mùa không được để trống")
    private Long seasonId;

    @NotNull(message = "Ngày ghi nhật ký không được để trống")
    private LocalDate logDate;

    @Size(max = 50, message = "Giai đoạn sinh trưởng tối đa 50 ký tự")
    private String stage;

    @NotBlank(message = "Loại hoạt động canh tác không được để trống")
    @Pattern(regexp = "^(SOIL_TILLAGE|IRRIGATION|FERTILIZATION|PESTICIDE_APPLICATION|PRUNING|WEEDING|HARVESTING)$",
            message = "Loại hoạt động canh tác không hợp lệ")
    private String activityType;

    @Min(value = 0, message = "Số ngày cách ly PHI không được âm")
    private Integer phiDays;

    @Size(max = 500, message = "Ghi chú thời tiết tối đa 500 ký tự")
    private String weatherNotes;

    private Long performedByUserId;

    private List<String> imageUrls;

    @Valid
    private List<FarmingSupplyRequest> supplies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmingSupplyRequest {
        @NotNull(message = "Vật tư không được để trống")
        private Long materialId;

        @NotNull(message = "Kho xuất không được để trống")
        private Long warehouseId;

        @NotBlank(message = "Số lô không được để trống")
        private String batchNumber;

        @NotNull(message = "Số lượng tiêu hao không được để trống")
        @Positive(message = "Số lượng tiêu hao phải lớn hơn 0")
        private BigDecimal actualQuantity;

        @NotBlank(message = "Đơn vị tính không được để trống")
        private String unit;

        private String notes;
    }
}
