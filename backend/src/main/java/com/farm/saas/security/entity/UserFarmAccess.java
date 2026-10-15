package com.farm.saas.security.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.Instant;

/**
 * Entity đại diện cho bảng user_farm_access (Quyền truy cập trang trại của người dùng).
 */
@Entity
@Table(name = "user_farm_access")
@IdClass(UserFarmAccess.UserFarmAccessId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFarmAccess {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @CreationTimestamp
    @Column(name = "granted_at", updatable = false)
    private Instant grantedAt;

    @Column(name = "granted_by")
    private Long grantedBy;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class UserFarmAccessId implements Serializable {
        private Long userId;
        private Long farmId;
    }
}
