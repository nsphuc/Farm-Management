package com.farm.saas.modules.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity đại diện cho bảng operational_cycles (Chu kỳ vận hành / Năm tài chính vận hành).
 * Thuộc về một Farm và Tenant xác định, áp dụng The Farm Barrier Guard.
 */
@Entity
@Table(name = "operational_cycles", uniqueConstraints = {
        @UniqueConstraint(name = "uk_operational_cycles_farm_year_name", columnNames = {"farm_id", "fiscal_year", "name"}),
        @UniqueConstraint(name = "uk_operational_cycles_tenant_farm_id", columnNames = {"tenant_id", "farm_id", "id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Isolation: Xác định Tenant sở hữu
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // The Farm Barrier Guard: Liên kết chặt chẽ với trang trại sở tại
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    // Tên chu kỳ (VD: Vụ Đông Xuân 2026, Chu kỳ Nuôi Heo Q1-2026, Năm tài chính 2026)
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    // Năm tài chính vận hành (VD: 2026)
    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    // Ngày bắt đầu chu kỳ
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    // Ngày kết thúc chu kỳ (Bắt buộc: end_date >= start_date)
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // Trạng thái chu kỳ: PLANNING, ACTIVE, CLOSED
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private OperationalCycleStatus status = OperationalCycleStatus.PLANNING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
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
