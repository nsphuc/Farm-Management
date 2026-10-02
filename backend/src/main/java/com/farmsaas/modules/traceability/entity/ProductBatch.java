package com.farmsaas.modules.traceability.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.traceability.entity.enums.ProductBatchStatus;
import com.farmsaas.modules.traceability.entity.enums.QualityGrade;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product_batches", uniqueConstraints = {
    @UniqueConstraint(name = "uk_product_batches_farm_code", columnNames = {"tenant_id", "farm_id", "batch_code"}),
    @UniqueConstraint(name = "uk_product_batches_trace_code", columnNames = {"traceability_code"})
})
public class ProductBatch extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livestock_group_id", insertable = false, updatable = false)
    private LivestockGroup livestockGroup;

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(name = "traceability_code", length = 64)
    private String traceabilityCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Builder.Default
    @Column(name = "initial_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal initialQuantity = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "remaining_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingQuantity = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "unit", nullable = false, length = 30)
    private String unit = "KG";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "quality_grade", nullable = false, length = 30)
    private QualityGrade qualityGrade = QualityGrade.LOAI_1;

    @Column(name = "qr_image_url", columnDefinition = "LONGTEXT")
    private String qrImageUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private ProductBatchStatus status = ProductBatchStatus.PENDING_APPROVAL;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id", insertable = false, updatable = false)
    private User approvedByUser;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_by_user_id")
    private Long rejectedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_user_id", insertable = false, updatable = false)
    private User rejectedByUser;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "recalled_by_user_id")
    private Long recalledByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recalled_by_user_id", insertable = false, updatable = false)
    private User recalledByUser;

    @Column(name = "recalled_at")
    private Instant recalledAt;

    @Column(name = "recall_reason", columnDefinition = "TEXT")
    private String recallReason;
}
