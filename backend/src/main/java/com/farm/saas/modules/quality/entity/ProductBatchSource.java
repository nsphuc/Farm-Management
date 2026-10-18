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
@Table(name = "product_batch_sources")
public class ProductBatchSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "product_batch_id", nullable = false)
    private Long productBatchId;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "harvest_record_id")
    private Long harvestRecordId;

    @Column(name = "crop_season_id")
    private Long cropSeasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "contributed_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal contributedQuantity;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;
}
