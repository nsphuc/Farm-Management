package com.farm.saas.modules.quality.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatchDetailResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long warehouseId;
    private String warehouseName;
    private Long seasonId;
    private String seasonCode;
    private Long livestockGroupId;
    private String groupCode;
    private String batchCode;
    private String gtinBarcode;
    private String traceabilityCode;
    private String productName;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private String storageConditions;
    private BigDecimal initialQuantity;
    private BigDecimal remainingQuantity;
    private BigDecimal reservedQuantity;
    private String unit;
    private String qualityGrade;
    private String qrImageUrl;
    private String status;
    private Long approvedByUserId;
    private String approverFullName;
    private Instant approvedAt;
    private Long rejectedByUserId;
    private String rejecterFullName;
    private Instant rejectedAt;
    private String rejectionReason;
    private Long recalledByUserId;
    private String recallerFullName;
    private Instant recalledAt;
    private String recallReason;
    private Long inspectorUserId;
    private String inspectorFullName;
    private BigDecimal soldQuantity;
    private Long scanCount;
    private String snapshotHash;
    private String enterpriseInfoJson;
    private String vietgapCertJson;
    private String farmingTimelineJson;
    private String harvestInfoJson;
    private String qcInspectionJson;
    private String qcInspectionCode;
    private List<ProductBatchSourceResponse> sources;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductBatchSourceResponse {
        private Long id;
        private String sourceType;
        private Long harvestRecordId;
        private String harvestRecordCode;
        private Long cropSeasonId;
        private String cropSeasonCode;
        private Long livestockGroupId;
        private String groupCode;
        private BigDecimal contributedQuantity;
        private String unit;
        private LocalDate harvestDate;
        private String notes;
    }
}
