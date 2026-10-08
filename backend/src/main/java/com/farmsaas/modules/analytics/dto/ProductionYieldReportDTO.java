package com.farmsaas.modules.analytics.dto;

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
public class ProductionYieldReportDTO {
    private List<CropYieldItemDTO> cropYields;
    private BigDecimal totalPlantedAreaM2;
    private BigDecimal totalActualYieldKg;
    private BigDecimal totalEstimatedYieldKg;
    private BigDecimal averageAchievementRate;
    private BigDecimal wasteLossRatio;

    private List<FcrSummaryDTO> fcrSummaries;
    private List<QualityGradeStatDTO> qualityGrading;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CropYieldItemDTO {
        private Long seasonId;
        private String seasonCode;
        private String cropName;
        private String zoneName;
        private BigDecimal plantedAreaM2;
        private BigDecimal estimatedYieldKg;
        private BigDecimal actualYieldKg;
        private BigDecimal yieldPerM2;
        private BigDecimal achievementRate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FcrSummaryDTO {
        private Long groupId;
        private String groupCode;
        private String breedName;
        private Integer totalAnimals;
        private BigDecimal feedConsumedKg;
        private BigDecimal weightGainedKg;
        private BigDecimal fcr;
        private String evaluation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityGradeStatDTO {
        private String qualityGrade;
        private Long batchCount;
        private BigDecimal totalQuantity;
        private BigDecimal percentage;
    }
}
