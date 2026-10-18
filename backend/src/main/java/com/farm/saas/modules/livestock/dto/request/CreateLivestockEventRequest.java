package com.farm.saas.modules.livestock.dto.request;

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
public class CreateLivestockEventRequest {

    @NotBlank(message = "Loại đối tượng không được để trống")
    @Pattern(regexp = "^(GROUP|INDIVIDUAL)$", message = "Loại đối tượng phải là GROUP hoặc INDIVIDUAL")
    private String targetType;

    private Long livestockGroupId;

    private Long livestockIndividualId;

    @NotBlank(message = "Loại sự kiện không được để trống")
    @Pattern(regexp = "^(VACCINATION|WEIGHT_CHECK|BREEDING|BIRTH|MEDICAL_TREATMENT|TRANSFER|SLAUGHTER)$",
            message = "Loại sự kiện không hợp lệ")
    private String eventType;

    @NotNull(message = "Ngày diễn ra sự kiện không được để trống")
    private LocalDate eventDate;

    @Min(value = 0, message = "Số ngày cách ly/ngừng thuốc không được âm")
    private Integer withdrawalDays;

    private Boolean isQuarantined;

    private Long veterinarianUserId;

    private String detailsJson;

    @Valid
    private List<LivestockEventSupplyRequest> supplies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivestockEventSupplyRequest {
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
