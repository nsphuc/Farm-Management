package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.WorkShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long>, JpaSpecificationExecutor<WorkShift> {
    java.util.List<WorkShift> findByTenantId(Long tenantId);
    java.util.Optional<WorkShift> findByTenantIdAndShiftCode(Long tenantId, String shiftCode);
    java.util.Optional<WorkShift> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndShiftCode(Long tenantId, String shiftCode);
}
