package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.ConsumptionQuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsumptionQuotaRepository extends JpaRepository<ConsumptionQuota, Long>, JpaSpecificationExecutor<ConsumptionQuota> {
    java.util.List<ConsumptionQuota> findByTenantId(Long tenantId);
    java.util.List<ConsumptionQuota> findByFarmId(Long farmId);
    java.util.Optional<ConsumptionQuota> findByTenantIdAndId(Long tenantId, Long id);
}
