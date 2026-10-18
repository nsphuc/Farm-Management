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
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "sku_code", nullable = false, length = 50)
    private String skuCode;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "standard_unit", nullable = false, length = 30)
    private String standardUnit;

    @Column(name = "dispatch_strategy", nullable = false, length = 20)
    private String dispatchStrategy;

    @Column(name = "expiry_alert_days", nullable = false)
    private Integer expiryAlertDays;

    @Column(name = "min_stock_level", nullable = false, precision = 12, scale = 2)
    private BigDecimal minStockLevel;

    @Column(name = "max_stock_level", precision = 12, scale = 2)
    private BigDecimal maxStockLevel;

    @Column(name = "unit_price_standard", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPriceStandard;

    @Column(name = "manufacturer_name", length = 255)
    private String manufacturerName;

    @Column(name = "active_ingredient", length = 255)
    private String activeIngredient;

    @Column(name = "default_phi_days", nullable = false)
    private Integer defaultPhiDays;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
