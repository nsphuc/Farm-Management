package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.ZoneLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneLocationRepository extends JpaRepository<ZoneLocation, Long> {

    List<ZoneLocation> findByZoneIdAndTenantId(Long zoneId, Long tenantId);

    Optional<ZoneLocation> findByIdAndZoneIdAndTenantId(Long id, Long zoneId, Long tenantId);

    boolean existsByZoneIdAndCode(Long zoneId, String code);

    boolean existsByZoneIdAndCodeAndIdNot(Long zoneId, String code, Long id);

    long countByZoneIdAndTenantId(Long zoneId, Long tenantId);
}
