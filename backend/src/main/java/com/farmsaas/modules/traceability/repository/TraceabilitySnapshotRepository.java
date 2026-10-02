package com.farmsaas.modules.traceability.repository;

import com.farmsaas.modules.traceability.entity.TraceabilitySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TraceabilitySnapshotRepository extends JpaRepository<TraceabilitySnapshot, Long> {

    Optional<TraceabilitySnapshot> findByProductBatchId(Long productBatchId);

    Optional<TraceabilitySnapshot> findByTenantIdAndProductBatchId(Long tenantId, Long productBatchId);

    boolean existsByProductBatchId(Long productBatchId);
}
