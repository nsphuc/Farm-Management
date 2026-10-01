package com.farmsaas.modules.tenant.entity;

import com.farmsaas.common.entity.BaseSystemEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tenant entity representing a cooperative, agribusiness, or enterprise account.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tenants", uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenants_code", columnNames = "code"),
    @UniqueConstraint(name = "uk_tenants_subdomain", columnNames = "subdomain")
})
public class Tenant extends BaseSystemEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "subdomain", nullable = false, length = 100)
    private String subdomain;

    @Column(name = "subscription_plan", nullable = false, length = 50)
    private String subscriptionPlan = "STARTER";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";
}
