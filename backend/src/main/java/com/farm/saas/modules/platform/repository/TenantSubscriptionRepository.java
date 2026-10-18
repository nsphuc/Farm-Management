package com.farm.saas.modules.platform.repository;

import com.farm.saas.modules.platform.entity.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, Long>, JpaSpecificationExecutor<TenantSubscription> {

    Optional<TenantSubscription> findByTenantIdAndIsActiveTrue(Long tenantId);

    List<TenantSubscription> findByTenantId(Long tenantId);
}
