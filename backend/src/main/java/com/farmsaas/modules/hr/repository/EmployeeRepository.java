package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.Employee;
import com.farmsaas.modules.hr.entity.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    Optional<Employee> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<Employee> findByTenantIdAndFarmIdAndUserId(Long tenantId, Long farmId, Long userId);

    boolean existsByTenantIdAndFarmIdAndEmployeeCode(Long tenantId, Long farmId, String employeeCode);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId AND e.farmId = :farmId " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:department IS NULL OR e.department = :department) " +
           "AND (:keyword IS NULL OR LOWER(e.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY e.createdAt DESC")
    Page<Employee> searchEmployees(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("keyword") String keyword,
            @Param("department") String department,
            @Param("status") EmployeeStatus status,
            Pageable pageable
    );
}
