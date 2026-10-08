package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.WorkShiftRequest;
import com.farmsaas.modules.hr.dto.WorkShiftResponse;

import java.util.List;

public interface WorkShiftService {

    WorkShiftResponse createShift(Long farmId, WorkShiftRequest request);

    WorkShiftResponse updateShift(Long farmId, Long id, WorkShiftRequest request);

    WorkShiftResponse getShiftById(Long farmId, Long id);

    List<WorkShiftResponse> getAllShifts(Long farmId, Boolean activeOnly);

    void deleteShift(Long farmId, Long id);
}
