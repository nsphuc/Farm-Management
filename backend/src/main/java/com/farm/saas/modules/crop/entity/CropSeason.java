package com.farm.saas.modules.crop.entity;

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
@Table(name = "crop_seasons")
public class CropSeason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "operational_cycle_id")
    private Long operationalCycleId;

    @Column(name = "season_code", nullable = false, length = 50)
    private String seasonCode;

    @Column(name = "crop_type_id", nullable = false)
    private Long cropTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expected_harvest_date")
    private LocalDate expectedHarvestDate;

    @Column(name = "actual_harvest_date")
    private LocalDate actualHarvestDate;

    @Column(name = "planted_area_m2", nullable = false, precision = 12, scale = 2)
    private BigDecimal plantedAreaM2;

    @Column(name = "seed_quantity", precision = 10, scale = 2)
    private BigDecimal seedQuantity;

    @Column(name = "estimated_yield_kg", precision = 12, scale = 2)
    private BigDecimal estimatedYieldKg;

    @Column(name = "actual_yield_kg", precision = 12, scale = 2)
    private BigDecimal actualYieldKg;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
