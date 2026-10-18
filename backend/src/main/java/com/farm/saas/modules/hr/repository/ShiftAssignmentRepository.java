package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long>, JpaSpecificationExecutor<ShiftAssignment> {
    java.util.Optional<ShiftAssignment> findByEmployeeIdAndWorkDateAndShiftId(Long employeeId, java.time.LocalDate workDate, Long shiftId);
    java.util.List<ShiftAssignment> findByEmployeeIdAndWorkDate(Long employeeId, java.time.LocalDate workDate);
    java.util.List<ShiftAssignment> findByFarmIdAndWorkDate(Long farmId, java.time.LocalDate workDate);
}
