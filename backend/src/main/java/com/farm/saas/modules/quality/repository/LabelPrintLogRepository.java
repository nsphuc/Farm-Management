package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.LabelPrintLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LabelPrintLogRepository extends JpaRepository<LabelPrintLog, Long>, JpaSpecificationExecutor<LabelPrintLog> {
}
