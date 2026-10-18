package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.TimeAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TimeAttendanceRepository extends JpaRepository<TimeAttendance, Long>, JpaSpecificationExecutor<TimeAttendance> {
    java.util.Optional<TimeAttendance> findByEmployeeIdAndWorkDateAndShiftId(Long employeeId, java.time.LocalDate workDate, Long shiftId);
    java.util.Optional<TimeAttendance> findTopByEmployeeIdAndWorkDateOrderByCheckInTimeDesc(Long employeeId, java.time.LocalDate workDate);
    java.util.List<TimeAttendance> findByFarmIdAndWorkDate(Long farmId, java.time.LocalDate workDate);
    java.util.List<TimeAttendance> findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(Long employeeId, java.time.LocalDate fromDate, java.time.LocalDate toDate);
}
