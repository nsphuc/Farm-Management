package com.farm.saas.modules.geography.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "farm_data_rules")
public class FarmDataRule {

    @Id
    @Column(name = "farm_id")
    private Long farmId;

    @Column(name = "manage_by_batch", nullable = false)
    @Builder.Default
    private Boolean manageByBatch = true;

    @Column(name = "enforce_expiry_date", nullable = false)
    @Builder.Default
    private Boolean enforceExpiryDate = true;

    @Column(name = "max_edit_log_days", nullable = false)
    @Builder.Default
    private Integer maxEditLogDays = 3;

    @Column(name = "auto_deduct_inventory", nullable = false)
    @Builder.Default
    private Boolean autoDeductInventory = true;

    @Column(name = "kpi_targets_json", columnDefinition = "JSON")
    private String kpiTargetsJson;

    @Column(name = "env_metrics_json", columnDefinition = "JSON")
    private String envMetricsJson;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (manageByBatch == null) manageByBatch = true;
        if (enforceExpiryDate == null) enforceExpiryDate = true;
        if (maxEditLogDays == null) maxEditLogDays = 3;
        if (autoDeductInventory == null) autoDeductInventory = true;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
