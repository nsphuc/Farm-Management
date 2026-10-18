package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    java.util.Optional<Employee> findByTenantIdAndEmployeeCode(Long tenantId, String employeeCode);
    java.util.Optional<Employee> findByUserId(Long userId);
    java.util.Optional<Employee> findByTenantIdAndUserId(Long tenantId, Long userId);
    java.util.List<Employee> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    java.util.List<Employee> findByTenantIdAndFarmIdOrderByCreatedAtDesc(Long tenantId, Long farmId);
    org.springframework.data.domain.Page<Employee> findByTenantId(Long tenantId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Employee> findByTenantIdAndFarmId(Long tenantId, Long farmId, org.springframework.data.domain.Pageable pageable);
}
