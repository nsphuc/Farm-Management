package com.farmsaas.modules.inventory.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.inventory.entity.enums.StandardUnit;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "materials", uniqueConstraints = {
    @UniqueConstraint(name = "uk_materials_tenant_sku", columnNames = {"tenant_id", "sku_code"})
})
public class Material extends BaseEntity {

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private MaterialCategory category;

    @Column(name = "sku_code", nullable = false, length = 50)
    private String skuCode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "standard_unit", nullable = false, length = 30)
    private StandardUnit standardUnit = StandardUnit.KG;

    @Builder.Default
    @Column(name = "expiry_alert_days", nullable = false)
    private Integer expiryAlertDays = 30;

    @Builder.Default
    @Column(name = "min_stock_level", nullable = false, precision = 12, scale = 2)
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "max_stock_level", precision = 12, scale = 2)
    private BigDecimal maxStockLevel;

    @Builder.Default
    @Column(name = "unit_price_standard", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPriceStandard = BigDecimal.ZERO;

    @Column(name = "active_ingredient", length = 255)
    private String activeIngredient;

    @Builder.Default
    @Column(name = "isolation_days", nullable = false)
    private Integer isolationDays = 0;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";
}
