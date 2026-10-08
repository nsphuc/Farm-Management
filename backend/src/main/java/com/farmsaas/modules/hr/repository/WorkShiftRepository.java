package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.WorkShift;
import com.farmsaas.modules.hr.entity.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    List<WorkShift> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    List<WorkShift> findByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, ShiftStatus status);

    Optional<WorkShift> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    boolean existsByTenantIdAndFarmIdAndShiftCode(Long tenantId, Long farmId, String shiftCode);
}
