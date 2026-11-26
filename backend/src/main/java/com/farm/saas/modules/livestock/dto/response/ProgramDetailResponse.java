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
public class ProgramDetailResponse {

    private Long id;
    private String name;
    private String species;
    private String livestockType;
    private String livestockTypeName;
    private String breedName;
    private Integer totalDays;
    private BigDecimal targetWeightKg;
    private BigDecimal fcrTarget;
    private BigDecimal adgTarget;
    private String description;

    private List<FeedStandardItem> feedStandards;
    private List<VaccineTimelineItem> vaccineTimeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedStandardItem {
        private Long id;
        private Integer dayAge;
        private Integer dayAgeFrom;
        private Integer dayAgeTo;
        private String stage;
        private String feedType;
        private BigDecimal feedAmount;
        private String unit;
        private BigDecimal standardWeight;
        private Long materialId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaccineTimelineItem {
        private Long id;
        private Integer dayAge;
        private String vaccineName;
        private String dose;
        private String route;
        private String notes;
        private Long materialId;
    }
}
