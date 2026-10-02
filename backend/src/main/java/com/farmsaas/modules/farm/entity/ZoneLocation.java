package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * ZoneLocation Entity: Các ô đất nhỏ, luống rau, hoặc chuồng cụ thể bên trong zone.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "zone_locations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_locations_zone_code", columnNames = { "zone_id", "code" })
})
public class ZoneLocation extends BaseEntity {

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    /**
     * O_DAT, LUONG_RAU, CHUONG_NUOI, DAY_CHUONG, NGAN_KHO
     */
    @Column(name = "location_type", nullable = false, length = 50)
    private String locationType;

    @Column(name = "area_m2", precision = 12, scale = 2)
    private BigDecimal areaM2;

    @Column(name = "capacity")
    private Integer capacity;

    /**
     * EMPTY, OCCUPIED, MAINTENANCE
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "EMPTY";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    private ProductionZone zone;
}
