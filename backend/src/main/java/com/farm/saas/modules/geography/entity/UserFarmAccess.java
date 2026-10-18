package com.farm.saas.modules.geography.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_farm_access")
@IdClass(UserFarmAccessId.class)
public class UserFarmAccess {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "granted_at")
    private Instant grantedAt;

    @Column(name = "granted_by")
    private Long grantedBy;
}
