package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.ShiftAssignmentRequest;
import com.farmsaas.modules.hr.dto.ShiftAssignmentResponse;

import java.time.LocalDate;
import java.util.List;

public interface ShiftAssignmentService {

    List<ShiftAssignmentResponse> getRosterSchedule(Long farmId, LocalDate startDate, LocalDate endDate, Long employeeId, Long shiftId);

    ShiftAssignmentResponse assignShift(Long farmId, ShiftAssignmentRequest request);

    List<ShiftAssignmentResponse> batchAssignShifts(Long farmId, ShiftAssignmentRequest request);

    void cancelOrDeleteAssignment(Long farmId, Long id);
}
