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
    private Long groupId;

    private Long livestockIndividualId;
    private Long individualId;

    public Long getLivestockGroupId() {
        return livestockGroupId != null ? livestockGroupId : groupId;
    }

    public Long getLivestockIndividualId() {
        return livestockIndividualId != null ? livestockIndividualId : individualId;
    }

    @NotBlank(message = "Loại sự kiện không được để trống")
    @Pattern(regexp = "^(VACCINATION|WEIGHT_CHECK|BREEDING|BIRTH|MEDICAL_TREATMENT|DISEASE_TREATMENT|TRANSFER|SLAUGHTER|MORTALITY|CULLING|SOLD)$",
            message = "Loại sự kiện không hợp lệ")
    private String eventType;

    @NotNull(message = "Ngày diễn ra sự kiện không được để trống")
    private LocalDate eventDate;

    @Min(value = 0, message = "Số ngày cách ly/ngừng thuốc không được âm")
    private Integer withdrawalDays;

    private LocalDate withdrawalEndDate;

    private Boolean isQuarantined;

    private Long veterinarianUserId;

    @Min(value = 0, message = "Số lượng cá thể tác động không được âm")
    private Integer headCountAffected;

    @DecimalMin(value = "0.00", message = "Chi phí dịch vụ thú y không được âm")
    private BigDecimal totalCost;

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

        private BigDecimal actualQuantity;
        private BigDecimal quantity;

        public BigDecimal getActualQuantity() {
            return actualQuantity != null ? actualQuantity : quantity;
        }

        @NotBlank(message = "Đơn vị tính không được để trống")
        private String unit;

        private String notes;
    }
}
