package com.farm.saas.modules.crop.entity;

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
@Table(name = "farming_logs")
public class FarmingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "stage", length = 50)
    private String stage;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(name = "phi_days", nullable = false)
    private Integer phiDays;

    @Column(name = "phi_end_date")
    private LocalDate phiEndDate;

    @Column(name = "supplies_used_json", columnDefinition = "JSON")
    private String suppliesUsedJson;

    @Column(name = "weather_notes", length = 500)
    private String weatherNotes;

    @Column(name = "performed_by_user_id")
    private Long performedByUserId;

    @Column(name = "image_urls_json", columnDefinition = "JSON")
    private String imageUrlsJson;

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
