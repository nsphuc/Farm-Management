package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.AssignShiftRequest;
import com.farm.saas.modules.hr.dto.response.ShiftAssignmentResponse;

import java.time.LocalDate;
import java.util.List;

public interface ShiftAssignmentService {
    ShiftAssignmentResponse assignShift(AssignShiftRequest request);
    List<ShiftAssignmentResponse> getAssignmentsByFarmAndDate(Long farmId, LocalDate workDate);
    List<ShiftAssignmentResponse> getAssignmentsByEmployeeAndDate(Long employeeId, LocalDate workDate);
}
