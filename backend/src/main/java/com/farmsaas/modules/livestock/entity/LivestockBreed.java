package com.farmsaas.modules.livestock.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.livestock.entity.enums.LivestockSpecies;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "livestock_breeds", uniqueConstraints = {
    @UniqueConstraint(name = "uk_livestock_breeds_tenant_species_name", columnNames = {"tenant_id", "species", "breed_name"})
})
public class LivestockBreed extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false, length = 30)
    private LivestockSpecies species;

    @Column(name = "breed_name", nullable = false, length = 150)
    private String breedName;

    @Builder.Default
    @Column(name = "standard_growth_days", nullable = false)
    private Integer standardGrowthDays = 120;

    @Column(name = "target_weight_kg", precision = 8, scale = 2)
    private BigDecimal targetWeightKg;
}
