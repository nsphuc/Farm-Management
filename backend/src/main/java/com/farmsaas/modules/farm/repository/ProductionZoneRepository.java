package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.ProductionZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionZoneRepository extends JpaRepository<ProductionZone, Long> {

    List<ProductionZone> findByFarmIdAndTenantId(Long farmId, Long tenantId);

    Optional<ProductionZone> findByIdAndFarmIdAndTenantId(Long id, Long farmId, Long tenantId);

    boolean existsByFarmIdAndCode(Long farmId, String code);

    boolean existsByFarmIdAndCodeAndIdNot(Long farmId, String code, Long id);

    long countByFarmIdAndTenantId(Long farmId, Long tenantId);
}
