package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockGroup;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockGroupRepository extends JpaRepository<LivestockGroup, Long>, JpaSpecificationExecutor<LivestockGroup> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM LivestockGroup e WHERE e.id = :id")
    Optional<LivestockGroup> findByIdForUpdate(@Param("id") Long id);

    Optional<LivestockGroup> findByFarmIdAndId(Long farmId, Long id);
    Optional<LivestockGroup> findByTenantIdAndFarmIdAndGroupCode(Long tenantId, Long farmId, String groupCode);
    boolean existsByTenantIdAndFarmIdAndGroupCode(Long tenantId, Long farmId, String groupCode);
    java.util.List<LivestockGroup> findByFarmId(Long farmId);
    java.util.List<LivestockGroup> findByTenantId(Long tenantId);
    boolean existsByBreedId(Long breedId);
    boolean existsByOperationalCycleId(Long operationalCycleId);
}
