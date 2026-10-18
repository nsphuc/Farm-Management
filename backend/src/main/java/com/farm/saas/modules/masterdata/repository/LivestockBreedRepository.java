package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.LivestockBreed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockBreedRepository extends JpaRepository<LivestockBreed, Long>, JpaSpecificationExecutor<LivestockBreed> {
    java.util.List<LivestockBreed> findByTenantId(Long tenantId);
    java.util.List<LivestockBreed> findByTenantIdAndSpecies(Long tenantId, String species);
    java.util.Optional<LivestockBreed> findByTenantIdAndId(Long tenantId, Long id);
}
