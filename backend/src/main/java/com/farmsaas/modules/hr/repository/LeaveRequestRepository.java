package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.LeaveRequest;
import com.farmsaas.modules.hr.entity.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    Optional<LeaveRequest> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    List<LeaveRequest> findByTenantIdAndFarmIdAndEmployeeId(Long tenantId, Long farmId, Long employeeId);

    @Query("SELECT lr FROM LeaveRequest lr JOIN FETCH lr.employee " +
           "WHERE lr.tenantId = :tenantId AND lr.farmId = :farmId " +
           "AND (:employeeId IS NULL OR lr.employeeId = :employeeId) " +
           "AND (:status IS NULL OR lr.status = :status) " +
           "AND (:fromDate IS NULL OR lr.endDate >= :fromDate) " +
           "AND (:toDate IS NULL OR lr.startDate <= :toDate) " +
           "ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> searchLeaves(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("employeeId") Long employeeId,
            @Param("status") RequestStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
