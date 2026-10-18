package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.HarvestRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long>, JpaSpecificationExecutor<HarvestRecord> {
    java.util.List<HarvestRecord> findByFarmIdOrderByHarvestDateDescCreatedAtDesc(Long farmId);
    org.springframework.data.domain.Page<HarvestRecord> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
    java.util.Optional<HarvestRecord> findByTenantIdAndFarmIdAndHarvestCode(Long tenantId, Long farmId, String harvestCode);
}
