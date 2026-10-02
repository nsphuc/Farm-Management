package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * ProductionZone Entity: Nhà màng, Đồng ruộng, Chuồng trại, Kho, Hồ chứa.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "production_zones", uniqueConstraints = {
        @UniqueConstraint(name = "uk_zones_farm_code", columnNames = { "farm_id", "code" })
})
public class ProductionZone extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    /**
     * NHA_MANG, DONG_RUONG, CHUONG_TRAI, KHO, HO_CHUA
     */
    @Column(name = "zone_type", nullable = false, length = 50)
    private String zoneType;

    @Column(name = "area_m2", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal areaM2 = BigDecimal.ZERO;

    @Column(name = "soil_type", length = 100)
    private String soilType;

    @Column(name = "water_source", length = 100)
    private String waterSource;

    /**
     * ACTIVE, CULTIVATING, ISOLATING, DISINFECTING, INACTIVE
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;
}
