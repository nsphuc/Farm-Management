package com.farm.saas.modules.livestock.repository;

import com.farm.saas.modules.livestock.entity.LivestockWeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LivestockWeightLogRepository extends JpaRepository<LivestockWeightLog, Long>, JpaSpecificationExecutor<LivestockWeightLog> {
}
