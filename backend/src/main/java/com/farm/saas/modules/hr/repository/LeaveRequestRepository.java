package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long>, JpaSpecificationExecutor<LeaveRequest> {
    java.util.List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    java.util.List<LeaveRequest> findByFarmIdOrderByCreatedAtDesc(Long farmId);
    org.springframework.data.domain.Page<LeaveRequest> findByFarmId(Long farmId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<LeaveRequest> findByTenantId(Long tenantId, org.springframework.data.domain.Pageable pageable);
}
