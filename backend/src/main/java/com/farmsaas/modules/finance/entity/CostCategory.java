package com.farmsaas.modules.finance.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.finance.entity.enums.CostType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "cost_categories", uniqueConstraints = {
    @UniqueConstraint(name = "uk_cost_cat_code", columnNames = {"tenant_id", "code"})
})
public class CostCategory extends BaseEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_type", nullable = false, length = 50)
    private CostType costType;

    @Column(name = "description")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
