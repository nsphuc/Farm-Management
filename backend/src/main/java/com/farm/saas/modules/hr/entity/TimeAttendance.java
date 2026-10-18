package com.farm.saas.modules.hr.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "time_attendances")
public class TimeAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "shift_id", nullable = false)
    private Long shiftId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time")
    private Instant checkInTime;

    @Column(name = "check_out_time")
    private Instant checkOutTime;

    @Column(name = "gps_latitude", precision = 10, scale = 8)
    private BigDecimal gpsLatitude;

    @Column(name = "gps_longitude", precision = 11, scale = 8)
    private BigDecimal gpsLongitude;

    @Column(name = "gps_distance_m", precision = 8, scale = 2)
    private BigDecimal gpsDistanceM;

    @Column(name = "check_out_latitude", precision = 10, scale = 8)
    private BigDecimal checkOutLatitude;

    @Column(name = "check_out_longitude", precision = 11, scale = 8)
    private BigDecimal checkOutLongitude;

    @Column(name = "check_out_distance_m", precision = 8, scale = 2)
    private BigDecimal checkOutDistanceM;

    @Column(name = "check_in_photo_url", length = 500)
    private String checkInPhotoUrl;

    @Column(name = "check_out_photo_url", length = 500)
    private String checkOutPhotoUrl;

    @Column(name = "working_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal workingHours;

    @Column(name = "late_minutes", nullable = false)
    private Integer lateMinutes;

    @Column(name = "early_leave_minutes", nullable = false)
    private Integer earlyLeaveMinutes;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "is_adjusted", nullable = false)
    private Boolean isAdjusted;

    @Column(name = "adjusted_by_user_id")
    private Long adjustedByUserId;

    @Column(name = "adjustment_reason", length = 500)
    private String adjustmentReason;

    @Column(name = "original_check_in")
    private Instant originalCheckIn;

    @Column(name = "original_check_out")
    private Instant originalCheckOut;

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
