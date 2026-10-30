package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.ZoneLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ZoneLocationRepository extends JpaRepository<ZoneLocation, Long>, JpaSpecificationExecutor<ZoneLocation> {
    java.util.List<ZoneLocation> findByZoneId(Long zoneId);
    java.util.List<ZoneLocation> findByFarmId(Long farmId);
    java.util.Optional<ZoneLocation> findByZoneIdAndId(Long zoneId, Long id);
    boolean existsByZoneIdAndCode(Long zoneId, String code);
    java.util.Optional<ZoneLocation> findByWarehouseIdAndCode(Long warehouseId, String code);
    java.util.Optional<ZoneLocation> findByFarmIdAndCode(Long farmId, String code);
    java.util.List<ZoneLocation> findByWarehouseId(Long warehouseId);
}
