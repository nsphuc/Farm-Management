package com.farmsaas.modules.crop.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.enums.ActivityType;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "farming_logs", indexes = {
    @Index(name = "idx_farming_logs_season_date", columnList = "season_id, log_date")
})
public class FarmingLog extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "season_id", nullable = false)
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "log_date", nullable = false)
    private Instant logDate;

    @Column(name = "stage", length = 100)
    private String stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 50)
    private ActivityType activityType;

    @Column(name = "supplies_used_json", columnDefinition = "JSON")
    private String suppliesUsedJson;

    @Column(name = "weather_notes", length = 500)
    private String weatherNotes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "performed_by_user_id")
    private Long performedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", insertable = false, updatable = false)
    private User performedByUser;

    @Column(name = "image_urls_json", columnDefinition = "JSON")
    private String imageUrlsJson;
}
