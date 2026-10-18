package com.farm.saas.modules.hr.entity;

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
@Table(name = "shift_assignments")
public class ShiftAssignment {

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

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
