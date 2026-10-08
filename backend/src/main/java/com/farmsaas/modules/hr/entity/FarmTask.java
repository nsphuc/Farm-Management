package com.farmsaas.modules.hr.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.crop.entity.CropSeason;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.farm.entity.ProductionZone;
import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import com.farmsaas.modules.livestock.entity.LivestockGroup;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "farm_tasks", uniqueConstraints = {
    @UniqueConstraint(name = "uk_farm_tasks_code", columnNames = {"tenant_id", "farm_id", "task_code"})
})
public class FarmTask extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "task_code", nullable = false, length = 50)
    private String taskCode;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", insertable = false, updatable = false)
    private Employee assignee;

    @Column(name = "supervisor_id")
    private Long supervisorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", insertable = false, updatable = false)
    private Employee supervisor;

    @Column(name = "season_id")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", insertable = false, updatable = false)
    private CropSeason season;

    @Column(name = "herd_id")
    private Long herdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "herd_id", insertable = false, updatable = false)
    private LivestockGroup herd;

    @Column(name = "zone_id")
    private Long zoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", insertable = false, updatable = false)
    private ProductionZone zone;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "estimated_hours", precision = 4, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 4, scale = 2)
    private BigDecimal actualHours;

    @Column(name = "notes", length = 500)
    private String notes;
}
