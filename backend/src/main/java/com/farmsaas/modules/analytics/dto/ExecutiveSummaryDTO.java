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
public class ExecutiveSummaryDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalExpense;
    private BigDecimal netProfit;
    private BigDecimal roiPercentage;

    private Long activeCropSeasonsCount;
    private Long activeLivestockCount;
    private Long lowStockAlertCount;
    private Long expiringMaterialCount;
    private Long overdueTasksCount;
    private Long overdueDebtsCount;

    private List<MonthlyTrendPointDTO> monthlyTrend;
    private List<ZoneStatusDTO> zoneStatuses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendPointDTO {
        private String month;
        private BigDecimal revenue;
        private BigDecimal expense;
        private BigDecimal profit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ZoneStatusDTO {
        private Long zoneId;
        private String zoneCode;
        private String zoneName;
        private String zoneType;
        private BigDecimal areaM2;
        private String status;
        private String currentActivity;
    }
}
