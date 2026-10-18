package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.ProductionZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductionZoneRepository extends JpaRepository<ProductionZone, Long>, JpaSpecificationExecutor<ProductionZone> {
    java.util.List<ProductionZone> findByFarmId(Long farmId);
    java.util.Optional<ProductionZone> findByFarmIdAndId(Long farmId, Long id);
    java.util.Optional<ProductionZone> findByFarmIdAndCode(Long farmId, String code);
    boolean existsByFarmIdAndCode(Long farmId, String code);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(pz.areaM2), 0) FROM ProductionZone pz WHERE pz.farmId = :farmId AND (:excludeId IS NULL OR pz.id != :excludeId)")
    java.math.BigDecimal sumAreaByFarmIdExcluding(Long farmId, Long excludeId);
}
