package com.farmsaas.modules.farm.service;

import com.farmsaas.common.exception.BusinessException;
import com.farmsaas.common.exception.EntityNotFoundException;
import com.farmsaas.modules.farm.dto.AssignmentResponse;
import com.farmsaas.modules.farm.dto.CreateAssignmentRequest;
import com.farmsaas.modules.farm.entity.FarmAssignment;
import com.farmsaas.modules.farm.repository.FarmAssignmentRepository;
import com.farmsaas.modules.farm.repository.FarmRepository;
import com.farmsaas.modules.user.entity.User;
import com.farmsaas.modules.user.entity.UserFarmAccess;
import com.farmsaas.modules.user.repository.UserFarmAccessRepository;
import com.farmsaas.modules.user.repository.UserRepository;
import com.farmsaas.security.util.SecurityUtils;
import com.farmsaas.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmAssignmentServiceImpl implements FarmAssignmentService {

    private final FarmAssignmentRepository farmAssignmentRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final UserFarmAccessRepository userFarmAccessRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsByFarmId(Long farmId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        List<FarmAssignment> assignments = farmAssignmentRepository.findByFarmIdAndTenantId(farmId, tenantId);
        return assignments.stream()
                .map(AssignmentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public AssignmentResponse createAssignment(Long farmId, CreateAssignmentRequest request) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        User user = userRepository.findByIdAndTenantId(request.getUserId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Nhân viên", request.getUserId()));

        FarmAssignment assignment = FarmAssignment.builder()
                .farmId(farmId)
                .userId(request.getUserId())
                .roleInFarm(request.getRoleInFarm())
                .assignedFrom(request.getAssignedFrom())
                .assignedTo(request.getAssignedTo())
                .isActive(true)
                .user(user)
                .build();
        assignment.setTenantId(tenantId);

        FarmAssignment saved = farmAssignmentRepository.save(assignment);

        // Đảm bảo có user_farm_access tương ứng
        if (!userFarmAccessRepository.existsByUserIdAndFarmId(request.getUserId(), farmId)) {
            UserFarmAccess access = new UserFarmAccess();
            access.setUserId(request.getUserId());
            access.setFarmId(farmId);
            access.setTenantId(tenantId);
            access.setGrantedBy(SecurityUtils.getCurrentUserId() != null ? String.valueOf(SecurityUtils.getCurrentUserId()) : "ADMIN");
            userFarmAccessRepository.save(access);
        }

        log.info("Assigned user {} to farm {} with role {}", user.getFullName(), farmId, request.getRoleInFarm());
        return AssignmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void revokeAssignment(Long farmId, Long assignmentId) {
        Long tenantId = getRequiredTenantId();
        verifyFarmExists(farmId, tenantId);

        FarmAssignment assignment = farmAssignmentRepository.findByIdAndFarmIdAndTenantId(assignmentId, farmId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Phân công nhân sự", assignmentId));

        assignment.setIsActive(false);
        assignment.setAssignedTo(LocalDate.now());
        farmAssignmentRepository.save(assignment);

        log.info("Revoked assignment ID: {} for farm: {}", assignmentId, farmId);
    }

    private void verifyFarmExists(Long farmId, Long tenantId) {
        if (!farmRepository.existsById(farmId)) {
            throw new EntityNotFoundException("Trang trại", farmId);
        }
    }

    private Long getRequiredTenantId() {
        return TenantContextHolder.getRequiredTenantId();
    }
}
