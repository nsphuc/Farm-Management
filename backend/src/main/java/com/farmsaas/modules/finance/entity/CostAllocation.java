package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "cost_allocations")
public class CostAllocation extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "expense_id", nullable = false)
    private Long expenseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", insertable = false, updatable = false)
    private FarmExpense expense;

    @Column(name = "zone_id")
    private Long zoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    private ProductionZone zone;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "allocation_ratio", nullable = false, precision = 5, scale = 4)
    private BigDecimal allocationRatio;

    @Column(name = "allocated_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "notes")
    private String notes;
}
