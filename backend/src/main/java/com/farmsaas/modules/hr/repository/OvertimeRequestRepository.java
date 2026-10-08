package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.OvertimeRequest;
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
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, Long> {

    Optional<OvertimeRequest> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    List<OvertimeRequest> findByTenantIdAndFarmIdAndEmployeeId(Long tenantId, Long farmId, Long employeeId);

    @Query("SELECT o FROM OvertimeRequest o JOIN FETCH o.employee " +
           "WHERE o.tenantId = :tenantId AND o.farmId = :farmId " +
           "AND (:employeeId IS NULL OR o.employeeId = :employeeId) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:fromDate IS NULL OR o.overtimeDate >= :fromDate) " +
           "AND (:toDate IS NULL OR o.overtimeDate <= :toDate) " +
           "ORDER BY o.overtimeDate DESC, o.startTime DESC")
    Page<OvertimeRequest> searchOvertime(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("employeeId") Long employeeId,
            @Param("status") RequestStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
