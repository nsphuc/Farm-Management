package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.FarmAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmAssignmentRepository extends JpaRepository<FarmAssignment, Long>, JpaSpecificationExecutor<FarmAssignment> {
    java.util.List<FarmAssignment> findByFarmIdAndIsActiveTrue(Long farmId);
    java.util.List<FarmAssignment> findByFarmId(Long farmId);
    java.util.Optional<FarmAssignment> findByFarmIdAndId(Long farmId, Long id);
}
