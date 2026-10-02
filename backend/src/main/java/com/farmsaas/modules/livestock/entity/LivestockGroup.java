package com.farmsaas.modules.livestock.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "livestock_groups", uniqueConstraints = {
    @UniqueConstraint(name = "uk_livestock_groups_farm_code", columnNames = {"tenant_id", "farm_id", "group_code"})
})
public class LivestockGroup extends BaseEntity {

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

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "breed_id", nullable = false)
    private Long breedId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "breed_id", insertable = false, updatable = false)
    private LivestockBreed breed;

    @Builder.Default
    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity = 0;

    @Builder.Default
    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity = 0;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private LivestockGroupStatus status = LivestockGroupStatus.DANG_NUOI;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
