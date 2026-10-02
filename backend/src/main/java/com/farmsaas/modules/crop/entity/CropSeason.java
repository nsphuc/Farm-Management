package com.farmsaas.modules.crop.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.enums.SeasonStatus;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "crop_seasons", uniqueConstraints = {
    @UniqueConstraint(name = "uk_crop_seasons_farm_code", columnNames = {"tenant_id", "farm_id", "season_code"})
})
public class CropSeason extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    private ProductionZone zone;

    @Column(name = "season_code", nullable = false, length = 50)
    private String seasonCode;

    @Column(name = "crop_type_id", nullable = false)
    private Long cropTypeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_type_id", insertable = false, updatable = false)
    private CropType cropType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expected_harvest_date", nullable = false)
    private LocalDate expectedHarvestDate;

    @Column(name = "actual_harvest_date")
    private LocalDate actualHarvestDate;

    @Builder.Default
    @Column(name = "planted_area_m2", nullable = false, precision = 12, scale = 2)
    private BigDecimal plantedAreaM2 = BigDecimal.ZERO;

    @Column(name = "seed_quantity", precision = 10, scale = 2)
    private BigDecimal seedQuantity;

    @Column(name = "estimated_yield_kg", precision = 12, scale = 2)
    private BigDecimal estimatedYieldKg;

    @Column(name = "actual_yield_kg", precision = 12, scale = 2)
    private BigDecimal actualYieldKg;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private SeasonStatus status = SeasonStatus.LAM_DAT;

    /**
     * Năng suất thực tế (kg / m2)
     */
    public BigDecimal getActualYieldPerM2() {
        if (actualYieldKg == null || plantedAreaM2 == null || plantedAreaM2.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return actualYieldKg.divide(plantedAreaM2, 2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Tỷ lệ đạt sản lượng so với dự kiến (%)
     */
    public BigDecimal getYieldAchievementRate() {
        if (estimatedYieldKg == null || actualYieldKg == null || estimatedYieldKg.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return actualYieldKg.multiply(BigDecimal.valueOf(100)).divide(estimatedYieldKg, 2, java.math.RoundingMode.HALF_UP);
    }
}
