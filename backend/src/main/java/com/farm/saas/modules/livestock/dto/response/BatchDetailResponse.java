package com.farm.saas.modules.livestock.dto.response;

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
public class BatchDetailResponse {

    private Long id;
    private String code;
    private Long breedId;
    private String breedName;
    private String species;
    private Long barnId;
    private String barnName;
    private BigDecimal barnAreaM2;
    private Integer barnCapacity;
    private String barnDescription;
    private Long zoneId;
    private String zoneName;
    private Long branchId;
    private LocalDate entryDate;
    private Integer daysOld;
    private Integer initialQuantity;
    private Integer currentQuantity;
    private Integer deadQuantity;
    private Integer culledQuantity;
    private Integer harvestedQuantity;
    private BigDecimal mortalityRate;
    private BigDecimal avgInitialWeightKg;
    private BigDecimal currentAvgWeightKg;
    private BigDecimal targetWeightKg;
    private BigDecimal totalFeedConsumedKg;
    private BigDecimal actualFcr;
    private BigDecimal standardFcr;
    private BigDecimal adgGrams;
    private String status;
    private String notes;

    // Technical targets
    private BatchTargets targets;

    // Tab 1: Overview
    private OverviewTab overview;

    // Tab 2: Event logs & fluctuations (4 sub-tabs)
    private List<EventLogItem> eventLogs;

    // Tab 3: Materials consumed
    private List<ConsumedMaterialItem> consumedMaterials;

    // Tab 4: Financial P&L (cost & revenue)
    private FinancialPnlTab financialPnl;

    // Khối 2: Danh sách các đợt nhập đàn
    private List<LivestockGroupItem> groups;

    // Khối 3: Các chương trình nuôi áp dụng
    private List<AppliedProgramItem> appliedPrograms;

    // Khối 5: Thu hoạch - vật nuôi
    private List<HarvestRecordItem> harvestRecords;

    // Khối 5: Thu hoạch - phụ thu
    private List<ByProductItem> byProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchTargets {
        private BigDecimal fcrTarget;
        private BigDecimal costPerKgTarget;
        private BigDecimal maxMortalityPct;
        private BigDecimal expectedHarvestWeightKg;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewTab {
        private Integer daysOld;
        private Integer currentQuantity;
        private Integer initialQuantity;
        private BigDecimal currentAvgWeightKg;
        private BigDecimal targetWeightKg;
        private BigDecimal actualFcr;
        private BigDecimal standardFcr;
        private BigDecimal fcrDifference;
        private BigDecimal adgGrams;
        private BigDecimal totalFeedConsumedKg;
        private BigDecimal mortalityRate;
        private Boolean isAlert;
        private String alertReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventLogItem {
        private Long id;
        private String eventType; // FEED, MEDICINE, MORTALITY, SAMPLE_ENV, TRANSFER, HARVEST
        private LocalDate date;
        private String description;
        private Integer deadCount;
        private Integer cullCount;
        private BigDecimal feedAmountKg;
        private BigDecimal standardFeedKg;
        private BigDecimal sampleWeightKg;
        private BigDecimal temperatureC;
        private BigDecimal humidityPct;
        private BigDecimal nh3Ppm;
        private BigDecimal co2Ppm;
        private String medicineName;
        private String adminRoute;
        private String diseaseReason;
        private Integer withdrawalDays;
        private String authorName;
        private String notes;
        private Boolean isAlert;
        private String alertReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsumedMaterialItem {
        private Long materialId;
        private String materialName;
        private String category;
        private BigDecimal totalQuantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialPnlTab {
        private Boolean canViewFinancials;
        private BigDecimal breedCost;
        private BigDecimal feedCost;
        private BigDecimal medicineCost;
        private BigDecimal suppliesCost;
        private BigDecimal laborCost;
        private BigDecimal electricityWaterCost;
        private BigDecimal otherCost;
        private BigDecimal totalCost;
        private BigDecimal revenue;
        private BigDecimal profit;
        private BigDecimal unitCostPerKg;
        private BigDecimal unitCostPerHead;
        private List<CostItem> costItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostItem {
        private Long id;
        private LocalDate date;
        private String category; // FEED, MEDICINE, SUPPLIES, BREED, LABOR, UTILITIES, OTHER
        private String categoryName;
        private String title;
        private BigDecimal amount;
        private String sourceRef;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LivestockGroupItem {
        private Long id;
        private String groupCode;
        private Long breedId;
        private String breedName;
        private Integer initialQuantity;
        private Integer currentQuantity;
        private BigDecimal avgInitialWeightKg;
        private String gender; // MALE, FEMALE, MIXED
        private String sourceType; // PURCHASE, INTERNAL
        private LocalDate entryDate;
        private Integer weeksOld;
        private BigDecimal totalCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppliedProgramItem {
        private Long id;
        private Long programId;
        private String programCode;
        private String programName;
        private String programType; // FEED, VACCINE, TREATMENT
        private String description;
        private Integer milestonesCount;
        private LocalDate appliedDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HarvestRecordItem {
        private Long id;
        private String orderCode;
        private String groupCode;
        private Integer quantityHead;
        private BigDecimal totalWeightKg;
        private BigDecimal unitCost;
        private BigDecimal salePrice;
        private BigDecimal totalRevenue;
        private String harvestType; // HARVEST, CULL
        private LocalDate harvestDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ByProductItem {
        private Long id;
        private String itemCode;
        private String itemName;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
        private LocalDate receiptDate;
        private String notes;
    }
}
