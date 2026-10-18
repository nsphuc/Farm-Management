package com.farm.saas.modules.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_roles")
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Column(name = "farm_id")
    private Long farmId;

    @Column(name = "assigned_scope_farm_id", insertable = false, updatable = false)
    private Long assignedScopeFarmId;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "assigned_by")
    private Long assignedBy;
}
