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
@Table(name = "livestock_breeds")
public class LivestockBreed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "species", nullable = false, length = 50)
    private String species;

    @Column(name = "breed_name", nullable = false, length = 150)
    private String breedName;

    @Column(name = "image_url", columnDefinition = "MEDIUMTEXT")
    private String imageUrl;

    @Column(name = "standard_growth_days")
    private Integer standardGrowthDays;

    @Column(name = "target_weight_kg", precision = 8, scale = 2)
    private BigDecimal targetWeightKg;

    @Column(name = "fcr_target", precision = 5, scale = 2)
    private BigDecimal fcrTarget;

    @Column(name = "adg_target", precision = 8, scale = 2)
    private BigDecimal adgTarget;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "management_type", length = 30)
    private String managementType;

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
