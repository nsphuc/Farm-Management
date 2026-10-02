package com.farmsaas.modules.livestock.repository;

import com.farmsaas.modules.livestock.entity.LivestockGroup;
import com.farmsaas.modules.livestock.entity.enums.LivestockGroupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivestockGroupRepository extends JpaRepository<LivestockGroup, Long> {

    List<LivestockGroup> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    Optional<LivestockGroup> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    boolean existsByTenantIdAndFarmIdAndGroupCode(Long tenantId, Long farmId, String groupCode);

    @Query("SELECT g FROM LivestockGroup g WHERE g.tenantId = :tenantId AND g.farmId = :farmId " +
           "AND (:zoneId IS NULL OR g.zoneId = :zoneId) " +
           "AND (:breedId IS NULL OR g.breedId = :breedId) " +
           "AND (:status IS NULL OR g.status = :status) " +
           "ORDER BY g.entryDate DESC")
    Page<LivestockGroup> searchGroups(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("zoneId") Long zoneId,
            @Param("breedId") Long breedId,
            @Param("status") LivestockGroupStatus status,
            Pageable pageable
    );
}
