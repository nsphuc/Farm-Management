package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.TimeAttendance;
import com.farmsaas.modules.hr.entity.enums.AttendanceStatus;
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
public interface TimeAttendanceRepository extends JpaRepository<TimeAttendance, Long> {

    Optional<TimeAttendance> findByTenantIdAndFarmIdAndEmployeeIdAndWorkDate(
            Long tenantId, Long farmId, Long employeeId, LocalDate workDate);

    Optional<TimeAttendance> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    List<TimeAttendance> findByTenantIdAndFarmIdAndWorkDate(Long tenantId, Long farmId, LocalDate workDate);

    List<TimeAttendance> findByTenantIdAndFarmIdAndEmployeeIdAndWorkDateBetween(
            Long tenantId, Long farmId, Long employeeId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT ta FROM TimeAttendance ta JOIN FETCH ta.employee LEFT JOIN FETCH ta.shift " +
           "WHERE ta.tenantId = :tenantId AND ta.farmId = :farmId " +
           "AND (:startDate IS NULL OR ta.workDate >= :startDate) " +
           "AND (:endDate IS NULL OR ta.workDate <= :endDate) " +
           "AND (:employeeId IS NULL OR ta.employeeId = :employeeId) " +
           "AND (:status IS NULL OR ta.status = :status) " +
           "ORDER BY ta.workDate DESC, ta.checkInTime DESC")
    Page<TimeAttendance> searchAttendance(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("employeeId") Long employeeId,
            @Param("status") AttendanceStatus status,
            Pageable pageable
    );
}
