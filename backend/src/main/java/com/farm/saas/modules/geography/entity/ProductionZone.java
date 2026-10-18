package com.farm.saas.modules.geography.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "production_zones")
public class ProductionZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "zone_type", nullable = false, length = 50)
    private String zoneType;

    @Column(name = "area_m2", nullable = false, precision = 12, scale = 2)
    private BigDecimal areaM2;

    @Column(name = "soil_type", length = 100)
    private String soilType;

    @Column(name = "water_source", length = 100)
    private String waterSource;

    @Column(name = "map_layout_json", columnDefinition = "JSON")
    private String mapLayoutJson;

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
