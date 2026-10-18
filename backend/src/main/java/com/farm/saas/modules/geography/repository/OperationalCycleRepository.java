package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.OperationalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationalCycleRepository extends JpaRepository<OperationalCycle, Long>, JpaSpecificationExecutor<OperationalCycle> {
    java.util.List<OperationalCycle> findByFarmId(Long farmId);
    java.util.Optional<OperationalCycle> findByFarmIdAndId(Long farmId, Long id);
}
