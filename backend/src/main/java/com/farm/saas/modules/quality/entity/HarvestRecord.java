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
@Table(name = "harvest_records")
public class HarvestRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "harvest_code", nullable = false, length = 50)
    private String harvestCode;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "quality_grade", nullable = false, length = 20)
    private String qualityGrade;

    @Column(name = "harvested_by_user_id")
    private Long harvestedByUserId;

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
