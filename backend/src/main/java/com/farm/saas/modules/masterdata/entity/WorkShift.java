package com.farm.saas.modules.masterdata.entity;

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
@Table(name = "work_shifts")
public class WorkShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id")
    private Long farmId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "shift_code", nullable = false, length = 50)
    private String shiftCode;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_minutes", nullable = false)
    private Integer breakMinutes;

    @Column(name = "grace_late_minutes", nullable = false)
    private Integer graceLateMinutes;

    @Column(name = "is_overnight", nullable = false)
    private Boolean isOvernight;

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
