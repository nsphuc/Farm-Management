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
@Table(name = "material_unit_conversions")
public class MaterialUnitConversion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "unit_name", nullable = false, length = 30)
    private String unitName;

    @Column(name = "unit_barcode", length = 100)
    private String unitBarcode;

    @Column(name = "conversion_factor", nullable = false, precision = 12, scale = 4)
    private BigDecimal conversionFactor;

    @Column(name = "is_purchase_unit", nullable = false)
    private Boolean isPurchaseUnit;

    @Column(name = "is_dispatch_unit", nullable = false)
    private Boolean isDispatchUnit;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
