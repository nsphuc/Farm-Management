package com.farm.saas.modules.livestock.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDailyLogRequest {

    private Long farmId;

    @NotNull(message = "Chuồng nuôi không được để trống")
    private Long barnId;

    private Long batchId;

    @NotNull(message = "Ngày ghi nhận không được để trống")
    private LocalDate logDate;

    @NotNull(message = "Loại nhật ký không được để trống")
    private String entryType; // FEED, MEDICINE, MORTALITY, SAMPLE_ENV

    // 1. Tab Feed
    private Long feedMaterialId;
    private Long feedWarehouseId;
    private BigDecimal feedAmount;
    private String feedUnit; // 'BAG' hoặc 'KG'

    // 2. Tab Medicine / Vaccine
    private Long medMaterialId;
    private Long medWarehouseId;
    private BigDecimal medAmount;
    private String medUnit;
    private String diseaseReason;
    private String adminRoute; // 'Uống nước', 'Trộn cám', 'Tiêm', 'Nhỏ mắt'

    // 3. Tab Mortality
    private Integer deadCount;
    private Integer cullCount;
    private String mortalityReason;
    private BigDecimal deadAvgWeightKg;
    private String mortalityNotes;

    // 4. Tab Sample & Environment
    private Integer sampleCount;
    private BigDecimal sampleAvgWeightKg;
    private BigDecimal temperatureC;
    private BigDecimal humidityPct;
    private BigDecimal nh3Ppm;
    private BigDecimal co2Ppm;

    private String notes;
}
