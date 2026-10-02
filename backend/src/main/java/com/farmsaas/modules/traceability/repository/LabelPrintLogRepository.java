package com.farmsaas.modules.traceability.repository;

import com.farmsaas.modules.traceability.entity.LabelPrintLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabelPrintLogRepository extends JpaRepository<LabelPrintLog, Long> {

    List<LabelPrintLog> findByProductBatchIdOrderByPrintedAtDesc(Long productBatchId);

    Page<LabelPrintLog> findByFarmIdAndProductBatchIdOrderByPrintedAtDesc(Long farmId, Long productBatchId, Pageable pageable);
}
