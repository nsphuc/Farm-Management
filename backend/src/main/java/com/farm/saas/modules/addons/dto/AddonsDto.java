package com.farm.saas.modules.addons.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AddonsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePayrollRequest {
        private BigDecimal actualWorkDays;
        private BigDecimal kpiBonus;
        private BigDecimal allowance;
        private BigDecimal advanceDeduction;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClosePayrollRequest {
        private String paymentMethod; // BANK_TRANSFER, CASH
        private String bankAccountNo;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BreedingSummaryResponse {
        private long totalSows;
        private long pregnantCount;
        private long lactatingCount;
        private long heiferCount;
        private long matingCount;
        private double avgBornAlive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BreedingAnimalRequest {
        private Long branchId;
        private String tagCode;
        private String breedName;
        private Integer parity;
        private String reproductiveStatus; // HEIFER, MATING, PREGNANT, LACTATING
        private LocalDate matingDate;
        private Integer bornAliveCount;
        private Integer weanedCount;
        private String barnName;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BreedingEventRequest {
        private String eventType; // MATING, BIRTH, WEANING
        private LocalDate eventDate;
        private Integer bornAliveCount;
        private Integer weanedCount;
        private String barnName;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HatcherySummaryResponse {
        private long totalIncubatingEggs;
        private double fertilityRate;
        private double hatchRate;
        private long totalHatchedThisMonth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateHatcheryBatchRequest {
        private Long branchId;
        private String batchCode;
        private String eggType; // CHICKEN, DUCK
        private String breedName;
        private LocalDate setDate;
        private Integer totalEggs;
        private Integer fertileEggs;
        private String destinationBarnName;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FinalizeHatchRequest {
        private Integer actualHatchedCount;
        private Integer cullCount;
        private Long destinationBarnId;
        private String destinationBarnName;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BomItemDto {
        private Long materialId;
        private String materialName;
        private BigDecimal quantityKg;
        private BigDecimal unitPrice;
        private BigDecimal amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateFeedBomRequest {
        private String code;
        private String name;
        private String targetSpecies;
        private BigDecimal batchWeightKg;
        private String description;
        private List<BomItemDto> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExecuteFeedOrderRequest {
        private Long branchId;
        private Long bomId;
        private Integer batchCount;
        private Long targetWarehouseId;
        private String targetWarehouseName;
        private String notes;
    }
}
