package com.farmsaas.modules.tenant.entity;

import com.farmsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;

/**
 * Tenant Subscription plan, quota limits, and validity period.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tenant_subscriptions", indexes = {
    @Index(name = "idx_tenant_subscriptions_tenant", columnList = "tenant_id, is_active")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TenantSubscription extends BaseEntity {

    @Column(name = "plan_type", nullable = false, length = 50)
    private String planType;

    @Column(name = "max_farms", nullable = false)
    private Integer maxFarms = 1;

    @Column(name = "max_users", nullable = false)
    private Integer maxUsers = 5;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
}
