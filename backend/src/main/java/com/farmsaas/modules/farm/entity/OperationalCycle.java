package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * OperationalCycle Entity: Chu kỳ vận hành / Năm tài chính / Niên vụ lớn của trang trại.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "operational_cycles", indexes = {
        @Index(name = "idx_cycles_farm_status", columnList = "farm_id, status")
})
public class OperationalCycle extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * PREPARING, RUNNING, CLOSED
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PREPARING";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;
}
