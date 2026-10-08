package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseSystemEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "budget_line_items")
public class BudgetLineItem extends BaseSystemEntity {

    @Column(name = "budget_id", nullable = false)
    private Long budgetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", insertable = false, updatable = false)
    private Budget budget;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private CostCategory category;

    @Column(name = "planned_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal plannedAmount = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;
}
