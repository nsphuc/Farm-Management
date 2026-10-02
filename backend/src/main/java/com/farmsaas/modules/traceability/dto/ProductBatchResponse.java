package com.farmsaas.modules.traceability.dto;

import com.farmsaas.modules.traceability.entity.ProductBatch;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.entity.enums.QualityGrade;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatchResponse {

    private Long id;
    private Long tenantId;
    private Long farmId;
    private String farmName;
    private Long seasonId;
    private String seasonCode;
    private Long livestockGroupId;
    private String livestockGroupCode;
    private String batchCode;
    private String traceabilityCode;
    private String productName;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private BigDecimal initialQuantity;
    private BigDecimal remainingQuantity;
    private String unit;
    private QualityGrade qualityGrade;
    private String qrImageUrl;
    private ProductBatchStatus status;
    private Long approvedByUserId;
    private String approvedByUserName;
    private Instant approvedAt;
    private Long rejectedByUserId;
    private String rejectedByUserName;
    private Instant rejectedAt;
    private String rejectionReason;
    private Long recalledByUserId;
    private String recalledByUserName;
    private Instant recalledAt;
    private String recallReason;
    private Instant createdAt;
    private Instant updatedAt;

    public static ProductBatchResponse fromEntity(ProductBatch entity) {
        if (entity == null) return null;
        return ProductBatchResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .farmId(entity.getFarmId())
                .farmName(entity.getFarm() != null ? entity.getFarm().getName() : null)
                .seasonId(entity.getSeasonId())
                .seasonCode(entity.getSeason() != null ? entity.getSeason().getSeasonCode() : null)
                .livestockGroupId(entity.getLivestockGroupId())
                .livestockGroupCode(entity.getLivestockGroup() != null ? entity.getLivestockGroup().getGroupCode() : null)
                .batchCode(entity.getBatchCode())
                .traceabilityCode(entity.getTraceabilityCode())
                .productName(entity.getProductName())
                .harvestDate(entity.getHarvestDate())
                .expiryDate(entity.getExpiryDate())
                .initialQuantity(entity.getInitialQuantity())
                .remainingQuantity(entity.getRemainingQuantity())
                .unit(entity.getUnit())
                .qualityGrade(entity.getQualityGrade())
                .qrImageUrl(entity.getQrImageUrl())
                .status(entity.getStatus())
                .approvedByUserId(entity.getApprovedByUserId())
                .approvedByUserName(entity.getApprovedByUser() != null ? entity.getApprovedByUser().getFullName() : null)
                .approvedAt(entity.getApprovedAt())
                .rejectedByUserId(entity.getRejectedByUserId())
                .rejectedByUserName(entity.getRejectedByUser() != null ? entity.getRejectedByUser().getFullName() : null)
                .rejectedAt(entity.getRejectedAt())
                .rejectionReason(entity.getRejectionReason())
                .recalledByUserId(entity.getRecalledByUserId())
                .recalledByUserName(entity.getRecalledByUser() != null ? entity.getRecalledByUser().getFullName() : null)
                .recalledAt(entity.getRecalledAt())
                .recallReason(entity.getRecallReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
