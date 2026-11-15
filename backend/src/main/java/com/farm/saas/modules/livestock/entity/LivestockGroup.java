package com.farm.saas.modules.livestock.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "livestock_groups")
public class LivestockGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "zone_id", nullable = false)
    private Long zoneId;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "operational_cycle_id")
    private Long operationalCycleId;

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "breed_id", nullable = false)
    private Long breedId;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity;

    @Column(name = "unit_price", precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_cost", precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "avg_initial_weight_kg", precision = 8, scale = 2)
    private BigDecimal avgInitialWeightKg;

    @Column(name = "health_certificate", length = 100)
    private String healthCertificate;

    @Column(name = "origin", length = 255)
    private String origin;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
