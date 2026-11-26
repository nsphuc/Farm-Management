package com.farm.saas.modules.addons.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_sheets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    @Builder.Default
    private Long tenantId = 1L;

    @Column(name = "farm_id", nullable = false)
    @Builder.Default
    private Long farmId = 1L;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "period_month", nullable = false, length = 20)
    private String periodMonth; // e.g. "2026-11"

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "base_salary", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "actual_work_days", precision = 5, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal actualWorkDays = BigDecimal.valueOf(26.0);

    @Column(name = "standard_work_days", precision = 5, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal standardWorkDays = BigDecimal.valueOf(26.0);

    @Column(name = "kpi_bonus", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal kpiBonus = BigDecimal.ZERO;

    @Column(name = "allowance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal allowance = BigDecimal.ZERO;

    @Column(name = "advance_deduction", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal advanceDeduction = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, PAID

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
