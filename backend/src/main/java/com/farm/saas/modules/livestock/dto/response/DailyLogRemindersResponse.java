package com.farm.saas.modules.livestock.dto.response;

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
public class DailyLogRemindersResponse {

    private Long batchId;
    private String batchCode;
    private Long barnId;
    private String barnName;
    private Long breedId;
    private String breedName;
    private Integer daysOld;
    private Integer currentQuantity;

    private RecommendedFeedQuota feedQuota;
    private List<VaccineReminderItem> vaccineAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedFeedQuota {
        private String stage;
        private String feedType;
        private BigDecimal perHeadGrams;
        private BigDecimal totalFlockKg;
        private BigDecimal standardWeightKg;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaccineReminderItem {
        private Long quotaId;
        private Integer dayAge;
        private String vaccineName;
        private String dose;
        private String route;
        private String notes;
        private Boolean isToday;
    }
}
