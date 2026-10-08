package com.farmsaas.modules.hr.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.farm.entity.Farm;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
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
@Table(name = "time_attendances", uniqueConstraints = {
    @UniqueConstraint(name = "uk_time_attendance", columnNames = {"tenant_id", "farm_id", "employee_id", "work_date"})
})
public class TimeAttendance extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", insertable = false, updatable = false)
    private Employee employee;

    @Column(name = "shift_id")
    private Long shiftId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", insertable = false, updatable = false)
    private WorkShift shift;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_in_latitude", precision = 10, scale = 7)
    private BigDecimal checkInLatitude;

    @Column(name = "check_in_longitude", precision = 10, scale = 7)
    private BigDecimal checkInLongitude;

    @Column(name = "check_in_distance_m", precision = 8, scale = 2)
    private BigDecimal checkInDistanceM;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "check_out_latitude", precision = 10, scale = 7)
    private BigDecimal checkOutLatitude;

    @Column(name = "check_out_longitude", precision = 10, scale = 7)
    private BigDecimal checkOutLongitude;

    @Column(name = "check_out_distance_m", precision = 8, scale = 2)
    private BigDecimal checkOutDistanceM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.DUNG_GIO;

    @Column(name = "working_hours", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal workingHours = BigDecimal.ZERO;

    @Column(name = "overtime_hours", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "notes", length = 500)
    private String notes;
}
