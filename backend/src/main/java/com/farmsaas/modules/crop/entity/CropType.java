package com.farmsaas.modules.crop.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "crop_types", uniqueConstraints = {
    @UniqueConstraint(name = "uk_crop_types_tenant_variety", columnNames = {"tenant_id", "variety_code"})
})
public class CropType extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "variety_code", nullable = false, length = 50)
    private String varietyCode;

    @Builder.Default
    @Column(name = "growth_days_standard", nullable = false)
    private Integer growthDaysStandard = 90;

    @Column(name = "water_need_m3_day", precision = 10, scale = 2)
    private BigDecimal waterNeedM3Day;

    @Column(name = "optimal_temp_min", precision = 5, scale = 2)
    private BigDecimal optimalTempMin;

    @Column(name = "optimal_temp_max", precision = 5, scale = 2)
    private BigDecimal optimalTempMax;
}
