package com.farmsaas.modules.hr.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.hr.dto.WorkShiftRequest;
import com.farmsaas.modules.hr.dto.WorkShiftResponse;
import com.farmsaas.modules.hr.entity.WorkShift;
import com.farmsaas.modules.hr.entity.enums.ShiftStatus;
import com.farmsaas.modules.hr.repository.WorkShiftRepository;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkShiftServiceImpl implements WorkShiftService {

    private final WorkShiftRepository workShiftRepository;
    private final FarmRepository farmRepository;

    @Override
    @Transactional
    public WorkShiftResponse createShift(Long farmId, WorkShiftRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        String shiftCode = request.getShiftCode().trim().toUpperCase();
        if (workShiftRepository.existsByTenantIdAndFarmIdAndShiftCode(tenantId, farmId, shiftCode)) {
            throw new BusinessException("Mã ca làm việc '" + shiftCode + "' đã tồn tại trong trang trại.");
        }

        WorkShift shift = WorkShift.builder()
                .farmId(farmId)
                .shiftCode(shiftCode)
                .shiftName(request.getShiftName().trim())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakMinutes(request.getBreakMinutes() != null ? request.getBreakMinutes() : 60)
                .workingHours(request.getWorkingHours() != null ? request.getWorkingHours() : new BigDecimal("8.00"))
                .lateGraceMinutes(request.getLateGraceMinutes() != null ? request.getLateGraceMinutes() : 15)
                .earlyLeaveGraceMinutes(request.getEarlyLeaveGraceMinutes() != null ? request.getEarlyLeaveGraceMinutes() : 15)
                .status(request.getStatus() != null ? request.getStatus() : ShiftStatus.ACTIVE)
                .isOvernight(request.getIsOvernight() != null ? request.getIsOvernight() : false)
                .build();
        shift.setTenantId(tenantId);

        WorkShift saved = workShiftRepository.save(shift);
        log.info("Created work shift: {} with ID: {} for Farm ID: {}", saved.getShiftCode(), saved.getId(), farmId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public WorkShiftResponse updateShift(Long farmId, Long id, WorkShiftRequest request) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        WorkShift shift = workShiftRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ca làm việc ID: " + id));

        String shiftCode = request.getShiftCode().trim().toUpperCase();
        if (!shift.getShiftCode().equalsIgnoreCase(shiftCode)
                && workShiftRepository.existsByTenantIdAndFarmIdAndShiftCode(tenantId, farmId, shiftCode)) {
            throw new BusinessException("Mã ca làm việc '" + shiftCode + "' đã tồn tại trong trang trại.");
        }

        shift.setShiftCode(shiftCode);
        shift.setShiftName(request.getShiftName().trim());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        if (request.getBreakMinutes() != null) shift.setBreakMinutes(request.getBreakMinutes());
        if (request.getWorkingHours() != null) shift.setWorkingHours(request.getWorkingHours());
        if (request.getLateGraceMinutes() != null) shift.setLateGraceMinutes(request.getLateGraceMinutes());
        if (request.getEarlyLeaveGraceMinutes() != null) shift.setEarlyLeaveGraceMinutes(request.getEarlyLeaveGraceMinutes());
        if (request.getStatus() != null) shift.setStatus(request.getStatus());
        if (request.getIsOvernight() != null) shift.setIsOvernight(request.getIsOvernight());

        WorkShift updated = workShiftRepository.save(shift);
        log.info("Updated work shift ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkShiftResponse getShiftById(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        WorkShift shift = workShiftRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ca làm việc ID: " + id));
        return mapToResponse(shift);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkShiftResponse> getAllShifts(Long farmId, Boolean activeOnly) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        List<WorkShift> list = (activeOnly != null && activeOnly)
                ? workShiftRepository.findByTenantIdAndFarmIdAndStatus(tenantId, farmId, ShiftStatus.ACTIVE)
                : workShiftRepository.findByTenantIdAndFarmId(tenantId, farmId);

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteShift(Long farmId, Long id) {
        Long tenantId = getRequiredTenantId();
        validateFarmAccess(tenantId, farmId);

        WorkShift shift = workShiftRepository.findByIdAndTenantIdAndFarmId(id, tenantId, farmId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ca làm việc ID: " + id));

        workShiftRepository.delete(shift);
        log.info("Deleted work shift ID: {} from Farm ID: {}", id, farmId);
    }

    private WorkShiftResponse mapToResponse(WorkShift s) {
        return WorkShiftResponse.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .farmId(s.getFarmId())
                .shiftCode(s.getShiftCode())
                .shiftName(s.getShiftName())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .breakMinutes(s.getBreakMinutes())
                .workingHours(s.getWorkingHours())
                .lateGraceMinutes(s.getLateGraceMinutes())
                .earlyLeaveGraceMinutes(s.getEarlyLeaveGraceMinutes())
                .status(s.getStatus())
                .isOvernight(s.getIsOvernight())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private void validateFarmAccess(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw new EntityNotFoundException("Không tìm thấy trang trại ID: " + farmId + " trong tổ chức.");
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
