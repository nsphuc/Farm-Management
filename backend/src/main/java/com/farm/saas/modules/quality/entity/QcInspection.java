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
@Table(name = "qc_inspections")
public class QcInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "product_batch_id", nullable = false)
    private Long productBatchId;

    @Column(name = "inspection_code", nullable = false, length = 50)
    private String inspectionCode;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "inspector_user_id")
    private Long inspectorUserId;

    @Column(name = "sample_size", nullable = false, precision = 10, scale = 2)
    private BigDecimal sampleSize;

    @Column(name = "sample_unit", nullable = false, length = 30)
    private String sampleUnit;

    @Column(name = "overall_result", nullable = false, length = 30)
    private String overallResult;

    @Column(name = "notes", length = 500)
    private String notes;

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
