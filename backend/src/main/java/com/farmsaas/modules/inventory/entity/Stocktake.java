package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "stocktakes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_stocktakes_tenant_code", columnNames = {"tenant_id", "stocktake_code"})
})
public class Stocktake extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;

    @Column(name = "stocktake_code", nullable = false, length = 50)
    private String stocktakeCode;

    @Column(name = "stocktake_date", nullable = false)
    private Instant stocktakeDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private StocktakeStatus status = StocktakeStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", insertable = false, updatable = false)
    private User createdByUser;

    @Column(name = "reconciled_by_user_id")
    private Long reconciledByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciled_by_user_id", insertable = false, updatable = false)
    private User reconciledByUser;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

    @Builder.Default
    @OneToMany(mappedBy = "stocktake", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StocktakeItem> items = new ArrayList<>();
}
