package com.farm.saas.modules.hr.service;

import com.farm.saas.modules.hr.dto.request.ApproveLeaveRequest;
import com.farm.saas.modules.hr.dto.request.ApproveOvertimeRequest;
import com.farm.saas.modules.hr.dto.request.CreateLeaveRequest;
import com.farm.saas.modules.hr.dto.request.CreateOvertimeRequest;
import com.farm.saas.modules.hr.dto.response.LeaveRequestDetailResponse;
import com.farm.saas.modules.hr.dto.response.OvertimeRequestDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LeaveOvertimeService {
    LeaveRequestDetailResponse createLeaveRequest(CreateLeaveRequest request);
    LeaveRequestDetailResponse approveLeaveRequest(Long id, ApproveLeaveRequest request);
    Page<LeaveRequestDetailResponse> getLeaveRequests(Long farmId, Pageable pageable);
    LeaveRequestDetailResponse getLeaveRequestById(Long id);

    OvertimeRequestDetailResponse createOvertimeRequest(CreateOvertimeRequest request);
    OvertimeRequestDetailResponse approveOvertimeRequest(Long id, ApproveOvertimeRequest request);
    Page<OvertimeRequestDetailResponse> getOvertimeRequests(Long farmId, Pageable pageable);
    OvertimeRequestDetailResponse getOvertimeRequestById(Long id);
}
