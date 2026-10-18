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
@Table(name = "crop_types")
public class CropType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "variety_code", nullable = false, length = 50)
    private String varietyCode;

    @Column(name = "growth_days_standard", nullable = false)
    private Integer growthDaysStandard;

    @Column(name = "water_need_m3_day", precision = 8, scale = 2)
    private BigDecimal waterNeedM3Day;

    @Column(name = "optimal_temp_min", precision = 5, scale = 2)
    private BigDecimal optimalTempMin;

    @Column(name = "optimal_temp_max", precision = 5, scale = 2)
    private BigDecimal optimalTempMax;

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
