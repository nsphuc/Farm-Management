package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.OperationalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationalCycleRepository extends JpaRepository<OperationalCycle, Long> {

    List<OperationalCycle> findByFarmIdAndTenantIdOrderByStartDateDesc(Long farmId, Long tenantId);

    Optional<OperationalCycle> findByIdAndFarmIdAndTenantId(Long id, Long farmId, Long tenantId);

    List<OperationalCycle> findByFarmIdAndStatusAndTenantId(Long farmId, String status, Long tenantId);
}
