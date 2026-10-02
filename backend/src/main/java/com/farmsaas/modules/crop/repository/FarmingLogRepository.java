package com.farmsaas.modules.crop.repository;

import com.farmsaas.modules.crop.entity.FarmingLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmingLogRepository extends JpaRepository<FarmingLog, Long> {

    List<FarmingLog> findByTenantIdAndSeasonIdOrderByLogDateDesc(Long tenantId, Long seasonId);

    Optional<FarmingLog> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT l FROM FarmingLog l WHERE l.tenantId = :tenantId AND l.seasonId = :seasonId ORDER BY l.logDate DESC")
    Page<FarmingLog> findBySeasonIdPaged(
            @Param("tenantId") Long tenantId,
            @Param("seasonId") Long seasonId,
            Pageable pageable
    );
}
