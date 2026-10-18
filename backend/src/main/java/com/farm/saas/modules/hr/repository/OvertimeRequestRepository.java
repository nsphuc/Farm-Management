package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.OvertimeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, Long>, JpaSpecificationExecutor<OvertimeRequest> {
    java.util.List<OvertimeRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    java.util.List<OvertimeRequest> findByFarmIdOrderByCreatedAtDesc(Long farmId);
    org.springframework.data.domain.Page<OvertimeRequest> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<OvertimeRequest> findByTenantId(Long tenantId, org.springframework.data.domain.Pageable pageable);
}
