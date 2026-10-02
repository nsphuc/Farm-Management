package com.farmsaas.modules.livestock.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
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
@Table(name = "livestock_events", indexes = {
    @Index(name = "idx_livestock_events_target", columnList = "target_type, target_id, event_date")
})
public class LivestockEvent extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private LivestockEventType eventType;

    @Column(name = "event_date", nullable = false)
    private Instant eventDate;

    @Column(name = "details_json", columnDefinition = "JSON")
    private String detailsJson;

    @Column(name = "veterinarian_user_id")
    private Long veterinarianUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veterinarian_user_id", insertable = false, updatable = false)
    private User veterinarianUser;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
