package com.farmsaas.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

/**
 * Base abstract entity for all tenant-scoped entities.
 * Automatically enables Hibernate Tenant Filter to isolate data between tenants.
 */
@Getter
@Setter
@NoArgsConstructor
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = Long.class)
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class BaseEntity extends BaseSystemEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
}
