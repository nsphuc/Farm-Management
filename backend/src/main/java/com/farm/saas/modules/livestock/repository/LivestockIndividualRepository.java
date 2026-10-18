package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockIndividual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockIndividualRepository extends JpaRepository<LivestockIndividual, Long>, JpaSpecificationExecutor<LivestockIndividual> {
    java.util.Optional<LivestockIndividual> findByFarmIdAndId(Long farmId, Long id);
    java.util.Optional<LivestockIndividual> findByTenantIdAndRfidTagCode(Long tenantId, String rfidTagCode);
    boolean existsByTenantIdAndRfidTagCode(Long tenantId, String rfidTagCode);
    java.util.List<LivestockIndividual> findByGroupId(Long groupId);
}
