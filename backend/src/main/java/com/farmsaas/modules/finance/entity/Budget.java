package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.farm.entity.Farm;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "budgets", uniqueConstraints = {
    @UniqueConstraint(name = "uk_budgets_farm_code", columnNames = {"tenant_id", "farm_id", "budget_code"})
})
public class Budget extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "budget_code", nullable = false, length = 50)
    private String budgetCode;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "total_budget", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalBudget = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "DANG_AP_DUNG";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BudgetLineItem> items = new ArrayList<>();
}
