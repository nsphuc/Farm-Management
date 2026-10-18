package com.farm.saas.modules.quality.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_batches")
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(name = "gtin_barcode", length = 100)
    private String gtinBarcode;

    @Column(name = "traceability_code", length = 64)
    private String traceabilityCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "storage_conditions", length = 255)
    private String storageConditions;

    @Column(name = "initial_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal initialQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingQuantity;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedQuantity;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "quality_grade", length = 20)
    private String qualityGrade;

    @Column(name = "qr_image_url", length = 500)
    private String qrImageUrl;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_by_user_id")
    private Long rejectedByUserId;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "recalled_by_user_id")
    private Long recalledByUserId;

    @Column(name = "recalled_at")
    private Instant recalledAt;

    @Column(name = "recall_reason", length = 500)
    private String recallReason;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Version
    @Column(name = "version")
    private Long version;
}
