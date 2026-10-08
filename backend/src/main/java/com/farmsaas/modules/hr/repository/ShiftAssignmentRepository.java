package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.ShiftAssignment;
import com.farmsaas.modules.hr.entity.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {

    List<ShiftAssignment> findByTenantIdAndFarmIdAndAssignedDate(Long tenantId, Long farmId, LocalDate assignedDate);

    List<ShiftAssignment> findByTenantIdAndFarmIdAndAssignedDateBetween(Long tenantId, Long farmId, LocalDate startDate, LocalDate endDate);

    List<ShiftAssignment> findByTenantIdAndFarmIdAndEmployeeIdAndAssignedDateBetween(
            Long tenantId, Long farmId, Long employeeId, LocalDate startDate, LocalDate endDate);

    Optional<ShiftAssignment> findByTenantIdAndFarmIdAndEmployeeIdAndAssignedDate(
            Long tenantId, Long farmId, Long employeeId, LocalDate assignedDate);

    Optional<ShiftAssignment> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    @Query("SELECT sa FROM ShiftAssignment sa JOIN FETCH sa.employee JOIN FETCH sa.shift " +
           "WHERE sa.tenantId = :tenantId AND sa.farmId = :farmId " +
           "AND sa.assignedDate BETWEEN :startDate AND :endDate " +
           "AND (:employeeId IS NULL OR sa.employeeId = :employeeId) " +
           "AND (:shiftId IS NULL OR sa.shiftId = :shiftId) " +
           "ORDER BY sa.assignedDate ASC, sa.employeeId ASC")
    List<ShiftAssignment> findRosterSchedule(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("employeeId") Long employeeId,
            @Param("shiftId") Long shiftId
    );
}
