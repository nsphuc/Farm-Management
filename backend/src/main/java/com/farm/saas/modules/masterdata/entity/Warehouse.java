package com.farm.saas.modules.masterdata.entity;

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
@Table(name = "warehouses")
public class Warehouse {

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

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "warehouse_type", nullable = false, length = 50)
    private String warehouseType;

    @Column(name = "capacity_m3", precision = 12, scale = 2)
    private BigDecimal capacityM3;

    @Column(name = "floor_area_m2", precision = 12, scale = 2)
    private BigDecimal floorAreaM2;

    @Column(name = "standard_temp_c", precision = 5, scale = 2)
    private BigDecimal standardTempC;

    @Column(name = "standard_humidity_pct", precision = 5, scale = 2)
    private BigDecimal standardHumidityPct;

    @Column(name = "location_desc", length = 255)
    private String locationDesc;

    @Column(name = "manager_user_id")
    private Long managerUserId;

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
