package com.farmsaas.modules.hr.service;

import com.farmsaas.modules.hr.dto.*;
import com.farmsaas.modules.hr.entity.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface LeaveOvertimeService {

    LeaveResponse createLeaveRequest(Long farmId, LeaveRequestDto request);

    LeaveResponse approveOrRejectLeave(Long farmId, Long leaveId, ApproveRejectRequest request);

    Page<LeaveResponse> searchLeaves(Long farmId, Long employeeId, RequestStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    OvertimeResponse createOvertimeRequest(Long farmId, OvertimeRequestDto request);

    OvertimeResponse approveOrRejectOvertime(Long farmId, Long overtimeId, ApproveRejectRequest request);

    Page<OvertimeResponse> searchOvertime(Long farmId, Long employeeId, RequestStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable);
}
