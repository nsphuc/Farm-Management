package com.farm.saas.modules.quality.repository;

import com.farm.saas.modules.quality.entity.TraceabilitySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TraceabilitySnapshotRepository extends JpaRepository<TraceabilitySnapshot, Long>, JpaSpecificationExecutor<TraceabilitySnapshot> {
}
