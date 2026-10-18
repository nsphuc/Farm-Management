package com.farm.saas.modules.crop.repository;

import com.farm.saas.modules.crop.entity.FarmingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmingLogRepository extends JpaRepository<FarmingLog, Long>, JpaSpecificationExecutor<FarmingLog> {
    java.util.Optional<FarmingLog> findByFarmIdAndId(Long farmId, Long id);
    java.util.List<FarmingLog> findBySeasonId(Long seasonId);
    java.util.List<FarmingLog> findBySeasonIdOrderByLogDateAsc(Long seasonId);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(f.phiEndDate) FROM FarmingLog f WHERE f.seasonId = :seasonId")
    java.time.LocalDate findMaxPhiEndDateBySeasonId(@org.springframework.data.repository.query.Param("seasonId") Long seasonId);
}
