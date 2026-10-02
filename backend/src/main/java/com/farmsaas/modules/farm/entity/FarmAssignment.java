package com.farmsaas.modules.farm.entity;

import com.farmsaas.common.entity.BaseEntity;
import com.farmsaas.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * FarmAssignment Entity: Phân công nhân sự phụ trách tại một cơ sở trang trại.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "farm_assignments", indexes = {
        @Index(name = "idx_farm_assignments_user", columnList = "user_id, farm_id, is_active"),
        @Index(name = "idx_farm_assignments_farm", columnList = "farm_id, is_active")
})
public class FarmAssignment extends BaseEntity {

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * FARM_MANAGER, CHIEF_TECHNICIAN, VETERINARIAN, WAREHOUSE_SUPERVISOR, FIELD_LEAD, WORKER
     */
    @Column(name = "role_in_farm", nullable = false, length = 50)
    private String roleInFarm;

    @Column(name = "assigned_from", nullable = false)
    private LocalDate assignedFrom;

    @Column(name = "assigned_to")
    private LocalDate assignedTo;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", insertable = false, updatable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
