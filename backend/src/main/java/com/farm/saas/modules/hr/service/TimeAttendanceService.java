package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.AdjustAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.CheckInAttendanceRequest;
import com.farm.saas.modules.hr.dto.request.CheckOutAttendanceRequest;
import com.farm.saas.modules.hr.dto.response.CheckInAttendanceResponse;
import com.farm.saas.modules.hr.dto.response.TimeAttendanceDetailResponse;

import java.time.LocalDate;
import java.util.List;

public interface TimeAttendanceService {
    CheckInAttendanceResponse checkIn(CheckInAttendanceRequest request);
    TimeAttendanceDetailResponse checkOut(CheckOutAttendanceRequest request);
    TimeAttendanceDetailResponse adjustAttendance(Long id, AdjustAttendanceRequest request);
    List<TimeAttendanceDetailResponse> getAttendances(Long farmId, LocalDate workDate);
    TimeAttendanceDetailResponse getAttendanceById(Long id);
    com.farm.saas.modules.hr.dto.response.BatchRollCallResponse batchRollCall(com.farm.saas.modules.hr.dto.request.BatchRollCallRequest request);
}
