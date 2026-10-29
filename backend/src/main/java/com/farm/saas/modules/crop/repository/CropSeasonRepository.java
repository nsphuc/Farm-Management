package com.farm.saas.modules.crop.repository;

import com.farm.saas.modules.crop.entity.CropSeason;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CropSeasonRepository extends JpaRepository<CropSeason, Long>, JpaSpecificationExecutor<CropSeason> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM CropSeason e WHERE e.id = :id")
    Optional<CropSeason> findByIdForUpdate(@Param("id") Long id);

    Optional<CropSeason> findByFarmIdAndId(Long farmId, Long id);
    Optional<CropSeason> findByTenantIdAndFarmIdAndSeasonCode(Long tenantId, Long farmId, String seasonCode);
    boolean existsByTenantIdAndFarmIdAndSeasonCode(Long tenantId, Long farmId, String seasonCode);
    java.util.List<CropSeason> findByFarmId(Long farmId);
    java.util.List<CropSeason> findByTenantId(Long tenantId);
    boolean existsByCropTypeId(Long cropTypeId);
    boolean existsByOperationalCycleId(Long operationalCycleId);
}
