package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.HarvestRecord;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long>, JpaSpecificationExecutor<HarvestRecord> {
    java.util.List<HarvestRecord> findByFarmIdOrderByHarvestDateDescCreatedAtDesc(Long farmId);
    org.springframework.data.domain.Page<HarvestRecord> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
    java.util.Optional<HarvestRecord> findByTenantIdAndFarmIdAndHarvestCode(Long tenantId, Long farmId, String harvestCode);
    java.util.List<HarvestRecord> findBySeasonId(Long seasonId);
    java.util.List<HarvestRecord> findByLivestockGroupId(Long livestockGroupId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(hr.quantity), 0) FROM HarvestRecord hr WHERE hr.seasonId = :seasonId")
    BigDecimal sumQuantityBySeasonId(@org.springframework.data.repository.query.Param("seasonId") Long seasonId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(hr.quantity), 0) FROM HarvestRecord hr WHERE hr.livestockGroupId = :groupId")
    BigDecimal sumQuantityByLivestockGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);
}
