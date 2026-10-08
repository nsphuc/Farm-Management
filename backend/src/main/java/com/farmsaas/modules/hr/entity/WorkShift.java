package com.farmsaas.modules.hr.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.hr.entity.enums.ShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "work_shifts", uniqueConstraints = {
    @UniqueConstraint(name = "uk_work_shifts_farm_code", columnNames = {"tenant_id", "farm_id", "shift_code"})
})
public class WorkShift extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "shift_code", nullable = false, length = 50)
    private String shiftCode;

    @Column(name = "shift_name", nullable = false, length = 100)
    private String shiftName;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_minutes")
    @Builder.Default
    private Integer breakMinutes = 60;

    @Column(name = "working_hours", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal workingHours = new BigDecimal("8.00");

    @Column(name = "late_grace_minutes")
    @Builder.Default
    private Integer lateGraceMinutes = 15;

    @Column(name = "early_leave_grace_minutes")
    @Builder.Default
    private Integer earlyLeaveGraceMinutes = 15;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ShiftStatus status = ShiftStatus.ACTIVE;

    @Column(name = "is_overnight", nullable = false)
    @Builder.Default
    private Boolean isOvernight = false;
}
