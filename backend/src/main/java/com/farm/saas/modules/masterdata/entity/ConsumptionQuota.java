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
@Table(name = "consumption_quotas")
public class ConsumptionQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "crop_type_id")
    private Long cropTypeId;

    @Column(name = "livestock_breed_id")
    private Long livestockBreedId;

    @Column(name = "material_id", nullable = false)
    private Long materialId;

    @Column(name = "standard_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal standardQuantity;

    @Column(name = "unit_of_measure", nullable = false, length = 30)
    private String unitOfMeasure;

    @Column(name = "stage", length = 50)
    private String stage;

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
