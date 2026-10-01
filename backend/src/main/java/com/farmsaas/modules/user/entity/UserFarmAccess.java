package com.farmsaas.modules.user.entity;

import com.farmsaas.modules.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;

/**
 * Maps which farms a user has permission to access within their tenant scope.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_farm_access", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_farm_access", columnNames = { "user_id", "farm_id" })
}, indexes = {
        @Index(name = "idx_user_farm_access_farm", columnList = "farm_id, tenant_id")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@EntityListeners(AuditingEntityListener.class)
public class UserFarmAccess implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @CreatedDate
    @Column(name = "granted_at", nullable = false, updatable = false)
    private Instant grantedAt;

    @Column(name = "granted_by", length = 50)
    private String grantedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
}
