package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.HarvestRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface HarvestRecordRepository extends JpaRepository<HarvestRecord, Long>, JpaSpecificationExecutor<HarvestRecord> {
}
