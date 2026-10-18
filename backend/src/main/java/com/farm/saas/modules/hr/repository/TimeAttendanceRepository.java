package com.farm.saas.modules.hr.repository;

import com.farm.saas.modules.hr.entity.TimeAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TimeAttendanceRepository extends JpaRepository<TimeAttendance, Long>, JpaSpecificationExecutor<TimeAttendance> {
}
