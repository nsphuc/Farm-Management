package com.farm.saas.modules.hr.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalTime;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "farm_tasks")
public class FarmTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "task_title", nullable = false, length = 255)
    private String taskTitle;

    @Column(name = "task_type", nullable = false, length = 50)
    private String taskType;

    @Column(name = "priority", nullable = false, length = 20)
    private String priority;

    @Column(name = "assigned_to_employee_id")
    private Long assignedToEmployeeId;

    @Column(name = "assigned_by_user_id")
    private Long assignedByUserId;

    @Column(name = "deadline")
    private Instant deadline;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "shift_id")
    private Long shiftId;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "recurrence_days", length = 100)
    private String recurrenceDays;

    @Column(name = "assignment_mode", length = 50)
    private String assignmentMode;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "standard_quantity", precision = 12, scale = 2)
    private java.math.BigDecimal standardQuantity;

    @Column(name = "actual_quantity", precision = 12, scale = 2)
    private java.math.BigDecimal actualQuantity;

    @Column(name = "crop_season_id")
    private Long cropSeasonId;

    @Column(name = "livestock_group_id")
    private Long livestockGroupId;

    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;

    @Column(name = "photos_json", columnDefinition = "JSON")
    private String photosJson;

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
