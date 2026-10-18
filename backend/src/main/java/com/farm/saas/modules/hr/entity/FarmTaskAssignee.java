package com.farm.saas.modules.hr.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "farm_task_assignees")
@IdClass(FarmTaskAssigneeId.class)
public class FarmTaskAssignee {

    @Id
    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Id
    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "role_in_task", length = 50)
    private String roleInTask;
}
