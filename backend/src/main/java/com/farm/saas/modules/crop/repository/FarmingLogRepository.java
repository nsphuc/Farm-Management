package com.farm.saas.modules.crop.repository;

import com.farm.saas.modules.crop.entity.FarmingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmingLogRepository extends JpaRepository<FarmingLog, Long>, JpaSpecificationExecutor<FarmingLog> {
}
