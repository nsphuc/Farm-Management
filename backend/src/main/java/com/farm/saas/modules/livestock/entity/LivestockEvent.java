package com.farm.saas.modules.livestock.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "livestock_events")
public class LivestockEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "livestock_individual_id")
    private Long livestockIndividualId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "withdrawal_days", nullable = false)
    private Integer withdrawalDays;

    @Column(name = "withdrawal_end_date")
    private LocalDate withdrawalEndDate;

    @Column(name = "is_quarantined", nullable = false)
    private Boolean isQuarantined;

    @Column(name = "details_json", columnDefinition = "JSON")
    private String detailsJson;

    @Column(name = "veterinarian_user_id")
    private Long veterinarianUserId;

    @Column(name = "is_inventory_backflushed", nullable = false)
    private Boolean isInventoryBackflushed;

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
